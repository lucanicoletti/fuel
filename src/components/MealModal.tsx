import type { DayPlan, Recipe } from '../lib/types';

interface Props {
  recipeId: string | null;
  recipes: Recipe[];
  plans: [DayPlan[] | null, DayPlan[] | null];
  onClose: () => void;
}

export function MealModal({ recipeId, recipes, plans, onClose }: Props) {
  if (!recipeId) return null;

  // Try current recipes first; fall back to a snapshot embedded in either plan
  const current = recipes.find(r => r.id === recipeId);
  let meal = current;
  if (!meal) {
    for (const plan of plans) {
      if (!plan) continue;
      for (const day of plan) {
        for (const slot of [day.breakfast, day.snack, day.lunch, day.dinner]) {
          if (slot?.recipe_id === recipeId && slot.snapshot) { meal = slot.snapshot; break; }
        }
        if (meal) break;
      }
      if (meal) break;
    }
  }

  if (!meal) return null;

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-type">{meal.type}</div>
          <div className="modal-title">{meal.name}</div>
          {meal.tin_note && <div className="modal-tin-note">{meal.tin_note}</div>}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="macro-pills">
            <div className="pill"><span className="pval">{meal.kcal}</span> kcal</div>
            <div className="pill"><span className="pval">{meal.protein_g}g</span> protein</div>
            <div className="pill"><span className="pval">{meal.carbs_g}g</span> carbs</div>
            <div className="pill"><span className="pval">{meal.fat_g}g</span> fat</div>
          </div>
          <div className="section-label">Ingredients</div>
          <ul className="ingredients-list">
            {meal.ingredients.map((ing, i) => (
              <li key={i}>
                <span>{ing.name}</span>
                <span className="ing-amount">{ing.amount}</span>
              </li>
            ))}
          </ul>
          <div className="section-label">Method</div>
          <ol className="steps-list">
            {meal.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      </div>
    </div>
  );
}
