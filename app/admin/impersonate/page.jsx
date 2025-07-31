'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, User, Shield, ArrowLeft } from 'lucide-react'

export default function ImpersonatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const user_id = searchParams.get('user_id')
    const accessToken = searchParams.get('access_token')

    if (!user_id || !accessToken) {
      setError('Parámetros de acceso inválidos')
      setLoading(false)
      return
    }

    // Verificar el token de acceso
    try {
      const tokenData = JSON.parse(Buffer.from(accessToken, 'base64').toString())
      
      if (tokenData.expires < Date.now()) {
        setError('El token de acceso ha expirado')
        setLoading(false)
        return
      }

      if (tokenData.user_id !== user_id) {
        setError('Token de acceso inválido')
        setLoading(false)
        return
      }

      // Obtener información del usuario
      fetchUserInfo(user_id)
    } catch (err) {
      setError('Error al verificar el token de acceso')
      setLoading(false)
    }
  }, [searchParams])

  const fetchUserInfo = async (userId) => {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !usuario) {
        setError('Usuario no encontrado')
        setLoading(false)
        return
      }

      setUser(usuario)
      setLoading(false)
    } catch (err) {
      setError('Error al obtener información del usuario')
      setLoading(false)
    }
  }

     const handleImpersonate = () => {
     if (!user) return

     // Guardar información del usuario en localStorage con token de acceso
     localStorage.setItem('impersonated_user', JSON.stringify({
       ...user,
       accessToken: searchParams.get('access_token'),
       expires: Date.now() + (5 * 60 * 1000), // 5 minutos
       impersonated: true,
       impersonated_at: new Date().toISOString()
     }))

     toast({
       title: "Acceso concedido",
       description: `Accediendo como ${user.nombre} ${user.apellido}`,
       variant: "default"
     })

     // Redirigir al perfil del usuario con un pequeño delay para asegurar que el estado se actualice
     setTimeout(() => {
       router.push('/perfil')
     }, 100)
   }

  const handleCancel = () => {
    router.push('/admin/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Verificando acceso...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/10">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <CardTitle className="text-xl font-bold text-white">
                Error de Acceso
              </CardTitle>
              <CardDescription className="text-gray-400">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="text-xl font-bold text-white">
              Confirmar Acceso
            </CardTitle>
            <CardDescription className="text-gray-400">
              ¿Deseas acceder como este usuario?
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {user && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {user.nombre} {user.apellido}
                    </h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rol:</span>
                    <span className="text-white">{user.rol || 'Usuario'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nivel:</span>
                    <span className="text-white">{user.nivel || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Puntos:</span>
                    <span className="text-white">{user.ranking_puntos || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cuenta activada:</span>
                    <span className={`${user.cuenta_activada ? 'text-green-400' : 'text-red-400'}`}>
                      {user.cuenta_activada ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImpersonate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Acceder
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                ⚠️ Esta acción te permitirá ver la aplicación como este usuario
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 