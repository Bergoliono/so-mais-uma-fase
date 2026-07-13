# Setup do MVP Só Mais Uma Fase

## 1. Criar projeto Supabase

1. Acesse o Supabase e crie um novo projeto.
2. Anote:
   - Project URL
   - anon public key
   - service_role key

Use a `service_role key` somente no servidor. Nunca exponha essa chave no browser.

## 2. Criar banco de dados

1. Abra o SQL Editor do Supabase.
2. Copie todo o conteúdo de `supabase/schema.sql`.
3. Execute o SQL.

O script cria tabelas, índices, seeds básicos, views públicas seguras para ranking e policies RLS.

## 3. Configurar variáveis locais

Crie `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
ADMIN_EMAILS=seu-email@dominio.com
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
GAMEDISTRIBUTION_FEED_URL=
ADS_TXT_CONTENT=
```

Sem essas variáveis, o app continua funcionando com dados mockados.

`ADS_TXT_CONTENT` deve ser preenchido apenas quando o Google fornecer a linha oficial do `ads.txt`.

## 4. Configurar redirect de Auth

No Supabase:

1. Abra Authentication > URL Configuration.
2. Em Site URL, use `http://127.0.0.1:3000`.
3. Em Redirect URLs, adicione:
   - `http://127.0.0.1:3000/perfil`
   - `http://localhost:3000/perfil`

Se usar outra porta local, adicione essa porta também.

## 5. Rodar localmente

```bash
pnpm install
pnpm dev
```

Abra:

```text
http://127.0.0.1:3000
```

## 6. Testar fluxo real

1. Acesse `/login`.
2. Informe seu e-mail e use o link mágico.
3. Volte para `/perfil`.
4. Crie um username público.
5. Acesse `/jogos/sequencia-logica`.
6. Jogue até perder as 3 vidas.
7. Clique em `Salvar pontuação`.
8. Abra `/ranking` e confirme se o score aparece.
9. Abra `/perfil` e confira melhor score e últimas pontuações.

## 7. Regras de segurança do ranking

- Ranking oficial aceita somente jogos `official` e `ranked = true`.
- Scores negativos são rejeitados.
- Scores acima do limite plausível são rejeitados.
- Duração e metadata são validadas no servidor.
- E-mail não aparece publicamente.
- Ranking usa username/apelido público.
- Usuário sem username precisa criar um antes de aparecer no ranking.

## 8. QA sem Supabase

Sem `.env.local`, teste:

- `/`
- `/login`
- `/perfil`
- `/jogos/sequencia-logica`
- `/ranking`

O app deve funcionar com fallback mockado e avisar que Supabase não está configurado ao tentar salvar pontuação.

## 9. GameDistribution

Para sincronizar jogos reais:

1. Obtenha a URL do feed/API no painel publisher da GameDistribution.
2. Preencha `GAMEDISTRIBUTION_FEED_URL` no `.env.local`, ou cole a URL em `/admin/gamedistribution`.
3. Use `Pré-visualizar` antes de importar.
4. Use `Sincronizar catálogo` para salvar.

Tudo que entra por esse fluxo é salvo como:

- `type = external`
- `ranked = false`
- badge/tag `sem ranking`

Jogos externos nunca aparecem no ranking oficial.
