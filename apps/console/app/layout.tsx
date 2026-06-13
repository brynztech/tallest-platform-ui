import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ConsoleProviders } from './_components/console-providers'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Brynzit Console',
  description: 'Internal operations console',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${geist.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased">
        <ConsoleProviders>{children}</ConsoleProviders>
      </body>
    </html>
  )
}
