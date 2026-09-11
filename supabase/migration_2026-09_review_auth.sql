-- ═══════════════════════════════════════════════════════════════════════════
-- 마이그레이션: 리뷰 작성을 로그인 계정 기준으로 전환
-- 기존 DB 에서 1회 실행 (Supabase Dashboard → SQL Editor). 신규 설치는
-- schema.sql 에 이미 포함됨.
--
-- 주의: 이 마이그레이션은 reviews 테이블에 남은 리뷰가 없다는 전제로 작성됐다
-- (2026-09 기준 프로덕션에 리뷰 0건 확인). 이미 리뷰가 쌓인 뒤 실행한다면
-- user_id 를 채울 방법이 없는 기존 행을 먼저 지우거나 컬럼을 nullable 로
-- 바꾸는 등 별도 처리가 필요하다.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.reviews add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.reviews alter column user_id set not null;
alter table public.reviews add column if not exists updated_at timestamptz not null default now();

create unique index if not exists reviews_game_id_user_id_uidx on public.reviews (game_id, user_id);

-- 기존 "누구나 작성 가능" 정책 제거, 로그인 계정 기준 정책으로 교체
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
