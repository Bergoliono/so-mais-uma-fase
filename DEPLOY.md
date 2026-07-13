# Deploy do Só Mais Uma Fase

## Objetivo

Colocar o MVP no ar em `https://somaisumafase.com.br`, com Supabase, domínio e base pronta para GameDistribution/AdSense/GAM.

## 1. Domínio

No Registro.br:

- comprar `somaisumafase.com.br`;
- manter DNS padrão por enquanto, se ainda não houver projeto Vercel criado;
- depois apontar DNS para Vercel.

## 2. Variáveis de ambiente

Na Vercel, configurar:

```env
NEXT_PUBLIC_SITE_URL=https://somaisumafase.com.br
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
GAMEDISTRIBUTION_FEED_URL=
ADS_TXT_CONTENT=
```

`GAMEDISTRIBUTION_FEED_URL` pode ficar vazio até a conta/painel liberar o feed real.

## 3. Supabase

1. Criar projeto Supabase.
2. Rodar `supabase/schema.sql`.
3. Configurar Auth redirect:
   - `https://somaisumafase.com.br/perfil`
   - URL temporária da Vercel, se necessário.
4. Adicionar seu e-mail em `ADMIN_EMAILS`.

## 4. Páginas necessárias para aprovação

Antes de enviar para AdSense/GameDistribution, conferir:

- `/sobre`
- `/privacidade`
- `/termos`
- `/contato`
- `/sitemap.xml`
- `/robots.txt`
- `/ads.txt`
- `/api/health`

`ADS_TXT_CONTENT` deve ficar vazio até existir o publisher id correto. Quando AdSense/GAM liberar, preencher com o conteúdo oficial fornecido pelo Google.

## 5. GameDistribution

No cadastro:

- domínio: `somaisumafase.com.br`
- se pedir `www`: adicionar `www.somaisumafase.com.br`
- se pedir GAM e não aceitar pular, concluir Google Ad Manager primeiro.

Depois que o feed/API estiver disponível:

1. Abrir `/admin/gamedistribution`.
2. Colar a URL do feed/API ou preencher `GAMEDISTRIBUTION_FEED_URL`.
3. Rodar `Pré-visualizar`.
4. Importar primeiro como `draft`.
5. Revisar títulos, descrições, thumbnails e categorias.
6. Publicar os jogos aprovados.

## 6. Regras que não mudam

- Jogos externos são `type = external`.
- Jogos externos são `ranked = false`.
- Jogos externos não aparecem no ranking oficial.
- Ranking oficial é só para jogos próprios.
- Não há apostas, sorteios ou prêmios em dinheiro.

## 7. Checklist final

- Build passando.
- Home carrega.
- Jogo externo abre iframe.
- Sequência Lógica funciona.
- Ranking não lista jogos externos.
- Admin acessível para e-mails autorizados.
- Páginas legais publicadas.
