'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function InscripcionesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [inscripciones, setInscripciones] = useState([])
  const [etapas, setEtapas] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [filtros, setFiltros] = useState({
    etapa_id: 'all',
    division_id: 'all',
    estado: 'all',
    busqueda: ''
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInscripcion, setEditingInscripcion] = useState(null)
  const [formData, setFormData] = useState({
    etapa_id: '',
    usuario_id: '',
    division_id: '',
    division_solicitada: '',
    evaluacion_organizador: false,
    estado: 'activa',
    fecha_inscripcion: new Date().toISOString().split('T')[0]
  })
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([])
  const [busquedaUsuario, setBusquedaUsuario] = useState('')
  const [mostrarDropdownUsuarios, setMostrarDropdownUsuarios] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchInscripciones()
  }, [filtros])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mostrarDropdownUsuarios && !event.target.closest('.usuario-search-container')) {
        setMostrarDropdownUsuarios(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mostrarDropdownUsuarios])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchEtapas(),
        fetchDivisiones()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEtapas = async () => {
    try {
      const { data, error } = await supabase
        .from('circuito3gen_etapas')
        .select('*')
        .order('año', { ascending: false })
        .order('fecha_inicio', { ascending: false })

      if (error) throw error
      setEtapas(data || [])
    } catch (error) {
      console.error('Error fetching etapas:', error)
    }
  }

  const fetchDivisiones = async () => {
    try {
      const { data, error } = await supabase
        .from('circuito3gen_divisiones')
        .select('*')
        .order('numero_division', { ascending: true })

      if (error) throw error
      setDivisiones(data || [])
    } catch (error) {
      console.error('Error fetching divisiones:', error)
    }
  }

  const buscarUsuarios = async (termino) => {
    if (!termino || termino.trim() === '') {
      setUsuariosDisponibles([])
      setMostrarDropdownUsuarios(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email, telefono')
        .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,email.ilike.%${termino}%`)
        .neq('rol', 'admin')
        .limit(10)

      if (error) throw error

      setUsuariosDisponibles(data || [])
      setMostrarDropdownUsuarios(true)
    } catch (error) {
      console.error('Error buscando usuarios:', error)
      setUsuariosDisponibles([])
    }
  }

  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setFormData({ ...formData, usuario_id: usuario.id })
    setBusquedaUsuario(`${usuario.nombre} ${usuario.apellido} (${usuario.email})`)
    setMostrarDropdownUsuarios(false)
  }

  const fetchInscripciones = async () => {
    try {
      let query = supabase
        .from('circuito3gen_inscripciones')
        .select(`
          *,
          etapa:circuito3gen_etapas (
            id,
            nombre,
            estado
          ),
          division:circuito3gen_divisiones!circuito3gen_inscripciones_division_id_fkey (
            id,
            numero_division,
            nombre
          ),
          division_solicitada_rel:circuito3gen_divisiones!circuito3gen_inscripciones_division_solicitada_fkey (
            id,
            numero_division,
            nombre
          ),
          usuario:usuarios!circuito3gen_inscripciones_usuario_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono
          )
        `)
        .order('fecha_inscripcion', { ascending: false })

      if (filtros.etapa_id && filtros.etapa_id !== 'all') {
        query = query.eq('etapa_id', filtros.etapa_id)
      }
      if (filtros.division_id && filtros.division_id !== 'all') {
        query = query.eq('division_id', filtros.division_id)
      }
      if (filtros.estado && filtros.estado !== 'all') {
        query = query.eq('estado', filtros.estado)
      }

      const { data, error } = await query

      if (error) throw error

      // Filtrar por búsqueda si existe
      let filteredData = data || []
      if (filtros.busqueda) {
        const busquedaLower = filtros.busqueda.toLowerCase()
        filteredData = filteredData.filter(inscripcion =>
          inscripcion.usuario?.nombre?.toLowerCase().includes(busquedaLower) ||
          inscripcion.usuario?.apellido?.toLowerCase().includes(busquedaLower) ||
          inscripcion.usuario?.email?.toLowerCase().includes(busquedaLower)
        )
      }

      setInscripciones(filteredData)
    } catch (error) {
      console.error('Error fetching inscripciones:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar las inscripciones',
        variant: 'destructive'
      })
    }
  }

  const handleOpenDialog = (inscripcion = null) => {
    if (inscripcion) {
      setEditingInscripcion(inscripcion)
      setUsuarioSeleccionado(inscripcion.usuario)
      setBusquedaUsuario(
        inscripcion.usuario
          ? `${inscripcion.usuario.nombre} ${inscripcion.usuario.apellido} (${inscripcion.usuario.email})`
          : ''
      )
      setFormData({
        etapa_id: inscripcion.etapa_id,
        usuario_id: inscripcion.usuario_id,
        division_id: inscripcion.division_id,
        division_solicitada: inscripcion.division_solicitada || '',
        evaluacion_organizador: inscripcion.evaluacion_organizador || false,
        estado: inscripcion.estado,
        fecha_inscripcion: inscripcion.fecha_inscripcion || new Date().toISOString().split('T')[0]
      })
    } else {
      setEditingInscripcion(null)
      setUsuarioSeleccionado(null)
      setBusquedaUsuario('')
      setFormData({
        etapa_id: filtros.etapa_id && filtros.etapa_id !== 'all' ? filtros.etapa_id : '',
        usuario_id: '',
        division_id: '',
        division_solicitada: '',
        evaluacion_organizador: false,
        estado: 'activa',
        fecha_inscripcion: new Date().toISOString().split('T')[0]
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingInscripcion(null)
    setUsuarioSeleccionado(null)
    setBusquedaUsuario('')
    setUsuariosDisponibles([])
    setMostrarDropdownUsuarios(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Validaciones
      if (!formData.usuario_id) {
        throw new Error('Debe seleccionar un usuario')
      }
      if (!formData.etapa_id) {
        throw new Error('Debe seleccionar una etapa')
      }
      if (!formData.division_id) {
        throw new Error('Debe seleccionar una división')
      }

      const url = '/api/circuito3gen/inscripciones'
      const method = editingInscripcion ? 'PUT' : 'POST'
      
      // Preparar body, limpiando campos vacíos
      const bodyData = {
        ...formData,
        division_solicitada: formData.division_solicitada && formData.division_solicitada !== 'all' 
          ? formData.division_solicitada 
          : null
      }
      
      const body = editingInscripcion
        ? { id: editingInscripcion.id, ...bodyData }
        : bodyData

      const session = await supabase.auth.getSession()
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar la inscripción')
      }

      toast({
        title: 'Éxito',
        description: editingInscripcion ? 'Inscripción actualizada' : 'Inscripción creada',
      })

      handleCloseDialog()
      fetchInscripciones()
    } catch (error) {
      console.error('Error saving inscripcion:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta inscripción?')) return

    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`/api/circuito3gen/inscripciones?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`
        }
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar la inscripción')
      }

      toast({
        title: 'Éxito',
        description: 'Inscripción eliminada',
      })

      fetchInscripciones()
    } catch (error) {
      console.error('Error deleting inscripcion:', error)
      toast({
        title: 'Error',
        description: 'Error al eliminar la inscripción',
        variant: 'destructive'
      })
    }
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      activa: 'bg-green-500/20 text-green-400 border-green-500/50',
      pausada: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      finalizada: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
    return badges[estado] || badges.activa
  }

  const exportarInscripciones = () => {
    const csv = [
      ['Nombre', 'Apellido', 'Email', 'Etapa', 'División', 'Estado', 'Fecha Inscripción'].join(','),
      ...inscripciones.map(inscripcion => [
        inscripcion.usuario?.nombre || '',
        inscripcion.usuario?.apellido || '',
        inscripcion.usuario?.email || '',
        inscripcion.etapa?.nombre || '',
        `División ${inscripcion.division?.numero_division}`,
        inscripcion.estado,
        inscripcion.fecha_inscripcion
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inscripciones_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-yellow-500" />
            Gestión de Inscripciones
          </h1>
          <p className="text-gray-400 mt-2">Administra las inscripciones al circuito</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportarInscripciones}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            Nueva Inscripción
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Etapa</label>
              <Select
                value={filtros.etapa_id || 'all'}
                onValueChange={(value) => setFiltros({ ...filtros, etapa_id: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Todas las etapas" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todas las etapas</SelectItem>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">División</label>
              <Select
                value={filtros.division_id || 'all'}
                onValueChange={(value) => setFiltros({ ...filtros, division_id: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Todas las divisiones" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todas las divisiones</SelectItem>
                  {divisiones.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      División {division.numero_division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Estado</label>
              <Select
                value={filtros.estado || 'all'}
                onValueChange={(value) => setFiltros({ ...filtros, estado: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, apellido o email..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de inscripciones */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            Inscripciones ({inscripciones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inscripciones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No se encontraron inscripciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inscripciones.map((inscripcion) => (
                <div
                  key={inscripcion.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-semibold">
                        {inscripcion.usuario?.nombre} {inscripcion.usuario?.apellido}
                      </h3>
                      <Badge className={getEstadoBadge(inscripcion.estado)}>
                        {inscripcion.estado}
                      </Badge>
                      {inscripcion.evaluacion_organizador && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                          Requiere evaluación
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                      <span>{inscripcion.usuario?.email}</span>
                      <span>•</span>
                      <span>{inscripcion.etapa?.nombre}</span>
                      <span>•</span>
                      <span>División {inscripcion.division?.numero_division}</span>
                      <span>•</span>
                      <span>
                        {new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}
                      </span>
                    </div>
                    {inscripcion.division_solicitada_rel && (
                      <p className="mt-1 text-sm text-yellow-400">
                        División solicitada: División {inscripcion.division_solicitada_rel.numero_division} - {inscripcion.division_solicitada_rel.nombre}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(inscripcion)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(inscripcion.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingInscripcion ? 'Editar Inscripción' : 'Nueva Inscripción'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingInscripcion
                ? 'Modifica los datos de la inscripción'
                : 'Completa los datos para crear una nueva inscripción'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Buscador de Usuario */}
              <div className="usuario-search-container">
                <Label htmlFor="usuario">Jugador/Usuario *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="usuario"
                    placeholder="Buscar por nombre, apellido o email..."
                    value={busquedaUsuario}
                    onChange={(e) => {
                      const valor = e.target.value
                      setBusquedaUsuario(valor)
                      if (valor.length >= 2) {
                        buscarUsuarios(valor)
                      } else {
                        setUsuariosDisponibles([])
                        setMostrarDropdownUsuarios(false)
                      }
                    }}
                    onFocus={() => {
                      if (busquedaUsuario && busquedaUsuario.length >= 2) {
                        buscarUsuarios(busquedaUsuario)
                      }
                    }}
                    className="bg-gray-800 border-gray-700 text-white pl-10"
                    required={!editingInscripcion}
                    disabled={!!editingInscripcion}
                  />
                  {mostrarDropdownUsuarios && usuariosDisponibles.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {usuariosDisponibles.map((usuario) => (
                        <div
                          key={usuario.id}
                          onClick={() => seleccionarUsuario(usuario)}
                          className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                              <User className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white">
                                {usuario.nombre} {usuario.apellido}
                              </div>
                              <div className="text-sm text-gray-400">{usuario.email}</div>
                              {usuario.telefono && (
                                <div className="text-xs text-gray-500">{usuario.telefono}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {mostrarDropdownUsuarios && busquedaUsuario && busquedaUsuario.length >= 2 && usuariosDisponibles.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-3 text-gray-400 text-sm">
                      No se encontraron usuarios
                    </div>
                  )}
                </div>
                {usuarioSeleccionado && (
                  <div className="mt-2 p-3 bg-gray-800 rounded border border-gray-700 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">
                        {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
                      </div>
                      <div className="text-xs text-gray-400">{usuarioSeleccionado.email}</div>
                    </div>
                    {!editingInscripcion && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUsuarioSeleccionado(null)
                          setBusquedaUsuario('')
                          setFormData({ ...formData, usuario_id: '' })
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Etapa */}
              <div>
                <Label htmlFor="etapa">Etapa *</Label>
                <Select
                  value={formData.etapa_id || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, etapa_id: value === 'all' ? '' : value })}
                  required
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Seleccionar etapa" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {etapas.map((etapa) => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nombre} ({new Date(etapa.fecha_inicio).getFullYear()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* División */}
              <div>
                <Label htmlFor="division">División *</Label>
                <Select
                  value={formData.division_id || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, division_id: value === 'all' ? '' : value })}
                  required
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Seleccionar división" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {divisiones.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        División {division.numero_division} - {division.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* División Solicitada (opcional, para casos especiales) */}
              <div>
                <Label htmlFor="division_solicitada">División Solicitada (Opcional)</Label>
                <Select
                  value={formData.division_solicitada || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, division_solicitada: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Ninguna (usar división asignada)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">Ninguna (usar división asignada)</SelectItem>
                    {divisiones.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        División {division.numero_division} - {division.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Para casos especiales (ej: solicitud para División 2)
                </p>
              </div>

              {/* Fecha de Inscripción */}
              <div>
                <Label htmlFor="fecha_inscripcion">Fecha de Inscripción</Label>
                <Input
                  id="fecha_inscripcion"
                  type="date"
                  value={formData.fecha_inscripcion}
                  onChange={(e) => setFormData({ ...formData, fecha_inscripcion: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              {/* Estado y Evaluación */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="activa">Activa</SelectItem>
                      <SelectItem value="pausada">Pausada</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.evaluacion_organizador}
                      onChange={(e) =>
                        setFormData({ ...formData, evaluacion_organizador: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800"
                    />
                    Requiere evaluación del organizador
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="border-gray-700 text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {editingInscripcion ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

