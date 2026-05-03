import { useState } from 'react';
import type { DayName, DayPlan, MealSlot } from '../lib/types';
import { weekAverages, dayKcal } from '../lib/macros';

interface Props {
  plans: [DayPlan[] | null, DayPlan[] | null];
  activeWeek: number;
  setActiveWeek: (n: number) => void;
  chocState: [Partial<Record<DayName, boolean>>, Partial<Record<DayName, boolean>>];
  toggleChoc: (weekIdx: 0 | 1, day: DayName) => void;
  generatedAt: Date | null;
  onGenerate: () => void;
  onOpenRecipe: (id: string) => void;
  onSaveWeek: (weekIdx: 0 | 1, weekStartDate: string, label: string | null) => void;
}

function MealCard({ slot, onOpenRecipe }: { slot: MealSlot; onOpenRecipe: (id: string) => void }) {
  const r = slot.snapshot;
  if (!r) return null;
  return (
    <div className="meal-card" onClick={() => slot.recipe_id && onOpenRecipe(slot.recipe_id)}>
      <div className={`meal-type ${r.type}`}>{r.type}</div>
      <div className="meal-name">{r.name}</div>
      <div className="meal-macros">
        <span>{r.kcal}</span> kcal · <span>{r.protein_g}g</span>P · <span>{r.carbs_g}g</span>C · <span>{r.fat_g}g</span>F
      </div>
      {r.tin_note && <div className="tin-badge">↺ tin carry-over</div>}
    </div>
  );
}

export function WeekPlanView(props: Props) {
  const { plans, activeWeek, setActiveWeek, chocState, toggleChoc, generatedAt, onGenerate, onOpenRecipe, onSaveWeek } = props;
  const plan = plans[activeWeek];
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [saveDate, setSaveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saveLabel, setSaveLabel] = useState('');

  const headerLabel = generatedAt
    ? `Generated ${generatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : 'No plan generated yet';

  const showSwitcher = plans[0] && plans[1];

  return (
    <div className="view">
      <div className="generate-area">
        <button className="generate-btn" onClick={onGenerate}>⟳ Generate 2 Weeks</button>
        {showSwitcher && (
          <div className="week-switcher">
            <button className={`week-switch-btn ${activeWeek === 0 ? 'active' : ''}`} onClick={() => setActiveWeek(0)}>Week 1</button>
            <button className={`week-switch-btn ${activeWeek === 1 ? 'active' : ''}`} onClick={() => setActiveWeek(1)}>Week 2</button>
          </div>
        )}
        <div className="week-label">{headerLabel}</div>
        {plan && (
          <button className="btn-secondary" onClick={() => setSavePromptOpen(true)}>Save week</button>
        )}
      </div>

      {plan && <MacroBar plan={plan} chocState={chocState[activeWeek]} />}

      {!plan && (
        <div className="no-plan-msg">
          <span className="big">FUEL</span>
          Hit Generate to build your 2-week plan
        </div>
      )}

      {plan && (
        <div className="week-grid">
          {plan.map(day => {
            const isSat = day.day === 'SAT';
            const hasChoc = chocState[activeWeek][day.day] ?? false;
            const kcal = dayKcal(day, hasChoc);
            return (
              <div key={day.day} className="day-col">
                <div className="day-header">{day.day}</div>
                <div className="day-kcal">
                  {kcal} kcal{isSat && <span style={{ fontSize: '0.55rem', opacity: 0.6 }}> ~est.</span>}
                </div>
                {day.breakfast.snapshot && <MealCard slot={day.breakfast} onOpenRecipe={onOpenRecipe} />}
                {day.snack.snapshot && <MealCard slot={day.snack} onOpenRecipe={onOpenRecipe} />}
                {day.lunch ? <MealCard slot={day.lunch} onOpenRecipe={onOpenRecipe} /> : <div className="skip-badge">lunch out</div>}
                {day.dinner ? <MealCard slot={day.dinner} onOpenRecipe={onOpenRecipe} /> : <div className="skip-badge">dinner out</div>}
                <label className="choc-row" title="~110 kcal dark chocolate">
                  <input
                    type="checkbox"
                    checked={hasChoc}
                    onChange={() => toggleChoc(activeWeek as 0 | 1, day.day)}
                  />
                  <span>🍫</span>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {savePromptOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setSavePromptOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-type">Save week</div>
              <div className="modal-title">Save Week {activeWeek + 1}</div>
              <button className="modal-close" onClick={() => setSavePromptOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Week start date</label>
                <input type="date" value={saveDate} onChange={e => setSaveDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Label (optional)</label>
                <input type="text" placeholder="e.g. Cutting block W3" value={saveLabel} onChange={e => setSaveLabel(e.target.value)} />
              </div>
              <button
                className="generate-btn"
                onClick={() => {
                  onSaveWeek(activeWeek as 0 | 1, saveDate, saveLabel.trim() || null);
                  setSavePromptOpen(false);
                  setSaveLabel('');
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroBar({ plan, chocState }: { plan: DayPlan[]; chocState: Partial<Record<DayName, boolean>> }) {
  const a = weekAverages(plan, chocState);
  return (
    <div className="macro-bar">
      <div className="macro-cell"><div className="val">{a.kcal}</div><div className="label">Avg kcal/day</div></div>
      <div className="macro-cell"><div className="val">{a.p}g</div><div className="label">Avg Protein g</div></div>
      <div className="macro-cell"><div className="val">{a.c}g</div><div className="label">Avg Carbs g</div></div>
      <div className="macro-cell"><div className="val">{a.f}g</div><div className="label">Avg Fat g</div></div>
    </div>
  );
}
