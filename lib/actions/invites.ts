'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInvite(businessId: string, email: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if owner
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .single()

  if (membership?.role !== 'owner') return { error: 'Only owners can invite staff' }

  // Check if already a member
  // (We'd need their user_id, which we don't have, but we can check if invite exists)
  const { data: existingInvite } = await supabase
    .from('business_invites')
    .select('id')
    .eq('business_id', businessId)
    .eq('email', email)
    .single()

  if (existingInvite) return { error: 'Invite already sent to this email' }

  const { error } = await supabase
    .from('business_invites')
    .insert({
      business_id: businessId,
      email: email,
      role: 'staff',
      invited_by: user.id
    })

  if (error) {
    console.error(error)
    return { error: 'Failed to create invite' }
  }

  revalidatePath(`/dashboard/${businessId}/settings`)
  return { success: true }
}

export async function removeInvite(businessId: string, inviteId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('business_invites')
    .delete()
    .eq('id', inviteId)
    .eq('business_id', businessId)

  if (error) {
    return { error: 'Failed to remove invite' }
  }

  revalidatePath(`/dashboard/${businessId}/settings`)
  return { success: true }
}
