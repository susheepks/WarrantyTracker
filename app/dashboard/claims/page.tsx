import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Clock, CheckCircle } from 'lucide-react'

export default async function ClaimsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: claims } = await supabase
    .from('claims')
    .select(`
      id,
      status,
      submitted_at,
      equipment (
        name,
        serial_number
      )
    `)
    .order('submitted_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900">Warranty Claims</h1>
        <Link href="/dashboard/equipment" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
          View Equipment
        </Link>
      </div>

      {(!claims || claims.length === 0) ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No claims filed yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">You can start a warranty claim directly from any active equipment's detail page.</p>
          <Link href="/dashboard/equipment" className="px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
            Browse Equipment
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {claims.map((claim) => (
              <li key={claim.id}>
                <Link href={`/dashboard/claims/${claim.id}`} className="block hover:bg-gray-50 transition-colors">
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${claim.status === 'draft' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        {claim.status === 'draft' ? <Clock size={20} /> : <CheckCircle size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {/* @ts-expect-error type inference */}
                          {claim.equipment?.name || 'Unknown Equipment'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                          {/* @ts-expect-error type inference */}
                          Serial: {claim.equipment?.serial_number || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${claim.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {claim.status}
                      </span>
                      {claim.submitted_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(claim.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
