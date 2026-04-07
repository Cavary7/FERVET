create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  username_normalized text not null unique,
  email text not null,
  display_name text,
  country text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace view public.profile_usernames as
select user_id, username, username_normalized
from public.profiles;

alter table public.profiles enable row level security;
alter table public.user_app_state enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id);

create policy "user_app_state_select_own"
on public.user_app_state
for select
using (auth.uid() = user_id);

create policy "user_app_state_insert_own"
on public.user_app_state
for insert
with check (auth.uid() = user_id);

create policy "user_app_state_update_own"
on public.user_app_state
for update
using (auth.uid() = user_id);

grant select on public.profile_usernames to anon, authenticated;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists user_app_state_updated_at on public.user_app_state;
create trigger user_app_state_updated_at
before update on public.user_app_state
for each row
execute function public.handle_updated_at();
