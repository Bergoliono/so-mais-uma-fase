Etapa: 2.5 - integração real, segurança básica e QA do fluxo de ranking

source visual truth path: C:\Users\Bergolino\.codex\generated_images\019f3ae2-c910-7ef3-8d75-94bd74f54b22\ig_0e0ca3cc790ba4be016a4c853092708191969bb42967dc8e92.png

implementation screenshots available from previous QA:
- C:\Users\Bergolino\Documents\New project\so-mais-uma-fase\qa-home-390.png
- C:\Users\Bergolino\Documents\New project\so-mais-uma-fase\qa-home-430.png
- C:\Users\Bergolino\Documents\New project\so-mais-uma-fase\qa-game-sequence-390.png
- C:\Users\Bergolino\Documents\New project\so-mais-uma-fase\qa-ranking-390.png
- C:\Users\Bergolino\Documents\New project\so-mais-uma-fase\qa-login-390.png
- C:\Users\Bergolino\Documents\New project\so-mais-uma-fase\qa-profile-390.png

latest Etapa 2.5 runtime screenshots: blocked
viewport target: 390 x 844 mobile, plus route checks for `/`, `/login`, `/perfil`, `/jogos/sequencia-logica`, `/ranking`
state: fallback mode, no Supabase `.env.local` present

**Findings**
- [P1] Updated runtime QA could not be completed.
  Location: local production server for Etapa 2.5.
  Evidence: build passed, but starting a fresh updated server was blocked by the approval/usage limit. The already-running `3003` server responded for old pages but returned `404` for the new `/api/scores`, proving it was stale.
  Impact: screenshots for the updated login/profile/API flow cannot be trusted until a fresh server is started.
  Fix: restart local server after approval/usage is available, then rerun `QA_BASE_URL=http://127.0.0.1:<porta> node scripts/capture-qa.mjs`.

**Verified**
- Production build passed after Etapa 2.5 changes.
- `.env.local` is not present, so Supabase real could not be tested.
- Text scan found no mojibake in modified Etapa 2.5 files.
- Existing stale server returned 200 for `/`, `/login`, `/perfil`, `/jogos/sequencia-logica`, `/ranking`, but not for new `/api/scores`.

**Implemented For Etapa 2.5**
- `SETUP.md` documents Supabase creation, schema execution, env vars, auth redirect, local run, and flow testing.
- `/api/scores` validates score submission on the server.
- Score save from the game now calls the API instead of direct client insert.
- Ranking data deduplicates by best score per user for the period.
- `/ranking` supports daily, weekly and monthly periods.
- Profile supports username/public name setup, best score, recent scores, mock medals and CTA to play.
- Login supports magic link and password mode with clear messages.
- SQL now includes public ranking view without e-mail exposure and profile self-insert policy.

**Supabase Real Test**
- Not run. No `.env.local` exists in this workspace.

**Implementation Checklist**
- Restart a fresh server.
- Test `/api/scores` without Supabase: should return fallback demo success.
- Configure Supabase and run `supabase/schema.sql`.
- Test login, create username, play, save score, ranking update, profile score list.
- Capture fresh QA screenshots.

final result: blocked

---

Etapa: 3 - admin de jogos externos por iframe

state: fallback mock/local sem `.env.local`, com build de produção validado pelo runtime embutido do Codex.

**Implemented**
- `/admin` com resumo do catálogo externo e indicação de modo mock/real.
- `/admin/jogos` com listagem de jogos externos, ações de publicar/despublicar, destaque e jogo do dia.
- `/admin/jogos/novo` com formulário completo para jogo externo.
- `/admin/jogos/[id]` com edição de jogo externo.
- APIs `/api/admin/games` e `/api/admin/games/[id]` para listar, criar, editar e aplicar ações rápidas.
- Escritas reais exigem sessão Supabase com e-mail presente em `ADMIN_EMAILS`.
- Sem Supabase, o admin funciona em modo mock/local para visualização.
- Seed mock e SQL com 10 jogos externos iniciais.
- Página pública `/jogos/[slug]` renderiza iframe para `type = external`.
- Jogos externos continuam `ranked = false` e recebem badge/tag `sem ranking`.

**Verified**
- Production build passed.
- Runtime route checks passed on `http://127.0.0.1:3015`:
  - `/` -> 200
  - `/admin` -> 200
  - `/admin/jogos` -> 200
  - `/admin/jogos/novo` -> 200
  - `/admin/jogos/10000000-0000-4000-8000-000000000001` -> 200
  - `/jogos/matematica-rapida` -> 200
  - `/ranking` -> 200
- External game check:
  - `/jogos/matematica-rapida` contains iframe.
  - `/jogos/matematica-rapida` shows `sem ranking`.
  - `/jogos/matematica-rapida` does not render `Ranking deste jogo`.
  - `/ranking` does not include external game titles tested: `Matemática Rápida`, `Blocos Relâmpago`, `Memória de Cores`.
- Admin validation check:
  - `POST /api/admin/games` with `iframe_url = javascript:alert(1)` returns 400.
- Final build check:
  - Production build passed after Etapa 3 changes.

**Screenshots**
- Existing screenshots from Etapa 2.5 remain available.
- New admin/external screenshots were attempted with `scripts/capture-qa.mjs`, but Chrome DevTools failed in this environment:
  - first attempt: `ECONNRESET`
  - second attempt with a new CDP port: unsettled top-level await before first capture
- Pending: rerun screenshots when headless Chrome/CDP is stable.

final result: build and route QA passed; visual screenshot refresh pending due Chrome/CDP environment failure

---

Etapa: 4 - catálogo real de jogos externos + SEO

state: fallback mock/local sem `.env.local`, com build de produção validado pelo runtime embutido do Codex.

**Implemented**
- Página pública de jogo externo melhorada com:
  - título forte;
  - descrição e instruções;
  - botão `Jogar agora`;
  - iframe responsivo;
  - badge `sem ranking`;
  - aviso discreto de que o jogo não participa do ranking oficial;
  - seção `Jogos parecidos`;
  - CTA para jogar Desafios Oficiais e entrar no ranking.
- SEO por jogo externo:
  - title no formato `[Nome do Jogo] - Jogue grátis online | Só Mais Uma Fase`;
  - meta description via `seo_description`;
  - Open Graph title/description/image;
  - canonical por jogo.
- `sitemap.xml` com home, ranking, categorias e jogos publicados.
- `robots.txt` permitindo o site e bloqueando `/admin`.
- Páginas de categoria:
  - `/categorias/matematica`
  - `/categorias/logica`
  - `/categorias/memoria`
  - `/categorias/quebra-cabeca`
  - `/categorias/jogos-rapidos`
  - `/categorias/relaxantes`
- Seed mock com 20 jogos externos publicados, todos `type = external` e `ranked = false`.
- `supabase/schema.sql` recebeu novas categorias e seed ampliada de jogos externos.
- Home passou a usar o catálogo publicado e ganhou blocos:
  - Desafio do Dia
  - Jogos com Ranking
  - Mais Jogados
  - Jogos Rápidos
  - Quebra-Cabeça
  - Relaxantes
  - Novos Jogos
- Admin melhorado com:
  - preview do iframe;
  - aviso claro de que jogo externo nunca terá ranking;
  - validação visual de URL;
  - botão `Salvar rascunho`;
  - botão `Publicar`;
  - campos obrigatórios destacados.

**Verified**
- Production build passed.
- Runtime route checks passed on `http://127.0.0.1:3016`:
  - `/` -> 200
  - `/jogos/matematica-rapida` -> 200
  - `/categorias/logica` -> 200
  - `/admin/jogos` -> 200
  - `/ranking` -> 200
  - `/sitemap.xml` -> 200
  - `/robots.txt` -> 200
- External game check:
  - `/jogos/matematica-rapida` contains iframe.
  - `/jogos/matematica-rapida` shows `sem ranking`.
  - `/jogos/matematica-rapida` does not render `Ranking deste jogo`.
- Admin API check:
  - `POST /api/admin/games` with safe `iframe_url` and local `/images/...` thumbnail returns 200 in mock mode.
  - `PATCH /api/admin/games/10000000-0000-4000-8000-000000000001` returns 200 in mock mode.
- Ranking isolation:
  - `/ranking` does not include external titles tested: `Matemática Rápida`, `Blocos Relâmpago`, `Soma Zen`.

**Screenshots**
- Screenshot capture was retried after Etapa 4 with a simpler browser CLI path.
- Chrome headless failed before writing PNGs because the GPU process was unusable in this Windows environment.
- Edge headless also failed to write PNGs; a minimal `about:blank` smoke capture produced no file.
- Existing screenshot assets from previous QA still available:
  - `qa-home-360.png`
  - `qa-home-390.png`
  - `qa-home-430.png`
  - `qa-home-desktop.png`
  - `qa-game-sequence-390.png`
  - `qa-ranking-390.png`
  - `qa-login-390.png`
  - `qa-profile-390.png`
  - `qa-hall-390.png`

final result: build and route/API QA passed; visual screenshot refresh pending due Chrome/CDP environment instability

---

Etapa: 4.1 - API real-ready para GameDistribution

state: integração preparada para feed/API real da GameDistribution, sem hardcode de URLs reais não verificadas.

**Implemented**
- `/admin/gamedistribution` para informar feed/API, pré-visualizar e sincronizar catálogo.
- `/api/admin/gamedistribution/sync` para ler JSON ou XML/RSS, normalizar jogos e importar.
- `/admin/jogos/importar` para importação em lote manual por CSV ou JSON.
- `/api/admin/games/import` para importação em lote validada no servidor.
- Normalizador GameDistribution em `src/lib/gamedistribution.ts`.
- `.env.example` e `SETUP.md` documentam `GAMEDISTRIBUTION_FEED_URL`.

**Safety Rules Preserved**
- Todo item importado por GameDistribution sai como `type = external`.
- Todo item importado por GameDistribution sai como `ranked = false`.
- Tags incluem `sem ranking`.
- Nenhuma alteração na lógica da Sequência Lógica.
- Nenhuma alteração no ranking oficial.

**Verified**
- Production build passed.
- Runtime route checks:
  - `/admin/gamedistribution` -> 200
  - `/admin/jogos/importar` -> 200
- `POST /api/admin/gamedistribution/sync` com feed JSON em `data:` e `dry_run=true` -> 200.
- Preview normalizou 1 jogo, 0 falhas, com tags `sem ranking, GameDistribution, puzzle, quick`.

**Real Catalog Note**
- Não foram hardcodados jogos reais da GameDistribution sem feed oficial, para não inventar URLs de iframe/assets.
- Assim que `GAMEDISTRIBUTION_FEED_URL` estiver preenchido, a API importa os jogos reais pelo fluxo definitivo.

final result: API de sincronização real-ready criada e build passando

---

Etapa: 4.2 - preparação para domínio, aprovação e deploy

state: domínio `somaisumafase.com.br` escolhido para compra e preparação de páginas públicas de confiança.

**Implemented**
- Páginas institucionais:
  - `/sobre`
  - `/privacidade`
  - `/termos`
  - `/contato`
- Rodapé público com links legais.
- Rodapé adicionado na home, páginas de jogo e páginas de categoria.
- Sitemap atualizado com páginas institucionais.
- `DEPLOY.md` criado com checklist de domínio, Vercel, Supabase, GameDistribution e regras do produto.

**Purpose**
- Aumentar chance de aprovação futura em GameDistribution/AdSense/GAM.
- Deixar o MVP apresentável em domínio próprio.
- Evitar travar a jornada por falta de páginas básicas de confiança.

**Rules Preserved**
- Nenhuma alteração na lógica da Sequência Lógica.
- Nenhuma alteração no ranking oficial.
- Jogos externos continuam fora do ranking.

---

Etapa: 4.3 - preparação técnica para Vercel, domínio e AdSense/GAM

state: projeto preparado para deploy futuro sem depender do terminal local do Windows.

**Implemented**
- `vercel.json` com build/install command para Vercel e headers básicos de segurança.
- `/api/health` para checagem simples de disponibilidade em produção.
- `/ads.txt` dinâmico usando `ADS_TXT_CONTENT`, mantendo placeholder enquanto AdSense/GAM não estiver aprovado.
- `.env.example`, `SETUP.md` e `DEPLOY.md` atualizados com `ADS_TXT_CONTENT`.

**Verified**
- Production build passed.
- Runtime route checks em servidor Next temporário:
  - `/` -> 200
  - `/ads.txt` -> 200
  - `/api/health` -> 200
  - `/sobre` -> 200
  - `/privacidade` -> 200
  - `/termos` -> 200
  - `/contato` -> 200
  - `/admin/gamedistribution` -> 200
  - `/admin/jogos` -> 200
  - `/jogos/matematica-rapida` -> 200
  - `/categorias/logica` -> 200
  - `/ranking` -> 200
- Ranking oficial verificado sem jogos externos.

**Screenshots**
- Nova tentativa de screenshot foi executada pelo script de QA.
- A captura foi bloqueada pelo Edge headless do ambiente antes de gerar PNG, com erro de permissão/atualização do Edge.
- Screenshots anteriores continuam no repositório para referência visual.

**Deploy**
- Tentativa de deploy via conector Vercel foi iniciada.
- O conector bloqueou a ação por segurança porque deploy envia código/configuração para serviço externo.
- Próxima tentativa exige confirmação explícita do dono do projeto aceitando esse envio externo.
- Após confirmação explícita do dono do projeto, nova tentativa foi feita.
- O ambiente bloqueou novamente o deploy por política de transferência externa e instruiu a não contornar por outro caminho.

final result: build e QA de rotas passaram; deploy externo bloqueado pela política do ambiente

---

Etapa: 4.4 - ajuste responsivo desktop

state: site deixa de parecer um celular centralizado em telas grandes e passa a abrir como portal no desktop.

**Implemented**
- Home mantém mobile-first no celular.
- Em desktop, a home usa largura ampla com navegação superior.
- Cards deixam de ser apenas carrossel horizontal e passam a formar grades responsivas.
- Hero "Desafio do Dia" fica maior e com composição de portal.
- Área de comunidade/ranking ganha painel lateral com pódio no desktop.
- Bottom navigation fica visível apenas no mobile.
- Rodapé não reserva mais espaço de bottom navigation em desktop.

**Verified**
- Production build passed.

final result: versão desktop preparada para parecer portal, mantendo experiência mobile intacta
