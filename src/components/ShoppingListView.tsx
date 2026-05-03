import { useState } from 'react';
import type { DayPlan, RecipePair } from '../lib/types';
import { buildShoppingList, primaryRecipeIdSet } from '../lib/shopping';

interface Props {
  plans: [DayPlan[] | null, DayPlan[] | null];
  pairs: RecipePair[];
}

export function ShoppingListView({ plans, pairs }: Props) {
  const [scope, setScope] = useState<0 | 1 | 2>(0);

  const selected: DayPlan[][] = [];
  if (scope === 0 && plans[0]) selected.push(plans[0]);
  if (scope === 1 && plans[1]) selected.push(plans[1]);
  if (scope === 2) {
    if (plans[0]) selected.push(plans[0]);
    if (plans[1]) selected.push(plans[1]);
  }

  if (selected.length === 0) {
    return (
      <div className="view">
        <div className="no-plan-msg"><span className="big">—</span>Generate a plan first</div>
      </div>
    );
  }

  const cats = buildShoppingList({ weekPlans: selected, primaryRecipeIds: primaryRecipeIdSet(pairs) });

  return (
    <div className="view">
      <div className="shop-controls">
        <div className="shop-title">Shopping List</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="shop-week-toggle">
            <button className={`shop-week-btn ${scope === 0 ? 'active' : ''}`} onClick={() => setScope(0)}>Week 1</button>
            <button className={`shop-week-btn ${scope === 1 ? 'active' : ''}`} onClick={() => setScope(1)}>Week 2</button>
            <button className={`shop-week-btn ${scope === 2 ? 'active' : ''}`} onClick={() => setScope(2)}>Both</button>
          </div>
          <button className="print-btn" onClick={() => window.print()}>Print</button>
        </div>
      </div>
      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 22 }}>
        Quantities consolidated. Tin carry-overs not double-counted.
      </p>
      <div className="shop-categories">
        {cats.map(c => (
          <div key={c.category} className="shop-category">
            <div className="shop-cat-title">{c.category}</div>
            {c.items.map(item => (
              <div key={item.name} className="shop-item">
                <span>{item.name}</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {item.tinsNeeded > 0 && (
                    <span className="shop-tins">{item.tinsNeeded} tin{item.tinsNeeded > 1 ? 's' : ''}</span>
                  )}
                  <span className="shop-qty">{item.qty}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
