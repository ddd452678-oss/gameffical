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
  name_ko           text,                             -- 한국어 이름 (시드 목록 / GRAC 등록명 기준)
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
  -- GRAC(게임물관리위원회) 보강 필드
  genres_ko           text[] not null default '{}',   -- 한국어 장르 (있으면 genres 대신 표시)
  age_rating          text,                            -- 이용등급 (전체이용가 ~ 청소년이용불가)
  content_descriptors text[] not null default '{}',    -- 내용정보 (폭력성, 사행성, 선정성 ...)
  publisher           text,                            -- 배급사
  source              text not null default 'rawg',    -- 'rawg' | 'sample' | 'grac'
  metadata_updated_at timestamptz not null default now(),  -- 카탈로그 갱신 시각 (일~주 주기)
  ratings_updated_at  timestamptz not null default now(),  -- 평점 갱신 시각 (시간~일 주기)
  created_at          timestamptz not null default now()
);

create index if not exists games_platform_kinds_idx on public.games using gin (platform_kinds);
create index if not exists games_name_trgm_idx on public.games using gin (name extensions.gin_trgm_ops);
create index if not exists games_name_ko_trgm_idx on public.games using gin (name_ko extensions.gin_trgm_ops);

-- ───────────────────────────────────────────────
-- 1-1. catalog_progress : 플랫폼별 RAWG 카탈로그 수집 진행 커서
--    /api/refresh 가 호출될 때마다 이어서 조회할 페이지를 기억해, 하루 API 할당량
--    안에서도 여러 날에 걸쳐 카탈로그를 계속 넓혀간다 (끝까지 가면 1페이지로 순환).
-- ───────────────────────────────────────────────
create table if not exists public.catalog_progress (
  platform_kind text primary key,        -- 'pc' | 'mobile' | 'console'
  next_page     int not null default 1,
  total_pages   int,                     -- RAWG count 기준 전체 페이지 수 (파악되면 기록)
  updated_at    timestamptz not null default now()
);

alter table public.catalog_progress enable row level security;
-- (읽기/쓰기 정책 없음 → service_role 키로만 접근. 클라이언트에는 노출하지 않는다)

-- ───────────────────────────────────────────────
-- 2. reviews : 100% 자체 생성 유저 리뷰
--    로그인(카카오/구글/이메일)한 계정만 작성 가능, 게임당 1인 1리뷰.
--    둘러보기(읽기)는 로그인 없이 누구나 가능.
-- ───────────────────────────────────────────────
create table if not exists public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  game_id            bigint not null references public.games(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  author_name        text not null default '익명',
  -- 재미/완성도 별점 (1~5)
  fun_rating         smallint not null check (fun_rating between 1 and 5),
  -- 과금 부담도 (1 = 지갑을 열어야 함, 5 = 무과금으로 충분히 즐길 수 있음)
  cost_burden        smallint not null check (cost_burden between 1 and 5),
  -- 확률형 아이템 체감 투명성 (1 = 매우 불투명, 5 = 매우 투명 / 해당 없으면 null)
  gacha_transparency smallint check (gacha_transparency between 1 and 5),
  body               text not null check (char_length(body) between 5 and 5000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (game_id, user_id) -- 게임당 1인 1리뷰
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
--    - games   : 누구나 읽기 가능 / 쓰기는 service_role(서버)만
--    - reviews : 누구나 읽기 가능 / 쓰기(작성·수정·삭제)는 로그인한 본인 리뷰만
--      (서버는 실제로는 service_role 키로 우회해서 쓰지만, anon 키가 유출되거나
--       누가 브라우저에서 직접 Supabase 를 호출해도 막히도록 정책은 정확히 잡아둔다)
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
drop policy if exists "authenticated users can insert own review" on public.reviews;
create policy "authenticated users can insert own review"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can update own review" on public.reviews;
create policy "users can update own review"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own review" on public.reviews;
create policy "users can delete own review"
  on public.reviews for delete
  to authenticated
  using (auth.uid() = user_id);

-- (games 에 대한 insert/update 정책은 만들지 않음 → service_role 키만 우회 가능)

-- ───────────────────────────────────────────────
-- 5. profiles : 로그인 아이디(username) ↔ 계정 매핑
--    이메일 로그인 계정은 "아이디"를 직접 정해서 가입한다(이메일은 비밀번호
--    찾기/아이디 찾기 연락용으로만 보관). 카카오/구글 로그인 계정은 username
--    이 없다(해당 없음) — OAuth 로 로그인하니 아이디/비번 개념이 필요 없다.
--
--    email 컬럼은 여기(관리자 API 전용 조회)에만 두고, RLS 로 본인 것만
--    읽을 수 있게 잠근다 — 이메일 주소가 공개로 긁히지 않도록.
--    아이디 중복 확인(회원가입 시)은 이메일이 없는 별도의 공개 뷰(usernames)로만 노출한다.
-- ───────────────────────────────────────────────
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  username   text,
  email      text,
  created_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username is null or username ~ '^[a-zA-Z0-9_]{4,20}$')
);

create unique index if not exists profiles_username_uidx
  on public.profiles (username) where username is not null;

alter table public.profiles enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);
-- (insert/update 정책 없음 → 아래 트리거(security definer)와 service_role API 만 씀)

-- 회원가입 시 아이디 중복 확인용 — 이메일 없이 username 만 공개 노출
create or replace view public.usernames as
  select username from public.profiles where username is not null;
grant select on public.usernames to anon, authenticated;

-- auth.users 에 새 계정이 생기면 자동으로 profiles 행을 만든다.
-- (이메일 인증 대기 상태에서도 즉시 실행되므로, signUp() 시점에 넘긴
--  raw_user_meta_data.username 을 바로 저장할 수 있다)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, username, email)
  values (new.id, new.raw_user_meta_data->>'username', new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
