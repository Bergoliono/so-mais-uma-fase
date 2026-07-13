import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata = {
  title: "Política de Privacidade | Só Mais Uma Fase",
  description: "Política de privacidade do Só Mais Uma Fase."
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade" description="Como tratamos dados de conta, ranking, navegação e jogos externos.">
      <LegalSection title="Dados de conta">
        <p>Quando o login estiver ativo, poderemos usar e-mail, identificador de usuário, username público e nome público para autenticação e perfil.</p>
      </LegalSection>
      <LegalSection title="Pontuação e ranking">
        <p>Jogos oficiais podem salvar pontuação, nível, duração da partida e metadados do desempenho para montar rankings e histórico do perfil.</p>
        <p>E-mail não é exibido publicamente no ranking.</p>
      </LegalSection>
      <LegalSection title="Jogos externos">
        <p>Jogos externos são carregados por iframe. Esses jogos podem ter políticas próprias de privacidade e tecnologia de terceiros.</p>
      </LegalSection>
      <LegalSection title="Anúncios">
        <p>O site foi preparado para monetização futura, mas anúncios não são parte obrigatória do uso do MVP.</p>
      </LegalSection>
      <LegalSection title="Contato">
        <p>Para dúvidas de privacidade, use a página de contato do site.</p>
      </LegalSection>
    </LegalPage>
  );
}
