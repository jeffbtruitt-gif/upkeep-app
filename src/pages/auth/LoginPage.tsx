import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/api/auth';

const F = '#1d3a2c';
const CLAY = '#c8743a';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#efece4', fontFamily: "'Hanken Grotesk', system-ui, sans-serif", padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 14, border: '1px solid #e4e0d8', boxShadow: '0 8px 24px rgba(28,26,23,0.10)', overflow: 'hidden' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #e4e0d8', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <path d="M7 23L24 9l17 14" stroke={F} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 21v16a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V21" stroke={F} strokeWidth="3" strokeLinejoin="round" />
            <rect x="20.5" y="28" width="7" height="11" rx="1.5" fill={CLAY} />
          </svg>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: F, letterSpacing: '-0.02em', lineHeight: 1 }}>Upkeep</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: CLAY, marginTop: 3 }}>Home Care</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3f7a64', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
            <input
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cfe0d8', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: F, background: '#f3f7f4', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3f7a64', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Password</div>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cfe0d8', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: F, background: '#f3f7f4', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {error && <div style={{ fontSize: 13, color: '#c0392b', background: '#fbeae7', border: '1px solid #c0392b', borderRadius: 6, padding: '8px 12px' }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: loading ? '#a3c4b6' : F, color: '#fff', border: 'none', borderRadius: 6, padding: '10px', fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', marginTop: 4 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
