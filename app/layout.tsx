import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Suspense } from 'react'
import Loading from '../components/loading'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Statements',
  description: 'An interactive document application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
      </body>
    </html>
  )
}
