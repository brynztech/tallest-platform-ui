import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { WebProviders } from './_components/web-providers'
import { SiteNav } from './_components/site-nav'
import { Toaster } from '@brynzit/ui/components/ui/sonner'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Brynzit — Find your next role',
  description: 'The talent platform built for speed.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="bg-background text-foreground font-sans antialiased">
        <WebProviders>
          <SiteNav />
          {children}
        </WebProviders>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  )
}
