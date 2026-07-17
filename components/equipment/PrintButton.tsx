'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-md hover:bg-ink/90 transition-transform duration-fast active:scale-[0.97] text-sm font-medium font-sans"
    >
      <Printer size={16} /> Print / Save PDF
    </button>
  )
}
