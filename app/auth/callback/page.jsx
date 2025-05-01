"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Spinner } from "@/components/ui/spinner"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Verificar si el usuario ya tiene un perfil
          const { data: profile } = await supabase
            .from("usuarios")
            .select("*")
            .eq("id", session.user.id)
            .single()

          // Si no tiene perfil, crearlo
          if (!profile) {
            const { error: profileError } = await supabase
              .from("usuarios")
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  nombre: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
                  avatar_url: session.user.user_metadata?.avatar_url,
                  nivel: "Principiante",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
              ])

            if (profileError) throw profileError
          }

          // Redirigir al usuario
          router.push(redirectTo)
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Error en el callback:', error)
        router.push('/')
      }
    }

    handleAuthCallback()
  }, [router, redirectTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Efecto de partículas */}
      <div className="absolute inset-0">
        <div className="absolute w-full h-full bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      {/* Gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#E2FF1B]/10 via-purple-500/10 to-[#E2FF1B]/10 animate-gradient-x" />

      {/* Contenido principal */}
      <div className="relative z-10 text-center space-y-6">
        <div className="relative">
          <Spinner className="w-12 h-12 text-[#E2FF1B] mx-auto mb-4 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-[#E2FF1B]/20 animate-ping" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Completando autenticación</h2>
          <p className="text-gray-400">Por favor, espera un momento mientras configuramos tu cuenta...</p>
        </div>
      </div>

      {/* Efectos de fondo */}
      <div className="absolute top-1/2 left-0 w-full h-full -translate-y-1/2 pointer-events-none">
        <div className="absolute top-1/4 left-[10%] w-32 h-32 bg-[#E2FF1B]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-[10%] w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-300" />
      </div>
    </div>
  )
} 