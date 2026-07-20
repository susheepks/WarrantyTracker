import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { MaintenanceTaskListClient } from '@/components/dashboard/MaintenanceTaskListClient'

export default async function DashboardPage(props: { params: Promise<{ businessId: string }> }) {
  const params = await props.params;
  const businessId = params.businessId;

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Verify membership and get business name
  const { data: membership } = await supabase
    .from('memberships')
    .select('businesses(name)')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .single()

  if (!membership) return redirect('/dashboard') // If no access, layout redirects anyway, but just in case

  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)

  // Maintenance due
  const { data: dueTasks } = await supabase
    .from('maintenance_schedules')
    .select('*, equipment!inner(name, business_id)')
    .eq('equipment.business_id', businessId)
    .lt('next_due_date', nextWeek.toISOString().split('T')[0])
    .order('next_due_date', { ascending: true })

  // Fetch Protected Value and Health Score
  const { data: equipmentStats } = await supabase
    .from('equipment')
    .select('price, warranty_end_date')
    .eq('business_id', businessId)
    .not('price', 'is', null)

  let protectedValue = 0
  let expiredValue = 0

  if (equipmentStats) {
    equipmentStats.forEach(eq => {
      if (eq.warranty_end_date && new Date(eq.warranty_end_date) >= today) {
        protectedValue += eq.price || 0
      } else {
        expiredValue += eq.price || 0
      }
    })
  }

  // Use the equipment_health view
  const { data: healthStats, error: healthError } = await supabase
    .from('equipment_health')
    .select('health_score')
    .eq('business_id', businessId)

  let averageHealth = 100
  if (!healthError && healthStats && healthStats.length > 0) {
    const totalHealth = healthStats.reduce((sum, item) => sum + (item.health_score || 0), 0)
    averageHealth = Math.round(totalHealth / healthStats.length)
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back to {(membership.businesses as any)?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Business Health Score</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${averageHealth >= 80 ? 'text-green-600' : averageHealth >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
              {averageHealth}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">On-time maintenance (30 days)</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Protected Value</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">₹ {protectedValue.toLocaleString()}</span>
          </div>
          <p className="text-xs text-green-600 font-medium mt-2">Currently under warranty</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Unprotected Value</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">₹ {expiredValue.toLocaleString()}</span>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-2">Consider service plans</p>
        </div>
      </div>

      <div className="bg-white border border-steel-light rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="bg-surface px-6 py-4 border-b border-steel-light flex items-center justify-between">
          <h2 className="text-lg font-semibold font-display text-ink flex items-center gap-2">
            <AlertCircle size={20} className="text-status-amber" />
            Maintenance Due This Week
          </h2>
          <Link href={`/dashboard/${businessId}/equipment`} className="text-sm text-blue-600 hover:underline font-medium">
            View All Equipment
          </Link>
        </div>

        <MaintenanceTaskListClient initialTasks={dueTasks || []} />
      </div>
    </div>
  )
}
