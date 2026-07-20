'use client'

import { useState, useRef } from 'react'
import { generateAiClaim, submitClaim } from '@/lib/actions/claims'
import { Loader2, Wand2 } from 'lucide-react'

export default function ClaimForm({ claim, businessId }: { claim: any, businessId: string }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftText, setDraftText] = useState(claim.draft_text || '')
  
  const issueRef = useRef<HTMLTextAreaElement>(null)

  const handleGenerate = async () => {
    const issue = issueRef.current?.value
    if (!issue) {
      alert('Please describe the issue first.')
      return
    }

    setIsGenerating(true)
    try {
      const res = await generateAiClaim(claim.id, issue)
      if (res?.error) {
        alert(res.error)
      } else {
        // We could fetch the updated claim, but for simplicity we rely on the server 
        // to revalidate the path and push the new draftText down via props.
        // Actually, since revalidatePath doesn't immediately update state here, 
        // a page reload or router.refresh() would be needed. 
        // Better yet, just reload.
        window.location.reload()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to generate letter.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (claim.status === 'submitted') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="bg-green-50 text-green-800 p-4 rounded-md mb-6 border border-green-200">
          <h3 className="font-semibold">Claim Submitted</h3>
          <p className="text-sm mt-1">This warranty claim was submitted on {new Date(claim.submitted_at).toLocaleString()}.</p>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Issue Description</h3>
        <p className="text-gray-700 mb-6 bg-gray-50 p-4 rounded-md text-sm">{claim.issue_description}</p>
        
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Final Claim Letter</h3>
        <div className="text-gray-700 bg-gray-50 p-4 rounded-md text-sm whitespace-pre-wrap border border-gray-200">
          {claim.draft_text}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2 text-gray-900">1. Describe the Issue</h2>
        <p className="text-sm text-gray-500 mb-4">Briefly explain what went wrong (e.g. "it stopped getting cold yesterday").</p>
        <textarea 
          ref={issueRef}
          className="w-full h-24 rounded-md border border-gray-300 p-3 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe the issue here..."
          defaultValue={claim.issue_description || ''}
        />
        
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-4 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          {isGenerating ? 'Generating...' : 'Draft AI Claim Letter'}
        </button>
      </div>

      {draftText && (
        <form action={submitClaim} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <input type="hidden" name="claim_id" value={claim.id} />
          <input type="hidden" name="businessId" value={businessId} />
          
          <h2 className="text-lg font-semibold mb-2 text-gray-900">2. Review & Submit</h2>
          <p className="text-sm text-gray-500 mb-4">Review the AI-generated professional letter below. You can edit it before submitting.</p>
          
          <textarea 
            name="draft_text"
            className="w-full h-96 rounded-md border border-gray-300 p-4 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
          />
          
          <div className="mt-4 flex justify-end">
            <button 
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Submit Claim
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
