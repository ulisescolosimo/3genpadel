"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Clock, Users, Trophy, Filter, MapPin, List, Search } from 'lucide-react'
import { formatArgentineDateLong, formatArgentineDateShort } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import MatchDetailModal from '@/components/MatchDetailModal'
import Link from 'next/link'

export default function PartidosPage() {
  const { toast } = useToast()
  const [partidos, setPartidos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategoria, setFilterCategoria] = useState('all')
  const [filterInstancia, setFilterInstancia] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPartido, setSelectedPartido] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchData()
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener categorías
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('liga_categorias')
        .select(`
          id,
          categoria,
          ligas (
            id,
            nombre,
            fecha_inicio
          )
        `)
        .order('liga_id', { ascending: true })
        .order('categoria', { ascending: true })

      if (categoriasError) throw categoriasError
      setCategorias(categoriasData || [])

      // Obtener partidos programados
      const { data: partidosData, error: partidosError } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            ligas (
              id,
              nombre,
              fecha_inicio
            )
          ),
          equipo_a:ligainscripciones!liga_partidos_equipo_a_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            )
          ),
          equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            )
          ),
          equipo_ganador:ligainscripciones!liga_partidos_equipo_ganador_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            )
          )
        `)
        .order('fecha', { ascending: false })

      if (partidosError) throw partidosError
      setPartidos(partidosData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los partidos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para abreviar nombres (solo apellido)
  const getNombreAbreviado = (jugador) => {
    if (!jugador) return 'N/A'
    const apellido = jugador.apellido || 'N/A'
    if (apellido === 'N/A') return apellido
    
    // Capitalizar la primera letra de cada palabra del apellido
    return apellido
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ')
  }

  // Función para obtener el nombre completo del equipo abreviado
  const getEquipoNombreAbreviado = (equipo) => {
    if (!equipo) return 'N/A'
    const jugador1 = getNombreAbreviado(equipo.titular_1)
    const jugador2 = getNombreAbreviado(equipo.titular_2)
    return `${jugador1} / ${jugador2}`
  }

  // Función para verificar si el usuario juega en este partido
  const isUserPlaying = (partido) => {
    if (!user) return false
    
    const equipoA = partido.equipo_a
    const equipoB = partido.equipo_b
    
    // Verificar si el usuario es titular_1 o titular_2 en cualquiera de los equipos
    const isInEquipoA = equipoA && (
      (equipoA.titular_1 && equipoA.titular_1.id === user.id) ||
      (equipoA.titular_2 && equipoA.titular_2.id === user.id)
    )
    
    const isInEquipoB = equipoB && (
      (equipoB.titular_1 && equipoB.titular_1.id === user.id) ||
      (equipoB.titular_2 && equipoB.titular_2.id === user.id)
    )
    
    return isInEquipoA || isInEquipoB
  }

  // Función para verificar si el usuario juega en un equipo específico
  const isUserInEquipo = (equipo) => {
    if (!user || !equipo) return false
    
    return (
      (equipo.titular_1 && equipo.titular_1.id === user.id) ||
      (equipo.titular_2 && equipo.titular_2.id === user.id)
    )
  }

  // Función para formatear el resultado desde la perspectiva del ganador
  const formatResultadoFromWinner = (resultado, equipoGanadorId, equipoAId, equipoBId) => {
    if (!resultado || !equipoGanadorId) return resultado
    
    // Dividir el resultado en sets (ej: "6-7 / 6-1 / 6-3")
    const sets = resultado.split('/').map(set => set.trim())
    
    // Si el equipo A es el ganador, mostrar los sets tal como están
    if (equipoGanadorId === equipoAId) {
      return resultado
    }
    
    // Si el equipo B es el ganador, invertir el orden de los sets
    if (equipoGanadorId === equipoBId) {
      return sets.map(set => {
        const [score1, score2] = set.split('-').map(s => s.trim())
        return `${score2}-${score1}`
      }).join(' / ')
    }
    
    // Si no se puede determinar, mostrar el resultado original
    return resultado
  }

  // Función para buscar en el texto del partido
  const searchInPartido = (partido, searchTerm) => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    
    // Buscar en nombres de jugadores
    const jugador1A = partido.equipo_a?.titular_1?.nombre?.toLowerCase() || ''
    const jugador1AApellido = partido.equipo_a?.titular_1?.apellido?.toLowerCase() || ''
    const jugador2A = partido.equipo_a?.titular_2?.nombre?.toLowerCase() || ''
    const jugador2AApellido = partido.equipo_a?.titular_2?.apellido?.toLowerCase() || ''
    
    const jugador1B = partido.equipo_b?.titular_1?.nombre?.toLowerCase() || ''
    const jugador1BApellido = partido.equipo_b?.titular_1?.apellido?.toLowerCase() || ''
    const jugador2B = partido.equipo_b?.titular_2?.nombre?.toLowerCase() || ''
    const jugador2BApellido = partido.equipo_b?.titular_2?.apellido?.toLowerCase() || ''
    
    // Buscar en categoría y liga
    const categoria = partido.liga_categorias?.categoria?.toLowerCase() || ''
    const liga = partido.liga_categorias?.ligas?.nombre?.toLowerCase() || ''
    
    // Buscar en ronda
    const ronda = partido.ronda?.toLowerCase() || ''
    
    // Buscar en estado
    const estado = partido.estado?.toLowerCase() || ''
    
    return (
      jugador1A.includes(term) ||
      jugador1AApellido.includes(term) ||
      jugador2A.includes(term) ||
      jugador2AApellido.includes(term) ||
      jugador1B.includes(term) ||
      jugador1BApellido.includes(term) ||
      jugador2B.includes(term) ||
      jugador2BApellido.includes(term) ||
      categoria.includes(term) ||
      liga.includes(term) ||
      ronda.includes(term) ||
      estado.includes(term)
    )
  }

  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'default',
      jugado: 'secondary',
      cancelado: 'destructive'
    }
    const labels = {
      pendiente: 'Programado',
      jugado: 'Finalizado',
      cancelado: 'Cancelado'
    }
    return <Badge variant={variants[estado] || 'secondary'} className="text-xs sm:text-sm">{labels[estado] || estado}</Badge>
  }

  const getRondaBadge = (ronda) => {
    const colors = {
      'Grupos': 'bg-blue-500',
      'Octavos': 'bg-purple-500',
      'Cuartos': 'bg-orange-500',
      'Semifinal': 'bg-red-500',
      'Final': 'bg-yellow-500'
    }
    return (
      <Badge className={`${colors[ronda] || 'bg-gray-500'} text-white text-xs sm:text-sm`}>
        {ronda}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha por definir'
    return formatArgentineDateLong(dateString)
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Hora por definir'
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoriaNombre = (partido) => {
    if (!partido.liga_categorias) return 'N/A'
    const liga = partido.liga_categorias.ligas
    const categoria = partido.liga_categorias.categoria
    return `${liga?.nombre || 'N/A'} - ${categoria}`
  }

  const filteredPartidos = partidos.filter(partido => {
    const categoriaMatch = filterCategoria === 'all' || 
      partido.liga_categorias?.id === parseInt(filterCategoria)
    const instanciaMatch = filterInstancia === 'all' || partido.ronda === filterInstancia
    const searchMatch = searchInPartido(partido, searchTerm)
    
    return categoriaMatch && instanciaMatch && searchMatch
  })

  // Agrupar partidos por fecha y luego por categoría
  const groupedPartidos = filteredPartidos.reduce((groups, partido) => {
    const date = formatDate(partido.fecha)
    const categoriaNombre = getCategoriaNombre(partido)
    
    if (!groups[date]) {
      groups[date] = {}
    }
    
    if (!groups[date][categoriaNombre]) {
      groups[date][categoriaNombre] = []
    }
    
    groups[date][categoriaNombre].push(partido)
    return groups
  }, {})

  const handleEventClick = (partido) => {
    setSelectedPartido(partido)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedPartido(null)
  }

  const limpiarFiltros = () => {
    setFilterCategoria('all')
    setFilterInstancia('all')
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E2FF1B]"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-10">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
            <span className="text-[#E2FF1B]">Próximos</span> Partidos
          </h1>
          <p className="text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto mb-4 px-4">
            Mantente al día con todos los partidos programados de nuestras ligas y torneos
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/partidos/tabla-posiciones">
              <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/20">
                <Trophy className="h-4 w-4 mr-2" />
                Tabla de posiciones
              </Button>
            </Link>
            <Link href="/partidos/brackets">
              <Button variant="outline" className="border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B] hover:text-black font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/20">
                <Users className="h-4 w-4 mr-2" />
                Brackets
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-white/10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar por jugador, equipo, categoría, liga, ronda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/20 border-white/20 text-white placeholder:text-gray-400 h-10 sm:h-9"
                />
              </div>
              
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-full sm:w-[280px] bg-black/20 border-white/20 text-white h-10 sm:h-9">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.ligas?.nombre} - {categoria.categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterInstancia} onValueChange={setFilterInstancia}>
                <SelectTrigger className="w-full sm:w-[220px] bg-black/20 border-white/20 text-white h-10 sm:h-9">
                  <SelectValue placeholder="Todas las instancias" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  <SelectItem value="all">Todas las instancias</SelectItem>
                  <SelectItem value="Grupos">Grupos</SelectItem>
                  <SelectItem value="Octavos">Octavos</SelectItem>
                  <SelectItem value="Cuartos">Cuartos</SelectItem>
                  <SelectItem value="Semifinal">Semifinal</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredPartidos.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
              No hay partidos programados
            </h3>
            <p className="text-gray-500 text-sm sm:text-base mb-6">
              {searchTerm ? 'No se encontraron partidos con los filtros y búsqueda seleccionados' : 'No se encontraron partidos con los filtros seleccionados'}
            </p>
            <Button 
              onClick={limpiarFiltros} 
              className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/80 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/20"
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          // Vista de Lista
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(groupedPartidos).map(([date, categoriasDelDia]) => (
              <div key={date} className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 bg-[#E2FF1B]/10 px-3 sm:px-4 py-2 rounded-full border border-[#E2FF1B]/30">
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    <span className="text-[#E2FF1B] font-semibold text-sm sm:text-lg">{date}</span>
                  </div>
                </div>

                {/* Categorías */}
                <div className="space-y-4 sm:space-y-6">
                  {Object.entries(categoriasDelDia).map(([categoriaNombre, partidosEnCategoria]) => (
                    <div key={categoriaNombre} className="space-y-3 sm:space-y-4">
                      {/* Categoría Header */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-2 rounded-full border border-white/20">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          <span className="text-white font-semibold text-sm sm:text-base">{categoriaNombre}</span>
                        </div>
                      </div>

                      {/* Partidos de esta categoría */}
                      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {partidosEnCategoria.map((partido) => {
                          const userIsPlaying = isUserPlaying(partido)
                          const userInEquipoA = isUserInEquipo(partido.equipo_a)
                          const userInEquipoB = isUserInEquipo(partido.equipo_b)
                          
                          return (
                            <Card 
                              key={partido.id} 
                              className="bg-black/30 backdrop-blur-sm border-white/20 hover:border-[#E2FF1B]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/10 cursor-pointer group"
                              onClick={() => handleEventClick(partido)}
                            >
                              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {getRondaBadge(partido.ronda)}
                                    {getEstadoBadge(partido.estado)}
                                  </div>
                                  <div className="flex items-center gap-2 text-[#E2FF1B]">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="font-semibold text-sm sm:text-base">{formatTime(partido.fecha)}</span>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                                {/* Equipos */}
                                <div className="flex flex-col items-center justify-center gap-4">
                                  {/* Equipo A */}
                                  <div className={`w-full text-center p-3 rounded-xl transition-all duration-300 ${
                                    partido.estado === 'jugado' && partido.equipo_ganador_id === partido.equipo_a?.id 
                                      ? 'bg-black/20 border-2 border-[#E2FF1B] hover:border-[#E2FF1B]/80'
                                      : userInEquipoA && userIsPlaying
                                      ? 'bg-[#E2FC1D]/20 border-2 border-[#E2FC1D]/50 shadow-lg shadow-[#E2FC1D]/20 animate-pulse'
                                      : 'bg-black/20 border border-white/20 hover:border-[#E2FF1B]/30'
                                  }`}>
                                    <div className="space-y-2">
                                      <div className="flex flex-col gap-1">
                                        <span className={`font-bold text-sm sm:text-base ${
                                          userInEquipoA && userIsPlaying
                                            ? 'text-[#E2FC1D]'
                                            : 'text-white'
                                        }`}>
                                          {getNombreAbreviado(partido.equipo_a?.titular_1)}
                                        </span>
                                        <span className={`font-bold text-sm sm:text-base ${
                                          userInEquipoA && userIsPlaying
                                            ? 'text-[#E2FC1D]'
                                            : 'text-white'
                                        }`}>
                                          {getNombreAbreviado(partido.equipo_a?.titular_2)}
                                        </span>
                                      </div>
                                      <div className={`text-xs ${
                                        userInEquipoA && userIsPlaying
                                          ? 'text-[#E2FC1D]/80'
                                          : 'text-gray-400'
                                      }`}>
                                        Equipo A
                                      </div>
                                    </div>
                                  </div>

                                  {/* VS */}
                                  <div className="flex flex-col items-center justify-center px-4">
                                    <div className="text-xl sm:text-3xl font-bold text-[#E2FF1B] mb-2">VS</div>
                                    <div className="w-8 h-0.5 bg-[#E2FF1B] mb-2"></div>
                                  </div>

                                  {/* Equipo B */}
                                  <div className={`w-full text-center p-3 rounded-xl transition-all duration-300 ${
                                    partido.estado === 'jugado' && partido.equipo_ganador_id === partido.equipo_b?.id 
                                      ? 'bg-black/20 border-2 border-[#E2FF1B] hover:border-[#E2FF1B]/80'
                                      : userInEquipoB && userIsPlaying
                                      ? 'bg-[#E2FC1D]/20 border-2 border-[#E2FC1D]/50 shadow-lg shadow-[#E2FC1D]/20 animate-pulse'
                                      : 'bg-black/20 border border-white/20 hover:border-[#E2FF1B]/30'
                                  }`}>
                                    <div className="space-y-2">
                                      <div className="flex flex-col gap-1">
                                        <span className={`font-bold text-sm sm:text-base ${
                                          userInEquipoB && userIsPlaying
                                            ? 'text-[#E2FC1D]'
                                            : 'text-white'
                                        }`}>
                                          {getNombreAbreviado(partido.equipo_b?.titular_1)}
                                        </span>
                                        <span className={`font-bold text-sm sm:text-base ${
                                          userInEquipoB && userIsPlaying
                                            ? 'text-[#E2FC1D]'
                                            : 'text-white'
                                        }`}>
                                          {getNombreAbreviado(partido.equipo_b?.titular_2)}
                                        </span>
                                      </div>
                                      <div className={`text-xs ${
                                        userInEquipoB && userIsPlaying
                                          ? 'text-[#E2FC1D]/80'
                                          : 'text-gray-400'
                                      }`}>
                                        Equipo B
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Cancha */}
                                {partido.cancha && (
                                  <div className="flex items-center justify-center mt-4 gap-1 text-[#E2FC1D]">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="font-medium text-xs sm:text-sm">Cancha {partido.cancha}</span>
                                  </div>
                                )}

                                {/* Resultado del partido cuando ya finalizó */}
                                {partido.estado === 'jugado' && partido.equipo_ganador_id && (
                                  <div className="mt-4 p-3 bg-[#E2FF1B]/10 border border-[#E2FF1B]/30 rounded-lg">
                                    <div className="text-center">
                                      <div className="flex items-center justify-center gap-2 mb-2">
                                        <Trophy className="w-4 h-4 text-[#E2FF1B]" />
                                        <span className="text-[#E2FF1B] font-semibold text-sm">Ganador</span>
                                      </div>
                                      <div className="text-white text-sm mb-3">
                                        <span className="font-medium">
                                          {partido.equipo_ganador_id === partido.equipo_a?.id 
                                            ? getEquipoNombreAbreviado(partido.equipo_a)
                                            : getEquipoNombreAbreviado(partido.equipo_b)
                                          }
                                        </span>
                                      </div>
                                      
                                      {/* Resultado del partido */}
                                      {partido.resultado && (
                                        <div className="border-t border-[#E2FF1B]/30 pt-3">
                                          <div className="flex items-center justify-center gap-2 mb-2">
                                            <span className="text-[#E2FF1B] font-semibold text-sm">Resultado</span>
                                          </div>
                                          <div className="text-white text-sm">
                                            <span className="font-medium">{formatResultadoFromWinner(partido.resultado, partido.equipo_ganador_id, partido.equipo_a?.id, partido.equipo_b?.id)}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles del partido */}
      <MatchDetailModal
        partido={selectedPartido}
        isOpen={showDetailModal}
        onClose={closeDetailModal}
      />
    </div>
  )
} 