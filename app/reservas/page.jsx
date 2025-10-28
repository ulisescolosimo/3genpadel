'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, Clock, Users, Check, X, Loader2, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ReservasPage() {
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(false)
  const [reservando, setReservando] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (selectedCategoria && user) {
      fetchTurnos()
    }
  }, [selectedCategoria, user])

  const fetchTurnos = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`/api/reservas?categoria=${selectedCategoria}&usuario_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        setTurnos(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al cargar turnos"
        })
      }
    } catch (error) {
      console.error('Error fetching turnos:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar turnos"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReservar = async (turnoId) => {
    setReservando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/reservas/inscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ turno_id: turnoId })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "¡Reserva exitosa!",
          description: result.message || "Te has inscrito correctamente",
          variant: "default",
        })
        // Refrescar la lista de turnos
        fetchTurnos()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al reservar turno"
        })
      }
    } catch (error) {
      console.error('Error reserving turno:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al reservar turno"
      })
    } finally {
      setReservando(false)
    }
  }

  const handleCancelar = async (inscripcionId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`/api/reservas/inscripciones?inscripcion_id=${inscripcionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Reserva cancelada",
          description: result.message || "Has cancelado tu inscripción",
          variant: "default",
        })
        // Refrescar la lista de turnos
        fetchTurnos()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al cancelar reserva"
        })
      }
    } catch (error) {
      console.error('Error canceling inscripcion:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cancelar reserva"
      })
    }
  }

  const parseFecha = (fechaStr) => {
    if (!fechaStr) return new Date()
    // Si la fecha ya incluye hora, usarla directamente
    if (fechaStr.includes('T') || fechaStr.includes(' ')) {
      return new Date(fechaStr)
    }
    // Si solo es fecha (YYYY-MM-DD), parsear manualmente para evitar problemas de zona horaria
    const [year, month, day] = fechaStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const getDiaNombre = (fecha) => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const fechaObj = parseFecha(fecha)
    return dias[fechaObj.getDay()]
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const parts = String(timeStr).split(':')
    return parts.slice(0, 2).join(':')
  }

  const getCategoriaNombre = (categoria) => {
    const categorias = {
      'C4': 'Principiantes',
      'C5': 'Principiantes Avanzados',
      'C6': 'Intermedio',
      'C7': 'Avanzado',
      'C8': 'Profesional'
    }
    return categorias[categoria] || categoria
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/sede-olleros/clases-grupales')}
              className="text-white hover:text-[#E2FF1B] hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Sistema de <span className="text-[#E2FF1B]">Reservas</span>
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">Reserva tu turno para entrenamientos grupales</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Selector de Categoría */}
          <Card className="mb-8 bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Selecciona una Categoría</CardTitle>
              <CardDescription className="text-gray-300">
                Elige tu nivel de pádel para ver los turnos disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-full md:w-[400px]">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="C4" className="text-white hover:bg-gray-700">Principiantes</SelectItem>
                  <SelectItem value="C5" className="text-white hover:bg-gray-700">Principiantes Avanzados</SelectItem>
                  <SelectItem value="C6" className="text-white hover:bg-gray-700">Intermedio</SelectItem>
                  <SelectItem value="C7" className="text-white hover:bg-gray-700">Avanzado</SelectItem>
                  <SelectItem value="C8" className="text-white hover:bg-gray-700">Profesional</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Lista de Turnos */}
          {selectedCategoria && (
            <>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
                </div>
              ) : turnos.length === 0 ? (
                <Card className="bg-black/40 border-white/10">
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-400 py-8">
                      No hay turnos disponibles para esta categoría
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {turnos.map((turno) => (
                    <Card key={turno.id} className="bg-black/40 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 hover:bg-black/60 group">
                      <CardContent className="p-4">
                        {/* Header: Categoría y Capacidad */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-[#E2FF1B]/10 text-[#E2FF1B] border-[#E2FF1B]/30 font-semibold">
                            {getCategoriaNombre(turno.categoria)}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Users className="w-3.5 h-3.5" />
                            <span>{turno.inscripciones_count || 0}/{turno.capacidad}</span>
                          </div>
                        </div>

                        {/* Fecha - Más prominente */}
                        <div className="mb-3 pb-3 border-b border-white/5">
                          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{getDiaNombre(turno.fecha)}</div>
                          <div className="text-base font-semibold text-white">
                            {parseFecha(turno.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                          </div>
                        </div>

                        {/* Hora */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 text-white">
                            <Clock className="w-4 h-4 text-[#E2FF1B]" />
                            <span className="text-sm font-medium">{formatTime(turno.hora_inicio)} - {formatTime(turno.hora_fin)}</span>
                          </div>
                        </div>

                        {/* Estado y Botón de Acción */}
                        <div className="space-y-2">
                          {turno.mi_inscripcion && (
                            <Badge 
                              className={`w-full justify-center text-xs ${
                                turno.mi_inscripcion.estado === 'confirmada' 
                                  ? 'bg-green-600/20 text-green-400 border-green-600/30' 
                                  : turno.mi_inscripcion.estado === 'pendiente'
                                  ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                                  : 'bg-red-600/20 text-red-400 border-red-600/30'
                              }`}
                            >
                              {turno.mi_inscripcion.estado === 'confirmada' 
                                ? '✓ Confirmada' 
                                : turno.mi_inscripcion.estado === 'pendiente'
                                ? '⏳ Pendiente'
                                : '✗ Cancelada'}
                            </Badge>
                          )}
                          
                          {turno.mi_inscripcion ? (
                            turno.mi_inscripcion.estado === 'pendiente' ? (
                              <Button
                                disabled
                                className="w-full bg-yellow-600/10 text-yellow-400 border border-yellow-600/30 hover:bg-yellow-600/20 cursor-not-allowed"
                                size="sm"
                              >
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                Pendiente
                              </Button>
                            ) : turno.mi_inscripcion.estado === 'confirmada' ? (
                              <Button
                                variant="outline"
                                onClick={() => handleCancelar(turno.mi_inscripcion.id)}
                                className="w-full border-red-600/30 text-red-400 hover:bg-red-600/10 hover:border-red-600/50"
                                size="sm"
                              >
                                <X className="w-3.5 h-3.5 mr-2" />
                                Cancelar
                              </Button>
                            ) : null
                          ) : turno.estado === 'disponible' ? (
                            <Button
                              onClick={() => handleReservar(turno.id)}
                              disabled={reservando}
                              className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 font-semibold group-hover:scale-[1.02] transition-transform"
                              size="sm"
                            >
                              {reservando ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                  Reservando...
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-2" />
                                  Reservar
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button 
                              disabled 
                              variant="outline" 
                              className="w-full opacity-50"
                              size="sm"
                            >
                              No disponible
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {!selectedCategoria && (
            <Card className="bg-black/40 border-white/10">
              <CardContent className="pt-6">
                <div className="text-center text-gray-400 py-8">
                  Por favor, selecciona una categoría para ver los turnos disponibles
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

