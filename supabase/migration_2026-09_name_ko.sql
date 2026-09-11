-- ═══════════════════════════════════════════════════════════════════════════
-- 마이그레이션: games 테이블에 한국어 이름(name_ko) 필드 추가
-- 기존 DB 에서 1회 실행 (Supabase Dashboard → SQL Editor). 신규 설치는
-- schema.sql 에 이미 포함됨.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.games add column if not exists name_ko text;

create index if not exists games_name_ko_trgm_idx
  on public.games using gin (name_ko extensions.gin_trgm_ops);
