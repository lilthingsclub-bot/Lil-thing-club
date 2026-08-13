-- LIL THINGS CLUB — DATABASE SETUP
-- Run this in Supabase SQL Editor.
--
-- IMPORTANT:
-- 1. This creates the product tables.
-- 2. Create your admin user in Authentication > Users first.
-- 3. Copy that user's UUID into the INSERT near the bottom.
-- 4. Then run the whole script.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  brand text not null default 'Lil Things Club',
  description text not null default '',
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  images text[] not null default '{}',
  features text[] not null default '{}',
  active boolean not null default true,
  is_new boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  label text not null,
  price numeric(10,2) not null check (price >= 0),
  weight numeric(10,2),
  sort_order integer not null default 0
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx
  on public.product_variants(product_id);

create index if not exists products_active_idx
  on public.products(active);

-- Updated timestamp
create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;

create trigger products_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

-- Admin check
create or replace function public.is_lil_things_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

-- RLS
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.admin_users enable row level security;

-- Remove old policies if this script is run again
drop policy if exists "Public can view active products" on public.products;
drop policy if exists "Admins can view all products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

drop policy if exists "Public can view active variants" on public.product_variants;
drop policy if exists "Admins can view all variants" on public.product_variants;
drop policy if exists "Admins can insert variants" on public.product_variants;
drop policy if exists "Admins can update variants" on public.product_variants;
drop policy if exists "Admins can delete variants" on public.product_variants;

drop policy if exists "Admins can view admin list" on public.admin_users;

-- PUBLIC: customers can read only active products.
create policy "Public can view active products"
on public.products
for select
to anon, authenticated
using (active = true);

-- ADMIN: you can manage every product after login.
create policy "Admins can view all products"
on public.products
for select
to authenticated
using ((select public.is_lil_things_admin()));

create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check ((select public.is_lil_things_admin()));

create policy "Admins can update products"
on public.products
for update
to authenticated
using ((select public.is_lil_things_admin()))
with check ((select public.is_lil_things_admin()));

create policy "Admins can delete products"
on public.products
for delete
to authenticated
using ((select public.is_lil_things_admin()));

-- PUBLIC: customers can read variants only when the product is active.
create policy "Public can view active variants"
on public.product_variants
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_variants.product_id
      and p.active = true
  )
);

create policy "Admins can view all variants"
on public.product_variants
for select
to authenticated
using ((select public.is_lil_things_admin()));

create policy "Admins can insert variants"
on public.product_variants
for insert
to authenticated
with check ((select public.is_lil_things_admin()));

create policy "Admins can update variants"
on public.product_variants
for update
to authenticated
using ((select public.is_lil_things_admin()))
with check ((select public.is_lil_things_admin()));

create policy "Admins can delete variants"
on public.product_variants
for delete
to authenticated
using ((select public.is_lil_things_admin()));

-- Admins don't need to read this table from the browser, but the policy
-- allows the helper function to work without exposing the rows publicly.
create policy "Admins can view admin list"
on public.admin_users
for select
to authenticated
using ((select public.is_lil_things_admin()));

-- Permissions for Supabase Data API.
grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.products to authenticated;

grant select on public.product_variants to anon, authenticated;
grant select, insert, update, delete on public.product_variants to authenticated;

grant select on public.admin_users to authenticated;
grant execute on function public.is_lil_things_admin() to authenticated;

-- ============================================================
-- CREATE YOUR FIRST ADMIN
-- ============================================================
-- 1. In Authentication > Users, create your own email/password user.
-- 2. Copy the user's UUID.
-- 3. Replace YOUR-AUTH-USER-UUID below.
--
-- insert into public.admin_users (user_id)
-- values ('YOUR-AUTH-USER-UUID')
-- on conflict (user_id) do nothing;

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Create a bucket named: product-images
-- Make it PUBLIC in Storage.
--
-- Then add these Storage policies from the dashboard:
--   Public SELECT for product-images
--   Authenticated INSERT/UPDATE/DELETE only for your admin user.
--
-- The admin page uploads images into product-images/products/.
