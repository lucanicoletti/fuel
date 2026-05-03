# FUEL

Personal weekly meal planner. Generates two-week plans, manages a recipe
library with tin/package pairing, builds a consolidated shopping list, and
saves plans by date.

Live at: https://lucanicoletti.github.io/fuel/

## Stack

- **Frontend:** React 18 + TypeScript + Vite (no Tailwind — hand-rolled CSS preserves the FUEL aesthetic)
- **Backend:** Supabase (Postgres + Auth)
- **Deploy:** GitHub Pages via GitHub Actions
- **Auth:** Magic link, single-user (Supabase signups disabled)

## How it works

### Tin/package pairing

Some ingredients come in fixed package sizes — a 240 g lentil tin, a 300 g
cottage cheese tub, a ricotta tub. Pairing logic ensures one package gets
split between two meals in the same week:

- A pair has a **primary** recipe (opens the package, full carb portion) and a
  **secondary** recipe (uses the leftover, reduced carb portion).
- The week generator guarantees primary precedes secondary.
- The shopping list counts the package once, not twice.

Pairs are first-class rows in `recipe_pairs` so adding a new shared
resource (e.g. a yogurt tub) is a SQL insert, not a code change.

### Saved week plans

`week_plans.days` stores a full snapshot of each meal's macros and
ingredients. Editing a recipe later does not rewrite history — but the
modal still opens the *current* recipe via the `recipe_id` reference,
falling back to the snapshot if the recipe has been deleted.

### Saturday-out + chocolate

Saturday lunch + dinner are always "out" (estimated `+1800 kcal / 70P / 160C / 60F`).
Per-day chocolate toggle adds `+110 kcal / 8C / 7F`.

## Local development

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OWNER_EMAIL
npm install
npm run dev
```

Visit http://localhost:5173.

## Supabase setup

1. Create a project at https://supabase.com.
2. **Auth → Settings:** disable signups (this is the security boundary —
   RLS allows any authenticated user, but only your email can ever obtain
   one). Add `https://lucanicoletti.github.io/fuel/` and
   `http://localhost:5173/` to redirect URLs.
3. **SQL editor:** run `supabase/migrations/20260502000000_initial_schema.sql`
   then `20260502000001_seed_recipes.sql`. Or use the Supabase CLI:

   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```

4. Copy the project URL and anon key into your `.env` and (for production)
   into the GitHub repo secrets.

## Deploy

1. **Repository secrets** (Settings → Secrets and variables → Actions):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OWNER_EMAIL`
2. **GitHub Pages** (Settings → Pages → Source): GitHub Actions.
3. Push to `main` — `.github/workflows/deploy.yml` builds with
   `BASE_PATH=/fuel/` and deploys.

## Regenerating the seed

Recipe data lives in `scripts/generate-seed.mjs` (a single Node file with
no dependencies). To add or correct a recipe:

```bash
# edit scripts/generate-seed.mjs
node scripts/generate-seed.mjs
# review supabase/migrations/20260502000001_seed_recipes.sql
```

For ad-hoc recipe edits, use the **Edit Recipes** tab in the app — that
writes directly to Supabase via RLS-gated upserts.

## Project structure

```
src/
  App.tsx                 — top-level state, data loading, tab routing
  main.tsx                — React entry
  index.css               — full theme + utility classes
  hooks/useAuth.ts
  lib/
    types.ts              — Recipe, RecipePair, WeekPlan, etc.
    supabase.ts           — client + OWNER_EMAIL
    generator.ts          — tin-aware week generator
    shopping.ts           — aggregator + categorisation
    macros.ts             — daily kcal + week averages
    parseAmount.ts        — "120g" → { value: 120, unit: "g" }
  components/
    AuthGate.tsx          — magic link form
    Header.tsx
    Tabs.tsx
    WeekPlanView.tsx      — 7-day grid + save dialog
    ShoppingListView.tsx  — categorised list with print
    RecipesView.tsx       — sectioned recipe browser
    RecipeEditor.tsx      — full CRUD
    SavedPlansView.tsx    — load/delete saved weeks
    MealModal.tsx         — recipe detail (uses snapshot fallback)
supabase/
  migrations/
    20260502000000_initial_schema.sql
    20260502000001_seed_recipes.sql   (auto-generated)
scripts/
  generate-seed.mjs       — recipe data + SQL emitter
.github/workflows/
  deploy.yml              — Pages build + deploy
```

## Schema reference

```
recipes        (id, slug, name, type, kcal, protein_g, carbs_g, fat_g,
                ingredients jsonb, steps jsonb, is_egg_dinner, tin_note)

recipe_pairs   (id, shared_resource, primary_recipe_id,
                secondary_recipe_id, carb_ingredient_name,
                primary_carb_amount, secondary_carb_amount)

week_plans     (id, week_start_date, label, days jsonb, choc_state jsonb)
```

`ingredients` JSONB shape:

```json
{
  "name": "Penne rigate (dry)",
  "amount": "120g",
  "amount_value": 120,
  "amount_unit": "g",
  "is_tin_ingredient": false,
  "is_carb_adjust": false
}
```
