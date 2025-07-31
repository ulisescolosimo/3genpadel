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
import { CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ActivarCuentaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: email, 2: password
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [jugador, setJugador] = useState(null)
  const [error, setError] = useState('')

  // Si hay email en la URL, usarlo
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      buscarJugador(emailParam)
    }
  }, [searchParams])

  const buscarJugador = async (emailToSearch) => {
    if (!emailToSearch) return

    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', emailToSearch.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // Verificar si es admin
        if (data.rol === 'admin') {
          setError('Los usuarios administradores no pueden usar esta funcionalidad.')
          return
        }

        // Verificar si ya tiene auth_id (ya configuró su contraseña)
        if (data.auth_id) {
          setError('Este usuario ya configuró su contraseña. Puede iniciar sesión directamente.')
          return
        }

        // Verificar si ya tiene password seteada
        if (data.password) {
          setError('Este usuario ya tiene una contraseña configurada. Puede iniciar sesión directamente.')
          return
        }

        // Si no tiene auth_id ni password pero tiene cuenta_activada, puede configurar su contraseña
        if (!data.auth_id && !data.password && data.cuenta_activada) {
          setJugador(data)
          setStep(2)
          toast({
            title: "Usuario encontrado",
            description: `${data.nombre} ${data.apellido || ''} - Configura tu contraseña`,
            variant: "default"
          })
          return
        }

        // Si no tiene cuenta_activada, auth_id ni password, puede activar su cuenta
        if (!data.cuenta_activada && !data.auth_id && !data.password) {
          setJugador(data)
          setStep(2)
          toast({
            title: "Usuario encontrado",
            description: `${data.nombre} ${data.apellido || ''} - Activa tu cuenta`,
            variant: "default"
          })
          return
        }
      } else {
        setError('No se encontró un usuario registrado con este email.')
      }
    } catch (error) {
      console.error('Error buscando usuario:', error)
      setError('Error al buscar el usuario. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Por favor ingresa un email válido.')
      return
    }
    await buscarJugador(email)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError('Por favor completa todos los campos.')
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

      // Llamar a la API para activar la cuenta
      const response = await fetch('/api/activar-cuenta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password,
          jugadorId: jugador.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al activar la cuenta')
      }

      toast({
        title: jugador?.cuenta_activada 
          ? "¡Contraseña configurada exitosamente!"
          : "¡Cuenta activada exitosamente!",
        description: "Ya puedes iniciar sesión con tu email y contraseña.",
        variant: "default"
      })

      // Redirigir al login
      router.push('/login?message=cuenta-activada')
    } catch (error) {
      console.error('Error activando cuenta:', error)
      setError(error.message || 'Error al activar la cuenta. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setJugador(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Activar cuenta de jugador
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === 1 
                ? "Ingresa tu email para verificar tu registro"
                : jugador?.cuenta_activada
                  ? "Configura tu contraseña para completar la activación"
                  : "Establece tu contraseña para activar tu cuenta"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                >
                  {loading ? 'Buscando...' : 'Buscar jugador'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Información del jugador */}
                {jugador && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">
                        {jugador.nombre} {jugador.apellido || ''}
                      </span>
                    </div>
                    <p className="text-green-300 text-sm mt-1">
                      {jugador.email}
                    </p>
                    {jugador.dni && (
                      <p className="text-green-300 text-sm mt-1">
                        DNI: {jugador.dni}
                      </p>
                    )}
                  </div>
                )}

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

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="flex-1 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                  >
                    {loading 
                      ? 'Activando...' 
                      : jugador?.cuenta_activada
                        ? 'Configurar Contraseña'
                        : 'Activar Cuenta'
                    }
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="text-[#E2FF1B] hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 