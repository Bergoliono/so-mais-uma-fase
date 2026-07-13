import { slugify, validateExternalGameInput, type ExternalGameInput } from "./admin-games";
import { mockCategories } from "./game-data";

type RawGame = Record<string, unknown>;

export type GameDistributionImportOptions = {
  sourceUrl: string;
  status: "draft" | "published";
  limit: number;
};

export type NormalizedGameDistributionGame = ExternalGameInput & {
  provider: "gamedistribution";
  source_id: string | null;
  type: "external";
  ranked: false;
};

export async function fetchGameDistributionGames(options: GameDistributionImportOptions) {
  const response = await fetch(options.sourceUrl, {
    headers: {
      Accept: "application/json, application/rss+xml, application/xml, text/xml, text/plain"
    },
    next: {
      revalidate: 0
    }
  });

  if (!response.ok) {
    throw new Error(`GameDistribution respondeu ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const rawGames = contentType.includes("json") || text.trim().startsWith("{") || text.trim().startsWith("[")
    ? extractJsonGames(JSON.parse(text))
    : extractXmlGames(text);

  return normalizeGameDistributionGames(rawGames.slice(0, options.limit), options.status);
}

export function normalizeGameDistributionGames(rawGames: RawGame[], status: "draft" | "published") {
  const normalized: NormalizedGameDistributionGame[] = [];
  const failed: { index: number; title: string; error: string }[] = [];

  rawGames.forEach((raw, index) => {
    const title = pickText(raw, ["title", "Title", "name", "Name"]);
    const slug = slugify(pickText(raw, ["slug", "Slug"]) || title);
    const description = stripHtml(pickText(raw, ["short_description", "description", "Description", "desc", "Desc"]));
    const seoDescription =
      stripHtml(pickText(raw, ["seo_description", "meta_description", "MetaDescription", "description", "Description"])) ||
      `${title}: jogo grátis online sem ranking oficial.`;
    const category = pickText(raw, ["category", "Category", "genre", "Genre", "categories", "Categories"]);
    const iframeUrl = pickText(raw, ["iframe_url", "embed_url", "embedUrl", "EmbedUrl", "url", "Url", "game_url", "GameUrl"]);
    const thumbnailUrl = pickText(raw, ["thumbnail_url", "thumbnail", "Thumbnail", "thumb", "Thumb", "image", "Image", "asset", "Asset"]);
    const tags = parseTags(pick(raw, ["tags", "Tags", "tag", "Tag", "categories", "Categories"]));

    const parsed = validateExternalGameInput({
      title,
      slug,
      short_description: description,
      seo_description: seoDescription,
      instructions:
        stripHtml(pickText(raw, ["instructions", "Instructions"])) ||
        "Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.",
      category_id: resolveCategoryId(category, tags),
      iframe_url: iframeUrl,
      thumbnail_url: thumbnailUrl,
      tags: Array.from(new Set(["sem ranking", "GameDistribution", ...tags])),
      status,
      featured: false,
      daily_challenge: false
    });

    if (!parsed.ok) {
      failed.push({ index, title, error: parsed.error });
      return;
    }

    normalized.push({
      ...parsed.value,
      provider: "gamedistribution",
      source_id: pickText(raw, ["id", "Id", "gameId", "GameId"]) || null,
      type: "external",
      ranked: false
    });
  });

  return { games: normalized, failed };
}

function extractJsonGames(payload: unknown): RawGame[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  for (const key of ["games", "Games", "items", "Items", "data", "Data", "results", "Results"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }

  return [];
}

function extractXmlGames(xml: string): RawGame[] {
  const itemBlocks = [...xml.matchAll(/<(item|game|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[2]);
  return itemBlocks.map((block) => {
    const row: RawGame = {};
    for (const match of block.matchAll(/<([a-zA-Z0-9:_-]+)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      const key = match[1].split(":").pop() ?? match[1];
      row[key] = decodeXml(stripCdata(match[2]).trim());
    }
    return row;
  });
}

function resolveCategoryId(category: string, tags: string[]) {
  const haystack = [category, ...tags].join(" ").toLowerCase();
  const categoryBySlug = new Map(mockCategories.map((item) => [item.slug, item.id]));

  if (haystack.includes("math") || haystack.includes("matem")) return categoryBySlug.get("matematica") ?? mockCategories[0].id;
  if (haystack.includes("memory") || haystack.includes("mem")) return categoryBySlug.get("memoria") ?? mockCategories[0].id;
  if (haystack.includes("puzzle") || haystack.includes("quebra")) return categoryBySlug.get("quebra-cabeca") ?? mockCategories[0].id;
  if (haystack.includes("relax")) return categoryBySlug.get("relaxantes") ?? mockCategories[0].id;
  if (haystack.includes("quick") || haystack.includes("rápido") || haystack.includes("rapido")) {
    return categoryBySlug.get("jogos-rapidos") ?? mockCategories[0].id;
  }

  return categoryBySlug.get("logica") ?? mockCategories[0].id;
}

function pick(row: RawGame, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function pickText(row: RawGame, keys: string[]) {
  const value = pick(row, keys);
  if (Array.isArray(value)) return value.map(String).join(", ");
  return String(value ?? "").trim();
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  return String(value ?? "")
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function stripCdata(value: string) {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isRecord(value: unknown): value is RawGame {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
