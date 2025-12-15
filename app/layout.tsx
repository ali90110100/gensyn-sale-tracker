import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gensyn Sale Tracker | Live Investment Dashboard',
  description: 'Real-time tracking of Gensyn public sale investments on Sonar. Monitor USDC & USDT commitments live.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black`}>
        {children}
      </body>
    </html>
  )
}
