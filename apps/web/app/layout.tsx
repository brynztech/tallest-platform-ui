import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { WebProviders } from './_components/web-providers'
import { SiteNav } from './_components/site-nav'
import { Toaster } from '@brynzit/ui/components/ui/sonner'
import { SITE_URL } from './_lib/site'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Brynz — Find your next role', template: '%s · Brynz' },
  description: 'Brynz is an AI job search engine.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
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
