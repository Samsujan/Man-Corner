alter table public.mc_bills
  add column if not exists token_date date,
  add column if not exists token_number integer;

with numbered_bills as (
  select
    id,
    (created_at at time zone 'Asia/Kolkata')::date as token_date,
    row_number() over (
      partition by (created_at at time zone 'Asia/Kolkata')::date
      order by created_at, id
    )::integer as token_number
  from public.mc_bills
)
update public.mc_bills as bills
set token_date = numbered_bills.token_date,
    token_number = numbered_bills.token_number
from numbered_bills
where bills.id = numbered_bills.id;

create table if not exists public.mc_daily_token_sequences (
  token_date date primary key,
  last_number integer not null check (last_number > 0)
);

insert into public.mc_daily_token_sequences (token_date, last_number)
select token_date, max(token_number)
from public.mc_bills
where token_date is not null
group by token_date
on conflict (token_date) do update
set last_number = greatest(
  public.mc_daily_token_sequences.last_number,
  excluded.last_number
);

create unique index if not exists mc_bills_token_date_number_unique
  on public.mc_bills (token_date, token_number);

alter table public.mc_daily_token_sequences enable row level security;
revoke all on public.mc_daily_token_sequences from anon, authenticated;

create or replace function public.mc_assign_daily_bill_token()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.created_at is null then
    new.created_at := now();
  end if;

  new.token_date := (new.created_at at time zone 'Asia/Kolkata')::date;

  insert into public.mc_daily_token_sequences as sequences (token_date, last_number)
  values (new.token_date, 1)
  on conflict (token_date) do update
    set last_number = sequences.last_number + 1
  returning last_number into new.token_number;

  return new;
end;
$$;

drop trigger if exists mc_bills_assign_daily_token on public.mc_bills;
create trigger mc_bills_assign_daily_token
before insert on public.mc_bills
for each row
execute function public.mc_assign_daily_bill_token();
