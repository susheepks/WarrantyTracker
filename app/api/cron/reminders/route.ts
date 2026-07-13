import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Initialize Supabase Admin client to bypass RLS in the cron job
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // 1. Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Calculate target date (today + 7 days)
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + 7)
  const targetDateStr = targetDate.toISOString().split('T')[0]

  // 3. Find tasks due exactly 7 days from now
  const { data: dueTasks, error } = await supabaseAdmin
    .from('maintenance_schedules')
    .select(`
      id,
      task_name,
      equipment_id,
      equipment:equipment_id (
        name,
        business_id,
        businesses:business_id (
          name
        )
      )
    `)
    .eq('next_due_date', targetDateStr)

  if (error || !dueTasks) {
    return NextResponse.json({ error: 'Failed to fetch tasks', details: error }, { status: 500 })
  }

  if (dueTasks.length === 0) {
    return NextResponse.json({ message: 'No tasks due' })
  }

  // 4. Group by business_id
  const businessesMap = new Map<string, {
    businessName: string,
    tasks: Array<{ equipName: string, taskName: string }>
  }>()

  for (const task of dueTasks) {
    const eq = task.equipment as any
    if (!eq) continue
    const businessId = eq.business_id
    const businessName = eq.businesses?.name || 'Your Business'

    if (!businessesMap.has(businessId)) {
      businessesMap.set(businessId, { businessName, tasks: [] })
    }
    
    businessesMap.get(businessId)!.tasks.push({
      equipName: eq.name,
      taskName: task.task_name
    })
  }

  let emailsSent = 0

  // 5. For each business, fetch the owner(s) and send an email
  for (const [businessId, businessData] of businessesMap.entries()) {
    // Get profiles with role 'owner' for this business
    const { data: owners } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('business_id', businessId)
      .eq('role', 'owner')

    if (!owners || owners.length === 0) continue

    // Fetch emails using Supabase Admin Auth API
    for (const owner of owners) {
      const { data: userObj, error: userError } = await supabaseAdmin.auth.admin.getUserById(owner.id)
      const email = userObj?.user?.email
      
      if (userError || !email) continue

      // Construct Email HTML
      let html = `<h2>Maintenance Reminder for ${businessData.businessName}</h2>`
      html += `<p>You have the following equipment maintenance tasks due in exactly 7 days:</p><ul>`
      
      for (const t of businessData.tasks) {
        html += `<li><strong>${t.equipName}</strong>: ${t.taskName}</li>`
      }
      html += `</ul><p>Log in to EquipTracker to mark them as complete.</p>`

      // Send via Resend
      try {
        const { error: resendError } = await resend.emails.send({
          from: 'EquipTracker <onboarding@resend.dev>', // Valid testing address for free tier
          to: email, // Free tier can only send to your verified Resend email address
          subject: 'Action Required: Upcoming Maintenance',
          html: html,
        })
        
        if (resendError) {
          console.error('Resend error:', resendError)
        } else {
          emailsSent++
        }
      } catch (err) {
        console.error('Failed to send email to', email, err)
      }
    }
  }

  return NextResponse.json({ message: `Sent ${emailsSent} reminder emails for ${dueTasks.length} tasks.` })
}
