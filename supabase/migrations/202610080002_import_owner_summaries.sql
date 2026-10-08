do $$
declare
  sujith_id uuid;
  kumar_id uuid;
  summary_date timestamptz := '2026-10-08T12:00:00Z';
begin
  select id into sujith_id
  from public.mc_users
  where lower(email) = 'sujeethkumar.com@gmail.com' and role = 'owner';

  select id into kumar_id
  from public.mc_users
  where lower(email) = 'jacob.snalli@gmail.com' and role = 'owner';

  if sujith_id is null or kumar_id is null then
    raise exception 'Could not resolve Sujith and Kumar owner accounts';
  end if;

  if not exists (
    select 1 from public.mc_expenses
    where owner_id = sujith_id
      and entry_type = 'investment'
      and description = 'Investment total through 2026-10-08'
  ) then
    insert into public.mc_expenses (
      description, category, amount, date, payment_method,
      created_by, owner_id, entry_type
    ) values (
      'Investment total through 2026-10-08', 'Other', 205191,
      summary_date, 'Cash', sujith_id, sujith_id, 'investment'
    );
  end if;

  if not exists (
    select 1 from public.mc_expenses
    where owner_id = kumar_id
      and entry_type = 'investment'
      and description = 'Investment total through 2026-10-08'
  ) then
    insert into public.mc_expenses (
      description, category, amount, date, payment_method,
      created_by, owner_id, entry_type
    ) values (
      'Investment total through 2026-10-08', 'Other', 122319,
      summary_date, 'Cash', kumar_id, kumar_id, 'investment'
    );
  end if;

  if not exists (
    select 1 from public.mc_expenses
    where owner_id = kumar_id
      and entry_type = 'expense'
      and description = 'Expense summary through 2026-10-08 (17 entries)'
  ) then
    insert into public.mc_expenses (
      description, category, amount, date, payment_method,
      created_by, owner_id, entry_type
    ) values (
      'Expense summary through 2026-10-08 (17 entries)', 'Other', 18453,
      summary_date, 'Cash', kumar_id, kumar_id, 'expense'
    );
  end if;
end;
$$;