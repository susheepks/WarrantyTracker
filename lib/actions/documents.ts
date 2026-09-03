'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadDocument(businessId: string, equipmentId: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .single()

  if (!membership) return { error: 'Not authorized for this business' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const fileExt = file.name.split('.').pop()
  const filePath = `${businessId}/${equipmentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('equipment_documents')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError)
    return { error: 'Failed to upload file to storage.' }
  }

  const { error: dbError } = await supabase
    .from('equipment_documents')
    .insert({
      business_id: businessId,
      equipment_id: equipmentId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: user.id
    })

  if (dbError) {
    console.error('DB Insert Error:', dbError)
    // Attempt to clean up storage
    await supabase.storage.from('equipment_documents').remove([filePath])
    return { error: 'Failed to save document metadata.' }
  }

  revalidatePath(`/dashboard/${businessId}/equipment/${equipmentId}`)
  return { success: true }
}

export async function deleteDocument(businessId: string, equipmentId: string, documentId: string, filePath: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .single()

  if (!membership) return { error: 'Not authorized' }

  const { error: storageError } = await supabase.storage
    .from('equipment_documents')
    .remove([filePath])

  if (storageError) {
    console.error('Storage Delete Error:', storageError)
    return { error: 'Failed to delete file from storage.' }
  }

  const { error: dbError } = await supabase
    .from('equipment_documents')
    .delete()
    .eq('id', documentId)
    .eq('business_id', businessId)

  if (dbError) {
    console.error('DB Delete Error:', dbError)
    return { error: 'Failed to delete document metadata.' }
  }

  revalidatePath(`/dashboard/${businessId}/equipment/${equipmentId}`)
  return { success: true }
}

export async function getSignedUrl(filePath: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.storage
    .from('equipment_documents')
    .createSignedUrl(filePath, 60 * 5) // 5 minutes

  if (error || !data) {
    return { error: 'Failed to generate download link.' }
  }

  return { url: data.signedUrl }
}
