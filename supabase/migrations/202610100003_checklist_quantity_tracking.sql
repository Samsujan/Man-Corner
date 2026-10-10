alter table public.mc_checklist_checks
  add column if not exists quantity numeric(12, 3),
  add column if not exists quantity_unit text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mc_checklist_checks_quantity_nonnegative'
      and conrelid = 'public.mc_checklist_checks'::regclass
  ) then
    alter table public.mc_checklist_checks
      add constraint mc_checklist_checks_quantity_nonnegative
      check (quantity is null or quantity >= 0);
  end if;
end;
$$;alter table public.mc_checklist_checks
  add column if not exists quantity numeric(12, 3),
  add column if not exists quantity_unit text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mc_checklist_checks_quantity_nonnegative'
      and conrelid = 'public.mc_checklist_checks'::regclass
  ) then
    alter table public.mc_checklist_checks
      add constraint mc_checklist_checks_quantity_nonnegative
      check (quantity is null or quantity >= 0);
  end if;
end;
$$;