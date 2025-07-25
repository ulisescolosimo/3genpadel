"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, Users, Calendar, Eye, CheckCircle, XCircle, Clock, RefreshCw, Award, ArrowLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AdminLigasBracketsPage() {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState([])
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState('')

  // Cargar categorías al montar el componente
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const { data, error } = await supabase
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

        if (error) throw error
        setCategorias(data || [])
      } catch (error) {
        console.error('Error fetching categorias:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadCategorias()
  }, [toast])

  // Cargar partidos cuando cambia la categoría seleccionada
  useEffect(() => {
    if (!selectedCategoria) {
      setPartidos([])
      return
    }

    const loadPartidos = async () => {
      try {
        setRefreshing(true)
        const { data, error } = await supabase
          .from('liga_partidos')
          .select(`
            *,
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
          .eq('liga_categoria_id', parseInt(selectedCategoria))
          .order('ronda', { ascending: true })
          .order('created_at', { ascending: true })

        if (error) throw error
        setPartidos(data || [])
      } catch (error) {
        console.error('Error fetching partidos:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los partidos",
          variant: "destructive"
        })
      } finally {
        setRefreshing(false)
      }
    }

    loadPartidos()
  }, [selectedCategoria, toast])

  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'TBD'
    const titular1 = equipo.titular_1?.nombre || 'N/A'
    const titular2 = equipo.titular_2?.nombre || 'N/A'
    return `${titular1} & ${titular2}`
  }

  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'secondary',
      jugado: 'default',
      cancelado: 'destructive'
    }
    return <Badge variant={variants[estado]} className="text-xs text-white">{estado}</Badge>
  }

  const setGanador = async (partidoId, equipoGanadorId) => {
    try {
      const { error } = await supabase
        .from('liga_partidos')
        .update({ 
          equipo_ganador_id: equipoGanadorId,
          estado: 'jugado'
        })
        .eq('id', partidoId)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Ganador actualizado correctamente",
        variant: "default"
      })

      // Recargar los partidos
      const { data, error: fetchError } = await supabase
        .from('liga_partidos')
        .select(`
          *,
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
        .eq('liga_categoria_id', parseInt(selectedCategoria))
        .order('ronda', { ascending: true })
        .order('created_at', { ascending: true })

      if (!fetchError) {
        setPartidos(data || [])
      }
    } catch (error) {
      console.error('Error setting ganador:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el ganador",
        variant: "destructive"
      })
    }
  }

  const editarGanador = async (partidoId, equipoGanadorId) => {
    try {
      // Primero obtener el partido actual para saber el ganador anterior
      const { data: partidoActual, error: fetchError } = await supabase
        .from('liga_partidos')
        .select('equipo_ganador_id, puntos_por_jugador')
        .eq('id', partidoId)
        .single()

      if (fetchError) throw fetchError

      // Si hay un ganador anterior y es diferente al nuevo, restar los puntos
      if (partidoActual.equipo_ganador_id && partidoActual.equipo_ganador_id !== equipoGanadorId) {
        // Obtener los jugadores del equipo ganador anterior
        const { data: equipoAnterior, error: equipoError } = await supabase
          .from('ligainscripciones')
          .select('titular_1_id, titular_2_id, suplente_1_id, suplente_2_id')
          .eq('id', partidoActual.equipo_ganador_id)
          .single()

        if (!equipoError && equipoAnterior) {
          // Restar puntos a todos los jugadores del equipo anterior
          const jugadoresIds = [
            equipoAnterior.titular_1_id,
            equipoAnterior.titular_2_id,
            equipoAnterior.suplente_1_id,
            equipoAnterior.suplente_2_id
          ].filter(Boolean)

          if (jugadoresIds.length > 0) {
            try {
              for (const userId of jugadoresIds) {
                const { data: usuario, error: fetchUserError } = await supabase
                  .from('usuarios')
                  .select('ranking_puntos')
                  .eq('id', userId)
                  .single()

                if (!fetchUserError && usuario) {
                  const nuevosPuntos = Math.max(usuario.ranking_puntos - partidoActual.puntos_por_jugador, 0)
                  await supabase
                    .from('usuarios')
                    .update({ ranking_puntos: nuevosPuntos })
                    .eq('id', userId)
                }
              }
            } catch (fallbackError) {
              console.error('Error restando puntos:', fallbackError)
            }
          }
        }
      }

      // Actualizar el ganador (el trigger sumará los puntos automáticamente)
      const { error } = await supabase
        .from('liga_partidos')
        .update({ 
          equipo_ganador_id: equipoGanadorId
        })
        .eq('id', partidoId)

      if (error) throw error

      // Determinar el mensaje según si se restaron puntos o no
      const mensaje = partidoActual.equipo_ganador_id && partidoActual.equipo_ganador_id !== equipoGanadorId
        ? `Ganador editado correctamente. Se restaron ${partidoActual.puntos_por_jugador} puntos al equipo anterior y se sumaron al nuevo ganador.`
        : "Ganador editado correctamente. Los puntos han sido ajustados."

      toast({
        title: "Éxito",
        description: mensaje,
        variant: "default"
      })

      // Recargar los partidos
      const { data, error: fetchError2 } = await supabase
        .from('liga_partidos')
        .select(`
          *,
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
        .eq('liga_categoria_id', parseInt(selectedCategoria))
        .order('ronda', { ascending: true })
        .order('created_at', { ascending: true })

      if (!fetchError2) {
        setPartidos(data || [])
      }
    } catch (error) {
      console.error('Error editing ganador:', error)
      toast({
        title: "Error",
        description: "No se pudo editar el ganador",
        variant: "destructive"
      })
    }
  }

  const getCategoriaNombre = (categoriaId) => {
    const categoria = categorias.find(cat => cat.id === parseInt(categoriaId))
    if (!categoria) return 'N/A'
    return `${categoria.ligas?.nombre || 'N/A'} - ${categoria.categoria}`
  }

  const handleRefresh = async () => {
    if (!selectedCategoria) return

    try {
      setRefreshing(true)
      const { data, error } = await supabase
        .from('liga_partidos')
        .select(`
          *,
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
        .eq('liga_categoria_id', parseInt(selectedCategoria))
        .order('ronda', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      setPartidos(data || [])
    } catch (error) {
      console.error('Error refreshing partidos:', error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los partidos",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Organizar partidos por rondas
  const getPartidosPorRonda = () => {
    const rondas = ['octavos', 'cuartos', 'semis', 'final']
    const partidosPorRonda = {}
    
    rondas.forEach(ronda => {
      partidosPorRonda[ronda] = partidos.filter(p => p.ronda.toLowerCase() === ronda)
    })
    
    return partidosPorRonda
  }

  const partidosPorRonda = getPartidosPorRonda()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="pt-8 pb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/ligas">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Brackets de Torneos</h1>
              <p className="text-gray-400">Visualiza la estructura de los torneos</p>
            </div>
          </div>

          {/* Selector de categoría */}
          <Card className="mb-6 bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block text-white">Categoría</label>
                  <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Seleccionar categoría para ver el bracket" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {categorias.map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                          {categoria.ligas?.nombre} - {categoria.categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={refreshing || !selectedCategoria}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedCategoria && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2 text-white">
                {getCategoriaNombre(selectedCategoria)}
              </h2>
              <p className="text-gray-400">
                {partidos.length} partidos programados
              </p>
            </div>
          )}

          {/* Custom Tournament Bracket */}
          {selectedCategoria && partidos.length > 0 ? (
            <Card className="mb-8 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Bracket del Torneo</CardTitle>
                <CardDescription className="text-gray-400">
                  Visualización de la estructura del torneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="flex gap-8 min-w-max">
                    {/* Octavos de Final */}
                    {partidosPorRonda.octavos.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-white text-center mb-4">Octavos de Final</h3>
                        {partidosPorRonda.octavos.map((partido, index) => (
                          <div key={partido.id} className="bg-white/10 rounded-lg p-4 border border-white/20 min-w-[280px]">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs text-white">
                                {partido.ronda}
                              </Badge>
                              {getEstadoBadge(partido.estado)}
                            </div>
                            
                            {partido.fecha && (
                              <div className="text-xs text-gray-400 mb-3 text-center">
                                📅 {new Date(partido.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <div className={`p-2 rounded ${partido.equipo_ganador?.id === partido.equipo_a?.id ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-700/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_a)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_a?.id && (
                                  <div className="text-xs text-green-400">🏆 Ganador</div>
                                )}
                              </div>
                              
                              <div className="text-center text-gray-400">vs</div>
                              
                              <div className={`p-2 rounded ${partido.equipo_ganador?.id === partido.equipo_b?.id ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-700/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_b)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_b?.id && (
                                  <div className="text-xs text-green-400">🏆 Ganador</div>
                                )}
                              </div>
                            </div>
                            
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs flex-1"
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? '✅' : '🏆'} A
                                </Button>
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_b.id)
                                    : setGanador(partido.id, partido.equipo_b.id)
                                  }
                                  className="text-xs flex-1"
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? '✅' : '🏆'} B
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cuartos de Final */}
                    {partidosPorRonda.cuartos.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-white text-center mb-4">Cuartos de Final</h3>
                        {partidosPorRonda.cuartos.map((partido, index) => (
                          <div key={partido.id} className="bg-white/10 rounded-lg p-4 border border-white/20 min-w-[280px]">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs text-white">
                                {partido.ronda}
                              </Badge>
                              {getEstadoBadge(partido.estado)}
                            </div>
                            
                            {partido.fecha && (
                              <div className="text-xs text-gray-400 mb-3 text-center">
                                📅 {new Date(partido.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <div className={`p-2 rounded ${partido.equipo_ganador?.id === partido.equipo_a?.id ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-700/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_a)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_a?.id && (
                                  <div className="text-xs text-green-400">🏆 Ganador</div>
                                )}
                              </div>
                              
                              <div className="text-center text-gray-400">vs</div>
                              
                              <div className={`p-2 rounded ${partido.equipo_ganador?.id === partido.equipo_b?.id ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-700/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_b)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_b?.id && (
                                  <div className="text-xs text-green-400">🏆 Ganador</div>
                                )}
                              </div>
                            </div>
                            
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs flex-1"
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? '✅' : '🏆'} A
                                </Button>
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_b.id)
                                    : setGanador(partido.id, partido.equipo_b.id)
                                  }
                                  className="text-xs flex-1"
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? '✅' : '🏆'} B
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Semifinales */}
                    {partidosPorRonda.semis.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-white text-center mb-4">Semifinales</h3>
                        {partidosPorRonda.semis.map((partido, index) => (
                          <div key={partido.id} className="bg-white/10 rounded-lg p-4 border border-white/20 min-w-[280px]">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs text-white">
                                {partido.ronda}
                              </Badge>
                              {getEstadoBadge(partido.estado)}
                            </div>
                            
                            {partido.fecha && (
                              <div className="text-xs text-gray-400 mb-3 text-center">
                                📅 {new Date(partido.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <div className={`p-2 rounded ${partido.equipo_ganador?.id === partido.equipo_a?.id ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-700/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_a)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_a?.id && (
                                  <div className="text-xs text-green-400">🏆 Ganador</div>
                                )}
                              </div>
                              
                              <div className="text-center text-gray-400">vs</div>
                              
                              <div className={`p-2 rounded ${partido.equipo_ganador?.id === partido.equipo_b?.id ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-700/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_b)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_b?.id && (
                                  <div className="text-xs text-green-400">🏆 Ganador</div>
                                )}
                              </div>
                            </div>
                            
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs flex-1"
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? '✅' : '🏆'} A
                                </Button>
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_b.id)
                                    : setGanador(partido.id, partido.equipo_b.id)
                                  }
                                  className="text-xs flex-1"
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? '✅' : '🏆'} B
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Final */}
                    {partidosPorRonda.final.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-white text-center mb-4">Final</h3>
                        {partidosPorRonda.final.map((partido, index) => (
                          <div key={partido.id} className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/50 min-w-[280px]">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                                {partido.ronda}
                              </Badge>
                              {getEstadoBadge(partido.estado)}
                            </div>
                            
                            {partido.fecha && (
                              <div className="text-xs text-gray-400 mb-3 text-center">
                                📅 {new Date(partido.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <div className={`p-2 rounded ${partido.equipo_ganador?.id === partido.equipo_a?.id ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-700/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_a)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_a?.id && (
                                  <div className="text-xs text-green-400">🏆 Ganador</div>
                                )}
                              </div>
                              
                              <div className="text-center text-gray-400">vs</div>
                              
                              <div className={`p-2 rounded ${partido.equipo_ganador?.id === partido.equipo_b?.id ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-700/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_b)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_b?.id && (
                                  <div className="text-xs text-green-400">🏆 Ganador</div>
                                )}
                              </div>
                            </div>
                            
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs flex-1"
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? '✅' : '🏆'} A
                                </Button>
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_b.id)
                                    : setGanador(partido.id, partido.equipo_b.id)
                                  }
                                  className="text-xs flex-1"
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? '✅' : '🏆'} B
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : selectedCategoria && partidos.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6 text-center">
                <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400 mb-2">No hay partidos programados</p>
                <p className="text-sm text-gray-500">
                  Los partidos aparecerán aquí una vez que sean creados
                </p>
                <Link href="/admin/ligas/partidos">
                  <Button className="mt-4 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                    Crear Partidos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6 text-center">
                <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">Selecciona una categoría para ver el bracket</p>
              </CardContent>
            </Card>
          )}

          {/* Lista de partidos en formato tabla */}
          {selectedCategoria && partidos.length > 0 && (
            <Card className="mb-8 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Lista de Partidos</CardTitle>
                <CardDescription className="text-gray-400">
                  Vista detallada de todos los partidos del torneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 text-white">Ronda</th>
                        <th className="text-left p-2 text-white">Equipo A</th>
                        <th className="text-left p-2 text-white">Equipo B</th>
                        <th className="text-left p-2 text-white">Estado</th>
                        <th className="text-left p-2 text-white">Ganador</th>
                        <th className="text-left p-2 text-white">Fecha</th>
                        <th className="text-left p-2 text-white">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidos.map((partido) => (
                        <tr key={partido.id} className="border-b border-gray-700 hover:bg-white/5">
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs text-white">
                              {partido.ronda}
                            </Badge>
                          </td>
                          <td className="p-2 font-medium text-white">
                            {getEquipoNombre(partido.equipo_a)}
                          </td>
                          <td className="p-2 font-medium text-white">
                            {getEquipoNombre(partido.equipo_b)}
                          </td>
                          <td className="p-2">
                            {getEstadoBadge(partido.estado)}
                          </td>
                          <td className="p-2">
                            {partido.equipo_ganador ? (
                              <Badge variant="default" className="text-xs text-white">
                                {getEquipoNombre(partido.equipo_ganador)}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-2 text-gray-400">
                            {partido.fecha ? new Date(partido.fecha).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-2">
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs px-2 py-1"
                                  title={`${partido.estado === 'jugado' ? 'Cambiar a' : 'Ganador'}: ${getEquipoNombre(partido.equipo_a)}`}
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? '✅' : '🏆'} A
                                </Button>
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_b.id)
                                    : setGanador(partido.id, partido.equipo_b.id)
                                  }
                                  className="text-xs px-2 py-1"
                                  title={`${partido.estado === 'jugado' ? 'Cambiar a' : 'Ganador'}: ${getEquipoNombre(partido.equipo_b)}`}
                                >
                                  {partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_b.id ? '✅' : '🏆'} B
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          {selectedCategoria && partidos.length > 0 && (
            <Card className="mt-8 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Estadísticas del Torneo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {partidos.length}
                    </p>
                    <p className="text-sm text-gray-400">Total Partidos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {partidos.filter(p => p.estado === 'jugado').length}
                    </p>
                    <p className="text-sm text-gray-400">Jugados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      {partidos.filter(p => p.estado === 'pendiente').length}
                    </p>
                    <p className="text-sm text-gray-400">Pendientes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {partidos.filter(p => p.estado === 'cancelado').length}
                    </p>
                    <p className="text-sm text-gray-400">Cancelados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 