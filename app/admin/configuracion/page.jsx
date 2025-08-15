'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  AlertCircle,
  Loader2,
  Save,
  Trophy,
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Trash2,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminConfiguracion() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [duplicating, setDuplicating] = useState(null) // Para prevenir doble-click

  // Función para crear un torneo vacío basado en la nueva estructura
  const createEmptyTournament = () => ({
    id: crypto.randomUUID(),
    nombre_torneo: '',
    jugador1_nombre: '',
    jugador1_apellido: '',
    jugador2_nombre: '',
    jugador2_apellido: '',
    ranking_jugador1: null,
    ranking_jugador2: null,
    ubicacion_torneo: '',
    fecha: null, // null en lugar de string vacío
    hora: '',
    link_en_vivo: '',
    proximo_partido_fecha: null, // null en lugar de string vacío
    proximo_partido_hora: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // La nueva estructura maneja cada fila como un torneo separado
      const tournamentsList = data || []
      setTournaments(tournamentsList)
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching config:', err)
      setError('Error al cargar la configuración')
      setLoading(false)
    }
  }



  // Funciones para manejar múltiples torneos
  const addTournament = () => {
    const newTournament = createEmptyTournament()
    setTournaments(prev => [...prev, newTournament])
  }

  const removeTournament = async (tournamentId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este torneo?')) {
      return
    }
    
    const tournament = tournaments.find(t => t.id === tournamentId)
    if (!tournament) return
    
    // Intentar eliminar de la base de datos
    try {
      const { error } = await supabase
        .from('configuracion')
        .delete()
        .eq('id', tournamentId)
      
      if (error) {
        // Si el error es que no existe el registro, es OK (torneo local)
        if (error.code === 'PGRST116' || error.message.includes('no rows')) {
          toast.success('Torneo eliminado')
        } else {
          throw error
        }
      } else {
        toast.success('Torneo eliminado de la base de datos')
      }
    } catch (err) {
      console.error('Error deleting tournament:', err)
      toast.error('Error al eliminar el torneo: ' + err.message)
      return
    }
    
    // Eliminar del estado local
    setTournaments(prev => prev.filter(t => t.id !== tournamentId))
  }

  const duplicateTournament = (tournamentIndex) => {
    // Prevenir doble-click
    if (duplicating === tournamentIndex) return
    setDuplicating(tournamentIndex)
    
    const tournament = tournaments[tournamentIndex]
    if (!tournament) {
      setDuplicating(null)
      return
    }
    
    const duplicatedTournament = {
      ...tournament,
      id: crypto.randomUUID(),
      nombre_torneo: `${tournament.nombre_torneo || 'Torneo'} (copia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setTournaments(prev => [...prev, duplicatedTournament])
    
    // Resetear el estado de duplicación después de un breve delay
    setTimeout(() => setDuplicating(null), 500)
  }

  const handleTournamentChange = (tournamentIndex, field, value) => {
    setTournaments(prev => 
      prev.map((tournament, index) => 
        index === tournamentIndex 
          ? { 
              ...tournament, 
              [field]: value,
              updated_at: new Date().toISOString()
            } 
          : tournament
      )
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Filtrar torneos válidos (con datos mínimos requeridos)
      const validTournaments = tournaments.filter(tournament => 
        tournament.nombre_torneo?.trim() || 
        tournament.jugador1_nombre?.trim() || 
        tournament.jugador2_nombre?.trim()
      )

      // Preparar datos para guardar
      const tournamentsToSave = validTournaments.map(tournament => {
        const { id, created_at, updated_at, ...tournamentData } = tournament
        
        // Limpiar campos de fecha: convertir strings vacíos a null
        const cleanedData = {
          ...tournamentData,
          fecha: tournamentData.fecha?.trim() || null,
          proximo_partido_fecha: tournamentData.proximo_partido_fecha?.trim() || null,
          // Limpiar campos de texto vacíos
          nombre_torneo: tournamentData.nombre_torneo?.trim() || '',
          jugador1_nombre: tournamentData.jugador1_nombre?.trim() || '',
          jugador1_apellido: tournamentData.jugador1_apellido?.trim() || '',
          jugador2_nombre: tournamentData.jugador2_nombre?.trim() || '',
          jugador2_apellido: tournamentData.jugador2_apellido?.trim() || '',
          ubicacion_torneo: tournamentData.ubicacion_torneo?.trim() || null,
          hora: tournamentData.hora?.trim() || null,
          link_en_vivo: tournamentData.link_en_vivo?.trim() || null,
          proximo_partido_hora: tournamentData.proximo_partido_hora?.trim() || null,
          // Asegurar que los rankings sean números o null
          ranking_jugador1: tournamentData.ranking_jugador1 ? parseInt(tournamentData.ranking_jugador1) : null,
          ranking_jugador2: tournamentData.ranking_jugador2 ? parseInt(tournamentData.ranking_jugador2) : null
        }
        
        return { originalId: id, data: cleanedData }
      })

      if (tournamentsToSave.length === 0) {
        toast.error('No hay torneos válidos para guardar')
        setSaving(false)
        return
      }

      const results = []
      
      // Procesar cada torneo individualmente
      for (const { originalId, data } of tournamentsToSave) {
        try {
          if (originalId) {
            // Intentar UPDATE primero
            const { data: updatedData, error: updateError } = await supabase
              .from('configuracion')
              .update(data)
              .eq('id', originalId)
              .select()
            
            if (updateError) throw updateError
            
            if (updatedData && updatedData.length > 0) {
              // UPDATE exitoso
              results.push(...updatedData)
            } else {
              // No se encontró el registro, hacer INSERT
              const { data: insertedData, error: insertError } = await supabase
                .from('configuracion')
                .insert([data])
                .select()
              
              if (insertError) throw insertError
              if (insertedData) results.push(...insertedData)
            }
          } else {
            // Sin ID, hacer INSERT directamente
            const { data: insertedData, error: insertError } = await supabase
              .from('configuracion')
              .insert([data])
              .select()
            
            if (insertError) throw insertError
            if (insertedData) results.push(...insertedData)
          }
        } catch (err) {
          console.error('Error saving tournament:', err)
          // Continuar con el siguiente torneo
        }
      }

      // Actualizar el estado local con los datos devueltos por la BD
      if (results.length > 0) {
        setTournaments(results)
      }
      
      toast.success(`${results.length} torneo(s) guardado(s) correctamente`)
      
      // Recargar datos para sincronizar
      await fetchConfig()
      
    } catch (err) {
      console.error('Error saving tournaments:', err)
      toast.error('Error al guardar los torneos')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-red-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Gestión de Torneos en Vivo</h1>
              <p className="text-gray-400">Gestiona múltiples notificaciones flotantes de torneos en vivo</p>
            </div>
            <Button
              type="button"
              onClick={addTournament}
              className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Torneo
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {tournaments.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-800 shadow-xl">
                <div className="p-8 text-center">
                  <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No hay torneos configurados</h3>
                  <p className="text-gray-500 mb-4">Agrega tu primer torneo en vivo para comenzar</p>
                  <Button
                    type="button"
                    onClick={addTournament}
                    className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Torneo
                  </Button>
                </div>
              </Card>
            ) : (
              tournaments.map((tournament, tournamentIndex) => (
                <Card key={tournament.id} className="bg-gray-900/50 border-gray-800 shadow-xl">
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-[#E2FF1B]" />
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold text-white">
                            Torneo #{tournamentIndex + 1}
                            {tournament.nombre_torneo && ` - ${tournament.nombre_torneo}`}
                          </h2>
                          <p className="text-xs text-gray-500">
                            {tournament.fecha ? (
                              <span className="text-green-400">● {tournament.fecha}</span>
                            ) : (
                              <span className="text-gray-500">○ Sin fecha</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateTournament(tournamentIndex)}
                          disabled={duplicating === tournamentIndex}
                          className="text-gray-400 hover:text-white disabled:opacity-50"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTournament(tournament.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4 sm:space-y-6">
                      {/* Información del Torneo */}
                      <div>
                        <label className="text-sm font-medium text-gray-400">Nombre del Torneo</label>
                        <Input
                          value={tournament.nombre_torneo || ''}
                          onChange={(e) => handleTournamentChange(tournamentIndex, 'nombre_torneo', e.target.value)}
                          className="mt-1 bg-gray-800 border-gray-700 text-white"
                          placeholder="Ej: Final del Torneo Internacional"
                        />
                      </div>

                      {/* Jugadores */}
                      <div>
                        <label className="text-sm font-medium text-gray-400 mb-3 block">Jugadores en Vivo</label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Jugador 1 */}
                          <div className="p-4 bg-gray-800/50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">Jugador 1</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-gray-500">Nombre</label>
                                <Input
                                  value={tournament.jugador1_nombre || ''}
                                  onChange={(e) => handleTournamentChange(tournamentIndex, 'jugador1_nombre', e.target.value)}
                                  className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                                  placeholder="Nombre"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Apellido</label>
                                <Input
                                  value={tournament.jugador1_apellido || ''}
                                  onChange={(e) => handleTournamentChange(tournamentIndex, 'jugador1_apellido', e.target.value)}
                                  className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                                  placeholder="Apellido"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Ranking</label>
                                <Input
                                  type="number"
                                  value={tournament.ranking_jugador1 ?? ''}
                                  onChange={(e) => handleTournamentChange(tournamentIndex, 'ranking_jugador1', e.target.value ? parseInt(e.target.value) : null)}
                                  className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                                  placeholder="Ej: 15"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Jugador 2 */}
                          <div className="p-4 bg-gray-800/50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">Jugador 2</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-gray-500">Nombre</label>
                                <Input
                                  value={tournament.jugador2_nombre || ''}
                                  onChange={(e) => handleTournamentChange(tournamentIndex, 'jugador2_nombre', e.target.value)}
                                  className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                                  placeholder="Nombre"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Apellido</label>
                                <Input
                                  value={tournament.jugador2_apellido || ''}
                                  onChange={(e) => handleTournamentChange(tournamentIndex, 'jugador2_apellido', e.target.value)}
                                  className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                                  placeholder="Apellido"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Ranking</label>
                                <Input
                                  type="number"
                                  value={tournament.ranking_jugador2 ?? ''}
                                  onChange={(e) => handleTournamentChange(tournamentIndex, 'ranking_jugador2', e.target.value ? parseInt(e.target.value) : null)}
                                  className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                                  placeholder="Ej: 22"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ubicación y Fecha del Partido */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-400">Ubicación del Torneo</label>
                          <Input
                            value={tournament.ubicacion_torneo || ''}
                            onChange={(e) => handleTournamentChange(tournamentIndex, 'ubicacion_torneo', e.target.value)}
                            className="mt-1 bg-gray-800 border-gray-700 text-white"
                            placeholder="Ej: Madrid, España"
                          />
                        </div>
                                                  <div>
                            <label className="text-sm font-medium text-gray-400">Fecha del Partido</label>
                            <Input
                              type="date"
                              value={tournament.fecha || ''}
                              onChange={(e) => handleTournamentChange(tournamentIndex, 'fecha', e.target.value || null)}
                              className="mt-1 bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                      </div>

                      {/* Hora y Link en Vivo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-400">Hora del Partido</label>
                          <Input
                            value={tournament.hora || ''}
                            onChange={(e) => handleTournamentChange(tournamentIndex, 'hora', e.target.value)}
                            className="mt-1 bg-gray-800 border-gray-700 text-white"
                            placeholder="Ej: 18:30"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-400">Link para Ver en Vivo</label>
                          <Input
                            type="url"
                            value={tournament.link_en_vivo || ''}
                            onChange={(e) => handleTournamentChange(tournamentIndex, 'link_en_vivo', e.target.value)}
                            className="mt-1 bg-gray-800 border-gray-700 text-white"
                            placeholder="Ej: https://stream.example.com"
                          />
                        </div>
                      </div>

                      {/* Próximo Partido */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-400">Fecha del Próximo Partido</label>
                          <Input
                            type="date"
                            value={tournament.proximo_partido_fecha || ''}
                            onChange={(e) => handleTournamentChange(tournamentIndex, 'proximo_partido_fecha', e.target.value || null)}
                            className="mt-1 bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-400">Hora del Próximo Partido</label>
                          <Input
                            value={tournament.proximo_partido_hora || ''}
                            onChange={(e) => handleTournamentChange(tournamentIndex, 'proximo_partido_hora', e.target.value)}
                            className="mt-1 bg-gray-800 border-gray-700 text-white"
                            placeholder="Ej: 20:00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 