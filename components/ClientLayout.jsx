'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LiveTournamentNotification from '@/components/live-tournament-notification'
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton'
import { handleAuthError } from '@/lib/supabase'

export default function ClientLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const isAdminRoute = pathname?.startsWith('/admin')
  const isHomePage = pathname === '/'

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          throw handleAuthError(error)
        }

        if (mounted) {
          setUser(user)
        }
      } catch (err) {
        console.error('Error getting user:', err)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        {!isAdminRoute && <Header />}
        <main className="flex-1">
          <div className="flex justify-center items-center min-h-[70vh]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2FF1B] border-t-transparent" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {!isAdminRoute && <Header />}
      <main className={`flex-1 ${!isAdminRoute && !isHomePage ? 'pt-28' : ''}`}>{children}</main>
      
      {/* Solo mostrar estos componentes si NO estamos en una ruta de admin */}
      {!isAdminRoute && (
        <>
          <Footer />
          <LiveTournamentNotification />
          <FloatingWhatsAppButton />
        </>
      )}
    </div>
  )
} 