import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { markMaintenanceComplete } from './equipment/actions'
import { revalidatePath } from 'next/cache'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, businesses(name)')
    .eq('id', user.id)
    .single()

  if (!profile) return redirect('/onboarding')

  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)

  const { data: dueTasks } = await supabase
    .from('maintenance_schedules')
    .select('*, equipment(name)')
    .lt('next_due_date', nextWeek.toISOString().split('T')[0])
    .order('next_due_date', { ascending: true })

  // Define an action wrapper that also calls revalidatePath to refresh the page
  const handleMarkComplete = async (formData: FormData) => {
    'use server'
    const id = formData.get('id') as string
    const freq = parseInt(formData.get('freq') as string, 10)
    await markMaintenanceComplete(id, freq)
    revalidatePath('/dashboard')
  }

  // Fetch Protected Value and Health Score
  const { data: equipmentStats } = await supabase
    .from('equipment')
    .select('price, warranty_end_date')
    .eq('business_id', profile.business_id)
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

  // Use the new equipment_health view, fallback gracefully if the view doesn't exist yet
  const { data: healthStats, error: healthError } = await supabase
    .from('equipment_health')
    .select('health_score')
    .eq('business_id', profile.business_id)

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
          <p className="text-gray-500 mt-1">Welcome back to {profile.businesses?.name}</p>
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
            <span className="text-3xl font-bold text-gray-900">${protectedValue.toLocaleString()}</span>
          </div>
          <p className="text-xs text-green-600 font-medium mt-2">Currently under warranty</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Unprotected Value</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">${expiredValue.toLocaleString()}</span>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-2">Consider service plans</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-500" />
            Maintenance Due This Week
          </h2>
          <Link href="/dashboard/equipment" className="text-sm text-blue-600 hover:underline font-medium">
            View All Equipment
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {(!dueTasks || dueTasks.length === 0) ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle2 size={48} className="mx-auto text-green-400 mb-3" />
              <p className="font-medium text-gray-900">All caught up!</p>
              <p className="text-sm">No maintenance tasks due in the next 7 days.</p>
            </div>
          ) : (
            dueTasks.map((task) => {
              const isOverdue = new Date(task.next_due_date) < today
              return (
                <div key={task.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.task_name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      {task.equipment?.name}
                    </p>
                    <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                      <Clock size={14} />
                      {isOverdue ? 'Overdue: ' : 'Due: '}
                      {new Date(task.next_due_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <form action={handleMarkComplete}>
                    <input type="hidden" name="id" value={task.id} />
                    <input type="hidden" name="freq" value={task.frequency_days} />
                    <button 
                      type="submit"
                      className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-blue-50 text-blue-700 font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 active:bg-blue-200"
                    >
                      <CheckCircle2 size={18} />
                      Mark Complete
                    </button>
                  </form>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
