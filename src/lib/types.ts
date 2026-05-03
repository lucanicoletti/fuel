export type MealType = 'breakfast' | 'snack' | 'lunch' | 'dinner';

export interface Ingredient {
  name: string;
  amount: string;
  amount_value: number;
  amount_unit: 'g' | 'ml' | 'tsp' | 'tbsp' | 'units';
  is_tin_ingredient: boolean;
  is_carb_adjust: boolean;
}

export interface Recipe {
  id: string;
  slug: string;
  name: string;
  type: MealType;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: Ingredient[];
  steps: string[];
  is_egg_dinner: boolean;
  tin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipePair {
  id: string;
  shared_resource: string;
  primary_recipe_id: string;
  secondary_recipe_id: string;
  carb_ingredient_name: string | null;
  primary_carb_amount: string | null;
  secondary_carb_amount: string | null;
}

export type DayName = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface MealSlot {
  recipe_id: string | null;
  snapshot: Recipe | null;
}

export interface DayPlan {
  day: DayName;
  breakfast: MealSlot;
  snack: MealSlot;
  lunch: MealSlot | null;
  dinner: MealSlot | null;
}

export interface WeekPlan {
  id: string;
  week_start_date: string;
  label: string | null;
  days: DayPlan[];
  choc_state: Partial<Record<DayName, boolean>>;
  created_at: string;
}
