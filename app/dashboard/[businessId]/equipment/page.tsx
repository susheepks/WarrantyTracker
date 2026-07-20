import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { EquipmentListClient } from '@/components/equipment/EquipmentListClient'

export default async function EquipmentPage(props: { params: Promise<{ businessId: string }> }) {
  const params = await props.params;
  const businessId = params.businessId;

  const supabase = await createClient()
  
  const { data: equipment } = await supabase
    .from('equipment')
    .select('*, platforms(name, domain, icon_override_url)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-ink">Equipment</h1>
          <p className="text-steel font-sans text-sm mt-1">Manage your business assets and warranties.</p>
        </div>
        <Link 
          href={`/dashboard/${businessId}/equipment/new`}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-transform duration-fast active:scale-[0.97]"
        >
          <Plus size={16} />
          Add Equipment
        </Link>
      </div>

      <EquipmentListClient initialEquipment={equipment || []} businessId={businessId} />
    </div>
  )
}
