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
  Minus
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

      const params = new URLSearchParams()
      params.append('etapa_id', filtros.etapa_id)
      params.append('division_id', filtros.division_id)
      params.append('usuario_id', usuario.id)

      const response = await fetch(`/api/circuitooka/rankings?${params.toString()}`)
      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setRankings(result.data ? [result.data] : [])
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

  const obtenerNombreJugador = (usuario) => {
    if (!usuario) return 'N/A'
    return `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'N/A'
  }

  if (loading && rankings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const miRanking = rankings[0]
  const inscripcionActual = inscripciones.find(i => i.etapa_id === filtros.etapa_id)

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
              <h1 className="text-4xl font-bold text-white">Mi Ranking</h1>
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
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
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

        {/* Sin inscripción */}
        {inscripciones.length === 0 && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No estás inscripto</h3>
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

        {/* Sin ranking seleccionado */}
        {inscripciones.length > 0 && (!filtros.etapa_id || filtros.division_id === 'all') && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Selecciona una etapa y una división para ver tu ranking</p>
            </CardContent>
          </Card>
        )}

        {/* Mi Ranking */}
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
                        <h2 className="text-2xl font-bold text-white mb-1">
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
                      <div className="text-sm text-gray-400 mb-1">Promedio Final</div>
                      <div className="text-4xl font-bold text-[#E2FF1B]">
                        {miRanking.promedio_final ? miRanking.promedio_final.toFixed(2) : '0.00'}
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
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <PlayCircle className="w-5 h-5 text-[#E2FF1B]" />
                      Partidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-[#E2FF1B]" />
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
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-[#E2FF1B]" />
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
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#E2FF1B]" />
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
                        <span className="text-[#E2FF1B] font-semibold">Promedio Final</span>
                        <span className="text-[#E2FF1B] font-bold text-2xl">
                          {miRanking.promedio_final ? miRanking.promedio_final.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Suma: {miRanking.promedio_individual?.toFixed(2) || '0.00'} + {miRanking.promedio_general?.toFixed(2) || '0.00'} + {miRanking.bonus_por_jugar?.toFixed(2) || '0.00'} = {miRanking.promedio_final?.toFixed(2) || '0.00'}
                      </p>
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
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#E2FF1B]" />
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
              <h3 className="text-xl font-bold text-white mb-2">No tienes ranking en esta división</h3>
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

