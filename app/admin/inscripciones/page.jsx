'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function AdminInscripciones() {
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [filterTorneo, setFilterTorneo] = useState('todos')
  const [torneos, setTorneos] = useState([])

  useEffect(() => {
    fetchInscripciones()
    fetchTorneos()
  }, [])

  const fetchInscripciones = async () => {
    try {
      const { data, error } = await supabase
        .from('inscripciones')
        .select(`
          *,
          torneos (
            nombre,
            categoria,
            fecha_inicio,
            fecha_fin,
            ubicacion
          ),
          perfiles (
            nombre,
            apellidos,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInscripciones(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching inscripciones:', err)
      setError('Error al cargar las inscripciones')
      setLoading(false)
    }
  }

  const fetchTorneos = async () => {
    try {
      const { data, error } = await supabase
        .from('torneos')
        .select('id, nombre')
        .order('fecha_inicio', { ascending: false })

      if (error) throw error

      setTorneos(data)
    } catch (err) {
      console.error('Error fetching torneos:', err)
    }
  }

  const handleEstadoChange = async (inscripcionId, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('inscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', inscripcionId)

      if (error) throw error

      toast.success('Estado de inscripción actualizado')
      fetchInscripciones()
    } catch (err) {
      console.error('Error updating inscripcion:', err)
      toast.error('Error al actualizar el estado')
    }
  }

  const filteredInscripciones = inscripciones.filter(inscripcion => {
    const matchesSearch = 
      inscripcion.perfiles.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.perfiles.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.perfiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.torneos.nombre.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEstado = filterEstado === 'todos' || inscripcion.estado === filterEstado
    const matchesTorneo = filterTorneo === 'todos' || inscripcion.torneo_id === filterTorneo

    return matchesSearch && matchesEstado && matchesTorneo
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    )
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada':
        return 'text-green-500'
      case 'rechazada':
        return 'text-red-500'
      case 'pendiente':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'aprobada':
        return <CheckCircle2 className="w-5 h-5" />
      case 'rechazada':
        return <XCircle className="w-5 h-5" />
      case 'pendiente':
        return <Clock className="w-5 h-5" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gestión de Inscripciones</h1>
        <p className="text-gray-400 mt-1">Administra las inscripciones a torneos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar inscripciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-800 text-white"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="bg-gray-900/50 border-gray-800 text-white">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobada">Aprobada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTorneo} onValueChange={setFilterTorneo}>
          <SelectTrigger className="bg-gray-900/50 border-gray-800 text-white">
            <SelectValue placeholder="Filtrar por torneo" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="todos">Todos los torneos</SelectItem>
            {torneos.map((torneo) => (
              <SelectItem key={torneo.id} value={torneo.id}>
                {torneo.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredInscripciones.map((inscripcion) => (
          <Card key={inscripcion.id} className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">
                    {inscripcion.perfiles.nombre} {inscripcion.perfiles.apellidos}
                  </h3>
                  <p className="text-sm text-gray-400">{inscripcion.perfiles.email}</p>
                  <p className="text-sm text-gray-400">
                    Torneo: {inscripcion.torneos.nombre}
                  </p>
                  <p className="text-sm text-gray-400">
                    Categoría: {inscripcion.torneos.categoria}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`flex items-center gap-2 ${getEstadoColor(inscripcion.estado)}`}>
                    {getEstadoIcon(inscripcion.estado)}
                    <span className="font-medium">
                      {inscripcion.estado.charAt(0).toUpperCase() + inscripcion.estado.slice(1)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {inscripcion.estado === 'pendiente' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEstadoChange(inscripcion.id, 'aprobada')}
                          className="border-green-500 text-green-500 hover:bg-green-500/10"
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEstadoChange(inscripcion.id, 'rechazada')}
                          className="border-red-500 text-red-500 hover:bg-red-500/10"
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                    {inscripcion.estado !== 'pendiente' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEstadoChange(inscripcion.id, 'pendiente')}
                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                      >
                        Marcar como pendiente
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Fecha de inscripción:</span>
                    <p className="text-white">
                      {new Date(inscripcion.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Fecha del torneo:</span>
                    <p className="text-white">
                      {new Date(inscripcion.torneos.fecha_inicio).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Ubicación:</span>
                    <p className="text-white">{inscripcion.torneos.ubicacion}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 