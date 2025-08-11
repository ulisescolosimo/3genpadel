"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, Users, Calendar, Eye, CheckCircle, XCircle, Clock, RefreshCw, Award, ArrowLeft, ChevronRight, BarChart3, Activity, Zap, Target, Gamepad2 } from 'lucide-react'
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

          // Los puntos ahora se manejan solo en ranking_jugadores, no en usuarios.ranking_puntos
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

      // Mensaje de confirmación
      const mensaje = "Ganador editado correctamente. Los puntos han sido ajustados en el sistema de ranking."

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
      <div className="min-h-screen bg-black pt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
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
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Target className="h-8 w-8 text-[#E2FF1B]" />
                Brackets de Torneos
              </h1>
              <p className="text-gray-400">Visualiza y gestiona la estructura de los torneos</p>
            </div>
          </div>

          {/* Selector de categoría */}
          <Card className="mb-6 bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#E2FF1B]" />
                Selección de Categoría
              </CardTitle>
              <CardDescription className="text-gray-400">
                Elige una categoría para visualizar su bracket correspondiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
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
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-[#E2FF1B]" />
                    {getCategoriaNombre(selectedCategoria)}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    {partidos.length} partidos programados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[#E2FF1B] border-[#E2FF1B]/30">
                    <Activity className="h-3 w-3 mr-1" />
                    {partidos.filter(p => p.estado === 'jugado').length} jugados
                  </Badge>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                    <Clock className="h-3 w-3 mr-1" />
                    {partidos.filter(p => p.estado === 'pendiente').length} pendientes
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Custom Tournament Bracket */}
          {selectedCategoria && partidos.length > 0 ? (
            <Card className="mb-8 bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#E2FF1B]" />
                  Bracket del Torneo
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Visualización interactiva de la estructura del torneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="flex gap-8 min-w-max p-4">
                    {/* Octavos de Final */}
                    {partidosPorRonda.octavos.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-white text-center mb-4">Octavos de Final</h3>
                        {partidosPorRonda.octavos.map((partido, index) => (
                          <div key={partido.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 min-w-[280px] hover:bg-gray-800/70 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline" className="text-xs text-white border-blue-400/30">
                                {partido.ronda}
                              </Badge>
                              {getEstadoBadge(partido.estado)}
                            </div>
                            
                            {partido.fecha && (
                              <div className="text-xs text-gray-400 mb-3 text-center bg-gray-800/30 rounded px-2 py-1">
                                📅 {new Date(partido.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                            )}
                            
                            <div className="space-y-3">
                              <div className={`p-3 rounded-lg transition-all ${partido.equipo_ganador?.id === partido.equipo_a?.id ? 'bg-green-500/20 border border-green-500/50 shadow-lg' : 'bg-gray-700/50 border border-gray-600/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_a)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_a?.id && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <Award className="h-3 w-3" />
                                    Ganador
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-center text-gray-400 font-medium">VS</div>
                              
                              <div className={`p-3 rounded-lg transition-all ${partido.equipo_ganador?.id === partido.equipo_b?.id ? 'bg-green-500/20 border border-green-500/50 shadow-lg' : 'bg-gray-700/50 border border-gray-600/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_b)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_b?.id && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <Award className="h-3 w-3" />
                                    Ganador
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-2 mt-4">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs flex-1 hover:scale-105 transition-transform"
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
                                  className="text-xs flex-1 hover:scale-105 transition-transform"
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
                          <div key={partido.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 min-w-[280px] hover:bg-gray-800/70 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline" className="text-xs text-white border-purple-400/30">
                                {partido.ronda}
                              </Badge>
                              {getEstadoBadge(partido.estado)}
                            </div>
                            
                            {partido.fecha && (
                              <div className="text-xs text-gray-400 mb-3 text-center bg-gray-800/30 rounded px-2 py-1">
                                📅 {new Date(partido.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                            )}
                            
                            <div className="space-y-3">
                              <div className={`p-3 rounded-lg transition-all ${partido.equipo_ganador?.id === partido.equipo_a?.id ? 'bg-green-500/20 border border-green-500/50 shadow-lg' : 'bg-gray-700/50 border border-gray-600/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_a)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_a?.id && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <Award className="h-3 w-3" />
                                    Ganador
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-center text-gray-400 font-medium">VS</div>
                              
                              <div className={`p-3 rounded-lg transition-all ${partido.equipo_ganador?.id === partido.equipo_b?.id ? 'bg-green-500/20 border border-green-500/50 shadow-lg' : 'bg-gray-700/50 border border-gray-600/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_b)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_b?.id && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <Award className="h-3 w-3" />
                                    Ganador
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-2 mt-4">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs flex-1 hover:scale-105 transition-transform"
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
                                  className="text-xs flex-1 hover:scale-105 transition-transform"
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
                          <div key={partido.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 min-w-[280px] hover:bg-gray-800/70 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline" className="text-xs text-white border-orange-400/30">
                                {partido.ronda}
                              </Badge>
                              {getEstadoBadge(partido.estado)}
                            </div>
                            
                            {partido.fecha && (
                              <div className="text-xs text-gray-400 mb-3 text-center bg-gray-800/30 rounded px-2 py-1">
                                📅 {new Date(partido.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                            )}
                            
                            <div className="space-y-3">
                              <div className={`p-3 rounded-lg transition-all ${partido.equipo_ganador?.id === partido.equipo_a?.id ? 'bg-green-500/20 border border-green-500/50 shadow-lg' : 'bg-gray-700/50 border border-gray-600/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_a)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_a?.id && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <Award className="h-3 w-3" />
                                    Ganador
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-center text-gray-400 font-medium">VS</div>
                              
                              <div className={`p-3 rounded-lg transition-all ${partido.equipo_ganador?.id === partido.equipo_b?.id ? 'bg-green-500/20 border border-green-500/50 shadow-lg' : 'bg-gray-700/50 border border-gray-600/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_b)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_b?.id && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <Award className="h-3 w-3" />
                                    Ganador
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-2 mt-4">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs flex-1 hover:scale-105 transition-transform"
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
                                  className="text-xs flex-1 hover:scale-105 transition-transform"
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
                          <div key={partido.id} className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/50 min-w-[280px] hover:from-yellow-500/30 hover:to-orange-500/30 transition-all shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                                <Trophy className="h-3 w-3 mr-1" />
                                {partido.ronda}
                              </Badge>
                              {getEstadoBadge(partido.estado)}
                            </div>
                            
                            {partido.fecha && (
                              <div className="text-xs text-gray-400 mb-3 text-center bg-yellow-500/10 rounded px-2 py-1 border border-yellow-500/20">
                                📅 {new Date(partido.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                            )}
                            
                            <div className="space-y-3">
                              <div className={`p-3 rounded-lg transition-all ${partido.equipo_ganador?.id === partido.equipo_a?.id ? 'bg-green-500/20 border border-green-500/50 shadow-lg' : 'bg-gray-700/50 border border-gray-600/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_a)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_a?.id && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <Award className="h-3 w-3" />
                                    Ganador
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-center text-gray-400 font-medium">VS</div>
                              
                              <div className={`p-3 rounded-lg transition-all ${partido.equipo_ganador?.id === partido.equipo_b?.id ? 'bg-green-500/20 border border-green-500/50 shadow-lg' : 'bg-gray-700/50 border border-gray-600/50'}`}>
                                <div className="text-sm font-medium text-white">
                                  {getEquipoNombre(partido.equipo_b)}
                                </div>
                                {partido.equipo_ganador?.id === partido.equipo_b?.id && (
                                  <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <Award className="h-3 w-3" />
                                    Ganador
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-2 mt-4">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs flex-1 hover:scale-105 transition-transform"
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
                                  className="text-xs flex-1 hover:scale-105 transition-transform"
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
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No hay partidos programados</h3>
                <p className="text-gray-400 mb-4 max-w-md mx-auto">
                  Los partidos aparecerán aquí una vez que sean creados para esta categoría
                </p>
                <Link href="/admin/ligas/partidos">
                  <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Crear Partidos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Selecciona una categoría</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Elige una categoría del menú superior para visualizar su bracket correspondiente
                </p>
              </CardContent>
            </Card>
          )}

          {/* Lista de partidos en formato tabla */}
          {selectedCategoria && partidos.length > 0 && (
            <Card className="mb-8 bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#E2FF1B]" />
                  Lista de Partidos
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Vista detallada de todos los partidos del torneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-white font-medium">Ronda</th>
                        <th className="text-left p-3 text-white font-medium">Equipo A</th>
                        <th className="text-left p-3 text-white font-medium">Equipo B</th>
                        <th className="text-left p-3 text-white font-medium">Estado</th>
                        <th className="text-left p-3 text-white font-medium">Ganador</th>
                        <th className="text-left p-3 text-white font-medium">Fecha</th>
                        <th className="text-left p-3 text-white font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidos.map((partido) => (
                        <tr key={partido.id} className="border-b border-gray-700 hover:bg-gray-800/30 transition-colors">
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs text-white">
                              {partido.ronda}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium text-white">
                            {getEquipoNombre(partido.equipo_a)}
                          </td>
                          <td className="p-3 font-medium text-white">
                            {getEquipoNombre(partido.equipo_b)}
                          </td>
                          <td className="p-3">
                            {getEstadoBadge(partido.estado)}
                          </td>
                          <td className="p-3">
                            {partido.estado === 'jugado' && partido.equipo_ganador_id && partido.equipo_ganador ? (
                              <Badge variant="default" className="text-xs text-white bg-green-600">
                                <Award className="h-3 w-3 mr-1" />
                                {getEquipoNombre(partido.equipo_ganador)}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-gray-400">
                            {partido.fecha ? (
                              <div className="flex flex-col gap-1">
                                <span>{new Date(partido.fecha).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(partido.fecha).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-3">
                            {partido.equipo_a && partido.equipo_b && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={partido.estado === 'jugado' && partido.equipo_ganador?.id === partido.equipo_a.id ? "default" : "outline"}
                                  onClick={() => partido.estado === 'jugado' 
                                    ? editarGanador(partido.id, partido.equipo_a.id)
                                    : setGanador(partido.id, partido.equipo_a.id)
                                  }
                                  className="text-xs px-2 py-1 hover:scale-105 transition-transform"
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
                                  className="text-xs px-2 py-1 hover:scale-105 transition-transform"
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
            <Card className="mt-8 bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#E2FF1B]" />
                  Estadísticas del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-blue-400 mb-1">
                      {partidos.length}
                    </p>
                    <p className="text-sm text-gray-400">Total Partidos</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="bg-green-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-green-400 mb-1">
                      {partidos.filter(p => p.estado === 'jugado').length}
                    </p>
                    <p className="text-sm text-gray-400">Jugados</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="bg-yellow-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-400 mb-1">
                      {partidos.filter(p => p.estado === 'pendiente').length}
                    </p>
                    <p className="text-sm text-gray-400">Pendientes</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="bg-red-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <XCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <p className="text-3xl font-bold text-red-400 mb-1">
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