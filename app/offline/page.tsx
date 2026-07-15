import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 text-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">You're Offline</h1>
        <p className="text-slate-500 mb-6">
          Some pages may not be available without an internet connection. Check your network and try again.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
