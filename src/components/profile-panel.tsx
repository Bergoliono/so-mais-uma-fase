"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FloppyDisk, Medal, Play, UserCircle } from "@phosphor-icons/react";
import { mockUserProfile, mockUserScores, type UserProfile, type UserScore } from "@/lib/game-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ProfileMode = "mock" | "guest" | "user";

export function ProfilePanel() {
  const [mode, setMode] = useState<ProfileMode>("mock");
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(mockUserProfile);
  const [scores, setScores] = useState<UserScore[]>(mockUserScores);
  const [username, setUsername] = useState(mockUserProfile.username ?? "");
  const [publicName, setPublicName] = useState(mockUserProfile.public_name ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const bestScore = useMemo(() => scores.reduce((best, score) => Math.max(best, score.score), 0), [scores]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    async function loadProfile() {
      if (!supabase) return;
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setMode("guest");
        setProfile(null);
        setScores([]);
        return;
      }

      setMode("user");
      setUserId(user.id);
      const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      const resolvedProfile = (existingProfile as UserProfile | null) ?? {
        id: user.id,
        email: user.email ?? null,
        username: null,
        public_name: null,
        avatar_url: null
      };

      setProfile(resolvedProfile);
      setUsername(resolvedProfile.username ?? "");
      setPublicName(resolvedProfile.public_name ?? "");

      const { data: userScores } = await supabase
        .from("scores")
        .select("id, game_id, score, level, duration_seconds, metadata, created_at, games(title, slug)")
        .eq("user_id", user.id)
        .eq("valid", true)
        .order("created_at", { ascending: false })
        .limit(8);

      setScores((userScores as UserScore[] | null) ?? []);
    }

    loadProfile();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setSaving(true);

    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!normalizedUsername || normalizedUsername.length < 3) {
      setStatus("Escolha um username com pelo menos 3 caracteres.");
      setSaving(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase || mode === "mock") {
      const nextProfile = {
        ...mockUserProfile,
        username: normalizedUsername,
        public_name: publicName.trim() || normalizedUsername
      };
      setProfile(nextProfile);
      setUsername(nextProfile.username ?? "");
      setPublicName(nextProfile.public_name ?? "");
      setStatus("Perfil salvo em modo demonstração.");
      setSaving(false);
      return;
    }

    if (!userId || !profile) {
      setStatus("Entre novamente para atualizar seu perfil.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email: profile.email,
      username: normalizedUsername,
      public_name: publicName.trim() || normalizedUsername,
      avatar_url: profile.avatar_url,
      updated_at: new Date().toISOString()
    });

    if (error) {
      setStatus(error.message);
      setSaving(false);
      return;
    }

    setProfile({
      ...profile,
      username: normalizedUsername,
      public_name: publicName.trim() || normalizedUsername
    });
    setStatus("Perfil atualizado. Agora suas pontuações podem aparecer no ranking.");
    setSaving(false);
  }

  const displayName = profile?.public_name || profile?.username || (mode === "guest" ? "Visitante" : "Visitante MVP");
  const needsUsername = mode !== "guest" && !profile?.username;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-paper px-5 py-7">
      <Link href="/" className="text-sm font-black text-teal-700">
        Voltar ao início
      </Link>

      <section className="mt-8 rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-white">
            <UserCircle size={42} weight="fill" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-teal-700">perfil</p>
            <h1 className="text-2xl font-black text-ink">{displayName}</h1>
            <p className="text-xs font-bold text-muted">
              {mode === "mock" ? "Modo demonstração" : mode === "guest" ? "Sem login" : "Conta conectada"}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted">
          {mode === "guest"
            ? "Entre para salvar pontuação e aparecer no ranking."
            : needsUsername
              ? "Crie um username público antes de aparecer no ranking."
              : "Seu e-mail não aparece publicamente. O ranking usa apenas username ou apelido."}
        </p>

        {mode === "guest" ? (
          <Link
            href="/login"
            className="mt-5 flex h-12 items-center justify-center rounded-lg bg-action text-sm font-black text-white shadow-soft"
          >
            Entrar para salvar pontuação
          </Link>
        ) : (
          <form onSubmit={saveProfile} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-muted">username público</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="ex: maria_logic"
                className="mt-2 h-12 w-full rounded-lg border border-line bg-paper px-3 text-sm font-bold outline-none focus:border-teal-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-muted">apelido público</span>
              <input
                value={publicName}
                onChange={(event) => setPublicName(event.target.value)}
                placeholder="ex: Maria"
                className="mt-2 h-12 w-full rounded-lg border border-line bg-paper px-3 text-sm font-bold outline-none focus:border-teal-500"
              />
            </label>
            <button
              disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-action text-sm font-black text-white shadow-soft disabled:opacity-60"
            >
              <FloppyDisk size={18} weight="bold" />
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
          </form>
        )}

        {status && <p className="mt-4 rounded-lg bg-teal-500/10 p-3 text-sm font-bold text-teal-800">{status}</p>}
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2">
        {[
          [bestScore.toLocaleString("pt-BR"), "melhor score"],
          [scores.length.toString(), "pontuações"],
          ["0", "medalhas"]
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg border border-line bg-white p-3 text-center shadow-soft">
            <Medal size={22} weight="fill" className="mx-auto text-medal-gold" />
            <p className="mt-1 text-xl font-black text-ink">{value}</p>
            <p className="text-[11px] font-bold text-muted">{label}</p>
          </div>
        ))}
      </section>

      <Link
        href="/jogos/sequencia-logica"
        className="mt-4 flex h-12 items-center justify-center gap-2 rounded-lg bg-zinc-950 text-sm font-black text-white shadow-ranked"
      >
        <Play size={18} weight="fill" />
        Jogar Sequência Lógica
      </Link>

      <section className="mt-5">
        <h2 className="text-xl font-black text-ink">Últimas pontuações</h2>
        <div className="mt-3 space-y-2">
          {scores.length === 0 ? (
            <p className="rounded-lg border border-line bg-white p-4 text-sm font-bold text-muted shadow-soft">
              Nenhuma pontuação salva ainda.
            </p>
          ) : (
            scores.map((score) => (
              <article key={score.id} className="rounded-lg border border-line bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-ink">{score.games?.title ?? "Sequência Lógica"}</p>
                    <p className="text-xs font-bold text-muted">
                      Fase {score.level ?? "-"} • {score.duration_seconds ?? "-"}s
                    </p>
                  </div>
                  <p className="text-lg font-black text-teal-700">{score.score.toLocaleString("pt-BR")}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
