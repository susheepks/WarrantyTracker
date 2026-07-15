import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import QRCode from 'qrcode'

export default async function EquipmentCardPage(props: { params: Promise<{ id: string }> }) {
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

  // Generate QR code pointing to the equipment's detail page
  // We use a relative path but it will be resolved by the browser if scanned, 
  // actually for QR codes we ideally want an absolute URL.
  // Since we don't have the base URL easily here in RSC without headers, 
  // we'll let the client component generate the absolute QR or just use the relative one.
  // Actually, wait, let's just use the relative URL or pass it to a client component.
  // For simplicity, we can get the host from headers.
  
  const headers = await import('next/headers')
  const hostList = await headers.headers()
  const host = hostList.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const fullUrl = `${protocol}://${host}/dashboard/equipment/${resolvedParams.id}`
  
  const qrCodeDataUrl = await QRCode.toDataURL(fullUrl, { width: 128, margin: 1 })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 print:py-0 print:px-0">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link href={`/dashboard/equipment/${resolvedParams.id}`} className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Back to Equipment
        </Link>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm print:shadow-none print:border-0 print:p-0">
        <div className="flex justify-between items-start mb-8 border-b pb-6 print:border-black">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
            <p className="text-gray-500 mt-1 text-lg">{equipment.category || 'Uncategorized Equipment'}</p>
          </div>
          <div className="flex flex-col items-center">
            <img src={qrCodeDataUrl} alt="QR Code to Equipment Details" className="w-24 h-24 border border-gray-200 rounded-lg p-1" />
            <span className="text-[10px] text-gray-400 mt-1">Scan for details</span>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Equipment Specs</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-semibold text-gray-900">{equipment.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Serial Number</p>
                <p className="font-semibold text-gray-900">{equipment.serial_number || 'N/A'}</p>
              </div>
            </div>
          </section>

          <section className="bg-amber-50 rounded-lg p-5 border border-amber-100 print:border-black print:bg-transparent">
            <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3 print:text-black">Emergency Contact / Warranty</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-amber-700 print:text-gray-600">Provider</p>
                <p className="font-semibold text-gray-900">{equipment.provider_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-amber-700 print:text-gray-600">Policy Number</p>
                <p className="font-semibold text-gray-900">{equipment.policy_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-amber-700 print:text-gray-600">Phone</p>
                <p className="font-semibold text-gray-900">
                  {equipment.provider_phone ? (
                    <a href={`tel:${equipment.provider_phone}`} className="hover:underline">{equipment.provider_phone}</a>
                  ) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-amber-700 print:text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">
                  {equipment.provider_email ? (
                    <a href={`mailto:${equipment.provider_email}`} className="hover:underline">{equipment.provider_email}</a>
                  ) : 'N/A'}
                </p>
              </div>
            </div>
            
            {equipment.provider_notes && (
              <div className="mt-4 pt-4 border-t border-amber-200 print:border-black">
                <p className="text-sm text-amber-700 print:text-gray-600 mb-1">Notes</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{equipment.provider_notes}</p>
              </div>
            )}
          </section>
        </div>
        
        <div className="mt-12 text-center text-xs text-gray-400 print:block hidden">
          EquipTracker Emergency Card - Printed on {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
