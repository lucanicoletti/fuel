import { useMemo, useState } from 'react';
import type { Ingredient, MealType, Recipe, RecipePair } from '../lib/types';
import { supabase } from '../lib/supabase';
import { parseAmount } from '../lib/parseAmount';

interface Props {
  recipes: Recipe[];
  pairs: RecipePair[];
  onChange: () => void | Promise<void>;
}

type DraftIngredient = Pick<Ingredient, 'name' | 'amount' | 'is_tin_ingredient' | 'is_carb_adjust'>;

interface Draft {
  id: string | null;          // null = new
  slug: string;
  name: string;
  type: MealType;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: DraftIngredient[];
  steps: string[];
  is_egg_dinner: boolean;
  tin_note: string;
}

const EMPTY_DRAFT: Draft = {
  id: null,
  slug: '',
  name: '',
  type: 'lunch',
  kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
  ingredients: [],
  steps: [],
  is_egg_dinner: false,
  tin_note: '',
};

function recipeToDraft(r: Recipe): Draft {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    type: r.type,
    kcal: r.kcal,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    ingredients: r.ingredients.map(i => ({
      name: i.name, amount: i.amount,
      is_tin_ingredient: i.is_tin_ingredient,
      is_carb_adjust: i.is_carb_adjust,
    })),
    steps: [...r.steps],
    is_egg_dinner: r.is_egg_dinner,
    tin_note: r.tin_note ?? '',
  };
}

function draftToRow(d: Draft) {
  const ingredients: Ingredient[] = d.ingredients.map(i => {
    const { value, unit } = parseAmount(i.amount);
    return {
      name: i.name,
      amount: i.amount,
      amount_value: value,
      amount_unit: unit,
      is_tin_ingredient: i.is_tin_ingredient,
      is_carb_adjust: i.is_carb_adjust,
    };
  });
  return {
    slug: d.slug.trim(),
    name: d.name.trim(),
    type: d.type,
    kcal: d.kcal,
    protein_g: d.protein_g,
    carbs_g: d.carbs_g,
    fat_g: d.fat_g,
    ingredients,
    steps: d.steps,
    is_egg_dinner: d.is_egg_dinner,
    tin_note: d.tin_note.trim() || null,
  };
}

export function RecipeEditor({ recipes, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(r => r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q));
  }, [recipes, search]);

  function startNew() {
    setDraft({ ...EMPTY_DRAFT });
  }

  function pick(r: Recipe) {
    setDraft(recipeToDraft(r));
  }

  function update<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft(d => d ? { ...d, [k]: v } : d);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    const row = draftToRow(draft);
    const { error } = draft.id
      ? await supabase.from('recipes').update(row).eq('id', draft.id)
      : await supabase.from('recipes').insert(row);
    setSaving(false);
    if (error) { alert(error.message); return; }
    await onChange();
    setDraft(null);
  }

  async function remove() {
    if (!draft || !draft.id) return;
    if (!confirm(`Delete "${draft.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('recipes').delete().eq('id', draft.id);
    if (error) { alert(error.message); return; }
    await onChange();
    setDraft(null);
  }

  return (
    <div className="view">
      <div className="editor-toolbar">
        <input
          className="editor-search"
          placeholder="Search recipes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn-secondary" onClick={startNew}>+ New recipe</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        <div className="recipes-grid" style={{ gridTemplateColumns: '1fr', alignContent: 'start' }}>
          {filtered.map(r => (
            <div
              key={r.id}
              className="recipe-card"
              onClick={() => pick(r)}
              style={{ borderLeft: draft?.id === r.id ? '2px solid var(--accent)' : '2px solid transparent' }}
            >
              <div className={`meal-type ${r.type}`}>{r.type}</div>
              <div className="meal-name">{r.name}</div>
              <div className="meal-macros"><span>{r.slug}</span></div>
            </div>
          ))}
        </div>

        {!draft && (
          <div className="no-plan-msg" style={{ padding: 60 }}>
            <span className="big" style={{ fontSize: '2.5rem' }}>EDIT</span>
            Pick a recipe or create a new one
          </div>
        )}

        {draft && (
          <div className="editor-form">
            <div className="field-row">
              <div className="field">
                <label>Slug (unique)</label>
                <input type="text" value={draft.slug} onChange={e => update('slug', e.target.value)} />
              </div>
              <div className="field">
                <label>Type</label>
                <select value={draft.type} onChange={e => update('type', e.target.value as MealType)}>
                  <option value="breakfast">breakfast</option>
                  <option value="snack">snack</option>
                  <option value="lunch">lunch</option>
                  <option value="dinner">dinner</option>
                </select>
              </div>
              <div className="field">
                <label>Egg dinner?</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontFamily: "'DM Mono', monospace", fontSize: '0.78rem' }}>
                  <input type="checkbox" checked={draft.is_egg_dinner} onChange={e => update('is_egg_dinner', e.target.checked)} />
                  capped at 2/week
                </label>
              </div>
              <div className="field">
                <label>&nbsp;</label>
                <span style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem' }}>
                  {draft.id ? `id: ${draft.id.slice(0, 8)}…` : 'new'}
                </span>
              </div>
            </div>

            <div className="field">
              <label>Name</label>
              <input type="text" value={draft.name} onChange={e => update('name', e.target.value)} />
            </div>

            <div className="field-row">
              <div className="field">
                <label>kcal</label>
                <input type="number" value={draft.kcal} onChange={e => update('kcal', +e.target.value)} />
              </div>
              <div className="field">
                <label>Protein g</label>
                <input type="number" value={draft.protein_g} onChange={e => update('protein_g', +e.target.value)} />
              </div>
              <div className="field">
                <label>Carbs g</label>
                <input type="number" value={draft.carbs_g} onChange={e => update('carbs_g', +e.target.value)} />
              </div>
              <div className="field">
                <label>Fat g</label>
                <input type="number" value={draft.fat_g} onChange={e => update('fat_g', +e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Tin note (optional)</label>
              <input type="text" value={draft.tin_note} onChange={e => update('tin_note', e.target.value)} placeholder="e.g. Uses remainder of the lentil tin opened earlier this week." />
            </div>

            <div className="field">
              <label>Ingredients</label>
              {draft.ingredients.map((ing, i) => (
                <div key={i} className="list-row">
                  <input
                    type="text"
                    placeholder="name"
                    value={ing.name}
                    onChange={e => {
                      const next = [...draft.ingredients];
                      next[i] = { ...next[i], name: e.target.value };
                      update('ingredients', next);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="amount (e.g. 120g)"
                    value={ing.amount}
                    onChange={e => {
                      const next = [...draft.ingredients];
                      next[i] = { ...next[i], amount: e.target.value };
                      update('ingredients', next);
                    }}
                  />
                  <div className="ing-flags">
                    <label>
                      <input
                        type="checkbox"
                        checked={ing.is_tin_ingredient}
                        onChange={e => {
                          const next = [...draft.ingredients];
                          next[i] = { ...next[i], is_tin_ingredient: e.target.checked };
                          update('ingredients', next);
                        }}
                      />
                      tin
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={ing.is_carb_adjust}
                        onChange={e => {
                          const next = [...draft.ingredients];
                          next[i] = { ...next[i], is_carb_adjust: e.target.checked };
                          update('ingredients', next);
                        }}
                      />
                      carb-adj
                    </label>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 8px' }}
                      onClick={() => update('ingredients', draft.ingredients.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="btn-secondary"
                onClick={() => update('ingredients', [...draft.ingredients, { name: '', amount: '', is_tin_ingredient: false, is_carb_adjust: false }])}
              >
                + Add ingredient
              </button>
            </div>

            <div className="field">
              <label>Steps</label>
              {draft.steps.map((s, i) => (
                <div key={i} className="step-row">
                  <textarea
                    rows={2}
                    value={s}
                    onChange={e => {
                      const next = [...draft.steps];
                      next[i] = e.target.value;
                      update('steps', next);
                    }}
                  />
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 8px', alignSelf: 'flex-start' }}
                    onClick={() => update('steps', draft.steps.filter((_, idx) => idx !== i))}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => update('steps', [...draft.steps, ''])}>
                + Add step
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
              <button className="generate-btn" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : draft.id ? 'Save changes' : 'Create recipe'}
              </button>
              <button className="btn-secondary" onClick={() => setDraft(null)}>Cancel</button>
              {draft.id && (
                <button className="btn-danger" onClick={remove}>Delete</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
