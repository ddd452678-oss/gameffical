-- ═══════════════════════════════════════════════════════════════════════════
-- 마이그레이션: 좋아요(게임/리뷰), 자유게시판, 선호 장르
-- 기존 DB 에서 1회 실행 (Supabase Dashboard → SQL Editor). 신규 설치는
-- schema.sql 에 이미 포함됨.
-- ═══════════════════════════════════════════════════════════════════════════

-- 선호 장르
alter table public.profiles add column if not exists preferred_genres text[] not null default '{}';

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 게임 좋아요
create table if not exists public.game_likes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  game_id    bigint not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);
alter table public.game_likes enable row level security;
drop policy if exists "game_likes are public readable" on public.game_likes;
create policy "game_likes are public readable" on public.game_likes for select using (true);
drop policy if exists "users can like as themselves" on public.game_likes;
create policy "users can like as themselves"
  on public.game_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users can unlike own like" on public.game_likes;
create policy "users can unlike own like"
  on public.game_likes for delete to authenticated using (auth.uid() = user_id);
create or replace view public.game_like_counts as
  select game_id, count(*)::int as like_count from public.game_likes group by game_id;

-- 리뷰 좋아요
create table if not exists public.review_likes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  review_id  uuid not null references public.reviews(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);
alter table public.review_likes enable row level security;
drop policy if exists "review_likes are public readable" on public.review_likes;
create policy "review_likes are public readable" on public.review_likes for select using (true);
drop policy if exists "users can like reviews as themselves" on public.review_likes;
create policy "users can like reviews as themselves"
  on public.review_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users can unlike own review like" on public.review_likes;
create policy "users can unlike own review like"
  on public.review_likes for delete to authenticated using (auth.uid() = user_id);
create or replace view public.review_like_counts as
  select review_id, count(*)::int as like_count from public.review_likes group by review_id;

-- 자유게시판
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '익명',
  title       text not null check (char_length(title) between 1 and 200),
  body        text not null check (char_length(body) between 1 and 10000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
alter table public.posts enable row level security;
drop policy if exists "posts are public readable" on public.posts;
create policy "posts are public readable" on public.posts for select using (true);
drop policy if exists "authenticated users can insert own post" on public.posts;
create policy "authenticated users can insert own post"
  on public.posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users can update own post" on public.posts;
create policy "users can update own post"
  on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users can delete own post" on public.posts;
create policy "users can delete own post"
  on public.posts for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '익명',
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index if not exists post_comments_post_id_idx on public.post_comments (post_id, created_at asc);
alter table public.post_comments enable row level security;
drop policy if exists "post_comments are public readable" on public.post_comments;
create policy "post_comments are public readable" on public.post_comments for select using (true);
drop policy if exists "authenticated users can insert own comment" on public.post_comments;
create policy "authenticated users can insert own comment"
  on public.post_comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users can delete own comment" on public.post_comments;
create policy "users can delete own comment"
  on public.post_comments for delete to authenticated using (auth.uid() = user_id);
