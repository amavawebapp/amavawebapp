# Supabase keep-alive

Supabase **free-tier** projects are **paused after 7 days with no activity**. Data is
not deleted, but someone has to manually click "Restore" in the dashboard before the
backend works again. To avoid this, a scheduled GitHub Action
(`.github/workflows/supabase-keepalive.yml`) makes one tiny read request per day so the
project always counts as active and never pauses.

## One-time setup (after the Supabase project exists)

Add two repository secrets so the Action can reach your project:

1. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.
2. Add:
   - `SUPABASE_URL` — your project URL, e.g. `https://abcdefgh.supabase.co`
   - `SUPABASE_ANON_KEY` — the project's **anon / public** API key
     (Supabase dashboard → Project Settings → API).

   These are the same two values used by the app's `.env` (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`). The anon key is safe to store as a secret here; it is
   public-facing by design and protected by Row-Level Security.

   Or set them from the terminal with the GitHub CLI:
   ```bash
   gh secret set SUPABASE_URL --repo amavawebapp/amavawebapp --body "https://YOUR-PROJECT.supabase.co"
   gh secret set SUPABASE_ANON_KEY --repo amavawebapp/amavawebapp --body "YOUR-ANON-KEY"
   ```

3. Test it: GitHub repo → **Actions → Supabase keep-alive → Run workflow**. A green run
   that logs `Keep-alive ping OK.` confirms it works.

## Good to know

- **It prevents pausing; it cannot un-pause.** As long as the daily run keeps firing,
  the project never pauses. If the project is *already* paused, restore it once from the
  Supabase dashboard — the keep-alive then keeps it awake from there on.
- **GitHub disables scheduled workflows after 60 days of repository inactivity** (no
  commits). For a repo under active development this won't trigger; if the project ever
  goes completely dormant for 60+ days, re-enable the workflow from the Actions tab (or
  push any commit) to resume the keep-alive.
- The app is **offline-first**, so even in the unlikely event the backend is briefly
  unavailable, facilitators can still capture assessments — they queue on-device and
  sync once the backend is back.
