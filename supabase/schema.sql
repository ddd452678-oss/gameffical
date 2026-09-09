-- ═══════════════════════════════════════════════════════════════════════════
-- 겜피셜 (GamPicial) — Supabase 스키마
-- Supabase Dashboard → SQL Editor 에 붙여넣고 실행하세요.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────
-- 0. 확장: 이름 검색용 trigram
--    반드시 이 확장을 쓰는 인덱스보다 먼저 생성해야 한다.
--    Supabase 는 확장을 extensions 스키마에 설치한다.
-- ───────────────────────────────────────────────
create extension if not exists pg_trgm with schema extensions;

-- ───────────────────────────────────────────────
-- 1. games : 외부 공식 API(RAWG/IGDB/Steam)에서 가져온 게임 카탈로그 캐시
--    유저 요청마다 외부 API 를 호출하지 않기 위한 캐시 테이블
-- ───────────────────────────────────────────────
create table if not exists public.games (
  id                bigint primary key,               -- RAWG 게임 id (원본 id 그대로 사용)
  slug              text not null unique,
  name              text not null,
  description       text,                             -- 한 문단 소개 (plain text)
  background_image  text,                             -- 대표 이미지 URL
  genres            text[] not null default '{}',
  -- 정규화된 플랫폼 구분: 'pc' | 'mobile' | 'console' 중 해당되는 것 모두
  platform_kinds    text[] not null default '{}',
  raw_platforms     jsonb,                            -- 원본 플랫폼 정보 (표시용)
  released          date,
  metacritic        int,                              -- 0~100
  rawg_rating       numeric(3,2),                     -- RAWG 집계 평점 0.00~5.00
  rawg_ratings_count int not null default 0,
  stores            jsonb,                            -- [{store, url}] 구매/설치 링크
  steam_appid       text,
  steam_positive_pct int,                             -- Steam 긍정 리뷰 비율 %
  steam_review_count int,
  metadata_updated_at timestamptz not null default now(),  -- 카탈로그 갱신 시각 (일~주 주기)
  ratings_updated_at  timestamptz not null default now(),  -- 평점 갱신 시각 (시간~일 주기)
  created_at          timestamptz not null default now()
);

create index if not exists games_platform_kinds_idx on public.games using gin (platform_kinds);
create index if not exists games_name_trgm_idx on public.games using gin (name extensions.gin_trgm_ops);

-- ───────────────────────────────────────────────
-- 2. reviews : 100% 자체 생성 유저 리뷰
-- ───────────────────────────────────────────────
create table if not exists public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  game_id            bigint not null references public.games(id) on delete cascade,
  author_name        text not null default '익명',
  -- 재미/완성도 별점 (1~5)
  fun_rating         smallint not null check (fun_rating between 1 and 5),
  -- 과금 부담도 (1 = 지갑을 열어야 함, 5 = 무과금으로 충분히 즐길 수 있음)
  cost_burden        smallint not null check (cost_burden between 1 and 5),
  -- 확률형 아이템 체감 투명성 (1 = 매우 불투명, 5 = 매우 투명 / 해당 없으면 null)
  gacha_transparency smallint check (gacha_transparency between 1 and 5),
  body               text not null check (char_length(body) between 5 and 5000),
  created_at         timestamptz not null default now()
);

create index if not exists reviews_game_id_created_idx on public.reviews (game_id, created_at desc);

-- ───────────────────────────────────────────────
-- 3. 게임별 자체 리뷰 집계 뷰
-- ───────────────────────────────────────────────
create or replace view public.game_review_stats as
select
  game_id,
  count(*)                                as review_count,
  round(avg(fun_rating)::numeric, 2)      as avg_fun,
  round(avg(cost_burden)::numeric, 2)     as avg_cost_burden,
  round(avg(gacha_transparency)::numeric, 2) as avg_gacha_transparency
from public.reviews
group by game_id;

-- ───────────────────────────────────────────────
-- 4. RLS (Row Level Security)
--    - games : 누구나 읽기 가능 / 쓰기는 service_role(서버)만
--    - reviews : 누구나 읽기 + 누구나 작성 가능 (MVP, 로그인 없음)
-- ───────────────────────────────────────────────
alter table public.games   enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "games are public readable" on public.games;
create policy "games are public readable"
  on public.games for select
  using (true);

drop policy if exists "reviews are public readable" on public.reviews;
create policy "reviews are public readable"
  on public.reviews for select
  using (true);

drop policy if exists "anyone can insert a review" on public.reviews;
create policy "anyone can insert a review"
  on public.reviews for insert
  with check (true);

-- (games 에 대한 insert/update 정책은 만들지 않음 → service_role 키만 우회 가능)
