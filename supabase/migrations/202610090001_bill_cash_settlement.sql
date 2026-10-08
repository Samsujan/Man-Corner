alter table public.mc_bills
  add column if not exists cash_received numeric(12, 2),
  add column if not exists change_due numeric(12, 2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mc_bills_cash_settlement_nonnegative'
      and conrelid = 'public.mc_bills'::regclass
  ) then
    alter table public.mc_bills
      add constraint mc_bills_cash_settlement_nonnegative
      check (
        (cash_received is null or cash_received >= 0)
        and (change_due is null or change_due >= 0)
      );
  end if;
end;
$$;