import { AdminGameDistributionSync } from "@/components/admin/admin-gamedistribution-sync";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = {
  title: "GameDistribution | Só Mais Uma Fase"
};

export default function AdminGameDistributionPage() {
  return (
    <AdminShell>
      <AdminGameDistributionSync />
    </AdminShell>
  );
}
