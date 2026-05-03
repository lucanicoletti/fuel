-- FUEL meal planner — initial schema
-- Single-user app. Supabase Auth must be configured to disallow signups
-- so only the owner's email can ever obtain a session.

-- Owner gate: any authenticated user. With signups disabled in Supabase Auth,
-- this is effectively "the owner". Centralised here so policies stay terse.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
$$;

-- ─────────────────────────────────────────────
-- recipes
-- ingredients jsonb: array of
--   { name, amount, amount_value, amount_unit, is_tin_ingredient, is_carb_adjust }
-- steps jsonb: array of strings
-- ─────────────────────────────────────────────
create table public.recipes (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  type          text not null check (type in ('breakfast','snack','lunch','dinner')),
  kcal          int  not null,
  protein_g     int  not null,
  carbs_g       int  not null,
  fat_g         int  not null,
  ingredients   jsonb not null default '[]'::jsonb,
  steps         jsonb not null default '[]'::jsonb,
  is_egg_dinner boolean not null default false,
  tin_note      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index recipes_type_idx on public.recipes(type);

-- ─────────────────────────────────────────────
-- recipe_pairs
-- A shared resource (one tin / one tub) split across two meals.
-- Primary opens it, secondary uses leftovers (with reduced carb portion).
-- ─────────────────────────────────────────────
create table public.recipe_pairs (
  id                      uuid primary key default gen_random_uuid(),
  shared_resource         text not null,                 -- e.g. 'chickpeas-A', 'ricotta-A', 'cc-B'
  primary_recipe_id       uuid not null references public.recipes(id) on delete cascade,
  secondary_recipe_id     uuid not null references public.recipes(id) on delete cascade,
  carb_ingredient_name    text,                          -- e.g. 'Fusilli (dry)'
  primary_carb_amount     text,                          -- e.g. '110g'
  secondary_carb_amount   text,                          -- e.g. '75g'
  created_at              timestamptz not null default now(),
  unique (primary_recipe_id, secondary_recipe_id),
  unique (shared_resource)
);

-- ─────────────────────────────────────────────
-- week_plans
-- Full snapshot — recipe edits don't rewrite history.
-- days jsonb: array of 7 entries:
--   { day, breakfast: { recipe_id, snapshot }, snack: {...}, lunch: {...}|null, dinner: {...}|null }
-- choc_state jsonb: { MON: bool, TUE: bool, ... }
-- ─────────────────────────────────────────────
create table public.week_plans (
  id              uuid primary key default gen_random_uuid(),
  week_start_date date not null,
  label           text,
  days            jsonb not null,
  choc_state      jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index week_plans_date_idx on public.week_plans(week_start_date desc);

-- ─────────────────────────────────────────────
-- updated_at trigger for recipes
-- ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

create trigger recipes_touch_updated_at
  before update on public.recipes
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────
-- RLS — owner only
-- ─────────────────────────────────────────────
alter table public.recipes       enable row level security;
alter table public.recipe_pairs  enable row level security;
alter table public.week_plans    enable row level security;

create policy recipes_owner       on public.recipes      for all using (public.is_owner()) with check (public.is_owner());
create policy recipe_pairs_owner  on public.recipe_pairs for all using (public.is_owner()) with check (public.is_owner());
create policy week_plans_owner    on public.week_plans   for all using (public.is_owner()) with check (public.is_owner());
