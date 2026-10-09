alter table public.mc_checklist_tasks
  add column if not exists notes text;

update public.mc_checklist_tasks
set title = 'Eggs',
    category = 'Inventory · Protein',
    notes = 'Menu use: Egg Dosa, Maggi, noodles, fried rice, egg sandwich, egg toast, Chilly Egg, Egg 65.'
where cadence = 'daily' and title = 'Check eggs stock and freshness';

update public.mc_checklist_tasks
set title = 'Chicken',
    category = 'Inventory · Protein',
    notes = 'Menu use: Chicken Biryani, chicken Maggi/noodles/fried rice, chicken sandwich, Dragon Chicken, Chicken 555, Chicken Manchuria, Chicken 65, Dosa Chicken, Poori Chicken.'
where cadence = 'daily' and title = 'Check chicken stock, temperature, and freshness';

update public.mc_checklist_tasks
set title = 'Vegetables and leafy greens',
    category = 'Inventory · Produce',
    notes = 'Menu use: Vangi Bath, Gongura Rice, noodles, fried rice, sandwiches, starters, Maggi, chutneys.'
where cadence = 'daily' and title = 'Check vegetables and leafy greens';

update public.mc_checklist_tasks
set title = 'Rice',
    category = 'Inventory · Staples',
    notes = 'Menu use: Vangi Bath, Bisi Bele Bath, Pulihora, Gongura Rice, biryani, Bagara Rice, fried rice.'
where cadence = 'daily' and title = 'Check rice, groceries, and pantry staples';

update public.mc_checklist_tasks
set title = 'Milk and curd',
    category = 'Inventory · Dairy',
    notes = 'Menu use: Tea, coffee, milkshakes, curd-based sides and preparations.'
where cadence = 'daily' and title = 'Check milk, curd, and other dairy';

update public.mc_checklist_tasks
set title = 'Paneer',
    category = 'Inventory · Dairy and protein',
    notes = 'Menu use: Chilli Paneer, Dragon Paneer, Kung Pao Paneer, Paneer Sandwich.'
where cadence = 'daily' and title = 'Check paneer stock and freshness';

update public.mc_checklist_tasks
set title = 'Dosa and idli batter',
    category = 'Inventory · Breakfast',
    notes = 'Menu use: Village Dosa, Erra Karam Dosa, Egg Dosa, Masala Dosa, Benne Dosa, Idli, Podi Idli.'
where cadence = 'daily' and title = 'Check dosa and idli batter';

update public.mc_checklist_tasks
set title = 'Bread',
    category = 'Inventory · Bakery',
    notes = 'Menu use: Egg, Paneer, Chicken, Avocado, Healthy, Cheese Aloo, Mumbai Style, Cheese Chilli, Corn and High Protein Sandwiches; toast items.'
where cadence = 'daily' and title = 'Check bread, buns, and sandwich fillings';

update public.mc_checklist_tasks
set title = 'Potatoes',
    category = 'Inventory · Produce',
    notes = 'Menu use: Poori, fries, Aloo Toast, Cheese Aloo Sandwich, Vangi Bath and mixed vegetables.'
where cadence = 'daily' and title = 'Check potatoes, onions, and basic produce';

update public.mc_checklist_tasks
set title = 'Tea, coffee, sugar and milkshake bases',
    category = 'Inventory · Beverages',
    notes = 'Menu use: Tea, coffee, Vanilla, Chocolate, Strawberry, Mango and Avocado Milkshakes.'
where cadence = 'daily' and title = 'Check coffee, tea, sugar, and milkshake supplies';

update public.mc_checklist_tasks
set title = 'Maggi and noodles',
    category = 'Inventory · Staples',
    notes = 'Menu use: Veg, Egg, Double Egg, Chicken, White Sauce, Cheese, Fried and specialty Maggi; all noodle dishes.'
where cadence = 'daily' and title = 'Check Maggi, noodles, and pasta supplies';

update public.mc_checklist_tasks
set title = 'Cooking oil, ghee and butter',
    category = 'Inventory · Cooking essentials',
    notes = 'Menu use: Dosa, Benne Dosa, Pongal, Poori, fries, fried rice, noodles and starters.'
where cadence = 'daily' and title = 'Check cooking oil, ghee, and butter';

update public.mc_checklist_tasks
set title = 'Sauces, chutneys and spice mixes',
    category = 'Inventory · Seasoning',
    notes = 'Menu use: Dosa and idli sides, Maggi, noodles, fried rice, biryani, Pulihora and starters.'
where cadence = 'daily' and title = 'Check sauces, chutneys, spices, and condiments';

insert into public.mc_checklist_tasks (title, category, cadence, sort_order, notes) values
  ('Corn flour', 'Inventory · Staples', 'daily', 30, 'Menu use: Chilli/Dragon/Kung Pao Paneer, Dragon Chicken, Chicken 555, Manchuria and Chicken 65; confirm against your recipes.'),
  ('Maida / all-purpose flour', 'Inventory · Staples', 'daily', 31, 'Menu use: Poori, toast/sandwich preparation and coated starters; confirm against your recipes.'),
  ('Urad dal', 'Inventory · Staples', 'daily', 32, 'Menu use: Dosa and idli batter.'),
  ('Toor dal', 'Inventory · Staples', 'daily', 33, 'Menu use: Bisi Bele Bath and sambar/chutney preparations.'),
  ('Chana dal', 'Inventory · Staples', 'daily', 34, 'Menu use: Bisi Bele Bath, chutneys, tempering and spice mixes.'),
  ('Moong dal', 'Inventory · Staples', 'daily', 35, 'Menu use: Pongal and breakfast preparations.'),
  ('Semolina / rava', 'Inventory · Staples', 'daily', 36, 'Menu use: Pongal and batter/preparation work where used.'),
  ('Poha', 'Inventory · Staples', 'daily', 37, 'Menu use: Rice and breakfast preparation where used.'),
  ('Peanuts', 'Inventory · Staples', 'daily', 38, 'Menu use: Pulihora, rice dishes and chutneys.'),
  ('Cashews', 'Inventory · Staples', 'daily', 39, 'Menu use: Biryani, Pongal and rich gravies where used.'),
  ('Corn kernels', 'Inventory · Produce', 'daily', 40, 'Menu use: Corn Sandwich, fried rice and noodles where used.'),
  ('Onions', 'Inventory · Produce', 'daily', 41, 'Menu use: Biryani, Bagara Rice, fried rice, noodles, sandwiches and starters.'),
  ('Garlic', 'Inventory · Produce', 'daily', 42, 'Menu use: Maggi, noodles, fried rice, biryani, sauces and starters.'),
  ('Ginger', 'Inventory · Produce', 'daily', 43, 'Menu use: Ginger Tea, biryani, rice dishes, sauces and starters.'),
  ('Tomatoes', 'Inventory · Produce', 'daily', 44, 'Menu use: Rice dishes, sauces, sandwiches and starters.'),
  ('Green chillies', 'Inventory · Produce', 'daily', 45, 'Menu use: Erra Karam Dosa, Pulihora, noodles, fried rice, chutneys and starters.'),
  ('Capsicum / bell peppers', 'Inventory · Produce', 'daily', 46, 'Menu use: Fried rice, noodles, sandwiches and paneer/chicken starters.'),
  ('Brinjal / vangi', 'Inventory · Produce', 'daily', 47, 'Menu use: Vangi Bath and vegetable preparations.'),
  ('Gongura leaves', 'Inventory · Produce', 'daily', 48, 'Menu use: Gongura Rice and related preparations.'),
  ('Curry leaves', 'Inventory · Produce', 'daily', 49, 'Menu use: Rice dishes, chutneys, tempering and breakfast items.'),
  ('Coriander and mint', 'Inventory · Produce', 'daily', 50, 'Menu use: Biryani, chutneys, rice dishes and starters.'),
  ('Lemons', 'Inventory · Produce', 'daily', 51, 'Menu use: Pulihora, garnishes, drinks and seasoning.'),
  ('Tamarind', 'Inventory · Produce', 'daily', 52, 'Menu use: Chinta Pandu Pulihora, chutneys and rice preparations.'),
  ('Avocado', 'Inventory · Produce', 'daily', 53, 'Menu use: Avocado Sandwich and Avocado Milkshake.'),
  ('Mango and strawberry fruit/pulp', 'Inventory · Produce', 'daily', 54, 'Menu use: Mango and Strawberry Milkshakes.'),
  ('Cheese', 'Inventory · Dairy', 'daily', 55, 'Menu use: Cheese Sandwiches, Cheese Maggi and Cheesy Fries.'),
  ('Mayonnaise', 'Inventory · Dairy and condiments', 'daily', 56, 'Menu use: Sandwiches and cold preparations where used.'),
  ('Soy sauce', 'Inventory · Seasoning', 'daily', 57, 'Menu use: Noodles, fried rice and Indo-Chinese starters.'),
  ('Vinegar', 'Inventory · Seasoning', 'daily', 58, 'Menu use: Noodles, fried rice, sauces and Indo-Chinese starters.'),
  ('Schezwan sauce', 'Inventory · Seasoning', 'daily', 59, 'Menu use: Schezwan Noodles and Fried Rice.'),
  ('Tomato ketchup and chilli sauce', 'Inventory · Seasoning', 'daily', 60, 'Menu use: Sandwiches, fries, Maggi, noodles and starters.'),
  ('Turmeric, chilli, coriander and cumin powders', 'Inventory · Seasoning', 'daily', 61, 'Menu use: Dosa, rice, biryani, noodles, fried rice and starters.'),
  ('Mustard and cumin seeds', 'Inventory · Seasoning', 'daily', 62, 'Menu use: Tempering for rice dishes, chutneys and breakfast.'),
  ('Biryani and garam masala', 'Inventory · Seasoning', 'daily', 63, 'Menu use: Chicken Biryani, Kobbari Anam and related rice dishes.'),
  ('Chocolate syrup/powder and vanilla base', 'Inventory · Beverages', 'daily', 64, 'Menu use: Chocolate and Vanilla Milkshakes; chocolate/vanilla toast where used.'),
  ('Ice cream', 'Inventory · Frozen', 'daily', 65, 'Menu use: Desserts and accompaniments where offered.'),
  ('Bottled water and cold drinks', 'Inventory · Beverages', 'daily', 66, 'Menu use: Water and cold drink sales.'),
  ('Takeaway boxes, cups, lids and bags', 'Inventory · Packaging', 'daily', 67, 'Menu use: All takeaway orders; monitor packaging stock separately.'),
  ('Weekly count: flour, corn flour, lentils and grains', 'Inventory · Weekly count', 'weekly', 30, 'Count Rice, Maida, Corn flour, Urad dal, Toor dal, Chana dal, Moong dal, Semolina, Poha, peanuts and cashews.'),
  ('Weekly count: proteins and dairy', 'Inventory · Weekly count', 'weekly', 31, 'Count Chicken, eggs, paneer, milk, curd, butter and cheese; review expiry and freezer dates.'),
  ('Weekly count: produce and herbs', 'Inventory · Weekly count', 'weekly', 32, 'Count Onions, garlic, ginger, tomatoes, chillies, capsicum, potatoes, brinjal, gongura, curry leaves, coriander, mint and lemons.'),
  ('Weekly count: sauces, spices and beverage supplies', 'Inventory · Weekly count', 'weekly', 33, 'Count cooking oil, sauces, spices, tea, coffee, sugar, milkshake bases, fruit pulp and ice cream.')
on conflict (cadence, title) do update
set category = excluded.category,
    sort_order = excluded.sort_order,
    notes = excluded.notes,
    active = true;