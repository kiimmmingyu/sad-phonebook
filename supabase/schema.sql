-- 번호수첩 (phonebook) 데이터베이스 스키마
-- Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run 하세요.

create extension if not exists "pgcrypto";

create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 60),
  phone       text not null check (char_length(phone) between 7 and 20),
  group_name  text not null default '기타' check (char_length(group_name) between 1 and 20),
  memo        text not null default '' check (char_length(memo) <= 500),
  favorite    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 이름 순 조회와 그룹 필터에 쓰이는 인덱스
create index if not exists contacts_name_idx  on public.contacts (name);
create index if not exists contacts_group_idx on public.contacts (group_name);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- Row Level Security
-- 로그인 기능이 없는 개인용 번호수첩이므로 anon 키로 모든 작업을 허용합니다.
-- 여러 사람이 쓰거나 공개 배포한다면 Supabase Auth 를 붙이고 아래 정책을
-- auth.uid() 기준으로 좁히세요.
alter table public.contacts enable row level security;

drop policy if exists "contacts: anon select" on public.contacts;
drop policy if exists "contacts: anon insert" on public.contacts;
drop policy if exists "contacts: anon update" on public.contacts;
drop policy if exists "contacts: anon delete" on public.contacts;

create policy "contacts: anon select" on public.contacts
  for select to anon, authenticated using (true);

create policy "contacts: anon insert" on public.contacts
  for insert to anon, authenticated with check (true);

create policy "contacts: anon update" on public.contacts
  for update to anon, authenticated using (true) with check (true);

create policy "contacts: anon delete" on public.contacts
  for delete to anon, authenticated using (true);
