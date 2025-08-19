import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'ChatGPT Clone',
  description: 'A ChatGPT UI clone',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full bg-white">
        <body
          className={cn('h-full w-full bg-gray-900 text-gray-100 antialiased', 'flex flex-col')}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
