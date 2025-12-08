import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'

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
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {/* Floating Circles */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200/30 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-20 w-40 h-40 bg-lavender-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-mint-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-peach-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-sky-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <Navbar />
        
        <main className="relative z-10 pt-20">
          {children}
        </main>

        {/* Cute Footer */}
        <footer className="relative z-10 mt-20 py-8 text-center">
          <div className="flex items-center justify-center gap-2 text-pink-400">
            <span className="text-2xl">🎀</span>
            <p className="font-medium">Made with love by mystrix</p>
            <span className="text-2xl">🎀</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">© 2024 All rights reserved ✨</p>
        </footer>
      </body>
    </html>
  )
}

