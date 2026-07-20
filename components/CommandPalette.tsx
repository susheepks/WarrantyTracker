'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Fuse from 'fuse.js'
import { Search, Settings, Wrench, AlertTriangle, Plus, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type SearchItem = {
  id: string
  title: string
  subtitle: string
  type: 'equipment' | 'task' | 'claim' | 'action'
  href?: string
  action?: () => void
}

export function CommandPalette({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (open && items.length === 0 && !loading) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id, name, model, serial_number, category')
      .eq('business_id', businessId)
      
    const { data: tasks } = await supabase
      .from('maintenance_schedules')
      .select('id, task_name, equipment(name)')
      
    const { data: claims } = await supabase
      .from('claims')
      .select('id, equipment_id, status')
      // claims doesn't easily join to equipment if we just want a name, we'll map what we have

    const loadedItems: SearchItem[] = []

    if (equipment) {
      equipment.forEach(e => {
        loadedItems.push({
          id: `eq-${e.id}`,
          title: e.name,
          subtitle: `Equipment • ${e.model || ''} ${e.serial_number || ''}`,
          type: 'equipment',
          href: `/dashboard/${businessId}/equipment/${e.id}`
        })
      })
    }

    if (tasks) {
      tasks.forEach(t => {
        loadedItems.push({
          id: `task-${t.id}`,
          title: t.task_name,
          subtitle: `Task • ${(t.equipment as any)?.name || ''}`,
          type: 'task',
          href: `/dashboard/${businessId}`
        })
      })
    }

    if (claims) {
      claims.forEach(c => {
        loadedItems.push({
          id: `claim-${c.id}`,
          title: `Claim for ${c.equipment_id}`,
          subtitle: `Status: ${c.status}`,
          type: 'claim',
          href: `/dashboard/${businessId}/claims`
        })
      })
    }

    // Static actions
    loadedItems.push({
      id: 'action-add-eq',
      title: 'Add equipment',
      subtitle: 'Create a new equipment record',
      type: 'action',
      href: `/dashboard/${businessId}/equipment/new`
    })
    
    setItems(loadedItems)
    setLoading(false)
  }

  const fuse = useMemo(() => new Fuse(items, {
    keys: ['title', 'subtitle'],
    threshold: 0.3,
  }), [items])

  const results = query ? fuse.search(query).map(r => r.item) : items

  const handleSelect = (item: SearchItem) => {
    setOpen(false)
    if (item.action) {
      item.action()
    } else if (item.href) {
      router.push(item.href)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'equipment': return <Settings className="w-4 h-4 text-steel" />
      case 'task': return <Wrench className="w-4 h-4 text-steel" />
      case 'claim': return <AlertTriangle className="w-4 h-4 text-steel" />
      case 'action': return <Plus className="w-4 h-4 text-steel" />
      default: return <Settings className="w-4 h-4 text-steel" />
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Command.Dialog 
          open={open} 
          onOpenChange={setOpen}
          label="Global Command Menu"
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32 p-4 bg-ink/40 backdrop-blur-sm"
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} // duration-base and ease-out-custom
            className="w-full max-w-xl bg-card rounded-xl shadow-2xl border border-steel-light overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-3 border-b border-steel-light">
              <Search className="w-5 h-5 text-steel mr-3 shrink-0" />
              <Command.Input 
                value={query}
                onValueChange={setQuery}
                placeholder="Search equipment, tasks, or claims..." 
                className="flex-1 bg-transparent text-ink font-sans outline-none placeholder:text-steel"
              />
            </div>
            
            <Command.List className="max-h-80 overflow-y-auto p-2 scroll-smooth">
              <Command.Empty className="p-6 text-center text-sm text-steel font-sans">
                {loading ? 'Searching...' : 'No results found.'}
              </Command.Empty>
              
              {/* Static Actions Group */}
              {!query && (
                <Command.Group heading="Actions" className="px-2 py-1 text-xs font-semibold text-steel font-sans uppercase tracking-wider">
                  {items.filter(i => i.type === 'action').map(item => (
                    <Command.Item
                      key={item.id}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 px-3 py-2 mt-1 rounded-md cursor-pointer aria-selected:bg-surface aria-selected:text-ink text-ink/80 transition-colors duration-fast"
                    >
                      {getIcon(item.type)}
                      <div>
                        <div className="font-medium font-sans">{item.title}</div>
                        <div className="text-xs text-steel font-sans">{item.subtitle}</div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Dynamic Results */}
              {results.length > 0 && (
                <Command.Group heading={query ? 'Results' : 'Recent'} className="px-2 py-1 mt-2 text-xs font-semibold text-steel font-sans uppercase tracking-wider">
                  {results.filter(i => i.type !== 'action').map(item => (
                    <Command.Item
                      key={item.id}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 px-3 py-2 mt-1 rounded-md cursor-pointer aria-selected:bg-surface aria-selected:text-ink text-ink/80 transition-colors duration-fast"
                    >
                      {getIcon(item.type)}
                      <div>
                        <div className="font-medium font-sans">{item.title}</div>
                        <div className="text-xs text-steel font-sans line-clamp-1">{item.subtitle}</div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  )
}
