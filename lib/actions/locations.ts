'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLocation(businessId: string, name: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('locations')
    .insert({ business_id: businessId, name })

  if (error) {
    console.error('Failed to create location:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/${businessId}/locations`)
  return { success: true }
}

export async function deleteLocation(businessId: string, locationId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)
    .eq('business_id', businessId)

  if (error) {
    console.error('Failed to delete location:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/${businessId}/locations`)
  return { success: true }
}
