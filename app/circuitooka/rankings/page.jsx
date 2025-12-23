'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Search,
  Filter,
  ArrowLeft,
  User,
  Trophy,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
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

export default function RankingsPublicosPage() {
  const [loading, setLoading] = useState(true)
  const [rankings, setRankings] = useState([])
  const [etapas, setEtapas] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [etapaActiva, setEtapaActiva] = useState(null)
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)
  const [filtros, setFiltros] = useState({
    etapa_id: '',
    division_id: 'all',
    busqueda: ''
  })
  const [detalleRanking, setDetalleRanking] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [minimoRequeridoDivision, setMinimoRequeridoDivision] = useState(null)
  const [zonasAscensoDescenso, setZonasAscensoDescenso] = useState({
    jugadoresAscenso: [],
    jugadoresDescenso: [],
    jugadoresPlayoff: { playoff_ascenso: [], playoff_descenso: [] }
  })

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('id')
          .eq('id', session.user.id)
          .single()
        
        if (usuarioData) {
          setUsuarioLogueado(usuarioData)
        }
      }
    } catch (error) {
      // No es crítico si no puede obtener el usuario
      console.error('Error checking auth:', error)
    }
  }

  useEffect(() => {
    if (filtros.etapa_id && filtros.division_id !== 'all') {
      fetchRankings()
    } else {
      setRankings([])
    }
  }, [filtros])

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
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchZonasAscensoDescenso = async () => {
    if (!filtros.etapa_id || filtros.division_id === 'all') {
      setZonasAscensoDescenso({
        jugadoresAscenso: [],
        jugadoresDescenso: [],
        jugadoresPlayoff: { playoff_ascenso: [], playoff_descenso: [] }
      })
      return
    }

    try {
      const params = new URLSearchParams()
      params.append('etapa_id', filtros.etapa_id)
      params.append('division_id', filtros.division_id)

      const response = await fetch(`/api/circuitooka/ascensos-descensos?${params.toString()}`)
      const result = await response.json()

      if (result.success && result.data) {
        setZonasAscensoDescenso({
          jugadoresAscenso: result.data.jugadores_ascenso || [],
          jugadoresDescenso: result.data.jugadores_descenso || [],
          jugadoresPlayoff: result.data.jugadores_playoff || { playoff_ascenso: [], playoff_descenso: [] }
        })
      }
    } catch (error) {
      console.error('Error fetching zonas ascenso/descenso:', error)
    }
  }

  const fetchRankings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('etapa_id', filtros.etapa_id)
      params.append('division_id', filtros.division_id)

      const response = await fetch(`/api/circuitooka/rankings?${params.toString()}`)
      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      let rankingsFiltrados = result.data || []

      // Obtener mínimo requerido
      let minimoRequerido = rankingsFiltrados.find(r => r.minimo_requerido != null && r.minimo_requerido > 0)?.minimo_requerido
      
      if (!minimoRequerido || minimoRequerido === 0) {
        try {
          const minimoParams = new URLSearchParams()
          minimoParams.append('etapa_id', filtros.etapa_id)
          minimoParams.append('division_id', filtros.division_id)
          minimoParams.append('minimo', 'true')
          
          const minimoResponse = await fetch(`/api/circuitooka/promedios?${minimoParams.toString()}`)
          const minimoResult = await minimoResponse.json()
          
          if (minimoResult.success && minimoResult.data?.minimo_requerido != null) {
            minimoRequerido = minimoResult.data.minimo_requerido
          }
        } catch (error) {
          console.error('Error obteniendo mínimo requerido:', error)
        }
      }
      
      setMinimoRequeridoDivision(minimoRequerido || 0)

      // Filtro de búsqueda por nombre
      if (filtros.busqueda) {
        const busquedaLower = filtros.busqueda.toLowerCase()
        rankingsFiltrados = rankingsFiltrados.filter(ranking => {
          const nombre = `${ranking.usuario?.nombre || ''} ${ranking.usuario?.apellido || ''}`.toLowerCase()
          return nombre.includes(busquedaLower)
        })
      }

      setRankings(rankingsFiltrados)

      // Obtener zonas de ascenso/descenso/playoff
      await fetchZonasAscensoDescenso()
    } catch (error) {
      console.error('Error fetching rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerDetalle = (ranking) => {
    setDetalleRanking(ranking)
    setIsDialogOpen(true)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
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
            <BarChart3 className="w-10 h-10 text-[#E2FF1B]" />
            <div>
              <h1 className="text-4xl font-bold text-white">Rankings Públicos</h1>
              <p className="text-gray-300 mt-1">
                Consulta los rankings de todas las divisiones
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
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <Label className="text-gray-400 mb-2 block">Buscar jugador</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Nombre o email..."
                      value={filtros.busqueda}
                      onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabla de Rankings */}
        {!filtros.etapa_id || filtros.division_id === 'all' ? (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Selecciona una etapa y una división para ver los rankings</p>
            </CardContent>
          </Card>
        ) : rankings.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay rankings registrados para esta división</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Leyenda de Zonas */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-6">
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-gray-400 font-semibold">Leyenda:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-900/20 border-l-4 border-green-500"></div>
                    <span className="text-gray-300">Ascenso ({zonasAscensoDescenso.jugadoresAscenso.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-900/20 border-l-4 border-blue-500"></div>
                    <span className="text-gray-300">Playoff Ascenso ({zonasAscensoDescenso.jugadoresPlayoff?.playoff_ascenso?.length || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-900/20 border-l-4 border-yellow-500"></div>
                    <span className="text-gray-300">Playoff Descenso ({zonasAscensoDescenso.jugadoresPlayoff?.playoff_descenso?.length || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-900/20 border-l-4 border-red-500"></div>
                    <span className="text-gray-300">Descenso ({zonasAscensoDescenso.jugadoresDescenso.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-900/30 opacity-75"></div>
                    <span className="text-gray-300">Inactivo (sin mínimo)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Rankings - {etapas.find(e => e.id === filtros.etapa_id)?.nombre} - {divisiones.find(d => d.id === filtros.division_id)?.nombre}
                  </CardTitle>
                  {minimoRequeridoDivision !== null && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Target className="w-4 h-4" />
                      <span>Mínimo: <span className="text-white font-semibold">{minimoRequeridoDivision}</span> partido{minimoRequeridoDivision !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Pos.</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Jugador</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">PJ</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">PG</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Prom. Ind.</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Prom. Gen.</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Prom. Final</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Estado</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((ranking, index) => {
                        const minimo = ranking.minimo_requerido != null ? ranking.minimo_requerido : minimoRequeridoDivision
                        const partidosJugados = ranking.partidos_jugados || 0
                        const cumpleMinimo = partidosJugados >= minimo && minimo > 0
                        
                        // Determinar en qué zona está el jugador
                        const esAscenso = zonasAscensoDescenso.jugadoresAscenso.some(j => j.usuario_id === ranking.usuario_id)
                        const esDescenso = zonasAscensoDescenso.jugadoresDescenso.some(j => j.usuario_id === ranking.usuario_id)
                        const esPlayoffAscenso = zonasAscensoDescenso.jugadoresPlayoff?.playoff_ascenso?.some(j => j.usuario_id === ranking.usuario_id)
                        const esPlayoffDescenso = zonasAscensoDescenso.jugadoresPlayoff?.playoff_descenso?.some(j => j.usuario_id === ranking.usuario_id)
                        
                        // Verificar si es el usuario logueado
                        const esUsuarioLogueado = usuarioLogueado && ranking.usuario_id === usuarioLogueado.id
                        
                        // Determinar clase CSS según la zona
                        let zonaClass = ''
                        let zonaTitle = ''
                        
                        if (!cumpleMinimo) {
                          zonaClass = 'hover:bg-gray-800/50'
                          zonaTitle = 'No cumple mínimo. No participa en ascensos/descensos.'
                        } else if (esAscenso) {
                          zonaClass = 'bg-green-900/20 hover:bg-green-900/30 border-l-4 border-green-500'
                          zonaTitle = 'Zona de Ascenso'
                        } else if (esDescenso) {
                          zonaClass = 'bg-red-900/20 hover:bg-red-900/30 border-l-4 border-red-500'
                          zonaTitle = 'Zona de Descenso'
                        } else if (esPlayoffAscenso) {
                          zonaClass = 'bg-blue-900/20 hover:bg-blue-900/30 border-l-4 border-blue-500'
                          zonaTitle = 'Zona de Playoff de Ascenso'
                        } else if (esPlayoffDescenso) {
                          zonaClass = 'bg-yellow-900/20 hover:bg-yellow-900/30 border-l-4 border-yellow-500'
                          zonaTitle = 'Zona de Playoff de Descenso'
                        } else {
                          zonaClass = 'hover:bg-gray-800/50'
                        }
                        
                        // Si es el usuario logueado, solo agregar al título (sin cambiar estilos de la fila)
                        if (esUsuarioLogueado) {
                          zonaTitle = 'Tú' + (zonaTitle ? ` - ${zonaTitle}` : '')
                        }
                        
                        return (
                          <tr
                            key={ranking.id || `inscripcion-${ranking.usuario_id}-${index}`}
                            className={`border-b border-gray-800 transition-colors ${zonaClass}`}
                            title={zonaTitle || (!cumpleMinimo ? 'No cumple mínimo. No participa en ascensos/descensos.' : '')}
                          >
                            <td className="py-3 px-4">
                              {cumpleMinimo && ranking.posicion_ranking ? (
                                <span className="text-white font-semibold">{ranking.posicion_ranking}</span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <User className={`w-4 h-4 ${esUsuarioLogueado ? 'text-[#E2FF1B]' : 'text-gray-400'}`} />
                                <div>
                                  <div className={`font-medium ${esUsuarioLogueado ? 'text-[#E2FF1B] font-bold' : 'text-white'}`}>
                                    {obtenerNombreJugador(ranking.usuario)}
                                    {esUsuarioLogueado && (
                                      <Badge className="ml-2 bg-[#E2FF1B] text-black text-xs">
                                        Tú
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">
                              {partidosJugados}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">
                              {ranking.partidos_ganados || 0}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">
                              {ranking.promedio_individual ? ranking.promedio_individual.toFixed(2) : '0.00'}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">
                              {ranking.promedio_general ? ranking.promedio_general.toFixed(2) : '0.00'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-white">
                                {ranking.promedio_final ? ranking.promedio_final.toFixed(2) : '0.00'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {cumpleMinimo ? (
                                <Badge variant="default" className="bg-green-600 text-white">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Cumple
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-600 text-gray-500 bg-gray-800/50">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {partidosJugados === 0 ? 'Sin partidos' : 'No cumple'}
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerDetalle(ranking)}
                                className="text-white hover:bg-gray-800"
                              >
                                Ver Detalle
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Dialog de Detalle */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-5xl w-[95vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Detalle del Ranking</DialogTitle>
              <DialogDescription className="text-gray-400">
                Información detallada del cálculo del ranking
              </DialogDescription>
            </DialogHeader>

            {detalleRanking && (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Jugador
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nombre:</span>
                      <span className="text-white">{obtenerNombreJugador(detalleRanking.usuario)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Posición:</span>
                      <span className="text-white font-semibold">
                        {detalleRanking.posicion_ranking || 'Sin posición'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Estadísticas de Partidos
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Partidos Jugados:</span>
                        <span className="text-white">{detalleRanking.partidos_jugados || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Partidos Ganados:</span>
                        <span className="text-white">{detalleRanking.partidos_ganados || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Diferencia Sets:</span>
                        <span className={`${(detalleRanking.diferencia_sets || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {detalleRanking.diferencia_sets || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Diferencia Games:</span>
                        <span className={`${(detalleRanking.diferencia_games || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {detalleRanking.diferencia_games || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Promedios
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Promedio Individual:</span>
                        <span className="text-white">
                          {detalleRanking.promedio_individual ? detalleRanking.promedio_individual.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Promedio General:</span>
                        <span className="text-white">
                          {detalleRanking.promedio_general ? detalleRanking.promedio_general.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bonus por Jugar:</span>
                        <span className="text-green-400">
                          {detalleRanking.bonus_por_jugar ? detalleRanking.bonus_por_jugar.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold">Promedio Final:</span>
                        <span className="text-yellow-500 font-semibold">
                          {detalleRanking.promedio_final ? detalleRanking.promedio_final.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Mínimo Requerido
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Mínimo de la división:</span>
                        <span className="text-white font-semibold">
                          {detalleRanking.minimo_requerido ? Math.ceil(detalleRanking.minimo_requerido) : 0} partido{detalleRanking.minimo_requerido && Math.ceil(detalleRanking.minimo_requerido) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Partidos jugados:</span>
                        <span className="text-white font-semibold">
                          {detalleRanking.partidos_jugados || 0} / {detalleRanking.minimo_requerido ? Math.ceil(detalleRanking.minimo_requerido) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                        <span className="text-gray-400">Estado:</span>
                        {detalleRanking.cumple_minimo ? (
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
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

