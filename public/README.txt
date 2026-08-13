# Lil Things Club Product Manager

This package adds a Supabase-backed product manager to the existing static site.

## Files

- `supabase-setup.sql` — database, RLS policies, admin table, and permissions.
- `js/supabase.js` — browser Supabase client.
- `admin/login.html` / `admin/login.js` — admin login.
- `admin/products.html` / `admin/products.js` / `admin/products.css` — product-entry and product-management screen.

## Setup

1. Run `supabase-setup.sql` in Supabase SQL Editor.
2. In Supabase Authentication > Users, create your admin email/password account.
3. Copy that user's UUID.
4. At the bottom of `supabase-setup.sql`, uncomment and run:
   `insert into public.admin_users (user_id) values ('YOUR-AUTH-USER-UUID') on conflict (user_id) do nothing;`
5. In Supabase Storage, create a PUBLIC bucket named `product-images`.
6. Add Storage policies so the public can SELECT objects and your authenticated admin can INSERT/UPDATE/DELETE.
7. Put the `admin` and `js` folders into `public/`.
8. Visit `/admin/login.html`.

## Important

The current product-list page and product-page code still need to be switched from `PRODUCTS_LIST` / `PRODUCTS` to Supabase. The manager is deliberately separate so your existing shop is not broken while you test the database.

The current `products-objects.js` can be migrated after the database connection is confirmed.

## Image storage

The manager uploads selected images to Supabase Storage under:

`products/<slug>/...`

It stores the resulting public URLs in the product's `images` array.
