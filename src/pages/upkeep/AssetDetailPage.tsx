import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useUpkeepAsset, useUpdateAsset, useDeleteAsset,
  useUpkeepNotes, useCreateNote, useUpdateNote, useDeleteNote,
  useUpkeepMaintenance, useCreateMaintenance, useUpdateMaintenance, useDeleteMaintenance,
  useServiceLog, useSaveLogEntry, useDeleteLogEntry, type UpkeepLogEntry,
  useUpkeepLinks, useCreateLink, useUpdateLink, useDeleteLink,
  useAssetTasks, useSaveOneTimeTask, type UpkeepTask,
  CAT_STYLES, UPKEEP_CATEGORIES, FREQ_LABELS,
  fmtDate, byFrequency, parseDateOnly, todayISO,
  type UpkeepNote, type UpkeepMaintenance, type UpkeepLink, type AssetFrequency,
} from '@/api/upkeep';
import { MaintenanceDetailModal, FrequencyPill } from './MaintenanceDetailModal';
import { TaskRows, TaskModal } from './Tasks';
import { useAssetPhotos, useUploadPhotos } from '@/api/photos';
import { AddPhotosButton, PhotoGrid, PendingPhotos } from './Photos';
import { useIsMobile, pagePad } from '@/lib/useIsMobile';

const F = '#1d3a2c';
const F2 = '#3f7a64';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #cfe0d8', borderRadius: 8,
  fontSize: 14, fontFamily: 'inherit', color: F, background: '#f3f7f4', outline: 'none', boxSizing: 'border-box',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: F2, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', overflow: 'hidden', boxShadow: '0 2px 4px rgba(28,26,23,0.06)', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1eee8' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: F }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function BtnPrimary({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: disabled ? '#a3c4b6' : F, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit' }}>
      {children}
    </button>
  );
}

function BtnGhost({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ background: '#fff', border: '1.5px solid #cfe0d8', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>
      {children}
    </button>
  );
}

function NotesSection({ assetId }: { assetId: string }) {
  const mobile = useIsMobile();
  const { data: notes = [] } = useUpkeepNotes(assetId);
  const createMut = useCreateNote();
  const updateMut = useUpdateNote();
  const deleteMut = useDeleteNote();
  const { data: photos = [] } = useAssetPhotos(assetId);
  const uploadMut = useUploadPhotos();
  const [form, setForm] = useState<{ title: string; body: string } | null>(null);
  const [editing, setEditing] = useState<UpkeepNote | null>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const photosFor = (noteId: string) => photos.filter((p) => p.note_id === noteId);

  function openNew() { setEditing(null); setPending([]); setUploadError(null); setForm({ title: '', body: '' }); }
  function openEdit(n: UpkeepNote) { setEditing(n); setPending([]); setUploadError(null); setForm({ title: n.title, body: n.body ?? '' }); }
  function cancel() { setForm(null); setEditing(null); setPending([]); }

  async function save() {
    if (!form?.title.trim()) return;
    const note = editing
      ? await updateMut.mutateAsync({ id: editing.id, asset_id: assetId, title: form.title, body: form.body || null })
      : await createMut.mutateAsync({ asset_id: assetId, title: form.title, body: form.body || null });
    if (pending.length) {
      try {
        await uploadMut.mutateAsync({ asset_id: assetId, note_id: note.id, files: pending });
      } catch (e: any) {
        // Keep the form open so the photos can be retried; the note text is already saved.
        setEditing(note); setUploadError(e?.message ?? 'Photo upload failed'); return;
      }
    }
    cancel();
  }
  const saving = createMut.isPending || updateMut.isPending || uploadMut.isPending;

  return (
    <SectionCard title={`Notes (${notes.length})`} action={!form ? <BtnGhost onClick={openNew}>+ Add Note</BtnGhost> : undefined}>
      {form ? (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Title"><input value={form.title} onChange={(e) => setForm((f) => f && { ...f, title: e.target.value })} placeholder="e.g. Refrigerator Repair" style={inputStyle} autoFocus /></Field>
          <Field label="Note"><textarea rows={5} value={form.body} onChange={(e) => setForm((f) => f && { ...f, body: e.target.value })} placeholder="Details, findings, costs…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} /></Field>
          <Field label="Photos">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {editing && <PhotoGrid photos={photosFor(editing.id)} size={80} />}
              <PendingPhotos files={pending} onRemove={(i) => setPending((p) => p.filter((_, j) => j !== i))} />
              <div><AddPhotosButton label="+ Add Photos" onFiles={(f) => setPending((p) => [...p, ...f])} /></div>
              {uploadError && <div style={{ fontSize: 12, color: '#c0392b' }}>Note saved, but photos didn't upload: {uploadError}. Tap Save again to retry.</div>}
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <BtnPrimary onClick={save} disabled={saving}>{uploadMut.isPending ? 'Uploading photos…' : saving ? 'Saving…' : 'Save Note'}</BtnPrimary>
            <BtnGhost onClick={cancel}>Cancel</BtnGhost>
          </div>
        </div>
      ) : notes.length === 0 ? (
        <div style={{ padding: '20px 18px', color: '#a39c92', fontSize: 13 }}>No notes yet.</div>
      ) : (
        notes.map((n, i) => (
          <div key={n.id} style={{ padding: '14px 18px', borderBottom: i < notes.length - 1 ? '1px solid #f1eee8' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: mobile ? 15 : 13, fontWeight: 600, color: F, marginBottom: n.body ? 6 : 0 }}>{n.title}</div>
                {n.body && <div style={{ fontSize: mobile ? 14.5 : 13, color: '#5e5953', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.body}</div>}
                {photosFor(n.id).length > 0 && <div style={{ marginTop: 10 }}><PhotoGrid photos={photosFor(n.id)} size={76} /></div>}
                <div style={{ fontSize: 11, color: '#a39c92', marginTop: 6 }}>{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEdit(n)} style={{ background: '#f3f7f4', border: '1px solid #cfe0d8', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                <button onClick={() => { if (confirm(`Delete note "${n.title}"${photosFor(n.id).length ? ' and its photos' : ''}?`)) deleteMut.mutate({ id: n.id, asset_id: assetId }); }} style={{ background: '#fbeae7', border: '1px solid #c0392b', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#c0392b', cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
              </div>
            </div>
          </div>
        ))
      )}
    </SectionCard>
  );
}

function ItemPhotosSection({ assetId }: { assetId: string }) {
  const { data: photos = [], isLoading } = useAssetPhotos(assetId);
  const uploadMut = useUploadPhotos();
  const itemPhotos = photos.filter((p) => !p.note_id && !p.log_id);
  return (
    <SectionCard title={`Photos (${itemPhotos.length})`}
      action={<AddPhotosButton busy={uploadMut.isPending} onFiles={(files) => uploadMut.mutate({ asset_id: assetId, files })} />}>
      <div style={{ padding: '14px 18px' }}>
        {uploadMut.isError && <div style={{ fontSize: 12, color: '#c0392b', marginBottom: 8 }}>Upload failed: {(uploadMut.error as any)?.message ?? 'unknown error'}</div>}
        {isLoading ? <div style={{ color: '#a39c92', fontSize: 13 }}>Loading…</div>
          : itemPhotos.length === 0 ? <div style={{ color: '#a39c92', fontSize: 13 }}>No photos yet. Add the label, model sticker, or how it's installed.</div>
          : <PhotoGrid photos={itemPhotos} size={110} />}
      </div>
    </SectionCard>
  );
}

function TasksSection({ assetId, assetName }: { assetId: string; assetName: string }) {
  const { data: tasks = [], isLoading } = useAssetTasks(assetId);
  const saveMut = useSaveOneTimeTask();
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState<{ id?: string; title: string; due_date: string; description: string } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = tasks.find((t) => t.id === viewingId) ?? null;
  const LIMIT = 5;
  const shown = showAll ? tasks : tasks.slice(0, LIMIT);

  function openNew() { setForm({ title: '', due_date: todayISO(), description: '' }); }
  function openEdit(t: UpkeepTask) { setViewingId(null); setForm({ id: t.id, title: t.title, due_date: t.due_date, description: t.description ?? '' }); }
  async function save() {
    if (!form?.title.trim() || !form.due_date) return;
    await saveMut.mutateAsync({ id: form.id, asset_id: assetId, title: form.title.trim(), due_date: form.due_date, description: form.description || null });
    setForm(null);
  }

  return (
    <SectionCard title={`Upcoming Tasks (${tasks.length})`} action={!form ? <BtnGhost onClick={openNew}>+ One-time Task</BtnGhost> : undefined}>
      {form ? (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Field label="Task *"><input value={form.title} onChange={(e) => setForm((f) => f && { ...f, title: e.target.value })} placeholder="e.g. Replace roof" style={inputStyle} autoFocus /></Field>
            <Field label="Due Date *"><input type="date" value={form.due_date} onChange={(e) => setForm((f) => f && { ...f, due_date: e.target.value })} style={inputStyle} /></Field>
          </div>
          <Field label="Description"><textarea rows={3} value={form.description} onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })} placeholder="Details…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} /></Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <BtnPrimary onClick={save} disabled={saveMut.isPending || !form.title.trim() || !form.due_date}>{saveMut.isPending ? 'Saving…' : 'Save Task'}</BtnPrimary>
            <BtnGhost onClick={() => setForm(null)}>Cancel</BtnGhost>
          </div>
        </div>
      ) : isLoading ? (
        <div style={{ padding: '20px 18px', color: '#a39c92', fontSize: 13 }}>Loading…</div>
      ) : tasks.length === 0 ? (
        <div style={{ padding: '20px 18px', color: '#a39c92', fontSize: 13 }}>Nothing due. Add a schedule below, or a one-time task.</div>
      ) : (
        <>
          <TaskRows tasks={shown} onOpen={(t) => setViewingId(t.id)} />
          {tasks.length > LIMIT && (
            <div onClick={() => setShowAll((v) => !v)} style={{ padding: '12px 18px', borderTop: '1px solid #f1eee8', fontSize: 13, fontWeight: 600, color: '#3f7a64', cursor: 'pointer', textAlign: 'center' }}>
              {showAll ? 'Show fewer' : `Show all ${tasks.length}`}
            </div>
          )}
        </>
      )}
      {viewing && <TaskModal task={viewing} assetName={assetName} onClose={() => setViewingId(null)} onEdit={() => openEdit(viewing)} />}
    </SectionCard>
  );
}

function SchedulesSection({ assetId, assetName }: { assetId: string; assetName: string }) {
  const mobile = useIsMobile();
  const { data: rawItems = [] } = useUpkeepMaintenance(assetId);
  const { data: tasks = [] } = useAssetTasks(assetId);
  const items = [...rawItems].sort(byFrequency);
  const createMut = useCreateMaintenance();
  const updateMut = useUpdateMaintenance();
  const deleteMut = useDeleteMaintenance();
  const [form, setForm] = useState<{ title: string; description: string; frequency: AssetFrequency; start_date: string } | null>(null);
  const [editing, setEditing] = useState<UpkeepMaintenance | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = items.find((m) => m.id === viewingId) ?? null;
  const tasksFor = (id: string) => tasks.filter((t) => t.maintenance_id === id);

  function openNew() { setEditing(null); setForm({ title: '', description: '', frequency: 'quarterly', start_date: todayISO() }); }
  function openEdit(m: UpkeepMaintenance) { setViewingId(null); setEditing(m); setForm({ title: m.title, description: m.description ?? '', frequency: m.frequency, start_date: m.start_date ?? '' }); }
  function cancel() { setForm(null); setEditing(null); }

  const needsDate = form && form.frequency !== 'as_needed' && !form.start_date;
  async function save() {
    if (!form?.title.trim() || needsDate) return;
    const payload = {
      asset_id: assetId, title: form.title.trim(), description: form.description || null, frequency: form.frequency,
      start_date: form.frequency === 'as_needed' ? null : form.start_date || null,
    };
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...payload });
    else await createMut.mutateAsync({ ...payload, last_performed: null });
    cancel();
  }

  return (
    <SectionCard title={`Schedules (${items.length})`} action={!form ? <BtnGhost onClick={openNew}>+ Add Schedule</BtnGhost> : undefined}>
      {form ? (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Task Name"><input value={form.title} onChange={(e) => setForm((f) => f && { ...f, title: e.target.value })} placeholder="e.g. Replace HVAC Filter" style={inputStyle} autoFocus /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Field label="Repeats">
              <select value={form.frequency} onChange={(e) => setForm((f) => f && { ...f, frequency: e.target.value as AssetFrequency })} style={inputStyle}>
                {(['monthly', 'quarterly', 'twice_yearly', 'yearly', 'every_2_years', 'as_needed'] as AssetFrequency[]).map((v) => (
                  <option key={v} value={v}>{FREQ_LABELS[v]}</option>
                ))}
              </select>
            </Field>
            {form.frequency !== 'as_needed' && (
              <Field label="First Due Date *"><input type="date" value={form.start_date} onChange={(e) => setForm((f) => f && { ...f, start_date: e.target.value })} style={inputStyle} /></Field>
            )}
          </div>
          {form.frequency !== 'as_needed' && (
            <div style={{ fontSize: 12, color: '#a39c92', marginTop: -4, lineHeight: 1.5 }}>
              Creates tasks on fixed dates from the first due date, 3 years out.{editing && ' Saving changes updates all open tasks; completed ones are kept.'}
            </div>
          )}
          <Field label="Description"><textarea rows={4} value={form.description} onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })} placeholder="Additional details…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} /></Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <BtnPrimary onClick={save} disabled={createMut.isPending || updateMut.isPending || !form.title.trim() || !!needsDate}>{createMut.isPending || updateMut.isPending ? 'Saving…' : 'Save Schedule'}</BtnPrimary>
            <BtnGhost onClick={cancel}>Cancel</BtnGhost>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '20px 18px', color: '#a39c92', fontSize: 13 }}>No schedules yet.</div>
      ) : (
        items.map((m, i) => {
          const next = tasksFor(m.id)[0];
          return (
            <div key={m.id} onClick={() => setViewingId(m.id)}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f7f4')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              style={{ padding: '14px 18px', borderBottom: i < items.length - 1 ? '1px solid #f1eee8' : 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: mobile ? 15 : 13, fontWeight: 600, color: F }}>{m.title}</div>
                  <FrequencyPill frequency={m.frequency} />
                </div>
                <div style={{ fontSize: mobile ? 13 : 12, color: '#7d776f' }}>
                  {m.frequency === 'as_needed' ? 'No set dates'
                    : !m.start_date ? <span style={{ color: '#8a5a00' }}>Needs a first due date</span>
                    : next ? `Next: ${fmtDate(next.due_date)}` : 'No open tasks'}
                  {m.last_performed && ` · Last done: ${fmtDate(m.last_performed)}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEdit(m)} style={{ background: '#f3f7f4', border: '1px solid #cfe0d8', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                <button onClick={() => { if (confirm(`Delete schedule "${m.title}"? Its open tasks are removed; completed history is kept.`)) deleteMut.mutate({ id: m.id, asset_id: assetId }); }} style={{ background: '#fbeae7', border: '1px solid #c0392b', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#c0392b', cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
              </div>
            </div>
          );
        })
      )}
      {viewing && (
        <MaintenanceDetailModal item={viewing} tasks={tasksFor(viewing.id)} assetName={assetName} onClose={() => setViewingId(null)} onEdit={() => openEdit(viewing)} />
      )}
    </SectionCard>
  );
}

function ServiceLogSection({ assetId, isVehicle }: { assetId: string; isVehicle: boolean }) {
  const mobile = useIsMobile();
  const { data: entries = [] } = useServiceLog(assetId);
  const { data: photos = [] } = useAssetPhotos(assetId);
  const saveMut = useSaveLogEntry();
  const deleteMut = useDeleteLogEntry();
  const uploadMut = useUploadPhotos();
  type LogForm = { service_date: string; title: string; provider: string; mileage: string; cost: string; invoice_number: string; description: string };
  const [form, setForm] = useState<LogForm | null>(null);
  const [editing, setEditing] = useState<UpkeepLogEntry | null>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const photosFor = (logId: string) => photos.filter((p) => p.log_id === logId);
  const set = (k: keyof LogForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => f && { ...f, [k]: e.target.value });

  function openNew() {
    setEditing(null); setPending([]); setUploadError(null);
    setForm({ service_date: todayISO(), title: '', provider: '', mileage: '', cost: '', invoice_number: '', description: '' });
  }
  function openEdit(l: UpkeepLogEntry) {
    setEditing(l); setPending([]); setUploadError(null);
    setForm({ service_date: l.service_date, title: l.title, provider: l.provider ?? '', mileage: l.mileage != null ? String(l.mileage) : '',
      cost: l.cost != null ? String(l.cost) : '', invoice_number: l.invoice_number ?? '', description: l.description ?? '' });
  }
  function cancel() { setForm(null); setEditing(null); setPending([]); }

  async function save() {
    if (!form?.title.trim() || !form.service_date) return;
    const entry = await saveMut.mutateAsync({
      id: editing?.id, asset_id: assetId, service_date: form.service_date, title: form.title.trim(),
      provider: form.provider.trim() || null, invoice_number: form.invoice_number.trim() || null, description: form.description || null,
      mileage: form.mileage ? Math.round(Number(form.mileage.replace(/[^0-9.]/g, ''))) : null,
      cost: form.cost ? Number(form.cost.replace(/[^0-9.]/g, '')) : null,
    });
    if (pending.length) {
      try { await uploadMut.mutateAsync({ asset_id: assetId, log_id: entry.id, files: pending }); }
      catch (e: any) { setEditing(entry); setUploadError(e?.message ?? 'Photo upload failed'); return; }
    }
    cancel();
  }
  const saving = saveMut.isPending || uploadMut.isPending;
  const totalCost = entries.reduce((s, e) => s + (e.cost ?? 0), 0);

  return (
    <SectionCard title={`Maintenance Log (${entries.length})`} action={!form ? <BtnGhost onClick={openNew}>+ Add Entry</BtnGhost> : undefined}>
      {form ? (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Field label="Date *"><input type="date" value={form.service_date} onChange={set('service_date')} style={inputStyle} /></Field>
            <Field label="What was done *"><input value={form.title} onChange={set('title')} placeholder="e.g. Oil change" style={inputStyle} autoFocus /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <Field label="Done by"><input value={form.provider} onChange={set('provider')} placeholder="Shop, company or DIY" style={inputStyle} /></Field>
            {(isVehicle || form.mileage) && <Field label="Mileage"><input inputMode="numeric" value={form.mileage} onChange={set('mileage')} placeholder="e.g. 12,500" style={inputStyle} /></Field>}
            <Field label="Cost"><input inputMode="decimal" value={form.cost} onChange={set('cost')} placeholder="$0.00" style={inputStyle} /></Field>
            <Field label="Invoice #"><input value={form.invoice_number} onChange={set('invoice_number')} style={inputStyle} /></Field>
          </div>
          <Field label="Details"><textarea rows={5} value={form.description} onChange={set('description')} placeholder="Parts, findings, recommendations…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} /></Field>
          <Field label="Photos / receipts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {editing && <PhotoGrid photos={photosFor(editing.id)} size={80} />}
              <PendingPhotos files={pending} onRemove={(i) => setPending((p) => p.filter((_, j) => j !== i))} />
              <div><AddPhotosButton label="+ Add Photos" onFiles={(f) => setPending((p) => [...p, ...f])} /></div>
              {uploadError && <div style={{ fontSize: 12, color: '#c0392b' }}>Entry saved, but photos didn't upload: {uploadError}. Tap Save again to retry.</div>}
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <BtnPrimary onClick={save} disabled={saving || !form.title.trim() || !form.service_date}>{uploadMut.isPending ? 'Uploading photos…' : saving ? 'Saving…' : 'Save Entry'}</BtnPrimary>
            <BtnGhost onClick={cancel}>Cancel</BtnGhost>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '20px 18px', color: '#a39c92', fontSize: 13 }}>No service history yet. Log repairs, service visits and work you've done.</div>
      ) : (
        <>
          {entries.map((l, i) => {
            const meta = [
              l.provider,
              l.mileage != null ? `${l.mileage.toLocaleString()} mi` : null,
              l.cost != null ? `$${l.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
              l.invoice_number ? `Invoice ${l.invoice_number}` : null,
            ].filter(Boolean).join(' · ');
            return (
              <div key={l.id} style={{ padding: '14px 18px', borderBottom: i < entries.length - 1 ? '1px solid #f1eee8' : 'none', display: 'flex', gap: 14 }}>
                <div style={{ width: 54, flexShrink: 0, textAlign: 'center', background: '#f3f7f4', border: '1px solid #cfe0d8', borderRadius: 8, padding: '6px 0', alignSelf: 'flex-start' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: F2, textTransform: 'uppercase' }}>{parseDateOnly(l.service_date).toLocaleDateString('en-US', { month: 'short' })}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: F, lineHeight: 1.1 }}>{parseDateOnly(l.service_date).getDate()}</div>
                  <div style={{ fontSize: 10.5, color: '#7d776f' }}>{parseDateOnly(l.service_date).getFullYear()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: mobile ? 15 : 14, fontWeight: 600, color: F }}>{l.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(l)} style={{ background: '#f3f7f4', border: '1px solid #cfe0d8', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                      <button onClick={() => { if (confirm(`Delete log entry "${l.title}"${photosFor(l.id).length ? ' and its photos' : ''}?`)) deleteMut.mutate({ id: l.id, asset_id: assetId }); }} style={{ background: '#fbeae7', border: '1px solid #c0392b', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#c0392b', cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
                    </div>
                  </div>
                  {meta && <div style={{ fontSize: 12.5, color: '#7d776f', marginTop: 3 }}>{meta}</div>}
                  {l.description && <div style={{ fontSize: 14, color: '#5e5953', marginTop: 6, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{l.description}</div>}
                  {photosFor(l.id).length > 0 && <div style={{ marginTop: 10 }}><PhotoGrid photos={photosFor(l.id)} size={76} /></div>}
                </div>
              </div>
            );
          })}
          {totalCost > 0 && (
            <div style={{ padding: '10px 18px', borderTop: '1px solid #f1eee8', background: '#f8f6f2', fontSize: 12.5, color: '#7d776f', textAlign: 'right' }}>
              Total logged cost: <strong style={{ color: F }}>${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}

function LinksSection({ assetId }: { assetId: string }) {
  const mobile = useIsMobile();
  const { data: links = [] } = useUpkeepLinks(assetId);
  const createMut = useCreateLink();
  const updateMut = useUpdateLink();
  const deleteMut = useDeleteLink();
  const [form, setForm] = useState<{ name: string; url: string; description: string } | null>(null);
  const [editing, setEditing] = useState<UpkeepLink | null>(null);

  function openNew() { setEditing(null); setForm({ name: '', url: '', description: '' }); }
  function openEdit(l: UpkeepLink) { setEditing(l); setForm({ name: l.name, url: l.url, description: l.description ?? '' }); }
  function cancel() { setForm(null); setEditing(null); }

  async function save() {
    if (!form?.name.trim() || !form?.url.trim()) return;
    const payload = { asset_id: assetId, name: form.name, url: form.url, description: form.description || null };
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...payload });
    else await createMut.mutateAsync(payload);
    cancel();
  }

  return (
    <SectionCard title={`Links (${links.length})`} action={!form ? <BtnGhost onClick={openNew}>+ Add Link</BtnGhost> : undefined}>
      {form ? (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Field label="Name"><input value={form.name} onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })} placeholder="e.g. Replacement Filter" style={inputStyle} autoFocus /></Field>
            <Field label="URL"><input value={form.url} onChange={(e) => setForm((f) => f && { ...f, url: e.target.value })} placeholder="https://…" style={inputStyle} /></Field>
          </div>
          <Field label="Description"><input value={form.description} onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })} placeholder="Optional notes about this link…" style={inputStyle} /></Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <BtnPrimary onClick={save} disabled={createMut.isPending || updateMut.isPending}>{createMut.isPending || updateMut.isPending ? 'Saving…' : 'Save Link'}</BtnPrimary>
            <BtnGhost onClick={cancel}>Cancel</BtnGhost>
          </div>
        </div>
      ) : links.length === 0 ? (
        <div style={{ padding: '20px 18px', color: '#a39c92', fontSize: 13 }}>No links yet.</div>
      ) : (
        links.map((l, i) => (
          <div key={l.id} style={{ padding: '12px 18px', borderBottom: i < links.length - 1 ? '1px solid #f1eee8' : 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: mobile ? 15 : 13, fontWeight: 600, color: '#2c6e9c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {l.name}
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7M8 1h3m0 0v3m0-3L5.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              {l.description && <div style={{ fontSize: 12, color: '#7d776f', marginTop: 3 }}>{l.description}</div>}
              <div style={{ fontSize: 11, color: '#a39c92', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => openEdit(l)} style={{ background: '#f3f7f4', border: '1px solid #cfe0d8', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
              <button onClick={() => deleteMut.mutate({ id: l.id, asset_id: assetId })} style={{ background: '#fbeae7', border: '1px solid #c0392b', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#c0392b', cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
            </div>
          </div>
        ))
      )}
    </SectionCard>
  );
}

export function AssetDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading } = useUpkeepAsset(id);
  const updateMut = useUpdateAsset();
  const deleteAssetMut = useDeleteAsset();
  const mobile = useIsMobile();
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState<Record<string, string>>({});

  if (isLoading) return <div style={{ padding: 40, color: '#a39c92', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>Loading…</div>;
  if (!asset) return <div style={{ padding: 40, color: '#a39c92', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>Asset not found.</div>;

  const cs = CAT_STYLES[asset.category] ?? CAT_STYLES.general;

  function startEdit() {
    setInfoForm({
      name: asset!.name, category: asset!.category,
      model_number: asset!.model_number ?? '', serial_number: asset!.serial_number ?? '',
      location: asset!.location ?? '', purchase_date: asset!.purchase_date ?? '',
      purchase_price: asset!.purchase_price != null ? String(asset!.purchase_price) : '',
      warranty_expiry: asset!.warranty_expiry ?? '', description: asset!.description ?? '',
      status: asset!.status,
    });
    setEditingInfo(true);
  }

  async function saveInfo() {
    await updateMut.mutateAsync({
      id: asset!.id, name: infoForm.name, category: infoForm.category,
      model_number: infoForm.model_number || null, serial_number: infoForm.serial_number || null,
      location: infoForm.location || null, purchase_date: infoForm.purchase_date || null,
      purchase_price: infoForm.purchase_price ? Number(infoForm.purchase_price) : null,
      warranty_expiry: infoForm.warranty_expiry || null, description: infoForm.description || null,
      status: infoForm.status as 'active' | 'inactive',
    });
    setEditingInfo(false);
  }

  return (
    <div style={{ padding: pagePad(mobile), fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#a39c92', marginBottom: 16 }}>
        <span style={{ cursor: 'pointer', color: '#3f7a64' }} onClick={() => navigate('/assets')}>Assets</span>
        <span>/</span>
        <span style={{ color: '#45413b' }}>{asset.name}</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e0d8', overflow: 'hidden', boxShadow: '0 2px 4px rgba(28,26,23,0.06)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: mobile ? '16px 14px' : '20px 24px', borderBottom: editingInfo ? '1px solid #f1eee8' : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ background: cs.bg, color: cs.text, borderRadius: 9999, padding: '3px 11px', fontSize: 12, fontWeight: 600 }}>{asset.category}</span>
              <span style={{ background: asset.status === 'active' ? '#e6f2ea' : '#f1eee8', color: asset.status === 'active' ? '#2e7d52' : '#7d776f', borderRadius: 9999, padding: '3px 11px', fontSize: 12, fontWeight: 600 }}>{asset.status === 'active' ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ fontSize: mobile ? 21 : 24, fontWeight: 700, color: F, letterSpacing: '-0.015em', marginBottom: 4 }}>{asset.name}</div>
            {asset.location && <div style={{ fontSize: 13, color: '#7d776f' }}>{asset.location}</div>}
          </div>
          {!editingInfo && <button onClick={startEdit} style={{ background: '#f3f7f4', border: '1.5px solid #cfe0d8', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 600, color: F, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>}
        </div>

        {editingInfo ? (
          <div style={{ padding: mobile ? '14px' : '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
              <Field label="Name *"><input value={infoForm.name} onChange={(e) => setInfoForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} /></Field>
              <Field label="Category">
                <select value={infoForm.category} onChange={(e) => setInfoForm((f) => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  {UPKEEP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Location"><input value={infoForm.location} onChange={(e) => setInfoForm((f) => ({ ...f, location: e.target.value }))} style={inputStyle} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <Field label="Model #"><input value={infoForm.model_number} onChange={(e) => setInfoForm((f) => ({ ...f, model_number: e.target.value }))} style={inputStyle} /></Field>
              <Field label="Serial #"><input value={infoForm.serial_number} onChange={(e) => setInfoForm((f) => ({ ...f, serial_number: e.target.value }))} style={inputStyle} /></Field>
              <Field label="Purchase Date"><input type="date" value={infoForm.purchase_date} onChange={(e) => setInfoForm((f) => ({ ...f, purchase_date: e.target.value }))} style={inputStyle} /></Field>
              <Field label="Warranty Expiry"><input type="date" value={infoForm.warranty_expiry} onChange={(e) => setInfoForm((f) => ({ ...f, warranty_expiry: e.target.value }))} style={inputStyle} /></Field>
            </div>
            <Field label="Description"><textarea rows={5} value={infoForm.description} onChange={(e) => setInfoForm((f) => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} /></Field>
            <Field label="Status">
              <div style={{ display: 'flex', gap: 8 }}>
                {['active', 'inactive'].map((s) => (
                  <button key={s} type="button" onClick={() => setInfoForm((f) => ({ ...f, status: s }))}
                    style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${infoForm.status === s ? F : '#cfe0d8'}`, background: infoForm.status === s ? '#e7efe9' : '#fff', color: infoForm.status === s ? F : '#7d776f' }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveInfo} disabled={!infoForm.name?.trim() || updateMut.isPending}
                style={{ background: !infoForm.name?.trim() || updateMut.isPending ? '#a3c4b6' : F, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {updateMut.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <BtnGhost onClick={() => setEditingInfo(false)}>Cancel</BtnGhost>
              <button onClick={async () => {
                  if (!confirm(`Permanently delete "${asset.name}" and all its maintenance, log entries, notes, links and photos?`)) return;
                  await deleteAssetMut.mutateAsync(asset.id); navigate('/assets');
                }}
                style={{ marginLeft: 'auto', background: '#fff', border: '1.5px solid #c0392b', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#c0392b', cursor: 'pointer', fontFamily: 'inherit' }}>
                {deleteAssetMut.isPending ? 'Deleting…' : 'Delete item'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(160px, 1fr))', borderTop: '1px solid #f1eee8' }}>
            {[
              { label: 'Model', value: asset.model_number },
              { label: 'Serial', value: asset.serial_number },
              { label: 'Purchased', value: asset.purchase_date ? new Date(asset.purchase_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null },
              { label: 'Purchase Price', value: asset.purchase_price != null ? `$${asset.purchase_price.toLocaleString()}` : null },
              { label: 'Warranty Expires', value: asset.warranty_expiry ? new Date(asset.warranty_expiry + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null },
            ].filter((r) => r.value).map((r) => (
              <div key={r.label} style={{ padding: mobile ? '10px 14px' : '12px 20px', borderRight: '1px solid #f1eee8', borderTop: mobile ? '1px solid #f1eee8' : undefined, minWidth: 0, overflowWrap: 'anywhere' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a39c92', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 13, color: '#45413b', fontWeight: 500 }}>{r.value}</div>
              </div>
            ))}
            {asset.description && (
              <div style={{ padding: mobile ? '12px 14px' : '12px 20px', gridColumn: '1 / -1', borderTop: mobile ? '1px solid #f1eee8' : undefined }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a39c92', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14, color: '#5e5953', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{asset.description}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <ItemPhotosSection assetId={id} />
      <TasksSection assetId={id} assetName={asset.name} />
      <SchedulesSection assetId={id} assetName={asset.name} />
      <ServiceLogSection assetId={id} isVehicle={asset.category === 'vehicles'} />
      <NotesSection assetId={id} />
      <LinksSection assetId={id} />
    </div>
  );
}
