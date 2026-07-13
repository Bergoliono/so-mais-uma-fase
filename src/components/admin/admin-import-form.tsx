"use client";

import { useMemo, useState } from "react";
import type { CategoryRecord } from "@/lib/game-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type AdminImportFormProps = {
  categories: CategoryRecord[];
};

type ImportRow = {
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

const sampleCsv = `title,slug,short_description,seo_description,instructions,category,iframe_url,thumbnail_url,tags,status,featured,daily_challenge
Puzzle Demo,puzzle-demo,Jogo externo de teste,Jogue Puzzle Demo grátis online,Clique em Jogar agora,quebra-cabeca,https://example.com/embed/puzzle-demo,/images/caminhos.png,"quebra-cabeça, rápido",draft,false,false`;

export function AdminImportForm({ categories }: AdminImportFormProps) {
  const [raw, setRaw] = useState(sampleCsv);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const parsed = useMemo(() => parseImport(raw, categories), [raw, categories]);

  async function submit(status: "draft" | "published") {
    setMessage(null);
    if (parsed.errors.length > 0 || parsed.rows.length === 0) {
      setMessage("Corrija os dados antes de importar.");
      return;
    }

    setBusy(true);
    const token = await getAccessToken();
    const response = await fetch("/api/admin/games/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        status,
        games: parsed.rows
      })
    });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Não foi possível importar.");
      return;
    }

    if (payload.failed?.length) {
      setMessage(`${payload.summary.imported} importados, ${payload.summary.failed} com erro. Primeiro erro: ${payload.failed[0].error}`);
      return;
    }

    setMessage(payload.mode === "mock" ? `${payload.summary.imported} jogos simulados no modo mock.` : `${payload.summary.imported} jogos importados.`);
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
      <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="mb-4">
          <h2 className="text-lg font-black text-ink">Importar jogos externos</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-muted">
            Cole CSV com cabeçalho ou JSON array. Todo item importado será tratado como externo e sem ranking oficial.
          </p>
        </div>

        <div className="mb-4 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-900">
          Esta importação não cria jogos oficiais, não habilita ranking e não altera a Sequência Lógica.
        </div>

        <textarea value={raw} onChange={(event) => setRaw(event.target.value)} className="admin-textarea min-h-[360px] font-mono text-xs" />

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => submit("draft")}
            className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-black text-ink disabled:opacity-50"
          >
            Importar como rascunho
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => submit("published")}
            className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-black text-white disabled:opacity-50"
          >
            Importar publicado
          </button>
        </div>

        {message && <p className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm font-bold text-blue-800">{message}</p>}
      </div>

      <aside className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <h3 className="text-lg font-black text-ink">Preview</h3>
        <p className="mt-1 text-sm font-bold text-muted">{parsed.rows.length} jogos válidos para importar.</p>

        {parsed.errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-700">
            {parsed.errors.slice(0, 5).map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3">
          {parsed.rows.slice(0, 12).map((row) => (
            <article key={row.slug} className="rounded-lg border border-line bg-zinc-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-ink">{row.title}</h4>
                <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] font-black text-zinc-700">sem ranking</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-muted">{row.short_description}</p>
              <p className="mt-1 truncate text-[11px] font-bold text-zinc-500">{row.iframe_url}</p>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}

function parseImport(raw: string, categories: CategoryRecord[]) {
  const errors: string[] = [];
  const categoryByKey = new Map<string, string>();
  for (const category of categories) {
    categoryByKey.set(category.id, category.id);
    categoryByKey.set(category.slug.toLowerCase(), category.id);
    categoryByKey.set(category.name.toLowerCase(), category.id);
  }

  let sourceRows: Record<string, unknown>[] = [];
  const trimmed = raw.trim();
  if (!trimmed) return { rows: [], errors: ["Cole CSV ou JSON para importar."] };

  try {
    if (trimmed.startsWith("[")) {
      const json = JSON.parse(trimmed);
      if (!Array.isArray(json)) throw new Error("JSON precisa ser um array.");
      sourceRows = json;
    } else {
      sourceRows = parseCsv(trimmed);
    }
  } catch (error) {
    return { rows: [], errors: [error instanceof Error ? error.message : "Não foi possível ler os dados."] };
  }

  const rows = sourceRows
    .map((row, index) => normalizeRow(row, index, categoryByKey, errors))
    .filter((row): row is ImportRow => Boolean(row));

  return { rows, errors };
}

function normalizeRow(row: Record<string, unknown>, index: number, categoryByKey: Map<string, string>, errors: string[]) {
  const title = text(row.title);
  const slug = slugify(text(row.slug || title));
  const categoryValue = text(row.category_id || row.category).toLowerCase();
  const categoryId = categoryByKey.get(categoryValue);
  const iframeUrl = text(row.iframe_url);

  if (!title) errors.push(`Linha ${index + 1}: title é obrigatório.`);
  if (!slug) errors.push(`Linha ${index + 1}: slug inválido.`);
  if (!text(row.short_description)) errors.push(`Linha ${index + 1}: short_description é obrigatório.`);
  if (!text(row.seo_description)) errors.push(`Linha ${index + 1}: seo_description é obrigatório.`);
  if (!categoryId) errors.push(`Linha ${index + 1}: category não encontrada.`);
  if (!isValidIframeUrl(iframeUrl)) errors.push(`Linha ${index + 1}: iframe_url inválida.`);

  if (!title || !slug || !categoryId || !isValidIframeUrl(iframeUrl)) return null;

  return {
    title,
    slug,
    short_description: text(row.short_description),
    seo_description: text(row.seo_description),
    instructions: text(row.instructions),
    category_id: categoryId,
    iframe_url: iframeUrl,
    thumbnail_url: text(row.thumbnail_url),
    tags: parseTags(row.tags),
    status: text(row.status) === "published" ? "published" : "draft",
    featured: booleanish(row.featured),
    daily_challenge: booleanish(row.daily_challenge)
  };
}

function parseCsv(raw: string) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  return text(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function booleanish(value: unknown) {
  return ["true", "1", "sim", "yes"].includes(text(value).toLowerCase());
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isValidIframeUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return false;
    if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

async function getAccessToken() {
  if (!hasSupabaseConfig) return null;
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return null;
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
