import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { MSWProvider } from './_components/msw-provider'
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
        <MSWProvider>{children}</MSWProvider>
      </body>
    </html>
  )
}
