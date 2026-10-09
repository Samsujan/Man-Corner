alter table public.mc_bills
  add column if not exists table_number integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mc_bills_table_number_range'
      and conrelid = 'public.mc_bills'::regclass
  ) then
    alter table public.mc_bills
      add constraint mc_bills_table_number_range
      check (table_number is null or table_number between 1 and 10);
  end if;
end;
$$;

create unique index if not exists mc_bills_one_pending_order_per_table_idx
  on public.mc_bills(table_number)
  where status = 'Pending' and table_number is not null;