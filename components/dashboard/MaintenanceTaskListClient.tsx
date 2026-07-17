'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, Search, RotateCcw } from 'lucide-react'
import Fuse from 'fuse.js'
import { toast } from 'sonner'
import { markMaintenanceComplete } from '@/lib/actions/equipment'

type MaintenanceTask = {
  id: string
  task_name: string
  next_due_date: string
  frequency_days: number
  equipment: { name: string } | null
}

export function MaintenanceTaskListClient({ 
  initialTasks 
}: { 
  initialTasks: MaintenanceTask[]
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasTouch, setHasTouch] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    setHasTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  const fuse = new Fuse(tasks, {
    keys: ['task_name', 'equipment.name'],
    threshold: 0.3,
  })

  const results = searchQuery 
    ? fuse.search(searchQuery).map(res => res.item)
    : tasks

  const completeTask = (task: MaintenanceTask, skipUndo: boolean = false) => {
    if (skipUndo) {
      // Direct completion for desktop
      setTasks(prev => prev.filter(t => t.id !== task.id))
      toast.success('Task marked complete')
      markMaintenanceComplete(task.id, task.frequency_days)
      return
    }

    // Hide optimistically
    setTasks(prev => prev.filter(t => t.id !== task.id))

    toast('Task marked complete', {
      duration: 4000,
      action: {
        label: 'Undo',
        onClick: () => {
          // Restore task
          setTasks(prev => [...prev, task].sort((a, b) => 
            new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime()
          ))
          toast.success('Completion undone')
        }
      },
      onAutoClose: () => {
        // Only run server action if it auto-closes without undo
        markMaintenanceComplete(task.id, task.frequency_days)
      },
      onDismiss: () => {
        // Also run if user manually swipes the toast away
        markMaintenanceComplete(task.id, task.frequency_days)
      }
    })
  }

  const today = new Date()

  return (
    <div className="bg-white border border-steel-light rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="bg-surface px-6 py-4 border-b border-steel-light flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel w-4 h-4" />
          <input 
            type="text" 
            placeholder="Filter tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-steel-light rounded-md bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
          />
        </div>
      </div>

      <div className="divide-y divide-steel-light relative overflow-hidden">
        <AnimatePresence>
          {results.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="p-8 text-center text-steel"
             >
               <CheckCircle2 size={48} className="mx-auto text-status-green/60 mb-3" />
               <p className="font-medium font-display text-ink">All caught up!</p>
               <p className="text-sm font-sans">No tasks found.</p>
             </motion.div>
          ) : (
            results.map((task) => {
              const isOverdue = new Date(task.next_due_date) < today
              return (
                <motion.div 
                  key={task.id}
                  layout={!shouldReduceMotion}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.2 }}
                  className="relative group bg-white"
                >
                  {/* Swipe affordance background (green with check icon) */}
                  {hasTouch && (
                    <div className="absolute inset-y-0 left-0 right-0 bg-status-green flex items-center px-6">
                      <CheckCircle2 className="text-white" size={24} />
                      <span className="text-white font-medium ml-2">Complete</span>
                    </div>
                  )}

                  {/* Foreground draggable area */}
                  <motion.div
                    drag={hasTouch ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={{ left: 0, right: 0.5 }}
                    onDragEnd={(e, info) => {
                      if (info.offset.x > 100) {
                        completeTask(task, false)
                      }
                    }}
                    className="relative bg-white z-10 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-ink font-display">{task.task_name}</h3>
                      <p className="text-sm text-steel font-sans flex items-center gap-1 mt-1">
                        {task.equipment?.name}
                      </p>
                      <p suppressHydrationWarning className={`text-xs font-medium font-mono mt-2 flex items-center gap-1 ${isOverdue ? 'text-status-red' : 'text-status-amber'}`}>
                        <Clock size={14} />
                        {isOverdue ? 'Overdue: ' : 'Due: '}
                        {new Date(task.next_due_date).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Fallback button for desktop/mouse users */}
                    <button 
                      onClick={() => completeTask(task, true)}
                      className="w-full sm:w-auto min-h-[48px] px-6 py-2 bg-status-green/10 text-status-green font-medium font-sans rounded-md border border-status-green/20 hover:bg-status-green/20 transition-transform duration-fast active:scale-[0.97] flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      Mark Complete
                    </button>
                  </motion.div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
