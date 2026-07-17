'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Wrench, AlertTriangle, PlusCircle } from 'lucide-react'

type TimelineEntry = {
  id: string
  type: 'created' | 'maintenance' | 'claim'
  title: string
  date: string
  notes?: string | null
}

export function EquipmentTimelineClient({ items }: { items: TimelineEntry[] }) {
  const shouldReduceMotion = useReducedMotion()

  const getIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <Wrench className="w-4 h-4 text-status-green" />
      case 'claim': return <AlertTriangle className="w-4 h-4 text-status-amber" />
      case 'created': return <PlusCircle className="w-4 h-4 text-blue-500" />
      default: return null
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold font-display text-ink mb-6">History & Timeline</h2>
      <div className="relative border-l border-steel-light ml-4 sm:ml-28">
        {items.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            whileInView={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // duration-slow
            className="relative pl-8 sm:pl-10 py-4 group"
          >
            {/* Desktop Date Label */}
            <div className="hidden sm:block absolute right-[calc(100%+2rem)] w-24 text-right top-4">
              <span suppressHydrationWarning className="text-sm font-mono text-steel block">
                {new Date(item.date).toLocaleDateString()}
              </span>
            </div>
            
            {/* Timeline node */}
            <div className="absolute left-[-17px] top-4 w-8 h-8 rounded-full bg-surface border-4 border-white flex items-center justify-center shadow-sm">
              {getIcon(item.type)}
            </div>
            
            {/* Content card */}
            <div className="bg-white border border-steel-light rounded-lg p-4 shadow-sm hover:border-steel transition-colors duration-base">
              <div className="flex justify-between items-start mb-1 sm:hidden">
                <span suppressHydrationWarning className="text-xs font-mono text-steel">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-semibold text-ink font-display">{item.title}</h3>
              {item.notes && (
                <p className="text-sm text-steel font-sans mt-2">{item.notes}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
