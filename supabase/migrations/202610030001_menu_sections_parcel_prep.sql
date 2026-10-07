insert into public.mc_categories (name, sort_order) values
  ('Morning', 1),
  ('Afternoon', 2),
  ('Evening Snacks', 3),
  ('Dinner', 4),
  ('All Day Items', 5)
on conflict (name) do update set sort_order = excluded.sort_order;

update public.mc_menu_items
set category = case
  when category in ('Morning Menu', 'Breakfast') then 'Morning'
  when category in ('Afternoon Menu', 'Lunch', 'Weekend Biryani') then 'Afternoon'
  when category like 'Evening - %' or category = 'Evening Snacks' then 'Evening Snacks'
  when category = 'Dinner Items' then 'Dinner'
  when category in ('All Day - Tea & Coffee', 'All Day - Milkshakes & More', 'Tea & Coffee') then 'All Day Items'
  else category
end
where category in (
  'Morning Menu', 'Breakfast', 'Afternoon Menu', 'Lunch', 'Weekend Biryani',
  'Evening Snacks', 'Dinner Items', 'All Day - Tea & Coffee',
  'All Day - Milkshakes & More', 'Tea & Coffee'
) or category like 'Evening - %';

update public.mc_menu_items
set active = false
where category not in ('Morning', 'Afternoon', 'Evening Snacks', 'Dinner', 'All Day Items')
  and active;

delete from public.mc_categories
where name not in ('Morning', 'Afternoon', 'Evening Snacks', 'Dinner', 'All Day Items');

update public.mc_menu_items
set price = 10, gst_rate = 5, active = true
where category = 'All Day Items' and name = 'Water';

insert into public.mc_menu_items (name, category, price, gst_rate, active)
select 'Water', 'All Day Items', 10, 5, true
where not exists (
  select 1 from public.mc_menu_items where category = 'All Day Items' and name = 'Water'
);

update public.mc_menu_items
set price = 20, gst_rate = 5, active = true
where category = 'All Day Items' and name = 'Cool Drinks';

insert into public.mc_menu_items (name, category, price, gst_rate, active)
select 'Cool Drinks', 'All Day Items', 20, 5, true
where not exists (
  select 1 from public.mc_menu_items where category = 'All Day Items' and name = 'Cool Drinks'
);