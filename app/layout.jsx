import './globals.css'
import { Inter } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout'
import { Toaster } from '@/components/ui/toaster'
import LiveTournamentNotification from '@/components/live-tournament-notification'
import FloatingRankingsButton from '@/components/FloatingRankingsButton'
import { Toaster as SonnerToaster } from 'sonner'
import { Toaster as HotToaster } from 'react-hot-toast'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export const metadata = {
  title: '3gen Padel Academy',
  description: 'Plataforma de torneos de pádel',
  icons: {
    icon: [
      {
        url: '/images/logo/favicon.png',
        type: 'image/png',
      }
    ],
    apple: [
      {
        url: '/images/logo/favicon.png',
        type: 'image/png',
      }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '3gen Padel Academy',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="icon" href="/images/logo/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo/favicon.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className}>
        <ClientLayout>
          <main className="pt-32">
            {children}
          </main>
          <Footer />
        </ClientLayout>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
        <HotToaster position="top-right" />
        <LiveTournamentNotification />
        <FloatingRankingsButton />
      </body>
    </html>
  )
} 