"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CategoryRecord, GameRecord } from "@/lib/game-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type AdminGameFormProps = {
  categories: CategoryRecord[];
  initialGame?: GameRecord | null;
  gameId?: string;
};

type FormState = {
  title: string;
  slug: string;
  short_description: string;
  seo_description: string;
  instructions: string;
  category_id: string;
  iframe_url: string;
  thumbnail_url: string;
  tags: string;
  status: "draft" | "published";
  featured: boolean;
  daily_challenge: boolean;
};

export function AdminGameForm({ categories, initialGame = null, gameId }: AdminGameFormProps) {
  const router = useRouter();
  const [loadedGame, setLoadedGame] = useState(initialGame);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const firstCategoryId = categories[0]?.id ?? "";

  useEffect(() => {
    if (initialGame || !gameId) return;

    let active = true;
    async function loadGame() {
      setMessage("Carregando jogo...");
      const token = await getAccessToken();
      if (hasSupabaseConfig && !token) {
        if (active) setMessage("Entre com um e-mail liberado em ADMIN_EMAILS para editar dados reais.");
        return;
      }

      const response = await fetch(`/api/admin/games/${gameId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const payload = await response.json();
      if (!active) return;

      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "Não foi possível carregar o jogo.");
        return;
      }

      setLoadedGame(payload.game);
      setMessage(null);
    }

    loadGame();
    return () => {
      active = false;
    };
  }, [gameId, initialGame]);

  const initialState = useMemo<FormState>(() => toFormState(loadedGame, firstCategoryId), [loadedGame, firstCategoryId]);
  const [form, setForm] = useState<FormState>(initialState);
  const iframeError = validateUrl(form.iframe_url, true);
  const thumbnailError = validateThumbnailUrl(form.thumbnail_url);
  const canPreviewIframe = Boolean(form.iframe_url && !iframeError);

  useEffect(() => {
    setForm(initialState);
  }, [initialState]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value === "published" ? "published" : submitter?.value === "draft" ? "draft" : form.status;

    if (iframeError || thumbnailError) {
      setMessage(iframeError ?? thumbnailError);
      return;
    }

    setSaving(true);
    const token = await getAccessToken();
    const endpoint = loadedGame ? `/api/admin/games/${loadedGame.id}` : "/api/admin/games";
    const response = await fetch(endpoint, {
      method: loadedGame ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        ...form,
        status,
        slug: form.slug || slugify(form.title),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      })
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok || !payload.ok) {
      setMessage(payload.error ?? "Não foi possível salvar o jogo.");
      return;
    }

    setLoadedGame(payload.game);
    setMessage(payload.mode === "mock" ? "Jogo salvo em modo mock para visualização." : "Jogo salvo.");
    if (!loadedGame) router.replace(`/admin/jogos/${payload.game.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-ink">{loadedGame ? "Editar jogo externo" : "Cadastrar jogo externo"}</h2>
          <p className="mt-1 text-sm font-bold text-muted">Todo jogo externo fica automaticamente sem ranking oficial.</p>
        </div>
        <span className="w-fit rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700">sem ranking</span>
      </div>

      <div className="mb-4 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-900">
        Jogos externos nunca terão ranking, medalhas ou pontuação oficial. O iframe serve apenas para catálogo e descoberta.
      </div>

      {message && <p className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm font-bold text-blue-800">{message}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="title" required>
          <input
            value={form.title}
            onChange={(event) => {
              updateField("title", event.target.value);
              if (!loadedGame) updateField("slug", slugify(event.target.value));
            }}
            className="admin-input"
            required
          />
        </Field>

        <Field label="slug" required>
          <input value={form.slug} onChange={(event) => updateField("slug", slugify(event.target.value))} className="admin-input" required />
        </Field>

        <Field label="short_description" required>
          <input value={form.short_description} onChange={(event) => updateField("short_description", event.target.value)} className="admin-input" required />
        </Field>

        <Field label="category" required>
          <select value={form.category_id} onChange={(event) => updateField("category_id", event.target.value)} className="admin-input">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="iframe_url" required>
          <input
            value={form.iframe_url}
            onChange={(event) => updateField("iframe_url", event.target.value)}
            className={`admin-input ${iframeError ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : form.iframe_url ? "border-teal-500" : ""}`}
            required
          />
          {form.iframe_url && (
            <span className={`text-xs font-bold normal-case tracking-normal ${iframeError ? "text-red-600" : "text-teal-700"}`}>
              {iframeError ?? "URL válida para preview."}
            </span>
          )}
        </Field>

        <Field label="thumbnail_url">
          <input
            value={form.thumbnail_url}
            onChange={(event) => updateField("thumbnail_url", event.target.value)}
            className={`admin-input ${thumbnailError ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : form.thumbnail_url ? "border-teal-500" : ""}`}
          />
          {form.thumbnail_url && (
            <span className={`text-xs font-bold normal-case tracking-normal ${thumbnailError ? "text-red-600" : "text-teal-700"}`}>
              {thumbnailError ?? "URL válida."}
            </span>
          )}
        </Field>

        <Field label="tags">
          <input value={form.tags} onChange={(event) => updateField("tags", event.target.value)} className="admin-input" placeholder="lógica, rápido, novo" />
        </Field>

        <Field label="status">
          <select value={form.status} onChange={(event) => updateField("status", event.target.value as FormState["status"])} className="admin-input">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </Field>
      </div>

      <div className="mt-4 grid gap-4">
        <Field label="seo_description" required>
          <textarea value={form.seo_description} onChange={(event) => updateField("seo_description", event.target.value)} className="admin-textarea" required />
        </Field>

        <Field label="instructions" required>
          <textarea value={form.instructions} onChange={(event) => updateField("instructions", event.target.value)} className="admin-textarea" />
        </Field>
      </div>

      <section className="mt-5 rounded-lg border border-line bg-zinc-50 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-ink">Preview do iframe</h3>
          <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] font-black text-zinc-700">sem ranking</span>
        </div>
        {canPreviewIframe ? (
          <iframe src={form.iframe_url} title="Preview do iframe" className="h-64 w-full rounded-lg border border-line bg-white" loading="lazy" />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-line bg-white p-4 text-center text-sm font-bold text-muted">
            Informe uma iframe_url válida para ver o preview.
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-3 rounded-lg border border-line bg-zinc-50 p-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 text-sm font-black text-ink">
          <input type="checkbox" checked={form.featured} onChange={(event) => updateField("featured", event.target.checked)} className="h-5 w-5 accent-teal-600" />
          featured
        </label>
        <label className="flex items-center gap-3 text-sm font-black text-ink">
          <input
            type="checkbox"
            checked={form.daily_challenge}
            onChange={(event) => updateField("daily_challenge", event.target.checked)}
            className="h-5 w-5 accent-blue-600"
          />
          daily_challenge
        </label>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin/jogos" className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-black text-ink">
          Cancelar
        </Link>
        <button
          type="submit"
          name="status"
          value="draft"
          disabled={saving}
          className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-black text-ink disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar rascunho"}
        </button>
        <button
          type="submit"
          name="status"
          value="published"
          disabled={saving}
          className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-black text-white disabled:opacity-50"
        >
          {saving ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
      <span>{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
    </label>
  );
}

function toFormState(game: GameRecord | null, firstCategoryId: string): FormState {
  return {
    title: game?.title ?? "",
    slug: game?.slug ?? "",
    short_description: game?.short_description ?? "",
    seo_description: game?.seo_description ?? "",
    instructions: game?.instructions ?? "",
    category_id: game?.category_id ?? firstCategoryId,
    iframe_url: game?.iframe_url ?? "",
    thumbnail_url: game?.thumbnail_url ?? "",
    tags: game?.tags?.filter((tag) => tag !== "sem ranking").join(", ") ?? "",
    status: game?.status ?? "draft",
    featured: Boolean(game?.featured),
    daily_challenge: Boolean(game?.daily_challenge)
  };
}

function validateUrl(value: string, required: boolean) {
  if (!value && !required) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return "Use uma URL http(s).";
    if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return "Use HTTPS para iframes fora do ambiente local.";
    return null;
  } catch {
    return "Informe uma URL válida.";
  }
}

function validateThumbnailUrl(value: string) {
  if (!value) return null;
  if (value.startsWith("/images/")) return null;
  return validateUrl(value, false);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
