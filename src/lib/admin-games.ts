import { createClient } from "@supabase/supabase-js";
import { adminEmails, hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "./supabase/config";
import { createAdminSupabaseClient } from "./supabase/server";
import { getCategories, mockCategories, mockGames, type GameRecord } from "./game-data";

export type ExternalGameInput = {
  title: string;
  slug: string;
  short_description: string;
  seo_description: string;
  instructions: string;
  category_id: string;
  iframe_url: string;
  thumbnail_url: string;
  tags: string[];
  status: "draft" | "published";
  featured: boolean;
  daily_challenge: boolean;
};

export type AdminAuthResult =
  | { ok: true; mode: "mock" | "supabase"; userEmail: string | null }
  | { ok: false; error: string; status: number };

export function validateIframeUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return false;
    if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function validateThumbnailUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/images/")) return true;
  return validateIframeUrl(value);
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateExternalGameInput(input: Partial<ExternalGameInput>) {
  const title = String(input.title ?? "").trim();
  const slug = slugify(String(input.slug || title));
  const shortDescription = String(input.short_description ?? "").trim();
  const seoDescription = String(input.seo_description ?? "").trim();
  const iframeUrl = String(input.iframe_url ?? "").trim();
  const thumbnailUrl = String(input.thumbnail_url ?? "").trim();

  if (!title) return { ok: false as const, error: "Informe o título." };
  if (!slug) return { ok: false as const, error: "Informe um slug válido." };
  if (!shortDescription) return { ok: false as const, error: "Informe a descrição curta." };
  if (!seoDescription) return { ok: false as const, error: "Informe a descrição SEO." };
  if (!validateIframeUrl(iframeUrl)) return { ok: false as const, error: "Informe uma iframe_url http(s) válida." };
  if (thumbnailUrl && !validateThumbnailUrl(thumbnailUrl)) {
    return { ok: false as const, error: "Informe uma thumbnail_url http(s) válida ou um caminho em /images/." };
  }

  return {
    ok: true as const,
    value: {
      title,
      slug,
      short_description: shortDescription,
      seo_description: seoDescription,
      instructions: String(input.instructions ?? "").trim(),
      category_id: String(input.category_id ?? "") || mockCategories[0].id,
      iframe_url: iframeUrl,
      thumbnail_url: thumbnailUrl,
      tags: Array.isArray(input.tags) ? input.tags.map(String).map((tag) => tag.trim()).filter(Boolean) : [],
      status: input.status === "published" ? "published" as const : "draft" as const,
      featured: Boolean(input.featured),
      daily_challenge: Boolean(input.daily_challenge)
    }
  };
}

export async function assertAdminFromBearer(authorization: string | null): Promise<AdminAuthResult> {
  if (!hasSupabaseConfig) return { ok: true, mode: "mock", userEmail: null };

  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, error: "Entre como admin para continuar.", status: 401 };

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false
    }
  });

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) return { ok: false, error: "Sessão inválida.", status: 401 };
  if (!adminEmails.includes(user.email.toLowerCase())) {
    return { ok: false, error: "Seu e-mail não tem acesso admin.", status: 403 };
  }

  return { ok: true, mode: "supabase", userEmail: user.email };
}

export async function getAdminGames() {
  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) return mockGames;

  const { data, error } = await adminSupabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return mockGames;
  return data as GameRecord[];
}

export async function getAdminGameById(id: string) {
  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) return mockGames.find((game) => game.id === id || game.slug === id) ?? null;

  const { data, error } = await adminSupabase.from("games").select("*").or(`id.eq.${id},slug.eq.${id}`).maybeSingle();
  if (error || !data) return null;
  return data as GameRecord;
}

export async function getAdminCategories() {
  return getCategories();
}

export async function upsertExternalGame(input: ExternalGameInput, id?: string) {
  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) {
    return {
      ok: true,
      mode: "mock" as const,
      game: mockExternalGameFromInput(input, id)
    };
  }

  const payload = {
    title: input.title,
    slug: input.slug,
    short_description: input.short_description,
    seo_description: input.seo_description,
    instructions: input.instructions || null,
    category_id: input.category_id || null,
    type: "external",
    ranked: false,
    iframe_url: input.iframe_url,
    component_key: null,
    thumbnail_url: input.thumbnail_url || null,
    tags: Array.from(new Set([...input.tags, "sem ranking"])),
    status: input.status,
    featured: input.featured,
    daily_challenge: input.daily_challenge,
    updated_at: new Date().toISOString()
  };

  const query = id
    ? adminSupabase.from("games").update(payload).eq("id", id).select("*").single()
    : adminSupabase.from("games").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, mode: "supabase" as const, game: data as GameRecord };
}

export async function patchExternalGame(id: string, patch: Partial<Pick<GameRecord, "status" | "featured" | "daily_challenge">>) {
  const current = await getAdminGameById(id);
  if (!current) return { ok: false as const, error: "Jogo não encontrado." };
  if (current.type !== "external") return { ok: false as const, error: "Ações de admin nesta etapa só alteram jogos externos." };

  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) return { ok: true as const, mode: "mock" as const, game: { ...current, ...patch } };

  const { data, error } = await adminSupabase
    .from("games")
    .update({ ...patch, ranked: false, type: "external", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("type", "external")
    .select("*")
    .single();

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, mode: "supabase" as const, game: data as GameRecord };
}

function mockExternalGameFromInput(input: ExternalGameInput, id?: string): GameRecord {
  return {
    id: id || `mock-external-${input.slug}`,
    title: input.title,
    slug: input.slug,
    short_description: input.short_description,
    seo_description: input.seo_description,
    instructions: input.instructions || null,
    category_id: input.category_id || null,
    type: "external",
    ranked: false,
    iframe_url: input.iframe_url,
    component_key: null,
    thumbnail_url: input.thumbnail_url || null,
    tags: Array.from(new Set([...input.tags, "sem ranking"])),
    status: input.status,
    featured: input.featured,
    daily_challenge: input.daily_challenge,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
