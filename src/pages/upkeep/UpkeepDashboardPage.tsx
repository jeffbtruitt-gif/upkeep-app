import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaintenanceDetailModal } from './MaintenanceDetailModal';
import { useIsMobile, pagePad } from '@/lib/useIsMobile';
import {
  useUpkeepAssets,
  useAllUpkeepMaintenance,
  getNextDueDate,
  getMaintenanceStatus,
  CAT_STYLES,
  FREQ_LABELS,
} from '@/api/upkeep';

const F = '#1d3a2c';
const CLAY = '#c8743a';

const STATUS_STYLES = {
  overdue:   { bg: '#fbeae7', text: '#c0392b', label: 'Overdue' },
  due_soon:  { bg: '#f8efd9', text: '#8a5a00', label: 'Due soon' },
  scheduled: { bg: '#e8f0f6', text: '#2c6e9c', label: 'Scheduled' },
  as_needed: { bg: '#f1eee8', text: '#5e5953', label: 'As needed' },
};

function fmt(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function UpkeepDashboardPage() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const { data: assets = [], isLoading: assetsLoading } = useUpkeepAssets();
  const { data: allMaint = [], isLoading: maintLoading } = useAllUpkeepMaintenance();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = allMaint.find((m) => m.id === viewingId) ?? null;

  const activeAssets = assets.filter((a) => a.status === 'active');

  const maintWithStatus = allMaint.map((m) => ({
    ...m,
    nextDate: getNextDueDate(m),
    status: getMaintenanceStatus(m),
    assetName: m.upkeep_assets?.name ?? '',
  }));

  const overdue = maintWithStatus.filter((m) => m.status === 'overdue');
  const dueSoon = maintWithStatus.filter((m) => m.status === 'due_soon');
  const upcoming = [...maintWithStatus]
    .filter((m) => m.status !== 'as_needed')
    .sort((a, b) => {
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return a.nextDate.getTime() - b.nextDate.getTime();
    })
    .slice(0, 8);

  const isLoading = assetsLoading || maintLoading;

  return (
    <div style={{ padding: pagePad(mobile), fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: mobile ? 16 : 24 }}>
        <div>
          <div style={{ fontSize: mobile ? 23 : 26, fontWeight: 700, color: F, letterSpacing: '-0.015em' }}>Dashboard</div>
          <div style={{ fontSize: 14, color: '#7d776f', marginTop: 3 }}>
            {overdue.length > 0
              ? `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue${dueSoon.length > 0 ? ` · ${dueSoon.length} due soon` : ''}.`
              : dueSoon.length > 0
              ? `${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} coming up soon.`
              : 'Everything is up to date.'}
          </div>
        </div>
        <button
          onClick={() => navigate('/assets')}
          style={{ background: F, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 4px rgba(28,26,23,0.08)', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          + Add Asset
        </button>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: mobile ? 10 : 14, marginBottom: mobile ? 16 : 24 }}>
        {[
          { label: 'Assets Tracked', value: isLoading ? '—' : String(activeAssets.length), sub: 'active items', strip: '#3f7a64' },
          { label: 'Due This Month', value: isLoading ? '—' : String(dueSoon.length), sub: 'next 30 days', strip: '#b8821f' },
          { label: 'Overdue', value: isLoading ? '—' : String(overdue.length), sub: 'needs attention', strip: '#c0392b', red: overdue.length > 0 },
          { label: 'Maintenance Items', value: isLoading ? '—' : String(allMaint.length), sub: 'scheduled tasks', strip: CLAY },
        ].map((k) => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e0d8', boxShadow: '0 2px 4px rgba(28,26,23,0.06)', overflow: 'hidden' }}>
            <div style={{ height: 3, background: k.strip }} />
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: '#a39c92', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: (k as any).red ? '#c0392b' : F, letterSpacing: '-0.01em' }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#7d776f', marginTop: 3 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming maintenance */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', overflow: 'hidden', boxShadow: '0 2px 4px rgba(28,26,23,0.06)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1eee8' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: F }}>Upcoming Maintenance</div>
          <span style={{ fontSize: 12, color: '#3f7a64', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/maintenance')}>View all →</span>
        </div>
        {isLoading ? (
          <div style={{ padding: 24, color: '#a39c92', fontSize: 13 }}>Loading…</div>
        ) : upcoming.length === 0 ? (
          <div style={{ padding: 24, color: '#a39c92', fontSize: 13 }}>No scheduled maintenance items yet. Add assets and maintenance tasks to get started.</div>
        ) : (
          <>
            {!mobile && <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 100px 120px', padding: '8px 18px', background: '#f8f6f2', borderBottom: '1px solid #e4e0d8' }}>
              {['Task', 'Asset', 'Due', 'Status'].map((h) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#a39c92', letterSpacing: '0.09em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>}
            {upcoming.map((m, i) => {
              const st = STATUS_STYLES[m.status];
              if (mobile) return (
                <div key={m.id} onClick={() => setViewingId(m.id)} style={{ padding: '12px 14px', borderBottom: i < upcoming.length - 1 ? '1px solid #f1eee8' : 'none', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: F, lineHeight: 1.3 }}>{m.title}</div>
                    <span style={{ background: st.bg, color: st.text, borderRadius: 9999, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#7d776f', marginTop: 4 }}>{m.assetName} · Due {m.nextDate ? fmt(m.nextDate) : '—'}</div>
                </div>
              );
              return (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 100px 120px', padding: '10px 18px', borderBottom: i < upcoming.length - 1 ? '1px solid #f1eee8' : 'none', alignItems: 'center', cursor: 'pointer' }} onClick={() => setViewingId(m.id)}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: F }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: '#a39c92' }}>{FREQ_LABELS[m.frequency]}</div>
                  </div>
                  <span style={{ fontSize: 12.5, color: '#7d776f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.assetName}</span>
                  <span style={{ fontSize: 12.5, color: '#45413b', fontWeight: 500 }}>{m.nextDate ? fmt(m.nextDate) : '—'}</span>
                  <div><span style={{ background: st.bg, color: st.text, borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{st.label}</span></div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Recent assets */}
      {!isLoading && activeAssets.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7d776f', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Asset Spotlight</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: mobile ? 10 : 14 }}>
            {activeAssets.slice(0, 6).map((a) => {
              const cs = CAT_STYLES[a.category] ?? CAT_STYLES.general;
              return (
                <div key={a.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', overflow: 'hidden', boxShadow: '0 2px 4px rgba(28,26,23,0.06)', cursor: 'pointer' }} onClick={() => navigate(`/assets/${a.id}`)}>
                  <div style={{ height: mobile ? 56 : 80, background: 'repeating-linear-gradient(45deg,#f1eee8,#f1eee8 8px,#f8f6f2 8px,#f8f6f2 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 10, color: '#a39c92', letterSpacing: '0.04em' }}>asset photo</span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <span style={{ background: cs.bg, color: cs.text, borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 600 }}>{a.category}</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: F, marginTop: 6 }}>{a.name}</div>
                    {a.location && <div style={{ fontSize: 11, color: '#a39c92', marginTop: 2 }}>{a.location}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {viewing && (
        <MaintenanceDetailModal
          item={viewing}
          assetName={viewing.upkeep_assets?.name}
          onClose={() => setViewingId(null)}
          onOpenAsset={() => navigate(`/assets/${viewing.asset_id}`)}
        />
      )}
    </div>
  );
}
