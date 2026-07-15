'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if we are already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone)
    if (isStandaloneMode) {
      setIsStandalone(true)
      return
    }

    // Check if dismissed previously
    if (localStorage.getItem('installPromptDismissed') === 'true') {
      return
    }

    // Sniff for iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    if (isIosDevice) {
      // Show for iOS after a slight delay
      const timer = setTimeout(() => setShowPrompt(true), 2000)
      return () => clearTimeout(timer)
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('installPromptDismissed', 'true')
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-lg sm:bottom-6 sm:left-auto sm:right-6 sm:w-96">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-0.5">
          <Download className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Install EquipTracker</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {isIOS 
              ? "Tap Share \u2192 Add to Home Screen for offline access." 
              : "Install the app for quick, offline access to your equipment."}
          </p>
          {!isIOS && (
            <button
              onClick={handleInstallClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Install Now
            </button>
          )}
        </div>
      </div>
      <button 
        onClick={handleDismiss}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg self-start -mt-1 -mr-1"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
