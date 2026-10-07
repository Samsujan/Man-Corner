alter table public.mc_expenses
  add column if not exists owner_id uuid references public.mc_users(id) on delete set null;

update public.mc_expenses
set owner_id = created_by
where owner_id is null and created_by is not null;

create index if not exists mc_expenses_owner_id_idx on public.mc_expenses(owner_id);