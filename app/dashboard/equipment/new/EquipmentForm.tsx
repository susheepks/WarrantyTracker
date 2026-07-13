'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Square } from 'lucide-react'
import { createEquipment } from '../actions'

type Template = {
  id: string
  category: string
  task_name: string
  frequency_days: number
}

export default function EquipmentForm({ templates }: { templates: Template[] }) {
  const [category, setCategory] = useState('')
  const [suggestedTasks, setSuggestedTasks] = useState<Template[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())

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

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-6">
        <Link href="/dashboard/equipment" className="text-blue-600 hover:underline flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={16} /> Back to Equipment
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Equipment</h1>
      </div>

      <form action={createEquipment} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
            <input name="name" required className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" placeholder="e.g. Commercial Fryer" />
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
            <input name="model" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" placeholder="e.g. TF-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input name="serial_number" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input type="date" name="purchase_date" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retailer / Vendor</label>
            <input name="retailer" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
            <input type="number" step="0.01" name="price" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" placeholder="0.00" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Length (Months)</label>
            <input type="number" name="warranty_months" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-inherit text-gray-900" placeholder="e.g. 12" />
          </div>
        </div>

        {suggestedTasks.length > 0 && (
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
        )}

        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
          <Link href="/dashboard/equipment" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
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
