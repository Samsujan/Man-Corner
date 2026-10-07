# Maná Corner — Project Summary

**Brand:** Maná Corner
**Tagline:** Something to Eat
**Domain:** www.manácorner.com

## Application features

- Billing from the active menu with server-calculated GST, bill numbering, and payment methods.
- Date-wise expenses with optional receipt/payment screenshots stored in a private Supabase Storage bucket.
- Revenue, expenses, profit/loss, expense trends, cost suggestions, budget projections, and equal three-way profit-share reports.
- Owner and billing-only guest roles.

## Architecture

- Frontend: React 18, Redux, Material UI, Axios
- API: Node.js 20+, Express, bcryptjs, JWT
- Data: Supabase Postgres via server-side `@supabase/supabase-js`
- Receipts: private Supabase Storage with short-lived signed links
- Hosting configuration: Render API blueprint (`render.yaml`), Vercel frontend, custom domain configured through DNS

All cafe tables use the `mc_` prefix. The migration enables row-level security and only the backend uses the service-role key. Passwords are hashed before storage; current account roles are checked on authenticated requests.

## Current launch status

The application and hosting configuration are prepared, but the service is **not yet live**. The owner must run the SQL migration in Supabase, configure secrets in Render/Vercel, deploy both services, and point the domain DNS to the frontend host. This workspace cannot access those external dashboards or DNS.

The new Supabase schema does not import data from the former MongoDB development setup.

## Guides

- [Local and cloud setup](./SETUP_INSTALLATION.md)
- [Quick start](./QUICKSTART.md)
- [API and schema reference](./COMPLETE_DOCUMENTATION.md)
- [Launch checklist](./FEATURE_CHECKLIST.md)
