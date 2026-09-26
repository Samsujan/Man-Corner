create extension if not exists pgcrypto;

create table if not exists public.mc_users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  email text not null unique,
  password_hash text not null,
  role text not null default 'guest' check (role in ('owner', 'guest')),
  permissions jsonb not null default '{"billing": true, "expenses": false, "analytics": false, "users": false, "profitShare": false}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.mc_enforce_user_limits()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  role_count integer;
begin
  perform pg_advisory_xact_lock(863942032463);

  if tg_op = 'DELETE' then
    if old.role = 'owner' then
      select count(*) into role_count
      from public.mc_users
      where role = 'owner' and id <> old.id;
      if role_count = 0 then
        raise exception 'at least one owner account must remain';
      end if;
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if new.role = old.role then
      return new;
    end if;
    if old.role = 'owner' and new.role <> 'owner' then
      select count(*) into role_count
      from public.mc_users
      where role = 'owner' and id <> old.id;
      if role_count = 0 then
        raise exception 'at least one owner account must remain';
      end if;
    end if;
  end if;

  select count(*) into role_count
  from public.mc_users
  where role = new.role and id <> new.id;

  if new.role = 'owner' and role_count >= 3 then
    raise exception 'at most three owner accounts are allowed';
  end if;
  if new.role = 'guest' and role_count >= 2 then
    raise exception 'at most two billing guest accounts are allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists mc_users_enforce_limits on public.mc_users;
create trigger mc_users_enforce_limits
before insert or update or delete on public.mc_users
for each row execute function public.mc_enforce_user_limits();

create table if not exists public.mc_menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  category text not null check (category in ('Coffee', 'Tea', 'Snacks', 'Pastries', 'Beverages', 'Desserts')),
  price numeric(10, 2) not null check (price >= 0),
  gst_rate numeric(5, 2) not null default 5 check (gst_rate in (5, 12, 18, 28)),
  description text,
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mc_bills (
  id uuid primary key default gen_random_uuid(),
  bill_number text not null unique,
  created_by uuid references public.mc_users(id) on delete set null,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  total_gst numeric(12, 2) not null check (total_gst >= 0),
  total numeric(12, 2) not null check (total >= 0),
  payment_method text not null default 'Cash' check (payment_method in ('Cash', 'Card', 'UPI', 'Online')),
  status text not null default 'Completed' check (status in ('Pending', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.mc_expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null check (length(trim(description)) > 0),
  category text not null check (category in ('Inventory', 'Utilities', 'Rent', 'Salaries', 'Maintenance', 'Marketing', 'Other')),
  amount numeric(12, 2) not null check (amount > 0),
  date timestamptz not null,
  payment_method text not null default 'Cash' check (payment_method in ('Cash', 'Card', 'UPI', 'Online')),
  bill_screenshot text,
  created_by uuid references public.mc_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.mc_profit_shares (
  id uuid primary key default gen_random_uuid(),
  month text not null unique check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  total_profit numeric(12, 2) not null,
  owner_shares jsonb not null,
  settled boolean not null default false,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mc_bills_created_at_idx on public.mc_bills(created_at desc);
create index if not exists mc_expenses_date_idx on public.mc_expenses(date desc);
create index if not exists mc_expenses_category_idx on public.mc_expenses(category);
create index if not exists mc_menu_items_active_idx on public.mc_menu_items(active);

alter table public.mc_users enable row level security;
alter table public.mc_menu_items enable row level security;
alter table public.mc_bills enable row level security;
alter table public.mc_expenses enable row level security;
alter table public.mc_profit_shares enable row level security;

create or replace function public.mc_create_initial_owner(
  p_name text,
  p_email text,
  p_password_hash text
)
returns setof public.mc_users
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(863942032462);

  if exists (select 1 from public.mc_users where role = 'owner') then
    raise exception 'initial owner already exists';
  end if;

  return query
  insert into public.mc_users (name, email, password_hash, role, permissions)
  values (
    trim(p_name),
    lower(trim(p_email)),
    p_password_hash,
    'owner',
    '{"billing": true, "expenses": true, "analytics": true, "users": true, "profitShare": true}'::jsonb
  )
  returning *;
end;
$$;

revoke all on function public.mc_create_initial_owner(text, text, text) from public, anon, authenticated;
grant execute on function public.mc_create_initial_owner(text, text, text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mana-corner-receipts',
  'mana-corner-receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
