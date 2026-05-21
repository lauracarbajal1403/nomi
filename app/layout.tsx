import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nominik',
  description: 'Your intelligent AI assistant for conversations and help',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: 'https://ibb.co/wFKMKbpZ', media: '(prefers-color-scheme: light)' },
      { url: 'https://ibb.co/wFKMKbpZ', media: '(prefers-color-scheme: dark)' },
      { url: 'https://ibb.co/wFKMKbpZ', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}