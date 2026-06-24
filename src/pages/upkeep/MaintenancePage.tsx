import { useNavigate } from 'react-router-dom';
import { useAllUpkeepMaintenance, getNextDueDate, getMaintenanceStatus, FREQ_LABELS } from '@/api/upkeep';

const F = '#1d3a2c';

const STATUS_STYLES = {
  overdue:   { bg: '#fbeae7', text: '#c0392b', label: 'Overdue' },
  due_soon:  { bg: '#f8efd9', text: '#8a5a00', label: 'Due soon' },
  scheduled: { bg: '#e8f0f6', text: '#2c6e9c', label: 'Scheduled' },
  as_needed: { bg: '#f1eee8', text: '#5e5953', label: 'As needed' },
};

function fmt(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MaintenancePage() {
  const navigate = useNavigate();
  const { data: allMaint = [], isLoading } = useAllUpkeepMaintenance();

  const withStatus = allMaint.map((m) => ({
    ...m, nextDate: getNextDueDate(m), status: getMaintenanceStatus(m), assetName: m.upkeep_assets?.name ?? '',
  }));

  const groups = [
    { key: 'overdue',   label: 'Overdue',  items: withStatus.filter((m) => m.status === 'overdue') },
    { key: 'due_soon',  label: 'Due Soon', items: withStatus.filter((m) => m.status === 'due_soon') },
    { key: 'scheduled', label: 'Upcoming', items: withStatus.filter((m) => m.status === 'scheduled').sort((a, b) => (a.nextDate?.getTime() ?? 0) - (b.nextDate?.getTime() ?? 0)) },
    { key: 'as_needed', label: 'As Needed', items: withStatus.filter((m) => m.status === 'as_needed') },
  ].filter((g) => g.items.length > 0);

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: F, letterSpacing: '-0.015em', marginBottom: 6 }}>Maintenance Schedule</div>
      <div style={{ fontSize: 14, color: '#7d776f', marginBottom: 24 }}>All scheduled tasks across active assets.</div>

      {isLoading ? (
        <div style={{ color: '#a39c92', fontSize: 13 }}>Loading…</div>
      ) : allMaint.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', padding: 32, textAlign: 'center', color: '#a39c92', fontSize: 13 }}>
          No maintenance items yet. Open an asset and add maintenance tasks to get started.
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7d776f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{g.label}</div>
              <span style={{ background: STATUS_STYLES[g.key as keyof typeof STATUS_STYLES].bg, color: STATUS_STYLES[g.key as keyof typeof STATUS_STYLES].text, borderRadius: 9999, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{g.items.length}</span>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', overflow: 'hidden', boxShadow: '0 2px 4px rgba(28,26,23,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 110px 120px 120px', padding: '8px 18px', background: '#f8f6f2', borderBottom: '1px solid #e4e0d8' }}>
                {['Task', 'Asset', 'Frequency', 'Next Due', 'Status'].map((h) => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#a39c92', letterSpacing: '0.09em', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>
              {g.items.map((m, i) => {
                const st = STATUS_STYLES[m.status];
                return (
                  <div key={m.id}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 110px 120px 120px', padding: '11px 18px', borderBottom: i < g.items.length - 1 ? '1px solid #f1eee8' : 'none', alignItems: 'center', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f7f4')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    onClick={() => navigate(`/assets/${m.asset_id}`)}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: F }}>{m.title}</div>
                      {m.description && <div style={{ fontSize: 11, color: '#a39c92', marginTop: 2 }}>{m.description}</div>}
                    </div>
                    <span style={{ fontSize: 12.5, color: '#7d776f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.assetName}</span>
                    <span style={{ fontSize: 12, color: '#7d776f' }}>{FREQ_LABELS[m.frequency]}</span>
                    <span style={{ fontSize: 12.5, color: '#45413b', fontWeight: 500 }}>{m.nextDate ? fmt(m.nextDate) : '—'}</span>
                    <div><span style={{ background: st.bg, color: st.text, borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{st.label}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
