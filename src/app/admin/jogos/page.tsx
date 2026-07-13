import { AdminGamesTable } from "@/components/admin/admin-games-table";
import { AdminShell } from "@/components/admin/admin-shell";
import { mockGames } from "@/lib/game-data";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export const metadata = {
  title: "Admin de Jogos | Só Mais Uma Fase"
};

export default function AdminGamesPage() {
  const initialGames = hasSupabaseConfig ? [] : mockGames.filter((game) => game.type === "external");

  return (
    <AdminShell>
      <AdminGamesTable initialGames={initialGames} requiresAuthFetch={hasSupabaseConfig} />
    </AdminShell>
  );
}
