"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export default function RegistroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Si hay email en la URL, usarlo
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true)
      setError('')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Error en registro con Google:', error)
      setError('Error al registrarse con Google. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !nombre || !apellido || !dni || !password || !confirmPassword) {
      setError('Por favor completa todos los campos.')
      return
    }

    // Validar formato de DNI (7-8 dígitos)
    const dniRegex = /^\d{7,8}$/
    if (!dniRegex.test(dni.trim())) {
      setError('El DNI debe tener 7 u 8 dígitos numéricos.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Crear usuario usando la API
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          dni: dni.trim(),
          password: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la cuenta')
      }

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al crear la cuenta')
      }

      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Tu cuenta ha sido creada. Iniciando sesión...",
        variant: "default"
      })

      // Iniciar sesión automáticamente con las credenciales
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password: password
        })

        if (signInError) {
          // Si hay error al iniciar sesión, redirigir al login
          console.error('Error iniciando sesión:', signInError)
          router.push('/login?message=cuenta-creada')
          return
        }

        if (signInData.user) {
          // Redirigir al perfil
          router.push('/perfil')
        }
      } catch (signInError) {
        console.error('Error iniciando sesión:', signInError)
        router.push('/login?message=cuenta-creada')
      }
    } catch (error) {
      console.error('Error en registro:', error)
      
      if (error.message.includes('Ya existe un usuario con ese email')) {
        setError('Ya existe un usuario con ese email. Puedes iniciar sesión o activar tu cuenta.')
      } else if (error.message.includes('Ya existe un usuario con ese DNI')) {
        setError('Ya existe un usuario con ese DNI.')
      } else {
        setError(error.message || 'Error al crear la cuenta. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl py-4 md:py-10">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Crear cuenta
            </CardTitle>
            <CardDescription className="text-gray-400">
              Regístrate para acceder a todas las funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Botón de Google */}
            <Button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? 'Registrando...' : 'Continuar con Google'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-black/80 px-3 text-xs text-gray-400">O regístrate con email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-white">Nombre</Label>
                  <Input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Juan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido" className="text-white">Apellido</Label>
                  <Input
                    id="apellido"
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Pérez"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="jugador@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni" className="text-white">DNI</Label>
                  <Input
                    id="dni"
                    type="text"
                    value={dni}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 8) {
                        setDni(value)
                      }
                    }}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="12345678"
                    maxLength={8}
                    required
                  />
                  <p className="text-xs text-gray-400">7 u 8 dígitos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/10 border-white/20 text-white pr-10"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white/10 border-white/20 text-white pr-10"
                      placeholder="Repite tu contraseña"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
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
                disabled={loading || !email || !nombre || !apellido || !dni || !password || !confirmPassword}
                className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  ¿Ya tienes una cuenta?{' '}
                  <Link href="/login" className="text-[#E2FF1B] hover:underline font-medium">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <Link 
                  href="/" 
                  className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

