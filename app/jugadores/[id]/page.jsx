'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Medal, Target, Users, Calendar, TrendingUp, Award, User, Shield, Star } from 'lucide-react'
import Link from 'next/link'

export default function JugadorPerfil() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [jugador, setJugador] = useState(null)
  const [estadisticas, setEstadisticas] = useState({
    partidosJugados: 0,
    partidosGanados: 0,
    winRate: 0
  })
  const [ultimosPartidos, setUltimosPartidos] = useState([])
  const [posicionRanking, setPosicionRanking] = useState(null)
  const [rankingPorCategoria, setRankingPorCategoria] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (params.id) {
      fetchJugadorData(params.id)
    }
  }, [params.id])

  const fetchJugadorData = async (jugadorId) => {
    try {
      setLoading(true)
      
      // 1. Obtener datos básicos del jugador
      const { data: jugadorData, error: jugadorError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', jugadorId)
        .single()

      if (jugadorError) throw jugadorError
      setJugador(jugadorData)

      // 2. Obtener posición en el ranking desde el parámetro de la URL
      const posicionFromUrl = searchParams.get('posicion')
      if (posicionFromUrl) {
        setPosicionRanking(parseInt(posicionFromUrl))
      } else {
        // Fallback: calcular posición si no viene en la URL
        const { data: rankingData, error: rankingError } = await supabase
          .from('usuarios')
          .select('id, ranking_puntos')
          .not('ranking_puntos', 'is', null)
          .order('ranking_puntos', { ascending: false })

        if (rankingError) throw rankingError
        
        const posicion = rankingData.findIndex(user => user.id === jugadorId) + 1
        setPosicionRanking(posicion)
      }

      // 3. Obtener estadísticas de partidos
      await fetchEstadisticas(jugadorId)

      // 4. Obtener últimos 5 partidos
      await fetchUltimosPartidos(jugadorId)

      // 5. Obtener ranking por categoría
      await fetchRankingPorCategoria(jugadorId)

    } catch (error) {
      console.error('Error fetching jugador data:', error)
      setError('No se pudo cargar la información del jugador')
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async (jugadorId) => {
    try {
      // Obtener todos los partidos donde el jugador participó (titular o suplente)
      const { data: partidosData, error: partidosError } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          equipo_a:ligainscripciones!liga_partidos_equipo_a_id_fkey (
            titular_1_id,
            titular_2_id,
            suplente_1_id,
            suplente_2_id
          ),
          equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
            titular_1_id,
            titular_2_id,
            suplente_1_id,
            suplente_2_id
          ),
          equipo_ganador:ligainscripciones!liga_partidos_equipo_ganador_id_fkey (
            titular_1_id,
            titular_2_id
          )
        `)
        .eq('estado', 'jugado')

      if (partidosError) throw partidosError

      let partidosJugados = 0
      let partidosGanados = 0

      partidosData.forEach(partido => {
        // Verificar si el jugador participó en este partido (titular o suplente)
        const participoEnEquipoA = partido.equipo_a && 
          (partido.equipo_a.titular_1_id === jugadorId || 
           partido.equipo_a.titular_2_id === jugadorId ||
           partido.equipo_a.suplente_1_id === jugadorId ||
           partido.equipo_a.suplente_2_id === jugadorId)
        
        const participoEnEquipoB = partido.equipo_b && 
          (partido.equipo_b.titular_1_id === jugadorId || 
           partido.equipo_b.titular_2_id === jugadorId ||
           partido.equipo_b.suplente_1_id === jugadorId ||
           partido.equipo_b.suplente_2_id === jugadorId)

        if (participoEnEquipoA || participoEnEquipoB) {
          partidosJugados++
          
          // Verificar si ganó
          if (partido.equipo_ganador) {
            const ganoConEquipoA = partido.equipo_ganador.titular_1_id === partido.equipo_a?.titular_1_id
            const ganoConEquipoB = partido.equipo_ganador.titular_1_id === partido.equipo_b?.titular_1_id
            
            if ((participoEnEquipoA && ganoConEquipoA) || (participoEnEquipoB && ganoConEquipoB)) {
              partidosGanados++
            }
          }
        }
      })

      const winRate = partidosJugados > 0 ? (partidosGanados / partidosJugados) * 100 : 0

      setEstadisticas({
        partidosJugados,
        partidosGanados,
        winRate: Math.round(winRate * 100) / 100
      })

    } catch (error) {
      console.error('Error fetching estadísticas:', error)
    }
  }

  const fetchUltimosPartidos = async (jugadorId) => {
    try {
      console.log('🔍 Fetching partidos for jugadorId:', jugadorId)
      
      // Obtener partidos donde participó el jugador específico (tanto jugados como pendientes)
      const { data: partidosData, error: partidosError } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            categoria
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
            ),
            suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
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
            ),
            suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
              id,
              nombre,
              apellido
            )
          ),
          equipo_ganador:ligainscripciones!liga_partidos_equipo_ganador_id_fkey (
            id
          )
        `)
        .in('estado', ['pendiente', 'jugado'])
        .order('fecha', { ascending: false })

      if (partidosError) throw partidosError

      console.log('📊 Raw partidosData from Supabase:', partidosData)
      console.log('📊 Total partidos found:', partidosData?.length || 0)

      // Filtrar partidos donde participó el jugador específico
      const partidosDelJugador = partidosData?.filter(partido => {
        const participoEnEquipoA = partido.equipo_a && 
          (partido.equipo_a.titular_1?.id === jugadorId || 
           partido.equipo_a.titular_2?.id === jugadorId ||
           partido.equipo_a.suplente_1?.id === jugadorId ||
           partido.equipo_a.suplente_2?.id === jugadorId)
        
        const participoEnEquipoB = partido.equipo_b && 
          (partido.equipo_b.titular_1?.id === jugadorId || 
           partido.equipo_b.titular_2?.id === jugadorId ||
           partido.equipo_b.suplente_1?.id === jugadorId ||
           partido.equipo_b.suplente_2?.id === jugadorId)

        const participa = participoEnEquipoA || participoEnEquipoB
        
        if (participa) {
          console.log(`✅ Jugador participa en partido ${partido.id}:`, {
            partidoId: partido.id,
            estado: partido.estado,
            fecha: partido.fecha,
            equipoA: {
              id: partido.equipo_a?.id,
              titular1: partido.equipo_a?.titular_1?.id,
              titular2: partido.equipo_a?.titular_2?.id,
              suplente1: partido.equipo_a?.suplente_1?.id,
              suplente2: partido.equipo_a?.suplente_2?.id
            },
            equipoB: {
              id: partido.equipo_b?.id,
              titular1: partido.equipo_b?.titular_1?.id,
              titular2: partido.equipo_b?.titular_2?.id,
              suplente1: partido.equipo_b?.suplente_1?.id,
              suplente2: partido.equipo_b?.suplente_2?.id
            }
          })
        }

        return participa
      }) || []

      console.log('🎯 Partidos filtrados donde participa el jugador:', partidosDelJugador)
      console.log('🎯 Total partidos filtrados:', partidosDelJugador.length)

      // Separar partidos jugados y pendientes (próximos)
      const partidosJugados = partidosDelJugador.filter(p => p.estado === 'jugado')
      const partidosPendientes = partidosDelJugador.filter(p => p.estado === 'pendiente')

      // Ordenar partidos pendientes por fecha (más próximos primero)
      const partidosPendientesOrdenados = partidosPendientes.sort((a, b) => {
        const fechaA = new Date(a.fecha || 0)
        const fechaB = new Date(b.fecha || 0)
        return fechaA - fechaB
      })

      // Ordenar partidos jugados por fecha (más recientes primero)
      const partidosJugadosOrdenados = partidosJugados.sort((a, b) => {
        const fechaA = new Date(a.fecha || 0)
        const fechaB = new Date(b.fecha || 0)
        return fechaB - fechaA
      })

      // Combinar: primero los próximos (pendientes), luego los jugados
      const todosLosPartidos = [...partidosPendientesOrdenados, ...partidosJugadosOrdenados].slice(0, 5)

      console.log('🏆 Partidos jugados:', partidosJugados.length, partidosJugados)
      console.log('⏰ Partidos pendientes:', partidosPendientes.length, partidosPendientes)
      console.log('📋 Todos los partidos combinados:', todosLosPartidos)

      setUltimosPartidos(todosLosPartidos)

    } catch (error) {
      console.error('Error fetching últimos partidos:', error)
    }
  }

  const fetchRankingPorCategoria = async (jugadorId) => {
    try {
      // Obtener ranking por categoría del jugador
      const { data: rankingData, error: rankingError } = await supabase
        .from('ranking_jugadores')
        .select('*')
        .eq('usuario_id', jugadorId)
        .eq('activo', true)
        .order('puntos', { ascending: false })

      if (rankingError) throw rankingError

      setRankingPorCategoria(rankingData || [])

    } catch (error) {
      console.error('Error fetching ranking por categoría:', error)
    }
  }

  // Función para capitalizar apellidos (primera letra de cada palabra en mayúscula)
  const capitalizarApellido = (apellido) => {
    if (!apellido) return ''
    return apellido
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ')
  }

  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'N/A'
    const titular1 = equipo.titular_1 ? capitalizarApellido(equipo.titular_1.apellido) : ''
    const titular2 = equipo.titular_2 ? capitalizarApellido(equipo.titular_2.apellido) : ''
    
    let equipoStr = `${titular1} & ${titular2}`.replace(' & N/A', '').replace('N/A & ', '')
    
    return equipoStr
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    
    try {
      // Crear la fecha asegurando que se interprete en la zona horaria local
      let fechaObj
      if (typeof fecha === 'string') {
        // Si es un string, asegurar que se interprete como fecha local
        if (fecha.includes('T')) {
          fechaObj = new Date(fecha)
        } else {
          const [year, month, day] = fecha.split('-')
          fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        }
      } else {
        fechaObj = new Date(fecha)
      }
      
      // Formatear fecha en español
      const opcionesFecha = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
      
      const fechaFormateada = fechaObj.toLocaleDateString('es-ES', opcionesFecha)
      
      // Formatear hora en formato 12 horas
      const opcionesHora = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
      
      const horaFormateada = fechaObj.toLocaleTimeString('es-ES', opcionesHora)
      
      // Capitalizar la primera letra del día y mes
      const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)
      
      // Combinar fecha y hora
      return `${fechaCapitalizada} ${horaFormateada}`
      
    } catch (error) {
      console.error('Error formateando fecha:', error)
      return 'N/A'
    }
  }

  // Función para capitalizar nombres (primera letra de cada palabra en mayúscula)
  const capitalizarNombre = (nombre) => {
    if (!nombre) return ''
    return nombre
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ')
  }

  const esPartidoProximo = (fecha) => {
    if (!fecha) return false
    const fechaPartido = new Date(fecha)
    const ahora = new Date()
    return fechaPartido > ahora
  }

  const getResultadoPartido = (partido, jugadorId) => {
    // Si el partido está pendiente, mostrar "Próximo"
    if (partido.estado === 'pendiente') {
      return 'Próximo'
    }
    
    // Si el partido está jugado pero no hay equipo ganador, mostrar "Pendiente"
    if (partido.estado === 'jugado' && !partido.equipo_ganador) {
      return 'Pendiente'
    }
    
    // Si el partido está jugado y hay equipo ganador, determinar victoria/derrota
    if (partido.estado === 'jugado' && partido.equipo_ganador) {
      const participoEnEquipoA = partido.equipo_a && 
        (partido.equipo_a.titular_1?.id === jugadorId || 
         partido.equipo_a.titular_2?.id === jugadorId ||
         partido.equipo_a.suplente_1?.id === jugadorId ||
         partido.equipo_a.suplente_2?.id === jugadorId)
      
      const participoEnEquipoB = partido.equipo_b && 
        (partido.equipo_b.titular_1?.id === jugadorId || 
         partido.equipo_b.titular_2?.id === jugadorId ||
         partido.equipo_b.suplente_1?.id === jugadorId ||
         partido.equipo_b.suplente_2?.id === jugadorId)

      if (partido.equipo_ganador.id === partido.equipo_a?.id && participoEnEquipoA) {
        return 'Victoria'
      } else if (partido.equipo_ganador.id === partido.equipo_b?.id && participoEnEquipoB) {
        return 'Victoria'
      } else {
        return 'Derrota'
      }
    }
    
    // Estado por defecto
    return 'Pendiente'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error || !jugador) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Jugador no encontrado</h2>
          <p className="text-red-500 mb-6">{error || 'El jugador solicitado no existe'}</p>
          <Link 
            href="/rankings" 
            className="px-4 py-2 bg-[#E2FC1D] text-white rounded-lg"
          >
            Ver ranking
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header del perfil */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <Avatar className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32">
              <AvatarImage src={jugador.avatar_url} alt={capitalizarApellido(jugador.apellido)} />
              <AvatarFallback className="text-xl md:text-2xl bg-blue-600">
                {jugador.apellido?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                {capitalizarApellido(jugador.apellido)}
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 items-start sm:items-center">
                {posicionRanking && (
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                    <span className="text-sm md:text-base text-gray-300">
                      Posición #{posicionRanking} en el ranking
                    </span>
                  </div>
                )}
                
                {jugador.ranking_puntos && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    <span className="text-sm md:text-base text-gray-300">
                      {jugador.ranking_puntos} puntos totales
                    </span>
                  </div>
                )}

                {rankingPorCategoria.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#E2FC1D]" />
                    <span className="text-sm md:text-base text-gray-300">
                      {rankingPorCategoria.length} categoría{rankingPorCategoria.length > 1 ? 's' : ''} activa{rankingPorCategoria.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Estadísticas */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-white text-lg md:text-xl">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-700/50 p-3 md:p-4 hover:border-gray-600/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                      </div>
                      <div>
                        <span className="text-sm md:text-base text-gray-300 font-medium">Partidos jugados</span>
                        <div className="text-xs text-gray-400">Total de partidos</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl md:text-2xl font-bold text-white">{estadisticas.partidosJugados}</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-700/50 p-3 md:p-4 hover:border-gray-600/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                      </div>
                      <div>
                        <span className="text-sm md:text-base text-gray-300 font-medium">Partidos ganados</span>
                        <div className="text-xs text-gray-400">Victorias totales</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl md:text-2xl font-bold text-white">{estadisticas.partidosGanados}</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-700/50 p-3 md:p-4 hover:border-gray-600/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                      </div>
                      <div>
                        <span className="text-sm md:text-base text-gray-300 font-medium">Win rate</span>
                        <div className="text-xs text-gray-400">Porcentaje de victorias</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl md:text-2xl font-bold text-white">{estadisticas.winRate}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ranking por Categoría */}
            <Card className="bg-gray-900/50 border-gray-800 mt-4 md:mt-6">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-white text-lg md:text-xl">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#E2FC1D]" />
                  Ranking por categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingPorCategoria.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
                    {rankingPorCategoria.map((ranking) => (
                      <div key={ranking.id} className="relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-700/50 p-3 md:p-4 hover:border-gray-600/50 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#E2FC1D]/20 rounded-lg flex items-center justify-center">
                              <Star className="w-4 h-4 md:w-5 md:h-5 text-[#E2FC1D]" />
                            </div>
                            <div>
                              <span className="text-sm md:text-base text-gray-300 font-medium">{ranking.categoria}</span>
                              <div className="text-xs text-gray-400">Categoría activa</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xl md:text-2xl font-bold text-white">{ranking.puntos}</span>
                            <div className="text-xs text-gray-400">puntos</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-8">
                    <div className="relative">
                      <Shield className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-3" />
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full opacity-20 blur-xl"></div>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-300 mb-2">Sin categorías activas</h3>
                    <p className="text-gray-400 text-xs md:text-sm">No hay puntos registrados por categoría</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Últimos partidos */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-white text-lg md:text-xl">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  Últimos partidos y próximos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ultimosPartidos.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {ultimosPartidos.map((partido, index) => {
                      const resultado = getResultadoPartido(partido, jugador.id)
                      const esVictoria = resultado === 'Victoria'
                      const esDerrota = resultado === 'Derrota'
                      const esProximo = resultado === 'Próximo'
                      const esPendiente = resultado === 'Pendiente'
                      
                      return (
                        <div key={partido.id} className="relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20">
                          {/* Indicador de estado */}
                          <div className={`absolute top-0 left-0 w-1 h-full ${
                            esVictoria ? 'bg-gradient-to-b from-green-400 to-green-600' :
                            esDerrota ? 'bg-gradient-to-b from-red-400 to-red-600' :
                            esProximo ? 'bg-gradient-to-b from-[#D9F41A] to-[#E2FC1D]' :
                            esPendiente ? 'bg-gradient-to-b from-yellow-400 to-yellow-600' :
                            'bg-gradient-to-b from-gray-400 to-gray-600'
                          }`}></div>
                          
                          <div className="p-3 md:p-4 pl-5 md:pl-6">
                            {/* Header del partido */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 md:gap-3">
                                <Badge variant="outline" className="text-xs bg-gray-800/50 border-gray-600 text-gray-300">
                                  {partido.liga_categorias?.categoria || 'N/A'}
                                </Badge>
                                <span className="text-xs text-gray-400 font-medium">
                                  {formatearFecha(partido.fecha)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={esVictoria ? "default" : esDerrota ? "destructive" : "secondary"}
                                  className={`font-semibold text-xs md:text-sm ${
                                    esVictoria ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25" : 
                                    esDerrota ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25" : 
                                    esProximo ? "bg-gradient-to-r from-[#D9F41A] to-[#E2FC1D] text-black shadow-lg shadow-[#D9F41A]/25 animate-pulse" :
                                    esPendiente ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25" : 
                                    "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                                  }`}
                                >
                                  {resultado}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Equipos - Mobile: Column layout, Desktop: Row layout */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
                              <div className="flex-1 text-center order-1 md:order-1">
                                <div className="text-sm font-semibold text-white mb-1">
                                  {getEquipoNombre(partido.equipo_a)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Equipo A
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center mx-0 md:mx-4 order-2 md:order-2">
                                <div className="text-xl md:text-2xl font-bold text-gray-300">VS</div>
                                {esVictoria && (
                                  <div className="text-xs text-green-400 font-medium mt-1">
                                    <Trophy className="w-3 h-3 inline mr-1" />
                                    Victoria
                                  </div>
                                )}
                                {esDerrota && (
                                  <div className="text-xs text-red-400 font-medium mt-1">
                                    Derrota
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 text-center order-3 md:order-3">
                                <div className="text-sm font-semibold text-white mb-1">
                                  {getEquipoNombre(partido.equipo_b)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Equipo B
                                </div>
                              </div>
                            </div>
                            
                            {/* Información adicional */}
                            {partido.cancha && (
                              <div className="mt-3 pt-3 border-t border-gray-700/50">
                                <div className="flex items-center justify-center gap-2 text-xs text-[#D9F41A] font-medium">
                                  Cancha {partido.cancha}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <div className="relative">
                      <User className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-3 md:mb-4" />
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full opacity-20 blur-xl"></div>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-300 mb-2">Sin partidos registrados</h3>
                    <p className="text-gray-400 text-xs md:text-sm">Aún no ha jugado partidos oficiales en la liga</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enlace al ranking */}
        <div className="mt-8 md:mt-12 text-center">
          <Link 
            href="/rankings" 
            className="inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-[#E2FC1D] to-[#d4f01a] text-black font-semibold rounded-xl shadow-lg shadow-[#E2FC1D]/25 hover:shadow-xl hover:shadow-[#E2FC1D]/30 transition-all duration-300 hover:scale-105 hover:from-[#d4f01a] hover:to-[#E2FC1D] text-sm md:text-base"
          >
            <Trophy className="w-5 h-5 md:w-6 md:h-6" />
            Ver ranking completo
          </Link>
        </div>
      </div>
    </div>
  )
}