import { useReducedMotion } from 'framer-motion'

export function SkeletonCard() {
  const shouldReduceMotion = useReducedMotion()
  const animateClass = shouldReduceMotion ? '' : 'animate-pulse'

  return (
    <div className={`bg-card border border-steel-light rounded-lg p-5 h-full flex flex-col ${animateClass}`}>
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-start gap-3 w-full">
          <div className="w-9 h-9 rounded bg-steel-light shrink-0" />
          <div className="w-full">
            <div className="h-5 bg-steel-light rounded w-3/4 mb-2" />
            <div className="h-4 bg-steel-light rounded w-1/2" />
          </div>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-steel-light grid grid-cols-2 gap-4">
        <div className="h-4 bg-steel-light rounded w-24" />
        <div className="h-4 bg-steel-light rounded w-16 justify-self-end" />
      </div>
    </div>
  )
}

export function SkeletonLine() {
  const shouldReduceMotion = useReducedMotion()
  const animateClass = shouldReduceMotion ? '' : 'animate-pulse'

  return (
    <div className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${animateClass}`}>
      <div className="w-full sm:w-2/3">
        <div className="h-5 bg-steel-light rounded w-3/4 mb-2" />
        <div className="h-4 bg-steel-light rounded w-1/2 mb-3" />
        <div className="h-3 bg-steel-light rounded w-1/3" />
      </div>
      <div className="w-full sm:w-32 h-12 bg-steel-light rounded-md" />
    </div>
  )
}

export function SkeletonTimelineEntry() {
  const shouldReduceMotion = useReducedMotion()
  const animateClass = shouldReduceMotion ? '' : 'animate-pulse'

  return (
    <div className={`relative pl-8 sm:pl-32 py-6 group ${animateClass}`}>
      <div className="flex flex-col sm:flex-row items-start mb-1 group-last:mb-0">
        <div className="hidden sm:block absolute left-0 w-24 text-right">
          <div className="h-4 bg-steel-light rounded w-16 ml-auto" />
        </div>
        <div className="absolute left-0 sm:left-28 w-8 h-8 rounded-full bg-steel-light border-4 border-surface -translate-x-1/2 flex items-center justify-center" />
        
        <div className="bg-card border border-steel-light rounded-lg p-4 w-full shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="h-5 bg-steel-light rounded w-1/3" />
          </div>
          <div className="h-4 bg-steel-light rounded w-full mb-1" />
          <div className="h-4 bg-steel-light rounded w-4/5" />
        </div>
      </div>
    </div>
  )
}
