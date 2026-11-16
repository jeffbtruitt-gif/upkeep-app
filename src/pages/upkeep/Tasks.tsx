import { useEffect, useState } from 'react';
import {
  useCompleteTask, useDeleteTask, getTaskStatus, daysUntil, fmtDate, todayISO,
  type TaskWithContext, type TaskDueStatus,
} from '@/api/upkeep';
import { FrequencyPill } from './MaintenanceDetailModal';
import { useIsMobile } from '@/lib/useIsMobile';

const F = '#1d3a2c';

export const TASK_STATUS_STYLES: Record<TaskDueStatus, { bg: string; text: string; label: string }> = {
  overdue:  { bg: '#fbeae7', text: '#c0392b', label: 'Overdue' },
  due_soon: { bg: '#f8efd9', text: '#8a5a00', label: 'Due soon' },
  soon90:   { bg: '#e8f0f6', text: '#2c6e9c', label: 'Scheduled' },
  later:    { bg: '#e8f0f6', text: '#2c6e9c', label: 'Scheduled' },
};

export function dueText(due: string): string {
  const n = daysUntil(due);
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n < 0) return `${-n} day${n === -1 ? '' : 's'} overdue`;
  if (n <= 30) return `Due in ${n} days`;
  return `Due ${fmtDate(due)}`;
}

function StatusPill({ due }: { due: string }) {
  const st = TASK_STATUS_STYLES[getTaskStatus({ due_date: due })];
  return <span style={{ background: st.bg, color: st.text, borderRadius: 9999, padding: '3px 10px', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{st.label}</span>;
}

export function TaskRows({ tasks, showAsset, onOpen }: { tasks: TaskWithContext[]; showAsset?: boolean; onOpen: (t: TaskWithContext) => void }) {
  const mobile = useIsMobile();
  return (
    <>
      {tasks.map((t, i) => (
        <div key={t.id} onClick={() => onOpen(t)}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f7f4')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          style={{ padding: mobile ? '12px 14px' : '11px 18px', borderBottom: i < tasks.length - 1 ? '1px solid #f1eee8' : 'none', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ fontSize: mobile ? 15 : 13.5, fontWeight: 600, color: F, lineHeight: 1.3 }}>{t.title}</div>
            <StatusPill due={t.due_date} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px 10px', flexWrap: 'wrap', marginTop: 6, fontSize: 13, color: '#5e5953' }}>
            <FrequencyPill frequency={t.upkeep_maintenance?.frequency ?? 'once'} />
            {showAsset && t.upkeep_assets?.name && <span style={{ color: '#7d776f' }}>{t.upkeep_assets.name}</span>}
            <span style={{ whiteSpace: 'nowrap' }}>{fmtDate(t.due_date)}</span>
          </div>
        </div>
      ))}
    </>
  );
}

interface ModalProps {
  task: TaskWithContext;
  assetName?: string;
  onClose: () => void;
  onEdit?: () => void;
  onOpenAsset?: () => void;
}

export function TaskModal({ task, assetName, onClose, onEdit, onOpenAsset }: ModalProps) {
  const completeMut = useCompleteTask();
  const deleteMut = useDeleteTask();
  const [doneOn, setDoneOn] = useState(todayISO());
  const oneTime = !task.maintenance_id;
  const busy = completeMut.isPending || deleteMut.isPending;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function finish(skip: boolean) {
    await completeMut.mutateAsync({ id: task.id, asset_id: task.asset_id, done_on: doneOn || todayISO(), skip });
    onClose();
  }
  async function remove() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await deleteMut.mutateAsync({ id: task.id, asset_id: task.asset_id });
    onClose();
  }

  const btn = (primary: boolean): React.CSSProperties => ({
    background: primary ? (busy ? '#a3c4b6' : F) : '#fff', color: primary ? '#fff' : F,
    border: primary ? 'none' : '1.5px solid #cfe0d8', borderRadius: 8, padding: '10px 16px',
    fontSize: 14, fontWeight: 600, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
  });

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 32px rgba(28,26,23,0.25)' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1eee8', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {(assetName ?? task.upkeep_assets?.name) && <div style={{ fontSize: 12.5, color: '#7d776f', marginBottom: 4 }}>{assetName ?? task.upkeep_assets?.name}</div>}
            <div style={{ fontSize: 19, fontWeight: 700, color: F, marginBottom: 8 }}>{task.title}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusPill due={task.due_date} />
              <FrequencyPill frequency={task.upkeep_maintenance?.frequency ?? 'once'} />
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 24, lineHeight: 1, color: '#a39c92', cursor: 'pointer', padding: 4 }}>×</button>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1eee8' }}>
          <div style={{ fontSize: 15, color: '#45413b', fontWeight: 600 }}>{fmtDate(task.due_date)}</div>
          <div style={{ fontSize: 13, color: '#7d776f', marginTop: 2 }}>{dueText(task.due_date)}</div>
          {task.description && <div style={{ fontSize: 15, color: '#45413b', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: 12 }}>{task.description}</div>}
        </div>

        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#3f7a64' }}>
            Done on
            <input type="date" value={doneOn} onChange={(e) => setDoneOn(e.target.value)}
              style={{ padding: '7px 10px', border: '1.5px solid #cfe0d8', borderRadius: 8, fontSize: 16, fontFamily: 'inherit', color: F, background: '#f3f7f4' }} />
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => finish(false)} disabled={busy} style={btn(true)}>{completeMut.isPending ? 'Saving…' : '✓ Mark done'}</button>
            <button onClick={() => finish(true)} disabled={busy} style={btn(false)}>Skip</button>
            {oneTime && onEdit && <button onClick={onEdit} disabled={busy} style={btn(false)}>Edit</button>}
            {oneTime && <button onClick={remove} disabled={busy} style={{ ...btn(false), color: '#c0392b', borderColor: '#efc4bd' }}>Delete</button>}
            {onOpenAsset && <button onClick={onOpenAsset} style={btn(false)}>Open item →</button>}
          </div>
          <div style={{ fontSize: 12, color: '#a39c92', lineHeight: 1.5 }}>
            Mark done adds it to the Maintenance Log. Skip clears it without logging.
            {!oneTime && ' Either one also clears any earlier missed dates for this schedule.'}
          </div>
          {(completeMut.isError || deleteMut.isError) && (
            <div style={{ fontSize: 12.5, color: '#c0392b' }}>Couldn't save: {((completeMut.error ?? deleteMut.error) as any)?.message ?? 'unknown error'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
