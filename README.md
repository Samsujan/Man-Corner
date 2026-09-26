# Maná Corner — Something to Eat

Cafe management for billing, Indian GST, expenses and receipt storage, profit and loss, cost recommendations, expense forecasts, budget planning, and three-owner profit sharing.

## Stack

- React 18, Redux, and Material UI frontend
- Node.js 20+ and Express API
- Supabase Postgres and private Supabase Storage bucket
- bcrypt password hashing and signed JWT sessions

## Local setup

1. Create a Supabase project and run [`supabase/migrations/202609260001_mana_corner.sql`](./supabase/migrations/202609260001_mana_corner.sql) in its SQL Editor.
2. Copy `.env.example` to `.env`. Fill in `SUPABASE_URL`, the server-only `SUPABASE_SERVICE_ROLE_KEY`, and generate distinct random values of at least 32 characters for `JWT_SECRET` and `OWNER_SETUP_KEY`.
3. Set `CLIENT_ORIGIN=http://localhost:3000`.
4. Install and run:

   ```powershell
   npm install
   Set-Location client
   npm install
   npm start
   ```

   In another terminal at the project root, run `npm run server`.
5. Create the first owner account from Sign Up by entering the `OWNER_SETUP_KEY`. Subsequent sign-ups are billing-only guests; owners can promote accounts in the user management API.

See [QUICKSTART.md](./QUICKSTART.md) for local setup and [SETUP_INSTALLATION.md](./SETUP_INSTALLATION.md) for hosting.

## Production hosting

Deploy the API using the included [`render.yaml`](./render.yaml), then deploy the `client` directory to Vercel with `REACT_APP_API_URL=https://<your-api-host>/api`. Set the API's `CLIENT_ORIGIN` to the final HTTPS frontend origin. Point `www.manácorner.com` to the frontend host and enable HTTPS there.

Keep the Supabase service-role key and setup key only in backend environment variables. Never expose them in frontend settings or commit `.env`.
