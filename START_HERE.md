# Maná Corner — Start Here

**Maná Corner · Something to Eat**

The application code now uses Supabase Postgres and private Supabase Storage. Hosting is not live yet: the Supabase migration, hosting environment variables, and domain DNS must be configured by the project owner.

## Setup

1. Start with [SETUP_INSTALLATION.md](./SETUP_INSTALLATION.md) to create the Supabase schema and configure local secrets.
2. Follow [QUICKSTART.md](./QUICKSTART.md) to run the app and create the first owner.
3. Use [COMPLETE_DOCUMENTATION.md](./COMPLETE_DOCUMENTATION.md) for API and data-schema details.
4. See [FEATURE_CHECKLIST.md](./FEATURE_CHECKLIST.md) for implementation and launch readiness.

## Required production setup

- Run `supabase/migrations/202609260001_mana_corner.sql` in the Supabase SQL Editor.
- Configure the Render API with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `OWNER_SETUP_KEY`, and the deployed frontend's `CLIENT_ORIGIN`.
- Deploy the `client` directory to Vercel with `REACT_APP_API_URL` pointing to the Render API.
- Configure `www.manácorner.com` DNS and HTTPS through the frontend host.

Do not send secrets through chat or place them in frontend environment variables. Keep the Supabase service-role key and owner setup key server-side only.
