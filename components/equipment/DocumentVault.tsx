'use client'

import { useState } from 'react'
import { FileText, Upload, Trash2, Download, Loader2 } from 'lucide-react'
import { uploadDocument, deleteDocument, getSignedUrl } from '@/lib/actions/documents'

type Document = {
  id: string
  file_name: string
  file_path: string
  file_size: number
  created_at: string
}

export function DocumentVault({ 
  businessId, 
  equipmentId, 
  documents 
}: { 
  businessId: string, 
  equipmentId: string, 
  documents: Document[] 
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Enforce 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be smaller than 5MB')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadDocument(businessId, equipmentId, formData)
    if (result.error) {
      alert(result.error)
    }
    
    setIsUploading(false)
    e.target.value = '' // Reset input
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete ${doc.file_name}?`)) return
    
    setIsDeleting(doc.id)
    const result = await deleteDocument(businessId, equipmentId, doc.id, doc.file_path)
    if (result.error) alert(result.error)
    setIsDeleting(null)
  }

  const handleDownload = async (doc: Document) => {
    const result = await getSignedUrl(doc.file_path)
    if (result.error) {
      alert(result.error)
      return
    }
    
    // Open in new tab or trigger download
    if (result.url) {
      window.open(result.url, '_blank')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText size={18} />
          Documents & Attachments
        </h2>
        
        <div className="relative">
          <input 
            type="file" 
            id="doc-upload" 
            className="hidden" 
            onChange={handleUpload}
            disabled={isUploading}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          />
          <label 
            htmlFor="doc-upload" 
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${
              isUploading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload File
          </label>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-500">
          No documents attached. Upload receipts, manuals, or warranties here.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <li key={doc.id} className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-md transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 text-gray-500 rounded">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">{doc.file_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(doc)}
                  disabled={isDeleting === doc.id}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {isDeleting === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
