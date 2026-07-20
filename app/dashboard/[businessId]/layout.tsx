import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Search } from 'lucide-react'
import { CommandPalette } from '@/components/CommandPalette'
import { OrgSwitcher } from '@/components/layout/OrgSwitcher'

export default async function DashboardLayout(props: {
  children: React.ReactNode,
  params: Promise<{ businessId: string }>
}) {
  const params = await props.params;
  const businessId = params.businessId;

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Verify membership for the requested businessId and get all memberships
  const { data: currentMembership } = await supabase
    .from('memberships')
    .select('role, businesses(name)')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .single()

  if (!currentMembership) {
    // If not a member, redirect to root dashboard handler
    redirect('/dashboard')
  }

  // Get all memberships for the switcher
  const { data: allMemberships } = await supabase
    .from('memberships')
    .select('business_id, businesses(name)')
    .eq('user_id', user.id)

  const organizations = allMemberships?.map(m => ({
    id: m.business_id,
    name: (m.businesses as any)?.name
  })) || []

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href={`/dashboard/${businessId}`} className="text-xl font-bold text-blue-600">
                  EquipTracker
                </Link>
              </div>
              <div className="ml-6 flex items-center space-x-4">
                <Link href={`/dashboard/${businessId}`} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link href={`/dashboard/${businessId}/equipment`} className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Equipment
                </Link>
                <Link href={`/dashboard/${businessId}/claims`} className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Claims
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center text-sm text-steel bg-surface border border-steel-light rounded-md px-3 py-1.5 font-sans cursor-pointer">
                <Search className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Search...</span>
                <kbd className="ml-2 font-mono text-xs bg-card px-1.5 rounded border border-steel-light">⌘K</kbd>
              </div>
              
              <OrgSwitcher organizations={organizations} currentOrgId={businessId} />

              <form action={signOut}>
                <button className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {props.children}
      </main>
      <CommandPalette businessId={businessId} />
    </div>
  )
}
