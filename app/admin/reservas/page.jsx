'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Calendar, Clock, Users, X, Check, Loader2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function AdminReservasPage() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(false)
  const [crearTurno, setCrearTurno] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [filtroEstado, setFiltroEstado] = useState('all')
  const [formData, setFormData] = useState({
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    categoria: '',
    capacidad: 4
  })
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchTurnos()
  }, [])

  const fetchTurnos = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/reservas?incluir_inscripciones=true', {
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

  const handleCreateTurno = async (e) => {
    e.preventDefault()
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Turno creado",
          description: "El turno se ha creado exitosamente",
          variant: "default",
        })
        setCrearTurno(false)
        setFormData({ fecha: '', hora_inicio: '', hora_fin: '', categoria: '', capacidad: 4 })
        fetchTurnos()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al crear turno"
        })
      }
    } catch (error) {
      console.error('Error creating turno:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al crear turno"
      })
    }
  }

  const handleCancelarTurno = async (turnoId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`/api/reservas?id=${turnoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Turno eliminado",
          description: result.message,
          variant: "default",
        })
        fetchTurnos()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al eliminar turno"
        })
      }
    } catch (error) {
      console.error('Error canceling turno:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cancelar turno"
      })
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calcularHoraFin = (horaInicio) => {
    if (!horaInicio) return ''
    
    // Convertir hora a minutos
    const [horas, minutos] = horaInicio.split(':').map(Number)
    const totalMinutos = horas * 60 + minutos
    // Sumar 1 hora (60 minutos)
    const nuevaHoraTotal = totalMinutos + 60
    
    // Convertir de vuelta a formato HH:MM
    const nuevasHoras = Math.floor(nuevaHoraTotal / 60) % 24
    const nuevosMinutos = nuevaHoraTotal % 60
    
    return `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}`
  }

  const handleHoraInicioChange = (horaInicio) => {
    setFormData(prev => ({
      ...prev,
      hora_inicio: horaInicio,
      hora_fin: calcularHoraFin(horaInicio)
    }))
  }

  const handleAprobarInscripcion = async (inscripcionId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`/api/reservas/inscripciones/${inscripcionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ estado: 'confirmada' })
        })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Reserva aprobada",
          description: result.message,
          variant: "default",
        })
        fetchTurnos()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al aprobar reserva"
        })
      }
    } catch (error) {
      console.error('Error approving inscripcion:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al aprobar reserva"
      })
    }
  }

  const handleRechazarInscripcion = async (inscripcionId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`/api/reservas/inscripciones/${inscripcionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ estado: 'cancelada' })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Reserva rechazada",
          description: result.message,
          variant: "default",
        })
        fetchTurnos()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al rechazar reserva"
        })
      }
    } catch (error) {
      console.error('Error rejecting inscripcion:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al rechazar reserva"
      })
    }
  }

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'disponible':
        return <Badge className="bg-green-600">Disponible</Badge>
      case 'completo':
        return <Badge variant="secondary">Completo</Badge>
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getDiaNombre = (fecha) => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    // Parsear solo la fecha sin hora
    const fechaObj = new Date(fecha.split('T')[0] + 'T00:00:00')
    return dias[fechaObj.getDay()]
  }

  const formatFecha = (fecha) => {
    // Extraer solo la parte de la fecha (YYYY-MM-DD)
    const fechaStr = fecha.split('T')[0]
    // Crear fecha sin hora para formatear
    const fechaObj = new Date(fechaStr + 'T00:00:00')
    return fechaObj.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const turnosFiltrados = turnos.filter(turno => {
    if (filtroCategoria !== 'all' && turno.categoria !== filtroCategoria) return false
    if (filtroEstado !== 'all' && turno.estado !== filtroEstado) return false
    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Reservas</h1>
          <p className="text-gray-300">Administra los turnos de entrenamientos grupales</p>
        </div>
        
        <Dialog open={crearTurno} onOpenChange={setCrearTurno}>
          <DialogTrigger asChild>
            <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
              <Plus className="w-4 h-4 mr-2" />
              Crear Turno
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Nuevo Turno</DialogTitle>
              <DialogDescription className="text-gray-300">
                Completa los datos para crear un nuevo turno de entrenamiento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTurno} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Fecha</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Hora Inicio</Label>
                  <Input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => handleHoraInicioChange(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Hora Fin</Label>
                  <Input
                    type="time"
                    value={formData.hora_fin}
                    className="bg-gray-800 border-gray-700 text-white"
                    readOnly
                  />
                  <p className="text-xs text-gray-400">Calculado automáticamente (1 hora)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Categoría</Label>
                <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)} required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="C4" className="text-white hover:bg-gray-700">C4 - Principiantes</SelectItem>
                    <SelectItem value="C6" className="text-white hover:bg-gray-700">C6 - Intermedio</SelectItem>
                    <SelectItem value="C7" className="text-white hover:bg-gray-700">C7 - Avanzado</SelectItem>
                    <SelectItem value="C8" className="text-white hover:bg-gray-700">C8 - Profesional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Capacidad</Label>
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.capacidad}
                  onChange={(e) => handleInputChange('capacidad', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                  <Check className="w-4 h-4 mr-2" />
                  Crear Turno
                </Button>
                <Button type="button" variant="outline" onClick={() => setCrearTurno(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="mb-8 bg-black/40 border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-white text-sm mb-2">Filtrar por Categoría</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">Todas</SelectItem>
                  <SelectItem value="C4" className="text-white hover:bg-gray-700">C4</SelectItem>
                  <SelectItem value="C6" className="text-white hover:bg-gray-700">C6</SelectItem>
                  <SelectItem value="C7" className="text-white hover:bg-gray-700">C7</SelectItem>
                  <SelectItem value="C8" className="text-white hover:bg-gray-700">C8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-white text-sm mb-2">Filtrar por Estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">Todos</SelectItem>
                  <SelectItem value="disponible" className="text-white hover:bg-gray-700">Disponible</SelectItem>
                  <SelectItem value="completo" className="text-white hover:bg-gray-700">Completo</SelectItem>
                  <SelectItem value="cancelado" className="text-white hover:bg-gray-700">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Turnos */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
        </div>
      ) : turnosFiltrados.length === 0 ? (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="text-center text-gray-400 py-8">
              No hay turnos disponibles con los filtros seleccionados
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {turnosFiltrados.map((turno) => (
            <Card key={turno.id} className="bg-black/40 border-white/10 h-full">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#E2FF1B]" />
                    <span className="font-bold text-white">
                      {getDiaNombre(turno.fecha)} {formatFecha(turno.fecha)}
                    </span>
                    <span className="text-gray-400">•</span>
                    <Clock className="w-5 h-5 text-[#E2FF1B]" />
                    <span className="text-white font-medium">{turno.hora_inicio} - {turno.hora_fin}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-white font-medium">Categoría {turno.categoria}</span>
                    {getEstadoBadge(turno.estado)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <Users className="w-4 h-4" />
                  <span>{turno.inscripciones?.length || 0} / {turno.capacidad} inscritos</span>
                </div>
                
                {turno.inscripciones && turno.inscripciones.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white font-semibold">Inscritos:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {turno.inscripciones.map((inscripcion) => (
                        <div key={inscripcion.id} className="bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-white text-sm font-semibold">
                                {inscripcion.usuarios?.nombre} {inscripcion.usuarios?.apellido}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {inscripcion.usuarios?.email}
                              </div>
                            </div>
                            <Badge className={
                              inscripcion.estado === 'confirmada' 
                                ? 'bg-green-600' 
                                : inscripcion.estado === 'pendiente'
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                            }>
                              {inscripcion.estado}
                            </Badge>
                          </div>
                          {inscripcion.estado === 'pendiente' && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                onClick={() => handleAprobarInscripcion(inscripcion.id)}
                                className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRechazarInscripcion(inscripcion.id)}
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-7 text-xs"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                          {inscripcion.estado === 'confirmada' && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRechazarInscripcion(inscripcion.id)}
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-7 text-xs"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {turno.estado === 'cancelado' ? (
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  ) : turno.estado === 'disponible' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelarTurno(turno.id)}
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar Turno
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

