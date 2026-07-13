import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";

export function LegalPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-paper">
      <header className="border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
        <Link href="/" className="text-sm font-black text-teal-700">
          Voltar ao início
        </Link>
      </header>
      <section className="px-5 py-8">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Só Mais Uma Fase</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-ink">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-muted">{description}</p>
        </div>
        <article className="mt-4 grid gap-4 rounded-lg border border-line bg-white p-5 text-sm font-bold leading-7 text-zinc-700 shadow-soft">
          {children}
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-black text-ink">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
