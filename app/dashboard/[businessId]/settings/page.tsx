import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Mail, Settings, UserPlus, Trash2 } from 'lucide-react'
import { createInvite, removeInvite } from '@/lib/actions/invites'

export default async function SettingsPage(props: { params: Promise<{ businessId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('business_id', params.businessId)
    .single()

  if (!membership) return redirect('/dashboard')
  const isOwner = membership.role === 'owner'

  // Fetch current members
  // Since we don't store emails in memberships natively easily (they are in auth.users), 
  // for a true production app we'd join auth.users or a public profiles table.
  // We assume 'profiles' has emails if we added it, but let's just show user IDs and roles for now, 
  // or use the auth.users if we have access (we don't without service role).
  const { data: members } = await supabase
    .from('memberships')
    .select('*, profiles(full_name)')
    .eq('business_id', params.businessId)

  // Fetch pending invites
  const { data: invites } = await supabase
    .from('business_invites')
    .select('*')
    .eq('business_id', params.businessId)

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-display">Organization Settings</h1>
        <p className="text-gray-500 mt-1">Manage your team and business preferences.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Users size={18} /> Team Members
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members?.map(m => (
            <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">{(m.profiles as any)?.full_name || 'Team Member'}</p>
                <p className="text-sm text-gray-500 font-mono text-xs">{m.user_id}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${m.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Mail size={18} /> Pending Invites
            </h2>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Invite New Staff</h3>
            <form action={async (formData) => {
              'use server'
              const email = formData.get('email') as string
              if (email) await createInvite(params.businessId, email)
            }} className="flex gap-3">
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="staff@example.com" 
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <UserPlus size={16} /> Send Invite
              </button>
            </form>
          </div>

          <div className="divide-y divide-gray-100">
            {invites?.map(inv => (
              <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{inv.email}</p>
                  <p className="text-sm text-gray-500">Invited on {new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <form action={async () => {
                  'use server'
                  await removeInvite(params.businessId, inv.id)
                }}>
                  <button type="submit" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Revoke Invite">
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            ))}
            {invites?.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">
                No pending invites.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
