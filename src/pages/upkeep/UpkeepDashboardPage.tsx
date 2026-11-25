import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskRows, TaskModal } from './Tasks';
import { useIsMobile, pagePad } from '@/lib/useIsMobile';
import {
  useUpkeepAssets,
  useAllUpkeepMaintenance,
  useAllOpenTasks,
  getTaskStatus,
  fmtDate,
  CAT_STYLES,
} from '@/api/upkeep';

const F = '#1d3a2c';
const CLAY = '#c8743a';

export function UpkeepDashboardPage() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const { data: assets = [], isLoading: assetsLoading } = useUpkeepAssets();
  const { data: allMaint = [], isLoading: maintLoading } = useAllUpkeepMaintenance();
  const { data: tasks = [], isLoading: tasksLoading } = useAllOpenTasks();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = tasks.find((t) => t.id === viewingId) ?? null;

  const activeAssets = assets.filter((a) => a.status === 'active');
  const overdue = tasks.filter((t) => getTaskStatus(t) === 'overdue');
  const dueSoon = tasks.filter((t) => getTaskStatus(t) === 'due_soon');
  const upcoming = tasks.slice(0, 8); // already sorted by due date

  const isLoading = assetsLoading || maintLoading || tasksLoading;

  // Next open task per asset (tasks are already sorted by due date)
  const nextTaskByAsset = new Map<string, (typeof tasks)[number]>();
  for (const t of tasks) if (!nextTaskByAsset.has(t.asset_id)) nextTaskByAsset.set(t.asset_id, t);
  const assetList = [...activeAssets].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );

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
          { label: 'Schedules', value: isLoading ? '—' : String(allMaint.length), sub: 'repeating tasks', strip: CLAY },
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
          <div style={{ padding: 24, color: '#a39c92', fontSize: 13 }}>Nothing due. Open an item and add a schedule to get started.</div>
        ) : (
          <TaskRows tasks={upcoming} showAsset onOpen={(t) => setViewingId(t.id)} />
        )}
      </div>

      {/* All assets */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', overflow: 'hidden', boxShadow: '0 2px 4px rgba(28,26,23,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1eee8' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: F }}>
            Your Assets{!isLoading && <span style={{ color: '#a39c92', fontWeight: 600 }}> · {assetList.length}</span>}
          </div>
          <span style={{ fontSize: 12, color: '#3f7a64', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/assets')}>Manage →</span>
        </div>
        {isLoading ? (
          <div style={{ padding: 24, color: '#a39c92', fontSize: 13 }}>Loading…</div>
        ) : assetList.length === 0 ? (
          <div style={{ padding: 24, color: '#a39c92', fontSize: 13 }}>No assets yet. Tap “+ Add Asset” to add your first one.</div>
        ) : (
          assetList.map((a, i) => {
            const cs = CAT_STYLES[a.category] ?? CAT_STYLES.general;
            const next = nextTaskByAsset.get(a.id);
            const st = next ? getTaskStatus(next) : null;
            const dueColor = st === 'overdue' ? '#c0392b' : st === 'due_soon' ? '#b8821f' : '#7d776f';
            const sub = [a.model_number, a.location].filter(Boolean).join(' · ');
            return (
              <div
                key={a.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/assets/${a.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/assets/${a.id}`); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: mobile ? '13px 16px' : '12px 18px',
                  borderTop: i === 0 ? 'none' : '1px solid #f1eee8',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#faf8f4')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: mobile ? 15 : 14, fontWeight: 650, color: F }}>{a.name}</span>
                    <span style={{ background: cs.bg, color: cs.text, borderRadius: 9999, padding: '2px 8px', fontSize: 10.5, fontWeight: 600 }}>{a.category}</span>
                  </div>
                  {sub && (
                    <div style={{ fontSize: 12, color: '#a39c92', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
                  )}
                  <div style={{ fontSize: 12, color: dueColor, marginTop: 3, fontWeight: next ? 500 : 400 }}>
                    {next
                      ? `${st === 'overdue' ? 'Overdue' : 'Next'}: ${next.title} · ${fmtDate(next.due_date)}`
                      : 'No upcoming tasks'}
                  </div>
                </div>
                <span style={{ color: '#c9c3b8', fontSize: 20, lineHeight: 1, flexShrink: 0 }}>›</span>
              </div>
            );
          })
        )}
      </div>
      {viewing && (
        <TaskModal task={viewing} onClose={() => setViewingId(null)} onOpenAsset={() => navigate(`/assets/${viewing.asset_id}`)} />
      )}
    </div>
  );
}
