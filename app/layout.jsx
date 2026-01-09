import './globals.css'
import { Montserrat } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout'
import { Toaster } from '@/components/ui/toaster'
import LiveTournamentNotification from '@/components/live-tournament-notification'
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton'
import { Toaster as SonnerToaster } from 'sonner'

import Footer from '@/components/Footer'
import { AuthProvider } from '@/components/AuthProvider'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import { TournamentProvider } from '@/hooks/useTournamentData'
import { WhatsAppVisibilityProvider } from '@/hooks/useWhatsAppVisibility'

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
  title: '3gen Padel - Academia de Pádel en Argentina',
  description: 'Academia de pádel profesional en Argentina. Clases con profesores expertos, torneos, merchandising y formación completa de jugadores. Unitea la mejor academia de pádel.',
  keywords: 'pádel, academia de pádel, clases de pádel, torneos de pádel, profesores de pádel, Argentina, 3gen padel',
  authors: [{ name: '3gen Padel Academy' }],
  creator: '3gen Padel Academy',
  publisher: '3gen Padel Academy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://3genpadel.com.ar'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://3genpadel.com.ar',
    siteName: '3gen Padel',
    title: '3gen Padel Academy - Academia de Pádel en Argentina',
    description: 'Academia de pádel profesional en Argentina. Clases con profesores expertos, torneos, merchandising y formación completa de jugadores. Unitea la mejor academia de pádel.',
    images: [
      {
        url: '/images/logo/logo.png',
        width: 1200,
        height: 630,
        alt: '3gen Padel Academy - Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3gen Padel Academy - Academia de Pádel en Argentina',
    description: 'Academia de pádel profesional en Argentina. Clases con profesores expertos, torneos, merchandising y formación completa de jugadores.',
    images: ['/images/logo/logo.png'],
    creator: '@3genpadel',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico?v=2',
        type: 'image/x-icon',
      },
      {
        url: '/images/logo/logo.png?v=2',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/images/logo/logo.png?v=2',
        type: 'image/png',
        sizes: '16x16',
      },
    ],
    apple: [
      {
        url: '/images/logo/logo.png?v=2',
        type: 'image/png',
        sizes: '180x180',
      },
    ],
    shortcut: '/favicon.ico?v=2',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '3gen Padel Academy',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={montserrat.className}>
      <head>
        <link rel="icon" href="/favicon.ico?v=2" type="image/x-icon" />
        <link rel="icon" href="/images/logo/logo.png?v=2" type="image/png" />
        <link rel="icon" href="/images/logo/logo.png?v=2" type="image/png" sizes="32x32" />
        <link rel="icon" href="/images/logo/logo.png?v=2" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/images/logo/logo.png?v=2" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" type="image/x-icon" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Academia de pádel profesional en Argentina. Clases con profesores expertos, torneos, merchandising y formación completa de jugadores." />
        <meta property="og:title" content="3gen Padel Academy - Academia de Pádel en Argentina" />
        <meta property="og:description" content="Academia de pádel profesional en Argentina. Clases con profesores expertos, torneos, merchandising y formación completa de jugadores." />
        <meta property="og:image" content="https://3genpadel.com.ar/images/logo/logo.png" />
        <meta property="og:url" content="https://3genpadel.com.ar" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="3gen Padel Academy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="3gen Padel Academy - Academia de Pádel en Argentina" />
        <meta name="twitter:description" content="Academia de pádel profesional en Argentina. Clases con profesores expertos, torneos, merchandising y formación completa de jugadores." />
        <meta name="twitter:image" content="https://3genpadel.com.ar/images/logo/logo.png" />
      </head>
      <body className={montserrat.className}>
        <AuthProvider>
          <TournamentProvider>
            <WhatsAppVisibilityProvider>
              <ImpersonationBanner />
              <ClientLayout>
                <main>
                  {children}
                </main>
              </ClientLayout>
              <Toaster />
              <SonnerToaster richColors position="top-right" />
            </WhatsAppVisibilityProvider>
          </TournamentProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 