import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function OnboardingPage(props: { searchParams: Promise<{ redirect?: string }> }) {
  const searchParams = await props.searchParams;
  const isAddingOrg = searchParams.redirect === 'back';
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const createBusiness = async (formData: FormData) => {
    'use server'
    const name = formData.get('name') as string
    
    if (!name) return
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    const businessId = crypto.randomUUID()
    
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Create business
    const { error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({ id: businessId, name })
      
    if (businessError) {
      console.error(businessError)
      return redirect(`/onboarding?error=${encodeURIComponent(businessError.message || 'Could not create business')}`)
    }
    
    // Create membership
    const { error: membershipError } = await supabaseAdmin
      .from('memberships')
      .insert({
        user_id: user.id,
        business_id: businessId,
        role: 'owner',
      })
      
    if (membershipError) {
      console.error(membershipError)
      return redirect(`/onboarding?error=${encodeURIComponent(membershipError.message || 'Could not create membership')}`)
    }

    // Set as active
    await supabaseAdmin
      .from('profiles')
      .update({ last_active_business_id: businessId })
      .eq('id', user.id)
    
    return redirect(`/dashboard/${businessId}/equipment`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {isAddingOrg && (
        <div className="absolute top-8 left-8">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      )}
      <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form
          className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
          action={createBusiness}
        >
          <h1 className="text-3xl font-bold mb-2">{isAddingOrg ? 'Create Organization' : 'Welcome to EquipTracker'}</h1>
          <p className="text-gray-500 mb-6">{isAddingOrg ? 'Create a new workspace for another business.' : "Let's set up your business workspace."}</p>
          
          <label className="text-md" htmlFor="name">
            Organization Name
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="name"
            placeholder="e.g. Joe's Diner"
            required
          />
          <button className="bg-blue-600 rounded-md px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors">
            {isAddingOrg ? 'Create' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
