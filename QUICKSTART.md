# Maná Corner Quick Start

## Supabase setup

1. Create a Supabase project (a separate project for Maná Corner keeps its data and backups isolated from unrelated applications).
2. In **SQL Editor**, run `supabase/migrations/202609260001_mana_corner.sql`.
3. In **Project Settings → API**, copy the project URL and the service-role key. The service-role key is backend-only; do not use it in React or share it in chat.

## Run locally on Windows

1. Copy `.env.example` to `.env`.
2. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CLIENT_ORIGIN=http://localhost:3000`.
3. Replace `JWT_SECRET` and `OWNER_SETUP_KEY` with different random secrets, each at least 32 characters long. Keep `.env` private.
4. Install dependencies:

   ```powershell
   npm install
   Set-Location client
   npm install
   ```

5. Run the API from the project root:

   ```powershell
   npm run server
   ```

6. In a second terminal, run the frontend:

   ```powershell
   Set-Location C:\path\to\mana-corner\client
   npm start
   ```

Open `http://localhost:3000`. The API health endpoint is `http://localhost:5000/api/health`.

## Create accounts

- Create the first owner by signing up and entering the `OWNER_SETUP_KEY` in the setup-key field.
- Later sign-ups receive billing-only guest access. An owner can promote or demote users through the owner-only user management API.
- Do not use example passwords or send account credentials through chat.

## Initial cafe setup

Sign in as an owner and add the real menu items, prices, and applicable GST rates. Configure the three owner accounts before relying on owner-wise share displays. Add operating expenses and optional receipt/payment screenshots to build useful forecast data.

## Deploy

- API: deploy the repository to Render using `render.yaml`, and provide `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the final frontend URL in `CLIENT_ORIGIN`.
- Frontend: deploy `client` to Vercel and set `REACT_APP_API_URL` to the full Render API URL ending in `/api`.
- Domain: configure `www.manácorner.com` in the frontend host's domain settings and follow its DNS and HTTPS instructions.

Deployment cannot complete until the Supabase project migration, hosting accounts, environment variables, and domain DNS are configured. The SQL migration creates a new schema; it does not import data from the former MongoDB setup.
