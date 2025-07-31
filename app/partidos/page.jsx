"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, Trophy, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from '@/components/ui/separator'
import MatchDetailModal from '@/components/MatchDetailModal'

export default function PartidosPage() {
  const { toast } = useToast()
  const [partidos, setPartidos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategoria, setFilterCategoria] = useState('all')
  const [filterEstado, setFilterEstado] = useState('all')
  const [viewMode, setViewMode] = useState('calendar') // Solo vista de lista
  const [selectedPartido, setSelectedPartido] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

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
        .order('fecha', { ascending: true })

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

  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'N/A'
    const jugador1 = equipo.titular_1 ? `${equipo.titular_1.nombre} ${equipo.titular_1.apellido}` : 'N/A'
    const jugador2 = equipo.titular_2 ? `${equipo.titular_2.nombre} ${equipo.titular_2.apellido}` : 'N/A'
    return `${jugador1} / ${jugador2}`
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
    return <Badge variant={variants[estado] || 'secondary'}>{labels[estado] || estado}</Badge>
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
      <Badge className={`${colors[ronda] || 'bg-gray-500'} text-white`}>
        {ronda}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha por definir'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
    const estadoMatch = filterEstado === 'all' || partido.estado === filterEstado
    return categoriaMatch && estadoMatch
  })

  const groupedPartidos = filteredPartidos.reduce((groups, partido) => {
    const date = formatDate(partido.fecha)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(partido)
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-[#E2FF1B]">Próximos</span> Partidos
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-4">
            Mantente al día con todos los partidos programados de nuestras ligas y torneos
          </p>
        </div>

        {/* Filters */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-full sm:w-[200px] bg-black/20 border-white/20 text-white">
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

              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-full sm:w-[200px] bg-black/20 border-white/20 text-white">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Programados</SelectItem>
                  <SelectItem value="jugado">Finalizados</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredPartidos.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No hay partidos programados
            </h3>
            <p className="text-gray-500">
              No se encontraron partidos con los filtros seleccionados
            </p>
          </div>
                 ) : (
           <div className="space-y-6">
             {Object.entries(groupedPartidos).map(([date, partidosDelDia]) => (
                <Card key={date} className="bg-black/20 backdrop-blur-sm border-white/10">
                  <CardHeader className="border-b border-white/10">
                                         <CardTitle className="flex items-center gap-2 text-[#E2FF1B] text-sm md:text-base">
                       <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                       {date}
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid gap-4 p-6">
                      {partidosDelDia.map((partido) => (
                        <div key={partido.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getRondaBadge(partido.ronda)}
                                {getEstadoBadge(partido.estado)}
                              </div>
                              <p className="text-sm text-gray-400 mb-2">
                                {getCategoriaNombre(partido)}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                                <Clock className="w-4 h-4" />
                                {formatTime(partido.fecha)}
                              </div>
                            </div>
                            
                                                         <div className="flex flex-col md:flex-row items-center gap-4">
                               <div className={`text-center ${partido.estado === 'jugado' && partido.equipo_ganador_id === partido.equipo_a?.id ? 'bg-[#E2FF1B]/10 rounded-lg p-2 border border-[#E2FF1B]/30' : ''}`}>
                                 <p className={`font-semibold ${partido.estado === 'jugado' && partido.equipo_ganador_id === partido.equipo_a?.id ? 'text-[#E2FF1B]' : 'text-white'}`}>
                                   {getEquipoNombre(partido.equipo_a)}
                                 </p>
                                 <p className={`text-sm ${partido.estado === 'jugado' && partido.equipo_ganador_id === partido.equipo_a?.id ? 'text-[#E2FF1B]/80' : 'text-gray-400'}`}>
                                   Equipo A
                                 </p>
                               </div>
                               
                               <div className="text-2xl font-bold text-[#E2FF1B]">VS</div>
                               
                               <div className={`text-center ${partido.estado === 'jugado' && partido.equipo_ganador_id === partido.equipo_b?.id ? 'bg-[#E2FF1B]/10 rounded-lg p-2 border border-[#E2FF1B]/30' : ''}`}>
                                 <p className={`font-semibold ${partido.estado === 'jugado' && partido.equipo_ganador_id === partido.equipo_b?.id ? 'text-[#E2FF1B]' : 'text-white'}`}>
                                   {getEquipoNombre(partido.equipo_b)}
                                 </p>
                                 <p className={`text-sm ${partido.estado === 'jugado' && partido.equipo_ganador_id === partido.equipo_b?.id ? 'text-[#E2FF1B]/80' : 'text-gray-400'}`}>
                                   Equipo B
                                 </p>
                               </div>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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