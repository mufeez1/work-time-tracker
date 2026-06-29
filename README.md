# ⏱️ Work Time Tracker

A shared work-hours tracker built with **React + Vite** and **Supabase**. Clock in/out,
edit entries, view a per-day monthly report, and export to Excel (one sheet per month).
Deployed free on **GitHub Pages** so anyone with the link can use it.

The Supabase database is already provisioned and wired up — the public URL and key are
baked into `src/supabaseClient.js` (safe to expose; the table is protected by Row Level
Security). You only need to push this repo to GitHub.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. **Create a new repo** on GitHub (e.g. `work-time-tracker`). Leave it empty.

2. **Push this folder** to it:

   ```bash
   cd work-time-tracker-react
   git init
   git add .
   git commit -m "Work time tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

3. **Turn on Pages**: in the repo, go to **Settings → Pages → Build and deployment**
   and set **Source = GitHub Actions**.

4. The included workflow (`.github/workflows/deploy.yml`) builds and publishes
   automatically on every push to `main`. After it finishes (Actions tab), your site is
   live at:

   ```
   https://<your-username>.github.io/<your-repo>/
   ```

That URL is what you share with others. Every visitor reads and writes the same shared
board in real time.

## Notes

- **Overnight shifts** are handled (e.g. 10 PM → 6 AM = 8 h).
- **Changing the database**: override `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` at build
  time, or edit `src/supabaseClient.js`.
- **Want private/per-user data?** Switch the access model to Supabase Auth and tighten the
  RLS policies — ask and I can set that up.
