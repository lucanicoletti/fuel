// Port of the tin-aware generator from the original HTML.
// Treats every pair (tin / ricotta / cottage cheese) identically as a "shared resource".

import type { DayName, DayPlan, MealSlot, Recipe, RecipePair } from './types';

const DAYS: DayName[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function asSlot(r: Recipe): MealSlot {
  return { recipe_id: r.id, snapshot: r };
}

interface PoolInputs {
  recipes: Recipe[];
  pairs: RecipePair[];
  fixedBreakfast: Recipe;
  fixedSnack: Recipe;
}

function buildLunchSelection({ recipes, pairs }: PoolInputs): Recipe[] {
  const lunches = recipes.filter(r => r.type === 'lunch');
  const lunchPairs = pairs
    .map(p => {
      const primary = lunches.find(l => l.id === p.primary_recipe_id);
      const secondary = lunches.find(l => l.id === p.secondary_recipe_id);
      return primary && secondary ? { primary, secondary } : null;
    })
    .filter((p): p is { primary: Recipe; secondary: Recipe } => p !== null);

  const pairedIds = new Set(lunchPairs.flatMap(p => [p.primary.id, p.secondary.id]));
  const solos = lunches.filter(l => !pairedIds.has(l.id));

  const shuffledPairs = shuffle(lunchPairs);
  const shuffledSolos = shuffle(solos);

  // Pick 1 or 2 pairs (each consumes 2 of the 6 weekly slots)
  const numPairs = Math.random() < 0.5 ? 1 : 2;
  const pickedPairs = shuffledPairs.slice(0, Math.min(numPairs, shuffledPairs.length));
  const soloCount = 6 - pickedPairs.length * 2;
  const pickedSolos = shuffledSolos.slice(0, soloCount);

  // Build ordered list — primary always before its secondary
  let slots: Recipe[] = [...pickedSolos];
  pickedPairs.forEach(pair => {
    const maxPrimPos = slots.length;
    const primPos = Math.floor(Math.random() * (maxPrimPos + 1));
    slots.splice(primPos, 0, pair.primary);
    const minSecPos = primPos + 1;
    const secPos = minSecPos + Math.floor(Math.random() * (slots.length - minSecPos + 1));
    slots.splice(secPos, 0, pair.secondary);
  });

  return slots.slice(0, 6);
}

function buildDinnerSelection({ recipes }: PoolInputs): Recipe[] {
  const dinners = recipes.filter(r => r.type === 'dinner');
  const eggs = shuffle(dinners.filter(d => d.is_egg_dinner));
  const nonEggs = shuffle(dinners.filter(d => !d.is_egg_dinner));
  const eggCount = Math.min(2, eggs.length);
  const nonEggCount = 6 - eggCount;
  return shuffle([...eggs.slice(0, eggCount), ...nonEggs.slice(0, nonEggCount)]);
}

export function generateWeek(input: PoolInputs): DayPlan[] {
  const lunches = buildLunchSelection(input);
  const dinners = buildDinnerSelection(input);

  let li = 0, di = 0;
  return DAYS.map<DayPlan>(day => {
    const isSat = day === 'SAT';
    return {
      day,
      breakfast: asSlot(input.fixedBreakfast),
      snack: asSlot(input.fixedSnack),
      lunch: isSat ? null : (lunches[li] ? asSlot(lunches[li++]) : null),
      dinner: isSat ? null : (dinners[di] ? asSlot(dinners[di++]) : null),
    };
  });
}

export const SAT_OUT_ESTIMATE = { kcal: 1800, p: 70, c: 160, f: 60 };
export const CHOC_ADD = { kcal: 110, p: 0, c: 8, f: 7 };
