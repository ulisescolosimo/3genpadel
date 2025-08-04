'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trophy, Medal, Users, Search, ChevronLeft, ChevronRight, Award, User, Crown } from 'lucide-react'
import Link from 'next/link'

// Caché para el ranking (se mantiene durante la sesión)
let rankingCache = null
let lastCacheTime = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export default function Ranking() {
  const [jugadores, setJugadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalJugadores, setTotalJugadores] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  
  const itemsPerPage = 20

  useEffect(() => {
    fetchRanking()
  }, [])

  useEffect(() => {
    // Resetear a la primera página cuando cambia la búsqueda
    setCurrentPage(1)
  }, [searchTerm])

  const fetchRanking = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      // Verificar si podemos usar el caché
      const now = Date.now()
      const canUseCache = rankingCache && lastCacheTime && (now - lastCacheTime) < CACHE_DURATION && !forceRefresh
      
      if (canUseCache) {
        console.log('Usando caché del ranking')
        setJugadores(rankingCache)
        setTotalJugadores(rankingCache.length)
        setTotalPages(Math.ceil(rankingCache.length / itemsPerPage))
        setLoading(false)
        return
      }

      console.log('Obteniendo jugadores inscritos en torneos')
      
      // Obtener todas las inscripciones con información de ligas y usuarios
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('ligainscripciones')
        .select(`
          id,
          titular_1_id,
          titular_2_id,
          suplente_1_id,
          suplente_2_id,
          liga_categorias!inner(
            categoria,
            ligas!inner(
              nombre,
              fecha_inicio
            )
          ),
          usuarios_titular_1:usuarios!ligainscripciones_titular_1_id_fkey(
            id,
            nombre,
            apellido,
            avatar_url,
            ranking_puntos
          ),
          usuarios_titular_2:usuarios!ligainscripciones_titular_2_id_fkey(
            id,
            nombre,
            apellido,
            avatar_url,
            ranking_puntos
          ),
          usuarios_suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey(
            id,
            nombre,
            apellido,
            avatar_url,
            ranking_puntos
          ),
          usuarios_suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey(
            id,
            nombre,
            apellido,
            avatar_url,
            ranking_puntos
          )
        `)
        .neq('usuarios_titular_1.rol', 'admin')
        .neq('usuarios_titular_2.rol', 'admin')
        .neq('usuarios_suplente_1.rol', 'admin')
        .neq('usuarios_suplente_2.rol', 'admin')

      if (inscripcionesError) throw inscripcionesError

      // Crear un mapa de jugadores únicos con sus inscripciones
      const jugadoresMap = new Map()

      inscripcionesData.forEach(inscripcion => {
        const liga = inscripcion.liga_categorias?.ligas
        const categoria = inscripcion.liga_categorias?.categoria
        
                 // Procesar titular 1
         if (inscripcion.titular_1_id && inscripcion.usuarios_titular_1) {
           const jugador = inscripcion.usuarios_titular_1
           if (!jugadoresMap.has(jugador.id)) {
             jugadoresMap.set(jugador.id, {
               id: jugador.id,
               nombre: jugador.nombre,
               apellido: jugador.apellido,
               avatar_url: jugador.avatar_url,
               ranking_puntos: jugador.ranking_puntos || 0,
               inscripciones: [],
               partidosJugados: 0,
               partidosGanados: 0
             })
           }
           
           const jugadorData = jugadoresMap.get(jugador.id)
           jugadorData.inscripciones.push({
             liga: liga?.nombre || 'Liga',
             categoria: categoria || 'Sin categoría',
             fecha_inicio: liga?.fecha_inicio
           })
         }

                 // Procesar titular 2
         if (inscripcion.titular_2_id && inscripcion.usuarios_titular_2) {
           const jugador = inscripcion.usuarios_titular_2
           if (!jugadoresMap.has(jugador.id)) {
             jugadoresMap.set(jugador.id, {
               id: jugador.id,
               nombre: jugador.nombre,
               apellido: jugador.apellido,
               avatar_url: jugador.avatar_url,
               ranking_puntos: jugador.ranking_puntos || 0,
               inscripciones: [],
               partidosJugados: 0,
               partidosGanados: 0
             })
           }
           
           const jugadorData = jugadoresMap.get(jugador.id)
           jugadorData.inscripciones.push({
             liga: liga?.nombre || 'Liga',
             categoria: categoria || 'Sin categoría',
             fecha_inicio: liga?.fecha_inicio
           })
         }

                 // Procesar suplente 1
         if (inscripcion.suplente_1_id && inscripcion.usuarios_suplente_1) {
           const jugador = inscripcion.usuarios_suplente_1
           if (!jugadoresMap.has(jugador.id)) {
             jugadoresMap.set(jugador.id, {
               id: jugador.id,
               nombre: jugador.nombre,
               apellido: jugador.apellido,
               avatar_url: jugador.avatar_url,
               ranking_puntos: jugador.ranking_puntos || 0,
               inscripciones: [],
               partidosJugados: 0,
               partidosGanados: 0
             })
           }
           
           const jugadorData = jugadoresMap.get(jugador.id)
           jugadorData.inscripciones.push({
             liga: liga?.nombre || 'Liga',
             categoria: categoria || 'Sin categoría',
             fecha_inicio: liga?.fecha_inicio
           })
         }

                 // Procesar suplente 2
         if (inscripcion.suplente_2_id && inscripcion.usuarios_suplente_2) {
           const jugador = inscripcion.usuarios_suplente_2
           if (!jugadoresMap.has(jugador.id)) {
             jugadoresMap.set(jugador.id, {
               id: jugador.id,
               nombre: jugador.nombre,
               apellido: jugador.apellido,
               avatar_url: jugador.avatar_url,
               ranking_puntos: jugador.ranking_puntos || 0,
               inscripciones: [],
               partidosJugados: 0,
               partidosGanados: 0
             })
           }
           
           const jugadorData = jugadoresMap.get(jugador.id)
           jugadorData.inscripciones.push({
             liga: liga?.nombre || 'Liga',
             categoria: categoria || 'Sin categoría',
             fecha_inicio: liga?.fecha_inicio
           })
         }
      })

      // Obtener estadísticas de partidos para los jugadores inscritos
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

      // Obtener títulos de jugadores
      const { data: titulosData, error: titulosError } = await supabase
        .from('titulos_jugadores')
        .select('*')
        .eq('activo', true)

      if (titulosError) throw titulosError

      // Crear mapa de títulos por usuario_id
      const titulosPorUsuario = new Map()
      titulosData.forEach(titulo => {
        if (titulo.usuario_id) {
          if (!titulosPorUsuario.has(titulo.usuario_id)) {
            titulosPorUsuario.set(titulo.usuario_id, [])
          }
          titulosPorUsuario.get(titulo.usuario_id).push(titulo)
        }
      })

      // Calcular estadísticas para los jugadores inscritos
      partidosData.forEach(partido => {
        const jugadoresEnPartido = []
        
        if (partido.equipo_a) {
          if (partido.equipo_a.titular_1_id) jugadoresEnPartido.push(partido.equipo_a.titular_1_id)
          if (partido.equipo_a.titular_2_id) jugadoresEnPartido.push(partido.equipo_a.titular_2_id)
        }
        
        if (partido.equipo_b) {
          if (partido.equipo_b.titular_1_id) jugadoresEnPartido.push(partido.equipo_b.titular_1_id)
          if (partido.equipo_b.titular_2_id) jugadoresEnPartido.push(partido.equipo_b.titular_2_id)
        }

        jugadoresEnPartido.forEach(jugadorId => {
          const jugadorData = jugadoresMap.get(jugadorId)
          if (jugadorData) {
            jugadorData.partidosJugados++
            
            // Verificar si ganó
            if (partido.equipo_ganador) {
              const participoEnEquipoA = partido.equipo_a && 
                (partido.equipo_a.titular_1_id === jugadorId || partido.equipo_a.titular_2_id === jugadorId)
              
              const participoEnEquipoB = partido.equipo_b && 
                (partido.equipo_b.titular_1_id === jugadorId || partido.equipo_b.titular_2_id === jugadorId)

              const ganoConEquipoA = partido.equipo_ganador.titular_1_id === partido.equipo_a?.titular_1_id
              const ganoConEquipoB = partido.equipo_ganador.titular_1_id === partido.equipo_b?.titular_1_id
              
              if ((participoEnEquipoA && ganoConEquipoA) || (participoEnEquipoB && ganoConEquipoB)) {
                jugadorData.partidosGanados++
              }
            }
          }
        })
      })

      // Convertir el mapa a array y procesar estadísticas finales
      const jugadoresInscritos = Array.from(jugadoresMap.values()).map(jugador => {
        const winRate = jugador.partidosJugados > 0 
          ? (jugador.partidosGanados / jugador.partidosJugados) * 100 
          : 0

        // Obtener categorías únicas de inscripciones
        const categoriasUnicas = [...new Set(jugador.inscripciones.map(ins => ins.categoria))]
        const ligasUnicas = [...new Set(jugador.inscripciones.map(ins => ins.liga))]

        // Obtener títulos del jugador
        const titulosJugador = titulosPorUsuario.get(jugador.id) || []
        const totalTitulos = titulosJugador.reduce((total, titulo) => total + titulo.titulos, 0)
        const categoriasTitulos = titulosJugador.map(titulo => titulo.categoria)

        return {
          ...jugador,
          winRate: Math.round(winRate * 100) / 100,
          categorias: categoriasUnicas,
          ligas: ligasUnicas,
          totalInscripciones: jugador.inscripciones.length,
          titulos: titulosJugador,
          totalTitulos: totalTitulos,
          categoriasTitulos: categoriasTitulos
        }
      })

      // Ordenar por puntos de ranking
      const jugadoresOrdenados = jugadoresInscritos.sort((a, b) => b.ranking_puntos - a.ranking_puntos)

      // Actualizar caché
      rankingCache = jugadoresOrdenados
      lastCacheTime = now

      setJugadores(jugadoresOrdenados)
      setTotalJugadores(jugadoresOrdenados.length)
      setTotalPages(Math.ceil(jugadoresOrdenados.length / itemsPerPage))

    } catch (error) {
      console.error('Error fetching ranking:', error)
      setError('No se pudo cargar el ranking')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchRanking(true) // Forzar refresh
  }

  // Filtrar jugadores según el término de búsqueda
  const filteredJugadores = jugadores.filter(jugador => {
    if (!searchTerm) return true
    const nombreCompleto = `${jugador.nombre} ${jugador.apellido}`.toLowerCase()
    return nombreCompleto.includes(searchTerm.toLowerCase())
  })

  // Calcular jugadores para la página actual
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const jugadoresPaginados = filteredJugadores.slice(startIndex, endIndex)

  const getMedalIcon = (position) => {
    if (position === 1) return <Medal className="w-5 h-5 text-yellow-400" />
    if (position === 2) return <Medal className="w-5 h-5 text-gray-300" />
    if (position === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <Button onClick={() => fetchRanking(true)}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Jugadores Inscritos en Torneos</h1>
              <p className="text-gray-400">Jugadores activos en ligas y torneos de 3gen Padel</p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="mt-4 sm:mt-0"
            >
              {refreshing ? <Spinner className="w-4 h-4" /> : 'Actualizar'}
            </Button>
          </div>

          {/* Búsqueda */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-sm">Total inscritos</p>
                  <p className="text-white text-2xl font-bold">{totalJugadores}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-gray-400 text-sm">Con puntos</p>
                  <p className="text-white text-2xl font-bold">
                    {jugadores.filter(j => j.ranking_puntos > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Total títulos</p>
                  <p className="text-white text-2xl font-bold">
                    {jugadores.reduce((total, j) => total + j.totalTitulos, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-gray-400 text-sm">Jugadores con títulos</p>
                  <p className="text-white text-2xl font-bold">
                    {jugadores.filter(j => j.totalTitulos > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-sm">Total inscripciones</p>
                  <p className="text-white text-2xl font-bold">
                    {jugadores.reduce((total, j) => total + j.totalInscripciones, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de ranking */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-blue-400" />
              Jugadores Inscritos en Torneos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {jugadoresPaginados.length > 0 ? (
              <div className="space-y-3">
                {jugadoresPaginados.map((jugador, index) => {
                  const position = startIndex + index + 1
                  return (
                    <Link 
                      key={jugador.id} 
                      href={`/jugadores/${jugador.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white text-sm font-bold">
                              {position}
                            </div>
                            {getMedalIcon(position)}
                          </div>
                          
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={jugador.avatar_url} alt={`${jugador.nombre} ${jugador.apellido}`} />
                            <AvatarFallback className="bg-blue-600">
                              {jugador.nombre?.charAt(0)}{jugador.apellido?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <h3 className="text-white font-semibold">
                              {jugador.nombre} {jugador.apellido}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                {jugador.ranking_puntos} puntos
                              </span>
                              {jugador.totalTitulos > 0 && (
                                <span className="flex items-center gap-1">
                                  <Crown className="w-4 h-4 text-yellow-400" />
                                  {jugador.totalTitulos} títulos
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {jugador.totalInscripciones} inscripciones
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-4 h-4" />
                                {jugador.partidosJugados} partidos
                              </span>
                              {jugador.categorias.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
                                    {jugador.categorias.join(', ')}
                                  </span>
                                </div>
                              )}
                              {jugador.categoriasTitulos.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded-full border border-yellow-500/30">
                                    {jugador.categoriasTitulos.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className="text-xs border-[#D2ED1A] text-[#D2ED1A] bg-[#D2ED1A]/10 hover:bg-[#D2ED1A]/20 transition-colors"
                          >
                            #{position}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No se encontraron jugadores</p>
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Intenta con otro término de búsqueda' : 'No hay jugadores registrados'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-400">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredJugadores.length)} de {filteredJugadores.length} jugadores
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 