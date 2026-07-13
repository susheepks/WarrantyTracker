import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (profile?.business_id) {
    return redirect('/dashboard')
  }

  const createBusiness = async (formData: FormData) => {
    'use server'
    const name = formData.get('name') as string
    
    if (!name) return
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    const businessId = crypto.randomUUID()
    
    // We use the service role key here because RLS policies for businesses and profiles
    // can create a chicken-and-egg problem during the very first insertion.
    // Since this is a secure Server Action and we already verified the user above, this is safe.
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
    
    // Create profile linked to business (using upsert in case it was partially created in a failed attempt)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        business_id: businessId,
        role: 'owner',
      })
      
    if (profileError) {
      console.error(profileError)
      return redirect(`/onboarding?error=${encodeURIComponent(profileError.message || 'Could not create profile')}`)
    }
    
    
    return redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form
          className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
          action={createBusiness}
        >
          <h1 className="text-3xl font-bold mb-2">Welcome to EquipTracker</h1>
          <p className="text-gray-500 mb-6">Let's set up your business workspace.</p>
          
          <label className="text-md" htmlFor="name">
            Business Name
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="name"
            placeholder="e.g. Joe's Diner"
            required
          />
          <button className="bg-blue-600 rounded-md px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors">
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  )
}
