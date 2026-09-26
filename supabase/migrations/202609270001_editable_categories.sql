-- Makes menu categories owner-editable instead of a fixed list, and seeds the
-- cafe's real meal-time categories and starter menu (Breakfast, Lunch,
-- Weekend Biryani, Evening Snacks, Tea & Coffee served all day).

alter table public.mc_menu_items drop constraint if exists mc_menu_items_category_check;
alter table public.mc_menu_items
  add constraint mc_menu_items_category_check check (length(trim(category)) > 0);

create table if not exists public.mc_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.mc_categories enable row level security;

insert into public.mc_categories (name, sort_order) values
  ('Breakfast', 1),
  ('Lunch', 2),
  ('Weekend Biryani', 3),
  ('Evening Snacks', 4),
  ('Tea & Coffee', 5)
on conflict (name) do nothing;

insert into public.mc_menu_items (name, category, price, gst_rate, description)
select v.name, v.category, v.price, v.gst_rate, v.description
from (
  values
    ('Idly (2 pcs)', 'Breakfast', 40::numeric, 5::numeric, 'Steamed rice cakes served with sambar & chutney'),
    ('Masala Dosa', 'Breakfast', 60::numeric, 5::numeric, 'Crispy dosa with spiced potato filling'),
    ('Plain Dosa', 'Breakfast', 50::numeric, 5::numeric, 'Classic crispy rice crepe'),
    ('Poori Masala', 'Breakfast', 55::numeric, 5::numeric, 'Fluffy poori with potato masala'),
    ('Pongal', 'Breakfast', 45::numeric, 5::numeric, 'Rice and lentil porridge tempered with ghee & pepper'),
    ('Veg Meals', 'Lunch', 90::numeric, 5::numeric, 'Rice, sambar, rasam, curries & curd'),
    ('Curd Rice', 'Lunch', 50::numeric, 5::numeric, 'Comforting rice tempered with curd'),
    ('Sambar Rice', 'Lunch', 60::numeric, 5::numeric, 'Rice mixed with sambar & ghee'),
    ('Lemon Rice', 'Lunch', 50::numeric, 5::numeric, 'Tangy rice tempered with lemon & spices'),
    ('Veg Biryani', 'Weekend Biryani', 120::numeric, 5::numeric, 'Weekend special, served Saturday & Sunday'),
    ('Chicken Biryani', 'Weekend Biryani', 180::numeric, 5::numeric, 'Weekend special, served Saturday & Sunday'),
    ('Veg Fried Rice', 'Evening Snacks', 90::numeric, 5::numeric, 'Wok-tossed rice with vegetables'),
    ('Veg Noodles', 'Evening Snacks', 90::numeric, 5::numeric, 'Stir-fried noodles with vegetables'),
    ('Veg Sandwich', 'Evening Snacks', 70::numeric, 5::numeric, 'Grilled sandwich with chutney'),
    ('Butter Toast', 'Evening Snacks', 40::numeric, 5::numeric, 'Toasted bread with butter'),
    ('Chocolate Milkshake', 'Evening Snacks', 80::numeric, 12::numeric, 'Chilled chocolate milkshake'),
    ('Filter Coffee', 'Tea & Coffee', 20::numeric, 5::numeric, 'Served all day'),
    ('Tea', 'Tea & Coffee', 15::numeric, 5::numeric, 'Served all day')
) as v(name, category, price, gst_rate, description)
where not exists (
  select 1 from public.mc_menu_items m where m.name = v.name
);
