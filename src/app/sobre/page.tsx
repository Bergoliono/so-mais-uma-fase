import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata = {
  title: "Sobre | Só Mais Uma Fase",
  description: "Conheça o Só Mais Uma Fase, um portal de jogos rápidos para testar seu cérebro."
};

export default function AboutPage() {
  return (
    <LegalPage title="Sobre" description="Um portal mobile-first de jogos rápidos, desafios de cérebro e partidas casuais para passar o tempo.">
      <LegalSection title="O que é">
        <p>
          Só Mais Uma Fase reúne jogos rápidos de lógica, memória, matemática, quebra-cabeça e desafios de raciocínio. A proposta é abrir, jogar e seguir o dia.
        </p>
      </LegalSection>
      <LegalSection title="Jogos externos e desafios oficiais">
        <p>Jogos externos são carregados por iframe e não participam do ranking oficial.</p>
        <p>Desafios oficiais são jogos próprios do projeto, com pontuação controlada, ranking e medalhas virtuais.</p>
      </LegalSection>
      <LegalSection title="Sem aposta">
        <p>O site não oferece apostas, sorteios, cassino, prêmios em dinheiro ou prêmios físicos.</p>
      </LegalSection>
    </LegalPage>
  );
}
