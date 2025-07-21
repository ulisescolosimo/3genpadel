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
        console.log('=== AUTH CALLBACK START ===')
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error obteniendo sesión:', sessionError)
          router.push('/')
          return
        }
        
        if (session) {
          console.log('Sesión obtenida:', {
            email: session.user.email,
            id: session.user.id,
            metadata: session.user.user_metadata
          })
          
          // Verificar si el usuario ya tiene un perfil en la tabla usuarios
          console.log('Buscando perfil existente...')
          const { data: profile, error: profileError } = await supabase
            .from("usuarios")
            .select("*")
            .eq("id", session.user.id)
            .single()

          console.log('Resultado búsqueda perfil:', { profile, profileError })

          // Si no tiene perfil, crearlo automáticamente usando la API
          if (!profile) {
            console.log('No se encontró perfil, creando uno automáticamente...')
            
            try {
              const response = await fetch('/api/create-user-auto', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: session.user.id,
                  email: session.user.email,
                  fullName: session.user.user_metadata?.full_name || "",
                  avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
                })
              })

              const result = await response.json()

              if (!response.ok) {
                console.error('Error en API create-user-auto:', result.error)
                throw new Error(result.error || 'Error al crear usuario automáticamente')
              }

              if (!result.success) {
                console.error('API create-user-auto falló:', result)
                throw new Error(result.error || 'Error desconocido al crear usuario')
              }

              console.log('Usuario creado automáticamente:', result.user)
            } catch (apiError) {
              console.error('Error llamando a create-user-auto:', apiError)
              
              // Fallback: intentar crear manualmente
              console.log('Intentando crear manualmente como fallback...')
              
              const fullName = session.user.user_metadata?.full_name || ""
              const nameParts = fullName.split(" ")
              const nombre = nameParts[0] || session.user.email?.split("@")[0] || ""
              const apellido = nameParts.slice(1).join(" ") || ""

              const userData = {
                id: session.user.id,
                email: session.user.email.toLowerCase(),
                nombre: nombre,
                apellido: apellido,
                dni: null,
                ranking_puntos: 0,
                cuenta_activada: true,
                rol: 'user',
                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
                nivel: "Principiante"
              }

              console.log('Datos a insertar (fallback):', userData)

              const { data: newProfile, error: insertError } = await supabase
                .from("usuarios")
                .insert(userData)
                .select()
                .single()

              if (insertError) {
                console.error('Error en fallback manual:', insertError)
                throw insertError
              }

              console.log('Usuario creado manualmente (fallback):', newProfile)
            }
          } else {
            console.log('Perfil existente encontrado:', profile)
            
            // Actualizar campos que puedan haber cambiado (avatar, nombre, etc.)
            const updateData = {}
            
            if (session.user.user_metadata?.avatar_url && profile.avatar_url !== session.user.user_metadata.avatar_url) {
              updateData.avatar_url = session.user.user_metadata.avatar_url
            }
            
            if (session.user.user_metadata?.picture && profile.avatar_url !== session.user.user_metadata.picture) {
              updateData.avatar_url = session.user.user_metadata.picture
            }
            
            if (Object.keys(updateData).length > 0) {
              console.log('Actualizando perfil con nuevos datos:', updateData)
              const { error: updateError } = await supabase
                .from("usuarios")
                .update(updateData)
                .eq("id", session.user.id)
              
              if (updateError) {
                console.error('Error actualizando perfil:', updateError)
              } else {
                console.log('Perfil actualizado correctamente')
              }
            }
          }

          // Verificar que el perfil existe antes de redirigir
          console.log('Verificando perfil final...')
          const { data: finalProfile, error: finalError } = await supabase
            .from("usuarios")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (finalError) {
            console.error('Error verificando perfil final:', finalError)
            throw finalError
          }

          console.log('Perfil final verificado:', finalProfile)

          // Redirigir al usuario
          console.log('Redirigiendo a:', redirectTo)
          router.push(redirectTo)
        } else {
          console.log('No hay sesión, redirigiendo a inicio')
          router.push('/')
        }
      } catch (error) {
        console.error('Error en el callback:', error)
        console.error('Detalles del error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
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