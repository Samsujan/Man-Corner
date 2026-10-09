create table if not exists public.mc_checklist_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  category text not null default 'Miscellaneous',
  cadence text not null check (cadence in ('daily', 'weekly')),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_by uuid references public.mc_users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (cadence, title)
);

create index if not exists mc_checklist_tasks_active_cadence_idx
  on public.mc_checklist_tasks(cadence, active, sort_order);

create table if not exists public.mc_checklist_checks (
  task_id uuid not null references public.mc_checklist_tasks(id) on delete cascade,
  checklist_date date not null,
  completed boolean not null default false,
  completed_by uuid references public.mc_users(id) on delete set null,
  completed_at timestamptz,
  primary key (task_id, checklist_date)
);

create index if not exists mc_checklist_checks_date_idx
  on public.mc_checklist_checks(checklist_date);

alter table public.mc_checklist_tasks enable row level security;
alter table public.mc_checklist_checks enable row level security;

insert into public.mc_checklist_tasks (title, category, cadence, sort_order) values
  ('Check eggs stock and freshness', 'Ingredients', 'daily', 1),
  ('Check chicken stock, temperature, and freshness', 'Ingredients', 'daily', 2),
  ('Check vegetables and leafy greens', 'Ingredients', 'daily', 3),
  ('Check rice, groceries, and pantry staples', 'Ingredients', 'daily', 4),
  ('Check milk, curd, and other dairy', 'Ingredients', 'daily', 5),
  ('Check paneer stock and freshness', 'Ingredients', 'daily', 6),
  ('Check dosa and idli batter', 'Ingredients', 'daily', 7),
  ('Check bread, buns, and sandwich fillings', 'Ingredients', 'daily', 8),
  ('Check potatoes, onions, and basic produce', 'Ingredients', 'daily', 9),
  ('Check coffee, tea, sugar, and milkshake supplies', 'Ingredients', 'daily', 10),
  ('Check Maggi, noodles, and pasta supplies', 'Ingredients', 'daily', 11),
  ('Check cooking oil, ghee, and butter', 'Ingredients', 'daily', 12),
  ('Check sauces, chutneys, spices, and condiments', 'Ingredients', 'daily', 13),
  ('Check drinking water and beverages', 'Ingredients', 'daily', 14),
  ('Check ice cream and frozen items', 'Ingredients', 'daily', 15),
  ('Prepare daily vegetables, chutneys, and sauces', 'Preparation', 'daily', 16),
  ('Check food labels, dates, and first-in-first-out rotation', 'Food safety', 'daily', 17),
  ('Record refrigerator and freezer temperatures', 'Food safety', 'daily', 18),
  ('Sanitize counters, boards, knives, and food-contact surfaces', 'Cleaning', 'daily', 19),
  ('Clean cooking range, dosa plate, and fryer area', 'Cleaning', 'daily', 20),
  ('Check gas, water supply, and handwash stations', 'Safety', 'daily', 21),
  ('Restock takeaway boxes, cups, lids, tissues, and cutlery', 'Packaging', 'daily', 22),
  ('Check POS, receipt printer, and billing paper', 'Equipment', 'daily', 23),
  ('Count opening cash float and note it', 'Cash and admin', 'daily', 24),
  ('Record wastage, shortages, and urgent purchases', 'Cash and admin', 'daily', 25),
  ('Deep-clean refrigerator shelves and door seals', 'Weekly cleaning', 'weekly', 1),
  ('Deep-clean freezer and check frozen stock dates', 'Weekly stock', 'weekly', 2),
  ('Count eggs, chicken, vegetables, rice, dairy, and paneer', 'Weekly stock', 'weekly', 3),
  ('Count groceries, spices, oil, sauces, and dry goods', 'Weekly stock', 'weekly', 4),
  ('Count packaging, beverages, water, and cleaning supplies', 'Weekly stock', 'weekly', 5),
  ('Review expiry dates and remove spoiled or expired stock', 'Weekly food safety', 'weekly', 6),
  ('Prepare supplier reorder list and confirm deliveries', 'Purchasing', 'weekly', 7),
  ('Deep-clean exhaust hood, filters, and ventilation', 'Weekly cleaning', 'weekly', 8),
  ('Deep-clean fryer and review cooking-oil condition', 'Weekly cleaning', 'weekly', 9),
  ('Clean shelves, dry storage, and ingredient containers', 'Weekly cleaning', 'weekly', 10),
  ('Check gas hoses, regulators, and spare cylinders', 'Safety', 'weekly', 11),
  ('Check fire extinguisher access and first-aid supplies', 'Safety', 'weekly', 12),
  ('Clean and check water filter and dispenser', 'Equipment', 'weekly', 13),
  ('Inspect mixer, grinder, refrigerator, freezer, and printer', 'Equipment', 'weekly', 14),
  ('Review weekly sales, low-selling items, and food wastage', 'Cash and admin', 'weekly', 15),
  ('Reconcile supplier bills, purchases, and petty cash', 'Cash and admin', 'weekly', 16)
on conflict (cadence, title) do nothing;