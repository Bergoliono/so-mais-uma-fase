import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RankingRows } from "@/components/ranking-panel";
import { SequenceLogicGame } from "@/components/sequence-logic-game";
import { SiteFooter } from "@/components/site-footer";
import { OfficialBadgeIcon, PlayBadgeIcon } from "@/components/ui-icons";
import { getDailyRanking, getGameBySlug, getRankedGames, getSimilarGames, type GameRecord } from "@/lib/game-data";

type GamePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return {};
  const image = game.thumbnail_url || "/images/sequencia-logica.png";
  const title =
    game.type === "external"
      ? `${game.title} - Jogue grátis online | Só Mais Uma Fase`
      : `${game.title} | Só Mais Uma Fase`;

  return {
    title,
    description: game.seo_description,
    alternates: {
      canonical: `/jogos/${game.slug}`
    },
    openGraph: {
      title,
      description: game.seo_description,
      images: [image],
      type: "website",
      url: `/jogos/${game.slug}`
    }
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const ranking = game.ranked ? await getDailyRanking(game.id) : [];
  const isOfficialSequence = game.type === "official" && game.component_key === "sequence-logic";
  const similarGames = game.type === "external" ? await getSimilarGames(game, 6) : [];
  const officialRankingGames = game.type === "external" ? await getRankedGames() : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl bg-paper pb-12">
      <header className="border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
        <Link href="/" className="text-sm font-black text-teal-700">
          Voltar ao início
        </Link>
      </header>

      <section className="mx-auto max-w-[720px] px-5 pt-5">
        <article className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          <div className="relative min-h-64 bg-zinc-100">
            {game.thumbnail_url && <Image src={game.thumbnail_url} alt="" fill sizes="720px" className="object-cover" priority />}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge label={game.ranked ? "ranking oficial" : "sem ranking"} official={game.ranked} />
                {game.daily_challenge && <Badge label="desafio do dia" official />}
                {game.tags.includes("novo") && <Badge label="novo" />}
              </div>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">{game.title}</h1>
            </div>
          </div>
          <div className="p-5">
            <p className="text-base font-bold leading-7 text-ink">{game.short_description}</p>
            {game.instructions && <p className="mt-3 text-sm leading-6 text-zinc-700">{game.instructions}</p>}
            {game.type === "external" && (
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <a href="#jogar" className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-action px-6 text-base font-black text-white shadow-soft">
                  <PlayBadgeIcon />
                  Jogar agora
                </a>
                <p className="text-xs font-bold leading-5 text-muted">Este jogo não participa do ranking oficial.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section id="jogar" className="mx-auto max-w-[720px] px-5 pt-4">
        {isOfficialSequence ? (
          <SequenceLogicGame gameId={game.slug} />
        ) : game.type === "external" && game.iframe_url ? (
          <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
              <PlayBadgeIcon />
              <span>Jogo externo grátis</span>
            </div>
            <iframe
              src={game.iframe_url}
              title={game.title}
              className="aspect-[9/12] max-h-[720px] min-h-[420px] w-full rounded-lg border border-line bg-zinc-100 sm:aspect-video sm:min-h-[460px]"
              loading="lazy"
              allowFullScreen
            />
            <p className="mt-3 text-xs font-bold leading-5 text-muted">
              Este jogo é carregado por iframe e não participa do ranking oficial.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-white p-5 text-sm font-bold text-muted shadow-soft">
            Este desafio oficial ainda não tem componente jogável publicado.
          </div>
        )}
      </section>

      {game.type === "external" && (
        <section className="mx-auto max-w-[720px] px-5 pt-5">
          <div className="rounded-lg border border-teal-500/25 bg-white p-4 shadow-ranked">
            <h2 className="text-lg font-black text-ink">Quer entrar no ranking?</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-muted">
              Rankings oficiais valem apenas para desafios próprios com pontuação controlada pelo sistema.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {officialRankingGames.slice(0, 2).map((officialGame) => (
                <GameMiniCard key={officialGame.id} game={officialGame} />
              ))}
            </div>
          </div>
        </section>
      )}

      {similarGames.length > 0 && (
        <section className="mx-auto max-w-[720px] px-5 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black text-ink">Jogos parecidos</h2>
            <Link href="/" className="text-sm font-black text-teal-700">
              Ver mais
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {similarGames.map((similarGame) => (
              <GameMiniCard key={similarGame.id} game={similarGame} />
            ))}
          </div>
        </section>
      )}

      {game.ranked && (
        <section className="mx-auto max-w-[720px] px-5 pt-5">
          <div className="rounded-lg border border-teal-500/25 bg-white p-4 shadow-ranked">
            <div className="mb-3 flex items-center gap-2">
              <OfficialBadgeIcon />
              <h2 className="text-lg font-black text-ink">Ranking deste jogo</h2>
            </div>
            <div className="mb-3 grid grid-cols-3 overflow-hidden rounded-lg border border-line text-xs font-black">
              <Link href="/ranking?periodo=dia" className="flex h-10 items-center justify-center bg-teal-500/10 text-teal-700">
                Diário
              </Link>
              <Link href="/ranking?periodo=semana" className="flex h-10 items-center justify-center border-l border-line text-zinc-700">
                Semanal
              </Link>
              <Link href="/ranking?periodo=mes" className="flex h-10 items-center justify-center border-l border-line text-zinc-700">
                Mensal
              </Link>
            </div>
            <RankingRows entries={ranking} />
          </div>
        </section>
      )}
      <SiteFooter />
    </main>
  );
}

function GameMiniCard({ game }: { game: GameRecord }) {
  return (
    <Link href={`/jogos/${game.slug}`} className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
      <div className="relative aspect-[4/3] bg-zinc-100">
        {game.thumbnail_url && <Image src={game.thumbnail_url} alt="" fill sizes="220px" className="object-cover" />}
        <div className="absolute left-2 top-2">
          <Badge label={game.ranked ? "ranking oficial" : "sem ranking"} official={game.ranked} />
        </div>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-black leading-tight text-ink">{game.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-muted">{game.short_description}</p>
      </div>
    </Link>
  );
}

function Badge({ label, official }: { label: string; official?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-black ${
        official ? "border-teal-500/25 bg-teal-500/10 text-teal-700" : "border-zinc-300 bg-zinc-100 text-zinc-700"
      }`}
    >
      {label}
    </span>
  );
}
