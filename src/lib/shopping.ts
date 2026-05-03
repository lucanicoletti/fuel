// Shopping list aggregator — ported from the original HTML.
// Tin-aware: only "primary" ingredients (with is_tin_ingredient AND from a primary recipe)
// open a tin; secondaries reuse leftovers and don't double-count.

import type { DayPlan, Recipe, RecipePair } from './types';

interface AggItem {
  name: string;
  amount_value: number;
  amount_unit: 'g' | 'ml' | 'tsp' | 'tbsp' | 'units';
  tinsNeeded: number;
}

export interface ShopRow {
  name: string;
  qty: string;
  tinsNeeded: number;
}

export interface ShopCategory {
  category: string;
  items: ShopRow[];
}

const CAT_RULES: Array<{ keys: string[]; cat: string }> = [
  { keys: ['chicken breast', 'salmon', 'tuna', 'mackerel', 'tofu'], cat: 'Proteins' },
  { keys: ['egg', 'yogurt', 'cottage cheese', 'feta', 'mozzarella', 'soy milk', 'whey', 'protein powder', 'parmesan', 'ricotta'], cat: 'Dairy & Eggs' },
  { keys: ['oats', 'rice', 'pasta', 'penne', 'fusilli', 'rigatoni', 'spaghetti', 'noodle', 'tortilla', 'wrap'], cat: 'Grains & Pasta' },
  { keys: ['chia', 'flax', 'mixed seeds', 'pumpkin seed', 'sunflower seed', 'hemp', 'sesame seed', 'cacao nib', 'walnut', 'almond', 'mixed nut'], cat: 'Seeds & Nuts' },
  { keys: ['spinach', 'broccoli', 'courgette', 'pepper', 'tomato', 'asparagus', 'mushroom', 'pak choi', 'onion', 'spring onion', 'green bean', 'cucumber', 'rocket', 'cauliflower', 'beetroot', 'banana', 'peas', 'frozen peas', 'frozen broccoli', 'frozen', 'lentil', 'bean', 'chickpea', 'sweetcorn', 'carrot'], cat: 'Produce & Legumes' },
  { keys: ['canned', 'passata', 'chopped tom', 'miso'], cat: 'Tins & Jars' },
  { keys: ['olive oil', 'sesame oil', 'vegetable oil', 'soy sauce', 'mustard', 'vinegar', 'paprika', 'oregano', 'thyme', 'cumin', 'turmeric', 'chilli', 'dill', 'rosemary', 'basil', 'ginger', 'garlic', 'salt', 'pepper', 'olives', 'bay leaf', 'mint', 'nutmeg', 'sriracha'], cat: 'Condiments & Spices' },
  { keys: ['protein bar', 'peanut butter'], cat: 'Snacks & Supplements' },
];

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\(.*?\)/g, '').replace(/,.*$/, '').trim();
}

function formatQty(item: AggItem): string {
  const v = item.amount_value;
  if (item.amount_unit === 'g') return v >= 1000 ? `${(v / 1000).toFixed(1)}kg` : `${Math.round(v)}g`;
  if (item.amount_unit === 'ml') return v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${Math.round(v)}ml`;
  if (item.amount_unit === 'tsp') return `${+v.toFixed(1)} tsp`;
  if (item.amount_unit === 'tbsp') return `${+v.toFixed(1)} tbsp`;
  return `${Math.ceil(v)}`;
}

interface BuildShopArgs {
  weekPlans: DayPlan[][];      // one or more weeks of plans
  primaryRecipeIds: Set<string>; // recipe IDs that are "primary" in any pair
}

export function buildShoppingList({ weekPlans, primaryRecipeIds }: BuildShopArgs): ShopCategory[] {
  const agg: Record<string, AggItem> = {};

  function addRecipe(snapshot: Recipe | null) {
    if (!snapshot) return;
    const isPrimary = primaryRecipeIds.has(snapshot.id);
    snapshot.ingredients.forEach(ing => {
      const key = normalizeKey(ing.name);
      if (!agg[key]) {
        agg[key] = {
          name: ing.name,
          amount_value: ing.amount_value,
          amount_unit: ing.amount_unit,
          tinsNeeded: 0,
        };
      } else {
        agg[key].amount_value += ing.amount_value;
      }
      if (ing.is_tin_ingredient && isPrimary) {
        agg[key].tinsNeeded += 1;
      }
    });
  }

  weekPlans.forEach(plan =>
    plan.forEach(day => {
      addRecipe(day.breakfast.snapshot);
      addRecipe(day.snack.snapshot);
      if (day.lunch) addRecipe(day.lunch.snapshot);
      if (day.dinner) addRecipe(day.dinner.snapshot);
    }),
  );

  const rows: ShopRow[] = Object.values(agg).map(item => ({
    name: item.name,
    qty: formatQty(item),
    tinsNeeded: item.tinsNeeded,
  }));

  // Categorize
  const buckets: Record<string, ShopRow[]> = {};
  CAT_RULES.forEach(r => (buckets[r.cat] = []));
  buckets['Other'] = [];

  rows.forEach(row => {
    const low = row.name.toLowerCase();
    let placed = false;
    for (const rule of CAT_RULES) {
      if (rule.keys.some(k => low.includes(k))) {
        buckets[rule.cat].push(row);
        placed = true;
        break;
      }
    }
    if (!placed) buckets['Other'].push(row);
  });

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([category, items]) => ({ category, items }));
}

export function primaryRecipeIdSet(pairs: RecipePair[]): Set<string> {
  return new Set(pairs.map(p => p.primary_recipe_id));
}
