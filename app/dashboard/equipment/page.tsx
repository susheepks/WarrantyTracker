import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Calendar, Settings } from 'lucide-react'

export default async function EquipmentPage() {
  const supabase = await createClient()
  
  const { data: equipment } = await supabase
    .from('equipment')
    .select('*')
    .order('created_at', { ascending: false })

  const getWarrantyStatus = (endDate: string | null) => {
    if (!endDate) return { text: 'No Warranty', color: 'bg-gray-100 text-gray-800' }
    
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Expired', color: 'bg-red-100 text-red-800' }
    if (diffDays <= 30) return { text: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Active', color: 'bg-green-100 text-green-800' }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
          <p className="text-gray-500 text-sm">Manage your business assets and warranties.</p>
        </div>
        <Link 
          href="/dashboard/equipment/new" 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Equipment
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment?.map((item) => {
          const status = getWarrantyStatus(item.warranty_end_date)
          return (
            <Link key={item.id} href={`/dashboard/equipment/${item.id}`} className="block">
              <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{item.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                  <Settings size={14} /> {item.category || 'Uncategorized'}
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'Unknown Date'}
                  </div>
                  <div>
                    {item.model && <span className="text-gray-400">Model: {item.model}</span>}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
        
        {(!equipment || equipment.length === 0) && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <Settings className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No equipment found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new piece of equipment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
