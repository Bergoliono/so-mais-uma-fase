export type GameType = "official" | "external";

export type Game = {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Fácil" | "Médio" | "Difícil";
  type: GameType;
  image: string;
  tags: string[];
  plays: string;
  isNew?: boolean;
  isDaily?: boolean;
};

export type Player = {
  rank: number;
  name: string;
  initials: string;
  points: number;
  streak: number;
};

export const officialGames: Game[] = [
  {
    id: "sequencia-logica",
    title: "Sequência Lógica",
    description: "Descubra o próximo número antes do tempo acabar.",
    duration: "3 min",
    difficulty: "Médio",
    type: "official",
    image: "/images/sequencia-logica.png",
    tags: ["ranking oficial", "desafio do dia"],
    plays: "18,2 mil",
    isDaily: true
  },
  {
    id: "caca-palavras",
    title: "Caça Palavras",
    description: "Encontre padrões escondidos em uma grade rápida.",
    duration: "4 min",
    difficulty: "Médio",
    type: "official",
    image: "/images/caca-palavras.png",
    tags: ["ranking oficial", "novo"],
    plays: "9,8 mil",
    isNew: true
  },
  {
    id: "caminhos",
    title: "Caminhos",
    description: "Treine raciocínio conectando pontos com poucos passos.",
    duration: "4 min",
    difficulty: "Difícil",
    type: "official",
    image: "/images/caminhos.png",
    tags: ["ranking oficial", "lógica"],
    plays: "7,4 mil"
  },
  {
    id: "memoria",
    title: "Memória Flash",
    description: "Memorize pares e suba no placar semanal.",
    duration: "2 min",
    difficulty: "Fácil",
    type: "official",
    image: "/images/memoria.png",
    tags: ["ranking oficial", "rápido"],
    plays: "12,1 mil"
  }
];

export const externalGames: Game[] = [
  {
    id: "conta-certa",
    title: "Matemática Rápida",
    description: "Resolva operações de matemática em partidas curtas.",
    duration: "1 min",
    difficulty: "Fácil",
    type: "external",
    image: "/images/conta-certa.png",
    tags: ["sem ranking", "rápido"],
    plays: "21,5 mil"
  },
  {
    id: "padroes",
    title: "Padrões",
    description: "Complete sequências visuais sem pressa.",
    duration: "2 min",
    difficulty: "Fácil",
    type: "external",
    image: "/images/sequencia-logica.png",
    tags: ["sem ranking", "rápido"],
    plays: "16,9 mil"
  },
  {
    id: "cores-logica",
    title: "Cores & Lógica",
    description: "Organize cores por critério e velocidade.",
    duration: "2 min",
    difficulty: "Médio",
    type: "external",
    image: "/images/memoria.png",
    tags: ["sem ranking", "rápido"],
    plays: "14,6 mil"
  }
];

export const leaderboard: Player[] = [
  { rank: 1, name: "marcos_a", initials: "MA", points: 12540, streak: 7 },
  { rank: 2, name: "livia.m", initials: "LI", points: 11230, streak: 5 },
  { rank: 3, name: "felipe_rs", initials: "FE", points: 9870, streak: 4 },
  { rank: 4, name: "nina.dev", initials: "NI", points: 9220, streak: 3 },
  { rank: 5, name: "bruno_qz", initials: "BR", points: 8810, streak: 2 }
];

export const hallOfFame = [
  {
    title: "Maior sequência",
    player: "livia.m",
    value: "18 dias",
    detail: "Desafios diários completos"
  },
  {
    title: "Recorde mensal",
    player: "marcos_a",
    value: "42.900 pts",
    detail: "Somando jogos oficiais"
  },
  {
    title: "Subida rápida",
    player: "nina.dev",
    value: "+37 pos.",
    detail: "Nas últimas 24 horas"
  }
];
