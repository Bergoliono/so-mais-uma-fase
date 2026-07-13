"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type SyncGame = {
  title: string;
  slug: string;
  short_description: string;
  iframe_url: string;
  thumbnail_url: string;
  tags: string[];
  status: "draft" | "published";
};

export function AdminGameDistributionSync() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [limit, setLimit] = useState(25);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [games, setGames] = useState<SyncGame[]>([]);
  const [failed, setFailed] = useState<{ title: string; error: string }[]>([]);

  async function sync(dryRun: boolean) {
    setBusy(true);
    setMessage(null);
    setFailed([]);

    const token = await getAccessToken();
    const response = await fetch("/api/admin/gamedistribution/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        source_url: sourceUrl,
        status,
        limit,
        dry_run: dryRun
      })
    });

    const payload = await response.json();
    setBusy(false);

    if (!response.ok || !payload.ok) {
      setMessage(payload.error ?? "Não foi possível sincronizar.");
      setGames([]);
      return;
    }

    setGames(payload.games ?? payload.imported ?? []);
    setFailed(payload.failed ?? []);
    setMessage(
      dryRun
        ? `${payload.summary.ready} jogos prontos para importar. ${payload.summary.failed} com erro.`
        : `${payload.summary.imported} jogos importados. ${payload.summary.failed} com erro.`
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_.95fr]">
      <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-ink">Sincronizar GameDistribution</h2>
        <p className="mt-1 text-sm font-bold leading-6 text-muted">
          Informe a URL do feed/API do publisher. A sincronização normaliza os dados para jogos externos sem ranking.
        </p>

        <div className="mt-4 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-900">
          Não use esta tela para jogos próprios. Tudo que entrar por aqui será tratado como iframe externo e `ranked=false`.
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
            <span>source_url</span>
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              className="admin-input"
              placeholder="https://... feed JSON/XML da GameDistribution"
            />
            <span className="text-xs font-bold normal-case tracking-normal text-muted">
              Se vazio, a API usa `GAMEDISTRIBUTION_FEED_URL` do ambiente.
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
              <span>status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")} className="admin-input">
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>

            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
              <span>limit</span>
              <input
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="admin-input"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => sync(true)}
            className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-black text-ink disabled:opacity-50"
          >
            Pré-visualizar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => sync(false)}
            className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-black text-white disabled:opacity-50"
          >
            Sincronizar catálogo
          </button>
        </div>

        {message && <p className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm font-bold text-blue-800">{message}</p>}
      </div>

      <aside className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <h3 className="text-lg font-black text-ink">Resultado</h3>
        <p className="mt-1 text-sm font-bold text-muted">{games.length} jogos normalizados.</p>

        {failed.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-700">
            {failed.slice(0, 5).map((item, index) => (
              <p key={`${item.title}-${index}`}>{item.title || `Item ${index + 1}`}: {item.error}</p>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3">
          {games.slice(0, 12).map((game) => (
            <article key={game.slug} className="rounded-lg border border-line bg-zinc-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-ink">{game.title}</h4>
                <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] font-black text-zinc-700">sem ranking</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-muted">{game.short_description}</p>
              <p className="mt-1 truncate text-[11px] font-bold text-zinc-500">{game.iframe_url}</p>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
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
