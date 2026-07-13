import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EquipmentForm from './EquipmentForm'

export default async function NewEquipmentPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: templates } = await supabase
    .from('maintenance_templates')
    .select('*')

  return <EquipmentForm templates={templates || []} />
}
