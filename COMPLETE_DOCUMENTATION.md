# Maná Corner — Technical Documentation

**Tagline:** Something to Eat

## System overview

- React frontend communicates with an Express REST API.
- Express accesses Supabase Postgres and Storage using a server-only service-role key.
- User passwords are bcrypt-hashed. JWTs are verified and the current database role is loaded for each protected API request.
- Tables have the `mc_` prefix and row-level security is enabled without public access policies.
- Expense receipts are private; API responses contain one-hour signed URLs for authorized owners.

For credentials, setup, and hosting, see [SETUP_INSTALLATION.md](./SETUP_INSTALLATION.md).

## Database schema

The migration is [`supabase/migrations/202609260001_mana_corner.sql`](./supabase/migrations/202609260001_mana_corner.sql).

| Table | Purpose |
|---|---|
| `mc_users` | Email, name, bcrypt hash, role, and permissions |
| `mc_menu_items` | Menu, price, GST rate, active status |
| `mc_bills` | Bill header, item/pricing snapshot, GST, payment, creator |
| `mc_expenses` | Date-wise expense, category, payment, receipt storage path |
| `mc_profit_shares` | Reserved for future persisted monthly settlement data; current shares are calculated live |

Storage uses the private `mana-corner-receipts` bucket. The initial owner is created via the server-only `mc_create_initial_owner` SQL function after validation of `OWNER_SETUP_KEY`; owners may promote other accounts. A database trigger enforces a maximum of three owners, two guests, and one remaining owner.

## API reference

All paths are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | Checks API and database readiness |
| `POST` | `/auth/register` | Public | Creates a guest account; with the setup-key header, bootstraps the first owner |
| `POST` | `/auth/login` | Public | Authenticates and returns a JWT |
| `GET` | `/menu` | Public | Lists active menu items |
| `POST` | `/menu` | Owner | Creates a menu item |
| `PUT` | `/menu/:id` | Owner | Updates a menu item |
| `DELETE` | `/menu/:id` | Owner | Deactivates a menu item |
| `POST` | `/billing` | Authenticated | Creates a bill using current menu prices and GST |
| `GET` | `/billing` | Authenticated | Lists bills; accepts `startDate` and `endDate` |
| `GET` | `/billing/:id` | Authenticated | Gets one bill |
| `POST` | `/expenses` | Owner | Creates an expense; multipart file field `billScreenshot` is optional |
| `GET` | `/expenses` | Owner | Lists expenses; supports date and category filters |
| `GET` | `/expenses/:id` | Owner | Gets one expense and a signed receipt URL |
| `GET` | `/analytics/revenue` | Owner | Gross/net sales and GST summary |
| `GET` | `/analytics/expenses-summary` | Owner | Expense totals and category breakdown |
| `GET` | `/analytics/profit-loss` | Owner | Net revenue less recorded expenses |
| `GET` | `/analytics/recommendations` | Owner | Rule-based spend suggestions |
| `GET` | `/analytics/forecast` | Owner | Expense trend and monthly projection |
| `GET` | `/analytics/budget-plan` | Owner | Recent spend, 20% buffer, and quarterly projection |
| `GET` | `/analytics/profit-share/:month` | Owner | Equal three-owner profit shares for `YYYY-MM` |
| `GET` | `/users` | Owner | Lists accounts without password hashes |
| `PUT` | `/users/:id` | Owner | Updates account details or role |
| `DELETE` | `/users/:id` | Owner | Deletes an account, preserving financial rows |

The `x-owner-setup-key` header is used only for the initial owner registration. Never place that key or the Supabase service-role key in frontend build variables.

## Business calculation notes

- GST is calculated per bill line from the active menu item rate, rounded to paise; rates supported are 5%, 12%, 18%, and 28%.
- P&L and owner shares exclude collected GST from operating revenue.
- Profit sharing is currently an equal split among three owners. It is a calculation, not a tax/accounting filing.
- Forecast and cost-saving recommendations use simple rules over recorded expense history; they are estimates, not an external AI service or guarantee.
- The monthly forecast requires expense history to become meaningful.
