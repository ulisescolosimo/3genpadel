'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Trophy,
  Calendar,
  Users,
  PlayCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Target,
  Calculator,
  AlertTriangle,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export default function CircuitookaDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    etapasActivas: 0,
    totalInscripciones: 0,
    partidosPendientes: 0,
    partidosJugados: 0,
    jugadoresActivos: 0
  })
  const [etapasActivas, setEtapasActivas] = useState([])
  const [partidosRecientes, setPartidosRecientes] = useState([])
  const [recalculandoPromedios, setRecalculandoPromedios] = useState(false)
  
  // Estados para registro de usuarios
  const [registrandoUsuario, setRegistrandoUsuario] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellido: '',
    dni: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errorRegistro, setErrorRegistro] = useState('')
  const [usuarioCreado, setUsuarioCreado] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      await Promise.all([
        fetchStats(),
        fetchEtapasActivas(),
        fetchPartidosRecientes()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar los datos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Etapas activas
      const { count: etapasActivas } = await supabase
        .from('circuito3gen_etapas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activa')

      // Total inscripciones
      const { count: totalInscripciones } = await supabase
        .from('circuito3gen_inscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activa')

      // Partidos pendientes
      const { count: partidosPendientes } = await supabase
        .from('circuito3gen_partidos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      // Partidos jugados
      const { count: partidosJugados } = await supabase
        .from('circuito3gen_partidos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'jugado')

      // Jugadores activos (únicos)
      const { data: inscripciones } = await supabase
        .from('circuito3gen_inscripciones')
        .select('usuario_id')
        .eq('estado', 'activa')

      const jugadoresUnicos = new Set(inscripciones?.map(i => i.usuario_id) || [])
      const jugadoresActivos = jugadoresUnicos.size

      setStats({
        etapasActivas: etapasActivas || 0,
        totalInscripciones: totalInscripciones || 0,
        partidosPendientes: partidosPendientes || 0,
        partidosJugados: partidosJugados || 0,
        jugadoresActivos
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      throw error
    }
  }

  const fetchEtapasActivas = async () => {
    try {
      const { data, error } = await supabase
        .from('circuito3gen_etapas')
        .select('*')
        .eq('estado', 'activa')
        .order('fecha_inicio', { ascending: false })
        .limit(3)

      if (error) throw error
      setEtapasActivas(data || [])
    } catch (error) {
      console.error('Error fetching etapas:', error)
    }
  }

  const fetchPartidosRecientes = async () => {
    try {
      const { data, error } = await supabase
        .from('circuito3gen_partidos')
        .select(`
          *,
          division:circuito3gen_divisiones (
            numero_division,
            nombre
          )
        `)
        .eq('estado', 'pendiente')
        .order('fecha_partido', { ascending: true })
        .order('horario', { ascending: true })
        .limit(5)

      if (error) throw error
      setPartidosRecientes(data || [])
    } catch (error) {
      console.error('Error fetching partidos:', error)
    }
  }

  const recalcularPromediosGlobales = async () => {
    // Confirmar acción
    if (!confirm('¿Estás seguro de que deseas recalcular los promedios globales de TODOS los jugadores?\n\nEsta acción puede tomar varios minutos dependiendo de la cantidad de jugadores y partidos.\n\nEsta acción se recomienda cuando:\n- Se han corregido resultados de partidos\n- Los promedios no están sincronizados\n- Se necesita una recalculación masiva')) {
      return
    }

    try {
      setRecalculandoPromedios(true)
      
      // Obtener token de sesión para autenticación
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.')
      }

      const response = await fetch('/api/circuito3gen/recalcular-promedios-globales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al recalcular promedios')
      }

      toast({
        title: 'Éxito',
        description: result.message || 'Promedios globales recalculados correctamente',
        variant: 'default'
      })

      // Mostrar resumen si hay datos
      if (result.data) {
        console.log('Resumen del recálculo:', result.data)
        if (result.data.total_errores > 0) {
          toast({
            title: 'Advertencia',
            description: `Recálculo completado con ${result.data.total_errores} error(es). Revisa la consola para más detalles.`,
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      console.error('Error al recalcular promedios globales:', error)
      toast({
        title: 'Error',
        description: error.message || 'Error al recalcular los promedios globales',
        variant: 'destructive'
      })
    } finally {
      setRecalculandoPromedios(false)
    }
  }

  const handleRegistroUsuario = async (e) => {
    e.preventDefault()
    setErrorRegistro('')
    setUsuarioCreado(null)

    // Validaciones
    if (!formData.email || !formData.nombre || !formData.apellido || !formData.dni || !formData.password) {
      setErrorRegistro('Por favor completa todos los campos requeridos.')
      return
    }

    // Validar formato de DNI (7-8 dígitos)
    const dniRegex = /^\d{7,8}$/
    if (!dniRegex.test(formData.dni.trim())) {
      setErrorRegistro('El DNI debe tener 7 u 8 dígitos numéricos.')
      return
    }

    // Validar que la contraseña tenga al menos 6 caracteres
    if (formData.password.length < 6) {
      setErrorRegistro('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    try {
      setRegistrandoUsuario(true)

      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          dni: formData.dni.trim(),
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el usuario')
      }

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al crear el usuario')
      }

      toast({
        title: '¡Usuario creado exitosamente!',
        description: `El usuario ${data.user.nombre} ${data.user.apellido} ha sido registrado correctamente.`,
        variant: 'default'
      })

      setUsuarioCreado({
        ...data.user,
        tempPassword: data.tempPassword,
        updated: data.updated
      })

      // Limpiar formulario
      setFormData({
        email: '',
        nombre: '',
        apellido: '',
        dni: '',
        password: ''
      })
    } catch (error) {
      console.error('Error en registro de usuario:', error)
      setErrorRegistro(error.message || 'Error al crear el usuario. Inténtalo de nuevo.')
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el usuario',
        variant: 'destructive'
      })
    } finally {
      setRegistrandoUsuario(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Dashboard Circuito 3GEN
          </h1>
          <p className="text-gray-400 mt-2">Vista general del circuito</p>
        </div>
        <Button
          onClick={fetchData}
          disabled={refreshing}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Etapas Activas</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.etapasActivas}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Jugadores Activos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.jugadoresActivos}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Inscripciones</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalInscripciones}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Partidos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.partidosPendientes}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Partidos Jugados</CardTitle>
            <PlayCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.partidosJugados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/circuito3gen/etapas">
          <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-500" />
                Gestionar Etapas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Crear y editar etapas del circuito</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/circuito3gen/partidos">
          <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-yellow-500" />
                Gestionar Partidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Crear y editar partidos</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/circuito3gen/rankings">
          <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-500" />
                Ver Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Consultar rankings por división</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/circuito3gen/sorteos">
          <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-500" />
                Ejecutar Sorteos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Sortear partidos para una fecha</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Registro de Usuarios */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-500" />
            Registrar Nuevo Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegistroUsuario} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-nombre" className="text-gray-300">Nombre *</Label>
                <Input
                  id="admin-nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Juan"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-apellido" className="text-gray-300">Apellido *</Label>
                <Input
                  id="admin-apellido"
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-gray-300">Email *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="jugador@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-dni" className="text-gray-300">DNI *</Label>
                <Input
                  id="admin-dni"
                  type="text"
                  value={formData.dni}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    if (value.length <= 8) {
                      setFormData({ ...formData, dni: value })
                    }
                  }}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="12345678"
                  maxLength={8}
                  required
                />
                <p className="text-xs text-gray-500">7 u 8 dígitos</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-gray-300">
                Contraseña *
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
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
              <p className="text-xs text-gray-500">
                La contraseña debe tener al menos 6 caracteres.
              </p>
            </div>

            {errorRegistro && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorRegistro}</AlertDescription>
              </Alert>
            )}

            {usuarioCreado && (
              <Alert className="bg-green-900/20 border-green-500/50">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {usuarioCreado.updated ? 'Usuario actualizado' : 'Usuario creado'} exitosamente
                    </p>
                    <p className="text-sm">
                      <strong>Nombre:</strong> {usuarioCreado.nombre} {usuarioCreado.apellido}
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> {usuarioCreado.email}
                    </p>
                    {usuarioCreado.cuenta_activada && (
                      <p className="text-sm text-green-300 mt-1">✓ Cuenta activada</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={registrandoUsuario || !formData.email || !formData.nombre || !formData.apellido || !formData.dni || !formData.password}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {registrandoUsuario ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrar Usuario
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Herramientas de Mantenimiento */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" />
            Herramientas de Mantenimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Recalcular Promedios Globales
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  Recalcula el promedio global de todos los jugadores basándose en todos sus partidos jugados en todo el circuito.
                </p>
                <div className="flex items-center gap-2 text-xs text-yellow-400 mb-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Usar cuando se hayan corregido resultados de partidos o los promedios no estén sincronizados</span>
                </div>
                <p className="text-xs text-gray-500">
                  Esta acción procesa todos los jugadores que tienen partidos jugados y puede tomar varios minutos.
                </p>
              </div>
              <Button
                onClick={recalcularPromediosGlobales}
                disabled={recalculandoPromedios || refreshing}
                variant="outline"
                className="ml-4 border-blue-600 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500 disabled:opacity-50"
              >
                {recalculandoPromedios ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Recalculando...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Recalcular Todos
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Etapas Activas */}
      {etapasActivas.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-500" />
                Etapas Activas
              </span>
              <Link href="/admin/circuito3gen/etapas">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Ver todas <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {etapasActivas.map((etapa) => (
                <div
                  key={etapa.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div>
                    <h3 className="text-white font-semibold">{etapa.nombre}</h3>
                    <p className="text-gray-400 text-sm">
                      {new Date(etapa.fecha_inicio).toLocaleDateString()} -{' '}
                      {new Date(etapa.fecha_fin).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    {etapa.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partidos Recientes */}
      {partidosRecientes.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-yellow-500" />
                Próximos Partidos
              </span>
              <Link href="/admin/circuito3gen/partidos">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Ver todos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partidosRecientes.map((partido) => (
                <div
                  key={partido.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="text-white font-semibold">
                      División {partido.division?.numero_division}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(partido.fecha_partido).toLocaleDateString()}
                      {partido.horario && ` - ${partido.horario}`}
                    </p>
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                    {partido.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

