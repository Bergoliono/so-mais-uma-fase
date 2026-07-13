import { notFound } from "next/navigation";
import { AdminGameForm } from "@/components/admin/admin-game-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCategories, mockGames } from "@/lib/game-data";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type AdminGameEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "Editar Jogo Externo | Só Mais Uma Fase"
};

export default async function AdminGameEditPage({ params }: AdminGameEditPageProps) {
  const { id } = await params;
  const categories = await getCategories();
  const initialGame = hasSupabaseConfig ? null : mockGames.find((game) => game.id === id || game.slug === id) ?? null;

  if (!hasSupabaseConfig && (!initialGame || initialGame.type !== "external")) notFound();

  return (
    <AdminShell>
      <AdminGameForm categories={categories} initialGame={initialGame} gameId={id} />
    </AdminShell>
  );
}
