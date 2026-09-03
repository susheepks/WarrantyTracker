'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function importEquipment(businessId: string, rows: any[]) {
  const supabase = await createClient()

  // Validate session and membership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .single()

  if (!membership) return { error: 'Not authorized for this business' }

  // Clean and prepare rows
  const inserts = rows
    .filter(row => row.name && row.name.trim() !== '')
    .map(row => {
      let price = null
      if (row.price) {
        const p = parseFloat(row.price)
        if (!isNaN(p)) price = p
      }

      let warranty_months = null
      if (row.warranty_months) {
        const wm = parseInt(row.warranty_months, 10)
        if (!isNaN(wm)) warranty_months = wm
      }

      let warranty_end_date = null
      if (row.purchase_date && warranty_months) {
        const date = new Date(row.purchase_date)
        if (!isNaN(date.getTime())) {
          date.setMonth(date.getMonth() + warranty_months)
          warranty_end_date = date.toISOString().split('T')[0]
        }
      }

      let purchase_date = null
      if (row.purchase_date) {
        const date = new Date(row.purchase_date)
        if (!isNaN(date.getTime())) {
          purchase_date = date.toISOString().split('T')[0]
        }
      }

      return {
        business_id: businessId,
        name: row.name.trim(),
        category: row.category?.trim() || null,
        model: row.model?.trim() || null,
        serial_number: row.serial_number?.trim() || null,
        purchase_date,
        price,
        warranty_months,
        warranty_end_date,
        status: 'active'
      }
    })

  if (inserts.length === 0) return { error: 'No valid rows found (name is required)' }

  const { data, error } = await supabase
    .from('equipment')
    .insert(inserts)

  if (error) {
    console.error('CSV Import Error:', error)
    return { error: 'Database error during import: ' + error.message }
  }

  revalidatePath(`/dashboard/${businessId}/equipment`)
  return { success: true, count: inserts.length }
}
