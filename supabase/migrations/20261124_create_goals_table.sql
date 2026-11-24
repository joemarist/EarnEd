-- Store each user's personal income goals.
-- Progress is calculated in the app from Daily Logs; no progress value is stored here.

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_valid_date_range check (end_date >= start_date)
);

create index if not exists goals_user_dates_idx
  on public.goals (user_id, start_date, end_date);

alter table public.goals enable row level security;

drop policy if exists "Users can view their own goals" on public.goals;
create policy "Users can view their own goals"
  on public.goals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own goals" on public.goals;
create policy "Users can create their own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own goals" on public.goals;
create policy "Users can update their own goals"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own goals" on public.goals;
create policy "Users can delete their own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.goals to authenticated;
