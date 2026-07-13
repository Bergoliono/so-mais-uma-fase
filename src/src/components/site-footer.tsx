import Link from "next/link";

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`mx-auto w-full max-w-5xl px-5 text-sm md:px-0 ${compact ? "pb-28 pt-6 md:pb-8" : "py-8"}`}>
      <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-ink">Só Mais Uma Fase</p>
            <p className="mt-1 text-xs font-bold leading-5 text-muted">Jogos rápidos para testar seu cérebro. Sem apostas, sorteios ou prêmios em dinheiro.</p>
          </div>
          <nav className="flex flex-wrap gap-3 text-xs font-black text-teal-700">
            <Link href="/sobre">Sobre</Link>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos</Link>
            <Link href="/contato">Contato</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
