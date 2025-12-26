'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BarChart3,
  ArrowLeft,
  User,
  Trophy,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  PlayCircle,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  PieChart,
  Activity
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
import { calcularRankingCompleto } from '@/lib/circuitooka/rankings-client'

export default function MiRankingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState(null)
  const [etapas, setEtapas] = useState([])
  const [etapaActiva, setEtapaActiva] = useState(null)
  const [divisiones, setDivisiones] = useState([])
  const [rankings, setRankings] = useState([])
  const [filtros, setFiltros] = useState({
    etapa_id: '',
    division_id: 'all'
  })
  const [inscripciones, setInscripciones] = useState([])
  const [tablaPosiciones, setTablaPosiciones] = useState([])
  const [loadingTabla, setLoadingTabla] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (usuario) {
      fetchData()
    }
  }, [usuario])

  useEffect(() => {
    if (usuario && filtros.etapa_id && filtros.division_id !== 'all') {
      fetchMiRanking()
    }
  }, [usuario, filtros])

  useEffect(() => {
    if (usuario && inscripciones.length > 0) {
      fetchTablaPosiciones()
    }
  }, [usuario, inscripciones])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/circuitooka/ranking')
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
      router.push('/login?redirect=/circuitooka/ranking')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Obtener etapa activa
      const { data: etapa, error: etapaError } = await supabase
        .from('circuitooka_etapas')
        .select('*')
        .eq('estado', 'activa')
        .order('fecha_inicio', { ascending: false })
        .limit(1)
        .single()

      if (etapaError && etapaError.code !== 'PGRST116') throw etapaError
      
      if (etapa) {
        setEtapaActiva(etapa)
        setFiltros(prev => ({ ...prev, etapa_id: etapa.id }))
      }

      // Obtener todas las etapas
      const { data: etapasData, error: etapasError } = await supabase
        .from('circuitooka_etapas')
        .select('*')
        .order('fecha_inicio', { ascending: false })

      if (etapasError) throw etapasError
      setEtapas(etapasData || [])

      // Obtener divisiones
      const { data: divisionesData, error: divisionesError } = await supabase
        .from('circuitooka_divisiones')
        .select('*')
        .order('numero_division', { ascending: true })

      if (divisionesError) throw divisionesError
      setDivisiones(divisionesData || [])

      // Obtener inscripciones del usuario
      if (usuario) {
        const { data: inscripcionesData, error: inscripcionesError } = await supabase
          .from('circuitooka_inscripciones')
          .select(`
            *,
            etapa:circuitooka_etapas (
              id,
              nombre
            ),
            division:circuitooka_divisiones!circuitooka_inscripciones_division_id_fkey (
              id,
              numero_division,
              nombre
            )
          `)
          .eq('usuario_id', usuario.id)
          .eq('estado', 'activa')
          .order('fecha_inscripcion', { ascending: false })

        if (inscripcionesError) throw inscripcionesError
        setInscripciones(inscripcionesData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMiRanking = async () => {
    if (!usuario || !filtros.etapa_id || filtros.division_id === 'all') return

    try {
      setLoading(true)

      // Obtener inscripciones activas de la división
      const { data: inscripciones, error: errorInscripciones } = await supabase
        .from('circuitooka_inscripciones')
        .select(`
          usuario_id,
          usuario:usuarios (
            id,
            nombre,
            apellido,
            email
          )
        `)
        .eq('etapa_id', filtros.etapa_id)
        .eq('division_id', filtros.division_id)
        .eq('estado', 'activa')

      if (errorInscripciones) throw errorInscripciones

      // Obtener todos los partidos jugados de la división
      const { data: partidos, error: errorPartidos } = await supabase
        .from('circuitooka_partidos')
        .select('*')
        .eq('etapa_id', filtros.etapa_id)
        .eq('division_id', filtros.division_id)
        .eq('estado', 'jugado')

      if (errorPartidos) throw errorPartidos

      const partidosJugados = partidos?.length || 0
      const jugadoresInscriptos = inscripciones?.length || 0

      // Calcular rankings en el frontend
      const rankingsCalculados = calcularRankingCompleto(
        inscripciones || [],
        partidos || [],
        partidosJugados,
        jugadoresInscriptos
      )

      // Filtrar solo el ranking del usuario
      const miRanking = rankingsCalculados.find(r => r.usuario_id === usuario.id)
      
      // Agregar información de la división al ranking
      if (miRanking) {
        const division = divisiones.find(d => d.id === filtros.division_id)
        if (division) {
          miRanking.division = {
            id: division.id,
            numero_division: division.numero_division,
            nombre: division.nombre
          }
        }
      }
      
      setRankings(miRanking ? [miRanking] : [])
    } catch (error) {
      console.error('Error fetching mi ranking:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar tu ranking',
        variant: 'destructive'
      })
      setRankings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTablaPosiciones = async () => {
    if (!usuario || inscripciones.length === 0) return

    try {
      setLoadingTabla(true)
      const rankingsPromises = inscripciones.map(async (inscripcion) => {
        try {
          // Obtener inscripciones activas de la división
          const { data: inscripcionesDiv, error: errorInscripciones } = await supabase
            .from('circuitooka_inscripciones')
            .select(`
              usuario_id,
              usuario:usuarios (
                id,
                nombre,
                apellido,
                email
              )
            `)
            .eq('etapa_id', inscripcion.etapa_id)
            .eq('division_id', inscripcion.division_id)
            .eq('estado', 'activa')

          if (errorInscripciones) throw errorInscripciones

          // Obtener todos los partidos jugados de la división
          const { data: partidos, error: errorPartidos } = await supabase
            .from('circuitooka_partidos')
            .select('*')
            .eq('etapa_id', inscripcion.etapa_id)
            .eq('division_id', inscripcion.division_id)
            .eq('estado', 'jugado')

          if (errorPartidos) throw errorPartidos

          const partidosJugados = partidos?.length || 0
          const jugadoresInscriptos = inscripcionesDiv?.length || 0

          // Calcular rankings en el frontend
          const rankingsCalculados = calcularRankingCompleto(
            inscripcionesDiv || [],
            partidos || [],
            partidosJugados,
            jugadoresInscriptos
          )

          // Filtrar solo el ranking del usuario
          const miRanking = rankingsCalculados.find(r => r.usuario_id === usuario.id)
          
          if (miRanking) {
            return {
              ...miRanking,
              etapa: inscripcion.etapa,
              division: inscripcion.division
            }
          }
          return null
        } catch (error) {
          console.error(`Error fetching ranking para inscripción ${inscripcion.id}:`, error)
          return null
        }
      })

      const rankingsData = await Promise.all(rankingsPromises)
      setTablaPosiciones(rankingsData.filter(r => r !== null))
    } catch (error) {
      console.error('Error fetching tabla de posiciones:', error)
      setTablaPosiciones([])
    } finally {
      setLoadingTabla(false)
    }
  }

  const obtenerNombreJugador = (usuario) => {
    if (!usuario) return 'N/A'
    return `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'N/A'
  }

  // Componente de gráfico de torta simple
  const PieChartComponent = ({ ganados, perdidos, size = 120 }) => {
    const total = ganados + perdidos
    if (total === 0) {
      return (
        <div className="flex items-center justify-center" style={{ width: size, height: size }}>
          <span className="text-gray-500 text-sm">Sin datos</span>
        </div>
      )
    }

    const porcentajeGanados = (ganados / total) * 100
    const porcentajePerdidos = (perdidos / total) * 100
    
    const radio = size / 2 - 10
    const circunferencia = 2 * Math.PI * radio
    const longitudGanados = (porcentajeGanados / 100) * circunferencia
    const longitudPerdidos = (porcentajePerdidos / 100) * circunferencia
    
    // Calcular offsets correctamente para que ambos segmentos se muestren en el mismo gráfico
    // El primer segmento (ganados) empieza en 0
    const offsetGanados = circunferencia - longitudGanados
    // El segundo segmento (perdidos) empieza donde terminó el primero
    const offsetPerdidos = circunferencia - longitudGanados - longitudPerdidos

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Círculo de fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radio}
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            className="text-gray-700"
          />
          {/* Segmento de partidos ganados (verde) */}
          {ganados > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radio}
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              strokeDasharray={`${longitudGanados} ${circunferencia}`}
              strokeDashoffset={0}
              className="text-green-500"
              strokeLinecap="round"
            />
          )}
          {/* Segmento de partidos perdidos (rojo) - continúa después del verde */}
          {perdidos > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radio}
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              strokeDasharray={`${longitudPerdidos} ${circunferencia}`}
              strokeDashoffset={-longitudGanados}
              className="text-red-500"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{Math.round(porcentajeGanados)}%</div>
            <div className="text-xs text-gray-400">Victorias</div>
          </div>
        </div>
      </div>
    )
  }

  // Componente de gráfico de barras
  const BarChartComponent = ({ label, value, maxValue, color = 'bg-[#E2FF1B]', showValue = true }) => {
    const porcentaje = maxValue > 0 ? (value / maxValue) * 100 : 0
    
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-sm">{label}</span>
          {showValue && (
            <span className="text-white font-semibold">{value}</span>
          )}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${Math.min(porcentaje, 100)}%` }}
          />
        </div>
      </div>
    )
  }

  // Componente de estadística con icono
  const StatCard = ({ icon: Icon, label, value, color = 'text-[#E2FF1B]', bgColor = 'bg-gray-700/50' }) => {
    return (
      <div className={`${bgColor} rounded-lg p-4 border border-gray-700/50`}>
        <div className="flex items-center gap-3 mb-2">
          {Icon && <Icon className={`w-5 h-5 ${color}`} />}
          <span className="text-gray-400 text-sm">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </div>
    )
  }

  // Calcular estadísticas globales del usuario
  const calcularEstadisticasGlobales = () => {
    if (tablaPosiciones.length === 0) return null

    const totalPartidosJugados = tablaPosiciones.reduce((sum, r) => sum + (r.partidos_jugados || 0), 0)
    const totalPartidosGanados = tablaPosiciones.reduce((sum, r) => sum + (r.partidos_ganados || 0), 0)
    const totalPartidosPerdidos = totalPartidosJugados - totalPartidosGanados
    const promedioVictorias = totalPartidosJugados > 0 ? (totalPartidosGanados / totalPartidosJugados) * 100 : 0
    const promedioFinalPromedio = tablaPosiciones.reduce((sum, r) => sum + (r.promedio_final || 0), 0) / tablaPosiciones.length
    const mejorPosicion = Math.min(...tablaPosiciones.map(r => r.posicion_ranking || Infinity).filter(p => p !== Infinity))
    const peorPosicion = Math.max(...tablaPosiciones.map(r => r.posicion_ranking || 0).filter(p => p > 0))

    return {
      totalPartidosJugados,
      totalPartidosGanados,
      totalPartidosPerdidos,
      promedioVictorias,
      promedioFinalPromedio,
      mejorPosicion: mejorPosicion !== Infinity ? mejorPosicion : null,
      peorPosicion: peorPosicion > 0 ? peorPosicion : null,
      torneosParticipados: tablaPosiciones.length
    }
  }

  const estadisticasGlobales = calcularEstadisticasGlobales()

  if (loading && rankings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const miRanking = rankings[0]
  const inscripcionActual = inscripciones.find(i => i.etapa_id === filtros.etapa_id)
  
  // Función helper para obtener el promedio a mostrar
  // Usa promedio_global si no hay filtro de división específica, sino usa promedio_final de la división
  const obtenerPromedioAMostrar = () => {
    if (filtros.division_id === 'all' || !miRanking) {
      // Si no hay filtro de división específica, usar promedio_global del usuario
      return usuario?.promedio_global || 0
    } else {
      // Si hay filtro de división específica, usar promedio_final del ranking de esa división
      return miRanking.promedio_final || 0
    }
  }
  
  const promedioAMostrar = obtenerPromedioAMostrar()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/circuitooka">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10 text-[#E2FF1B]" />
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">Mi Ranking</h1>
              <p className="text-gray-300 mt-1">
                Consulta tu posición y estadísticas en el circuito
              </p>
            </div>
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
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                Seleccionar Etapa y División
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 mb-2 block">Etapa</Label>
                  <Select
                    value={filtros.etapa_id}
                    onValueChange={(value) => setFiltros({ ...filtros, etapa_id: value, division_id: 'all' })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Seleccionar etapa" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
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
                    disabled={!filtros.etapa_id}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Seleccionar división" />
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
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Promedio Global - Mostrar primero ya que es lo más importante */}
        {inscripciones.length > 0 && (!filtros.etapa_id || filtros.division_id === 'all') && !miRanking && usuario && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-[#E2FF1B]/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-[#E2FF1B]/10 rounded-full">
                      <Trophy className="w-12 h-12 text-[#E2FF1B]" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 break-words">
                        {obtenerNombreJugador(usuario)}
                      </h2>
                      <p className="text-gray-400">Promedio Global</p>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-sm text-gray-400 mb-1">Promedio Global</div>
                    <div className="text-4xl font-bold text-[#E2FF1B]">
                      {promedioAMostrar.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Estadísticas Globales - Solo mostrar cuando no hay filtro específico de división */}
        {inscripciones.length > 0 && estadisticasGlobales && filtros.division_id === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center gap-2 break-words">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Estadísticas Globales
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Tarjetas de estadísticas principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    icon={Trophy}
                    label="Torneos"
                    value={estadisticasGlobales.torneosParticipados}
                    color="text-[#E2FF1B]"
                    bgColor="bg-[#E2FF1B]/10"
                  />
                  <StatCard
                    icon={PlayCircle}
                    label="Partidos"
                    value={estadisticasGlobales.totalPartidosJugados}
                    color="text-blue-400"
                    bgColor="bg-blue-500/10"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="% Victorias"
                    value={`${estadisticasGlobales.promedioVictorias.toFixed(1)}%`}
                    color="text-green-400"
                    bgColor="bg-green-500/10"
                  />
                  <StatCard
                    icon={Award}
                    label="Promedio"
                    value={estadisticasGlobales.promedioFinalPromedio.toFixed(2)}
                    color="text-[#E2FF1B]"
                    bgColor="bg-[#E2FF1B]/10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Gráfico de Torta - Partidos */}
                  <div className="flex flex-col items-center bg-gray-700/30 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4 text-sm break-words">Distribución de Partidos</h3>
                    <PieChartComponent
                      ganados={estadisticasGlobales.totalPartidosGanados}
                      perdidos={estadisticasGlobales.totalPartidosPerdidos}
                      size={180}
                    />
                    <div className="mt-6 space-y-3 w-full max-w-xs">
                      <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-gray-300 text-sm">Ganados</span>
                        </div>
                        <span className="text-white font-bold text-lg">{estadisticasGlobales.totalPartidosGanados}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span className="text-gray-300 text-sm">Perdidos</span>
                        </div>
                        <span className="text-white font-bold text-lg">{estadisticasGlobales.totalPartidosPerdidos}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gráficos de Barras */}
                  <div className="bg-gray-700/30 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4 text-sm break-words">Comparativa de Partidos</h3>
                    <div className="space-y-4">
                      <BarChartComponent
                        label="Partidos Ganados"
                        value={estadisticasGlobales.totalPartidosGanados}
                        maxValue={estadisticasGlobales.totalPartidosJugados}
                        color="bg-green-500"
                      />
                      <BarChartComponent
                        label="Partidos Perdidos"
                        value={estadisticasGlobales.totalPartidosPerdidos}
                        maxValue={estadisticasGlobales.totalPartidosJugados}
                        color="bg-red-500"
                      />
                      <div className="pt-4 border-t border-gray-600">
                        <BarChartComponent
                          label="Porcentaje de Victorias"
                          value={estadisticasGlobales.promedioVictorias}
                          maxValue={100}
                          color="bg-[#E2FF1B]"
                          showValue={false}
                        />
                        <div className="text-center mt-2">
                          <span className="text-[#E2FF1B] font-bold text-xl">
                            {estadisticasGlobales.promedioVictorias.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mejores y Peores Posiciones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {estadisticasGlobales.mejorPosicion && (
                    <div className="flex flex-col items-center justify-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <ArrowUp className="w-8 h-8 text-green-400 mb-2" />
                      <span className="text-gray-300 text-sm mb-1">Mejor Posición</span>
                      <Badge className="bg-green-600 text-white font-bold text-xl px-4 py-2">
                        #{estadisticasGlobales.mejorPosicion}
                      </Badge>
                    </div>
                  )}
                  {estadisticasGlobales.peorPosicion && (
                    <div className="flex flex-col items-center justify-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <ArrowDown className="w-8 h-8 text-red-400 mb-2" />
                      <span className="text-gray-300 text-sm mb-1">Peor Posición</span>
                      <Badge className="bg-red-600 text-white font-bold text-xl px-4 py-2">
                        #{estadisticasGlobales.peorPosicion}
                      </Badge>
                    </div>
                  )}
                  {estadisticasGlobales.mejorPosicion && estadisticasGlobales.peorPosicion && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-700/50 rounded-lg">
                      <Minus className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-300 text-sm mb-1">Diferencia</span>
                      <span className="text-white font-bold text-xl">
                        {estadisticasGlobales.peorPosicion - estadisticasGlobales.mejorPosicion} posiciones
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabla de Posiciones - Solo mostrar cuando no hay filtro específico de división */}
        {inscripciones.length > 0 && filtros.division_id === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center gap-2 break-words">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Tabla de Posiciones - Mis Torneos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTabla ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : tablaPosiciones.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Etapa</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">División</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Posición</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Promedio Final</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm" title="Partidos Jugados">PJ</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm" title="Partidos Ganados">PG</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm" title="Partidos Perdidos">PP</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tablaPosiciones.map((ranking, index) => (
                          <tr
                            key={`${ranking.etapa?.id}-${ranking.division?.id}`}
                            className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                              index % 2 === 0 ? 'bg-gray-800/30' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-white font-medium">
                              {ranking.etapa?.nombre || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-300">
                              {ranking.division?.nombre || `División ${ranking.division?.numero_division}`}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {ranking.posicion_ranking ? (
                                <Badge className="bg-[#E2FF1B] text-black font-semibold">
                                  #{ranking.posicion_ranking}
                                </Badge>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-[#E2FF1B] font-bold text-lg">
                                {ranking.promedio_final ? ranking.promedio_final.toFixed(2) : '0.00'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-white">
                              {ranking.partidos_jugados || 0}
                            </td>
                            <td className="py-3 px-4 text-center text-green-400 font-semibold">
                              {ranking.partidos_ganados || 0}
                            </td>
                            <td className="py-3 px-4 text-center text-red-400 font-semibold">
                              {(ranking.partidos_jugados || 0) - (ranking.partidos_ganados || 0)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Link href={`/circuitooka/rankings?etapa=${ranking.etapa?.id}&division=${ranking.division?.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#E2FF1B] hover:text-[#E2FF1B]/80 hover:bg-[#E2FF1B]/10"
                                >
                                  Ver
                                  <BarChart3 className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No hay rankings disponibles para tus inscripciones</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Sin inscripción */}
        {inscripciones.length === 0 && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 break-words">No estás inscripto</h3>
              <p className="text-gray-400 mb-4">
                Debes inscribirte en el circuito para ver tu ranking
              </p>
              <Link href="/circuitooka/inscripcion">
                <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                  Inscribirme
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Sin ranking seleccionado - Mensaje cuando no hay etapa seleccionada */}
        {inscripciones.length > 0 && !filtros.etapa_id && !usuario?.promedio_global && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Selecciona una etapa y una división para ver tu ranking</p>
            </CardContent>
          </Card>
        )}

        {/* Mi Ranking - Cuando hay filtro de división específica */}
        {miRanking && (
          <>
            {/* Card Principal de Ranking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-[#E2FF1B]/30 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-[#E2FF1B]/10 rounded-full">
                        <Trophy className="w-12 h-12 text-[#E2FF1B]" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 break-words">
                          {obtenerNombreJugador(miRanking.usuario)}
                        </h2>
                        <p className="text-gray-400">
                          {miRanking.division?.nombre || `División ${miRanking.division?.numero_division}`}
                        </p>
                        {miRanking.posicion_ranking && (
                          <div className="mt-2">
                            <Badge className="bg-[#E2FF1B] text-black text-lg px-4 py-1">
                              Posición #{miRanking.posicion_ranking}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center md:text-right">
                      <div className="text-sm text-gray-400 mb-1">
                        {filtros.division_id === 'all' ? 'Promedio Global' : 'Promedio Final'}
                      </div>
                      <div className="text-4xl font-bold text-[#E2FF1B]">
                        {promedioAMostrar.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-sm sm:text-base md:text-lg flex items-center gap-2 break-words">
                      <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                      Partidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center mb-4">
                      <PieChartComponent
                        ganados={miRanking.partidos_ganados || 0}
                        perdidos={(miRanking.partidos_jugados || 0) - (miRanking.partidos_ganados || 0)}
                        size={140}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Jugados:</span>
                        <span className="text-white font-semibold text-lg">{miRanking.partidos_jugados || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Ganados:</span>
                        <span className="text-green-400 font-semibold text-lg">{miRanking.partidos_ganados || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Perdidos:</span>
                        <span className="text-red-400 font-semibold text-lg">
                          {(miRanking.partidos_jugados || 0) - (miRanking.partidos_ganados || 0)}
                        </span>
                      </div>
                      {miRanking.partidos_jugados > 0 && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                          <span className="text-gray-400">% Victorias:</span>
                          <span className="text-[#E2FF1B] font-semibold text-lg">
                            {((miRanking.partidos_ganados || 0) / (miRanking.partidos_jugados || 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-sm sm:text-base md:text-lg flex items-center gap-2 break-words">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                      Promedios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Individual:</span>
                        <span className="text-white font-semibold">
                          {miRanking.promedio_individual ? miRanking.promedio_individual.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">General:</span>
                        <span className="text-white font-semibold">
                          {miRanking.promedio_general ? miRanking.promedio_general.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Bonus:</span>
                        <span className="text-green-400 font-semibold">
                          {miRanking.bonus_por_jugar ? miRanking.bonus_por_jugar.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-sm sm:text-base md:text-lg flex items-center gap-2 break-words">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                      Mínimo Requerido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Mínimo:</span>
                        <span className="text-white font-semibold">
                          {miRanking.minimo_requerido ? Math.ceil(miRanking.minimo_requerido) : 0} partidos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Jugados:</span>
                        <span className="text-white font-semibold">
                          {miRanking.partidos_jugados || 0} / {miRanking.minimo_requerido ? Math.ceil(miRanking.minimo_requerido) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                        <span className="text-gray-400">Estado:</span>
                        {miRanking.cumple_minimo ? (
                          <Badge variant="default" className="bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Cumple
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-600 text-yellow-400 bg-yellow-900/20">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            No cumple
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Detalle de Promedios */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-6"
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center gap-2 break-words">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    Desglose de Promedios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Promedio Individual</span>
                        <span className="text-white font-semibold text-lg">
                          {miRanking.promedio_individual ? miRanking.promedio_individual.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Partidos ganados / Partidos jugados
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Promedio General</span>
                        <span className="text-white font-semibold text-lg">
                          {miRanking.promedio_general ? miRanking.promedio_general.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Partidos ganados / Total de partidos de la división
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Bonus por Jugar</span>
                        <span className="text-green-400 font-semibold text-lg">
                          {miRanking.bonus_por_jugar ? miRanking.bonus_por_jugar.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Partidos jugados / Total de partidos de la división
                      </p>
                    </div>
                    <div className="bg-[#E2FF1B]/10 border-2 border-[#E2FF1B]/30 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#E2FF1B] font-semibold">
                          {filtros.division_id === 'all' ? 'Promedio Global' : 'Promedio Final'}
                        </span>
                        <span className="text-[#E2FF1B] font-bold text-2xl">
                          {promedioAMostrar.toFixed(2)}
                        </span>
                      </div>
                      {filtros.division_id !== 'all' && miRanking ? (
                        <p className="text-xs text-gray-400">
                          Suma: {miRanking.promedio_individual?.toFixed(2) || '0.00'} + {miRanking.promedio_general?.toFixed(2) || '0.00'} + {miRanking.bonus_por_jugar?.toFixed(2) || '0.00'} = {miRanking.promedio_final?.toFixed(2) || '0.00'}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">
                          Promedio global calculado a partir de todos tus partidos en todas las divisiones
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Diferencia de Sets y Games */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-6"
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center gap-2 break-words">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    Estadísticas Adicionales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">Diferencia Sets:</span>
                      <span className={`font-semibold text-lg ${(miRanking.diferencia_sets || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(miRanking.diferencia_sets || 0) >= 0 ? '+' : ''}{miRanking.diferencia_sets || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">Diferencia Games:</span>
                      <span className={`font-semibold text-lg ${(miRanking.diferencia_games || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(miRanking.diferencia_games || 0) >= 0 ? '+' : ''}{miRanking.diferencia_games || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Link a Rankings Públicos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">¿Quieres ver el ranking completo de tu división?</p>
                    <Link href={`/circuitooka/rankings?etapa=${filtros.etapa_id}&division=${filtros.division_id}`}>
                      <Button variant="outline" className="border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10">
                        Ver Rankings Completos
                        <BarChart3 className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Sin ranking para esta división */}
        {inscripciones.length > 0 && filtros.etapa_id && filtros.division_id !== 'all' && !miRanking && !loading && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 break-words">No tienes ranking en esta división</h3>
              <p className="text-gray-400">
                No estás inscripto en esta división o aún no has jugado partidos
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

