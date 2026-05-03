import type { WeekPlan } from '../lib/types';
import { supabase } from '../lib/supabase';

interface Props {
  plans: WeekPlan[];
  onLoad: (p: WeekPlan) => void;
  onChange: () => void | Promise<void>;
}

export function SavedPlansView({ plans, onLoad, onChange }: Props) {
  async function remove(id: string, label: string) {
    if (!confirm(`Delete saved plan "${label}"?`)) return;
    const { error } = await supabase.from('week_plans').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await onChange();
  }

  if (plans.length === 0) {
    return (
      <div className="view">
        <div className="no-plan-msg">
          <span className="big">—</span>
          No saved plans yet. Generate a week and hit "Save week".
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="saved-list">
        {plans.map(p => {
          const dateLabel = new Date(p.week_start_date).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          });
          const lunches = p.days.filter(d => d.lunch?.snapshot).map(d => d.lunch!.snapshot!.name);
          return (
            <div key={p.id} className="saved-card" onClick={() => onLoad(p)}>
              <div className="saved-date">{dateLabel}</div>
              <div className="saved-meta">
                {p.label || '—'}<br />
                {lunches.length} lunches · saved {new Date(p.created_at).toLocaleDateString('en-GB')}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={e => { e.stopPropagation(); onLoad(p); }}>Load</button>
                <button className="btn-danger" onClick={e => { e.stopPropagation(); remove(p.id, p.label || dateLabel); }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
