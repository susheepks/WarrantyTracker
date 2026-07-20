import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import QRCode from 'qrcode'
import { PrintButton } from '@/components/equipment/PrintButton'

export default async function EquipmentCardPage(props: { params: Promise<{ id: string, businessId: string }> }) {
  const resolvedParams = await props.params
  const supabase = await createClient()

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!equipment) {
    return redirect(`/dashboard/${resolvedParams.businessId}/equipment`)
  }

  // Generate QR code containing the actual equipment details as plain text
  // so it works entirely offline and without requiring authentication.
  const qrPayload = `EQUIPMENT DETAILS
Name: ${equipment.name}
Category: ${equipment.category || 'N/A'}
Model: ${equipment.model || 'N/A'}
Serial: ${equipment.serial_number || 'N/A'}
Provider: ${equipment.provider_name || 'N/A'}
Phone: ${equipment.provider_phone || 'N/A'}`

  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, { width: 128, margin: 1 })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 print:py-0 print:px-0">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link href={`/dashboard/${resolvedParams.businessId}/equipment/${resolvedParams.id}`} className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Back to Equipment
        </Link>
        <PrintButton />
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
                <p className="text-sm text-gray-500">Serial Number / Order No.</p>
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
