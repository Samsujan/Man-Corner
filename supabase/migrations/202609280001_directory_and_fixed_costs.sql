-- Adds a shared Contacts Directory (suppliers/staff/customers/other) usable
-- by both owner and guest (billing) accounts, and a Fixed Monthly Costs
-- table (salary, rent, power, wifi, water, ...) whose amount owners can
-- update; updating the amount automatically logs/updates the current
-- month's expense entry so it flows straight into Expenses & P&L.

create table if not exists public.mc_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  type text not null check (type in ('Supplier', 'Staff', 'Customer', 'Other')),
  phone text,
  email text,
  notes text,
  created_by uuid references public.mc_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mc_contacts enable row level security;

create table if not exists public.mc_fixed_costs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  category text not null,
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mc_fixed_costs enable row level security;

-- Link auto-generated expense rows back to their fixed cost + billing month
-- so re-saving an amount updates that month's entry instead of duplicating it.
alter table public.mc_expenses add column if not exists fixed_cost_id uuid references public.mc_fixed_costs(id) on delete set null;
alter table public.mc_expenses add column if not exists cost_month date;

create unique index if not exists mc_expenses_fixed_cost_month_idx
  on public.mc_expenses (fixed_cost_id, cost_month)
  where fixed_cost_id is not null;

insert into public.mc_fixed_costs (name, category, amount) values
  ('Employee Salary', 'Salaries', 0),
  ('Rent', 'Rent', 0),
  ('Power Bill', 'Utilities', 0),
  ('Wifi Bill', 'Utilities', 0),
  ('Water Bill', 'Utilities', 0)
on conflict (name) do nothing;
