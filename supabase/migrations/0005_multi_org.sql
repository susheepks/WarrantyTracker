-- ============================================================
-- MULTI-ORG MIGRATION
-- Run this in the Supabase SQL Editor
-- Safe to run even if some parts already exist (uses IF NOT EXISTS)
-- ============================================================

-- STEP 1: Create the memberships table
create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  role text default 'staff', -- 'owner' | 'staff'
  created_at timestamptz default now(),
  unique (user_id, business_id)
);

-- STEP 2: Enable RLS
alter table memberships enable row level security;

-- STEP 3: Add last_active_business_id to profiles (if missing)
alter table profiles add column if not exists last_active_business_id uuid references businesses(id);

-- STEP 4: Migrate existing data from profiles -> memberships
-- This copies existing (user_id, business_id, role) entries so existing users aren't locked out
insert into memberships (user_id, business_id, role)
select id, business_id, coalesce(role, 'owner')
from profiles
where business_id is not null
on conflict (user_id, business_id) do nothing;

-- STEP 5: Set last_active_business_id for existing users
update profiles
set last_active_business_id = business_id
where business_id is not null
  and last_active_business_id is null;

-- STEP 6: Create indexes
create index if not exists idx_memberships_user on memberships(user_id);
create index if not exists idx_memberships_business on memberships(business_id);

-- STEP 7: RLS Policies for memberships
-- Drop first to avoid duplicate errors
drop policy if exists "Users can view memberships for their businesses" on memberships;
drop policy if exists "Users can insert memberships for their businesses if owner" on memberships;
drop policy if exists "Users can update memberships for their businesses if owner" on memberships;
drop policy if exists "Users can delete memberships for their businesses if owner" on memberships;

create policy "Users can view memberships for their businesses"
  on memberships for select
  using (user_id = auth.uid());

create policy "Users can insert memberships for their businesses if owner"
  on memberships for insert
  with check (business_id in (select business_id from memberships where user_id = auth.uid() and role = 'owner'));

create policy "Users can update memberships for their businesses if owner"
  on memberships for update
  using (business_id in (select business_id from memberships where user_id = auth.uid() and role = 'owner'));

create policy "Users can delete memberships for their businesses if owner"
  on memberships for delete
  using (business_id in (select business_id from memberships where user_id = auth.uid() and role = 'owner'));

-- STEP 8: Update existing RLS policies on other tables to use memberships
-- Equipment
drop policy if exists "Users can view their own business equipment" on equipment;
drop policy if exists "Users can insert equipment for their own business" on equipment;
drop policy if exists "Users can update their own business equipment" on equipment;
drop policy if exists "Users can delete their own business equipment" on equipment;
drop policy if exists "Users can delete their own business equipment if owner" on equipment;

create policy "Users can view their own business equipment"
  on equipment for select
  using (business_id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can insert equipment for their own business"
  on equipment for insert
  with check (business_id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can update their own business equipment"
  on equipment for update
  using (business_id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can delete their own business equipment if owner"
  on equipment for delete
  using (business_id in (select business_id from memberships where user_id = auth.uid() and role = 'owner'));

-- Businesses
drop policy if exists "Users can view their own business" on businesses;
drop policy if exists "Users can update their own business" on businesses;

create policy "Users can view their own business"
  on businesses for select
  using (id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can update their own business"
  on businesses for update
  using (id in (select business_id from memberships where user_id = auth.uid() and role = 'owner'));

-- Maintenance Schedules
drop policy if exists "Users can view schedules for their business equipment" on maintenance_schedules;
drop policy if exists "Users can insert schedules for their business equipment" on maintenance_schedules;
drop policy if exists "Users can update schedules for their business equipment" on maintenance_schedules;
drop policy if exists "Users can delete schedules for their business equipment" on maintenance_schedules;

create policy "Users can view schedules for their business equipment"
  on maintenance_schedules for select
  using (equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid())));

create policy "Users can insert schedules for their business equipment"
  on maintenance_schedules for insert
  with check (equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid())));

create policy "Users can update schedules for their business equipment"
  on maintenance_schedules for update
  using (equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid())));

create policy "Users can delete schedules for their business equipment"
  on maintenance_schedules for delete
  using (equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid())));

-- Maintenance Logs
drop policy if exists "Users can view logs for their business equipment schedules" on maintenance_logs;
drop policy if exists "Users can insert logs for their business equipment schedules" on maintenance_logs;
drop policy if exists "Users can update logs for their business equipment schedules" on maintenance_logs;

create policy "Users can view logs for their business equipment schedules"
  on maintenance_logs for select
  using (schedule_id in (select id from maintenance_schedules where equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid()))));

create policy "Users can insert logs for their business equipment schedules"
  on maintenance_logs for insert
  with check (schedule_id in (select id from maintenance_schedules where equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid()))));

create policy "Users can update logs for their business equipment schedules"
  on maintenance_logs for update
  using (schedule_id in (select id from maintenance_schedules where equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid()))));

-- Claims
drop policy if exists "Users can view claims for their business equipment" on claims;
drop policy if exists "Users can insert claims for their business equipment" on claims;
drop policy if exists "Users can update claims for their business equipment" on claims;

create policy "Users can view claims for their business equipment"
  on claims for select
  using (equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid())));

create policy "Users can insert claims for their business equipment"
  on claims for insert
  with check (equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid())));

create policy "Users can update claims for their business equipment"
  on claims for update
  using (equipment_id in (select id from equipment where business_id in (select business_id from memberships where user_id = auth.uid())));

-- STEP 9: Allow profiles UPDATE for last_active_business_id
drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());
