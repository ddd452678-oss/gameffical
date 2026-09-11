-- ═══════════════════════════════════════════════════════════════════════════
-- 마이그레이션: 로그인 아이디(username) 도입 — profiles 테이블/트리거
-- 기존 DB 에서 1회 실행 (Supabase Dashboard → SQL Editor). 신규 설치는
-- schema.sql 에 이미 포함됨.
-- ═══════════════════════════════════════════════════════════════════════════

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

create or replace view public.usernames as
  select username from public.profiles where username is not null;
grant select on public.usernames to anon, authenticated;

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

-- 이미 가입돼 있던 기존 계정(카카오/구글/이메일 테스트 계정 등)에 대해서도
-- profiles 행을 채워준다 (트리거는 "새로" 생기는 계정에만 적용되므로).
insert into public.profiles (user_id, username, email)
select id, raw_user_meta_data->>'username', email
from auth.users
on conflict (user_id) do nothing;
