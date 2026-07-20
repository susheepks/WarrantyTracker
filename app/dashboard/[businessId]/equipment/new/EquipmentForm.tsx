'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Square, Camera, Loader2 } from 'lucide-react'
import { createEquipment, extractEquipmentData } from '@/lib/actions/equipment'

type Template = {
  id: string
  category: string
  task_name: string
  frequency_days: number
}

export default function EquipmentForm({ templates, businessId }: { templates: Template[], businessId: string }) {
  const [category, setCategory] = useState('')
  const [suggestedTasks, setSuggestedTasks] = useState<Template[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [isExtracting, setIsExtracting] = useState(false)
  const [showWarrantyPrompt, setShowWarrantyPrompt] = useState(false)
  const [warrantySource, setWarrantySource] = useState<'manual' | 'extracted'>('manual')

  const nameRef = useRef<HTMLInputElement>(null)
  const modelRef = useRef<HTMLInputElement>(null)
  const serialRef = useRef<HTMLInputElement>(null)
  const purchasePlatformRef = useRef<HTMLInputElement>(null)
  const retailerRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)
  const purchaseDateRef = useRef<HTMLInputElement>(null)
  const warrantyMonthsRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Categories present in templates
  const uniqueCategories = Array.from(new Set(templates.map(t => t.category)))

  useEffect(() => {
    if (category) {
      const matches = templates.filter(t => t.category.toLowerCase() === category.toLowerCase())
      setSuggestedTasks(matches)
      setSelectedTaskIds(new Set(matches.map(m => m.id)))
    } else {
      setSuggestedTasks([])
      setSelectedTaskIds(new Set())
    }
  }, [category, templates])

  const toggleTask = (id: string) => {
    const next = new Set(selectedTaskIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedTaskIds(next)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const result = await extractEquipmentData(formData)
      if (result?.data) {
        if (nameRef.current && result.data.name) nameRef.current.value = result.data.name
        if (modelRef.current && result.data.model) modelRef.current.value = result.data.model
        if (serialRef.current && result.data.serial_number) serialRef.current.value = result.data.serial_number
        if (purchasePlatformRef.current && result.data.purchase_platform) purchasePlatformRef.current.value = result.data.purchase_platform
        if (retailerRef.current && result.data.retailer) retailerRef.current.value = result.data.retailer
        if (priceRef.current && result.data.price) priceRef.current.value = result.data.price
        if (purchaseDateRef.current && result.data.purchase_date) purchaseDateRef.current.value = result.data.purchase_date
        
        if (result.data.warranty_months !== null && result.data.warranty_months !== undefined) {
          if (warrantyMonthsRef.current) warrantyMonthsRef.current.value = result.data.warranty_months
          setWarrantySource('extracted')
          setShowWarrantyPrompt(false)
        } else {
          setWarrantySource('manual')
          setShowWarrantyPrompt(true)
        }
      } else {
        alert('Could not extract details. Please enter manually.')
      }
    } catch (err) {
      console.error(err)
      alert('Error extracting details. Please enter manually.')
    } finally {
      setIsExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-6">
        <Link href={`/dashboard/${businessId}/equipment`} className="text-blue-600 hover:underline flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={16} /> Back to Equipment
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Add Equipment</h1>
          
          <div>
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              {isExtracting ? 'Analyzing...' : 'Upload Document or Photo'}
            </button>
          </div>
        </div>
      </div>

      <form action={createEquipment} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
            <input ref={nameRef} name="name" required className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" placeholder="e.g. Commercial Fryer" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input 
              name="category" 
              list="categories"
              className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" 
              placeholder="e.g. Fryer, Walk-In Cooler" 
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
            <datalist id="categories">
              {uniqueCategories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input ref={modelRef} name="model" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" placeholder="e.g. TF-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number / Order No.</label>
            <input ref={serialRef} name="serial_number" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input ref={purchaseDateRef} type="date" name="purchase_date" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Platform</label>
            <input ref={purchasePlatformRef} name="purchase_platform" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" placeholder="e.g. Amazon, BestBuy" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retailer / Vendor</label>
            <input ref={retailerRef} name="retailer" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
            <input ref={priceRef} type="number" step="0.01" name="price" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" placeholder="0.00" />
          </div>

          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Length (Months)</label>
            
            {showWarrantyPrompt && (
              <div className="mb-3 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <p className="text-sm text-blue-800 mb-2 font-medium">This document doesn't show a warranty period — enter one manually, or skip if you're not sure.</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '30 Days', val: 1 },
                    { label: '90 Days', val: 3 },
                    { label: '1 Year', val: 12 },
                    { label: '2 Years', val: 24 },
                    { label: 'No Warranty', val: 0 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (warrantyMonthsRef.current) warrantyMonthsRef.current.value = preset.val.toString()
                        setWarrantySource('manual')
                        setShowWarrantyPrompt(false)
                      }}
                      className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded text-xs hover:bg-blue-50 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (warrantyMonthsRef.current) warrantyMonthsRef.current.value = ''
                      setWarrantySource('manual')
                      setShowWarrantyPrompt(false)
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded text-xs hover:bg-gray-50 transition-colors ml-auto"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
            
            <input ref={warrantyMonthsRef} type="number" name="warranty_months" className="w-full md:w-1/2 rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" placeholder="e.g. 12" />
            <input type="hidden" name="warranty_source" value={warrantySource} />
            <input type="hidden" name="businessId" value={businessId} />
          </div>
        </div>

        {suggestedTasks.length > 0 ? (
          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggested Maintenance Tasks</h3>
            <p className="text-xs text-gray-500 mb-4">We found typical maintenance tasks for {category}. Uncheck any you don't want to track.</p>
            <div className="space-y-3">
              {suggestedTasks.map(task => {
                const isSelected = selectedTaskIds.has(task.id)
                return (
                  <div key={task.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`} onClick={() => toggleTask(task.id)}>
                    <div className="mr-3 text-blue-600">
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{task.task_name}</p>
                      <p className="text-xs text-gray-500">Every {task.frequency_days} days</p>
                    </div>
                    {isSelected && (
                      <>
                        <input type="hidden" name="maintenance_task_name" value={task.task_name} />
                        <input type="hidden" name="maintenance_frequency" value={task.frequency_days} />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : category ? (
          <div className="pt-6 border-t border-gray-100">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center">
              <p className="text-sm text-gray-600">No maintenance tracked for this item — just here for warranty and receipt safekeeping.</p>
            </div>
          </div>
        ) : null}

        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
          <Link href={`/dashboard/${businessId}/equipment`} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Save Equipment
          </button>
        </div>
      </form>
    </div>
  )
}
