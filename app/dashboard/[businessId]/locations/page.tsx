import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { createLocation, deleteLocation } from '@/lib/actions/locations'

export default async function LocationsPage(props: { params: Promise<{ businessId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: locations } = await supabase
    .from('locations')
    .select('*, equipment(count)')
    .eq('business_id', params.businessId)
    .order('name')

  // Check role
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('business_id', params.businessId)
    .single()
    
  const isOwner = membership?.role === 'owner'

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-display">Locations & Branches</h1>
        <p className="text-gray-500 mt-1">Manage physical locations where your equipment is stationed.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <MapPin size={18} /> All Locations
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {locations?.map(loc => (
            <div key={loc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-medium text-gray-900">{loc.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{loc.equipment[0].count} items assigned</p>
              </div>
              
              {isOwner && (
                <form action={async () => {
                  'use server'
                  await deleteLocation(params.businessId, loc.id)
                }}>
                  <button type="submit" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Location">
                    <Trash2 size={16} />
                  </button>
                </form>
              )}
            </div>
          ))}
          
          {(!locations || locations.length === 0) && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No locations added yet.
            </div>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-6">
          <h3 className="font-medium text-gray-900 mb-4">Add New Location</h3>
          <form action={async (formData) => {
            'use server'
            const name = formData.get('name') as string
            if (name) await createLocation(params.businessId, name)
          }} className="flex gap-3">
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="e.g. Main Kitchen, Building A..." 
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Plus size={16} /> Add Location
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
