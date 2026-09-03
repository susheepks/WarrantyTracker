-- ============================================================
-- INVITES MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- STEP 1: Create business_invites table
create table if not exists business_invites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  email text not null,
  role text default 'staff',
  invited_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(business_id, email)
);

-- STEP 2: Enable RLS
alter table business_invites enable row level security;

-- STEP 3: RLS Policies
create policy "Users can view invites for their businesses"
  on business_invites for select
  using (business_id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can insert invites for their businesses if owner"
  on business_invites for insert
  with check (business_id in (select business_id from memberships where user_id = auth.uid() and role = 'owner'));

create policy "Users can delete invites for their businesses if owner"
  on business_invites for delete
  using (business_id in (select business_id from memberships where user_id = auth.uid() and role = 'owner'));

-- Public policy so invited users can query their invite by ID during redemption
create policy "Anyone can read an invite by ID"
  on business_invites for select
  using (true);
