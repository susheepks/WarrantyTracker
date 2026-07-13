import type { Metadata } from 'next'
import './globals.css'

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
      </body>
    </html>
  )
}
