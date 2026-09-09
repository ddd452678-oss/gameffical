-- ═══════════════════════════════════════════════════════════════════════════
-- 마이그레이션: games 테이블에 GRAC(게임물관리위원회) 보강 필드 추가
-- 기존 DB 에서 1회 실행. 신규 설치는 schema.sql 에 이미 포함됨.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.games add column if not exists genres_ko           text[] not null default '{}';
alter table public.games add column if not exists age_rating          text;
alter table public.games add column if not exists content_descriptors text[] not null default '{}';
alter table public.games add column if not exists publisher           text;
alter table public.games add column if not exists source              text not null default 'rawg';
