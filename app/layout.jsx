import './globals.css'
import { Inter, Montserrat } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout'
import { Toaster } from '@/components/ui/toaster'
import LiveTournamentNotification from '@/components/live-tournament-notification'
import FloatingRankingsButton from '@/components/FloatingRankingsButton'
import { Toaster as SonnerToaster } from 'sonner'
import { Toaster as HotToaster } from 'react-hot-toast'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })
const montserrat = Montserrat({ 
  subsets: ['latin'],
  display: 'swap',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export const metadata = {
  title: '3gen Padel',
  description: 'Tu club de pádel en Madrid',
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
  // Verificar si estamos en una ruta de admin
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')

  console.log('Admin route:', isAdminRoute)

  return (
    <html lang="es" className={montserrat.className}>
      <head>
        <link rel="icon" href="/images/logo/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo/favicon.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={montserrat.className}>
        <AuthProvider>
          {isAdminRoute ? (
            children
          ) : (
            <ClientLayout>
              <main>
                {children}
              </main>
            </ClientLayout>
          )}
          <Footer />
          <Toaster />
          <SonnerToaster richColors position="top-right" />
          <HotToaster position="top-right" />
          {!isAdminRoute && (
            <>
              <LiveTournamentNotification />
              <FloatingRankingsButton />
            </>
          )}
        </AuthProvider>
      </body>
    </html>
  )
} 