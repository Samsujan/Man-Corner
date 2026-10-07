# Installation and Hosting — Maná Corner

## Requirements

- Node.js 20 or newer and npm
- A Supabase project with database and Storage enabled
- Render (API) and Vercel (frontend) accounts for the documented deployment path

## Prepare Supabase

1. Create a Supabase project. Keeping Maná Corner in a separate project from unrelated applications makes access and backups easier to manage.
2. Run [`supabase/migrations/202609260001_mana_corner.sql`](./supabase/migrations/202609260001_mana_corner.sql) in the Supabase SQL Editor.
3. Copy the project URL and service-role key from **Project Settings → API**. The backend uses this key to access the database and private receipt bucket. It must never be included in the frontend bundle.

## Run locally

1. Copy `.env.example` to `.env` and set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CLIENT_ORIGIN=http://localhost:3000`
   - `JWT_SECRET` and `OWNER_SETUP_KEY` as different, randomly generated secrets (32+ characters each)
2. Install backend and frontend packages:

   ```powershell
   npm install
   Set-Location client
   npm install
   ```

3. Start the API from the repository root with `npm run server`.
4. Start the frontend from the `client` directory with `npm start`.
5. Confirm `http://localhost:5000/api/health` returns `{"status":"ok"}` and open `http://localhost:3000`.
6. Sign up the first owner using `OWNER_SETUP_KEY`. Later public sign-ups are restricted to billing-only guest permissions. Use the owner-only user management API to assign owner access to the other owner accounts.

## Deploy the API to Render

1. Create a Render Web Service from this repository and use the included `render.yaml` blueprint (or set the same build and start commands: `npm install` and `npm start`).
2. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CLIENT_ORIGIN` in the Render service environment. `CLIENT_ORIGIN` must be the exact HTTPS frontend origin; do not add a trailing path.
3. Generate distinct secure values for `JWT_SECRET` and `OWNER_SETUP_KEY`. Store both only as Render secrets.
4. Wait for `/api/health` to report healthy.

## Deploy the frontend to Vercel

1. Import the repository and set the project root directory to `client`.
2. Set `REACT_APP_API_URL` to `https://<render-service-host>/api`.
3. Add `www.manácorner.com` in Vercel's domain settings, then configure the DNS records Vercel provides. Also configure the apex domain if desired.
4. Use the exact deployed frontend origin in Render's `CLIENT_ORIGIN`, then redeploy the API.

## Security and operational notes

- `.env` is ignored by Git. Do not commit secrets or expose the Supabase service-role key to browsers.
- The database migration enables row-level security without public table policies; only the server's service-role client accesses the cafe tables.
- Expense receipts live in a private Storage bucket and are returned to owners as one-hour signed URLs.
- The first owner setup key can only bootstrap one initial owner; subsequent account role changes require an authenticated owner. The database enforces a maximum of three owners, two billing guests, and at least one remaining owner.
- The migration creates new Supabase tables. It does not migrate any existing MongoDB records.
- Take regular Supabase backups and rotate secrets if they are exposed.

## Docker (optional local development)

After configuring `.env`, run `docker compose up --build`. The UI is available at `http://localhost:3000` and the API at `http://localhost:5000`. Docker Compose no longer starts a MongoDB service.
