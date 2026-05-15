-- profilesテーブル
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name varchar,
  avatar_url varchar,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- study_logsテーブル（ポモドーロ1セッションの記録）
create table public.study_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  duration_minutes integer not null,
  mode varchar not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  created_at timestamptz default now() not null
);

-- daily_statsテーブル（日別集計）
create table public.daily_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  date date not null,
  total_minutes integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, date)
);

-- RLS有効化
alter table public.profiles enable row level security;
alter table public.study_logs enable row level security;
alter table public.daily_stats enable row level security;

-- profiles RLS
create policy "自分のプロフィールのみ参照可能" on public.profiles
  for select using (auth.uid() = id);

create policy "自分のプロフィールのみ更新可能" on public.profiles
  for update using (auth.uid() = id);

-- study_logs RLS
create policy "自分の学習記録のみ参照可能" on public.study_logs
  for select using (auth.uid() = user_id);

create policy "自分の学習記録のみ追加可能" on public.study_logs
  for insert with check (auth.uid() = user_id);

-- daily_stats RLS
create policy "自分の日別統計のみ参照可能" on public.daily_stats
  for select using (auth.uid() = user_id);

create policy "自分の日別統計のみ追加・更新可能" on public.daily_stats
  for insert with check (auth.uid() = user_id);

create policy "自分の日別統計のみ更新可能" on public.daily_stats
  for update using (auth.uid() = user_id);

-- 新規ユーザー登録時にprofilesを自動作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
