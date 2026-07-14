'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'

export async function startClaim(equipmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: claim, error } = await supabase
    .from('claims')
    .insert({
      equipment_id: equipmentId,
      status: 'draft'
    })
    .select('id')
    .single()

  if (error || !claim) {
    console.error('Failed to start claim:', error)
    return
  }

  redirect(`/dashboard/claims/${claim.id}`)
}

export async function generateAiClaim(claimId: string, issueDescription: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch claim and equipment details
  const { data: claim } = await supabase
    .from('claims')
    .select(`
      id,
      equipment:equipment_id (
        name,
        category,
        model,
        serial_number,
        purchase_date,
        retailer,
        businesses:business_id (
          name
        )
      )
    `)
    .eq('id', claimId)
    .single()

  if (!claim || !claim.equipment) {
    return { error: 'Claim or Equipment not found' }
  }

  const eq = claim.equipment as any
  const businessName = eq.businesses?.name || 'Our Company'

  const prompt = `
    You are a professional business manager at ${businessName}.
    Write a highly professional, assertive (but polite) warranty claim letter to a manufacturer or retailer.
    
    Equipment Details:
    - Name: ${eq.name}
    - Model: ${eq.model || 'Unknown'}
    - Serial Number: ${eq.serial_number || 'Unknown'}
    - Purchased on: ${eq.purchase_date || 'Unknown'}
    - Retailer: ${eq.retailer || 'Unknown'}
    
    Issue Description:
    "${issueDescription}"
    
    The letter should be ready to copy and paste into an email body. Do not include placeholder blocks like "[Your Name]" if you can avoid it, just leave it as a standard sign-off from "${businessName} Management". Make it persuasive, clear, and request immediate warranty service, repair, or replacement.
  `

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    let draftText = response.text().trim()

    // Save to database
    await supabase
      .from('claims')
      .update({
        issue_description: issueDescription,
        draft_text: draftText
      })
      .eq('id', claimId)

    revalidatePath(`/dashboard/claims/${claimId}`)
    return { success: true }
  } catch (err) {
    console.error('AI Error:', err)
    return { error: 'Failed to generate letter. Please try again.' }
  }
}

export async function submitClaim(formData: FormData) {
  const claimId = formData.get('claim_id') as string
  const draftText = formData.get('draft_text') as string
  
  const supabase = await createClient()
  await supabase
    .from('claims')
    .update({
      draft_text: draftText,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', claimId)

  redirect('/dashboard/claims')
}
