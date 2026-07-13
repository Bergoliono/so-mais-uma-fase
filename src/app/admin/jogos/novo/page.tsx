import { AdminGameForm } from "@/components/admin/admin-game-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCategories } from "@/lib/game-data";

export const metadata = {
  title: "Novo Jogo Externo | Só Mais Uma Fase"
};

export default async function NewAdminGamePage() {
  const categories = await getCategories();

  return (
    <AdminShell>
      <AdminGameForm categories={categories} />
    </AdminShell>
  );
}
