-- ============================================================
-- DOCUMENT VAULT MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- STEP 1: Create the equipment_documents table
create table if not exists equipment_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  equipment_id uuid references equipment(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size integer not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- STEP 2: Enable RLS
alter table equipment_documents enable row level security;

-- STEP 3: RLS Policies for equipment_documents
create policy "Users can view documents for their businesses"
  on equipment_documents for select
  using (business_id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can insert documents for their businesses"
  on equipment_documents for insert
  with check (business_id in (select business_id from memberships where user_id = auth.uid()));

create policy "Users can delete documents for their businesses"
  on equipment_documents for delete
  using (business_id in (select business_id from memberships where user_id = auth.uid()));

-- STEP 4: Create index
create index if not exists idx_equipment_documents_business on equipment_documents(business_id);
create index if not exists idx_equipment_documents_equipment on equipment_documents(equipment_id);

-- STEP 5: Create Storage Bucket
-- NOTE: In Supabase, you also need to create a storage bucket named 'equipment_documents' in the Storage dashboard.
-- Or you can attempt to insert it if you have permissions:
insert into storage.buckets (id, name, public) 
values ('equipment_documents', 'equipment_documents', false)
on conflict (id) do nothing;

-- Storage RLS Policies
create policy "Users can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'equipment_documents' 
    and auth.role() = 'authenticated'
  );

create policy "Users can view documents"
  on storage.objects for select
  using (
    bucket_id = 'equipment_documents' 
    and auth.role() = 'authenticated'
  );

create policy "Users can delete documents"
  on storage.objects for delete
  using (
    bucket_id = 'equipment_documents' 
    and auth.role() = 'authenticated'
  );
