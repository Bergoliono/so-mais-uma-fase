import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata = {
  title: "Contato | Só Mais Uma Fase",
  description: "Entre em contato com o Só Mais Uma Fase."
};

export default function ContactPage() {
  return (
    <LegalPage title="Contato" description="Canal para dúvidas, parcerias, remoção de conteúdo e suporte.">
      <LegalSection title="E-mail">
        <p>Use este e-mail provisório até configurarmos o domínio final:</p>
        <p className="rounded-lg border border-line bg-zinc-50 p-3 font-black text-ink">contato@somaisumafase.com.br</p>
      </LegalSection>
      <LegalSection title="Parcerias e jogos">
        <p>Para jogos externos, analisamos apenas conteúdo compatível com jogos casuais, puzzle, lógica, memória, matemática e raciocínio.</p>
      </LegalSection>
      <LegalSection title="Remoção de conteúdo">
        <p>Se algum conteúdo externo precisar ser removido, envie o link da página e o motivo da solicitação.</p>
      </LegalSection>
    </LegalPage>
  );
}
