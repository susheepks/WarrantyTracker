import type { Metadata, Viewport } from 'next'
import './globals.css'
import { InstallPrompt } from '@/components/InstallPrompt'

export const viewport: Viewport = {
  themeColor: '#0f172a',
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
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
