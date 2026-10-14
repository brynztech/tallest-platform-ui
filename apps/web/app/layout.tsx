import type { Metadata } from 'next'
import { Figtree, Newsreader } from 'next/font/google'
import { WebProviders } from './_components/web-providers'
import { SiteNav } from './_components/site-nav'
import { SiteFooter } from './_components/site-footer'
import { SiteMotion } from './_components/site-motion'
import { Toaster } from '@brynzit/ui/components/ui/sonner'
import { SITE_URL } from './_lib/site'
import './globals.css'

const sans = Figtree({ subsets: ['latin'], variable: '--font-figtree' })
const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-newsreader' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Brynz', template: '%s · Brynz' },
  description:
    'Brynz connects exceptional engineers with high-growth startups, enterprise delivery teams and frontier AI labs.',
  icons: { icon: '/brand/brynz-mark.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <WebProviders>
          <SiteNav />
          {children}
          <SiteFooter />
          {/* Inside the providers so it mounts with the page (MSWProvider holds pages back in mock mode). */}
          <SiteMotion />
        </WebProviders>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  )
}
