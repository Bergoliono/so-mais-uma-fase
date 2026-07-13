import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata = {
  title: "Termos de Uso | Só Mais Uma Fase",
  description: "Termos de uso do portal Só Mais Uma Fase."
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso" description="Regras básicas para usar o Só Mais Uma Fase.">
      <LegalSection title="Uso do site">
        <p>O site é voltado a jogos rápidos e desafios casuais. O uso deve respeitar as regras da plataforma e a experiência de outros usuários.</p>
      </LegalSection>
      <LegalSection title="Ranking oficial">
        <p>Ranking oficial vale apenas para jogos próprios identificados como desafios oficiais.</p>
        <p>Jogos externos por iframe não participam do ranking oficial.</p>
      </LegalSection>
      <LegalSection title="Premiação virtual">
        <p>Medalhas, Hall da Fama e destaques são virtuais. Não há promessa de prêmio físico, sorteio, aposta ou pagamento em dinheiro.</p>
      </LegalSection>
      <LegalSection title="Jogos de terceiros">
        <p>Jogos externos podem ser fornecidos por parceiros e carregados por iframe. A disponibilidade desses jogos pode mudar.</p>
      </LegalSection>
    </LegalPage>
  );
}
