import type { Recipe, RecipePair } from '../lib/types';

interface Props {
  recipes: Recipe[];
  pairs: RecipePair[];
  onOpen: (id: string) => void;
}

export function RecipesView({ recipes, pairs, onOpen }: Props) {
  const secondaryIds = new Set(pairs.map(p => p.secondary_recipe_id));

  const breakfast = recipes.filter(r => r.type === 'breakfast');
  const snack     = recipes.filter(r => r.type === 'snack');
  const lunchSolos = recipes.filter(r => r.type === 'lunch' && !secondaryIds.has(r.id));
  const lunchSecondaries = recipes.filter(r => r.type === 'lunch' && secondaryIds.has(r.id));
  const dinnersNonEgg = recipes.filter(r => r.type === 'dinner' && !r.is_egg_dinner);
  const dinnersEgg = recipes.filter(r => r.type === 'dinner' && r.is_egg_dinner);

  const sections = [
    { title: 'Breakfast', meals: breakfast },
    { title: 'Snack',    meals: snack },
    { title: 'Lunches',  meals: lunchSolos },
    { title: 'Lunches — Tin Carry-over Variants', meals: lunchSecondaries },
    { title: 'Dinners',  meals: dinnersNonEgg },
    { title: 'Dinners — Egg-based', meals: dinnersEgg },
  ];

  return (
    <div className="view">
      {sections.map(sec => sec.meals.length > 0 && (
        <div key={sec.title} className="recipes-section">
          <div className="recipes-section-title">
            <span>{sec.title}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 400, letterSpacing: '0.05em' }}>
              {sec.meals.length} recipe{sec.meals.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="recipes-grid">
            {sec.meals.map(meal => (
              <div key={meal.id} className="recipe-card" onClick={() => onOpen(meal.id)}>
                <div className={`meal-type ${meal.type}`}>{meal.type}</div>
                <div className="meal-name">{meal.name}</div>
                <div className="meal-macros">
                  <span>{meal.kcal}</span> kcal · <span>{meal.protein_g}g</span>P · <span>{meal.carbs_g}g</span>C · <span>{meal.fat_g}g</span>F
                </div>
                {meal.tin_note && <div className="tin-badge">↺ uses previous tin/tub</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
