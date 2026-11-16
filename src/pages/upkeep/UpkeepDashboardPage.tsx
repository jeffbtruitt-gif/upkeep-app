import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskRows, TaskModal } from './Tasks';
import { useIsMobile, pagePad } from '@/lib/useIsMobile';
import {
  useUpkeepAssets,
  useAllUpkeepMaintenance,
  useAllOpenTasks,
  getTaskStatus,
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
        <TaskModal task={viewing} onClose={() => setViewingId(null)} onOpenAsset={() => navigate(`/assets/${viewing.asset_id}`)} />
      )}
    </div>
  );
}
