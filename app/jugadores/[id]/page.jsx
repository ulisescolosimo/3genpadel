'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  const [jugador, setJugador] = useState(null)
  const [estadisticas, setEstadisticas] = useState({
    partidosJugados: 0,
    partidosGanados: 0,
    winRate: 0
  })
  const [ultimosPartidos, setUltimosPartidos] = useState([])
  const [posicionRanking, setPosicionRanking] = useState(null)
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

      // 2. Obtener posición en el ranking general
      const { data: rankingData, error: rankingError } = await supabase
        .from('usuarios')
        .select('id, ranking_puntos')
        .not('ranking_puntos', 'is', null)
        .order('ranking_puntos', { ascending: false })

      if (rankingError) throw rankingError
      
      const posicion = rankingData.findIndex(user => user.id === jugadorId) + 1
      setPosicionRanking(posicion)

      // 3. Obtener estadísticas de partidos
      await fetchEstadisticas(jugadorId)

      // 4. Obtener últimos 5 partidos
      await fetchUltimosPartidos(jugadorId)

    } catch (error) {
      console.error('Error fetching jugador data:', error)
      setError('No se pudo cargar la información del jugador')
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async (jugadorId) => {
    try {
      // Obtener todos los partidos donde el jugador participó como titular
      const { data: partidosData, error: partidosError } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          equipo_a:ligainscripciones!liga_partidos_equipo_a_id_fkey (
            titular_1_id,
            titular_2_id
          ),
          equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
            titular_1_id,
            titular_2_id
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
        // Verificar si el jugador participó en este partido
        const participoEnEquipoA = partido.equipo_a && 
          (partido.equipo_a.titular_1_id === jugadorId || partido.equipo_a.titular_2_id === jugadorId)
        
        const participoEnEquipoB = partido.equipo_b && 
          (partido.equipo_b.titular_1_id === jugadorId || partido.equipo_b.titular_2_id === jugadorId)

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
      // Obtener partidos donde participó el jugador específico
      const { data: partidosData, error: partidosError } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            categoria
          ),
          equipo_a:ligainscripciones!liga_partidos_equipo_a_id_fkey (
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              nombre,
              apellido
            )
          ),
          equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              nombre,
              apellido
            )
          ),
          equipo_ganador:ligainscripciones!liga_partidos_equipo_ganador_id_fkey (
            id
          )
        `)
        .eq('estado', 'jugado')
        .or(`equipo_a.titular_1_id.eq.${jugadorId},equipo_a.titular_2_id.eq.${jugadorId},equipo_b.titular_1_id.eq.${jugadorId},equipo_b.titular_2_id.eq.${jugadorId}`)
        .order('fecha', { ascending: false })
        .limit(5)

      if (partidosError) throw partidosError

      setUltimosPartidos(partidosData || [])

    } catch (error) {
      console.error('Error fetching últimos partidos:', error)
    }
  }

  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'N/A'
    const titular1 = equipo.titular_1 ? `${equipo.titular_1.nombre} ${equipo.titular_1.apellido}` : ''
    const titular2 = equipo.titular_2 ? `${equipo.titular_2.nombre} ${equipo.titular_2.apellido}` : ''
    return `${titular1} / ${titular2}`.replace(' / ', ' & ').replace('N/A & ', '').replace(' & N/A', '')
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    
    try {
      // Crear la fecha asegurando que se interprete en la zona horaria local
      let fechaObj
      if (typeof fecha === 'string') {
        // Si es un string, asegurar que se interprete como fecha local
        const [year, month, day] = fecha.split('T')[0].split('-')
        fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else {
        fechaObj = new Date(fecha)
      }
      
      return fechaObj.toLocaleDateString('es-ES')
    } catch (error) {
      console.error('Error formateando fecha:', error)
      return 'N/A'
    }
  }

  const getResultadoPartido = (partido, jugadorId) => {
    if (!partido.equipo_ganador) return 'Pendiente'
    
    const participoEnEquipoA = partido.equipo_a && 
      (partido.equipo_a.titular_1?.id === jugadorId || partido.equipo_a.titular_2?.id === jugadorId)
    
    const participoEnEquipoB = partido.equipo_b && 
      (partido.equipo_b.titular_1?.id === jugadorId || partido.equipo_b.titular_2?.id === jugadorId)

    if (partido.equipo_ganador.id === partido.equipo_a?.id && participoEnEquipoA) {
      return 'Victoria'
    } else if (partido.equipo_ganador.id === partido.equipo_b?.id && participoEnEquipoB) {
      return 'Victoria'
    } else {
      return 'Derrota'
    }
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
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 md:w-32 md:h-32">
              <AvatarImage src={jugador.avatar_url} alt={`${jugador.nombre} ${jugador.apellido}`} />
              <AvatarFallback className="text-2xl bg-blue-600">
                {jugador.nombre?.charAt(0)}{jugador.apellido?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {jugador.nombre} {jugador.apellido}
              </h1>
              
              <div className="flex flex-wrap gap-4 items-center">
                {posicionRanking && (
                  <div className="flex items-center gap-2">
                    <Medal className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">
                      Posición #{posicionRanking} en el ranking
                    </span>
                  </div>
                )}
                
                {jugador.ranking_puntos && (
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">
                      {jugador.ranking_puntos} puntos
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estadísticas */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-blue-400" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Partidos jugados</span>
                  </div>
                  <span className="text-white font-bold text-lg">{estadisticas.partidosJugados}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">Partidos ganados</span>
                  </div>
                  <span className="text-white font-bold text-lg">{estadisticas.partidosGanados}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">Win rate</span>
                  </div>
                  <span className="text-white font-bold text-lg">{estadisticas.winRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Últimos partidos */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-green-400" />
                  Últimos 5 partidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ultimosPartidos.length > 0 ? (
                  <div className="space-y-3">
                    {ultimosPartidos.map((partido, index) => {
                      const resultado = getResultadoPartido(partido, jugador.id)
                      const esVictoria = resultado === 'Victoria'
                      const esDerrota = resultado === 'Derrota'
                      
                      return (
                        <div key={partido.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {partido.liga_categorias?.categoria || 'N/A'}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {formatearFecha(partido.fecha)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-300">
                              {getEquipoNombre(partido.equipo_a)} vs {getEquipoNombre(partido.equipo_b)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={esVictoria ? "default" : esDerrota ? "destructive" : "secondary"}
                              className={esVictoria ? "bg-green-600" : esDerrota ? "bg-red-600" : ""}
                            >
                              {resultado}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Aún no ha jugado partidos oficiales</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enlace al ranking */}
        <div className="mt-8 text-center">
          <Link 
            href="/rankings" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E2FC1D] text-black rounded-lg transition-colors"
          >
            <Trophy className="w-5 h-5" />
            Ver ranking
          </Link>
        </div>
      </div>
    </div>
  )
}