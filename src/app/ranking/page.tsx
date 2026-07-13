import Link from "next/link";
import type { Metadata } from "next";
import { RankingPanel, RankingRows } from "@/components/ranking-panel";
import { getDailyRanking, getMonthlyRanking, getRankedGames, getWeeklyRanking } from "@/lib/game-data";

export const metadata: Metadata = {
  title: "Ranking | Só Mais Uma Fase",
  description: "Ranking oficial dos desafios de cérebro."
};

type RankingPageProps = {
  searchParams: Promise<{
    periodo?: string;
  }>;
};

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const { periodo } = await searchParams;
  const selectedPeriod = periodo === "semana" || periodo === "mes" ? periodo : "dia";
  const games = await getRankedGames();
  const primaryGame = games[0];
  const entries = primaryGame
    ? selectedPeriod === "semana"
      ? await getWeeklyRanking(primaryGame.id)
      : selectedPeriod === "mes"
        ? await getMonthlyRanking(primaryGame.id)
        : await getDailyRanking(primaryGame.id)
    : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-paper px-5 pb-10 pt-7">
      <Link href="/" className="text-sm font-black text-teal-700">
        Voltar ao início
      </Link>
      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-wide text-teal-700">competição oficial</p>
        <h1 className="mt-1 text-[28px] font-black leading-tight tracking-tight text-ink">Ranking</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Apenas jogos próprios entram aqui. E-mail nunca aparece publicamente.
        </p>
      </div>
      <nav className="mt-5 grid grid-cols-3 overflow-hidden rounded-lg border border-line bg-white text-sm font-black shadow-soft">
        {[
          ["dia", "Diário"],
          ["semana", "Semanal"],
          ["mes", "Mensal"]
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/ranking?periodo=${value}`}
            className={`flex h-11 items-center justify-center border-r border-line last:border-r-0 ${
              selectedPeriod === value ? "bg-teal-500/10 text-teal-700 shadow-[inset_0_-3px_0_#14B8A6]" : "text-zinc-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-5">
        <RankingPanel
          entries={entries}
          title={primaryGame ? `${primaryGame.title} · ${periodLabel(selectedPeriod)}` : "Top 3"}
        />
      </div>
      <div className="mt-5">
        <RankingRows entries={entries} />
      </div>
    </main>
  );
}

function periodLabel(period: "dia" | "semana" | "mes") {
  if (period === "semana") return "Semana";
  if (period === "mes") return "Mês";
  return "Hoje";
}
