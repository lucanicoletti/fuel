#!/usr/bin/env node
// Generates supabase/migrations/<ts>_seed_recipes.sql from the recipe data below.
// Run: `node scripts/generate-seed.mjs`
// Output is overwritten on every run.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'supabase', 'migrations', '20260502000001_seed_recipes.sql');

// ─────────────────────────────────────────────
// AMOUNT PARSER (mirrors src/lib/shopping.ts parseAmount)
// ─────────────────────────────────────────────
function parseAmount(str) {
  if (!str) return { value: 0, unit: 'units' };
  const s = str.toLowerCase();
  const num = parseFloat((str.match(/[\d.]+/) || ['1'])[0]);
  if (s.includes('kg')) return { value: num * 1000, unit: 'g' };
  if (s.match(/\d\s*g\b/) || s.endsWith('g)') || s.includes('g (')) return { value: num, unit: 'g' };
  if (s.includes('ml')) return { value: num, unit: 'ml' };
  if (s.match(/\b\d+\s*l\b/) || s.endsWith('l')) return { value: num * 1000, unit: 'ml' };
  if (s.includes('tsp')) return { value: num, unit: 'tsp' };
  if (s.includes('tbsp')) return { value: num, unit: 'tbsp' };
  if (s.includes('tin') || s.includes('bar') || s.includes('scoop') || s.includes('clove') ||
      s.includes('leaf') || s.includes('handful') || s.includes('wrap') || s.match(/^\d+$/)) {
    return { value: num, unit: 'units' };
  }
  const gMatch = str.match(/(\d+)\s*g/);
  if (gMatch) return { value: parseInt(gMatch[1]), unit: 'g' };
  return { value: num, unit: 'units' };
}

const ing = (name, amount, opts = {}) => {
  const { value, unit } = parseAmount(amount);
  return {
    name, amount,
    amount_value: value, amount_unit: unit,
    is_tin_ingredient: !!opts.tin,
    is_carb_adjust: !!opts.carb,
  };
};

// ─────────────────────────────────────────────
// RECIPE DATA — verbatim from the original HTML's JS data
// ─────────────────────────────────────────────
const BREAKFAST = {
  slug: 'breakfast', name: 'Overnight Oats', type: 'breakfast',
  kcal: 905, p: 54, c: 93, f: 36,
  ingredients: [
    ing('Rolled oats', '85g'),
    ing('Unsweetened soy milk', '250ml'),
    ing('Whey protein powder', '30g (1 scoop)'),
    ing('Peanut butter', '20g'),
    ing('Chia seeds OR ground flaxseed', '15g'),
    ing('Banana (or seasonal fruit)', '100g'),
    ing('Cacao nibs OR mixed nuts (walnuts, almonds)', '10g'),
  ],
  steps: [
    'The night before: add oats, soy milk, and chia seeds (or ground flaxseed) to a jar or bowl. Stir well — seeds clump if left unstirred.',
    'Stir in whey protein powder until fully dissolved. Soy milk helps it incorporate smoothly.',
    'Stir in peanut butter.',
    'Seal and refrigerate overnight — minimum 6h, up to 24h. The oats will absorb the liquid and thicken.',
    'In the morning: stir, add a splash of soy milk if too thick. Top with sliced banana and cacao nibs or a small handful of nuts for crunch.',
  ],
};

const SNACK = {
  slug: 'snack', name: 'Protein Bar', type: 'snack',
  kcal: 220, p: 20, c: 20, f: 6,
  ingredients: [ ing('Generic protein bar (~200–250 kcal, ~20g protein)', '1 bar') ],
  steps: ['Mid-afternoon, ideally 2–3h away from training.'],
};

const LUNCHES = [
  {
    slug: 'L1', name: 'Tuna Pasta Arrabbiata', type: 'lunch',
    kcal: 1040, p: 59, c: 128, f: 20,
    ingredients: [
      ing('Penne rigate (dry)', '120g'),
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Passata', '200ml'),
      ing('Garlic cloves', '3'),
      ing('Dried chilli flakes', '1 tsp'),
      ing('Olive oil', '15ml'),
      ing('Cherry tomatoes', '100g'),
      ing('Parmesan, finely grated', '15g'),
      ing('Fresh parsley', 'small handful'),
      ing('Salt & black pepper', 'to taste'),
    ],
    steps: [
      'Boil well-salted water. Cook penne 1 min less than packet says.',
      'Sauté sliced garlic in olive oil 1 min. Add chilli flakes and halved cherry tomatoes, cook 2 min.',
      'Add passata, season well. Simmer 8 min.',
      'Drain pasta, reserve 1 cup pasta water. Toss pasta in sauce.',
      'Fold in drained tuna gently. Add pasta water to loosen. Cook 1 min more.',
      'Plate and finish with parsley and parmesan.',
    ],
  },
  {
    slug: 'L2', name: 'Salmon & Pea Rice Bowl', type: 'lunch',
    kcal: 1020, p: 58, c: 120, f: 26,
    ingredients: [
      ing('Basmati rice (dry)', '120g'),
      ing('Salmon fillet', '125g (1 fillet)'),
      ing('Frozen peas', '150g'),
      ing('Cucumber', '80g'),
      ing('Spring onions', '2'),
      ing('Soy sauce (low sodium)', '20ml'),
      ing('Sesame oil', '10ml'),
      ing('Smoked paprika', '½ tsp'),
      ing('Garlic powder', '½ tsp'),
      ing('Sesame seeds', '5g'),
    ],
    steps: [
      'Cook rice. Add frozen peas to boiling water for last 3 min of rice cooking, or separately 3 min. Drain.',
      'Season salmon with smoked paprika, garlic powder, salt. Pan-fry skin-side down 4 min, flip 2 min. Rest and flake.',
      'Mix soy sauce and sesame oil as dressing.',
      'Bowl: rice base, salmon, peas, sliced cucumber, spring onions.',
      'Drizzle dressing, scatter sesame seeds.',
    ],
  },
  {
    slug: 'L3', name: 'Chicken & Chickpea Tomato Pasta', type: 'lunch',
    kcal: 1045, p: 67, c: 122, f: 21,
    ingredients: [
      ing('Fusilli (dry)', '110g', { carb: true }),
      ing('Chicken breast', '180g'),
      ing('Canned chickpeas (drained)', '120g', { tin: true }),
      ing('Canned chopped tomatoes', '400g (1 tin)'),
      ing('Garlic cloves', '3'),
      ing('Red onion', '½'),
      ing('Dried oregano', '1 tsp'),
      ing('Smoked paprika', '1 tsp'),
      ing('Olive oil', '12ml'),
      ing('Parmesan, finely grated', '15g'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Dice chicken, season with paprika, salt, pepper. Cook in olive oil 6–7 min. Set aside.',
      'Sauté diced onion and garlic 3 min. Add chickpeas and tomatoes, season with oregano. Simmer 8 min.',
      'Cook pasta. Drain and add to sauce with chicken. Toss well.',
      'Serve with parmesan.',
    ],
  },
  {
    slug: 'L3b', name: 'Chicken & Chickpea Tomato Pasta (extra chickpeas)', type: 'lunch',
    kcal: 980, p: 67, c: 105, f: 21,
    tin_note: 'Uses remainder of the chickpea tin opened earlier this week.',
    ingredients: [
      ing('Fusilli (dry)', '75g', { carb: true }),
      ing('Chicken breast', '180g'),
      ing('Canned chickpeas (drained)', '120g (remainder from tin)', { tin: true }),
      ing('Canned chopped tomatoes', '400g (1 tin)'),
      ing('Garlic cloves', '3'),
      ing('Red onion', '½'),
      ing('Dried oregano', '1 tsp'),
      ing('Smoked paprika', '1 tsp'),
      ing('Olive oil', '12ml'),
      ing('Parmesan, finely grated', '15g'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Dice chicken, season with paprika, salt, pepper. Cook in olive oil 6–7 min. Set aside.',
      'Sauté diced onion and garlic 3 min. Add chickpeas (remainder from earlier in week) and tomatoes, season with oregano. Simmer 8 min.',
      'Cook pasta. Drain and add to sauce with chicken. Toss well.',
      'Serve with parmesan.',
    ],
  },
  {
    slug: 'L4', name: 'Tuna & Roasted Pepper Rice', type: 'lunch',
    kcal: 1030, p: 56, c: 130, f: 18,
    ingredients: [
      ing('Basmati rice (dry)', '125g'),
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Sweetcorn (tinned, drained)', '80g'),
      ing('Red pepper', '1 large'),
      ing('Yellow pepper', '1 large'),
      ing('Olive oil', '12ml'),
      ing('Cumin', '1 tsp'),
      ing('Smoked paprika', '1 tsp'),
      ing('Garlic powder', '½ tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 200°C. Slice peppers, toss with half the oil and paprika. Roast 20 min.',
      'Cook rice with cumin stirred into the water.',
      'Mix tuna and sweetcorn with garlic powder, salt, pepper.',
      'Bowl: rice, tuna-corn mix, roasted peppers. Drizzle remaining oil.',
    ],
  },
  {
    slug: 'L5', name: 'Tuna & Lentil Tomato Pasta', type: 'lunch',
    kcal: 1020, p: 60, c: 126, f: 16,
    ingredients: [
      ing('Spaghetti (dry)', '110g', { carb: true }),
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Canned green lentils (drained)', '120g', { tin: true }),
      ing('Passata', '200ml'),
      ing('Garlic cloves', '3'),
      ing('Olive oil', '12ml'),
      ing('Dried thyme', '1 tsp'),
      ing('Parmesan, finely grated', '15g'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Cook spaghetti al dente. Reserve a cup of pasta water.',
      'Sauté garlic in olive oil 1 min. Add passata, lentils, thyme. Simmer 8 min.',
      'Drain pasta, add to sauce. Fold in drained tuna gently. Loosen with pasta water.',
      'Finish with parmesan and black pepper.',
    ],
  },
  {
    slug: 'L5b', name: 'Tuna & Lentil Tomato Pasta (extra lentils)', type: 'lunch',
    kcal: 955, p: 60, c: 108, f: 16,
    tin_note: 'Uses remainder of the lentil tin opened earlier this week.',
    ingredients: [
      ing('Spaghetti (dry)', '75g', { carb: true }),
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Canned green lentils (drained)', '120g (remainder from tin)', { tin: true }),
      ing('Passata', '200ml'),
      ing('Garlic cloves', '3'),
      ing('Olive oil', '12ml'),
      ing('Dried thyme', '1 tsp'),
      ing('Parmesan, finely grated', '15g'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Cook spaghetti al dente. Reserve a cup of pasta water.',
      'Sauté garlic in olive oil 1 min. Add passata, lentils (remainder from tin), thyme. Simmer 8 min.',
      'Drain pasta, add to sauce. Fold in drained tuna gently. Loosen with pasta water.',
      'Finish with parmesan and black pepper.',
    ],
  },
  {
    slug: 'L6', name: 'Chicken Fried Rice with Peas & Egg', type: 'lunch',
    kcal: 1055, p: 68, c: 116, f: 24,
    ingredients: [
      ing('Basmati rice (dry, cook day before ideally)', '120g'),
      ing('Chicken breast', '160g'),
      ing('Whole eggs', '2'),
      ing('Frozen peas', '80g'),
      ing('Garlic cloves', '3'),
      ing('Soy sauce (low sodium)', '20ml'),
      ing('Sesame oil', '8ml'),
      ing('Spring onions', '2'),
      ing('Vegetable oil', '10ml'),
    ],
    steps: [
      'Cook and cool rice (day-old is best for texture).',
      'Dice chicken, stir-fry in vegetable oil on high heat 5 min. Set aside.',
      'Scramble eggs in same pan, barely set. Push to side.',
      'Add garlic, peas, rice. Fry 3 min, stirring constantly.',
      'Return chicken, add soy sauce and sesame oil. Toss. Top with spring onions.',
    ],
  },
  {
    slug: 'L7', name: 'Mackerel & Ricotta Pasta with Spinach', type: 'lunch',
    kcal: 1055, p: 54, c: 122, f: 34,
    ingredients: [
      ing('Rigatoni (dry)', '115g'),
      ing('Canned mackerel in spring water/brine', '125g (1 tin, drained)'),
      ing('Ricotta', '125g'),
      ing('Fresh spinach', '100g'),
      ing('Garlic cloves', '3'),
      ing('Olive oil', '12ml'),
      ing('Dried chilli flakes', '½ tsp'),
      ing('Parmesan, finely grated', '15g'),
      ing('Nutmeg, grated', 'pinch'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Cook rigatoni al dente. Reserve a full cup of pasta water — the sauce needs it.',
      'Sauté garlic and chilli in olive oil 1 min. Wilt spinach in same pan 2 min.',
      'Reduce heat to low. Add ricotta and a ladleful of pasta water. Stir into a loose sauce.',
      'Drain pasta, add to pan. Fold in flaked mackerel gently. Add more pasta water if needed.',
      'Finish with parmesan, a grating of nutmeg, and black pepper.',
    ],
  },
  {
    slug: 'L8', name: 'Tofu & Vegetable Rice Stir-Fry', type: 'lunch',
    kcal: 970, p: 46, c: 120, f: 22,
    ingredients: [
      ing('Basmati rice (dry)', '120g'),
      ing('Firm tofu (extra firm)', '200g'),
      ing('Frozen broccoli florets', '120g'),
      ing('Red pepper', '1'),
      ing('Soy sauce (low sodium)', '25ml'),
      ing('Sesame oil', '10ml'),
      ing('Garlic cloves', '3'),
      ing('Fresh ginger (grated)', '1 tsp'),
      ing('Vegetable oil', '12ml'),
      ing('Sesame seeds', '5g'),
    ],
    steps: [
      'Press tofu 15 min. Cube and fry in vegetable oil on high heat until golden, ~8 min. Set aside.',
      'Cook rice.',
      'Stir-fry garlic and ginger 30 sec. Add broccoli and pepper, fry 4 min on high.',
      'Return tofu. Add soy sauce and sesame oil. Toss and serve over rice with sesame seeds.',
    ],
  },
  {
    slug: 'L9', name: 'Tuna Niçoise Rice Bowl', type: 'lunch',
    kcal: 1030, p: 58, c: 118, f: 24,
    ingredients: [
      ing('Basmati rice (dry)', '110g'),
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Green beans', '200g'),
      ing('Cherry tomatoes', '100g'),
      ing('Whole eggs (hard-boiled)', '2'),
      ing('Black olives (pitted)', '30g'),
      ing('Olive oil', '12ml'),
      ing('Red wine vinegar', '10ml'),
      ing('Dijon mustard', '1 tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Hard-boil eggs 9 min. Cool, peel, halve.',
      'Cook rice. Blanch green beans 3 min in salted boiling water, drain.',
      'Whisk olive oil, vinegar, mustard, salt, pepper as dressing.',
      'Bowl: rice, tuna, green beans, halved tomatoes, eggs, olives. Drizzle dressing.',
    ],
  },
  {
    slug: 'L10', name: 'Salmon & Lentil Rice with Roasted Courgette', type: 'lunch',
    kcal: 1020, p: 58, c: 114, f: 24,
    ingredients: [
      ing('Basmati rice (dry)', '100g', { carb: true }),
      ing('Salmon fillet', '125g (1 fillet)'),
      ing('Canned green lentils (drained)', '120g', { tin: true }),
      ing('Courgette', '150g'),
      ing('Full-fat Greek yogurt', '80g'),
      ing('Olive oil', '15ml'),
      ing('Garlic powder', '1 tsp'),
      ing('Dried rosemary', '1 tsp'),
      ing('Smoked paprika', '½ tsp'),
      ing('Dried dill', '½ tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 200°C. Slice courgette, toss with half the oil, rosemary, salt. Roast 18 min.',
      'Season salmon with paprika, salt. Pan-fry skin-side down 4 min, flip 2 min. Rest and flake.',
      'Cook rice. Warm lentils with garlic powder and a splash of water.',
      'Mix yogurt with dill, salt as a dressing.',
      'Bowl: rice, lentils, salmon, roasted courgette. Drizzle yogurt dressing. Season well.',
    ],
  },
  {
    slug: 'L10b', name: 'Salmon & Lentil Rice with Roasted Courgette (extra lentils)', type: 'lunch',
    kcal: 958, p: 58, c: 97, f: 24,
    tin_note: 'Uses remainder of the lentil tin opened earlier this week.',
    ingredients: [
      ing('Basmati rice (dry)', '65g', { carb: true }),
      ing('Salmon fillet', '125g (1 fillet)'),
      ing('Canned green lentils (drained)', '120g (remainder from tin)', { tin: true }),
      ing('Courgette', '150g'),
      ing('Full-fat Greek yogurt', '80g'),
      ing('Olive oil', '15ml'),
      ing('Garlic powder', '1 tsp'),
      ing('Dried rosemary', '1 tsp'),
      ing('Smoked paprika', '½ tsp'),
      ing('Dried dill', '½ tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 200°C. Slice courgette, toss with half the oil, rosemary, salt. Roast 18 min.',
      'Season salmon with paprika, salt. Pan-fry skin-side down 4 min, flip 2 min. Rest and flake.',
      'Cook rice. Warm lentils (remainder from tin) with garlic powder and a splash of water.',
      'Mix yogurt with dill, salt as a dressing.',
      'Bowl: rice, lentils, salmon, roasted courgette. Drizzle yogurt dressing. Season well.',
    ],
  },
  {
    slug: 'L11', name: 'Chicken & Roasted Vegetable Pasta with Ricotta', type: 'lunch',
    kcal: 1090, p: 70, c: 118, f: 30,
    tin_note: 'Uses remainder of ricotta tub opened earlier this week.',
    ingredients: [
      ing('Penne (dry)', '110g'),
      ing('Chicken breast', '180g'),
      ing('Ricotta', '125g'),
      ing('Courgette', '100g'),
      ing('Red pepper', '1'),
      ing('Olive oil', '15ml'),
      ing('Garlic cloves', '3'),
      ing('Dried basil', '1 tsp'),
      ing('Dried oregano', '1 tsp'),
      ing('Parmesan, finely grated', '15g'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 200°C. Chop courgette and pepper, toss with half the oil and herbs. Roast 20 min.',
      'Slice chicken, sauté in remaining oil with garlic 6–7 min until cooked through.',
      'Cook pasta. Reserve a cup of pasta water before draining.',
      'Reduce heat. Add ricotta to the chicken pan with a ladleful of pasta water. Stir into a loose sauce.',
      'Add pasta and roasted veg. Toss well. Season generously, finish with parmesan.',
    ],
  },
  {
    slug: 'L12', name: 'Mackerel & Beetroot Rice Bowl', type: 'lunch',
    kcal: 1040, p: 48, c: 130, f: 26,
    ingredients: [
      ing('Basmati rice (dry)', '115g'),
      ing('Canned mackerel in spring water/brine', '125g (1 tin, drained)'),
      ing('Pre-cooked beetroot (plain)', '250g'),
      ing('Cucumber', '80g'),
      ing('Rocket leaves', '40g'),
      ing('Olive oil', '12ml'),
      ing('Red wine vinegar', '10ml'),
      ing('Dijon mustard', '1 tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Cook rice, cool slightly.',
      'Whisk olive oil, vinegar, mustard, salt as dressing.',
      'Cube beetroot, slice cucumber.',
      'Bowl: rice, rocket, beetroot, cucumber, flaked mackerel. Drizzle dressing.',
    ],
  },
  {
    slug: 'L13', name: 'Tuna & White Bean Stew with Rice', type: 'lunch',
    kcal: 1000, p: 62, c: 118, f: 12,
    ingredients: [
      ing('Basmati rice (dry)', '100g', { carb: true }),
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Canned cannellini beans (drained)', '120g', { tin: true }),
      ing('Canned chopped tomatoes', '400g (1 tin)'),
      ing('Garlic cloves', '3'),
      ing('Red onion', '½'),
      ing('Olive oil', '12ml'),
      ing('Dried thyme', '1 tsp'),
      ing('Bay leaf', '1'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Sauté diced onion and garlic in olive oil 3 min.',
      'Add tomatoes, beans, thyme, bay leaf. Simmer 10 min.',
      'Fold in drained tuna. Simmer 2 min more.',
      'Cook rice separately. Serve stew over rice.',
    ],
  },
  {
    slug: 'L13b', name: 'Tuna & White Bean Stew with Rice (extra beans)', type: 'lunch',
    kcal: 968, p: 65, c: 100, f: 18,
    tin_note: 'Uses remainder of the cannellini bean tin opened earlier this week.',
    ingredients: [
      ing('Basmati rice (dry)', '65g', { carb: true }),
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Canned cannellini beans (drained)', '120g (remainder from tin)', { tin: true }),
      ing('Canned chopped tomatoes', '400g (1 tin)'),
      ing('Garlic cloves', '3'),
      ing('Red onion', '½'),
      ing('Olive oil', '12ml'),
      ing('Dried thyme', '1 tsp'),
      ing('Bay leaf', '1'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Sauté diced onion and garlic in olive oil 3 min.',
      'Add tomatoes, beans (remainder from tin), thyme, bay leaf. Simmer 10 min.',
      'Fold in drained tuna. Simmer 2 min more.',
      'Cook rice separately. Serve stew over rice.',
    ],
  },
  {
    slug: 'L14', name: 'Egg Fried Noodles with Peas & Tofu', type: 'lunch',
    kcal: 1040, p: 58, c: 118, f: 28,
    ingredients: [
      ing('Rice noodles (dry)', '100g'),
      ing('Firm tofu', '200g'),
      ing('Whole eggs', '3'),
      ing('Frozen peas', '100g'),
      ing('Spring onions', '3'),
      ing('Soy sauce (low sodium)', '25ml'),
      ing('Sesame oil', '10ml'),
      ing('Garlic cloves', '2'),
      ing('Vegetable oil', '12ml'),
      ing('Sesame seeds', '5g'),
    ],
    steps: [
      'Soak noodles per packet. Press and cube tofu, fry in vegetable oil until golden. Set aside.',
      'Cook frozen peas in boiling water 3 min. Drain.',
      'Scramble eggs in wok, barely set. Add garlic 30 sec.',
      'Add noodles, peas, tofu. Toss on high heat. Add soy sauce and sesame oil.',
      'Top with spring onions and sesame seeds.',
    ],
  },
  {
    slug: 'L15', name: 'Tuna, Ricotta & Spinach Wraps', type: 'lunch',
    kcal: 830, p: 53, c: 77, f: 30,
    ingredients: [
      ing('Plain tortilla wraps', '2 wraps'),
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Ricotta', '80g'),
      ing('Fresh spinach', '40g'),
      ing('Parmesan, finely grated', '15g'),
      ing('Olive oil', '8ml'),
      ing('Rocket leaves', '30g'),
      ing('Cucumber', '60g'),
      ing('Salt & black pepper', 'to taste'),
    ],
    steps: [
      'Mix ricotta with a pinch of salt and pepper. Spread evenly over both wraps.',
      'Top each with spinach leaves, drained tuna, and grated parmesan.',
      'Fold wraps and toast in a dry pan on medium heat 2–3 min per side until golden and slightly crisp.',
      'Serve alongside a simple rocket and cucumber salad dressed with olive oil and salt.',
    ],
  },
  {
    slug: 'L16', name: 'Chicken, Roasted Pepper & Parmesan Wraps', type: 'lunch',
    kcal: 820, p: 50, c: 82, f: 26,
    ingredients: [
      ing('Plain tortilla wraps', '2 wraps'),
      ing('Chicken breast', '150g'),
      ing('Red pepper', '1'),
      ing('Parmesan, finely grated', '20g'),
      ing('Olive oil', '12ml'),
      ing('Smoked paprika', '½ tsp'),
      ing('Dried oregano', '½ tsp'),
      ing('Rocket leaves', '30g'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Slice chicken thinly. Season with paprika, oregano, salt. Pan-fry in half the oil 5–6 min until cooked through. Rest and slice.',
      'Slice pepper into strips, char in same pan 3–4 min. Remove.',
      'Lay chicken, roasted pepper, and parmesan onto wraps. Season.',
      'Fold and toast in a dry pan 2–3 min per side until golden.',
      'Serve with rocket dressed with remaining olive oil.',
    ],
  },
  {
    slug: 'L17', name: 'Salmon, Cottage Cheese & Cucumber Wraps', type: 'lunch',
    kcal: 790, p: 48, c: 77, f: 24,
    ingredients: [
      ing('Plain tortilla wraps', '2 wraps'),
      ing('Salmon fillet', '125g (1 fillet)'),
      ing('Cottage cheese', '100g'),
      ing('Cucumber', '80g'),
      ing('Fresh spinach', '40g'),
      ing('Dried dill', '½ tsp'),
      ing('Olive oil', '8ml'),
      ing('Rocket leaves', '30g'),
      ing('Salt & black pepper', 'to taste'),
    ],
    steps: [
      'Season salmon with salt and pepper. Pan-fry skin-side down 4 min, flip 2 min. Rest, then flake.',
      'Mix cottage cheese with dill and a pinch of pepper. Spread over both wraps.',
      'Top with spinach, flaked salmon, and sliced cucumber.',
      "Fold and toast in a dry pan 2 min per side — gentle heat so the cottage cheese doesn't leak.",
      'Serve with rocket dressed with olive oil.',
    ],
  },
  {
    slug: 'L18', name: 'Mackerel, Mozzarella & Courgette Wraps', type: 'lunch',
    kcal: 860, p: 43, c: 77, f: 36,
    ingredients: [
      ing('Plain tortilla wraps', '2 wraps'),
      ing('Canned mackerel in spring water/brine', '125g (1 tin, drained)'),
      ing('Mozzarella (block or slices)', '50g'),
      ing('Courgette', '100g'),
      ing('Olive oil', '10ml'),
      ing('Dried oregano', '½ tsp'),
      ing('Dried chilli flakes', '¼ tsp'),
      ing('Rocket leaves', '30g'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Slice courgette into thin rounds. Pan-fry in oil with oregano and chilli 4 min until golden. Season.',
      'Lay flaked mackerel, courgette slices, and torn mozzarella onto wraps.',
      'Fold and toast in a dry pan on medium heat 2–3 min per side until mozzarella melts and wrap is crisp.',
      'Serve with dressed rocket alongside.',
    ],
  },
];

const DINNERS = [
  {
    slug: 'D1', name: 'Greek Yogurt Bowl with Roasted Veg', type: 'dinner',
    kcal: 800, p: 52, c: 60, f: 30,
    ingredients: [
      ing('Full-fat Greek yogurt', '300g'),
      ing('Courgette', '150g'),
      ing('Red pepper', '1'),
      ing('Cherry tomatoes', '150g'),
      ing('Olive oil', '15ml'),
      ing('Dried oregano', '1 tsp'),
      ing('Black olives (pitted)', '30g'),
      ing('Smoked paprika', '½ tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 200°C. Chop courgette and pepper, toss with oil, oregano, paprika, salt. Roast 20 min.',
      'Spread Greek yogurt in a wide bowl as base.',
      'Top with roasted veg, halved cherry tomatoes, olives. Season with black pepper.',
    ],
  },
  {
    slug: 'D2', name: 'Pan-Fried Salmon with Broccoli & Mustard Yogurt', type: 'dinner',
    kcal: 760, p: 52, c: 18, f: 34,
    ingredients: [
      ing('Salmon fillet', '125g (1 fillet)'),
      ing('Frozen broccoli', '300g'),
      ing('Full-fat Greek yogurt', '200g'),
      ing('Garlic powder', '1 tsp'),
      ing('Smoked paprika', '1 tsp'),
      ing('Olive oil', '12ml'),
      ing('Dijon mustard', '2 tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Season salmon with garlic powder, smoked paprika, salt. Pan-fry skin-side down 4 min, flip 2 min.',
      'Steam broccoli 5 min. Drain well.',
      'Mix yogurt with mustard, garlic powder, salt into a thick sauce.',
      'Plate: broccoli alongside salmon, yogurt sauce spooned over generously.',
    ],
  },
  {
    slug: 'D3', name: 'Tofu & Spinach Scramble with Eggs', type: 'dinner',
    kcal: 730, p: 44, c: 18, f: 36, isEggDinner: true,
    ingredients: [
      ing('Firm tofu', '200g'),
      ing('Fresh spinach', '120g'),
      ing('Chestnut mushrooms', '150g'),
      ing('Whole eggs', '2'),
      ing('Olive oil', '15ml'),
      ing('Garlic cloves', '3'),
      ing('Turmeric', '½ tsp'),
      ing('Cumin', '½ tsp'),
      ing('Soy sauce (low sodium)', '10ml'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Crumble tofu. Slice mushrooms.',
      'Heat oil on high. Fry mushrooms 4 min until browned. Add garlic 1 min.',
      'Add crumbled tofu, turmeric, cumin, soy sauce. Fry 3 min.',
      'Crack in eggs, scramble through. Wilt spinach. Season well.',
    ],
  },
  {
    slug: 'D4', name: 'Baked Chicken with Green Beans & Tzatziki', type: 'dinner',
    kcal: 810, p: 70, c: 20, f: 26,
    ingredients: [
      ing('Chicken breast', '220g'),
      ing('Green beans', '200g'),
      ing('Full-fat Greek yogurt', '150g'),
      ing('Garlic cloves', '3'),
      ing('Cucumber', '60g'),
      ing('Dried dill', '1 tsp'),
      ing('Olive oil', '15ml'),
      ing('Smoked paprika', '1 tsp'),
      ing('Red wine vinegar', '5ml'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 200°C. Rub chicken with oil, paprika, salt, pepper. Bake 22–25 min.',
      'Blanch green beans in salted boiling water 4 min. Drain, toss with a little oil.',
      'Tzatziki: grate cucumber, squeeze out water. Mix with yogurt, 2 grated garlic cloves, dill, salt.',
      'Slice chicken. Serve with green beans and tzatziki.',
    ],
  },
  {
    slug: 'D5', name: 'Frittata with Cottage Cheese & Roasted Tomatoes', type: 'dinner',
    kcal: 790, p: 56, c: 16, f: 40, isEggDinner: true,
    ingredients: [
      ing('Whole eggs', '4'),
      ing('Cottage cheese', '150g'),
      ing('Cherry tomatoes', '200g'),
      ing('Chestnut mushrooms', '150g'),
      ing('Fresh spinach', '120g'),
      ing('Olive oil', '12ml'),
      ing('Garlic cloves', '2'),
      ing('Dried thyme', '1 tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 180°C. Roast halved cherry tomatoes with a little oil and thyme 15 min.',
      'Sauté mushrooms and garlic in oven-proof pan 4 min. Wilt spinach.',
      'Whisk eggs with cottage cheese, salt, pepper. Pour over mushrooms.',
      'Hob 2 min until edges set. Transfer to oven 10–12 min until set through.',
      'Slide out, top with roasted tomatoes.',
    ],
  },
  {
    slug: 'D6', name: 'Tuna with Cauliflower Mash & Green Beans', type: 'dinner',
    kcal: 800, p: 62, c: 30, f: 26,
    ingredients: [
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Cauliflower', '300g'),
      ing('Green beans', '200g'),
      ing('Full-fat Greek yogurt', '100g'),
      ing('Olive oil', '15ml'),
      ing('Garlic cloves', '2'),
      ing('Dijon mustard', '1 tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Steam cauliflower 10 min until very soft. Blend with yogurt, garlic, mustard, salt until smooth.',
      'Blanch green beans 4 min in salted water. Drain.',
      'Plate: cauliflower mash, green beans alongside, drained tuna on top.',
    ],
  },
  {
    slug: 'D7', name: 'Chicken Stir-Fry with Pak Choi & Mushrooms', type: 'dinner',
    kcal: 800, p: 68, c: 22, f: 28,
    ingredients: [
      ing('Chicken breast', '220g'),
      ing('Pak choi', '200g'),
      ing('Chestnut mushrooms', '150g'),
      ing('Garlic cloves', '3'),
      ing('Fresh ginger', '1 tsp grated'),
      ing('Soy sauce (low sodium)', '20ml'),
      ing('Sesame oil', '10ml'),
      ing('Vegetable oil', '12ml'),
      ing('Spring onions', '2'),
      ing('Sesame seeds', '5g'),
    ],
    steps: [
      'Slice chicken into strips. Marinate in half the soy sauce 10 min.',
      'High-heat wok. Fry chicken 5 min. Set aside.',
      'Fry garlic and ginger 30 sec. Add mushrooms 3 min. Add pak choi, remaining soy, sesame oil. Toss 2 min.',
      'Return chicken. Top with spring onions and sesame seeds.',
    ],
  },
  {
    slug: 'D8', name: 'Salmon with Wilted Spinach & Cottage Cheese Sauce', type: 'dinner',
    kcal: 720, p: 54, c: 12, f: 36,
    ingredients: [
      ing('Salmon fillet', '125g (1 fillet)'),
      ing('Fresh spinach', '120g'),
      ing('Cottage cheese', '150g'),
      ing('Garlic cloves', '2'),
      ing('Olive oil', '12ml'),
      ing('Dried dill', '1 tsp'),
      ing('Salt & black pepper', 'generous'),
    ],
    steps: [
      'Pan-fry salmon in olive oil, 4 min skin side, 2 min flip. Rest.',
      'Sauté garlic 30 sec in same pan. Wilt spinach 2 min. Season.',
      'Blend cottage cheese with dill, salt, pepper until smooth. Warm gently.',
      'Plate: spinach base, salmon on top, cottage cheese sauce spooned over.',
    ],
  },
  {
    slug: 'D9', name: 'Egg & Vegetable Shakshuka', type: 'dinner',
    kcal: 780, p: 46, c: 36, f: 32, isEggDinner: true,
    ingredients: [
      ing('Whole eggs', '4'),
      ing('Canned chopped tomatoes', '400g (1 tin)'),
      ing('Red pepper', '1'),
      ing('Courgette', '120g'),
      ing('Garlic cloves', '3'),
      ing('Cumin', '1 tsp'),
      ing('Smoked paprika', '1 tsp'),
      ing('Chilli flakes', '½ tsp'),
      ing('Olive oil', '15ml'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Sauté diced pepper, courgette, garlic in olive oil 5 min.',
      'Add spices, cook 1 min. Add tomatoes, season. Simmer 10 min.',
      'Make 4 wells in sauce. Crack in eggs. Cover, cook 6–8 min until whites set, yolks still soft.',
      'Serve straight from pan.',
    ],
  },
  {
    slug: 'D10', name: 'Tofu & Broccoli with Miso-Sesame Dressing', type: 'dinner',
    kcal: 700, p: 40, c: 24, f: 30,
    ingredients: [
      ing('Firm tofu', '200g'),
      ing('Frozen broccoli', '250g'),
      ing('White miso paste', '20g'),
      ing('Sesame oil', '15ml'),
      ing('Soy sauce', '15ml'),
      ing('Rice vinegar', '10ml'),
      ing('Garlic clove', '1'),
      ing('Vegetable oil', '12ml'),
      ing('Sesame seeds', '8g'),
    ],
    steps: [
      'Press and cube tofu. Fry in vegetable oil until golden all sides, ~8 min.',
      'Steam broccoli 5 min. Drain.',
      'Whisk miso, sesame oil, soy, rice vinegar, grated garlic. Add hot water to thin.',
      'Arrange tofu and broccoli. Drizzle dressing. Top with sesame seeds.',
    ],
  },
  {
    slug: 'D11', name: 'Chicken with Roasted Courgette & Soft-Boiled Eggs', type: 'dinner',
    kcal: 800, p: 70, c: 14, f: 32, isEggDinner: true,
    ingredients: [
      ing('Chicken breast', '200g'),
      ing('Courgette', '250g'),
      ing('Whole eggs (soft-boiled)', '2'),
      ing('Olive oil', '15ml'),
      ing('Dijon mustard', '1 tsp'),
      ing('Garlic cloves', '2'),
      ing('Smoked paprika', '1 tsp'),
      ing('Red wine vinegar', '5ml'),
      ing('Dried oregano', '1 tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 200°C. Slice courgette, toss with half the oil, oregano, salt. Roast 20 min.',
      'Soft-boil eggs 6 min. Ice water, peel.',
      'Season chicken with paprika, salt. Pan-fry 6 min each side. Rest 2 min, slice.',
      'Whisk remaining oil, mustard, vinegar, garlic as dressing.',
      'Plate: courgette, chicken, halved eggs. Drizzle dressing.',
    ],
  },
  {
    slug: 'D12', name: 'Mackerel with Beetroot & Greek Yogurt', type: 'dinner',
    kcal: 820, p: 48, c: 36, f: 38,
    ingredients: [
      ing('Canned mackerel in spring water/brine', '125g (1 tin, drained)'),
      ing('Pre-cooked beetroot (plain)', '250g'),
      ing('Full-fat Greek yogurt', '200g'),
      ing('Rocket leaves', '60g'),
      ing('Olive oil', '15ml'),
      ing('Red wine vinegar', '10ml'),
      ing('Dried dill', '1 tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Slice beetroot, drizzle with a little oil and vinegar.',
      'Season yogurt with dill, salt, pepper. Spread on plate.',
      'Top with rocket, beetroot, flaked mackerel. Drizzle remaining oil.',
    ],
  },
  {
    slug: 'D13', name: 'Cottage Cheese & Egg Stuffed Peppers', type: 'dinner',
    kcal: 770, p: 52, c: 28, f: 34, isEggDinner: true,
    ingredients: [
      ing('Large red peppers', '2'),
      ing('Whole eggs', '3'),
      ing('Cottage cheese', '150g'),
      ing('Fresh spinach', '120g'),
      ing('Garlic cloves', '2'),
      ing('Olive oil', '12ml'),
      ing('Dried oregano', '1 tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 190°C. Halve peppers, remove seeds. Place cut-side up in baking dish.',
      'Sauté garlic in olive oil 1 min. Wilt spinach. Season.',
      'Whisk eggs with cottage cheese, oregano, salt, pepper. Stir in spinach.',
      'Divide into pepper halves. Bake 25–28 min until filling set and peppers soft.',
    ],
  },
  {
    slug: 'D14', name: 'Tuna with Courgette & Feta Yogurt', type: 'dinner',
    kcal: 800, p: 64, c: 20, f: 30,
    ingredients: [
      ing('Canned tuna in spring water', '145g (1 tin, drained)'),
      ing('Courgette', '200g'),
      ing('Full-fat Greek yogurt', '150g'),
      ing('Feta cheese (crumbled)', '30g'),
      ing('Olive oil', '15ml'),
      ing('Garlic cloves', '2'),
      ing('Dried mint', '½ tsp'),
      ing('Cherry tomatoes', '100g'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Slice courgette, fry in same pan with garlic until golden, 5 min. Add halved cherry tomatoes, cook 2 min.',
      'Mix yogurt with crumbled feta, mint, pinch of salt.',
      'Plate: courgette and tomatoes, drained tuna on top, feta yogurt alongside.',
    ],
  },
  {
    slug: 'D8b', name: 'Salmon with Spinach & Cottage Cheese Sauce', type: 'dinner',
    kcal: 720, p: 54, c: 12, f: 36,
    tin_note: 'Uses remainder of cottage cheese tub opened with D13 earlier this week.',
    ingredients: [
      ing('Salmon fillet', '125g (1 fillet)'),
      ing('Fresh spinach', '120g'),
      ing('Cottage cheese', '150g'),
      ing('Garlic cloves', '2'),
      ing('Olive oil', '12ml'),
      ing('Smoked paprika', '½ tsp'),
      ing('Dried dill', '1 tsp'),
      ing('Salt & black pepper', 'generous'),
    ],
    steps: [
      'Pan-fry salmon in olive oil, 4 min skin side, 2 min flip. Rest.',
      'Sauté garlic 30 sec. Wilt spinach 2 min. Season.',
      'Blend cottage cheese with paprika, dill, salt, pepper. Warm gently.',
      'Plate: spinach base, salmon on top, cottage cheese sauce spooned over.',
    ],
  },
  {
    slug: 'D15', name: 'Chicken with Roasted Red Peppers & Yogurt', type: 'dinner',
    kcal: 790, p: 68, c: 22, f: 28,
    ingredients: [
      ing('Chicken breast', '220g'),
      ing('Red pepper', '2'),
      ing('Cherry tomatoes', '150g'),
      ing('Full-fat Greek yogurt', '150g'),
      ing('Olive oil', '15ml'),
      ing('Garlic cloves', '3'),
      ing('Smoked paprika', '1 tsp'),
      ing('Cumin', '½ tsp'),
      ing('Dried oregano', '1 tsp'),
      ing('Salt & pepper', 'to taste'),
    ],
    steps: [
      'Preheat oven 200°C. Slice peppers, toss with half the oil, paprika, salt. Roast 20 min.',
      'Season chicken with cumin, oregano, salt. Pan-fry 6 min each side. Rest 2 min.',
      'Halve cherry tomatoes, toss in remaining oil with garlic. Add to oven last 10 min.',
      'Slice chicken. Serve with roasted peppers and tomatoes, yogurt alongside.',
    ],
  },
  {
    slug: 'D16', name: 'Egg & Sweetcorn Scramble with Sriracha', type: 'dinner',
    kcal: 738, p: 48, c: 53, f: 38, isEggDinner: true,
    ingredients: [
      ing('Whole eggs', '3'),
      ing('Egg whites', '3 whites (from ~3 eggs)'),
      ing('Sweetcorn (tinned, drained)', '198g (1 tin)'),
      ing('Cherry tomatoes', '150g'),
      ing('Spring onions', '3'),
      ing('Full-fat Greek yogurt', '150g'),
      ing('Olive oil', '12ml'),
      ing('Sriracha', 'to taste'),
      ing('Salt & black pepper', 'to taste'),
    ],
    steps: [
      'Separate 3 eggs — keep the yolks with the whole eggs. Whisk all 6 eggs (3 whole + 3 whites) together with salt and pepper.',
      'Heat olive oil in a wide pan over medium-high. Add sweetcorn and halved cherry tomatoes. Cook 3–4 min until tomatoes soften and sweetcorn gets a little colour.',
      'Pour in egg mixture. Let it set slightly at the edges, then fold gently with a spatula — you want soft, large curds, not a dry scramble. Pull off heat while still slightly glossy.',
      'Slice spring onions. Scatter over the top along with a generous drizzle of sriracha.',
      'Serve with Greek yogurt on the side to temper the heat.',
    ],
  },
];

// ─────────────────────────────────────────────
// PAIRINGS — { shared_resource, primary_slug, secondary_slug, carb_ingredient_name?, primary_carb_amount?, secondary_carb_amount? }
// ─────────────────────────────────────────────
const PAIRINGS = [
  { shared_resource: 'chickpeas-A', primary_slug: 'L3',  secondary_slug: 'L3b',  carb_ingredient_name: 'Fusilli (dry)',         primary_carb_amount: '110g', secondary_carb_amount: '75g' },
  { shared_resource: 'lentils-A',   primary_slug: 'L5',  secondary_slug: 'L5b',  carb_ingredient_name: 'Spaghetti (dry)',       primary_carb_amount: '110g', secondary_carb_amount: '75g' },
  { shared_resource: 'lentils-B',   primary_slug: 'L10', secondary_slug: 'L10b', carb_ingredient_name: 'Basmati rice (dry)',    primary_carb_amount: '100g', secondary_carb_amount: '65g' },
  { shared_resource: 'whitebeans-A',primary_slug: 'L13', secondary_slug: 'L13b', carb_ingredient_name: 'Basmati rice (dry)',    primary_carb_amount: '100g', secondary_carb_amount: '65g' },
  { shared_resource: 'ricotta-A',   primary_slug: 'L7',  secondary_slug: 'L11',  carb_ingredient_name: null,                    primary_carb_amount: null,   secondary_carb_amount: null },
  { shared_resource: 'cc-A',        primary_slug: 'D5',  secondary_slug: 'D8',   carb_ingredient_name: null,                    primary_carb_amount: null,   secondary_carb_amount: null },
  { shared_resource: 'cc-B',        primary_slug: 'D13', secondary_slug: 'D8b',  carb_ingredient_name: null,                    primary_carb_amount: null,   secondary_carb_amount: null },
];

// ─────────────────────────────────────────────
// SQL EMITTER
// ─────────────────────────────────────────────
const ALL = [BREAKFAST, SNACK, ...LUNCHES, ...DINNERS];

function sqlString(s) {
  if (s === null || s === undefined) return 'null';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function sqlJsonb(obj) {
  // Use Postgres jsonb literal — wrap JSON in single quotes and escape any '
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

let out = `-- Auto-generated by scripts/generate-seed.mjs — do not edit by hand.
-- Run \`node scripts/generate-seed.mjs\` to regenerate.

begin;

`;

for (const r of ALL) {
  out += `insert into public.recipes (slug, name, type, kcal, protein_g, carbs_g, fat_g, ingredients, steps, is_egg_dinner, tin_note) values (\n`;
  out += `  ${sqlString(r.slug)},\n`;
  out += `  ${sqlString(r.name)},\n`;
  out += `  ${sqlString(r.type)},\n`;
  out += `  ${r.kcal}, ${r.p}, ${r.c}, ${r.f},\n`;
  out += `  ${sqlJsonb(r.ingredients)},\n`;
  out += `  ${sqlJsonb(r.steps)},\n`;
  out += `  ${r.isEggDinner ? 'true' : 'false'},\n`;
  out += `  ${sqlString(r.tin_note ?? null)}\n`;
  out += `);\n\n`;
}

for (const p of PAIRINGS) {
  out += `insert into public.recipe_pairs (shared_resource, primary_recipe_id, secondary_recipe_id, carb_ingredient_name, primary_carb_amount, secondary_carb_amount) values (\n`;
  out += `  ${sqlString(p.shared_resource)},\n`;
  out += `  (select id from public.recipes where slug = ${sqlString(p.primary_slug)}),\n`;
  out += `  (select id from public.recipes where slug = ${sqlString(p.secondary_slug)}),\n`;
  out += `  ${sqlString(p.carb_ingredient_name)},\n`;
  out += `  ${sqlString(p.primary_carb_amount)},\n`;
  out += `  ${sqlString(p.secondary_carb_amount)}\n`;
  out += `);\n\n`;
}

out += `commit;\n`;

writeFileSync(OUT, out);
console.log(`Wrote ${OUT}`);
console.log(`  ${ALL.length} recipes, ${PAIRINGS.length} pairings`);
