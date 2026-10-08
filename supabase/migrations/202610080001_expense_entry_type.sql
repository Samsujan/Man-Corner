alter table public.mc_expenses
  add column if not exists entry_type text;

update public.mc_expenses
set entry_type = case
  when date < '2026-10-03T00:00:00Z'::timestamptz then 'investment'
  else 'expense'
end
where entry_type is null;

alter table public.mc_expenses
  alter column entry_type set default 'expense',
  alter column entry_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mc_expenses_entry_type_check'
      and conrelid = 'public.mc_expenses'::regclass
  ) then
    alter table public.mc_expenses
      add constraint mc_expenses_entry_type_check
      check (entry_type in ('investment', 'expense'));
  end if;
end;
$$;

create index if not exists mc_expenses_entry_type_date_idx
  on public.mc_expenses(entry_type, date desc);