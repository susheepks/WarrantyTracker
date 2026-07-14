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
          <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
          <p className="text-gray-500 mt-1">{equipment.category || 'Uncategorized'}</p>
        </div>
        <div className="flex items-center gap-2">
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
