import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllUpkeepMaintenance, getNextDueDate, getMaintenanceStatus, fmtDate, byFrequency } from '@/api/upkeep';
import { MaintenanceDetailModal, FrequencyPill } from './MaintenanceDetailModal';
import { useIsMobile, pagePad } from '@/lib/useIsMobile';

const F = '#1d3a2c';

const STATUS_STYLES = {
  overdue:   { bg: '#fbeae7', text: '#c0392b', label: 'Overdue' },
  due_soon:  { bg: '#f8efd9', text: '#8a5a00', label: 'Due soon' },
  scheduled: { bg: '#e8f0f6', text: '#2c6e9c', label: 'Scheduled' },
  as_needed: { bg: '#f1eee8', text: '#5e5953', label: 'As needed' },
};

const COLS = '2fr 1.2fr 130px 115px 115px 105px';

export function MaintenancePage() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const { data: allMaint = [], isLoading } = useAllUpkeepMaintenance();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = allMaint.find((m) => m.id === viewingId) ?? null;

  const withStatus = allMaint.map((m) => ({
    ...m, nextDate: getNextDueDate(m), status: getMaintenanceStatus(m), assetName: m.upkeep_assets?.name ?? '',
  }));

  const groups = [
    { key: 'overdue',   label: 'Overdue',  items: withStatus.filter((m) => m.status === 'overdue').sort(byFrequency) },
    { key: 'due_soon',  label: 'Due Soon', items: withStatus.filter((m) => m.status === 'due_soon').sort(byFrequency) },
    { key: 'scheduled', label: 'Upcoming', items: withStatus.filter((m) => m.status === 'scheduled').sort((a, b) => (a.nextDate?.getTime() ?? 0) - (b.nextDate?.getTime() ?? 0)) },
    { key: 'as_needed', label: 'As Needed', items: withStatus.filter((m) => m.status === 'as_needed').sort(byFrequency) },
  ].filter((g) => g.items.length > 0);

  return (
    <div style={{ padding: pagePad(mobile), fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ fontSize: mobile ? 23 : 26, fontWeight: 700, color: F, letterSpacing: '-0.015em', marginBottom: 6 }}>Maintenance Schedule</div>
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
              {!mobile && <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '8px 18px', background: '#f8f6f2', borderBottom: '1px solid #e4e0d8' }}>
                {['Task', 'Asset', 'Frequency', 'Last Done', 'Next Due', 'Status'].map((h) => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#a39c92', letterSpacing: '0.09em', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>}
              {g.items.map((m, i) => {
                const st = STATUS_STYLES[m.status];
                if (mobile) return (
                  <div key={m.id} onClick={() => setViewingId(m.id)} style={{ padding: '13px 14px', borderBottom: i < g.items.length - 1 ? '1px solid #f1eee8' : 'none', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: F, lineHeight: 1.3 }}>{m.title}</div>
                      <span style={{ background: st.bg, color: st.text, borderRadius: 9999, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#7d776f', marginTop: 4 }}>{m.assetName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px 12px', flexWrap: 'wrap', marginTop: 7, fontSize: 13, color: '#5e5953' }}>
                      <FrequencyPill frequency={m.frequency} />
                      <span style={{ whiteSpace: 'nowrap' }}>Last: {m.last_performed ? fmtDate(m.last_performed) : 'Never'}</span>
                      {m.nextDate && <span style={{ whiteSpace: 'nowrap' }}>Next: {fmtDate(m.nextDate)}</span>}
                    </div>
                  </div>
                );
                return (
                  <div key={m.id}
                    style={{ display: 'grid', gridTemplateColumns: COLS, padding: '11px 18px', borderBottom: i < g.items.length - 1 ? '1px solid #f1eee8' : 'none', alignItems: 'center', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f7f4')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    onClick={() => setViewingId(m.id)}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: F }}>{m.title}</div>
                      {m.description && <div style={{ fontSize: 13.5, color: '#5e5953', marginTop: 4, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{m.description}</div>}
                    </div>
                    <span style={{ fontSize: 12.5, color: '#7d776f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.assetName}</span>
                    <div><FrequencyPill frequency={m.frequency} /></div>
                    <span style={{ fontSize: 12.5, color: '#7d776f' }}>{m.last_performed ? fmtDate(m.last_performed) : 'Never'}</span>
                    <span style={{ fontSize: 12.5, color: '#45413b', fontWeight: 500 }}>{m.nextDate ? fmtDate(m.nextDate) : '—'}</span>
                    <div><span style={{ background: st.bg, color: st.text, borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{st.label}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
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
