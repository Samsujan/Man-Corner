# Maná Corner — Feature and Launch Checklist

## Application

- [x] Cafe branding: Maná Corner — Something to Eat
- [x] Menu-based billing with server-side GST calculation and bill history
- [x] Date-wise expense entry and optional receipt/payment screenshot uploads
- [x] Revenue, expense, and profit/loss analytics
- [x] Expense trends, budget estimates, and rule-based cost suggestions
- [x] Equal profit-share calculation across three owners
- [x] Billing-only guest role and owner-only financial/admin endpoints
- [x] Current database role lookup on protected requests
- [x] Supabase SQL migration, RLS, private receipts bucket, and storage URLs
- [x] Render API blueprint and Vercel deployment instructions

## External launch steps (not completed from this workspace)

- [ ] Create/choose a Supabase project and run the SQL migration.
- [ ] Set real backend-only Supabase credentials and distinct random JWT/setup secrets in Render.
- [ ] Deploy the API and confirm `/api/health` reports `{"status":"ok"}`.
- [ ] Deploy the `client` directory to Vercel with `REACT_APP_API_URL` set to the API base URL ending in `/api`.
- [ ] Set Render `CLIENT_ORIGIN` to the exact deployed frontend origin.
- [ ] Add `www.manácorner.com` and configure the host-provided DNS records and HTTPS.
- [ ] Create the first owner with `OWNER_SETUP_KEY`, then create/promote the other two owner accounts and verify the guest accounts.
- [ ] Test a bill, GST totals, receipt upload, owner-only pages, and production CORS.

The database migration creates a clean Supabase schema. It does not import any old MongoDB development data. The application is not live until the external setup steps are complete.
