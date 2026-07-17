import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { EquipmentTimelineClient } from '@/components/equipment/EquipmentTimelineClient'

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
  let badgeColor = 'bg-status-green/10 text-status-green border-status-green/20'
  if (healthScore < 80) badgeColor = 'bg-status-amber/10 text-status-amber border-status-amber/20'
  if (healthScore < 50) badgeColor = 'bg-status-red/10 text-status-red border-status-red/20'

  const deleteEquipment = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.from('equipment').delete().eq('id', resolvedParams.id)
    redirect('/dashboard/equipment')
  }

  const handleStartClaim = async () => {
    'use server'
    const { startClaim } = await import('@/lib/actions/claims')
    await startClaim(resolvedParams.id)
  }

  const isUnderWarranty = equipment.warranty_end_date && new Date(equipment.warranty_end_date) >= new Date()

  // Fetch timeline data
  const { data: logs } = await supabase
    .from('maintenance_logs')
    .select('id, created_at, notes, maintenance_schedules!inner(task_name)')
    .eq('maintenance_schedules.equipment_id', resolvedParams.id)

  const { data: claims } = await supabase
    .from('claims')
    .select('id, created_at, status, description')
    .eq('equipment_id', resolvedParams.id)

  const timeline = []
  
  timeline.push({
    id: `created-${equipment.id}`,
    type: 'created' as const,
    title: 'Equipment Added',
    date: equipment.created_at,
  })

  if (logs) {
    logs.forEach(log => {
      timeline.push({
        id: `log-${log.id}`,
        type: 'maintenance' as const,
        title: (log.maintenance_schedules as any).task_name,
        date: log.created_at,
        notes: log.notes
      })
    })
  }

  if (claims) {
    claims.forEach(claim => {
      timeline.push({
        id: `claim-${claim.id}`,
        type: 'claim' as const,
        title: 'Warranty Claim Filed',
        date: claim.created_at,
        notes: claim.description ? `${claim.status} - ${claim.description}` : claim.status
      })
    })
  }

  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <Link href="/dashboard/equipment" className="text-blue-600 hover:underline flex items-center gap-1 text-sm mb-4 font-sans">
            <ArrowLeft size={16} /> Back to Equipment
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-display text-ink">{equipment.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-sans border ${badgeColor}`}>
              {Math.round(healthScore)}% Health
            </span>
          </div>
          <p className="text-steel font-sans mt-1">{equipment.category || 'Uncategorized'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link 
            href={`/dashboard/equipment/${resolvedParams.id}/card`}
            className="flex items-center gap-1 px-4 py-2 bg-ink text-white rounded-md hover:bg-ink/90 transition-transform duration-fast active:scale-[0.97] text-sm font-medium font-sans"
          >
            View Emergency Card
          </Link>
          {isUnderWarranty && (
            <form action={handleStartClaim}>
              <button className="flex items-center gap-1 px-4 py-2 bg-status-amber text-white rounded-md hover:bg-amber-dark transition-transform duration-fast active:scale-[0.97] text-sm font-medium font-sans">
                Start Warranty Claim
              </button>
            </form>
          )}
          <form action={deleteEquipment}>
            <button className="flex items-center gap-1 px-3 py-2 text-status-red border border-status-red/20 bg-status-red/5 rounded-md hover:bg-status-red/10 transition-transform duration-fast active:scale-[0.97] text-sm font-medium font-sans">
              <Trash2 size={16} /> Delete
            </button>
          </form>
        </div>
      </div>

      <div className="bg-card border border-steel-light rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold font-display mb-4 border-b border-steel-light pb-2 text-ink">Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
          <div>
            <dt className="text-sm font-medium font-sans text-steel">Model</dt>
            <dd className="mt-1 font-mono text-ink">{equipment.model || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium font-sans text-steel">Serial Number</dt>
            <dd className="mt-1 font-mono text-ink">{equipment.serial_number || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium font-sans text-steel">Purchase Date</dt>
            <dd className="mt-1 font-mono text-ink">{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium font-sans text-steel">Retailer</dt>
            <dd className="mt-1 font-sans text-ink">{equipment.retailer || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium font-sans text-steel">Price</dt>
            <dd className="mt-1 font-mono text-ink">{equipment.price ? `$${equipment.price}` : '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-card border border-steel-light rounded-lg p-6 shadow-sm mt-6">
        <h2 className="text-lg font-semibold font-display mb-4 border-b border-steel-light pb-2 text-ink">Warranty Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
          <div>
            <dt className="text-sm font-medium font-sans text-steel">Warranty Length</dt>
            <dd className="mt-1 font-sans text-ink">{equipment.warranty_months ? `${equipment.warranty_months} months` : '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium font-sans text-steel">Warranty Expiration</dt>
            <dd className="mt-1 font-mono text-ink">{equipment.warranty_end_date ? new Date(equipment.warranty_end_date).toLocaleDateString() : '—'}</dd>
          </div>
        </dl>
      </div>

      <EquipmentTimelineClient items={timeline} />
    </div>
  )
}
