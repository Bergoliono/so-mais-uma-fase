import { AdminImportForm } from "@/components/admin/admin-import-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCategories } from "@/lib/game-data";

export const metadata = {
  title: "Importar Jogos | Só Mais Uma Fase"
};

export default async function ImportGamesPage() {
  const categories = await getCategories();

  return (
    <AdminShell>
      <AdminImportForm categories={categories} />
    </AdminShell>
  );
}
