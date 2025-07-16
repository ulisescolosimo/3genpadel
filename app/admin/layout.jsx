'use client'
import '../globals.css'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider } from '@/components/AuthProvider'
import { useAuth } from '@/components/AuthProvider'
import { Spinner } from '@/components/ui/spinner'
import AdminHeader from '@/components/AdminHeader'

// Layout EXCLUSIVO para el panel de admin
export default function AdminLayout({ children }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    console.log('Usuario actual:', user)
    console.log('Estado de carga:', loading)
    console.log('Ruta actual:', pathname)

    if (!loading && !user && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [user, loading, pathname, router])

  if (loading) {
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

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
} 