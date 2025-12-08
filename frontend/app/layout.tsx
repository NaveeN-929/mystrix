import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MainContent } from '@/components/MainContent'
import { BackgroundEffects } from '@/components/BackgroundEffects'

export const metadata: Metadata = {
  title: 'mystrix 🎁 | Win Amazing Products!',
  description: 'Spin the wheel, open mystery boxes, and win amazing products! A fun and exciting shopping experience.',
  keywords: ['mystery box', 'spin wheel', 'contest', 'prizes', 'shopping'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">
        <BackgroundEffects />
        <Navbar />
        
        <MainContent>
          {children}
        </MainContent>

        <Footer />
      </body>
    </html>
  )
}

