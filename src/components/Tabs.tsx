export type TabKey = 'plan' | 'shop' | 'recipes' | 'editor' | 'saved';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'plan',    label: 'Week Plan' },
  { key: 'shop',    label: 'Shopping List' },
  { key: 'recipes', label: 'All Recipes' },
  { key: 'editor',  label: 'Edit Recipes' },
  { key: 'saved',   label: 'Saved Plans' },
];

export function Tabs({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <div className="tabs">
      {TABS.map(t => (
        <button
          key={t.key}
          className={`tab-btn ${tab === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
