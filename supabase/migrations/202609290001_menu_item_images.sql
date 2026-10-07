-- Private storage for menu item photos. The API signs image URLs and only
-- owner-authenticated menu endpoints can upload or replace photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mana-corner-menu-images',
  'mana-corner-menu-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
