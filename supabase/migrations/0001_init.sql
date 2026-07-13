create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references businesses(id),
  full_name text,
  role text default 'owner', -- 'owner' | 'staff'
  created_at timestamptz default now()
);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  category text,
  model text,
  serial_number text,
  purchase_date date,
  retailer text,
  price numeric,
  receipt_url text,
  warranty_months int,
  warranty_end_date date,
  status text default 'active',
  created_at timestamptz default now()
);

create table maintenance_templates (
  id uuid primary key default gen_random_uuid(),
  category text,
  task_name text,
  frequency_days int
);

create table maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references equipment(id) on delete cascade,
  task_name text,
  frequency_days int,
  next_due_date date
);

create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references maintenance_schedules(id) on delete cascade,
  completed_by uuid references profiles(id),
  completed_at timestamptz default now(),
  notes text,
  photo_url text,
  status text default 'completed'
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references equipment(id) on delete cascade,
  issue_description text,
  draft_text text,
  status text default 'draft',
  submitted_at timestamptz
);

create index idx_equipment_business on equipment(business_id);
create index idx_equipment_warranty_end on equipment(warranty_end_date);
create index idx_schedules_equipment on maintenance_schedules(equipment_id);
create index idx_schedules_next_due on maintenance_schedules(next_due_date);
create index idx_logs_schedule on maintenance_logs(schedule_id);
create index idx_claims_equipment on claims(equipment_id);

-- RLS
alter table businesses enable row level security;
alter table profiles enable row level security;
alter table equipment enable row level security;
alter table maintenance_templates enable row level security;
alter table maintenance_schedules enable row level security;
alter table maintenance_logs enable row level security;
alter table claims enable row level security;

-- Businesses
create policy "Users can view their own business"
  on businesses for select
  using (id in (select business_id from profiles where id = auth.uid()));

create policy "Users can insert their own business"
  on businesses for insert
  with check (true);

create policy "Users can update their own business"
  on businesses for update
  using (id in (select business_id from profiles where id = auth.uid()));

-- Profiles
create policy "Users can view profiles in their business"
  on profiles for select
  using (id = auth.uid());

create policy "Users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- Equipment
create policy "Users can view their own business equipment"
  on equipment for select
  using (business_id in (select business_id from profiles where id = auth.uid()));

create policy "Users can insert equipment for their own business"
  on equipment for insert
  with check (business_id in (select business_id from profiles where id = auth.uid()));

create policy "Users can update their own business equipment"
  on equipment for update
  using (business_id in (select business_id from profiles where id = auth.uid()));

create policy "Users can delete their own business equipment"
  on equipment for delete
  using (business_id in (select business_id from profiles where id = auth.uid()));

-- Maintenance Templates
create policy "Anyone can view maintenance templates"
  on maintenance_templates for select
  to authenticated
  using (true);

-- Maintenance Schedules
create policy "Users can view schedules for their business equipment"
  on maintenance_schedules for select
  using (equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid())));

create policy "Users can insert schedules for their business equipment"
  on maintenance_schedules for insert
  with check (equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid())));

create policy "Users can update schedules for their business equipment"
  on maintenance_schedules for update
  using (equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid())));

create policy "Users can delete schedules for their business equipment"
  on maintenance_schedules for delete
  using (equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid())));

-- Maintenance Logs
create policy "Users can view logs for their business equipment schedules"
  on maintenance_logs for select
  using (schedule_id in (select id from maintenance_schedules where equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid()))));

create policy "Users can insert logs for their business equipment schedules"
  on maintenance_logs for insert
  with check (schedule_id in (select id from maintenance_schedules where equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid()))));

create policy "Users can update logs for their business equipment schedules"
  on maintenance_logs for update
  using (schedule_id in (select id from maintenance_schedules where equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid()))));

-- Claims
create policy "Users can view claims for their business equipment"
  on claims for select
  using (equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid())));

create policy "Users can insert claims for their business equipment"
  on claims for insert
  with check (equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid())));

create policy "Users can update claims for their business equipment"
  on claims for update
  using (equipment_id in (select id from equipment where business_id in (select business_id from profiles where id = auth.uid())));
