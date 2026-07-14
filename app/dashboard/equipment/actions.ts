'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function extractEquipmentData(formData: FormData) {
  const file = formData.get('image') as File
  if (!file || !file.size) return { error: 'No file provided' }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `
      Analyze this photo of an equipment/appliance manufacturer sticker or nameplate.
      Extract the following information if available and return it strictly as a JSON object:
      - name: A short generic name for the equipment (e.g. "Refrigerator", "Fryer") based on the manufacturer name or model
      - model: The exact model number or name
      - serial_number: The exact serial number

      Return ONLY the raw JSON object, without markdown formatting or backticks. Example:
      { "name": "Commercial Oven", "model": "OVEN-123", "serial_number": "SN98765" }
    `

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type || 'image/jpeg'
      }
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text().trim()
    
    // Extract JSON block using regex to handle conversational filler
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return { data: JSON.parse(jsonMatch[0]) }
    } else {
      console.error("Gemini Extraction Error: No JSON found. Raw text:", text)
      return { error: 'No JSON found in response' }
    }
  } catch (error) {
    console.error("Gemini Extraction Error:", error)
    return { error: 'Failed to extract data from image' }
  }
}

export async function createEquipment(formData: FormData) {
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const model = formData.get('model') as string
  const serial_number = formData.get('serial_number') as string
  const purchase_date = formData.get('purchase_date') as string
  const retailer = formData.get('retailer') as string
  const priceStr = formData.get('price') as string
  const warranty_monthsStr = formData.get('warranty_months') as string

  if (!name) return

  const price = priceStr ? parseFloat(priceStr) : null
  const warranty_months = warranty_monthsStr ? parseInt(warranty_monthsStr, 10) : null
  
  let warranty_end_date = null
  if (purchase_date && warranty_months) {
    const date = new Date(purchase_date)
    date.setMonth(date.getMonth() + warranty_months)
    warranty_end_date = date.toISOString().split('T')[0]
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) return redirect('/onboarding')

  // Insert equipment
  const { data: equipment, error: eqError } = await supabase
    .from('equipment')
    .insert({
      business_id: profile.business_id,
      name,
      category,
      model,
      serial_number,
      purchase_date: purchase_date || null,
      retailer,
      price,
      warranty_months,
      warranty_end_date
    })
    .select()
    .single()

  if (eqError || !equipment) {
    console.error(eqError)
    return
  }

  // Insert selected maintenance schedules
  const selectedTaskNames = formData.getAll('maintenance_task_name')
  const selectedTaskFrequencies = formData.getAll('maintenance_frequency')

  if (selectedTaskNames.length > 0) {
    const schedules = selectedTaskNames.map((taskName, idx) => {
      const freq = parseInt(selectedTaskFrequencies[idx] as string, 10)
      const nextDue = new Date()
      nextDue.setDate(nextDue.getDate() + freq)
      return {
        equipment_id: equipment.id,
        task_name: taskName,
        frequency_days: freq,
        next_due_date: nextDue.toISOString().split('T')[0]
      }
    })

    const { error: scheduleError } = await supabase
      .from('maintenance_schedules')
      .insert(schedules)

    if (scheduleError) {
      console.error(scheduleError)
    }
  }

  redirect('/dashboard/equipment')
}

export async function markMaintenanceComplete(scheduleId: string, frequencyDays: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create log
  const { error: logError } = await supabaseAdmin
    .from('maintenance_logs')
    .insert({
      schedule_id: scheduleId,
      completed_by: user.id,
      status: 'completed'
    })

  if (logError) {
    console.error('Failed to create maintenance log:', logError)
  }

  // Update next_due_date = today + frequency_days
  if (isNaN(frequencyDays)) frequencyDays = 7 // Fallback if NaN
  
  const nextDue = new Date()
  nextDue.setDate(nextDue.getDate() + frequencyDays)

  const { error: updateError } = await supabaseAdmin
    .from('maintenance_schedules')
    .update({ next_due_date: nextDue.toISOString().split('T')[0] })
    .eq('id', scheduleId)

  if (updateError) {
    console.error('Failed to update maintenance schedule:', updateError)
  }
}
