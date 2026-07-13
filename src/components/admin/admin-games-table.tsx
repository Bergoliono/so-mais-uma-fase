"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GameRecord } from "@/lib/game-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type AdminGamesTableProps = {
  initialGames: GameRecord[];
  requiresAuthFetch?: boolean;
};

export function AdminGamesTable({ initialGames, requiresAuthFetch = false }: AdminGamesTableProps) {
  const [games, setGames] = useState(initialGames);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!requiresAuthFetch) return;

    let active = true;
    async function loadGames() {
      setMessage("Carregando jogos com acesso admin...");
      const token = await getAccessToken();
      if (!token) {
        if (active) setMessage("Entre com um e-mail liberado em ADMIN_EMAILS para carregar dados reais.");
        return;
      }

      const response = await fetch("/api/admin/games", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();
      if (!active) return;

      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "Não foi possível carregar os jogos.");
        return;
      }

      setGames(payload.games);
      setMessage(payload.mode === "mock" ? "Modo mock ativo." : null);
    }

    loadGames();
    return () => {
      active = false;
    };
  }, [requiresAuthFetch]);

  const externalGames = useMemo(() => games.filter((game) => game.type === "external"), [games]);

  async function patchGame(id: string, patch: Partial<Pick<GameRecord, "status" | "featured" | "daily_challenge">>) {
    setBusyId(id);
    setMessage(null);

    const token = await getAccessToken();
    const response = await fetch(`/api/admin/games/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(patch)
    });
    const payload = await response.json();
    setBusyId(null);

    if (!response.ok || !payload.ok) {
      setMessage(payload.error ?? "Não foi possível atualizar o jogo.");
      return;
    }

    setGames((current) => current.map((game) => (game.id === id ? payload.game : game)));
    setMessage(payload.mode === "mock" ? "Alteração simulada no modo mock." : "Jogo atualizado.");
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-ink">Jogos externos</h2>
          <p className="text-sm font-bold text-muted">{externalGames.length} jogos preparados para catálogo por iframe.</p>
        </div>
        <Link href="/admin/jogos/novo" className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-black text-white">
          Cadastrar jogo
        </Link>
      </div>

      {message && <p className="mb-4 rounded-lg border border-teal-500/20 bg-teal-500/10 p-3 text-sm font-bold text-teal-800">{message}</p>}

      <div className="grid gap-3">
        {externalGames.map((game) => (
          <article key={game.id} className="rounded-lg border border-line bg-zinc-50 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-black text-ink">{game.title}</h3>
                  <Badge>{game.status === "published" ? "publicado" : "rascunho"}</Badge>
                  <Badge>sem ranking</Badge>
                  {game.featured && <Badge tone="teal">destaque</Badge>}
                  {game.daily_challenge && <Badge tone="blue">jogo do dia</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-bold text-muted">{game.short_description}</p>
                <p className="mt-1 truncate text-xs font-bold text-zinc-500">{game.slug}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <Link href={`/admin/jogos/${game.id}`} className="rounded-full border border-line bg-white px-3 py-2 text-center text-xs font-black text-ink">
                  Editar
                </Link>
                <button
                  type="button"
                  disabled={busyId === game.id}
                  onClick={() => patchGame(game.id, { status: game.status === "published" ? "draft" : "published" })}
                  className="rounded-full border border-line bg-white px-3 py-2 text-xs font-black text-ink disabled:opacity-50"
                >
                  {game.status === "published" ? "Despublicar" : "Publicar"}
                </button>
                <button
                  type="button"
                  disabled={busyId === game.id}
                  onClick={() => patchGame(game.id, { featured: !game.featured })}
                  className="rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-2 text-xs font-black text-teal-700 disabled:opacity-50"
                >
                  {game.featured ? "Tirar destaque" : "Destaque"}
                </button>
                <button
                  type="button"
                  disabled={busyId === game.id}
                  onClick={() => patchGame(game.id, { daily_challenge: !game.daily_challenge })}
                  className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-700 disabled:opacity-50"
                >
                  {game.daily_challenge ? "Remover do dia" : "Jogo do dia"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Badge({ children, tone = "gray" }: { children: string; tone?: "gray" | "teal" | "blue" }) {
  const classes = {
    gray: "border-zinc-300 bg-white text-zinc-700",
    teal: "border-teal-500/25 bg-teal-500/10 text-teal-700",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-700"
  };

  return <span className={`rounded-full border px-2 py-1 text-[11px] font-black ${classes[tone]}`}>{children}</span>;
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
