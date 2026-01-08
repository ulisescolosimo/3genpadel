'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle } from 'lucide-react'

export default function Circuito3GenLayout({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setCheckingAdmin(true)

        // Si no hay usuario autenticado, no es admin
        if (!user) {
          setIsAdmin(false)
          setCheckingAdmin(false)
          return
        }

        // Verificar si el usuario tiene rol 'admin' en la tabla usuarios
        const { data: usuario, error } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user.id)
          .single()

        if (error || !usuario) {
          console.error('Error al verificar rol de usuario:', error)
          setIsAdmin(false)
          return
        }

        const userIsAdmin = usuario.rol === 'admin'
        setIsAdmin(userIsAdmin)

        // Si no es admin, redirigir al home
        if (!userIsAdmin) {
          router.push('/')
        }
      } catch (error) {
        console.error('Error al verificar admin:', error)
        setIsAdmin(false)
        router.push('/')
      } finally {
        setCheckingAdmin(false)
      }
    }

    if (!authLoading) {
      checkAdminStatus()
    }
  }, [user, authLoading, router])

  // Mostrar spinner mientras se carga la autenticación o se verifica el rol
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Si no hay usuario o no es admin, mostrar mensaje de acceso denegado
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h1>
          <p className="text-white/70 mb-6">
            Solo los administradores pueden acceder a esta sección.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-[#E2FF1B] text-black rounded-lg font-medium hover:bg-[#E2FF1B]/90 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  // Si es admin, mostrar el contenido
  return <>{children}</>
}
