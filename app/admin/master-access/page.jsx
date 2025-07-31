'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/AuthProvider'
import { AlertCircle, Eye, EyeOff, User, Shield } from 'lucide-react'

export default function MasterAccessPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { updateImpersonatedUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !masterPassword) {
      setError('Por favor completa todos los campos.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          masterPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud')
      }

             if (data.success) {
         // Crear objeto de usuario impersonado
         const impersonatedUserData = {
           ...data.user,
           accessToken: data.accessToken,
           expires: data.expires,
           impersonated: true,
           impersonated_at: new Date().toISOString()
         }

         // Guardar en localStorage
         localStorage.setItem('impersonated_user', JSON.stringify(impersonatedUserData))

         // Actualizar estado inmediatamente
         updateImpersonatedUser(impersonatedUserData)

         toast({
           title: "Acceso concedido",
           description: `Accediendo como ${data.user.nombre} ${data.user.apellido}`,
           variant: "default"
         })

         // Redirigir al perfil del usuario con un delay más largo
         setTimeout(() => {
           router.push('/perfil')
         }, 1000)
       }

    } catch (err) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
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
              Acceso Maestro
            </CardTitle>
            <CardDescription className="text-gray-400">
              Ingresa el email de la cuenta y la contraseña maestra para acceder
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email de la cuenta
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="masterPassword" className="text-gray-300">
                  Contraseña Maestra
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="masterPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="pl-10 pr-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? "Accediendo..." : "Acceder"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/admin/dashboard')}
                  className="text-gray-400 hover:text-white"
                >
                  Volver al Dashboard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ⚠️ Esta funcionalidad es solo para administradores autorizados
          </p>
        </div>
      </div>
    </div>
  )
} 