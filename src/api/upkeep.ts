import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useHousehold } from '@/api/household';
import { removePhotoFiles } from '@/api/photos';

const db = supabase as any;

// ── Types ──────────────────────────────────────────────────────────────────

export type AssetStatus = 'active' | 'inactive';
export type AssetFrequency = 'monthly' | 'quarterly' | 'twice_yearly' | 'yearly' | 'every_2_years' | 'as_needed';

export interface UpkeepAsset {
  id: string;
  household_id: string;
  name: string;
  category: string;
  model_number: string | null;
  serial_number: string | null;
  location: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiry: string | null;
  description: string | null;
  status: AssetStatus;
  created_at: string;
  updated_at: string;
}

export interface UpkeepNote {
  id: string;
  asset_id: string;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpkeepMaintenance {
  id: string;
  asset_id: string;
  title: string;
  description: string | null;
  frequency: AssetFrequency;
  start_date: string | null;
  last_performed: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpkeepLink {
  id: string;
  asset_id: string;
  name: string;
  url: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ── Query keys ─────────────────────────────────────────────────────────────

export const upkeepKeys = {
  assets: (hhId: string) => ['upkeep', 'assets', hhId] as const,
  asset: (id: string) => ['upkeep', 'asset', id] as const,
  notes: (assetId: string) => ['upkeep', 'notes', assetId] as const,
  maintenance: (assetId: string) => ['upkeep', 'maintenance', assetId] as const,
  allMaintenance: (hhId: string) => ['upkeep', 'all-maintenance', hhId] as const,
  links: (assetId: string) => ['upkeep', 'links', assetId] as const,
};

// ── Assets ─────────────────────────────────────────────────────────────────

export function useUpkeepAssets() {
  const hh = useHousehold();
  return useQuery({
    queryKey: upkeepKeys.assets(hh?.id ?? ''),
    enabled: !!hh?.id,
    queryFn: async () => {
      const { data, error } = await db.from('upkeep_assets').select('*').eq('household_id', hh!.id).order('name');
      if (error) throw error;
      return data as UpkeepAsset[];
    },
  });
}

export function useUpkeepAsset(id: string) {
  return useQuery({
    queryKey: upkeepKeys.asset(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from('upkeep_assets').select('*').eq('id', id).single();
      if (error) throw error;
      return data as UpkeepAsset;
    },
  });
}

export function useCreateAsset() {
  const hh = useHousehold();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<UpkeepAsset, 'id' | 'household_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await db.from('upkeep_assets').insert({ ...input, household_id: hh!.id }).select().single();
      if (error) throw error;
      return data as UpkeepAsset;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: upkeepKeys.assets(hh?.id ?? '') }),
  });
}

export function useUpdateAsset() {
  const hh = useHousehold();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<UpkeepAsset> & { id: string }) => {
      const { data, error } = await db.from('upkeep_assets').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data as UpkeepAsset;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: upkeepKeys.assets(hh?.id ?? '') });
      qc.invalidateQueries({ queryKey: upkeepKeys.asset(vars.id) });
    },
  });
}

export function useDeleteAsset() {
  const hh = useHousehold();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await removePhotoFiles({ asset_id: id });
      const { error } = await db.from('upkeep_assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: upkeepKeys.assets(hh?.id ?? '') }),
  });
}

// ── Notes ──────────────────────────────────────────────────────────────────

export function useUpkeepNotes(assetId: string) {
  return useQuery({
    queryKey: upkeepKeys.notes(assetId),
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await db.from('upkeep_notes').select('*').eq('asset_id', assetId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as UpkeepNote[];
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Pick<UpkeepNote, 'asset_id' | 'title' | 'body'>) => {
      const { data, error } = await db.from('upkeep_notes').insert(input).select().single();
      if (error) throw error;
      return data as UpkeepNote;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: upkeepKeys.notes(vars.asset_id) }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id, ...input }: Partial<UpkeepNote> & { id: string; asset_id: string }) => {
      const { data, error } = await db.from('upkeep_notes').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data as UpkeepNote;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: upkeepKeys.notes(vars.asset_id) }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id }: { id: string; asset_id: string }) => {
      await removePhotoFiles({ note_id: id });
      const { error } = await db.from('upkeep_notes').delete().eq('id', id);
      if (error) throw error;
      return asset_id;
    },
    onSuccess: (assetId) => {
      qc.invalidateQueries({ queryKey: upkeepKeys.notes(assetId) });
      qc.invalidateQueries({ queryKey: ['upkeep', 'photos', assetId] });
    },
  });
}

// ── Maintenance ────────────────────────────────────────────────────────────

export function useUpkeepMaintenance(assetId: string) {
  return useQuery({
    queryKey: upkeepKeys.maintenance(assetId),
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await db.from('upkeep_maintenance').select('*').eq('asset_id', assetId).order('title');
      if (error) throw error;
      return data as UpkeepMaintenance[];
    },
  });
}

export function useAllUpkeepMaintenance() {
  const hh = useHousehold();
  return useQuery({
    queryKey: upkeepKeys.allMaintenance(hh?.id ?? ''),
    enabled: !!hh?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from('upkeep_maintenance')
        .select('*, upkeep_assets!inner(name, household_id, status)')
        .eq('upkeep_assets.household_id', hh!.id)
        .eq('upkeep_assets.status', 'active');
      if (error) throw error;
      return data as (UpkeepMaintenance & { upkeep_assets: { name: string; household_id: string; status: string } })[];
    },
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Pick<UpkeepMaintenance, 'asset_id' | 'title' | 'description' | 'frequency' | 'start_date' | 'last_performed'>) => {
      const { data, error } = await db.from('upkeep_maintenance').insert(input).select().single();
      if (error) throw error;
      return data as UpkeepMaintenance;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: upkeepKeys.maintenance(vars.asset_id) });
      qc.invalidateQueries({ queryKey: ['upkeep', 'all-maintenance'] });
      qc.invalidateQueries({ queryKey: ['upkeep', 'tasks'] });
    },
  });
}

export function useUpdateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id, ...input }: Partial<UpkeepMaintenance> & { id: string; asset_id: string }) => {
      const { data, error } = await db.from('upkeep_maintenance').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data as UpkeepMaintenance;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: upkeepKeys.maintenance(vars.asset_id) });
      qc.invalidateQueries({ queryKey: ['upkeep', 'all-maintenance'] });
      qc.invalidateQueries({ queryKey: ['upkeep', 'tasks'] });
    },
  });
}

export function useDeleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id }: { id: string; asset_id: string }) => {
      const { error } = await db.from('upkeep_maintenance').delete().eq('id', id);
      if (error) throw error;
      return asset_id;
    },
    onSuccess: (assetId) => {
      qc.invalidateQueries({ queryKey: upkeepKeys.maintenance(assetId) });
      qc.invalidateQueries({ queryKey: ['upkeep', 'all-maintenance'] });
      qc.invalidateQueries({ queryKey: ['upkeep', 'tasks'] });
    },
  });
}

// ── Maintenance log (work actually done) ──────────────────────────────────

export interface UpkeepLogEntry {
  id: string;
  asset_id: string;
  service_date: string;
  title: string;
  description: string | null;
  provider: string | null;
  mileage: number | null;
  cost: number | null;
  invoice_number: string | null;
  created_at: string;
  updated_at: string;
}

export type LogInput = Pick<UpkeepLogEntry, 'asset_id' | 'service_date' | 'title' | 'description' | 'provider' | 'mileage' | 'cost' | 'invoice_number'>;

export const logKey = (assetId: string) => ['upkeep', 'service-log', assetId] as const;

export function useServiceLog(assetId: string) {
  return useQuery({
    queryKey: logKey(assetId),
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await db.from('upkeep_service_log').select('*').eq('asset_id', assetId)
        .order('service_date', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return data as UpkeepLogEntry[];
    },
  });
}

export function useSaveLogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: LogInput & { id?: string }) => {
      const q = id
        ? db.from('upkeep_service_log').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id)
        : db.from('upkeep_service_log').insert(input);
      const { data, error } = await q.select().single();
      if (error) throw error;
      return data as UpkeepLogEntry;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: logKey(vars.asset_id) }),
  });
}

export function useDeleteLogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id }: { id: string; asset_id: string }) => {
      await removePhotoFiles({ log_id: id });
      const { error } = await db.from('upkeep_service_log').delete().eq('id', id);
      if (error) throw error;
      return asset_id;
    },
    onSuccess: (assetId) => {
      qc.invalidateQueries({ queryKey: logKey(assetId) });
      qc.invalidateQueries({ queryKey: ['upkeep', 'photos', assetId] });
    },
  });
}

// ── Tasks (dated to-dos made by schedules, or one-time) ───────────────────

export type TaskStatus = 'open' | 'done' | 'skipped';

export interface UpkeepTask {
  id: string;
  asset_id: string;
  maintenance_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  status: TaskStatus;
  completed_on: string | null;
  log_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskWithContext = UpkeepTask & {
  upkeep_assets?: { name: string; household_id: string; status: string };
  upkeep_maintenance?: { frequency: AssetFrequency } | null;
};

export function useAssetTasks(assetId: string) {
  return useQuery({
    queryKey: ['upkeep', 'tasks', 'asset', assetId],
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await db.from('upkeep_tasks').select('*, upkeep_maintenance(frequency)')
        .eq('asset_id', assetId).eq('status', 'open').order('due_date').order('title');
      if (error) throw error;
      return data as TaskWithContext[];
    },
  });
}

export function useAllOpenTasks() {
  const hh = useHousehold();
  return useQuery({
    queryKey: ['upkeep', 'tasks', 'all', hh?.id ?? ''],
    enabled: !!hh?.id,
    queryFn: async () => {
      const { data, error } = await db.from('upkeep_tasks')
        .select('*, upkeep_assets!inner(name, household_id, status), upkeep_maintenance(frequency)')
        .eq('upkeep_assets.household_id', hh!.id).eq('upkeep_assets.status', 'active')
        .eq('status', 'open').order('due_date').order('title');
      if (error) throw error;
      return data as TaskWithContext[];
    },
  });
}

function invalidateTasks(qc: ReturnType<typeof useQueryClient>, assetId: string) {
  qc.invalidateQueries({ queryKey: ['upkeep', 'tasks'] });
  qc.invalidateQueries({ queryKey: logKey(assetId) });
  qc.invalidateQueries({ queryKey: upkeepKeys.maintenance(assetId) });
  qc.invalidateQueries({ queryKey: ['upkeep', 'all-maintenance'] });
}

/** One-time task (no schedule). */
export function useSaveOneTimeTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id?: string; asset_id: string; title: string; description: string | null; due_date: string }) => {
      const q = id
        ? db.from('upkeep_tasks').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id)
        : db.from('upkeep_tasks').insert(input);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: (_, vars) => invalidateTasks(qc, vars.asset_id),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; asset_id: string }) => {
      const { error } = await db.from('upkeep_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => invalidateTasks(qc, vars.asset_id),
  });
}

/** Mark done (adds a Maintenance Log entry) or skip (no log). Older open tasks on the same schedule are cleared. */
export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done_on, skip }: { id: string; asset_id: string; done_on: string; skip: boolean }) => {
      const { error } = await db.rpc('upkeep_complete_task', { p_task_id: id, p_done_on: done_on, p_skip: skip });
      if (error) throw error;
    },
    onSuccess: (_, vars) => invalidateTasks(qc, vars.asset_id),
  });
}

export type TaskDueStatus = 'overdue' | 'due_soon' | 'soon90' | 'later';

export function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = parseDateOnly(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function getTaskStatus(t: Pick<UpkeepTask, 'due_date'>): TaskDueStatus {
  const n = daysUntil(t.due_date);
  if (n < 0) return 'overdue';
  if (n <= 30) return 'due_soon';
  if (n <= 90) return 'soon90';
  return 'later';
}

// ── Links ──────────────────────────────────────────────────────────────────

export function useUpkeepLinks(assetId: string) {
  return useQuery({
    queryKey: upkeepKeys.links(assetId),
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await db.from('upkeep_links').select('*').eq('asset_id', assetId).order('name');
      if (error) throw error;
      return data as UpkeepLink[];
    },
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Pick<UpkeepLink, 'asset_id' | 'name' | 'url' | 'description'>) => {
      const { data, error } = await db.from('upkeep_links').insert(input).select().single();
      if (error) throw error;
      return data as UpkeepLink;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: upkeepKeys.links(vars.asset_id) }),
  });
}

export function useUpdateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id, ...input }: Partial<UpkeepLink> & { id: string; asset_id: string }) => {
      const { data, error } = await db.from('upkeep_links').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data as UpkeepLink;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: upkeepKeys.links(vars.asset_id) }),
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id }: { id: string; asset_id: string }) => {
      const { error } = await db.from('upkeep_links').delete().eq('id', id);
      if (error) throw error;
      return asset_id;
    },
    onSuccess: (assetId) => qc.invalidateQueries({ queryKey: upkeepKeys.links(assetId) }),
  });
}

// ── Scheduling helpers ─────────────────────────────────────────────────────

const FREQ_MONTHS: Record<Exclude<AssetFrequency, 'as_needed'>, number> = {
  monthly: 1, quarterly: 3, twice_yearly: 6, yearly: 12, every_2_years: 24,
};

/** Parse a YYYY-MM-DD date as local noon so it never shifts a day across time zones. */
export function parseDateOnly(s: string): Date {
  return new Date(s.length === 10 ? `${s}T12:00:00` : s);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? parseDateOnly(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getNextDueDate(item: UpkeepMaintenance): Date | null {
  if (item.frequency === 'as_needed') return null;
  const months = FREQ_MONTHS[item.frequency];
  // If the task has been done, the next due date is one interval after that — it can be in the past (overdue).
  if (item.last_performed) {
    const last = parseDateOnly(item.last_performed);
    const d = new Date(last.getFullYear(), last.getMonth() + months, last.getDate());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (!item.start_date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let d = parseDateOnly(item.start_date); d.setHours(0, 0, 0, 0);
  while (d <= today) d = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  return d;
}

export type MaintenanceStatus = 'overdue' | 'due_soon' | 'scheduled' | 'as_needed';

export function getMaintenanceStatus(item: UpkeepMaintenance): MaintenanceStatus {
  if (item.frequency === 'as_needed') return 'as_needed';
  const next = getNextDueDate(item);
  if (!next) return 'as_needed';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((next.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 30) return 'due_soon';
  return 'scheduled';
}

/** Most frequent first — used to sort maintenance lists. */
export const FREQ_ORDER: Record<AssetFrequency | 'once', number> = {
  monthly: 0, quarterly: 1, twice_yearly: 2, yearly: 3, every_2_years: 4, once: 5, as_needed: 6,
};

export function byFrequency(a: UpkeepMaintenance, b: UpkeepMaintenance) {
  return FREQ_ORDER[a.frequency] - FREQ_ORDER[b.frequency] || a.title.localeCompare(b.title);
}

export const FREQ_STYLES: Record<AssetFrequency | 'once', { bg: string; text: string; border: string }> = {
  once:         { bg: '#fdf1e6', text: '#8b3a00', border: '#f0c9a4' },
  monthly:      { bg: '#efe8fa', text: '#5b2d9c', border: '#cdb8ee' },
  quarterly:    { bg: '#e0f2f1', text: '#11665f', border: '#a6d6d1' },
  twice_yearly: { bg: '#e6f2e2', text: '#2f6b1f', border: '#b5d8a8' },
  yearly:       { bg: '#fbe8f1', text: '#9a2a62', border: '#efbdd4' },
  every_2_years: { bg: '#e8eef8', text: '#2d4a8a', border: '#b9c8e8' },
  as_needed:    { bg: '#ffffff', text: '#6b655d', border: '#d6d1c8' },
};

export const FREQ_LABELS: Record<AssetFrequency | 'once', string> = {
  once: 'One time', monthly: 'Monthly', quarterly: 'Quarterly', twice_yearly: 'Twice a year', yearly: 'Yearly', every_2_years: 'Every 2 years', as_needed: 'As needed',
};

export const UPKEEP_CATEGORIES = [
  { value: 'hvac',       label: 'HVAC & Climate' },
  { value: 'plumbing',   label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'vehicles',   label: 'Vehicles' },
  { value: 'exterior',   label: 'Exterior' },
  { value: 'yard',       label: 'Yard & Garden' },
  { value: 'pool',       label: 'Pool & Spa' },
  { value: 'safety',     label: 'Safety' },
  { value: 'general',    label: 'General' },
] as const;

export const CAT_STYLES: Record<string, { bg: string; text: string }> = {
  hvac:        { bg: '#e6f0ea', text: '#1e5c40' },
  plumbing:    { bg: '#e6eef5', text: '#1c4a7a' },
  electrical:  { bg: '#f8efd9', text: '#8a5a00' },
  appliances:  { bg: '#efeaf6', text: '#4a2d8a' },
  vehicles:    { bg: '#ece9e3', text: '#5e5953' },
  exterior:    { bg: '#f6ece3', text: '#8b3a00' },
  yard:        { bg: '#edf3e1', text: '#3a5c1c' },
  pool:        { bg: '#e3f1f1', text: '#1c6a66' },
  safety:      { bg: '#fbeae7', text: '#a02c1c' },
  general:     { bg: '#f1eee8', text: '#5e5953' },
};
