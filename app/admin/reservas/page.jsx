'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Plus, Calendar, Clock, Users, X, Check, Loader2, Eye, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [showPendientes, setShowPendientes] = useState(true)
  const [showConfirmadas, setShowConfirmadas] = useState(false)
  const [showCanceladas, setShowCanceladas] = useState(false)
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
        return <Badge className="bg-green-600 ml-2">Disponible</Badge>
      case 'completo':
        return <Badge variant="secondary" className="ml-2">Completo</Badge>
      case 'cancelado':
        return <Badge variant="destructive" className="ml-2">Cancelado</Badge>
      default:
        return <Badge className="ml-2">{estado}</Badge>
    }
  }

  const getCategoriaNombre = (categoria) => {
    const categorias = {
      'C4': 'Iniciante de cero',
      'C5': 'Principiante',
      'C6': 'Intermedio',
      'C7': 'Avanzado',
      'C8': 'Profesional'
    }
    return categorias[categoria] || categoria
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

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const parts = String(timeStr).split(':')
    return parts.slice(0, 2).join(':')
  }

  const turnosFiltrados = turnos.filter(turno => {
    if (filtroCategoria !== 'all' && turno.categoria !== filtroCategoria) return false
    if (filtroEstado !== 'all' && turno.estado !== filtroEstado) return false
    return true
  })

  // Aplanar inscripciones para panel por estado
  const inscripciones = useMemo(() => {
    const all = []
    for (const turno of turnos) {
      const lista = turno.inscripciones || []
      for (const ins of lista) {
        all.push({
          ...ins,
          _turno: turno
        })
      }
    }
    // Ordenar por fecha y hora del turno ascendente
    return all.sort((a, b) => {
      const fa = new Date((a._turno.fecha || '').split('T')[0] + 'T' + (a._turno.hora_inicio || '00:00'))
      const fb = new Date((b._turno.fecha || '').split('T')[0] + 'T' + (b._turno.hora_inicio || '00:00'))
      return fa - fb
    })
  }, [turnos])

  const pendientes = inscripciones.filter(i => i.estado === 'pendiente')
  const confirmadas = inscripciones.filter(i => i.estado === 'confirmada')
  const canceladas = inscripciones.filter(i => i.estado === 'cancelada')

  const categoriaOrder = ['C4', 'C5', 'C6', 'C7', 'C8']
  const groupByCategoria = (lista) => {
    const map = new Map()
    for (const cat of categoriaOrder) map.set(cat, [])
    for (const ins of lista) {
      const key = ins._turno?.categoria || 'otros'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(ins)
    }
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0)
  }

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
                    <SelectItem value="C4" className="text-white hover:bg-gray-700">Iniciante de cero</SelectItem>
                    <SelectItem value="C5" className="text-white hover:bg-gray-700">Principiante</SelectItem>
                    <SelectItem value="C6" className="text-white hover:bg-gray-700">Intermedio</SelectItem>
                    <SelectItem value="C7" className="text-white hover:bg-gray-700">Avanzado</SelectItem>
                    <SelectItem value="C8" className="text-white hover:bg-gray-700">Profesional</SelectItem>
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
                  <SelectItem value="C4" className="text-white hover:bg-gray-700">Iniciante de cero</SelectItem>
                  <SelectItem value="C5" className="text-white hover:bg-gray-700">Principiante</SelectItem>
                  <SelectItem value="C6" className="text-white hover:bg-gray-700">Intermedio</SelectItem>
                  <SelectItem value="C7" className="text-white hover:bg-gray-700">Avanzado</SelectItem>
                  <SelectItem value="C8" className="text-white hover:bg-gray-700">Profesional</SelectItem>
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

      {/* Secciones por estado de inscripción */}
      <div className="space-y-4 mb-8">
        {/* Pendientes */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader onClick={() => setShowPendientes(v => !v)} className="cursor-pointer select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-white">Reservas Pendientes</CardTitle>
                <Badge className="bg-yellow-600 text-white">{pendientes.length}</Badge>
              </div>
              {showPendientes ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
            </div>
            <CardDescription className="text-gray-300">Reservas a aprobar o rechazar</CardDescription>
          </CardHeader>
          {showPendientes && (
            <CardContent>
              {pendientes.length === 0 ? (
                <div className="text-gray-400">No hay reservas pendientes</div>
              ) : (
                <div className="space-y-4">
                  {groupByCategoria(pendientes).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold">{getCategoriaNombre(cat)}</h4>
                        <Badge className="bg-white/10 text-white border-white/20">{items.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {items.map((ins) => (
                          <div key={ins.id} className="bg-gray-800 p-2 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-white text-sm font-semibold truncate">
                                {ins.usuarios?.nombre} {ins.usuarios?.apellido}
                              </div>
                              <Badge className="bg-yellow-600 text-white">pendiente</Badge>
                            </div>
                            <div className="text-xs text-gray-300 flex flex-wrap items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-[#E2FF1B]" />
                              <span>{getDiaNombre(ins._turno.fecha)} {formatFecha(ins._turno.fecha)}</span>
                              <Clock className="w-3.5 h-3.5 text-[#E2FF1B]" />
                              <span>{formatTime(ins._turno.hora_inicio)}-{formatTime(ins._turno.hora_fin)}</span>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAprobarInscripcion(ins.id)}
                                className="bg-green-600 hover:bg-green-700 text-white h-7 px-2"
                                aria-label="Aprobar"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRechazarInscripcion(ins.id)}
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-7 px-2"
                                aria-label="Rechazar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="mt-2 text-[11px] text-gray-400">
                              {getCategoriaNombre(ins._turno.categoria)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Confirmadas */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader onClick={() => setShowConfirmadas(v => !v)} className="cursor-pointer select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-white">Reservas Confirmadas</CardTitle>
                <Badge className="bg-green-600 text-white">{confirmadas.length}</Badge>
              </div>
              {showConfirmadas ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
            </div>
            <CardDescription className="text-gray-300">Reservas aprobadas</CardDescription>
          </CardHeader>
          {showConfirmadas && (
            <CardContent>
              {confirmadas.length === 0 ? (
                <div className="text-gray-400">No hay reservas confirmadas</div>
              ) : (
                <div className="space-y-4">
                  {groupByCategoria(confirmadas).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold">{getCategoriaNombre(cat)}</h4>
                        <Badge className="bg-white/10 text-white border-white/20">{items.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {items.map((ins) => (
                          <div key={ins.id} className="bg-gray-800 p-2 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-white text-sm font-semibold truncate">
                                {ins.usuarios?.nombre} {ins.usuarios?.apellido}
                              </div>
                              <Badge className="bg-green-600 text-white">confirmada</Badge>
                            </div>
                            <div className="text-xs text-gray-300 flex flex-wrap items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-[#E2FF1B]" />
                              <span>{getDiaNombre(ins._turno.fecha)} {formatFecha(ins._turno.fecha)}</span>
                              <Clock className="w-3.5 h-3.5 text-[#E2FF1B]" />
                              <span>{formatTime(ins._turno.hora_inicio)}-{formatTime(ins._turno.hora_fin)}</span>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRechazarInscripcion(ins.id)}
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-7 px-2"
                                aria-label="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="mt-2 text-[11px] text-gray-400">
                              {getCategoriaNombre(ins._turno.categoria)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Canceladas */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader onClick={() => setShowCanceladas(v => !v)} className="cursor-pointer select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-white">Reservas Canceladas</CardTitle>
                <Badge className="bg-red-600 text-white">{canceladas.length}</Badge>
              </div>
              {showCanceladas ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
            </div>
            <CardDescription className="text-gray-300">Reservas rechazadas o canceladas</CardDescription>
          </CardHeader>
          {showCanceladas && (
            <CardContent>
              {canceladas.length === 0 ? (
                <div className="text-gray-400">No hay reservas canceladas</div>
              ) : (
                <div className="space-y-4">
                  {groupByCategoria(canceladas).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold">{getCategoriaNombre(cat)}</h4>
                        <Badge className="bg-white/10 text-white border-white/20">{items.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {items.map((ins) => (
                          <div key={ins.id} className="bg-gray-800 p-2 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-white text-sm font-semibold truncate">
                                {ins.usuarios?.nombre} {ins.usuarios?.apellido}
                              </div>
                              <Badge className="bg-red-600 text-white mb-2">cancelada</Badge>
                            </div>
                            <div className="text-xs text-gray-300 flex flex-wrap items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-[#E2FF1B]" />
                              <span>{getDiaNombre(ins._turno.fecha)} {formatFecha(ins._turno.fecha)}</span>
                              <Clock className="w-3.5 h-3.5 text-[#E2FF1B]" />
                              <span>{formatTime(ins._turno.hora_inicio)}-{formatTime(ins._turno.hora_fin)}</span>
                              <span>{getCategoriaNombre(ins._turno.categoria)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {turnosFiltrados.map((turno) => (
            <Card key={turno.id} className="bg-black/40 border-white/10 h-full">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="bg-white/10 text-white border-white/20">{getCategoriaNombre(turno.categoria)}</Badge>
                  {getEstadoBadge(turno.estado)}
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="w-4 h-4 text-[#E2FF1B]" />
                    <span className="text-sm font-medium">{getDiaNombre(turno.fecha)} {formatFecha(turno.fecha)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-4 h-4 text-[#E2FF1B]" />
                    <span className="text-sm font-medium">{formatTime(turno.hora_inicio)} - {formatTime(turno.hora_fin)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{turno.inscripciones?.length || 0}/{turno.capacidad}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {turno.estado === 'cancelado' ? (
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  ) : turno.estado === 'disponible' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelarTurno(turno.id)}
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
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

