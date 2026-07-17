'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Settings, Grid2x2, List, Search } from 'lucide-react'
import Fuse from 'fuse.js'
import { motion, useReducedMotion } from 'framer-motion'

type Equipment = {
  id: string
  name: string
  warranty_end_date: string | null
  category: string | null
  purchase_date: string | null
  model: string | null
  price: number | null
  business_id: string
  created_at: string
}

export function EquipmentListClient({ initialEquipment }: { initialEquipment: Equipment[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const shouldReduceMotion = useReducedMotion()

  const fuse = new Fuse(initialEquipment, {
    keys: ['name', 'category', 'model', 'id'], // fuzzy matching fields
    threshold: 0.3,
  })

  const results = searchQuery 
    ? fuse.search(searchQuery).map(result => result.item)
    : initialEquipment

  const getWarrantyStatus = (endDate: string | null) => {
    if (!endDate) return { text: 'No Warranty', color: 'steel' }
    
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Expired', color: 'red' }
    if (diffDays <= 30) return { text: 'Expiring Soon', color: 'amber' }
    return { text: 'Active', color: 'green' }
  }

  // Calculate Health Badge % based on warranty diff
  const getHealthPercentage = (endDate: string | null) => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 0
    if (diffDays > 365) return 100
    return Math.round((diffDays / 365) * 100)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search equipment, model..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-steel-light rounded-md bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-steel-light rounded-md p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-sm transition-colors duration-fast ${viewMode === 'grid' ? 'bg-steel-light text-ink' : 'text-steel hover:bg-surface'}`}
            aria-label="Grid view"
          >
            <Grid2x2 size={16} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-sm transition-colors duration-fast ${viewMode === 'list' ? 'bg-steel-light text-ink' : 'text-steel hover:bg-surface'}`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-steel-light rounded-lg">
          <Settings className="mx-auto h-12 w-12 text-steel mb-3" />
          <h3 className="text-lg font-medium font-display text-ink">No equipment found</h3>
          <p className="mt-1 text-sm font-sans text-steel">Adjust your search or add a new piece of equipment.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {results.map((item) => {
            const status = getWarrantyStatus(item.warranty_end_date)
            const healthScore = getHealthPercentage(item.warranty_end_date)
            
            return (
              <motion.div
                key={item.id}
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                className="motion-safe:duration-base motion-reduce:duration-0 h-full"
              >
                <Link href={`/dashboard/equipment/${item.id}`} className="block h-full">
                  <div className={`bg-card border border-steel-light rounded-lg p-5 h-full flex flex-col hover:border-steel transition-colors duration-base border-l-4 border-l-status-${status.color}`}>
                    
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded bg-status-${status.color}/10 text-status-${status.color} shrink-0`}>
                          <Settings size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-ink font-display line-clamp-1">{item.name}</h3>
                          <p className="text-sm text-steel font-sans line-clamp-1">{item.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                      
                      <div className={`flex flex-col items-end gap-1 shrink-0`}>
                        <span className={`text-xs px-2 py-0.5 font-sans font-medium rounded bg-status-${status.color}/10 text-status-${status.color} whitespace-nowrap`}>
                          {status.text}
                        </span>
                        {item.warranty_end_date && (
                          <span className={`text-xs px-2 py-0.5 font-mono rounded bg-status-${status.color}/10 text-status-${status.color}`}>
                            {healthScore}% health
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-steel-light grid grid-cols-2 gap-4 text-xs font-sans text-steel">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="shrink-0" />
                        <span suppressHydrationWarning className="truncate">{item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'Unknown Date'}</span>
                      </div>
                      <div className="text-right">
                        {item.model && <span className="font-mono text-ink/70 truncate block">{item.model}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
