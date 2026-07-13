import { createClient } from "@supabase/supabase-js";
import { hallOfFame, leaderboard, officialGames } from "./data";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "./supabase/config";

export type GameRecord = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  seo_description: string;
  instructions: string | null;
  category_id: string | null;
  type: "external" | "official";
  ranked: boolean;
  iframe_url: string | null;
  component_key: string | null;
  thumbnail_url: string | null;
  tags: string[];
  status: "draft" | "published";
  featured: boolean;
  daily_challenge: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at?: string;
};

export type RankingEntry = {
  user_id: string;
  username: string;
  public_name: string;
  avatar_url: string | null;
  score: number;
  level: number | null;
  duration_seconds: number | null;
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string | null;
  username: string | null;
  public_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UserScore = {
  id: string;
  game_id: string;
  score: number;
  level: number | null;
  duration_seconds: number | null;
  metadata: ScoreMetadata | null;
  created_at: string;
  games?: {
    title: string;
    slug: string;
  } | null;
};

export type ScoreMetadata = {
  correct?: number;
  errors?: number;
  bestCombo?: number;
  level?: number;
  durationSeconds?: number;
  [key: string]: unknown;
};

export type SubmitScoreResult =
  | { ok: true; saved: true; scoreId: string }
  | { ok: true; saved: false; reason: string }
  | { ok: false; error: string };

export type CategoryPage = {
  slug: string;
  name: string;
  title: string;
  description: string;
  tags: string[];
  categoryIds: string[];
};

const mockCategoryIds = {
  logic: "11111111-1111-4111-8111-111111111111",
  math: "22222222-2222-4222-8222-222222222222",
  memory: "33333333-3333-4333-8333-333333333333",
  puzzle: "44444444-4444-4444-8444-444444444444",
  quick: "55555555-5555-4555-8555-555555555555",
  relaxing: "66666666-6666-4666-8666-666666666666"
};

export const mockCategories: CategoryRecord[] = [
  {
    id: mockCategoryIds.logic,
    name: "Lógica",
    slug: "logica",
    description: "Desafios de raciocínio e padrões.",
    icon: "Brain",
    sort_order: 1
  },
  {
    id: mockCategoryIds.math,
    name: "Matemática",
    slug: "matematica",
    description: "Contas rápidas e números.",
    icon: "Calculator",
    sort_order: 2
  },
  {
    id: mockCategoryIds.memory,
    name: "Memória",
    slug: "memoria",
    description: "Jogos curtos de atenção e memória.",
    icon: "Cards",
    sort_order: 3
  },
  {
    id: mockCategoryIds.puzzle,
    name: "Quebra-Cabeça",
    slug: "quebra-cabeca",
    description: "Jogos de encaixe, padrões e solução visual.",
    icon: "PuzzlePiece",
    sort_order: 4
  },
  {
    id: mockCategoryIds.quick,
    name: "Jogos Rápidos",
    slug: "jogos-rapidos",
    description: "Partidas curtas para jogar em poucos minutos.",
    icon: "Lightning",
    sort_order: 5
  },
  {
    id: mockCategoryIds.relaxing,
    name: "Relaxantes",
    slug: "relaxantes",
    description: "Jogos leves para passar o tempo sem pressão.",
    icon: "Sparkle",
    sort_order: 6
  }
];

const externalGameSeeds = [
  ["Matemática Rápida", "matematica-rapida", "Resolva operações simples em partidas curtas.", "math", "/images/conta-certa.png", ["matemática", "rápido", "novo"], true],
  ["Blocos Relâmpago", "blocos-relampago", "Encaixe blocos por padrão visual antes do tempo acabar.", "puzzle", "/images/caminhos.png", ["quebra-cabeça", "rápido"], true],
  ["Memória de Cores", "memoria-de-cores", "Memorize sequências de cores em rodadas rápidas.", "memory", "/images/memoria.png", ["memória", "rápido"], false],
  ["Labirinto Mental", "labirinto-mental", "Escolha caminhos curtos usando atenção e raciocínio.", "logic", "/images/caminhos.png", ["lógica", "raciocínio"], false],
  ["Palavras Rápidas", "palavras-rapidas", "Encontre palavras curtas em uma grade limpa.", "quick", "/images/caca-palavras.png", ["rápido", "palavras"], false],
  ["Padrões Visuais", "padroes-visuais", "Complete padrões visuais sem pressão.", "logic", "/images/sequencia-logica.png", ["lógica", "quebra-cabeça"], false],
  ["Conta Express", "conta-express", "Acerte contas rápidas em sequência.", "math", "/images/conta-certa.png", ["matemática", "rápido"], false],
  ["Rota dos Pontos", "rota-dos-pontos", "Conecte pontos com poucos movimentos.", "puzzle", "/images/caminhos.png", ["quebra-cabeça", "raciocínio"], false],
  ["Quebra Códigos", "quebra-codigos", "Descubra combinações usando pistas simples.", "logic", "/images/sequencia-logica.png", ["lógica", "novo"], false],
  ["Reflexo Numérico", "reflexo-numerico", "Toque nos números certos na ordem mais rápida.", "math", "/images/conta-certa.png", ["matemática", "rápido"], false],
  ["Soma Zen", "soma-zen", "Faça contas leves em um ritmo tranquilo.", "relaxing", "/images/conta-certa.png", ["relaxante", "matemática"], false],
  ["Jardim de Pares", "jardim-de-pares", "Combine pares visuais em rodadas calmas.", "memory", "/images/memoria.png", ["memória", "relaxante"], false],
  ["Linha Perfeita", "linha-perfeita", "Organize linhas e formas com poucos movimentos.", "puzzle", "/images/caminhos.png", ["quebra-cabeça"], false],
  ["Sequência Flash", "sequencia-flash", "Leia padrões rápidos e escolha a continuação.", "quick", "/images/sequencia-logica.png", ["rápido", "lógica"], false],
  ["Mosaico Leve", "mosaico-leve", "Monte padrões visuais sem pressa.", "relaxing", "/images/caminhos.png", ["relaxante", "quebra-cabeça"], false],
  ["Caça Símbolos", "caca-simbolos", "Encontre símbolos repetidos em uma grade limpa.", "quick", "/images/caca-palavras.png", ["rápido", "observação"], false],
  ["Memória Flash", "memoria-flash-externo", "Teste sua memória visual em partidas de um minuto.", "memory", "/images/memoria.png", ["memória", "rápido"], false],
  ["Trilha Lógica", "trilha-logica", "Siga pistas simples até a solução.", "logic", "/images/caminhos.png", ["lógica", "raciocínio"], false],
  ["Números Calmos", "numeros-calmos", "Resolva números em uma experiência leve.", "relaxing", "/images/conta-certa.png", ["relaxante", "matemática"], false],
  ["Encaixe Rápido", "encaixe-rapido", "Resolva encaixes simples em poucos segundos.", "quick", "/images/caminhos.png", ["rápido", "quebra-cabeça", "novo"], false]
] satisfies [string, string, string, keyof typeof mockCategoryIds, string, string[], boolean][];

const mockExternalGames: GameRecord[] = externalGameSeeds.map(
  ([title, slug, shortDescription, categoryKey, thumbnailUrl, tags, featured], index) => ({
    id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    title,
    slug,
    short_description: shortDescription,
    seo_description: `Jogue ${title} grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.`,
    instructions: "Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.",
    category_id: mockCategoryIds[categoryKey],
    type: "external",
    ranked: false,
    iframe_url: `https://example.com/embed/${slug}`,
    component_key: null,
    thumbnail_url: thumbnailUrl,
    tags: Array.from(new Set(["sem ranking", ...tags])),
    status: "published",
    featured,
    daily_challenge: false
  })
);

export const mockGames: GameRecord[] = [
  ...officialGames.map((game, index) => ({
    id: `00000000-0000-4000-8000-00000000000${index + 1}`,
    title: game.title,
    slug: game.id,
    short_description: game.description,
    seo_description: `${game.title}: jogo rápido para testar seu cérebro.`,
    instructions:
      game.id === "sequencia-logica"
        ? "Observe a sequência e escolha a próxima resposta. Você tem 3 vidas."
        : "Complete o desafio no menor tempo possível.",
    category_id:
      game.id === "memoria"
        ? mockCategoryIds.memory
        : game.id === "conta-certa"
          ? mockCategoryIds.math
          : mockCategoryIds.logic,
    type: "official" as const,
    ranked: true,
    iframe_url: null,
    component_key: game.id === "sequencia-logica" ? "sequence-logic" : "coming-soon",
    thumbnail_url: game.image,
    tags: game.tags,
    status: "published" as const,
    featured: index < 2,
    daily_challenge: Boolean(game.isDaily)
  })),
  ...mockExternalGames
];

export const mockRanking: RankingEntry[] = leaderboard.map((player, index) => ({
  user_id: `mock-user-${index + 1}`,
  username: player.name,
  public_name: player.name,
  avatar_url: null,
  score: player.points,
  level: 8 - index,
  duration_seconds: 120 + index * 18,
  created_at: new Date(Date.now() - index * 3600000).toISOString()
}));

export const mockHallOfFame = hallOfFame;
export const mockUserProfile: UserProfile = {
  id: "mock-user-1",
  email: null,
  username: "visitante_mvp",
  public_name: "Visitante MVP",
  avatar_url: null
};

export const mockUserScores: UserScore[] = [
  {
    id: "mock-score-1",
    game_id: mockGames[0].id,
    score: 12540,
    level: 8,
    duration_seconds: 120,
    metadata: { correct: 26, errors: 3, bestCombo: 9 },
    created_at: new Date().toISOString(),
    games: {
      title: "Sequência Lógica",
      slug: "sequencia-logica"
    }
  },
  {
    id: "mock-score-2",
    game_id: mockGames[0].id,
    score: 8420,
    level: 6,
    duration_seconds: 156,
    metadata: { correct: 18, errors: 3, bestCombo: 6 },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    games: {
      title: "Sequência Lógica",
      slug: "sequencia-logica"
    }
  }
];

function createPublicSupabaseClient() {
  if (!hasSupabaseConfig) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

async function fetchGames(filter?: (game: GameRecord) => boolean) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return filter ? mockGames.filter(filter) : mockGames;

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return filter ? mockGames.filter(filter) : mockGames;
  const games = data as GameRecord[];
  return filter ? games.filter(filter) : games;
}

export async function getPublishedGames() {
  return fetchGames();
}

export async function getGameBySlug(slug: string) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return mockGames.find((game) => game.slug === slug) ?? null;

  const { data, error } = await supabase.from("games").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error || !data) return mockGames.find((game) => game.slug === slug) ?? null;
  return data as GameRecord;
}

export async function getRankedGames() {
  return fetchGames((game) => game.type === "official" && game.ranked);
}

export async function getExternalGames() {
  return fetchGames((game) => game.type === "external");
}

export const categoryPages: CategoryPage[] = [
  {
    slug: "matematica",
    name: "Matemática",
    title: "Jogos de Matemática",
    description: "Contas rápidas, números e desafios leves para treinar cálculo sem cara de aula.",
    tags: ["matemática"],
    categoryIds: [mockCategoryIds.math]
  },
  {
    slug: "logica",
    name: "Lógica",
    title: "Jogos de Lógica",
    description: "Padrões, dedução e raciocínio rápido para testar seu cérebro em poucos minutos.",
    tags: ["lógica", "raciocínio"],
    categoryIds: [mockCategoryIds.logic]
  },
  {
    slug: "memoria",
    name: "Memória",
    title: "Jogos de Memória",
    description: "Jogos curtos de atenção, pares e sequências visuais para manter o foco.",
    tags: ["memória"],
    categoryIds: [mockCategoryIds.memory]
  },
  {
    slug: "quebra-cabeca",
    name: "Quebra-Cabeça",
    title: "Jogos de Quebra-Cabeça",
    description: "Encaixes, rotas e padrões visuais para resolver sem pressa e sem poluição.",
    tags: ["quebra-cabeça"],
    categoryIds: [mockCategoryIds.puzzle]
  },
  {
    slug: "jogos-rapidos",
    name: "Jogos Rápidos",
    title: "Jogos Rápidos Online",
    description: "Partidas curtas para abrir, jogar e seguir o dia sem cadastro obrigatório.",
    tags: ["rápido"],
    categoryIds: [mockCategoryIds.quick]
  },
  {
    slug: "relaxantes",
    name: "Relaxantes",
    title: "Jogos Relaxantes",
    description: "Jogos leves, calmos e simples para passar o tempo sem pressão de ranking.",
    tags: ["relaxante"],
    categoryIds: [mockCategoryIds.relaxing]
  }
];

export function getCategoryPage(slug: string) {
  return categoryPages.find((category) => category.slug === slug) ?? null;
}

export function gameMatchesCategory(game: GameRecord, category: CategoryPage) {
  if (game.category_id && category.categoryIds.includes(game.category_id)) return true;
  return game.tags.some((tag) => category.tags.includes(tag.toLowerCase()));
}

export async function getGamesForCategory(slug: string) {
  const category = getCategoryPage(slug);
  if (!category) return null;
  const games = await getPublishedGames();
  return {
    category,
    games: games.filter((game) => game.status === "published" && gameMatchesCategory(game, category))
  };
}

export async function getSimilarGames(game: GameRecord, limit = 6) {
  const games = await getPublishedGames();
  const related = games.filter((candidate) => {
    if (candidate.slug === game.slug || candidate.status !== "published") return false;
    if (candidate.category_id && game.category_id && candidate.category_id === game.category_id) return true;
    return candidate.tags.some((tag) => game.tags.includes(tag));
  });

  return related.slice(0, limit);
}

export async function getCategories() {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return mockCategories;

  const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
  if (error || !data) return mockCategories;
  return data as CategoryRecord[];
}

async function getRanking(gameId: string, periodColumn: "period_day" | "period_week" | "period_month") {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return bestScorePerUser(mockRanking);

  const periodValue =
    periodColumn === "period_day"
      ? new Date().toISOString().slice(0, 10)
      : periodColumn === "period_month"
        ? new Date().toISOString().slice(0, 7)
        : getIsoWeekKey(new Date());

  const { data, error } = await supabase
    .from("public_ranking_scores")
    .select("user_id, username, display_name, avatar_url, score, level, duration_seconds, created_at")
    .eq("game_id", gameId)
    .eq(periodColumn, periodValue)
    .order("score", { ascending: false })
    .limit(100);

  if (error || !data) return mockRanking;

  return bestScorePerUser(data.map((row: any) => ({
    user_id: row.user_id,
    username: row.username ?? "jogador",
    public_name: row.display_name ?? row.username ?? "Jogador",
    avatar_url: row.avatar_url ?? null,
    score: row.score,
    level: row.level,
    duration_seconds: row.duration_seconds,
    created_at: row.created_at
  })) as RankingEntry[]).slice(0, 20);
}

export async function getDailyRanking(gameId: string) {
  return getRanking(gameId, "period_day");
}

export async function getWeeklyRanking(gameId: string) {
  return getRanking(gameId, "period_week");
}

export async function getMonthlyRanking(gameId: string) {
  return getRanking(gameId, "period_month");
}

export async function submitScore(gameId: string, score: number, metadata: ScoreMetadata = {}): Promise<SubmitScoreResult> {
  if (!Number.isFinite(score) || score < 0) {
    return { ok: false, error: "Pontuação inválida." };
  }

  if (score > 1000000) {
    return { ok: false, error: "Pontuação acima do limite plausível." };
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return { ok: true, saved: false, reason: "Supabase não configurado; usando modo demonstração." };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: true, saved: false, reason: "Entre para salvar sua pontuação no ranking." };
  }

  const game = await getGameBySlug(gameId);
  const resolvedGameId = game?.id ?? gameId;

  const { data, error } = await supabase
    .from("scores")
    .insert({
      user_id: user.id,
      game_id: resolvedGameId,
      score: Math.round(score),
      level: typeof metadata.level === "number" ? metadata.level : null,
      duration_seconds: typeof metadata.durationSeconds === "number" ? metadata.durationSeconds : null,
      metadata
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, saved: true, scoreId: data.id };
}

export async function getUserProfile(userId?: string) {
  const supabase = createPublicSupabaseClient();
  if (!supabase || !userId) return mockUserProfile;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return data as UserProfile;
}

export async function getUserScores(userId?: string) {
  const supabase = createPublicSupabaseClient();
  if (!supabase || !userId) return mockUserScores;

  const { data, error } = await supabase
    .from("scores")
    .select("id, game_id, score, level, duration_seconds, metadata, created_at, games(title, slug)")
    .eq("user_id", userId)
    .eq("valid", true)
    .order("score", { ascending: false })
    .limit(10);

  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    game_id: row.game_id,
    score: row.score,
    level: row.level,
    duration_seconds: row.duration_seconds,
    metadata: row.metadata,
    created_at: row.created_at,
    games: Array.isArray(row.games) ? row.games[0] ?? null : row.games
  })) as UserScore[];
}

function bestScorePerUser(entries: RankingEntry[]) {
  const byUser = new Map<string, RankingEntry>();
  for (const entry of entries) {
    const current = byUser.get(entry.user_id);
    if (!current || entry.score > current.score) byUser.set(entry.user_id, entry);
  }
  return [...byUser.values()].sort((a, b) => b.score - a.score);
}

function getIsoWeekKey(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}
