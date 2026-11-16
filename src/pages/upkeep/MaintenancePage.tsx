import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllOpenTasks, getTaskStatus, type TaskDueStatus } from '@/api/upkeep';
import { TaskRows, TaskModal, TASK_STATUS_STYLES } from './Tasks';
import { useIsMobile, pagePad } from '@/lib/useIsMobile';

const F = '#1d3a2c';

const GROUPS: { key: TaskDueStatus; label: string }[] = [
  { key: 'overdue',  label: 'Overdue' },
  { key: 'due_soon', label: 'Next 30 Days' },
  { key: 'soon90',   label: 'Next 90 Days' },
  { key: 'later',    label: 'Later' },
];

export function MaintenancePage() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const { data: tasks = [], isLoading } = useAllOpenTasks();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [showLater, setShowLater] = useState(false);
  const viewing = tasks.find((t) => t.id === viewingId) ?? null;

  const groups = GROUPS.map((g) => ({ ...g, items: tasks.filter((t) => getTaskStatus(t) === g.key) })).filter((g) => g.items.length > 0);

  return (
    <div style={{ padding: pagePad(mobile), fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ fontSize: mobile ? 23 : 26, fontWeight: 700, color: F, letterSpacing: '-0.015em', marginBottom: 6 }}>Maintenance</div>
      <div style={{ fontSize: 14, color: '#7d776f', marginBottom: 24 }}>Open tasks across all active items. Tap one to mark it done or skip it.</div>

      {isLoading ? (
        <div style={{ color: '#a39c92', fontSize: 13 }}>Loading…</div>
      ) : tasks.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', padding: 32, textAlign: 'center', color: '#a39c92', fontSize: 13 }}>
          Nothing due. Open an item and add a schedule or a one-time task.
        </div>
      ) : (
        groups.map((g) => {
          const collapsed = g.key === 'later' && !showLater;
          const st = TASK_STATUS_STYLES[g.key];
          return (
            <div key={g.key} style={{ marginBottom: 28 }}>
              <div onClick={g.key === 'later' ? () => setShowLater((v) => !v) : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: g.key === 'later' ? 'pointer' : 'default' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7d776f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{g.label}</div>
                <span style={{ background: st.bg, color: st.text, borderRadius: 9999, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{g.items.length}</span>
                {g.key === 'later' && <span style={{ fontSize: 12.5, fontWeight: 600, color: '#3f7a64' }}>{showLater ? 'Hide' : 'Show'}</span>}
              </div>
              {!collapsed && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', overflow: 'hidden', boxShadow: '0 2px 4px rgba(28,26,23,0.06)' }}>
                  <TaskRows tasks={g.items} showAsset onOpen={(t) => setViewingId(t.id)} />
                </div>
              )}
            </div>
          );
        })
      )}
      {viewing && (
        <TaskModal task={viewing} onClose={() => setViewingId(null)} onOpenAsset={() => navigate(`/assets/${viewing.asset_id}`)} />
      )}
    </div>
  );
}
