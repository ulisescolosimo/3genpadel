'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Calendar, Clock, Users, X, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function AdminReservasPage() {
  const [turnosAgrupados, setTurnosAgrupados] = useState([])
  const [loading, setLoading] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [showPendientes, setShowPendientes] = useState(true)
  const [showConfirmadas, setShowConfirmadas] = useState(false)
  const [showCanceladas, setShowCanceladas] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchInscripciones()
  }, [user, router, filtroCategoria])

  const fetchInscripciones = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const categoriaParam = filtroCategoria !== 'all' ? `&categoria=${filtroCategoria}` : ''
      const response = await fetch(`/api/reservas?admin=true&incluir_inscripciones=true${categoriaParam}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        setTurnosAgrupados(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al cargar inscripciones"
        })
      }
    } catch (error) {
      console.error('Error fetching inscripciones:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar inscripciones"
      })
    } finally {
      setLoading(false)
    }
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
        fetchInscripciones()
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
        fetchInscripciones()
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

  // Las categorías ya vienen con su nombre completo, no necesitamos conversión
  const getCategoriaNombre = (categoria) => categoria

  const getDiaNombre = (fecha) => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const fechaObj = new Date(fecha)
    return dias[fechaObj.getDay()]
  }

  const formatFecha = (fecha) => {
    const fechaObj = new Date(fecha)
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

  // Aplanar inscripciones para panel por estado
  const inscripciones = useMemo(() => {
    const all = []
    for (const grupo of turnosAgrupados) {
      for (const ins of grupo.inscripciones || []) {
        all.push({
          ...ins,
          _grupo: grupo
        })
      }
    }
    // Ordenar por fecha y hora ascendente
    return all.sort((a, b) => {
      const fa = new Date(a._grupo.fecha + 'T' + a._grupo.hora_inicio)
      const fb = new Date(b._grupo.fecha + 'T' + b._grupo.hora_inicio)
      return fa - fb
    })
  }, [turnosAgrupados])

  const pendientes = inscripciones.filter(i => i.estado === 'pendiente')
  const confirmadas = inscripciones.filter(i => i.estado === 'confirmada')
  const canceladas = inscripciones.filter(i => i.estado === 'cancelada')

  const categoriaOrder = ['Iniciante de cero', 'Principiante', 'Intermedio', 'Avanzado', 'Profesional']
  const groupByCategoria = (lista) => {
    const map = new Map()
    for (const cat of categoriaOrder) map.set(cat, [])
    for (const ins of lista) {
      const key = ins._grupo?.categoria || 'otros'
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
          <p className="text-gray-300">Administra las inscripciones de entrenamientos grupales</p>
        </div>
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
                  <SelectItem value="Iniciante de cero" className="text-white hover:bg-gray-700">Iniciante de cero</SelectItem>
                  <SelectItem value="Principiante" className="text-white hover:bg-gray-700">Principiante</SelectItem>
                  <SelectItem value="Intermedio" className="text-white hover:bg-gray-700">Intermedio</SelectItem>
                  <SelectItem value="Avanzado" className="text-white hover:bg-gray-700">Avanzado</SelectItem>
                  <SelectItem value="Profesional" className="text-white hover:bg-gray-700">Profesional</SelectItem>
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
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
                </div>
              ) : pendientes.length === 0 ? (
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
                              <span>{getDiaNombre(ins._grupo.fecha)} {formatFecha(ins._grupo.fecha)}</span>
                              <Clock className="w-3.5 h-3.5 text-[#E2FF1B]" />
                              <span>{formatTime(ins._grupo.hora_inicio)}-{formatTime(ins._grupo.hora_fin)}</span>
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
                              {getCategoriaNombre(ins._grupo.categoria)}
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
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
                </div>
              ) : confirmadas.length === 0 ? (
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
                              <span>{getDiaNombre(ins._grupo.fecha)} {formatFecha(ins._grupo.fecha)}</span>
                              <Clock className="w-3.5 h-3.5 text-[#E2FF1B]" />
                              <span>{formatTime(ins._grupo.hora_inicio)}-{formatTime(ins._grupo.hora_fin)}</span>
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
                              {getCategoriaNombre(ins._grupo.categoria)}
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
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
                </div>
              ) : canceladas.length === 0 ? (
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
                              <span>{getDiaNombre(ins._grupo.fecha)} {formatFecha(ins._grupo.fecha)}</span>
                              <Clock className="w-3.5 h-3.5 text-[#E2FF1B]" />
                              <span>{formatTime(ins._grupo.hora_inicio)}-{formatTime(ins._grupo.hora_fin)}</span>
                              <span>{getCategoriaNombre(ins._grupo.categoria)}</span>
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

      {/* Vista agrupada por turnos */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Vista por Turnos</CardTitle>
          <CardDescription className="text-gray-300">Inscripciones agrupadas por fecha, hora y categoría</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
            </div>
          ) : turnosAgrupados.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No hay inscripciones</div>
          ) : (
            <div className="space-y-4">
              {turnosAgrupados.map((grupo, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className="bg-white/10 text-white border-white/20">
                          {getCategoriaNombre(grupo.categoria)}
                        </Badge>
                        <div className="flex items-center gap-2 text-white text-sm">
                          <Calendar className="w-4 h-4 text-[#E2FF1B]" />
                          <span>{getDiaNombre(grupo.fecha)} {formatFecha(grupo.fecha)}</span>
                          <Clock className="w-4 h-4 text-[#E2FF1B] ml-2" />
                          <span>{formatTime(grupo.hora_inicio)} - {formatTime(grupo.hora_fin)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{grupo.inscripciones_count}/{grupo.capacidad}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {grupo.inscripciones
                        .filter(ins => ins.estado !== 'cancelada')
                        .map((ins) => (
                          <div key={ins.id} className="bg-gray-900 p-2 rounded border border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="text-white text-sm">
                                {ins.usuarios?.nombre} {ins.usuarios?.apellido}
                              </div>
                              <Badge 
                                className={`${
                                  ins.estado === 'confirmada' 
                                    ? 'bg-green-600' 
                                    : 'bg-yellow-600'
                                } text-white`}
                              >
                                {ins.estado}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
