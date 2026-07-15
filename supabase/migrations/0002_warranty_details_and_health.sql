-- Add missing warranty provider details to the equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS provider_name text;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS provider_phone text;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS provider_email text;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS provider_portal_url text;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS policy_number text;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS provider_notes text;

-- Add was_due_date to maintenance_logs for accurate health score calculation
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS was_due_date date;

-- Create equipment_health view to calculate 30-day rolling health score per equipment
CREATE OR REPLACE VIEW equipment_health AS
SELECT 
  e.id as equipment_id,
  e.business_id,
  COUNT(l.id) as total_completed_30d,
  SUM(CASE WHEN l.completed_at::date <= l.was_due_date THEN 1 ELSE 0 END) as on_time_completed_30d,
  CASE 
    WHEN COUNT(l.id) > 0 THEN 
      (SUM(CASE WHEN l.completed_at::date <= l.was_due_date THEN 1 ELSE 0 END)::numeric / COUNT(l.id)::numeric) * 100
    ELSE 
      100 -- Default to 100% if no tasks completed in last 30 days
  END as health_score
FROM equipment e
LEFT JOIN maintenance_schedules s ON e.id = s.equipment_id
LEFT JOIN maintenance_logs l ON s.id = l.schedule_id 
  AND l.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY e.id, e.business_id;

-- Ensure RLS on the view if accessed via API (Supabase views bypass RLS by default unless created with security invoker, but since we use server-side queries primarily, this is fine, or we can use security invoker)
-- It's safer to query this view via server components bypassing RLS or use security invoker.
ALTER VIEW equipment_health SET (security_invoker = true);
