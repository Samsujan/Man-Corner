# Maná Corner — Implementation Status

The React cafe management UI and Express API are configured for Supabase Postgres and private Supabase Storage. The system includes billing with server-side GST calculation, expenses and receipts, owner-only analytics, forecasts, budget estimates, cost suggestions, and equal profit-share calculations.

## Readiness

**Code/configuration prepared; external deployment still required.** This project has not been deployed and is not yet reachable at `www.manácorner.com`.

Before launch:

1. Run `supabase/migrations/202609260001_mana_corner.sql` in the Supabase project.
2. Set the backend Supabase service-role credentials, a unique `JWT_SECRET`, an `OWNER_SETUP_KEY`, and the frontend origin.
3. Deploy the API to Render and the `client` app to Vercel.
4. Configure domain DNS/HTTPS, bootstrap the first owner, and verify production billing and receipt uploads.

See [SETUP_INSTALLATION.md](./SETUP_INSTALLATION.md) for exact steps and [FEATURE_CHECKLIST.md](./FEATURE_CHECKLIST.md) for remaining launch verification.
