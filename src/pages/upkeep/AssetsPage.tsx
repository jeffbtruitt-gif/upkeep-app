import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useUpkeepAssets, useCreateAsset, useUpdateAsset, useDeleteAsset,
  CAT_STYLES, UPKEEP_CATEGORIES,
  type UpkeepAsset, type AssetStatus,
} from '@/api/upkeep';
import { useIsMobile, pagePad } from '@/lib/useIsMobile';

const F = '#1d3a2c';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #cfe0d8', borderRadius: 8,
  fontSize: 14, fontFamily: 'inherit', color: F, background: '#f3f7f4', outline: 'none', boxSizing: 'border-box',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#3f7a64', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  );
}

const BLANK: Omit<UpkeepAsset, 'id' | 'household_id' | 'created_at' | 'updated_at'> = {
  name: '', category: 'general', model_number: null, serial_number: null, location: null,
  purchase_date: null, purchase_price: null, warranty_expiry: null, description: null, status: 'active',
};

function AssetModal({ initial, onClose, onSave, saving }: {
  initial: typeof BLANK & { id?: string };
  onClose: () => void;
  onSave: (v: typeof BLANK) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ ...initial });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v || null }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, zIndex: 1000, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 16px 40px rgba(28,26,23,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e4e0d8' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: F }}>{initial.id ? 'Edit Asset' : 'Add Asset'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a39c92', fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Name *">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Carrier Heat Pump" style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={inputStyle}>
                {UPKEEP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Attic" style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            <Field label="Model Number"><input value={form.model_number ?? ''} onChange={(e) => set('model_number', e.target.value)} style={inputStyle} /></Field>
            <Field label="Serial Number"><input value={form.serial_number ?? ''} onChange={(e) => set('serial_number', e.target.value)} style={inputStyle} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            <Field label="Purchase Date"><input type="date" value={form.purchase_date ?? ''} onChange={(e) => set('purchase_date', e.target.value)} style={inputStyle} /></Field>
            <Field label="Purchase Price"><input type="number" min="0" step="0.01" value={form.purchase_price ?? ''} onChange={(e) => set('purchase_price', e.target.value ? Number(e.target.value) : null)} style={inputStyle} /></Field>
            <Field label="Warranty Expiry"><input type="date" value={form.warranty_expiry ?? ''} onChange={(e) => set('warranty_expiry', e.target.value)} style={inputStyle} /></Field>
          </div>
          <Field label="Description">
            <textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Notes, details, or reference info…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </Field>
          <Field label="Status">
            <div style={{ display: 'flex', gap: 8 }}>
              {(['active', 'inactive'] as AssetStatus[]).map((s) => (
                <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, status: s }))}
                  style={{ padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${form.status === s ? F : '#cfe0d8'}`, background: form.status === s ? '#e7efe9' : '#fff', color: form.status === s ? F : '#7d776f' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #e4e0d8' }}>
          <button onClick={onClose} style={{ background: '#fff', border: '1.5px solid #cfe0d8', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button disabled={!form.name.trim() || saving} onClick={() => onSave(form)}
            style={{ background: !form.name.trim() || saving ? '#a3c4b6' : F, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: !form.name.trim() || saving ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : 'Save Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssetsPage() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const { data: assets = [], isLoading } = useUpkeepAssets();
  const createMut = useCreateAsset();
  const updateMut = useUpdateAsset();
  const deleteMut = useDeleteAsset();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [modal, setModal] = useState<null | 'new' | UpkeepAsset>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UpkeepAsset | null>(null);

  const filtered = assets.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterCat !== 'all' && a.category !== filterCat) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !(a.location ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleSave(form: typeof BLANK & { id?: string }) {
    if (form.id) await updateMut.mutateAsync({ id: form.id, ...form });
    else await createMut.mutateAsync(form);
    setModal(null);
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div style={{ padding: pagePad(mobile), fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: mobile ? 23 : 26, fontWeight: 700, color: F, letterSpacing: '-0.015em' }}>Assets</div>
        <button onClick={() => setModal('new')} style={{ background: F, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Asset</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: mobile ? 8 : 12, marginBottom: mobile ? 14 : 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: mobile ? '100%' : undefined }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#6fa18f" strokeWidth="1.6" />
            <path d="M10.5 10.5l3 3" stroke="#6fa18f" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets…"
            style={{ padding: '9px 12px 9px 32px', border: '1.5px solid #cfe0d8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: F, background: '#f3f7f4', outline: 'none', width: mobile ? '100%' : 220 }} />
        </div>
        <div style={{ display: 'inline-flex', background: '#e7efe9', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['active', 'all', 'inactive'] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: filterStatus === s ? 600 : 500, color: filterStatus === s ? F : '#5e5953', background: filterStatus === s ? '#fff' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: filterStatus === s ? '0 1px 2px rgba(28,26,23,0.06)' : 'none' }}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            style={{ padding: '9px 30px 9px 12px', border: '1.5px solid #cfe0d8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: F, background: '#f3f7f4', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
            <option value="all">All categories</option>
            {UPKEEP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="10" height="6" viewBox="0 0 11 7" fill="none">
            <path d="M1 1l4.5 4.5L10 1" stroke="#3f7a64" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', overflow: 'hidden', boxShadow: '0 4px 12px rgba(28,26,23,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #f1eee8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: F }}>Tracked Assets</div>
            <span style={{ background: '#e7efe9', color: '#3f7a64', borderRadius: 9999, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{filtered.length} items</span>
          </div>
        </div>
        {!mobile && <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 120px 150px 100px 110px 80px', padding: '8px 18px', background: '#f8f6f2', borderBottom: '1px solid #e4e0d8' }}>
          {['Item', 'Location', 'Category', 'Model', 'Status', ''].map((h) => (
            <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: '#a39c92', letterSpacing: '0.09em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>}
        {isLoading ? (
          <div style={{ padding: 24, color: '#a39c92', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#a39c92', fontSize: 13 }}>
            {assets.length === 0 ? 'No assets yet. Add your first home asset to get started.' : 'No assets match your filters.'}
          </div>
        ) : (
          filtered.map((a, i) => {
            const cs = CAT_STYLES[a.category] ?? CAT_STYLES.general;
            const catLabel = UPKEEP_CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category;
            if (mobile) return (
              <div key={a.id} onClick={() => navigate(`/assets/${a.id}`)}
                style={{ padding: '13px 14px', borderBottom: i < filtered.length - 1 ? '1px solid #f1eee8' : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: F, lineHeight: 1.3 }}>{a.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 5 }}>
                    <span style={{ background: cs.bg, color: cs.text, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{catLabel}</span>
                    {a.status === 'inactive' && <span style={{ background: '#f1eee8', color: '#7d776f', borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>Inactive</span>}
                    {(a.location || a.model_number) && <span style={{ fontSize: 13, color: '#7d776f' }}>{[a.location, a.model_number].filter(Boolean).join(' · ')}</span>}
                  </div>
                </div>
                <svg width="9" height="15" viewBox="0 0 9 15" fill="none" style={{ flexShrink: 0 }}><path d="M1.5 1.5l6 6-6 6" stroke="#b8b2a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            );
            return (
              <div key={a.id}
                style={{ display: 'grid', gridTemplateColumns: '1.8fr 120px 150px 100px 110px 80px', padding: '10px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f1eee8' : 'none', alignItems: 'center', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f7f4')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                onClick={() => navigate(`/assets/${a.id}`)}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                <span style={{ fontSize: 12.5, color: '#7d776f' }}>{a.location ?? '—'}</span>
                <div><span style={{ background: cs.bg, color: cs.text, borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 600 }}>{a.category}</span></div>
                <span style={{ fontSize: 12, color: '#7d776f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.model_number ?? '—'}</span>
                <div><span style={{ background: a.status === 'active' ? '#e6f2ea' : '#f1eee8', color: a.status === 'active' ? '#2e7d52' : '#7d776f', borderRadius: 9999, padding: '3px 10px', fontSize: 11.5, fontWeight: 600 }}>{a.status === 'active' ? 'Active' : 'Inactive'}</span></div>
                <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setModal(a)} style={{ background: '#f3f7f4', border: '1px solid #cfe0d8', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                  <button onClick={() => setDeleteConfirm(a)} style={{ background: '#fbeae7', border: '1px solid #c0392b', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#c0392b', cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
                </div>
              </div>
            );
          })
        )}
        <div style={{ padding: '10px 18px', background: '#f8f6f2', borderTop: '1px solid #e4e0d8', fontSize: 12, color: '#7d776f' }}>
          {filtered.length} asset{filtered.length !== 1 ? 's' : ''} · {assets.filter((a) => a.status === 'inactive').length} inactive
        </div>
      </div>

      {modal && (
        <AssetModal initial={modal === 'new' ? BLANK : modal} onClose={() => setModal(null)}
          onSave={(form) => handleSave({ ...form, id: modal === 'new' ? undefined : modal.id })} saving={saving} />
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 'calc(100% - 32px)', maxWidth: 420, padding: 24, boxShadow: '0 16px 40px rgba(28,26,23,0.18)' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: F, marginBottom: 10 }}>Delete Asset?</div>
            <div style={{ fontSize: 14, color: '#5e5953', marginBottom: 24, lineHeight: 1.6 }}>
              This will permanently delete <strong>{deleteConfirm.name}</strong> and all its notes, maintenance items, and links.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: '#fff', border: '1.5px solid #cfe0d8', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={async () => { await deleteMut.mutateAsync(deleteConfirm.id); setDeleteConfirm(null); }} disabled={deleteMut.isPending}
                style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {deleteMut.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
