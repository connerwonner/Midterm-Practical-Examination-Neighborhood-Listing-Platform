-- ===== TABLES =====
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','merchant','provider','client')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) >= 3),
  slug text not null unique check (slug ~* '^[a-z0-9-]+$'),
  active_status boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references profiles(id) on delete restrict,
  title text not null check (char_length(title) >= 5),
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0),
  duration_minutes integer not null check (duration_minutes >= 15),
  coverage_radius_miles integer not null check (coverage_radius_miles > 0),
  status text not null default 'draft' check (status in ('draft','pending','approved','suspended')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table service_category_mappings (
  service_id uuid references services(id) on delete cascade,
  category_id uuid references service_categories(id) on delete cascade,
  primary key (service_id, category_id)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  client_email text not null check (client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  requested_date date not null,
  notes text not null check (char_length(notes) >= 10),
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ===== RLS: default deny =====
alter table profiles enable row level security;
alter table service_categories enable row level security;
alter table services enable row level security;
alter table service_category_mappings enable row level security;
alter table bookings enable row level security;

-- Helper (security definer avoids recursive RLS on profiles)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$fn$;

-- profiles
create policy "profiles_select_own_or_admin" on profiles for select
  to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_self_non_admin" on profiles for insert
  to authenticated with check (id = auth.uid() and role in ('client','merchant','provider'));
create policy "profiles_admin_all" on profiles for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- service_categories
create policy "categories_public_read_active" on service_categories for select
  to anon, authenticated using (active_status = true);
create policy "categories_admin_all" on service_categories for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- services
create policy "services_public_read_approved" on services for select
  to anon, authenticated using (status = 'approved');
create policy "services_provider_select_own" on services for select
  to authenticated using (provider_id = auth.uid());
create policy "services_provider_insert_draft" on services for insert
  to authenticated with check (provider_id = auth.uid() and status = 'draft');
create policy "services_provider_update_unlocked" on services for update
  to authenticated
  using (provider_id = auth.uid() and status in ('draft','suspended'))
  with check (provider_id = auth.uid() and status in ('draft','pending','suspended'));
create policy "services_provider_delete_unlocked" on services for delete
  to authenticated using (provider_id = auth.uid() and status in ('draft','suspended'));
create policy "services_admin_all" on services for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- mappings
create policy "mappings_public_read_approved" on service_category_mappings for select
  to anon, authenticated
  using (exists (select 1 from services s where s.id = service_id and s.status = 'approved'));
create policy "mappings_provider_manage" on service_category_mappings for all
  to authenticated
  using (exists (select 1 from services s where s.id = service_id and s.provider_id = auth.uid() and s.status in ('draft','suspended')))
  with check (exists (select 1 from services s where s.id = service_id and s.provider_id = auth.uid() and s.status in ('draft','suspended')));
create policy "mappings_admin_all" on service_category_mappings for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- bookings
create policy "bookings_anyone_insert" on bookings for insert
  to anon, authenticated with check (true);
create policy "bookings_provider_or_admin_select" on bookings for select
  to authenticated
  using (public.is_admin() or exists (select 1 from services s where s.id = service_id and s.provider_id = auth.uid()));
