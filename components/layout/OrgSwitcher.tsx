'use client'

import { useState, useRef, useEffect } from 'react'
import { Building, ChevronDown, Check, Plus } from 'lucide-react'
import { updateActiveOrgAndRedirect } from '@/lib/actions/orgs'
import Link from 'next/link'

type Org = {
  id: string
  name: string
}

export function OrgSwitcher({ organizations, currentOrgId }: { organizations: Org[], currentOrgId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentOrg = organizations.find(o => o.id === currentOrgId)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        <div className="bg-gray-100 p-1 rounded">
          <Building size={14} className="text-gray-600" />
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {currentOrg?.name || 'Loading...'}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Organizations</p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {organizations.map(org => (
              <button
                key={org.id}
                onClick={() => {
                  setIsOpen(false)
                  updateActiveOrgAndRedirect(org.id)
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${org.id === currentOrgId ? 'bg-blue-50/50' : ''}`}
              >
                <span className={`truncate ${org.id === currentOrgId ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                  {org.name}
                </span>
                {org.id === currentOrgId && <Check size={16} className="text-blue-600" />}
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-100 mt-1">
            <Link 
              href="/onboarding?redirect=back" 
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus size={16} />
              Create new organization
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
