-- ═══════════════════════════════════════════════════════════════════════════
-- 마이그레이션: 플랫폼별 카탈로그 수집 진행 커서 테이블 추가
-- 기존 DB 에서 1회 실행 (Supabase Dashboard → SQL Editor). 신규 설치는
-- schema.sql 에 이미 포함됨.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.catalog_progress (
  platform_kind text primary key,
  next_page     int not null default 1,
  total_pages   int,
  updated_at    timestamptz not null default now()
);

alter table public.catalog_progress enable row level security;
