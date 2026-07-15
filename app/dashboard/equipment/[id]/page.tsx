import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default async function EquipmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const resolvedParams = await props.params
  const supabase = await createClient()

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!equipment) {
    return redirect('/dashboard/equipment')
  }

  const { data: healthData } = await supabase
    .from('equipment_health')
    .select('health_score')
    .eq('equipment_id', resolvedParams.id)
    .single()

  const healthScore = healthData?.health_score ?? 100
  let badgeColor = 'bg-green-100 text-green-800 border-green-200'
  if (healthScore < 80) badgeColor = 'bg-amber-100 text-amber-800 border-amber-200'
  if (healthScore < 50) badgeColor = 'bg-red-100 text-red-800 border-red-200'

  const deleteEquipment = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.from('equipment').delete().eq('id', resolvedParams.id)
    redirect('/dashboard/equipment')
  }

  const handleStartClaim = async () => {
    'use server'
    const { startClaim } = await import('../../claims/actions')
    await startClaim(resolvedParams.id)
  }

  const isUnderWarranty = equipment.warranty_end_date && new Date(equipment.warranty_end_date) >= new Date()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Link href="/dashboard/equipment" className="text-blue-600 hover:underline flex items-center gap-1 text-sm mb-4">
            <ArrowLeft size={16} /> Back to Equipment
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
              {Math.round(healthScore)}% Health
            </span>
          </div>
          <p className="text-gray-500 mt-1">{equipment.category || 'Uncategorized'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href={`/dashboard/equipment/${resolvedParams.id}/card`}
            className="flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            View Emergency Card
          </Link>
          {isUnderWarranty && (
            <form action={handleStartClaim}>
              <button className="flex items-center gap-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-medium">
                Start Warranty Claim
              </button>
            </form>
          )}
          <form action={deleteEquipment}>
            <button className="flex items-center gap-1 px-3 py-2 text-red-600 border border-red-200 bg-red-50 rounded-md hover:bg-red-100 transition-colors text-sm font-medium">
              <Trash2 size={16} /> Delete
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-900">Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Model</dt>
            <dd className="mt-1 text-gray-900">{equipment.model || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
            <dd className="mt-1 text-gray-900">{equipment.serial_number || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
            <dd className="mt-1 text-gray-900">{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Retailer</dt>
            <dd className="mt-1 text-gray-900">{equipment.retailer || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Price</dt>
            <dd className="mt-1 text-gray-900">{equipment.price ? `$${equipment.price}` : '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-6">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-900">Warranty Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Warranty Length</dt>
            <dd className="mt-1 text-gray-900">{equipment.warranty_months ? `${equipment.warranty_months} months` : '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Warranty Expiration</dt>
            <dd className="mt-1 text-gray-900">{equipment.warranty_end_date ? new Date(equipment.warranty_end_date).toLocaleDateString() : '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
