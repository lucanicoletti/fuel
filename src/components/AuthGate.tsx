import { useState } from 'react';
import { OWNER_EMAIL, supabase } from '../lib/supabase';

export function AuthGate() {
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">FUEL<span style={{ color: 'var(--text)' }}>.</span></div>
        <div className="auth-tag">Sign in</div>
        <form onSubmit={sendMagicLink}>
          <input
            type="email"
            className="auth-input"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <button type="submit" className="auth-btn" disabled={status === 'sending' || status === 'sent'}>
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Check your email' : 'Send magic link'}
          </button>
        </form>
        {status === 'sent' && (
          <div className="auth-msg success">Magic link sent. Click it from your inbox to sign in.</div>
        )}
        {status === 'error' && error && (
          <div className="auth-msg error">{error}</div>
        )}
      </div>
    </div>
  );
}
