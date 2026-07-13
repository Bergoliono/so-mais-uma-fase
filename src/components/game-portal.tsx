"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarBlank,
  CaretRight,
  Clock,
  Crown,
  House,
  Lightning,
  Medal,
  Play,
  ShieldCheck,
  Star,
  Trophy,
  UserCircle,
  UsersThree
} from "@phosphor-icons/react";
import { hallOfFame, leaderboard } from "@/lib/data";
import { categoryPages, gameMatchesCategory, type GameRecord } from "@/lib/game-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { SiteFooter } from "./site-footer";

type Tab = "home" | "ranking" | "quick" | "hall" | "profile";
type RankingPeriod = "Hoje" | "Semana" | "Mês";
type Game = GameRecord;

const categories = ["Hoje", "Ranking", "Rápidos", "Populares"];
const rankingPeriods: RankingPeriod[] = ["Hoje", "Semana", "Mês"];

const navItems = [
  { id: "home", label: "Início", icon: House },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "quick", label: "Rápidos", icon: Lightning },
  { id: "hall", label: "Hall", icon: Star },
  { id: "profile", label: "Perfil", icon: UserCircle }
] satisfies { id: Tab; label: string; icon: typeof House }[];

function formatPoints(points: number) {
  return new Intl.NumberFormat("pt-BR").format(points);
}

function getGameImage(game: Game) {
  return game.thumbnail_url || "/images/sequencia-logica.png";
}

function getGameDuration(game: Game) {
  if (game.tags.includes("rápido")) return "1-3 min";
  if (game.type === "official") return "3 min";
  return "2-4 min";
}

function getGameDifficulty(game: Game) {
  if (game.tags.includes("relaxante")) return "Leve";
  if (game.tags.includes("raciocínio")) return "Médio";
  return game.type === "official" ? "Oficial" : "Casual";
}

function getCategoryGames(games: Game[], slug: string) {
  const category = categoryPages.find((item) => item.slug === slug);
  if (!category) return [];
  return games.filter((game) => gameMatchesCategory(game, category));
}

function Badge({ label, tone = "neutral" }: { label: string; tone?: "official" | "quick" | "new" | "neutral" }) {
  const styles = {
    official: "border-teal-500/25 bg-teal-500/10 text-teal-700",
    quick: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    new: "border-amber-400/30 bg-amber-300/20 text-amber-700",
    neutral: "border-zinc-300 bg-zinc-100 text-zinc-700"
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-bold ${styles[tone]}`}>
      {label}
    </span>
  );
}

function SectionHeader({ title, action = "Ver todos" }: { title: string; action?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between px-5">
      <h2 className="text-[22px] font-black tracking-tight text-ink">{title}</h2>
      <button className="flex items-center gap-1 text-sm font-bold text-teal-600">
        {action}
        <CaretRight size={17} weight="bold" />
      </button>
    </div>
  );
}

function GameCard({ game, compact = false, onPlay }: { game: Game; compact?: boolean; onPlay: (game: Game) => void }) {
  const isOfficial = game.type === "official";
  const primaryTag = isOfficial ? "ranking oficial" : "sem ranking";
  const isNew = game.tags.includes("novo");

  return (
    <article
      className={`shrink-0 overflow-hidden rounded-lg border bg-white text-left shadow-soft ${
        isOfficial ? "border-teal-500/30 shadow-ranked" : "border-line"
      } ${compact ? "h-[246px] w-[154px] min-[390px]:w-[166px]" : "h-[286px] w-[182px] min-[390px]:w-[190px]"}`}
    >
      <button className="flex h-full w-full flex-col text-left" onClick={() => onPlay(game)}>
        <div className={`${compact ? "h-[112px]" : "h-[124px]"} relative overflow-hidden bg-zinc-100`}>
          <Image src={getGameImage(game)} alt="" fill sizes="190px" className="object-cover" priority={game.daily_challenge} />
          {isOfficial && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 to-action" />}
          <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-action shadow-soft">
            <Play size={21} weight="fill" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between space-y-2 p-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <Badge label={primaryTag} tone={isOfficial ? "official" : "neutral"} />
              {isNew && <Badge label="novo" tone="new" />}
            </div>
            <h3 className="line-clamp-2 min-h-10 text-[15px] font-black leading-tight text-ink">{game.title}</h3>
            {!compact && <p className="line-clamp-2 text-xs leading-5 text-muted">{game.short_description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-muted">
            <span className="text-teal-600">{getGameDifficulty(game)}</span>
            <span aria-hidden="true">•</span>
            <span>{getGameDuration(game)}</span>
          </div>
        </div>
      </button>
    </article>
  );
}

function HorizontalGames({
  title,
  games,
  compact,
  onPlay
}: {
  title: string;
  games: Game[];
  compact?: boolean;
  onPlay: (game: Game) => void;
}) {
  return (
    <section className="py-3">
      <SectionHeader title={title} />
      <div className="hide-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
        {games.map((game) => (
          <GameCard key={game.id} game={game} compact={compact} onPlay={onPlay} />
        ))}
      </div>
    </section>
  );
}

function DailyChallenge({ daily, onPlay }: { daily: Game; onPlay: (game: Game) => void }) {
  return (
    <section className="mx-4 mt-5 overflow-hidden rounded-lg border border-teal-500/35 bg-white shadow-ranked min-[390px]:mx-5">
      <div className="grid min-h-[226px] grid-cols-[1.04fr_.96fr] max-[374px]:grid-cols-1">
        <div className="flex flex-col justify-between p-4 min-[390px]:p-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-teal-700 min-[390px]:text-xs">
              <CalendarBlank size={18} weight="bold" />
              desafio do dia
            </div>
            <h1 className="text-[23px] font-black leading-tight tracking-tight text-ink min-[390px]:text-[25px]">{daily.title}</h1>
            <p className="mt-2 text-[13px] leading-6 text-zinc-600 min-[390px]:text-sm">{daily.short_description}</p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge label="ranking oficial" tone="official" />
              <Badge label="3 min" tone="quick" />
            </div>
            <button
              onClick={() => onPlay(daily)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-action text-sm font-black text-white shadow-soft transition active:scale-[.98]"
            >
              <Play size={19} weight="fill" />
              Jogar agora
            </button>
          </div>
        </div>
        <div className="relative min-h-full overflow-hidden bg-teal-700 max-[374px]:h-40 max-[374px]:min-h-0">
          <Image
            src={getGameImage(daily)}
            alt=""
            fill
            sizes="(max-width: 430px) 48vw, 205px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-teal-950/18 to-transparent" />
          <div className="absolute bottom-4 right-3 rounded-lg border border-white/20 bg-zinc-950/75 px-3 py-2 text-right text-white shadow-ranked backdrop-blur min-[390px]:right-4">
            <div className="text-[11px] font-bold text-teal-100">meta de hoje</div>
            <div className="text-xl font-black">7.500 pts</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryTabs({
  active,
  setActive
}: {
  active: string;
  setActive: (category: string) => void;
}) {
  return (
    <div className="mx-4 mt-5 grid h-12 grid-cols-4 overflow-hidden rounded-lg border border-line bg-white text-sm font-black shadow-soft min-[390px]:mx-5">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setActive(category)}
          className={`min-w-0 border-r border-line px-1 text-[11px] last:border-r-0 min-[390px]:text-xs ${
            active === category ? "bg-teal-500/10 text-teal-700 shadow-[inset_0_-3px_0_#14B8A6]" : "text-zinc-700"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

function Podium({ compact = false }: { compact?: boolean }) {
  const [first, second, third] = leaderboard;
  const slots = [
    { player: second, color: "bg-medal-silver", height: compact ? "h-24" : "h-28", label: "2" },
    { player: first, color: "bg-medal-gold", height: compact ? "h-32" : "h-40", label: "1" },
    { player: third, color: "bg-medal-bronze", height: compact ? "h-20" : "h-24", label: "3" }
  ];

  return (
    <div className="rounded-lg border border-teal-400/30 bg-zinc-950 p-4 text-white shadow-[0_0_0_1px_rgba(20,184,166,.18),0_18px_44px_rgba(20,184,166,.18)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-200">ranking oficial</p>
          <h3 className="text-xl font-black">Top 3 de hoje</h3>
        </div>
        <Crown size={28} weight="fill" className="text-medal-gold" />
      </div>
      <div className="flex items-end justify-center gap-2">
        {slots.map(({ player, color, height, label }) => (
          <div key={player.name} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-black">
              {player.initials}
            </div>
            <div className={`flex w-full flex-col items-center justify-end rounded-t-lg ${color} ${height} p-2 text-ink shadow-[0_0_22px_rgba(20,184,166,.16)]`}>
              <span className="text-lg font-black">{label}</span>
              <span className="mt-1 max-w-full truncate text-xs font-black">{player.name}</span>
              <span className="text-[11px] font-bold">{formatPoints(player.points)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardList() {
  return (
    <div className="space-y-2">
      {leaderboard.map((player) => (
        <div key={player.name} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 shadow-soft">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
              player.rank === 1
                ? "bg-medal-gold text-ink"
                : player.rank === 2
                  ? "bg-medal-silver text-ink"
                  : player.rank === 3
                    ? "bg-medal-bronze text-white"
                    : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {player.rank}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-black text-white">
            {player.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-ink">{player.name}</p>
            <p className="text-xs font-bold text-muted">{player.streak} dias de sequência</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-teal-700">{formatPoints(player.points)}</p>
            <p className="text-[11px] font-bold text-muted">pts</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeView({
  games,
  officialGames,
  externalGames,
  onPlay,
  setTab
}: {
  games: Game[];
  officialGames: Game[];
  externalGames: Game[];
  onPlay: (game: Game) => void;
  setTab: (tab: Tab) => void;
}) {
  const [activeCategory, setActiveCategory] = useState("Hoje");
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const daily = officialGames.find((game) => game.daily_challenge) ?? officialGames[0] ?? games[0];
  const popularGames = useMemo(() => [...externalGames.slice(0, 4), ...officialGames.slice(0, 2)].filter(Boolean), [externalGames, officialGames]);
  const quickGames = useMemo(() => getCategoryGames(games, "jogos-rapidos").slice(0, 8), [games]);
  const puzzleGames = useMemo(() => getCategoryGames(games, "quebra-cabeca").slice(0, 8), [games]);
  const relaxingGames = useMemo(() => getCategoryGames(games, "relaxantes").slice(0, 8), [games]);
  const newGames = useMemo(() => games.filter((game) => game.tags.includes("novo")).slice(0, 8), [games]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserLabel(data.user.email?.split("@")[0] ?? "Perfil");
    });
  }, []);

  return (
    <>
      <header className="px-5 pt-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[23px] font-black leading-tight tracking-tight text-ink min-[390px]:text-[26px]">
              Só Mais Uma Fase
            </p>
            <p className="mt-1 text-[13px] font-medium text-muted min-[390px]:text-sm">
              Jogos rápidos para testar seu cérebro
            </p>
          </div>
          <button
            onClick={() => {
              window.location.href = userLabel ? "/perfil" : "/login";
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-teal-600/45 bg-white text-teal-700 shadow-soft min-[390px]:h-12 min-[390px]:w-12"
            title={userLabel ? `Perfil de ${userLabel}` : "Entrar"}
          >
            <UserCircle size={25} weight={userLabel ? "fill" : "bold"} />
          </button>
        </div>
      </header>

      {daily && <DailyChallenge daily={daily} onPlay={onPlay} />}
      <CategoryTabs active={activeCategory} setActive={setActiveCategory} />

      <section className="px-5 py-4">
        <button
          onClick={() => setTab("ranking")}
          className="flex w-full items-center justify-between rounded-lg border border-teal-500/25 bg-zinc-950 p-4 text-left text-white shadow-ranked"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-400/15 text-teal-200">
              <UsersThree size={24} weight="bold" />
            </div>
            <div>
              <p className="text-sm font-black">Comunidade em disputa</p>
              <p className="text-xs font-bold text-zinc-300">Top 3, rankings e Hall da Fama</p>
            </div>
          </div>
          <CaretRight size={20} weight="bold" />
        </button>
      </section>

      <HorizontalGames title="Jogos com Ranking" games={officialGames} onPlay={onPlay} />
      <HorizontalGames title="Mais Jogados" games={popularGames} compact onPlay={onPlay} />
      <HorizontalGames title="Jogos Rápidos" games={quickGames.length ? quickGames : externalGames} compact onPlay={onPlay} />
      <HorizontalGames title="Quebra-Cabeça" games={puzzleGames} compact onPlay={onPlay} />
      <HorizontalGames title="Relaxantes" games={relaxingGames} compact onPlay={onPlay} />
      <HorizontalGames title="Novos Jogos" games={newGames} compact onPlay={onPlay} />

      <section className="py-4">
        <SectionHeader title="Hall da Fama" action="Abrir" />
        <div className="hide-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
          {hallOfFame.map((item) => (
            <button
              key={item.title}
              onClick={() => setTab("hall")}
              className="w-[230px] shrink-0 rounded-lg border border-amber-300/60 bg-white p-4 text-left shadow-soft"
            >
              <div className="mb-3 flex items-center gap-2 text-amber-700">
                <Medal size={24} weight="fill" />
                <span className="text-xs font-black uppercase">{item.title}</span>
              </div>
              <p className="text-xl font-black text-ink">{item.value}</p>
              <p className="mt-1 text-sm font-bold text-teal-700">{item.player}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{item.detail}</p>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function RankingView() {
  const [period, setPeriod] = useState<RankingPeriod>("Hoje");

  return (
    <main className="px-5 pb-32 pt-7">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-wide text-teal-700">competição oficial</p>
        <h1 className="mt-1 text-[28px] font-black leading-tight tracking-tight text-ink">Ranking</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Pontuação válida apenas para jogos próprios da plataforma.</p>
      </div>
      <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-lg border border-line bg-white text-sm font-black shadow-soft">
        {rankingPeriods.map((item) => (
        <button
            key={item}
            onClick={() => setPeriod(item)}
            className={`h-11 min-w-0 border-r border-line px-1 last:border-r-0 ${
              period === item ? "bg-teal-500/10 text-teal-700 shadow-[inset_0_-3px_0_#14B8A6]" : "text-zinc-700"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <Podium />
      <div className="mt-5">
        <LeaderboardList />
      </div>
    </main>
  );
}

function QuickView({ games, onPlay }: { games: Game[]; onPlay: (game: Game) => void }) {
  const quickGames = getCategoryGames(games, "jogos-rapidos");
  return (
    <main className="px-5 pb-32 pt-7">
      <h1 className="text-[28px] font-black leading-tight tracking-tight text-ink">Jogos Rápidos</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Partidas curtas para abrir e jogar. Jogos externos aparecem com o badge sem ranking.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {(quickGames.length ? quickGames : games).map((game) => (
          <GameCard key={game.id} game={game} compact onPlay={onPlay} />
        ))}
      </div>
    </main>
  );
}

function HallView() {
  return (
    <main className="px-5 pb-32 pt-7">
      <p className="text-xs font-black uppercase tracking-wide text-amber-700">comunidade</p>
      <h1 className="mt-1 text-[28px] font-black leading-tight tracking-tight text-ink">Hall da Fama</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Destaques virtuais, recordes e medalhas dos desafios oficiais.</p>
      <div className="mt-5">
        <Podium compact />
      </div>
      <div className="mt-5 grid gap-3">
        {hallOfFame.map((item) => (
          <article key={item.title} className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-amber-700">{item.title}</p>
                <h2 className="mt-1 text-2xl font-black text-ink">{item.value}</h2>
              </div>
              <Medal size={36} weight="fill" className="text-medal-gold" />
            </div>
            <p className="mt-3 text-sm font-bold text-teal-700">{item.player}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

function ProfileView() {
  return (
    <main className="px-5 pb-32 pt-7">
      <h1 className="text-[28px] font-black leading-tight tracking-tight text-ink">Perfil</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Área preparada para autenticação via Supabase na próxima etapa.</p>
      <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-xl font-black text-white">
            SM
          </div>
          <div>
            <h2 className="text-lg font-black text-ink">Visitante</h2>
            <p className="text-sm font-bold text-muted">Entre para salvar medalhas e ranking.</p>
          </div>
        </div>
        <button className="mt-5 h-12 w-full rounded-lg bg-action text-sm font-black text-white shadow-soft">
          Criar conta grátis
        </button>
      </section>
      <section className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["0", "medalhas"],
          ["0", "recordes"],
          ["0", "favoritos"]
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg border border-line bg-white p-3 text-center shadow-soft">
            <p className="text-xl font-black text-ink">{value}</p>
            <p className="text-[11px] font-bold text-muted">{label}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

function GameDetail({ game, onBack }: { game: Game; onBack: () => void }) {
  const [playing, setPlaying] = useState(false);
  const isOfficial = game.type === "official";

  return (
    <main className="min-h-screen pb-32">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white">
            <ArrowLeft size={21} weight="bold" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-ink">{game.title}</p>
            <p className="text-xs font-bold text-muted">{isOfficial ? "Desafio oficial" : "Jogo grátis sem ranking"}</p>
          </div>
        </div>
      </header>

      <section className="px-5 pt-5">
        <div className={`overflow-hidden rounded-lg border bg-white shadow-soft ${isOfficial ? "border-teal-500/30" : "border-line"}`}>
          <div className="relative h-56 bg-zinc-100">
            <Image src={getGameImage(game)} alt="" fill sizes="390px" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge label={isOfficial ? "ranking oficial" : "sem ranking"} tone={isOfficial ? "official" : "neutral"} />
                <Badge label="rápido" tone="quick" />
                {game.tags.includes("novo") && <Badge label="novo" tone="new" />}
              </div>
              <h1 className="text-3xl font-black leading-tight text-white">{game.title}</h1>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <p className="text-sm leading-6 text-muted">{game.short_description}</p>
            <button
              onClick={() => setPlaying(true)}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-action text-base font-black text-white shadow-soft transition active:scale-[.98]"
            >
              <Play size={22} weight="fill" />
              {playing ? "Jogo iniciado" : "Jogar agora"}
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 pt-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">{playing ? "Área de jogo" : "Pronto para jogar"}</h2>
            <Clock size={21} weight="bold" className="text-teal-700" />
          </div>
          <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-teal-500/35 bg-teal-500/5 p-5 text-center">
            <div>
              <p className="text-sm font-black text-ink">
                {isOfficial ? "Jogo próprio com pontuação controlada" : "Iframe externo sem ranking oficial"}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                {isOfficial
                  ? "Na próxima etapa, este bloco recebe a lógica do desafio e envia a pontuação ao Supabase."
                  : "Aqui entra o iframe do parceiro. A pontuação interna não conta para o ranking do site."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {isOfficial && (
        <section className="px-5 pt-4">
          <div className="rounded-lg border border-teal-500/25 bg-white p-4 shadow-ranked">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={22} weight="fill" className="text-teal-700" />
              <h2 className="text-lg font-black text-ink">Ranking deste jogo</h2>
            </div>
            <LeaderboardList />
          </div>
        </section>
      )}
    </main>
  );
}

export function GamePortal({ games }: { games: Game[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const officialGames = useMemo(() => games.filter((game) => game.type === "official" && game.status === "published"), [games]);
  const externalGames = useMemo(() => games.filter((game) => game.type === "external" && game.status === "published"), [games]);
  const openGame = (game: Game) => router.push(`/jogos/${game.slug}`);

  if (selectedGame) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-paper shadow-[0_0_0_1px_rgba(228,228,231,.7)] max-[500px]:mx-0">
        <GameDetail game={selectedGame} onBack={() => setSelectedGame(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-paper pb-36 shadow-[0_0_0_1px_rgba(228,228,231,.7)] max-[500px]:mx-0">
      {tab === "home" && <HomeView games={games} officialGames={officialGames} externalGames={externalGames} onPlay={openGame} setTab={setTab} />}
      {tab === "ranking" && <RankingView />}
      {tab === "quick" && <QuickView games={games} onPlay={openGame} />}
      {tab === "hall" && <HallView />}
      {tab === "profile" && <ProfileView />}
      <SiteFooter compact />

      <nav className="fixed bottom-0 left-1/2 z-50 grid h-[76px] w-full max-w-[430px] -translate-x-1/2 grid-cols-5 border-t border-line bg-white/96 px-2 pb-2 pt-1 shadow-[0_-12px_30px_rgba(24,24,27,.08)] backdrop-blur max-[500px]:left-0 max-[500px]:translate-x-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-black ${
                active ? "text-teal-700" : "text-zinc-500"
              }`}
            >
              <Icon size={24} weight={active ? "fill" : "regular"} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
