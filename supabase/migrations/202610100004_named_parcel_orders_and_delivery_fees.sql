alter table public.mc_bills
  add column if not exists order_type text not null default 'walk-in',
  add column if not exists customer_name text;

update public.mc_bills
set order_type = 'table'
where table_number is not null and order_type = 'walk-in';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mc_bills_order_type_check'
      and conrelid = 'public.mc_bills'::regclass
  ) then
    alter table public.mc_bills
      add constraint mc_bills_order_type_check
      check (order_type in ('walk-in', 'table', 'parcel'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'mc_bills_parcel_customer_name_check'
      and conrelid = 'public.mc_bills'::regclass
  ) then
    alter table public.mc_bills
      add constraint mc_bills_parcel_customer_name_check
      check (order_type <> 'parcel' or (customer_name is not null and length(trim(customer_name)) > 0));
  end if;
end;
$$;

create index if not exists mc_bills_pending_order_type_idx
  on public.mc_bills(order_type, created_at)
  where status = 'Pending';
