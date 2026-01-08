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
import { AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  useEffect(() => {
    // Mostrar mensaje si viene de activación de cuenta, registro o restablecimiento
    const message = searchParams.get('message')
    if (message === 'cuenta-activada') {
      toast({
        title: "¡Cuenta activada exitosamente!",
        description: "Ya puedes iniciar sesión con tu email y contraseña.",
        variant: "default"
      })
    } else if (message === 'cuenta-creada') {
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Ya puedes iniciar sesión con tu email y contraseña.",
        variant: "default"
      })
    } else if (message === 'password-reset') {
      toast({
        title: "¡Contraseña restablecida!",
        description: "Ya puedes iniciar sesión con tu nueva contraseña.",
        variant: "default"
      })
    }
  }, [searchParams, toast])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Por favor completa todos los campos.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      })

      if (error) {
        throw error
      }

      if (data.user) {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión exitosamente.",
          variant: "default"
        })

        // Redirigir a la página principal
        router.push('/')
      }
    } catch (error) {
      console.error('Error en login:', error)
      
      if (error.message.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Por favor confirma tu email antes de iniciar sesión.')
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
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
      console.error('Error en login con Google:', error)
      setError('Error al iniciar sesión con Google. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    
    if (!resetEmail) {
      setError('Por favor ingresa tu email.')
      return
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(resetEmail)) {
      setError('Por favor ingresa un email válido.')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Verificar si el usuario existe en Auth antes de enviar el email
      const checkResponse = await fetch('/api/check-user-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail.toLowerCase() })
      })

      const checkData = await checkResponse.json()

      if (!checkData.inAuth) {
        setError('No se encontró una cuenta con este email en nuestro sistema. Verifica que el email sea correcto.')
        setLoading(false)
        return
      }

      // Si el usuario solo tiene OAuth (Google), mostrar mensaje especial
      if (checkData.isOAuthOnly) {
        setError('Tu cuenta está vinculada con Google. Para cambiar tu contraseña, inicia sesión con Google. Si necesitas una contraseña para tu cuenta, contacta con soporte.')
        setLoading(false)
        return
      }

      // Verificar que la URL de redirección sea válida
      // IMPORTANTE: Esta URL debe estar configurada en Supabase Dashboard > Authentication > URL Configuration > Redirect URLs
      const redirectUrl = `${window.location.origin}/restablecer-contrasena`
      
      console.log('Enviando email de recuperación a:', resetEmail.toLowerCase())
      console.log('URL de redirección:', redirectUrl)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      // Intentar primero con el método estándar
      const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail.toLowerCase(), {
        redirectTo: redirectUrl
      })

      if (error) {
        console.error('Error detallado de Supabase:', {
          code: error.code,
          message: error.message,
          status: error.status
        })
        
        // Si es un error 500 o unexpected_failure, intentar con la API admin como alternativa
        if (error.status === 500 || error.code === 'unexpected_failure' || error.message.includes('unexpected_failure')) {
          console.log('Intentando método alternativo con API admin...')
          
          try {
            const adminResponse = await fetch('/api/reset-password-admin', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: resetEmail.toLowerCase() })
            })

            const adminData = await adminResponse.json()

            if (adminData.isOAuthOnly) {
              setError(adminData.error)
              setLoading(false)
              return
            }

            if (!adminResponse.ok) {
              throw new Error(adminData.error || 'Error en método alternativo')
            }

            // Si el método alternativo funcionó, mostrar éxito
            setResetSuccess(true)
            toast({
              title: "Email enviado",
              description: "Revisa tu correo para restablecer tu contraseña. Si no lo recibes en unos minutos, verifica tu carpeta de spam y la configuración de email en Supabase.",
              variant: "default"
            })
            return
          } catch (adminError) {
            console.error('Error en método alternativo:', adminError)
            // Continuar con el mensaje de error original
          }
        }
        
        // Manejar diferentes tipos de errores
        if (error.message.includes('email') || error.message.includes('user')) {
          setError('No se pudo enviar el email. Verifica que el email sea correcto y que tengas una cuenta registrada.')
        } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
          setError('Has solicitado demasiados emails. Por favor espera unos minutos antes de intentar nuevamente.')
        } else if (error.message.includes('authentication failed') || error.message.includes('535 5.7.8')) {
          setError('Error de autenticación SMTP: Las credenciales de email en Supabase son incorrectas. Ve a Supabase Dashboard → Settings → Auth → SMTP Settings y verifica el Username y Password. Si usas Gmail, asegúrate de usar una App Password, no tu contraseña normal.')
        } else if (error.message.includes('unexpected_failure') || error.code === 'unexpected_failure' || error.status === 500) {
          setError(`Error al enviar el email. Verifica en Supabase Dashboard: 1) Authentication → URL Configuration → Agrega "${redirectUrl}" en Redirect URLs. 2) Settings → Auth → SMTP Settings debe estar configurado correctamente (el error más común es credenciales incorrectas). 3) Authentication → Email Templates → Reset password debe tener un template configurado.`)
        } else if (error.message.includes('redirect')) {
          setError('Error de configuración: La URL de redirección no está permitida. Por favor agrega esta URL en Supabase Dashboard > Authentication > URL Configuration > Redirect URLs: ' + redirectUrl)
        } else {
          setError(`Error: ${error.message || 'Error desconocido al enviar el email'}`)
        }
        return
      }

      // Si llegamos aquí, el email se envió exitosamente
      setResetSuccess(true)
      toast({
        title: "Email enviado",
        description: "Revisa tu correo para restablecer tu contraseña. Si no lo recibes en unos minutos, verifica tu carpeta de spam.",
        variant: "default"
      })
    } catch (error) {
      console.error('Error inesperado al enviar email de recuperación:', error)
      setError('Error inesperado al enviar el email. Por favor intenta nuevamente más tarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              {showPasswordReset ? 'Recuperar contraseña' : 'Iniciar sesión'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {showPasswordReset 
                ? 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña'
                : 'Ingresa tus credenciales para acceder a tu cuenta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showPasswordReset ? (
              // Formulario de recuperación de contraseña
              <>
                {resetSuccess ? (
                  <div className="space-y-4">
                    <Alert className="bg-green-500/10 border-green-500/20">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-400">
                        Hemos enviado un enlace de recuperación a <strong>{resetEmail}</strong>. 
                        Revisa tu correo y sigue las instrucciones para restablecer tu contraseña.
                      </AlertDescription>
                    </Alert>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowPasswordReset(false)
                        setResetSuccess(false)
                        setResetEmail('')
                        setError('')
                      }}
                      className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                    >
                      Volver al login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-white">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
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
                      disabled={loading || !resetEmail}
                      className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                    >
                      {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowPasswordReset(false)
                        setResetEmail('')
                        setError('')
                      }}
                      className="w-full text-gray-400 hover:text-white"
                    >
                      Volver al login
                    </Button>
                  </form>
                )}
              </>
            ) : (
              // Formulario de login normal
              <>
                {/* Botón de Google */}
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
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
                  {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black/80 px-3 text-xs text-gray-400">O continúa con</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-white">Contraseña</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordReset(true)
                          setError('')
                        }}
                        className="text-xs text-[#E2FF1B] hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/10 border-white/20 text-white pr-10"
                        placeholder="Tu contraseña"
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

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                  >
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </Button>
                </form>

                <div className="mt-6 space-y-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">
                      ¿No tienes una cuenta?{' '}
                      <Link href="/registro" className="text-[#E2FF1B] hover:underline font-medium">
                        Regístrate aquí
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 