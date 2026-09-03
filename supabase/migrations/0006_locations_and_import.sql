-- ============================================================
-- LOCATIONS MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- STEP 1: Create the locations table
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- STEP 2: Enable RLS
alter table locations enable row level security;

-- STEP 3: RLS Policies for locations
create policy "Users can view their own business locations"
  on locations for select
  using (business_id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can insert locations for their own business"
  on locations for insert
  with check (business_id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can update their own business locations"
  on locations for update
  using (business_id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can delete their own business locations if owner"
  on locations for delete
  using (business_id in (select business_id from memberships where user_id = auth.uid() and role = 'owner'));

-- STEP 4: Create index
create index if not exists idx_locations_business on locations(business_id);

-- STEP 5: Add location_id to equipment
alter table equipment add column if not exists location_id uuid references locations(id) on delete set null;
