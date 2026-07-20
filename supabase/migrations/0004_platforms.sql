create table platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  domain text,
  icon_override_url text,
  created_at timestamptz default now()
);

alter table equipment add column platform_id uuid references platforms(id);

alter table platforms enable row level security;

create policy "Anyone can view platforms"
  on platforms for select
  to authenticated
  using (true);
