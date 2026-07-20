'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Settings, Grid2x2, List, Search, Layers, ChevronDown } from 'lucide-react'
import Fuse from 'fuse.js'
import { motion, useReducedMotion } from 'framer-motion'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

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
  purchase_platform?: string | null
  platforms?: {
    name: string
    domain: string | null
    icon_override_url: string | null
  } | null
}

export function EquipmentListClient({ initialEquipment, businessId }: { initialEquipment: Equipment[], businessId: string }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [groupBy, setGroupBy] = useState<'none' | 'platform'>('none')
  const [groupSort, setGroupSort] = useState<'alpha' | 'count'>('alpha')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const shouldReduceMotion = useReducedMotion()

  const fuse = new Fuse(initialEquipment, {
    keys: ['name', 'category', 'model', 'id', 'purchase_platform', 'platforms.name'],
    threshold: 0.3,
  })

  // Unique platforms for filter
  const allPlatforms = Array.from(new Set(
    initialEquipment
      .map(e => e.platforms?.name || e.purchase_platform)
      .filter(Boolean)
  )).sort((a, b) => (a as string).localeCompare(b as string)) as string[]

  let filteredResults = searchQuery 
    ? fuse.search(searchQuery).map(result => result.item)
    : initialEquipment

  if (selectedPlatform !== 'all') {
    filteredResults = filteredResults.filter(e => {
      const pName = e.platforms?.name || e.purchase_platform
      return pName === selectedPlatform
    })
  }

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

  const renderEquipmentCard = (item: Equipment) => {
    const status = getWarrantyStatus(item.warranty_end_date)
    const healthScore = getHealthPercentage(item.warranty_end_date)
    const platformName = item.platforms?.name || item.purchase_platform

    return (
      <motion.div
        key={item.id}
        whileHover={shouldReduceMotion ? {} : { y: -2 }}
        className="motion-safe:duration-base motion-reduce:duration-0 h-full"
      >
        <Link href={`/dashboard/${businessId}/equipment/${item.id}`} className="block h-full">
          <div className={`bg-card border border-steel-light rounded-lg p-5 h-full flex flex-col hover:border-steel transition-colors duration-base border-l-4 border-l-status-${status.color}`}>
            
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded bg-status-${status.color}/10 text-status-${status.color} shrink-0`}>
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-ink font-display line-clamp-1">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-steel font-sans line-clamp-1">{item.category || 'Uncategorized'}</p>
                    {platformName && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-steel-light shrink-0" />
                        <div className="flex items-center gap-1.5 shrink-0" title={platformName}>
                          <PlatformIcon 
                            name={platformName}
                            domain={item.platforms?.domain}
                            iconOverrideUrl={item.platforms?.icon_override_url}
                            size={14}
                          />
                          <span className="text-xs font-medium text-steel truncate max-w-[80px]">{platformName}</span>
                        </div>
                      </>
                    )}
                  </div>
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
  }

  let content
  if (filteredResults.length === 0) {
    content = (
      <div className="py-12 text-center border-2 border-dashed border-steel-light rounded-lg">
        <Settings className="mx-auto h-12 w-12 text-steel mb-3" />
        <h3 className="text-lg font-medium font-display text-ink">No equipment found</h3>
        <p className="mt-1 text-sm font-sans text-steel">Adjust your search or add a new piece of equipment.</p>
      </div>
    )
  } else if (groupBy === 'platform') {
    const groups: Record<string, Equipment[]> = {}
    filteredResults.forEach(item => {
      const platformName = item.platforms?.name || item.purchase_platform || 'Other'
      if (!groups[platformName]) groups[platformName] = []
      groups[platformName].push(item)
    })

    Object.values(groups).forEach(groupItems => {
      groupItems.sort((a, b) => {
        const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0
        const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0
        return dateB - dateA
      })
    })

    const groupKeys = Object.keys(groups)
    if (groupSort === 'alpha') {
      groupKeys.sort((a, b) => {
        if (a === 'Other') return 1
        if (b === 'Other') return -1
        return a.localeCompare(b)
      })
    } else {
      groupKeys.sort((a, b) => {
        if (a === 'Other') return 1
        if (b === 'Other') return -1
        return groups[b].length - groups[a].length || a.localeCompare(b)
      })
    }

    content = (
      <div className="space-y-8">
        {groupKeys.map(key => {
          const groupItems = groups[key]
          const firstItemWithPlatform = groupItems.find(i => i.platforms?.name === key)
          return (
            <div key={key} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-steel-light">
                {key !== 'Other' && (
                  <PlatformIcon 
                    name={key} 
                    domain={firstItemWithPlatform?.platforms?.domain}
                    iconOverrideUrl={firstItemWithPlatform?.platforms?.icon_override_url}
                    size={20}
                  />
                )}
                <h2 className="text-lg font-display font-semibold text-ink">
                  {key} <span className="text-steel font-normal text-sm ml-1">({groupItems.length})</span>
                </h2>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                {groupItems.map(renderEquipmentCard)}
              </div>
            </div>
          )
        })}
      </div>
    )
  } else {
    content = (
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
        {filteredResults.map(renderEquipmentCard)}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="relative w-full lg:max-w-sm shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search equipment, model..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-steel-light rounded-md bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Platform Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-steel-light rounded-md text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms</option>
              {allPlatforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel pointer-events-none" />
          </div>

          <div className="h-6 w-px bg-steel-light hidden sm:block" />

          {/* Grouping Toggle */}
          <button
            onClick={() => setGroupBy(prev => prev === 'none' ? 'platform' : 'none')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors duration-fast ${groupBy === 'platform' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-steel-light text-ink hover:bg-surface'}`}
          >
            <Layers size={16} />
            Group by Platform
          </button>

          {/* Group Sort Options (Only visible when grouped) */}
          {groupBy === 'platform' && (
            <div className="relative shrink-0">
              <select
                value={groupSort}
                onChange={(e) => setGroupSort(e.target.value as 'alpha' | 'count')}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-steel-light rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="alpha">A-Z</option>
                <option value="count">Most Items</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel pointer-events-none" />
            </div>
          )}

          <div className="h-6 w-px bg-steel-light hidden sm:block" />

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white border border-steel-light rounded-md p-1 shrink-0 ml-auto sm:ml-0">
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
      </div>

      {content}
    </div>
  )
}
