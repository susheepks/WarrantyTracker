import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ClaimForm from './ClaimForm'

export default async function ClaimDetailPage(props: { params: Promise<{ id: string, businessId: string }> }) {
  const resolvedParams = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: claim } = await supabase
    .from('claims')
    .select(`
      *,
      equipment (
        name,
        model,
        serial_number,
        purchase_date,
        retailer,
        warranty_months,
        warranty_end_date
      )
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (!claim) {
    return redirect(`/dashboard/${resolvedParams.businessId}/claims`)
  }

  const eq = claim.equipment as any

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6">
        <Link href={`/dashboard/${resolvedParams.businessId}/claims`} className="text-blue-600 hover:underline flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={16} /> Back to Claims
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Warranty Claim: {eq.name}
        </h1>
        <p className="text-gray-500 mt-1 flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${claim.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
            {claim.status}
          </span>
          {claim.status === 'draft' ? 'Not Submitted' : `Submitted on ${new Date(claim.submitted_at).toLocaleDateString()}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Equipment Details</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Model</dt>
                <dd className="mt-1 text-sm text-gray-900">{eq.model || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{eq.serial_number || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased</dt>
                <dd className="mt-1 text-sm text-gray-900">{eq.purchase_date ? new Date(eq.purchase_date).toLocaleDateString() : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</dt>
                <dd className="mt-1 text-sm text-gray-900">{eq.retailer || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty Expires</dt>
                <dd className="mt-1 text-sm font-medium text-amber-600">{eq.warranty_end_date ? new Date(eq.warranty_end_date).toLocaleDateString() : '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <ClaimForm claim={claim} businessId={resolvedParams.businessId} />
        </div>
      </div>
    </div>
  )
}
