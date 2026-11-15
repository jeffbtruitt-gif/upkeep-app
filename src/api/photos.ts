import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useHousehold } from '@/api/household';

const db = supabase as any;
export const PHOTO_BUCKET = 'upkeep-photos';

export interface UpkeepPhoto {
  id: string;
  asset_id: string;
  note_id: string | null;
  storage_path: string;
  caption: string | null;
  created_at: string;
  /** Short-lived signed URL (bucket is private). */
  url: string;
}

export const photoKeys = {
  asset: (assetId: string) => ['upkeep', 'photos', assetId] as const,
};

/** All photos for an asset (item photos + note photos), oldest first, with signed URLs. */
export function useAssetPhotos(assetId: string) {
  return useQuery({
    queryKey: photoKeys.asset(assetId),
    enabled: !!assetId,
    staleTime: 45 * 60 * 1000, // signed URLs last 60 min
    queryFn: async () => {
      const { data, error } = await db.from('upkeep_photos').select('*').eq('asset_id', assetId).order('created_at');
      if (error) throw error;
      const rows = (data ?? []) as Omit<UpkeepPhoto, 'url'>[];
      if (rows.length === 0) return [] as UpkeepPhoto[];
      const { data: signed, error: sErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(rows.map((r) => r.storage_path), 60 * 60);
      if (sErr) throw sErr;
      const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
      return rows.map((r) => ({ ...r, url: urlByPath.get(r.storage_path) ?? '' })) as UpkeepPhoto[];
    },
  });
}

/** Shrink phone photos to max 2000px JPEG. Falls back to the original file if the browser can't decode it. */
async function compressImage(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    const max = 2000;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    if (blob) return { blob, ext: 'jpg', type: 'image/jpeg' };
  } catch { /* fall through */ }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  return { blob: file, ext, type: file.type || 'image/jpeg' };
}

export function useUploadPhotos() {
  const hh = useHousehold();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ asset_id, note_id = null, files }: { asset_id: string; note_id?: string | null; files: File[] }) => {
      if (!hh?.id) throw new Error('Household not loaded yet');
      for (const file of files) {
        const { blob, ext, type } = await compressImage(file);
        const path = `${hh.id}/${asset_id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: type });
        if (upErr) throw upErr;
        const { error } = await db.from('upkeep_photos').insert({ asset_id, note_id, storage_path: path });
        if (error) {
          await supabase.storage.from(PHOTO_BUCKET).remove([path]);
          throw error;
        }
      }
      return asset_id;
    },
    onSettled: (_d, _e, vars) => qc.invalidateQueries({ queryKey: photoKeys.asset(vars.asset_id) }),
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: Pick<UpkeepPhoto, 'id' | 'asset_id' | 'storage_path'>) => {
      const { error } = await db.from('upkeep_photos').delete().eq('id', photo.id);
      if (error) throw error;
      await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
      return photo.asset_id;
    },
    onSuccess: (assetId) => qc.invalidateQueries({ queryKey: photoKeys.asset(assetId) }),
  });
}

/** Remove the stored files for an asset or a note before its rows cascade-delete. */
export async function removePhotoFiles(filter: { asset_id: string } | { note_id: string }) {
  const [col, val] = Object.entries(filter)[0];
  const { data } = await db.from('upkeep_photos').select('storage_path').eq(col, val);
  const paths = ((data ?? []) as { storage_path: string }[]).map((r) => r.storage_path);
  if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
}
