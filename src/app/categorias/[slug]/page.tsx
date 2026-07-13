import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { categoryPages, getGamesForCategory, type GameRecord } from "@/lib/game-data";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return categoryPages.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getGamesForCategory(slug);
  if (!result) return {};

  return {
    title: `${result.category.title} | Só Mais Uma Fase`,
    description: result.category.description,
    alternates: {
      canonical: `/categorias/${result.category.slug}`
    },
    openGraph: {
      title: `${result.category.title} | Só Mais Uma Fase`,
      description: result.category.description,
      type: "website",
      url: `/categorias/${result.category.slug}`
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const result = await getGamesForCategory(slug);
  if (!result) notFound();

  const officialGames = result.games.filter((game) => game.type === "official");
  const externalGames = result.games.filter((game) => game.type === "external");

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-paper pb-12">
      <header className="border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
        <Link href="/" className="text-sm font-black text-teal-700">
          Voltar ao início
        </Link>
      </header>

      <section className="px-5 pt-8">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">categoria</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-ink sm:text-4xl">{result.category.title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-muted">{result.category.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{result.games.length} jogos</Badge>
            <Badge>{externalGames.length} sem ranking</Badge>
            {officialGames.length > 0 && <Badge tone="teal">{officialGames.length} com ranking</Badge>}
          </div>
        </div>
      </section>

      {officialGames.length > 0 && (
        <GameSection title="Desafios Oficiais" games={officialGames} />
      )}

      <GameSection title="Jogos grátis" games={externalGames} />
      <SiteFooter />
    </main>
  );
}

function GameSection({ title, games }: { title: string; games: GameRecord[] }) {
  if (games.length === 0) return null;

  return (
    <section className="px-5 pt-6">
      <h2 className="mb-3 text-xl font-black text-ink">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {games.map((game) => (
          <Link key={game.id} href={`/jogos/${game.slug}`} className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
            <div className="relative aspect-[4/3] bg-zinc-100">
              {game.thumbnail_url && <Image src={game.thumbnail_url} alt="" fill sizes="260px" className="object-cover" />}
              <div className="absolute left-2 top-2">
                <Badge tone={game.ranked ? "teal" : "gray"}>{game.ranked ? "ranking oficial" : "sem ranking"}</Badge>
              </div>
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 min-h-9 text-sm font-black leading-tight text-ink">{game.title}</h3>
              <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-muted">{game.short_description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "teal" }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-black ${
        tone === "teal" ? "border-teal-500/25 bg-teal-500/10 text-teal-700" : "border-zinc-300 bg-zinc-100 text-zinc-700"
      }`}
    >
      {children}
    </span>
  );
}
