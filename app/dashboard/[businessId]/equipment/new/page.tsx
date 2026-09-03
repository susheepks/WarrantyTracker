import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EquipmentForm from './EquipmentForm'

export default async function NewEquipmentPage(props: { params: Promise<{ businessId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: templates } = await supabase
    .from('maintenance_templates')
    .select('*')

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('business_id', params.businessId)

  return <EquipmentForm templates={templates || []} locations={locations || []} businessId={params.businessId} />
}
