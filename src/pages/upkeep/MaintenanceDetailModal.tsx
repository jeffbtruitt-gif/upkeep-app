import { useEffect } from 'react';
import {
  useUpdateMaintenance, FREQ_LABELS, FREQ_STYLES, getNextDueDate, getMaintenanceStatus, fmtDate, todayISO,
  type UpkeepMaintenance,
} from '@/api/upkeep';

const F = '#1d3a2c';

export const MAINT_STATUS_STYLES = {
  overdue:   { bg: '#fbeae7', text: '#c0392b', label: 'Overdue' },
  due_soon:  { bg: '#f8efd9', text: '#8a5a00', label: 'Due soon' },
  scheduled: { bg: '#e8f0f6', text: '#2c6e9c', label: 'Scheduled' },
  as_needed: { bg: '#f1eee8', text: '#5e5953', label: 'As needed' },
};

export function FrequencyPill({ frequency }: { frequency: UpkeepMaintenance['frequency'] }) {
  const c = FREQ_STYLES[frequency];
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 9999, padding: '2px 9px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M10 6a4 4 0 1 1-1.2-2.85M10 1.5V3.5H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {FREQ_LABELS[frequency]}
    </span>
  );
}

interface Props {
  item: UpkeepMaintenance;
  assetName?: string;
  onClose: () => void;
  onEdit?: () => void;
  onOpenAsset?: () => void;
}

export function MaintenanceDetailModal({ item, assetName, onClose, onEdit, onOpenAsset }: Props) {
  const updateMut = useUpdateMaintenance();
  const next = getNextDueDate(item);
  const st = MAINT_STATUS_STYLES[getMaintenanceStatus(item)];
  const doneToday = item.last_performed === todayISO();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function markDone() {
    await updateMut.mutateAsync({ id: item.id, asset_id: item.asset_id, last_performed: todayISO() });
  }

  const facts = [
    { label: 'Frequency', value: FREQ_LABELS[item.frequency] },
    { label: 'Last Performed', value: fmtDate(item.last_performed) },
    { label: 'Next Due', value: item.frequency === 'as_needed' ? 'As needed' : fmtDate(next) },
    ...(item.start_date ? [{ label: 'Start Date', value: fmtDate(item.start_date) }] : []),
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 32px rgba(28,26,23,0.25)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1eee8', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {assetName && <div style={{ fontSize: 12, color: '#7d776f', marginBottom: 4 }}>{assetName}</div>}
            <div style={{ fontSize: 19, fontWeight: 700, color: F, letterSpacing: '-0.01em', marginBottom: 8 }}>{item.title}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ background: st.bg, color: st.text, borderRadius: 9999, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>{st.label}</span>
              <FrequencyPill frequency={item.frequency} />
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 22, lineHeight: 1, color: '#a39c92', cursor: 'pointer', padding: 4 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', borderBottom: '1px solid #f1eee8' }}>
          {facts.map((r) => (
            <div key={r.label} style={{ padding: '12px 22px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a39c92', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 13.5, color: '#45413b', fontWeight: 500 }}>{r.value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 22px', borderBottom: '1px solid #f1eee8' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a39c92', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Description</div>
          <div style={{ fontSize: 15, color: '#45413b', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{item.description || 'No description.'}</div>
        </div>

        <div style={{ padding: '14px 22px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={markDone} disabled={updateMut.isPending || doneToday}
            style={{ background: updateMut.isPending || doneToday ? '#a3c4b6' : F, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: doneToday ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {doneToday ? '✓ Done today' : updateMut.isPending ? 'Saving…' : 'Mark done today'}
          </button>
          {onEdit && (
            <button onClick={onEdit} style={{ background: '#fff', border: '1.5px solid #cfe0d8', borderRadius: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
          )}
          {onOpenAsset && (
            <button onClick={onOpenAsset} style={{ background: '#fff', border: '1.5px solid #cfe0d8', borderRadius: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Open asset →</button>
          )}
        </div>
      </div>
    </div>
  );
}
