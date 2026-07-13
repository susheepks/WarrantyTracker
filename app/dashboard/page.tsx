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

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back to {profile.businesses?.name}</p>
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
