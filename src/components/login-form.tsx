"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { EnvelopeSimple, Lock, Sparkle } from "@phosphor-icons/react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type LoginMode = "magic" | "password";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<LoginMode>("magic");
  const [status, setStatus] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user?.email ?? null));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setStatus("Supabase ainda não está configurado. O login está em modo demonstração.");
      setLoading(false);
      return;
    }

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/perfil`
        }
      });

      setStatus(error ? error.message : "Link mágico enviado. Confira seu e-mail para entrar.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("Não foi possível entrar com e-mail e senha. Confira os dados ou use o link mágico.");
    } else {
      setStatus("Login realizado. Você já pode ir para o perfil.");
      setCurrentUser(email);
    }
    setLoading(false);
  }

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase?.auth.signOut();
    setCurrentUser(null);
    setStatus("Você saiu da conta.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-paper px-5 py-7">
      <Link href="/" className="text-sm font-black text-teal-700">
        Voltar ao início
      </Link>
      <section className="mt-8 rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700">
          <Sparkle size={28} weight="fill" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Entrar</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Use link mágico para começar rápido. Se a senha estiver habilitada no Supabase, ela também funciona aqui.
        </p>

        {currentUser && (
          <div className="mt-4 rounded-lg border border-teal-500/25 bg-teal-500/10 p-3 text-sm font-bold text-teal-800">
            Você está logado como {currentUser}.{" "}
            <Link href="/perfil" className="underline">
              Abrir perfil
            </Link>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg border border-line text-sm font-black">
          <button
            type="button"
            onClick={() => setMode("magic")}
            className={`h-11 ${mode === "magic" ? "bg-teal-500/10 text-teal-700" : "bg-white text-zinc-700"}`}
          >
            Link mágico
          </button>
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`h-11 border-l border-line ${mode === "password" ? "bg-teal-500/10 text-teal-700" : "bg-white text-zinc-700"}`}
          >
            Senha
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-muted">E-mail</span>
            <div className="mt-2 flex h-12 items-center gap-2 rounded-lg border border-line bg-paper px-3">
              <EnvelopeSimple size={20} weight="bold" className="text-teal-700" />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
              />
            </div>
          </label>
          {mode === "password" && (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-muted">Senha</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-lg border border-line bg-paper px-3">
                <Lock size={20} weight="bold" className="text-teal-700" />
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="mínimo 6 caracteres"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
                />
              </div>
            </label>
          )}
          <button
            disabled={loading}
            className="h-12 w-full rounded-lg bg-action text-sm font-black text-white shadow-soft disabled:opacity-60"
          >
            {loading ? "Enviando..." : mode === "magic" ? "Receber link mágico" : "Entrar com senha"}
          </button>
        </form>

        {currentUser && (
          <button onClick={signOut} className="mt-3 h-11 w-full rounded-lg border border-line text-sm font-black text-ink">
            Sair
          </button>
        )}

        {status && <p className="mt-4 rounded-lg bg-teal-500/10 p-3 text-sm font-bold text-teal-800">{status}</p>}
      </section>
    </main>
  );
}
