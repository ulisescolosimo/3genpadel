'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  PlayCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPartidoDateTimeArgentina, formatPartidoDateTimeShort } from '@/lib/date-utils'
import { formatNombreJugador } from '@/lib/utils'

export default function MisPartidosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [partidos, setPartidos] = useState([])
  const [etapas, setEtapas] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [usuario, setUsuario] = useState(null)
  const [filtros, setFiltros] = useState({
    etapa_id: 'all',
    division_id: 'all',
    estado: 'all'
  })
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (usuario) {
      fetchData()
      fetchPartidos()
    }
  }, [usuario, filtros])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/circuito3gen/partidos')
        return
      }

      const { data: usuarioData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      setUsuario(usuarioData)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/login?redirect=/circuito3gen/partidos')
    }
  }

  const fetchData = async () => {
    try {
      // Obtener etapas
      const { data: etapasData, error: etapasError } = await supabase
        .from('circuito3gen_etapas')
        .select('*')
        .order('fecha_inicio', { ascending: false })

      if (etapasError) throw etapasError
      setEtapas(etapasData || [])

      // Obtener divisiones
      const { data: divisionesData, error: divisionesError } = await supabase
        .from('circuito3gen_divisiones')
        .select('*')
        .order('numero_division', { ascending: true })

      if (divisionesError) throw divisionesError
      setDivisiones(divisionesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchPartidos = async () => {
    if (!usuario) return

    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.append('usuario_id', usuario.id)
      if (filtros.etapa_id !== 'all') params.append('etapa_id', filtros.etapa_id)
      if (filtros.division_id !== 'all') params.append('division_id', filtros.division_id)
      if (filtros.estado !== 'all') params.append('estado', filtros.estado)

      const response = await fetch(`/api/circuito3gen/partidos?${params.toString()}`)
      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      // Ordenar: pendientes primero (por fecha+horario Argentina), luego jugados
      const partidosOrdenados = (result.data || []).sort((a, b) => {
        if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1
        if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1
        // Comparar por fecha (YYYY-MM-DD) y horario para evitar problemas de zona horaria
        const cmpFecha = (a.fecha_partido || '').localeCompare(b.fecha_partido || '')
        if (cmpFecha !== 0) {
          return a.estado === 'pendiente' ? cmpFecha : -cmpFecha
        }
        const cmpHorario = (a.horario || '').localeCompare(b.horario || '')
        return a.estado === 'pendiente' ? cmpHorario : -cmpHorario
      })

      setPartidos(partidosOrdenados)
    } catch (error) {
      console.error('Error fetching partidos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los partidos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtiene el nombre del jugador desde el objeto usuario (join) o desde jugador_X_nombre
  const obtenerNombreJugadorEnPartido = (partido, slot) => {
    const jugador = partido?.[slot]
    const nombreBackup = partido?.[`${slot}_nombre`]
    if (jugador && (jugador.nombre || jugador.apellido)) {
      const raw = `${jugador.nombre || ''} ${jugador.apellido || ''}`.trim()
      return formatNombreJugador(raw) || 'N/A'
    }
    return formatNombreJugador(nombreBackup || '') || 'N/A'
  }

  const obtenerNombreJugador = (jugador) => {
    if (!jugador) return 'N/A'
    const raw = `${jugador.nombre || ''} ${jugador.apellido || ''}`.trim()
    return formatNombreJugador(raw) || 'N/A'
  }

  const obtenerEquipoJugador = (partido) => {
    if (!usuario || !partido) return null

    const esEquipoA = partido.jugador_a1_id === usuario.id || partido.jugador_a2_id === usuario.id
    return esEquipoA ? 'A' : 'B'
  }

  const obtenerNombreCompanero = (partido) => {
    if (!usuario || !partido) return 'N/A'

    const esEquipoA = partido.jugador_a1_id === usuario.id || partido.jugador_a2_id === usuario.id
    if (esEquipoA) {
      return partido.jugador_a1_id === usuario.id
        ? obtenerNombreJugadorEnPartido(partido, 'jugador_a2')
        : obtenerNombreJugadorEnPartido(partido, 'jugador_a1')
    }
    return partido.jugador_b1_id === usuario.id
      ? obtenerNombreJugadorEnPartido(partido, 'jugador_b2')
      : obtenerNombreJugadorEnPartido(partido, 'jugador_b1')
  }

  const obtenerNombresOponentes = (partido) => {
    if (!partido) return []

    const esEquipoA = partido.jugador_a1_id === usuario?.id || partido.jugador_a2_id === usuario?.id
    if (esEquipoA) {
      return [obtenerNombreJugadorEnPartido(partido, 'jugador_b1'), obtenerNombreJugadorEnPartido(partido, 'jugador_b2')]
    }
    return [obtenerNombreJugadorEnPartido(partido, 'jugador_a1'), obtenerNombreJugadorEnPartido(partido, 'jugador_a2')]
  }

  const formatearLugar = (lugar) => {
    if (!lugar) return null
    if (lugar === 'la_normanda') return 'La normanda (Delgado 864)'
    if (lugar === 'adr') return 'ADR (Olleros 1515)'
    return lugar.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const handleVerDetalle = (partido) => {
    setPartidoSeleccionado(partido)
    setIsDialogOpen(true)
  }

  if (loading && partidos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const partidosPendientes = partidos.filter(p => p.estado === 'pendiente')
  const partidosJugados = partidos.filter(p => p.estado === 'jugado')
  const partidosCancelados = partidos.filter(p => p.estado === 'cancelado' || p.estado === 'WO')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/circuito3gen">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PlayCircle className="w-10 h-10 text-[#E2FF1B]" />
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">Mis Partidos</h1>
                <p className="text-gray-300 mt-1">
                  {partidos.length} partido{partidos.length !== 1 ? 's' : ''} total{partidos.length !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
            <Button
              onClick={fetchPartidos}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center gap-2 break-words">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-400 mb-2 block">Etapa</Label>
                  <Select
                    value={filtros.etapa_id}
                    onValueChange={(value) => setFiltros({ ...filtros, etapa_id: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Todas las etapas" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">Todas</SelectItem>
                      {etapas.map((etapa) => (
                        <SelectItem key={etapa.id} value={etapa.id} className="text-white hover:bg-gray-700">
                          {etapa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400 mb-2 block">División</Label>
                  <Select
                    value={filtros.division_id}
                    onValueChange={(value) => setFiltros({ ...filtros, division_id: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Todas las divisiones" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">Todas</SelectItem>
                      {divisiones.map((division) => (
                        <SelectItem key={division.id} value={division.id} className="text-white hover:bg-gray-700">
                          {division.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400 mb-2 block">Estado</Label>
                  <Select
                    value={filtros.estado}
                    onValueChange={(value) => setFiltros({ ...filtros, estado: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all" className="text-white hover:bg-gray-700">Todos</SelectItem>
                      <SelectItem value="pendiente" className="text-white hover:bg-gray-700">Pendientes</SelectItem>
                      <SelectItem value="jugado" className="text-white hover:bg-gray-700">Jugados</SelectItem>
                      <SelectItem value="cancelado" className="text-white hover:bg-gray-700">Cancelados</SelectItem>
                      <SelectItem value="WO" className="text-white hover:bg-gray-700">WO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Partidos Pendientes */}
        {partidosPendientes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2 break-words">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              Próximos Partidos ({partidosPendientes.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partidosPendientes.map((partido) => (
                  <Card key={partido.id} className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-[#E2FF1B]/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-sm sm:text-base md:text-lg break-words">
                          {partido.division?.nombre || `División ${partido.division?.numero_division}`}
                        </CardTitle>
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                          Pendiente
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatPartidoDateTimeArgentina(partido.fecha_partido, partido.horario)}</span>
                        </div>
                        {(partido.lugar || partido.cancha) && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {formatearLugar(partido.lugar)}
                              {partido.lugar && partido.cancha && ' · '}
                              {partido.cancha && `Cancha: ${partido.cancha}`}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-700">
                          <div className="text-sm text-gray-300 mb-1">
                            <strong>Tu pareja:</strong> {obtenerNombreCompanero(partido)}
                          </div>
                          <div className="text-sm text-gray-300">
                            <strong>Oponentes:</strong> {obtenerNombresOponentes(partido).filter(Boolean).join(' / ') || 'Por definir'}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10"
                          onClick={() => handleVerDetalle(partido)}
                        >
                          Ver Detalle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Partidos Jugados */}
        {partidosJugados.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2 break-words">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              Partidos Jugados ({partidosJugados.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partidosJugados.map((partido) => {
                const equipoJugador = obtenerEquipoJugador(partido)
                const gano = partido.equipo_ganador === equipoJugador

                return (
                  <Card key={partido.id} className={`bg-gray-800/50 border-gray-700 backdrop-blur-sm ${gano ? 'border-green-500/50' : 'border-red-500/50'}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-sm sm:text-base md:text-lg break-words">
                          {partido.division?.nombre || `División ${partido.division?.numero_division}`}
                        </CardTitle>
                        <Badge className={gano ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}>
                          {gano ? 'Victoria' : 'Derrota'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatPartidoDateTimeArgentina(partido.fecha_partido, partido.horario)}</span>
                        </div>
                        {(partido.lugar || partido.cancha) && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {formatearLugar(partido.lugar)}
                              {partido.lugar && partido.cancha && ' · '}
                              {partido.cancha && `Cancha: ${partido.cancha}`}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-700">
                          <div className="text-sm text-gray-300 mb-2">
                            <strong>Resultado:</strong>
                          </div>
                          <div className="text-lg font-bold text-white mb-1">
                            Equipo {equipoJugador}: {equipoJugador === 'A' ? partido.sets_equipo_a : partido.sets_equipo_b} sets
                          </div>
                          <div className="text-lg font-bold text-gray-400">
                            Equipo {equipoJugador === 'A' ? 'B' : 'A'}: {equipoJugador === 'A' ? partido.sets_equipo_b : partido.sets_equipo_a} sets
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-700 text-sm text-gray-300">
                          <div className="mb-1">
                            <strong>Tu pareja:</strong> {obtenerNombreCompanero(partido)}
                          </div>
                          <div>
                            <strong>Oponentes:</strong> {obtenerNombresOponentes(partido).filter(Boolean).join(' / ') || 'Por definir'}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => handleVerDetalle(partido)}
                        >
                          Ver Detalle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Sin partidos */}
        {partidos.length === 0 && !loading && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <PlayCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 break-words">No tienes partidos</h3>
              <p className="text-gray-400 mb-4">
                Aún no has sido asignado a ningún partido del circuito
              </p>
              <Link href="/circuito3gen">
                <Button variant="outline" className="border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10">
                  Volver al inicio
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Detalle */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-gray-900/95 border-gray-700/80 text-white max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 backdrop-blur-xl">
            {partidoSeleccionado && (
              <>
                {/* Header destacado */}
                <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-800 to-gray-900 border-b border-gray-700/80 px-6 pt-6 pb-5 pr-14">
                  <div className="absolute inset-0 bg-[#E2FF1B]/5" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {partidoSeleccionado.division?.nombre || `División ${partidoSeleccionado.division?.numero_division}`}
                        </h2>
                        <p className="text-[#E2FF1B] font-medium mt-1 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatPartidoDateTimeShort(partidoSeleccionado.fecha_partido, partidoSeleccionado.horario)}
                        </p>
                        {partidoSeleccionado.etapa?.nombre && (
                          <p className="text-gray-400 text-sm mt-1">{partidoSeleccionado.etapa.nombre}</p>
                        )}
                      </div>
                      <Badge className={`shrink-0 ${
                        partidoSeleccionado.estado === 'jugado' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                        partidoSeleccionado.estado === 'pendiente' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                        'bg-red-500/20 text-red-400 border-red-500/50'
                      }`}>
                        {partidoSeleccionado.estado}
                      </Badge>
                    </div>
                    {(formatearLugar(partidoSeleccionado.lugar) || partidoSeleccionado.cancha) && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>
                          {formatearLugar(partidoSeleccionado.lugar)}
                          {partidoSeleccionado.lugar && partidoSeleccionado.cancha && ' · '}
                          {partidoSeleccionado.cancha && `Cancha ${partidoSeleccionado.cancha}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-5">
                  {/* Jugadores */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      Jugadores
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(['A', 'B']).map((equipo) => {
                        const esMiEquipo = obtenerEquipoJugador(partidoSeleccionado) === equipo
                        const jugadores = equipo === 'A'
                          ? [obtenerNombreJugadorEnPartido(partidoSeleccionado, 'jugador_a1'), obtenerNombreJugadorEnPartido(partidoSeleccionado, 'jugador_a2')]
                          : [obtenerNombreJugadorEnPartido(partidoSeleccionado, 'jugador_b1'), obtenerNombreJugadorEnPartido(partidoSeleccionado, 'jugador_b2')]
                        return (
                          <div
                            key={equipo}
                            className={`rounded-lg p-3 border ${
                              esMiEquipo ? 'bg-[#E2FF1B]/10 border-[#E2FF1B]/30' : 'bg-gray-800/50 border-gray-700/80'
                            }`}
                          >
                            <div className="text-xs font-medium text-gray-500 mb-1.5">
                              Equipo {equipo} {esMiEquipo && <span className="text-[#E2FF1B]">· Tu equipo</span>}
                            </div>
                            <div className="space-y-0.5 text-sm text-white">
                              {jugadores.map((nombre, i) => (
                                <div key={i}>{nombre}</div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Resultado (si jugado) */}
                  {partidoSeleccionado.estado === 'jugado' && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5" />
                        Resultado
                      </h3>
                      <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-lg bg-gray-800/50 border border-gray-700/80">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">Equipo A</div>
                          <div className="text-3xl font-bold text-[#E2FF1B] mt-0.5">{partidoSeleccionado.sets_equipo_a || 0}</div>
                          <div className="text-xs text-gray-500">sets</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-600">—</div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">Equipo B</div>
                          <div className="text-3xl font-bold text-[#E2FF1B] mt-0.5">{partidoSeleccionado.sets_equipo_b || 0}</div>
                          <div className="text-xs text-gray-500">sets</div>
                        </div>
                      </div>
                      {partidoSeleccionado.equipo_ganador && (
                        <p className="text-center text-sm text-green-400 mt-2 font-medium">
                          Ganador: Equipo {partidoSeleccionado.equipo_ganador}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Cerrar
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}







