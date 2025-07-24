"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, Users, Calendar, Eye, CheckCircle, XCircle, Clock, RefreshCw, Award, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { SingleEliminationBracket, Match, SVGViewer } from '@g-loot/react-tournament-brackets'

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

  // Transform data for react-tournament-brackets
  const bracketMatches = useMemo(() => {
    if (!partidos.length) return []

    const roundOrder = ['octavos', 'cuartos', 'semis', 'final']
    const roundNames = {
      'octavos': 'Octavos de Final',
      'cuartos': 'Cuartos de Final', 
      'semis': 'Semifinales',
      'final': 'Final'
    }

    // Group matches by round
    const matchesByRound = {}
    partidos.forEach(partido => {
      const ronda = partido.ronda.toLowerCase()
      if (!matchesByRound[ronda]) {
        matchesByRound[ronda] = []
      }
      matchesByRound[ronda].push(partido)
    })

    const matches = []

    // Create matches array for the bracket component in proper order
    roundOrder.forEach((ronda, roundIndex) => {
      if (matchesByRound[ronda]) {
        matchesByRound[ronda].forEach((partido, matchIndex) => {
          // Determine next match ID based on round progression
          let nextMatchId = null
          if (ronda === 'octavos') {
            // Octavos winners go to cuartos
            const cuartosMatchIndex = Math.floor(matchIndex / 2)
            const cuartosMatches = matchesByRound['cuartos'] || []
            if (cuartosMatches[cuartosMatchIndex]) {
              nextMatchId = cuartosMatches[cuartosMatchIndex].id
            }
          } else if (ronda === 'cuartos') {
            // Cuartos winners go to semis
            const semisMatchIndex = Math.floor(matchIndex / 2)
            const semisMatches = matchesByRound['semis'] || []
            if (semisMatches[semisMatchIndex]) {
              nextMatchId = semisMatches[semisMatchIndex].id
            }
          } else if (ronda === 'semis') {
            // Semis winners go to final
            const finalMatches = matchesByRound['final'] || []
            if (finalMatches[0]) {
              nextMatchId = finalMatches[0].id
            }
          }
          // Final has no next match

          matches.push({
            id: partido.id,
            name: `${roundNames[ronda] || ronda} - Match ${matchIndex + 1}`,
            nextMatchId: nextMatchId,
            tournamentRoundText: roundNames[ronda] || ronda,
            round: ronda,
            startTime: partido.fecha ? new Date(partido.fecha).toISOString() : null,
            state: partido.estado === 'jugado' ? 'DONE' : 
                   partido.estado === 'cancelado' ? 'NO_SHOW' : 'NO_PARTY',
            participants: [
              {
                id: partido.equipo_a?.id || `team-a-${partido.id}`,
                resultText: partido.equipo_ganador?.id === partido.equipo_a?.id ? 'WON' : 
                           partido.equipo_ganador?.id === partido.equipo_b?.id ? 'LOST' : null,
                isWinner: partido.equipo_ganador?.id === partido.equipo_a?.id,
                status: partido.estado === 'jugado' ? 'PLAYED' : null,
                name: getEquipoNombre(partido.equipo_a)
              },
              {
                id: partido.equipo_b?.id || `team-b-${partido.id}`,
                resultText: partido.equipo_ganador?.id === partido.equipo_b?.id ? 'WON' : 
                           partido.equipo_ganador?.id === partido.equipo_a?.id ? 'LOST' : null,
                isWinner: partido.equipo_ganador?.id === partido.equipo_b?.id,
                status: partido.estado === 'jugado' ? 'PLAYED' : null,
                name: getEquipoNombre(partido.equipo_b)
              }
            ]
          })
        })
      }
    })

    return matches
  }, [partidos])

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

          {/* Tournament Bracket */}
          {selectedCategoria && partidos.length > 0 && bracketMatches.length > 0 ? (
            <Card className="mb-8 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Bracket del Torneo</CardTitle>
                <CardDescription className="text-gray-400">
                  Visualización interactiva de la estructura del torneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <div className="w-full min-w-max">
                    <SingleEliminationBracket
                      matches={bracketMatches}
                      matchComponent={({ match, ...props }) => (
                        <div style={{ 
                          padding: '8px', 
                          fontSize: '11px',
                          minHeight: '140px',
                          width: '280px',
                          display: 'flex',
                          flexDirection: 'column',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          overflow: 'hidden'
                        }}>
                          {/* Header con ronda */}
                          <div style={{ 
                            backgroundColor: '#E2FC1D', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            marginBottom: '6px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            border: '1px solid #d1d5db'
                          }}>
                            {match.tournamentRoundText || match.round || 'Ronda'}
                          </div>
                          
                          {/* Estado del partido */}
                          <div style={{
                            fontSize: '9px',
                            textAlign: 'center',
                            marginBottom: '4px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: match.state === 'DONE' ? '#10b981' : 
                                           match.state === 'NO_SHOW' ? '#ef4444' : '#f59e0b',
                            color: 'white',
                            fontWeight: 'bold'
                          }}>
                            {match.state === 'DONE' ? 'JUGADO' : 
                             match.state === 'NO_SHOW' ? 'CANCELADO' : 'PENDIENTE'}
                          </div>
                          
                          {/* Fecha del partido */}
                          {match.startTime && (
                            <div style={{
                              fontSize: '9px',
                              textAlign: 'center',
                              marginBottom: '4px',
                              padding: '3px 6px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '3px',
                              color: '#4b5563',
                              fontWeight: '500',
                              border: '1px solid #e5e7eb'
                            }}>
                              📅 {new Date(match.startTime).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short'
                              })}
                            </div>
                          )}
                          
                          {/* Contenido principal del match */}
                          <div style={{ 
                            flex: 1,
                            minHeight: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Match match={match} {...props} />
                          </div>
                          
                          {/* Botones para setear/editar ganador */}
                          {match.participants.length >= 2 && (
                            <div style={{
                              display: 'flex',
                              gap: '4px',
                              marginTop: '4px'
                            }}>
                              <button
                                onClick={() => match.state === 'DONE' 
                                  ? editarGanador(match.id, match.participants[0].id)
                                  : setGanador(match.id, match.participants[0].id)
                                }
                                style={{
                                  flex: 1,
                                  fontSize: '8px',
                                  padding: '3px 6px',
                                  backgroundColor: match.state === 'DONE' && match.participants[0].isWinner 
                                    ? '#10b981' 
                                    : match.state === 'DONE' 
                                      ? '#6b7280'
                                      : '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontWeight: 'bold'
                                }}
                                title={`${match.state === 'DONE' ? 'Cambiar a' : 'Ganador'}: ${match.participants[0].name}`}
                              >
                                {match.state === 'DONE' && match.participants[0].isWinner ? '✅' : '🏆'} {match.participants[0].name?.split(' ')[0] || 'Equipo A'}
                              </button>
                              <button
                                onClick={() => match.state === 'DONE' 
                                  ? editarGanador(match.id, match.participants[1].id)
                                  : setGanador(match.id, match.participants[1].id)
                                }
                                style={{
                                  flex: 1,
                                  fontSize: '8px',
                                  padding: '3px 6px',
                                  backgroundColor: match.state === 'DONE' && match.participants[1].isWinner 
                                    ? '#10b981' 
                                    : match.state === 'DONE' 
                                      ? '#6b7280'
                                      : '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontWeight: 'bold'
                                }}
                                title={`${match.state === 'DONE' ? 'Cambiar a' : 'Ganador'}: ${match.participants[1].name}`}
                              >
                                {match.state === 'DONE' && match.participants[1].isWinner ? '✅' : '🏆'} {match.participants[1].name?.split(' ')[0] || 'Equipo B'}
                              </button>
                            </div>
                          )}
                          
                          {/* Footer con ID y puntos */}
                          <div style={{
                            fontSize: '8px',
                            textAlign: 'center',
                            marginTop: '4px',
                            padding: '2px 4px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '3px',
                            color: '#374151',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>ID: {match.id}</span>
                            <span style={{ 
                              backgroundColor: '#E2FC1D', 
                              color: '#1f2937',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              fontWeight: 'bold',
                              fontSize: '7px'
                            }}>
                              +3 pts
                            </span>
                          </div>
                        </div>
                      )}
                      options={{
                        style: {
                          roundHeader: {
                            backgroundColor: '#f8fafc',
                            color: '#374151',
                            fontSize: '16px',
                            fontWeight: '600',
                            padding: '8px 12px'
                          },
                          connectorColor: '#d1d5db',
                          connectorColorHighlight: '#3b82f6',
                          roundSeparatorWidth: 60,
                          matchUpConnectorColor: '#d1d5db',
                          matchUpConnectorColorHighlight: '#3b82f6'
                        }
                      }}
                      svgWrapper={({ children, ...props }) => (
                        <SVGViewer width="100%" height={700} {...props}>
                          {children}
                        </SVGViewer>
                      )}
                    />
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