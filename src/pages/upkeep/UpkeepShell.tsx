import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/api/auth';

const F = '#1d3a2c';
const F2 = '#2a5141';
const CLAY = '#c8743a';

interface NavItem { to: string; label: string; icon: ReactNode; }

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.55" fill="none" />
        <rect x="10" y="2.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.55" fill="none" />
        <rect x="2.5" y="10" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.55" fill="none" />
        <rect x="10" y="10" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.55" fill="none" />
      </svg>
    ),
  },
  {
    to: '/assets',
    label: 'Assets',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <rect x="4" y="2" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.55" fill="none" />
        <path d="M4 7.3h10" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
        <path d="M6.3 4.3v1.4M6.3 9.4v2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/maintenance',
    label: 'Maintenance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M2.5 3.5h13M2.5 7.5h13M2.5 11.5h9" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function UpkeepShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#efece4', display: 'flex', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 212, background: '#fff', borderRight: '1px solid #e4e0d8', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 16px', borderBottom: '1px solid #e4e0d8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <path d="M7 23L24 9l17 14" stroke={F} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 21v16a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V21" stroke={F} strokeWidth="3" strokeLinejoin="round" />
              <rect x="20.5" y="28" width="7" height="11" rx="1.5" fill={CLAY} />
            </svg>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: F, lineHeight: 1 }}>Upkeep</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: CLAY, marginTop: 2 }}>Home Care</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 0', flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                margin: '0 10px 2px', padding: '8px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? F : '#5e5953',
                background: isActive ? '#e7efe9' : 'transparent',
                textDecoration: 'none', position: 'relative', fontFamily: 'inherit',
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, background: F2 }} />}
                  {item.icon}
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '10px 10px 14px', borderTop: '1px solid #e4e0d8' }}>
          <button
            onClick={signOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#a39c92', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
