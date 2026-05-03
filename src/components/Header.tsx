import { useAuth } from '../hooks/useAuth';

export function Header() {
  const { signOut } = useAuth();
  return (
    <header className="app-header">
      <div className="logo">FUEL<span>.</span></div>
      <div className="header-actions">
        <div className="header-meta">
          90kg · 188cm · 31y · Lean Bulk<br />
          Target: <strong>2,850 kcal</strong> · <strong>180g P</strong> · <strong>310g C</strong> · <strong>75g F</strong>
        </div>
        <button className="signout-btn" onClick={() => signOut()}>Sign out</button>
      </div>
    </header>
  );
}
