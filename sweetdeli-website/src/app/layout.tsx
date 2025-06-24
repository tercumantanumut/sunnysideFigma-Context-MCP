import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sweetdeli - Profile Settings',
  description: 'Manage your Sweetdeli account settings, login security, social accounts, and device history.',
  keywords: ['sweetdeli', 'profile', 'settings', 'account', 'security'],
  authors: [{ name: 'Sweetdeli Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
