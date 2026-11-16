# Upkeep app

Jeff's home-maintenance records app: household items ("assets"), their recurring maintenance tasks, a log of work done, notes, links (manuals, parts) and photos. Jeff mostly uses it on his iPhone.

- **Live:** https://jeffbtruitt-gif.github.io/upkeep-app/
- **Repo:** https://github.com/jeffbtruitt-gif/upkeep-app
- **Owner:** Jeff is a non-developer PM. Explain changes in plain language and keep replies short.

## Stack and deploy

- React + TypeScript + Vite, React Router, TanStack Query. Inline styles, no CSS framework.
- Supabase backend: project `kdelwwnpuuvgnamumhec` (shared with Jeff's other apps, so leave non-`upkeep_*` tables alone).
- Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`, which takes about 40 seconds. Run `npm run build` before pushing. Check the deploy with `gh run list -L 1`.
- Build env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Any placeholder works for a local type-check build.
- `vite.config.ts` uses `base: '/upkeep-app/'`, and the router uses the same basename.

## Data model (Supabase, schema `public`)

All tables have RLS. Access is limited to the user's household through `tf_household_members(user_id, household_id)`. Jeff's household id is `08454fdb-b852-42c0-b90c-608db78ce3d4`. Members are Jeff and Britney.

| Table | Purpose | Key columns |
|---|---|---|
| `upkeep_assets` | Items (appliances, HVAC, vehicles…) | household_id, name, category, model_number, serial_number, location, purchase_date, purchase_price, warranty_expiry, description, status (`active`/`inactive`) |
| `upkeep_maintenance` | **Schedules** (repeat rules) for an item | asset_id, title, description, frequency (`monthly`/`quarterly`/`twice_yearly`/`yearly`/`as_needed`), start_date (= first due date), last_performed (latest Mark done) |
| `upkeep_tasks` | Dated to-dos made by a schedule, or one-time (maintenance_id null) | asset_id, maintenance_id, title, description, due_date, status (`open`/`done`/`skipped`), completed_on, log_id. Unique (maintenance_id, due_date) |
| `upkeep_service_log` | "Maintenance Log": work actually done | asset_id, service_date, title, description, provider, mileage, cost, invoice_number |
| `upkeep_notes` | Free-form notes | asset_id, title, body |
| `upkeep_links` | Manuals, parts, product pages | asset_id, name, url, description |
| `upkeep_photos` | Photos | asset_id, note_id (nullable), log_id (nullable), storage_path, caption |

- If both note_id and log_id are null, the photo belongs to the item itself.
- Photo files live in the **private** storage bucket `upkeep-photos` at `{household_id}/{asset_id}/{uuid}.jpg`. The app reads them through signed URLs.
- Child rows cascade-delete. The app removes storage files itself (`removePhotoFiles`) before it deletes a note, log entry or asset.

## Behavior rules

- **Schedules → tasks (database does this):** `upkeep_sync_tasks(schedule_id)` keeps a schedule's open tasks on fixed dates (start_date + n × interval), 3 years out. It runs from a trigger when a schedule's frequency/start_date/title/description changes, and daily via pg_cron job `upkeep-sync-tasks`. Only the latest missed date stays open (one overdue max). Nothing is created on or before the last closed task. No start_date or `as_needed` = no tasks. Deleting a schedule deletes its open tasks; closed tasks keep history (maintenance_id set null).
- **Completing:** RPC `upkeep_complete_task(p_task_id, p_done_on, p_skip)`. Mark done adds an `upkeep_service_log` entry (log_id), and updates the schedule's last_performed. Skip adds no log. Both mark earlier open tasks of that schedule `skipped`.
- **Task statuses (UI):** overdue, due soon (≤30 days), next 90 days, later. Maintenance tab groups by these; "Later" is collapsed.
- **Sort order:** maintenance lists sort most-frequent first (`byFrequency`). Frequency chips are color-coded (`FREQ_STYLES` in `src/api/upkeep.ts`).
- **Dates:** parse date-only strings with `parseDateOnly` (local noon) to avoid off-by-one-day errors in Central time.
- **Descriptions:** render with `whiteSpace: 'pre-wrap'` so line breaks show.
- **Mobile:** `useIsMobile()` (≤760px) switches to a top bar, a bottom tab bar, and card lists in place of tables. Inputs are 16px so iOS doesn't zoom. Test any UI change at phone width (390px).
- **Photos:** resized client-side to a max of 2000px JPEG before upload.

## Key files

- `src/api/upkeep.ts`: types and query/mutation hooks for assets, maintenance, log, notes, links. Also holds the due-date logic.
- `src/api/photos.ts`: photo upload, delete and signed URLs.
- `src/pages/upkeep/AssetDetailPage.tsx`: the item page and its sections (Photos, Upcoming Tasks, Schedules, Maintenance Log, Notes, Links).
- `src/pages/upkeep/Tasks.tsx`: `TaskRows` list and `TaskModal` (Mark done / Skip, edit/delete one-time).
- `src/pages/upkeep/MaintenanceDetailModal.tsx`: schedule detail view and `FrequencyPill`.
- `src/pages/upkeep/Photos.tsx`: thumbnail grid, full-screen viewer, add button.
- `src/pages/upkeep/{UpkeepDashboardPage,AssetsPage,MaintenancePage,UpkeepShell}.tsx`: the other pages and the app layout.

## Adding records for Jeff

- Add repeating maintenance as `upkeep_maintenance` rows with a start_date; the trigger creates the tasks. One-time items go straight into `upkeep_tasks`.
- Jeff often sends a photo (an equipment label, an invoice) and asks for a record. Insert it directly with SQL into the tables above using his household id.
- When asked, look up the manufacturer's maintenance schedule and manual, then add `upkeep_maintenance` rows and `upkeep_links`.
- Put line breaks between sentences in descriptions.
- Photo uploads need Jeff's login. Ask him to attach images in the app.

## Current items (Nov 2026)

Traeger Grill, Kitchen Fridge (Zline RBIV-36), Furnace (Amana), Air Conditioner, APEC ROES-50 RO water filter (7 tasks + manual links), 2026 GMC Yukon XL (VIN 1GKS2JKL7TR324048; Aug 18 2026 warranty visit logged).

## Ideas not built yet

- Undo for a completed/skipped task.
- First due dates for the APEC filter schedules (none set yet, so they create no tasks).
- A "Forgot password?" link on the login page.
- A GM maintenance schedule for the Yukon.
- Enable RLS on two non-Upkeep tables in the shared project (`Spanish Spelling Words`, `workout_progress`).
