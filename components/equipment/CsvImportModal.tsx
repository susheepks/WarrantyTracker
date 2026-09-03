'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { X, Upload, FileType, CheckCircle, AlertTriangle } from 'lucide-react'
import { importEquipment } from '@/lib/actions/import'

export function CsvImportModal({ businessId, onClose }: { businessId: string, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState<number | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Send parsed data to server action
          const res = await importEquipment(businessId, results.data)
          if (res.error) {
            setError(res.error)
          } else {
            setSuccessCount(res.count || 0)
          }
        } catch (err: any) {
          setError(err.message || 'Import failed')
        } finally {
          setLoading(false)
        }
      },
      error: (error) => {
        setError(error.message)
        setLoading(false)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-lg text-gray-900">Import CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {successCount !== null ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Import Successful</h3>
              <p className="text-gray-500 mb-6">Successfully imported {successCount} equipment items.</p>
              <button 
                onClick={onClose}
                className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV file containing your equipment list. Required columns are <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">name</span>. 
                  Optional columns include <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">category</span>, <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">model</span>, <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">serial_number</span>, <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">purchase_date</span>, <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">price</span>, <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">warranty_months</span>.
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    id="csv-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                    <FileType size={32} className="text-gray-400 mb-3" />
                    <span className="text-sm font-medium text-blue-600">Click to upload CSV</span>
                    <span className="text-xs text-gray-500 mt-1">or drag and drop</span>
                  </label>
                </div>

                {file && (
                  <div className="mt-4 p-3 bg-gray-50 rounded border flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium truncate">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={onClose}
                  className="flex-1 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <span className="animate-pulse">Importing...</span> : (
                    <>
                      <Upload size={16} />
                      Import Data
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
