'use client'
import '../globals.css'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider } from '@/components/AuthProvider'
import { useAuth } from '@/components/AuthProvider'
import { Spinner } from '@/components/ui/spinner'
import AdminHeader from '@/components/AdminHeader'
import { supabase } from '@/lib/supabase'

// Layout EXCLUSIVO para el panel de admin - solo usuarios con rol admin pueden acceder
export default function AdminLayout({ children }) {
  const { user, loading, impersonatedUser } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [verificandoAdmin, setVerificandoAdmin] = useState(true)
  const [esAdmin, setEsAdmin] = useState(false)

  useEffect(() => {
    const verificarAccesoAdmin = async () => {
      // Página de login: permitir acceso sin verificar admin
      if (pathname === '/admin/login') {
        setVerificandoAdmin(false)
        return
      }

      // Sin usuario autenticado: redirigir a login
      if (!loading && !user) {
        setVerificandoAdmin(false)
        router.push('/admin/login')
        return
      }

      // Si está impersonando, no permitir acceso al panel admin (está viendo como otro usuario)
      if (impersonatedUser) {
        setVerificandoAdmin(false)
        setEsAdmin(false)
        router.push('/perfil')
        return
      }

      if (!user) return

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          setEsAdmin(false)
          router.push('/admin/login')
          return
        }

        const res = await fetch('/api/auth/check-admin', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()

        if (!data.isAdmin) {
          setEsAdmin(false)
          router.push('/')
          return
        }

        setEsAdmin(true)
      } catch (err) {
        console.error('Error verificando admin:', err)
        setEsAdmin(false)
        router.push('/admin/login')
      } finally {
        setVerificandoAdmin(false)
      }
    }

    verificarAccesoAdmin()
  }, [user, loading, pathname, impersonatedUser, router])

  if (loading || verificandoAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Si no hay usuario y no estamos en la página de login, no renderizamos nada
  if (!user && pathname !== '/admin/login') {
    return null
  }

  // Si no es admin (y no estamos en login), no renderizar (ya se redirigió)
  if (pathname !== '/admin/login' && !esAdmin) {
    return null
  }

  // Si estamos en la página de login, no mostramos el header
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-black">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    )
  }

  // Si estamos en circuitooka, no mostramos el header viejo
  const isCircuitookaRoute = pathname?.startsWith('/admin/circuito3gen')

  return (
    <div className="min-h-screen bg-black">
      {!isCircuitookaRoute && <AdminHeader />}
      <main className={!isCircuitookaRoute ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  )
} 