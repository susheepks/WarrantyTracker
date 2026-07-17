import type { Metadata, Viewport } from 'next'
import { Barlow_Semi_Condensed, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { InstallPrompt } from '@/components/InstallPrompt'
import { Toaster } from 'sonner'

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-barlow',
  display: 'swap',
})

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#FAFAF9',
}

export const metadata: Metadata = {
  title: 'EquipTracker',
  description: 'Equipment Uptime & Warranty Manager',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${plexSans.variable} ${plexMono.variable} font-sans antialiased`}>
        {children}
        <InstallPrompt />
        <Toaster 
          toastOptions={{
            classNames: {
              toast: 'bg-card text-ink border border-gray-200 shadow-sm font-sans',
              title: 'font-semibold',
              description: 'text-gray-500',
              success: 'bg-status-green/10 text-status-green border-status-green/20',
              error: 'bg-status-red/10 text-status-red border-status-red/20',
            }
          }}
        />
      </body>
    </html>
  )
}
