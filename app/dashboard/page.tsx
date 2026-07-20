import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardRoot() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_active_business_id')
    .eq('id', user.id)
    .single()

  if (profile?.last_active_business_id) {
    redirect(`/dashboard/${profile.last_active_business_id}`)
  }

  // If no last_active_business_id, check if they have ANY memberships
  const { data: memberships } = await supabase
    .from('memberships')
    .select('business_id')
    .eq('user_id', user.id)
    .limit(1)

  if (memberships && memberships.length > 0) {
    // Save it as their active business
    await supabase
      .from('profiles')
      .update({ last_active_business_id: memberships[0].business_id })
      .eq('id', user.id)
    
    redirect(`/dashboard/${memberships[0].business_id}`)
  }

  // If no memberships, they need to onboard/create an organization
  redirect('/onboarding')
}
