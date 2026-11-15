import { useEffect, useRef, useState } from 'react';
import { useDeletePhoto, type UpkeepPhoto } from '@/api/photos';

const F = '#1d3a2c';

/** Button that opens the photo picker / camera. */
export function AddPhotosButton({ onFiles, busy, label = '+ Add Photos' }: { onFiles: (files: File[]) => void; busy?: boolean; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple hidden
        onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ''; if (files.length) onFiles(files); }} />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()}
        style={{ background: '#fff', border: '1.5px solid #cfe0d8', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: F, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Uploading…' : label}
      </button>
    </>
  );
}

/** Thumbnail strip; tap a photo to view it full screen. */
export function PhotoGrid({ photos, size = 92, editable = true }: { photos: UpkeepPhoto[]; size?: number; editable?: boolean }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (photos.length === 0) return null;
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={(e) => { e.stopPropagation(); setOpenIdx(i); }}
            style={{ width: size, height: size, padding: 0, border: '1px solid #e4e0d8', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: '#f3f7f4', flexShrink: 0 }}>
            {p.url && <img src={p.url} alt={p.caption ?? ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          </button>
        ))}
      </div>
      {openIdx !== null && photos[openIdx] && (
        <Lightbox photos={photos} index={openIdx} onIndex={setOpenIdx} onClose={() => setOpenIdx(null)} editable={editable} />
      )}
    </>
  );
}

function Lightbox({ photos, index, onIndex, onClose, editable }: {
  photos: UpkeepPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void; editable: boolean;
}) {
  const del = useDeletePhoto();
  const photo = photos[index];
  const prev = () => onIndex((index - 1 + photos.length) % photos.length);
  const next = () => onIndex((index + 1) % photos.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function remove() {
    if (!confirm('Delete this photo?')) return;
    await del.mutateAsync(photo);
    if (photos.length <= 1) onClose();
    else if (index >= photos.length - 1) onIndex(index - 1);
  }

  // Simple swipe left/right on phones
  const touchX = useRef<number | null>(null);

  const navBtn: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 9999, width: 44, height: 44, fontSize: 24, cursor: 'pointer' };

  return (
    <div onClick={(e) => { e.stopPropagation(); onClose(); }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null || photos.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current; touchX.current = null;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
      }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <img src={photo.url} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '94vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 6 }} />
      {photos.length > 1 && (
        <>
          <button aria-label="Previous" onClick={(e) => { e.stopPropagation(); prev(); }} style={{ ...navBtn, left: 12 }}>‹</button>
          <button aria-label="Next" onClick={(e) => { e.stopPropagation(); next(); }} style={{ ...navBtn, right: 12 }}>›</button>
        </>
      )}
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', fontSize: 13 }}>
        <span>{index + 1} / {photos.length} · {new Date(photo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={photo.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: 12.5, fontWeight: 600, padding: '7px 12px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, textDecoration: 'none' }}>Open</a>
          {editable && (
            <button onClick={remove} disabled={del.isPending} style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {del.isPending ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button onClick={onClose} aria-label="Close" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>
      </div>
    </div>
  );
}

/** Previews for files picked but not yet uploaded (used in the note form). */
export function PendingPhotos({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const u = files.map((f) => URL.createObjectURL(f));
    setUrls(u);
    return () => u.forEach((x) => URL.revokeObjectURL(x));
  }, [files]);
  if (files.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {urls.map((u, i) => (
        <div key={u} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px dashed #3f7a64' }}>
          <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <button type="button" onClick={() => onRemove(i)} aria-label="Remove"
            style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: 9999, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 13, lineHeight: '22px', padding: 0, cursor: 'pointer' }}>×</button>
        </div>
      ))}
    </div>
  );
}
