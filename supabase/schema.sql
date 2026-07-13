create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  avatar_url text null,
  public_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text null,
  icon text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null,
  seo_description text not null,
  instructions text null,
  category_id uuid null references public.categories(id) on delete set null,
  type text not null check (type in ('external', 'official')),
  ranked boolean not null default false,
  iframe_url text null,
  component_key text null,
  thumbnail_url text null,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  daily_challenge boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_ranked_only_official check (ranked = false or type = 'official'),
  constraint games_external_have_iframe check (type <> 'external' or iframe_url is not null),
  constraint games_official_have_component check (type <> 'official' or component_key is not null)
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 1000000),
  level integer null,
  duration_seconds integer null,
  metadata jsonb null,
  period_day date not null default current_date,
  period_week text not null default to_char(now(), 'IYYY-"W"IW'),
  period_month text not null default to_char(now(), 'YYYY-MM'),
  suspicious boolean not null default false,
  valid boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.medals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid null references public.games(id) on delete cascade,
  medal_type text not null,
  title text not null,
  description text null,
  period text null,
  created_at timestamptz not null default now()
);

create table if not exists public.hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid null references public.games(id) on delete cascade,
  period_month text not null,
  position integer not null,
  score integer not null,
  medal_type text not null,
  public_card_url text null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid null references public.games(id) on delete set null,
  user_id uuid null references public.profiles(id) on delete set null,
  event_type text not null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create or replace view public.public_profiles as
select
  id,
  coalesce(public_name, username, 'Jogador') as display_name,
  username,
  avatar_url
from public.profiles;

create or replace view public.public_ranking_scores as
select
  scores.id,
  scores.user_id,
  scores.game_id,
  scores.score,
  scores.level,
  scores.duration_seconds,
  scores.metadata,
  scores.period_day,
  scores.period_week,
  scores.period_month,
  scores.created_at,
  public_profiles.username,
  public_profiles.display_name,
  public_profiles.avatar_url
from public.scores
join public.public_profiles on public_profiles.id = scores.user_id
where scores.valid = true
  and scores.suspicious = false
  and public_profiles.username is not null;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.games enable row level security;
alter table public.scores enable row level security;
alter table public.medals enable row level security;
alter table public.hall_of_fame enable row level security;
alter table public.game_events enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
for select using (true);

drop policy if exists "published_games_public_read" on public.games;
create policy "published_games_public_read" on public.games
for select using (status = 'published');

drop policy if exists "valid_scores_public_read" on public.scores;
create policy "valid_scores_public_read" on public.scores
for select using (valid = true and suspicious = false);

drop policy if exists "users_insert_own_official_scores" on public.scores;
create policy "users_insert_own_official_scores" on public.scores
for insert with check (
  auth.uid() = user_id
  and score >= 0
  and score <= 1000000
  and exists (
    select 1
    from public.games
    where games.id = scores.game_id
      and games.type = 'official'
      and games.ranked = true
      and games.status = 'published'
  )
);

drop policy if exists "medals_self_read" on public.medals;
create policy "medals_self_read" on public.medals
for select using (auth.uid() = user_id);

drop policy if exists "hall_of_fame_public_read" on public.hall_of_fame;
create policy "hall_of_fame_public_read" on public.hall_of_fame
for select using (true);

drop policy if exists "game_events_insert_anyone" on public.game_events;
create policy "game_events_insert_anyone" on public.game_events
for insert with check (true);

drop policy if exists "game_events_admin_read" on public.game_events;
create policy "game_events_admin_read" on public.game_events
for select using (false);

create index if not exists categories_slug_idx on public.categories(slug);
create index if not exists games_slug_idx on public.games(slug);
create index if not exists games_status_type_idx on public.games(status, type);
create index if not exists scores_game_day_idx on public.scores(game_id, period_day, valid, suspicious, score desc);
create index if not exists scores_game_week_idx on public.scores(game_id, period_week, valid, suspicious, score desc);
create index if not exists scores_game_month_idx on public.scores(game_id, period_month, valid, suspicious, score desc);

insert into public.categories (name, slug, description, icon, sort_order)
values
  ('Lógica', 'logica', 'Desafios de raciocínio e padrões.', 'Brain', 1),
  ('Matemática', 'matematica', 'Contas rápidas e números.', 'Calculator', 2),
  ('Memória', 'memoria', 'Jogos curtos de atenção e memória.', 'Cards', 3),
  ('Quebra-Cabeça', 'quebra-cabeca', 'Jogos de encaixe, padrões e solução visual.', 'PuzzlePiece', 4),
  ('Jogos Rápidos', 'jogos-rapidos', 'Partidas curtas para jogar em poucos minutos.', 'Lightning', 5),
  ('Relaxantes', 'relaxantes', 'Jogos leves para passar o tempo sem pressão.', 'Sparkle', 6)
on conflict (slug) do nothing;

update public.games
set status = 'published', ranked = false, type = 'external'
where slug in (
  'matematica-rapida',
  'blocos-relampago',
  'memoria-de-cores',
  'labirinto-mental',
  'palavras-rapidas',
  'padroes-visuais',
  'conta-express',
  'rota-dos-pontos',
  'quebra-codigos',
  'reflexo-numerico',
  'soma-zen',
  'jardim-de-pares',
  'linha-perfeita',
  'sequencia-flash',
  'mosaico-leve',
  'caca-simbolos',
  'memoria-flash-externo',
  'trilha-logica',
  'numeros-calmos',
  'encaixe-rapido'
);

update public.games
set status = 'published'
where type = 'external'
  and slug in ('rota-dos-pontos', 'quebra-codigos');

insert into public.games (
  title,
  slug,
  short_description,
  seo_description,
  instructions,
  category_id,
  type,
  ranked,
  iframe_url,
  thumbnail_url,
  tags,
  status,
  featured,
  daily_challenge
)
values
  (
    'Soma Zen',
    'soma-zen',
    'Faça contas leves em um ritmo tranquilo.',
    'Jogue Soma Zen grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'relaxantes'),
    'external',
    false,
    'https://example.com/embed/soma-zen',
    '/images/conta-certa.png',
    array['sem ranking', 'relaxante', 'matemática'],
    'published',
    false,
    false
  ),
  (
    'Jardim de Pares',
    'jardim-de-pares',
    'Combine pares visuais em rodadas calmas.',
    'Jogue Jardim de Pares grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'memoria'),
    'external',
    false,
    'https://example.com/embed/jardim-de-pares',
    '/images/memoria.png',
    array['sem ranking', 'memória', 'relaxante'],
    'published',
    false,
    false
  ),
  (
    'Linha Perfeita',
    'linha-perfeita',
    'Organize linhas e formas com poucos movimentos.',
    'Jogue Linha Perfeita grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'quebra-cabeca'),
    'external',
    false,
    'https://example.com/embed/linha-perfeita',
    '/images/caminhos.png',
    array['sem ranking', 'quebra-cabeça'],
    'published',
    false,
    false
  ),
  (
    'Sequência Flash',
    'sequencia-flash',
    'Leia padrões rápidos e escolha a continuação.',
    'Jogue Sequência Flash grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'jogos-rapidos'),
    'external',
    false,
    'https://example.com/embed/sequencia-flash',
    '/images/sequencia-logica.png',
    array['sem ranking', 'rápido', 'lógica'],
    'published',
    false,
    false
  ),
  (
    'Mosaico Leve',
    'mosaico-leve',
    'Monte padrões visuais sem pressa.',
    'Jogue Mosaico Leve grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'relaxantes'),
    'external',
    false,
    'https://example.com/embed/mosaico-leve',
    '/images/caminhos.png',
    array['sem ranking', 'relaxante', 'quebra-cabeça'],
    'published',
    false,
    false
  ),
  (
    'Caça Símbolos',
    'caca-simbolos',
    'Encontre símbolos repetidos em uma grade limpa.',
    'Jogue Caça Símbolos grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'jogos-rapidos'),
    'external',
    false,
    'https://example.com/embed/caca-simbolos',
    '/images/caca-palavras.png',
    array['sem ranking', 'rápido', 'observação'],
    'published',
    false,
    false
  ),
  (
    'Memória Flash',
    'memoria-flash-externo',
    'Teste sua memória visual em partidas de um minuto.',
    'Jogue Memória Flash grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'memoria'),
    'external',
    false,
    'https://example.com/embed/memoria-flash-externo',
    '/images/memoria.png',
    array['sem ranking', 'memória', 'rápido'],
    'published',
    false,
    false
  ),
  (
    'Trilha Lógica',
    'trilha-logica',
    'Siga pistas simples até a solução.',
    'Jogue Trilha Lógica grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'logica'),
    'external',
    false,
    'https://example.com/embed/trilha-logica',
    '/images/caminhos.png',
    array['sem ranking', 'lógica', 'raciocínio'],
    'published',
    false,
    false
  ),
  (
    'Números Calmos',
    'numeros-calmos',
    'Resolva números em uma experiência leve.',
    'Jogue Números Calmos grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'relaxantes'),
    'external',
    false,
    'https://example.com/embed/numeros-calmos',
    '/images/conta-certa.png',
    array['sem ranking', 'relaxante', 'matemática'],
    'published',
    false,
    false
  ),
  (
    'Encaixe Rápido',
    'encaixe-rapido',
    'Resolva encaixes simples em poucos segundos.',
    'Jogue Encaixe Rápido grátis online no Só Mais Uma Fase. Um jogo rápido para testar seu cérebro, sem ranking oficial.',
    'Clique em Jogar agora e aguarde o iframe carregar. Este jogo externo não participa do ranking oficial.',
    (select id from public.categories where slug = 'jogos-rapidos'),
    'external',
    false,
    'https://example.com/embed/encaixe-rapido',
    '/images/caminhos.png',
    array['sem ranking', 'rápido', 'quebra-cabeça', 'novo'],
    'published',
    false,
    false
  )
on conflict (slug) do nothing;

update public.games
set status = 'published', ranked = false, type = 'external'
where slug in (
  'matematica-rapida',
  'blocos-relampago',
  'memoria-de-cores',
  'labirinto-mental',
  'palavras-rapidas',
  'padroes-visuais',
  'conta-express',
  'rota-dos-pontos',
  'quebra-codigos',
  'reflexo-numerico',
  'soma-zen',
  'jardim-de-pares',
  'linha-perfeita',
  'sequencia-flash',
  'mosaico-leve',
  'caca-simbolos',
  'memoria-flash-externo',
  'trilha-logica',
  'numeros-calmos',
  'encaixe-rapido'
);

insert into public.games (
  title,
  slug,
  short_description,
  seo_description,
  instructions,
  category_id,
  type,
  ranked,
  component_key,
  thumbnail_url,
  tags,
  status,
  featured,
  daily_challenge
)
select
  'Sequência Lógica',
  'sequencia-logica',
  'Descubra o próximo número antes do tempo acabar.',
  'Jogue Sequência Lógica online: um desafio rápido de raciocínio com ranking oficial.',
  'Observe a sequência e escolha a próxima resposta. Você tem 3 vidas.',
  categories.id,
  'official',
  true,
  'sequence-logic',
  '/images/sequencia-logica.png',
  array['ranking oficial', 'desafio do dia', 'lógica'],
  'published',
  true,
  true
from public.categories
where categories.slug = 'logica'
on conflict (slug) do nothing;

insert into public.games (
  title,
  slug,
  short_description,
  seo_description,
  instructions,
  category_id,
  type,
  ranked,
  iframe_url,
  thumbnail_url,
  tags,
  status,
  featured,
  daily_challenge
)
values
  (
    'Matemática Rápida',
    'matematica-rapida',
    'Resolva operações simples em partidas curtas.',
    'Jogue Matemática Rápida online: um jogo externo curto, leve e sem ranking oficial.',
    'Jogo externo carregado por iframe. A pontuação interna não conta para o ranking oficial.',
    (select id from public.categories where slug = 'matematica'),
    'external',
    false,
    'https://example.com/embed/matematica-rapida',
    '/images/conta-certa.png',
    array['sem ranking', 'rápido', 'matemática'],
    'published',
    true,
    false
  ),
  (
    'Blocos Relâmpago',
    'blocos-relampago',
    'Encaixe blocos por padrão visual antes do tempo acabar.',
    'Jogue Blocos Relâmpago online: jogo externo de lógica visual sem ranking oficial.',
    'Jogo externo carregado por iframe. Use o mouse ou toque para interagir.',
    (select id from public.categories where slug = 'logica'),
    'external',
    false,
    'https://example.com/embed/blocos-relampago',
    '/images/caminhos.png',
    array['sem ranking', 'lógica', 'rápido'],
    'published',
    true,
    false
  ),
  (
    'Memória de Cores',
    'memoria-de-cores',
    'Memorize sequências de cores em rodadas rápidas.',
    'Jogue Memória de Cores online: treino rápido de memória sem ranking oficial.',
    'Repita a sequência exibida no iframe. O resultado não participa do ranking.',
    (select id from public.categories where slug = 'memoria'),
    'external',
    false,
    'https://example.com/embed/memoria-de-cores',
    '/images/memoria.png',
    array['sem ranking', 'memória', 'rápido'],
    'published',
    false,
    false
  ),
  (
    'Labirinto Mental',
    'labirinto-mental',
    'Escolha caminhos curtos usando atenção e raciocínio.',
    'Jogue Labirinto Mental online: jogo externo de raciocínio sem ranking oficial.',
    'Encontre a rota no menor número de movimentos dentro do jogo externo.',
    (select id from public.categories where slug = 'logica'),
    'external',
    false,
    'https://example.com/embed/labirinto-mental',
    '/images/caminhos.png',
    array['sem ranking', 'raciocínio'],
    'published',
    false,
    false
  ),
  (
    'Palavras Rápidas',
    'palavras-rapidas',
    'Encontre palavras curtas em uma grade limpa.',
    'Jogue Palavras Rápidas online: jogo externo casual sem ranking oficial.',
    'Procure palavras no iframe. Esta pontuação não entra no ranking oficial.',
    (select id from public.categories where slug = 'logica'),
    'external',
    false,
    'https://example.com/embed/palavras-rapidas',
    '/images/caca-palavras.png',
    array['sem ranking', 'rápido', 'palavras'],
    'published',
    false,
    false
  ),
  (
    'Padrões Visuais',
    'padroes-visuais',
    'Complete padrões visuais sem pressão.',
    'Jogue Padrões Visuais online: jogo externo de observação sem ranking oficial.',
    'Observe o padrão e escolha a peça correta dentro do iframe.',
    (select id from public.categories where slug = 'logica'),
    'external',
    false,
    'https://example.com/embed/padroes-visuais',
    '/images/sequencia-logica.png',
    array['sem ranking', 'lógica'],
    'published',
    false,
    false
  ),
  (
    'Conta Express',
    'conta-express',
    'Acerte contas rápidas em sequência.',
    'Jogue Conta Express online: jogo externo de matemática rápida sem ranking oficial.',
    'Resolva as contas no iframe. Para ranking oficial, jogue os desafios próprios do site.',
    (select id from public.categories where slug = 'matematica'),
    'external',
    false,
    'https://example.com/embed/conta-express',
    '/images/conta-certa.png',
    array['sem ranking', 'matemática', 'rápido'],
    'published',
    false,
    false
  ),
  (
    'Rota dos Pontos',
    'rota-dos-pontos',
    'Conecte pontos com poucos movimentos.',
    'Jogue Rota dos Pontos online: jogo externo de lógica sem ranking oficial.',
    'Conecte os pontos dentro do iframe seguindo as regras do jogo externo.',
    (select id from public.categories where slug = 'logica'),
    'external',
    false,
    'https://example.com/embed/rota-dos-pontos',
    '/images/caminhos.png',
    array['sem ranking', 'raciocínio'],
    'draft',
    false,
    false
  ),
  (
    'Quebra Códigos',
    'quebra-codigos',
    'Descubra combinações usando pistas simples.',
    'Jogue Quebra Códigos online: jogo externo de lógica dedutiva sem ranking oficial.',
    'Use as pistas do iframe para encontrar a combinação correta.',
    (select id from public.categories where slug = 'logica'),
    'external',
    false,
    'https://example.com/embed/quebra-codigos',
    '/images/sequencia-logica.png',
    array['sem ranking', 'lógica', 'novo'],
    'draft',
    false,
    false
  ),
  (
    'Reflexo Numérico',
    'reflexo-numerico',
    'Toque nos números certos na ordem mais rápida.',
    'Jogue Reflexo Numérico online: jogo externo rápido sem ranking oficial.',
    'Siga os números dentro do iframe. O desempenho não é salvo no ranking.',
    (select id from public.categories where slug = 'matematica'),
    'external',
    false,
    'https://example.com/embed/reflexo-numerico',
    '/images/conta-certa.png',
    array['sem ranking', 'matemática', 'novo'],
    'published',
    false,
    false
  )
on conflict (slug) do nothing;

update public.games
set status = 'published', ranked = false, type = 'external'
where slug in (
  'matematica-rapida',
  'blocos-relampago',
  'memoria-de-cores',
  'labirinto-mental',
  'palavras-rapidas',
  'padroes-visuais',
  'conta-express',
  'rota-dos-pontos',
  'quebra-codigos',
  'reflexo-numerico',
  'soma-zen',
  'jardim-de-pares',
  'linha-perfeita',
  'sequencia-flash',
  'mosaico-leve',
  'caca-simbolos',
  'memoria-flash-externo',
  'trilha-logica',
  'numeros-calmos',
  'encaixe-rapido'
);
