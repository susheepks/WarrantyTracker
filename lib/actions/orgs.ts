'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateActiveOrgAndRedirect(businessId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Verify membership before saving
    const { data: membership } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single()

    if (membership) {
      await supabase
        .from('profiles')
        .update({ last_active_business_id: businessId })
        .eq('id', user.id)
    }
  }

  redirect(`/dashboard/${businessId}/equipment`)
}
