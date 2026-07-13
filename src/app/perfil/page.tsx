import type { Metadata } from "next";
import { ProfilePanel } from "@/components/profile-panel";

export const metadata: Metadata = {
  title: "Perfil | Só Mais Uma Fase"
};

export default function ProfilePage() {
  return <ProfilePanel />;
}
