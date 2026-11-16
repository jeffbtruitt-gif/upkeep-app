import { useEffect } from 'react';
import {
  FREQ_LABELS, FREQ_STYLES, fmtDate,
  type AssetFrequency, type UpkeepMaintenance, type UpkeepTask,
} from '@/api/upkeep';

const F = '#1d3a2c';

export function FrequencyPill({ frequency }: { frequency: AssetFrequency | 'once' }) {
  const c = FREQ_STYLES[frequency];
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 9999, padding: '2px 9px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {frequency !== 'once' && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M10 6a4 4 0 1 1-1.2-2.85M10 1.5V3.5H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      {FREQ_LABELS[frequency]}
    </span>
  );
}

interface Props {
  item: UpkeepMaintenance;
  tasks: UpkeepTask[]; // open tasks made by this schedule
  assetName?: string;
  onClose: () => void;
  onEdit?: () => void;
}

/** Schedule details: the rule plus the next few dates it has created. */
export function MaintenanceDetailModal({ item, tasks, assetName, onClose, onEdit }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const facts = [
    { label: 'Repeats', value: FREQ_LABELS[item.frequency] },
    { label: 'First Due', value: item.frequency === 'as_needed' ? '—' : fmtDate(item.start_date) },
    { label: 'Last Done', value: fmtDate(item.last_performed) },
    { label: 'Open Tasks', value: String(tasks.length) },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 32px rgba(28,26,23,0.25)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1eee8', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {assetName && <div style={{ fontSize: 12, color: '#7d776f', marginBottom: 4 }}>{assetName} · Schedule</div>}
            <div style={{ fontSize: 19, fontWeight: 700, color: F, letterSpacing: '-0.01em', marginBottom: 8 }}>{item.title}</div>
            <FrequencyPill frequency={item.frequency} />
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 22, lineHeight: 1, color: '#a39c92', cursor: 'pointer', padding: 4 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', borderBottom: '1px solid #f1eee8' }}>
          {facts.map((r) => (
            <div key={r.label} style={{ padding: '12px 22px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a39c92', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 13.5, color: '#45413b', fontWeight: 500 }}>{r.value}</div>
            </div>
          ))}
        </div>

        {item.frequency !== 'as_needed' && (
          <div style={{ padding: '14px 22px', borderBottom: '1px solid #f1eee8' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a39c92', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Next Dates</div>
            {!item.start_date
              ? <div style={{ fontSize: 13.5, color: '#8a5a00' }}>Set a first due date to create tasks.</div>
              : <div style={{ fontSize: 14, color: '#45413b', lineHeight: 1.7 }}>{tasks.slice(0, 4).map((t) => fmtDate(t.due_date)).join(' · ') || '—'}</div>}
          </div>
        )}

        <div style={{ padding: '14px 22px', borderBottom: '1px solid #f1eee8' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a39c92', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Description</div>
          <div style={{ fontSize: 15, color: '#45413b', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{item.description || 'No description.'}</div>
        </div>

        {onEdit && (
          <div style={{ padding: '14px 22px' }}>
            <button onClick={onEdit} style={{ background: '#fff', border: '1.5px solid #cfe0d8', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Edit schedule</button>
          </div>
        )}
      </div>
    </div>
  );
}
