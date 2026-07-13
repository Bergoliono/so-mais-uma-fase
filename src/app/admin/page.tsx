import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { mockGames } from "@/lib/game-data";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export const metadata = {
  title: "Admin | Só Mais Uma Fase"
};

export default function AdminPage() {
  const externalGames = mockGames.filter((game) => game.type === "external");
  const published = externalGames.filter((game) => game.status === "published").length;
  const drafts = externalGames.filter((game) => game.status === "draft").length;

  return (
    <AdminShell>
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="externos mock" value={externalGames.length} />
        <StatCard label="publicados" value={published} />
        <StatCard label="rascunhos" value={drafts} />
      </section>

      <section className="mt-4 rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Catálogo GameDistribution</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-muted">
              Esta etapa prepara o cadastro de jogos externos por iframe. Eles aparecem no catálogo e na página pública de jogo, mas continuam sem ranking oficial.
            </p>
            <p className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/10 p-3 text-sm font-bold text-teal-800">
              {hasSupabaseConfig
                ? "Supabase configurado: ações reais exigem login com e-mail presente em ADMIN_EMAILS."
                : "Supabase não configurado: admin operando em modo mock/local para visualização."}
            </p>
          </div>
          <Link href="/admin/jogos" className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-black text-white">
            Gerenciar jogos
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
    </div>
  );
}
