import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Entrar | Só Mais Uma Fase"
};

export default function LoginPage() {
  return <LoginForm />;
}
