"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Clock, Users, Trophy, Filter, MapPin, Search, ArrowLeft } from 'lucide-react'
import { formatArgentineDateLong } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import Link from 'next/link'

export default function PartidosCircuitookaPage() {
  const { toast } = useToast()
  const [partidos, setPartidos] = useState([])
  const [etapas, setEtapas] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEtapa, setFilterEtapa] = useState('all')
  const [filterDivision, setFilterDivision] = useState('all')
  const [filterEstado, setFilterEstado] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener etapas
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

      // Obtener todos los partidos
      const params = new URLSearchParams()
      const response = await fetch(`/api/circuitooka/partidos?${params.toString()}`)
      const result = await response.json()

      if (!result.success) throw new Error(result.error)
      setPartidos(result.data || [])
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

  // Función para obtener nombre completo del jugador
  const obtenerNombreJugador = (jugador) => {
    if (!jugador) return 'N/A'
    return `${jugador.nombre || ''} ${jugador.apellido || ''}`.trim() || 'N/A'
  }

  // Función para obtener nombre abreviado (solo apellido)
  const getNombreAbreviado = (jugador) => {
    if (!jugador) return 'N/A'
    const apellido = jugador.apellido || 'N/A'
    if (apellido === 'N/A') return apellido
    
    return apellido
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ')
  }

  // Función para buscar en el texto del partido
  const searchInPartido = (partido, searchTerm) => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    
    // Buscar en nombres de jugadores
    const jugadorA1 = partido.jugador_a1?.nombre?.toLowerCase() || ''
    const jugadorA1Apellido = partido.jugador_a1?.apellido?.toLowerCase() || ''
    const jugadorA2 = partido.jugador_a2?.nombre?.toLowerCase() || ''
    const jugadorA2Apellido = partido.jugador_a2?.apellido?.toLowerCase() || ''
    
    const jugadorB1 = partido.jugador_b1?.nombre?.toLowerCase() || ''
    const jugadorB1Apellido = partido.jugador_b1?.apellido?.toLowerCase() || ''
    const jugadorB2 = partido.jugador_b2?.nombre?.toLowerCase() || ''
    const jugadorB2Apellido = partido.jugador_b2?.apellido?.toLowerCase() || ''
    
    // Buscar en división y etapa
    const division = partido.division?.nombre?.toLowerCase() || ''
    const etapa = partido.etapa?.nombre?.toLowerCase() || ''
    
    // Buscar en estado
    const estado = partido.estado?.toLowerCase() || ''
    
    return (
      jugadorA1.includes(term) ||
      jugadorA1Apellido.includes(term) ||
      jugadorA2.includes(term) ||
      jugadorA2Apellido.includes(term) ||
      jugadorB1.includes(term) ||
      jugadorB1Apellido.includes(term) ||
      jugadorB2.includes(term) ||
      jugadorB2Apellido.includes(term) ||
      division.includes(term) ||
      etapa.includes(term) ||
      estado.includes(term)
    )
  }

  // Función para verificar si el partido coincide con la fecha seleccionada
  const matchesSelectedDate = (partido) => {
    if (!selectedDate || !partido.fecha_partido) return true
    
    // Parsear la fecha del partido manualmente para evitar problemas de zona horaria
    // Si viene como string YYYY-MM-DD, extraer año, mes y día directamente
    let partidoYear, partidoMonth, partidoDay
    
    if (typeof partido.fecha_partido === 'string') {
      // Si es formato YYYY-MM-DD
      if (partido.fecha_partido.includes('T')) {
        // Si tiene hora, extraer solo la parte de fecha
        const datePart = partido.fecha_partido.split('T')[0]
        const [year, month, day] = datePart.split('-')
        partidoYear = parseInt(year)
        partidoMonth = parseInt(month) - 1 // Los meses en JS son 0-indexed
        partidoDay = parseInt(day)
      } else {
        // Si es solo fecha YYYY-MM-DD
        const [year, month, day] = partido.fecha_partido.split('-')
        partidoYear = parseInt(year)
        partidoMonth = parseInt(month) - 1 // Los meses en JS son 0-indexed
        partidoDay = parseInt(day)
      }
    } else {
      // Si ya es un objeto Date
      const partidoDate = new Date(partido.fecha_partido)
      partidoYear = partidoDate.getFullYear()
      partidoMonth = partidoDate.getMonth()
      partidoDay = partidoDate.getDate()
    }
    
    // Crear fechas solo con año, mes y día (sin hora) para comparar
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    const partidoDateOnly = new Date(partidoYear, partidoMonth, partidoDay)
    
    return partidoDateOnly.getTime() === selectedDateOnly.getTime()
  }

  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'default',
      jugado: 'secondary',
      cancelado: 'destructive',
      WO: 'destructive'
    }
    const labels = {
      pendiente: 'Programado',
      jugado: 'Finalizado',
      cancelado: 'Cancelado',
      WO: 'Walkover'
    }
    return <Badge variant={variants[estado] || 'secondary'} className="text-xs sm:text-sm">{labels[estado] || estado}</Badge>
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha por definir'
    return formatArgentineDateLong(dateString)
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    return timeString.substring(0, 5) // HH:MM
  }

  const filteredPartidos = partidos.filter(partido => {
    const etapaMatch = filterEtapa === 'all' || partido.etapa_id === filterEtapa
    const divisionMatch = filterDivision === 'all' || partido.division_id === filterDivision
    const estadoMatch = filterEstado === 'all' || partido.estado === filterEstado
    const searchMatch = searchInPartido(partido, searchTerm)
    const dateMatch = matchesSelectedDate(partido)
    
    return etapaMatch && divisionMatch && estadoMatch && searchMatch && dateMatch
  })

  // Agrupar partidos por fecha y luego por división
  const groupedPartidos = filteredPartidos.reduce((groups, partido) => {
    const date = formatDate(partido.fecha_partido)
    const divisionNombre = partido.division?.nombre || `División ${partido.division?.numero_division || 'N/A'}`
    
    if (!groups[date]) {
      groups[date] = {}
    }
    
    if (!groups[date][divisionNombre]) {
      groups[date][divisionNombre] = []
    }
    
    groups[date][divisionNombre].push(partido)
    return groups
  }, {})

  const limpiarFiltros = () => {
    setFilterEtapa('all')
    setFilterDivision('all')
    setFilterEstado('all')
    setSearchTerm('')
    setSelectedDate(null)
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
        <div className="mb-6 sm:mb-8">
          <Link href="/circuitooka">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Circuitooka
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              <span className="text-[#E2FF1B]">Partidos</span> Circuitooka
            </h1>
            <p className="text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto mb-4 px-4">
              Todos los partidos del circuito Circuitooka
            </p>
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
                  placeholder="Buscar por jugador, división, etapa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/20 border-white/20 text-white placeholder:text-gray-400 h-10 sm:h-9"
                />
              </div>
              
              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal bg-black/20 border border-white/10 text-white h-10 sm:h-9 rounded-md",
                      !selectedDate && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-white/20" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    locale={es}
                    className="bg-gray-800 text-white"
                    formatters={{
                      formatMonthDropdown: (date) =>
                        date.toLocaleString("es", { month: "long" }),
                      formatYearDropdown: (date) =>
                        date.toLocaleString("es", { year: "numeric" }),
                    }}
                    classNames={{
                      caption_label: "text-white font-medium",
                      nav_button: "text-white hover:bg-white/10 border-white/20",
                      day: "text-white hover:bg-white/10 rounded-md",
                      day_selected: "!bg-[#E2FC1D] !text-black hover:!bg-[#E2FC1D] hover:!text-black focus:!bg-[#E2FC1D] focus:!text-black font-semibold",
                      today: "bg-white/20 text-white border border-white/40",
                      day_outside: "text-gray-500 opacity-50",
                      weekday: "text-gray-400",
                      weekdays: "hidden",
                    }}
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={filterEtapa} onValueChange={setFilterEtapa}>
                <SelectTrigger className="w-full sm:w-[200px] bg-black/20 border-white/20 text-white h-10 sm:h-9">
                  <SelectValue placeholder="Todas las etapas" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  <SelectItem value="all">Todas las etapas</SelectItem>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDivision} onValueChange={setFilterDivision}>
                <SelectTrigger className="w-full sm:w-[200px] bg-black/20 border-white/20 text-white h-10 sm:h-9">
                  <SelectValue placeholder="Todas las divisiones" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  <SelectItem value="all">Todas las divisiones</SelectItem>
                  {divisiones.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.nombre || `División ${division.numero_division}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-full sm:w-[200px] bg-black/20 border-white/20 text-white h-10 sm:h-9">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Programados</SelectItem>
                  <SelectItem value="jugado">Finalizados</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                  <SelectItem value="WO">Walkover</SelectItem>
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
              {searchTerm || selectedDate ? 'No se encontraron partidos con los filtros y búsqueda seleccionados' : 'No se encontraron partidos con los filtros seleccionados'}
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
            {Object.entries(groupedPartidos).map(([date, divisionesDelDia]) => (
              <div key={date} className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 bg-[#E2FF1B]/10 px-3 sm:px-4 py-2 rounded-full border border-[#E2FF1B]/30">
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    <span className="text-[#E2FF1B] font-semibold text-sm sm:text-lg">{date}</span>
                  </div>
                </div>

                {/* Divisiones */}
                <div className="space-y-4 sm:space-y-6">
                  {Object.entries(divisionesDelDia).map(([divisionNombre, partidosEnDivision]) => (
                    <div key={divisionNombre} className="space-y-3 sm:space-y-4">
                      {/* División Header */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-2 rounded-full border border-white/20">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          <span className="text-white font-semibold text-sm sm:text-base">{divisionNombre}</span>
                        </div>
                      </div>

                      {/* Partidos de esta división */}
                      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {partidosEnDivision.map((partido) => (
                          <Card 
                            key={partido.id} 
                            className="bg-black/30 backdrop-blur-sm border-white/20 hover:border-[#E2FF1B]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/10"
                          >
                            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getEstadoBadge(partido.estado)}
                                </div>
                                {partido.horario && (
                                  <div className="flex items-center gap-2 text-[#E2FF1B]">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="font-semibold text-sm sm:text-base">{formatTime(partido.horario)}</span>
                                  </div>
                                )}
                              </div>
                            </CardHeader>

                            <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                              {/* Equipos */}
                              <div className="flex flex-col items-center justify-center gap-4">
                                {/* Equipo A */}
                                <div className={`w-full text-center p-3 rounded-xl transition-all duration-300 ${
                                  partido.estado === 'jugado' && partido.equipo_ganador === 'A' 
                                    ? 'bg-black/20 border-2 border-[#E2FF1B] hover:border-[#E2FF1B]/80'
                                    : 'bg-black/20 border border-white/20 hover:border-[#E2FF1B]/30'
                                }`}>
                                  <div className="space-y-2">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-bold text-sm sm:text-base text-white">
                                        {getNombreAbreviado(partido.jugador_a1)}
                                      </span>
                                      <span className="font-bold text-sm sm:text-base text-white">
                                        {getNombreAbreviado(partido.jugador_a2)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
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
                                  partido.estado === 'jugado' && partido.equipo_ganador === 'B' 
                                    ? 'bg-black/20 border-2 border-[#E2FF1B] hover:border-[#E2FF1B]/80'
                                    : 'bg-black/20 border border-white/20 hover:border-[#E2FF1B]/30'
                                }`}>
                                  <div className="space-y-2">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-bold text-sm sm:text-base text-white">
                                        {getNombreAbreviado(partido.jugador_b1)}
                                      </span>
                                      <span className="font-bold text-sm sm:text-base text-white">
                                        {getNombreAbreviado(partido.jugador_b2)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
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
                              {partido.estado === 'jugado' && partido.equipo_ganador && (
                                <div className="mt-4 p-4 bg-[#E2FF1B]/10 border border-[#E2FF1B]/30 rounded-lg">
                                  <div className="text-center mb-4">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                      <Trophy className="w-4 h-4 text-[#E2FF1B]" />
                                      <span className="text-[#E2FF1B] font-semibold text-sm">Ganador: Equipo {partido.equipo_ganador}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Resultado del partido - mostrar sets individuales si están disponibles */}
                                  {partido.resultado_detallado && partido.resultado_detallado.sets && partido.resultado_detallado.sets.length > 0 ? (
                                    <div className="space-y-2">
                                      <div className="text-center mb-3">
                                        <span className="text-[#E2FF1B] font-semibold text-xs uppercase tracking-wide">Resultado por Sets</span>
                                      </div>
                                      <div className="grid grid-cols-1 gap-2">
                                        {partido.resultado_detallado.sets.map((set, index) => {
                                          const gamesA = set.equipo_a || 0
                                          const gamesB = set.equipo_b || 0
                                          const ganadorSet = gamesA > gamesB ? 'A' : gamesB > gamesA ? 'B' : null
                                          const esGanador = ganadorSet === partido.equipo_ganador
                                          
                                          return (
                                            <div 
                                              key={index} 
                                              className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                                esGanador 
                                                  ? 'bg-[#E2FF1B]/20 border-[#E2FF1B]/50' 
                                                  : 'bg-black/20 border-white/10'
                                              }`}
                                            >
                                              <span className="text-gray-400 text-xs font-medium w-12 text-left">
                                                Set {index + 1}
                                              </span>
                                              <div className="flex items-center gap-3 flex-1 justify-center">
                                                <span className={`text-sm font-bold ${
                                                  ganadorSet === 'A' ? 'text-[#E2FF1B]' : 'text-white'
                                                }`}>
                                                  {gamesA}
                                                </span>
                                                <span className="text-gray-500 text-xs">-</span>
                                                <span className={`text-sm font-bold ${
                                                  ganadorSet === 'B' ? 'text-[#E2FF1B]' : 'text-white'
                                                }`}>
                                                  {gamesB}
                                                </span>
                                              </div>
                                              {ganadorSet && (
                                                <div className="w-12 text-right">
                                                  <span className={`text-xs font-semibold ${
                                                    esGanador ? 'text-[#E2FF1B]' : 'text-gray-400'
                                                  }`}>
                                                    {esGanador ? '✓' : ''}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ) : (partido.games_equipo_a !== null || partido.games_equipo_b !== null || partido.games_equipo_a > 0 || partido.games_equipo_b > 0) ? (
                                    <div className="border-t border-[#E2FF1B]/30 pt-3">
                                      <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className="text-[#E2FF1B] font-semibold text-sm">Resultado</span>
                                      </div>
                                      <div className="text-white text-sm">
                                        <span className="font-medium">
                                          Equipo A: {partido.games_equipo_a || 0} games - Equipo B: {partido.games_equipo_b || 0} games
                                        </span>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

