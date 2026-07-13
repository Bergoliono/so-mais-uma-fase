import Link from "next/link";
import type { ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-paper px-4 pb-24 pt-5 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
              Só Mais Uma Fase
            </Link>
            <h1 className="mt-1 text-2xl font-black text-ink">Admin</h1>
            <p className="mt-1 text-sm font-bold text-muted">Cadastro de jogos externos por iframe, sem ranking oficial.</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-black">
            <Link href="/admin" className="rounded-full border border-line bg-white px-4 py-2 text-ink">
              Painel
            </Link>
            <Link href="/admin/jogos" className="rounded-full border border-teal-500/25 bg-teal-500/10 px-4 py-2 text-teal-700">
              Jogos
            </Link>
            <Link href="/admin/gamedistribution" className="rounded-full border border-line bg-white px-4 py-2 text-ink">
              GameDistribution
            </Link>
            <Link href="/admin/jogos/importar" className="rounded-full border border-line bg-white px-4 py-2 text-ink">
              Importar
            </Link>
            <Link href="/admin/jogos/novo" className="rounded-full bg-blue-600 px-4 py-2 text-white">
              Novo jogo
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}
