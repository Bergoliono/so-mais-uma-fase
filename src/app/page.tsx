import { GamePortal } from "@/components/game-portal";
import { getPublishedGames } from "@/lib/game-data";

export default async function Home() {
  const games = await getPublishedGames();
  return <GamePortal games={games.filter((game) => game.status === "published")} />;
}
