import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string; error: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  const signIn = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      return redirect('/login?error=Could not authenticate user')
    }

    return redirect('/login?message=Check email to continue sign in process')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form
          className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
          action={signIn}
        >
          <h1 className="text-3xl font-bold mb-6">Sign in to EquipTracker</h1>
          <label className="text-md" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="email"
            placeholder="you@example.com"
            required
          />
          <button className="bg-blue-600 rounded-md px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors">
            Send Magic Link
          </button>
          
          {searchParams?.message && (
            <p className="mt-4 p-4 bg-green-100 text-green-800 text-center rounded-md">
              {searchParams.message}
            </p>
          )}
          {searchParams?.error && (
            <p className="mt-4 p-4 bg-red-100 text-red-800 text-center rounded-md">
              {searchParams.error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
