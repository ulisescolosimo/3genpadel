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
  User,
  FileText,
  Image as ImageIcon,
  ExternalLink
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
import * as XLSX from 'xlsx'

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
    estado_pareja: '',
    fecha_inscripcion: new Date().toISOString().split('T')[0]
  })
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([])
  const [busquedaUsuario, setBusquedaUsuario] = useState('')
  const [mostrarDropdownUsuarios, setMostrarDropdownUsuarios] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedInscripcion, setSelectedInscripcion] = useState(null)

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
          division:circuito3gen_divisiones!circuitooka_inscripciones_division_id_fkey (
            id,
            numero_division,
            nombre
          ),
          division_solicitada_rel:circuito3gen_divisiones!circuitooka_inscripciones_division_solicitada_fkey (
            id,
            numero_division,
            nombre
          ),
          usuario:usuarios (
            id,
            nombre,
            apellido,
            email,
            telefono,
            avatar_url
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
        estado_pareja: inscripcion.estado_pareja || '',
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
        estado_pareja: '',
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
          : null,
        estado_pareja: formData.estado_pareja && formData.estado_pareja !== 'all' 
          ? formData.estado_pareja 
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

  const getDivisionLabel = (division) => {
    if (!division) return 'N/A'
    // Si tiene nombre y contiene "PRO", usarlo directamente
    if (division.nombre && division.nombre.includes('PRO')) {
      return division.nombre
    }
    // Mapeo: numero_division 1 = PRO, 2 = División 1, 3 = División 2, 4 = División 3
    const mapping = {
      1: 'División PRO',
      2: 'División 1',
      3: 'División 2',
      4: 'División 3'
    }
    return mapping[division.numero_division] || `División ${division.numero_division}`
  }

  const getEstadoParejaLabel = (estadoPareja) => {
    if (!estadoPareja) return 'No especificado'
    const labels = {
      tiene_pareja: 'Ya tiene pareja',
      necesita_pareja: 'Necesita pareja'
    }
    return labels[estadoPareja] || estadoPareja
  }

  const getEstadoParejaBadge = (estadoPareja) => {
    if (!estadoPareja) {
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
    const badges = {
      tiene_pareja: 'bg-green-500/20 text-green-400 border-green-500/50',
      necesita_pareja: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    }
    return badges[estadoPareja] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'
  }

  const exportarInscripciones = () => {
    const headers = ['Nombre', 'Apellido', 'Email', 'Etapa', 'División', 'Estado', 'Fecha Inscripción', 'Imagen/Avatar URL']
    const rows = inscripciones.map(inscripcion => {
      const imagenUrl = inscripcion.imagen_jugador_url || inscripcion.usuario?.avatar_url || ''
      return [
        inscripcion.usuario?.nombre ?? '',
        inscripcion.usuario?.apellido ?? '',
        inscripcion.usuario?.email ?? '',
        inscripcion.etapa?.nombre ?? '',
        getDivisionLabel(inscripcion.division),
        inscripcion.estado ?? '',
        inscripcion.fecha_inscripcion ?? '',
        imagenUrl
      ]
    })

    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Ajustar ancho de columnas para mejor legibilidad
    ws['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 12 }, { wch: 18 }, { wch: 60 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inscripciones')

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inscripciones_${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleViewDetails = (inscripcion) => {
    setSelectedInscripcion(inscripcion)
    setIsDetailDialogOpen(true)
  }

  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false)
    setSelectedInscripcion(null)
  }

  const isImageFile = (url) => {
    if (!url) return false
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    return imageExtensions.some(ext => url.toLowerCase().includes(ext))
  }

  const isPdfFile = (url) => {
    if (!url) return false
    return url.toLowerCase().includes('.pdf')
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
                      {getDivisionLabel(division)}
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
                      <h3 
                        className="text-white font-semibold cursor-pointer hover:text-yellow-400 transition-colors"
                        onClick={() => handleViewDetails(inscripcion)}
                      >
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
                      <Badge className={getEstadoParejaBadge(inscripcion.estado_pareja)}>
                        {getEstadoParejaLabel(inscripcion.estado_pareja)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                      <span>{inscripcion.usuario?.email}</span>
                      <span>•</span>
                      <span>{inscripcion.etapa?.nombre}</span>
                      <span>•</span>
                      <span>{getDivisionLabel(inscripcion.division)}</span>
                      <span>•</span>
                      <span>
                        {new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}
                      </span>
                    </div>
                    {inscripcion.division_solicitada_rel && (
                      <p className="mt-1 text-sm text-yellow-400">
                        División solicitada: {getDivisionLabel(inscripcion.division_solicitada_rel)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(inscripcion)}
                      className="text-gray-400 hover:text-blue-400"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
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
                        {getDivisionLabel(division)}
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
                        {getDivisionLabel(division)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Para casos especiales (ej: solicitud para División 2)
                </p>
              </div>

              {/* Estado de Pareja */}
              <div>
                <Label htmlFor="estado_pareja">Estado de Pareja</Label>
                <Select
                  value={formData.estado_pareja || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, estado_pareja: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="No especificado" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">No especificado</SelectItem>
                    <SelectItem value="tiene_pareja">Ya tiene pareja</SelectItem>
                    <SelectItem value="necesita_pareja">Necesita pareja</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Indica si el jugador ya tiene pareja o necesita que la organización le asigne una
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

      {/* Dialog para ver detalles de la inscripción */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-500" />
              Detalles de la Inscripción
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Información completa de la inscripción del jugador
            </DialogDescription>
          </DialogHeader>
          {selectedInscripcion && (
            <div className="space-y-6 py-4">
              {/* Información del Usuario */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Información del Jugador
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Nombre completo</p>
                    <p className="text-white font-medium">
                      {selectedInscripcion.usuario?.nombre} {selectedInscripcion.usuario?.apellido}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Email</p>
                    <p className="text-white">{selectedInscripcion.usuario?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Teléfono</p>
                    <p className="text-white">{selectedInscripcion.usuario?.telefono || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Información de la Inscripción */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-yellow-400" />
                  Información de la Inscripción
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Etapa</p>
                    <p className="text-white font-medium">{selectedInscripcion.etapa?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">División Asignada</p>
                    <p className="text-white">
                      {getDivisionLabel(selectedInscripcion.division)}
                    </p>
                  </div>
                  {selectedInscripcion.division_solicitada_rel && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">División Solicitada</p>
                      <p className="text-yellow-400">
                        {getDivisionLabel(selectedInscripcion.division_solicitada_rel)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Estado</p>
                    <Badge className={getEstadoBadge(selectedInscripcion.estado)}>
                      {selectedInscripcion.estado}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Estado de Pareja</p>
                    <Badge className={getEstadoParejaBadge(selectedInscripcion.estado_pareja)}>
                      {getEstadoParejaLabel(selectedInscripcion.estado_pareja)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Fecha de Inscripción</p>
                    <p className="text-white">
                      {new Date(selectedInscripcion.fecha_inscripcion).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Imagen del Jugador y Comprobante - En fila en desktop */}
              {(selectedInscripcion.imagen_jugador_url || selectedInscripcion.comprobante_url) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Imagen del Jugador */}
                  {selectedInscripcion.imagen_jugador_url && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-green-400" />
                        Imagen del Jugador
                      </h3>
                      <div className="flex flex-col items-center gap-4">
                        {isImageFile(selectedInscripcion.imagen_jugador_url) ? (
                          <div className="relative">
                            <img
                              src={selectedInscripcion.imagen_jugador_url}
                              alt={`Imagen de ${selectedInscripcion.usuario?.nombre} ${selectedInscripcion.usuario?.apellido}`}
                              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-gray-700"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                            <div className="hidden w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-700 items-center justify-center text-center p-4">
                              <p className="text-gray-400 text-xs">No se pudo cargar</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full max-w-xs p-4 bg-gray-700 rounded-lg text-center">
                            <p className="text-gray-400 mb-2 text-sm">Archivo no es una imagen</p>
                            <a
                              href={selectedInscripcion.imagen_jugador_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 justify-center text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Ver archivo
                            </a>
                          </div>
                        )}
                        {selectedInscripcion.imagen_jugador_filename && (
                          <p className="text-sm text-gray-400 text-center">
                            {selectedInscripcion.imagen_jugador_filename}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comprobante de Pago */}
                  {selectedInscripcion.comprobante_url && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Comprobante de Pago
                      </h3>
                      <div className="flex flex-col items-center gap-4">
                        {isImageFile(selectedInscripcion.comprobante_url) ? (
                          <div className="relative w-full max-w-md">
                            <img
                              src={selectedInscripcion.comprobante_url}
                              alt="Comprobante de pago"
                              className="w-full h-auto rounded-lg border border-gray-700"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'block'
                              }}
                            />
                            <div className="hidden text-center p-4 bg-gray-700 rounded-lg">
                              <p className="text-gray-400">No se pudo cargar el comprobante</p>
                            </div>
                          </div>
                        ) : isPdfFile(selectedInscripcion.comprobante_url) ? (
                          <div className="w-full max-w-md p-4 bg-gray-700 rounded-lg text-center">
                            <FileText className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                            <p className="text-gray-400 mb-2">Archivo PDF</p>
                            <a
                              href={selectedInscripcion.comprobante_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 justify-center"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Abrir PDF en nueva pestaña
                            </a>
                          </div>
                        ) : (
                          <div className="w-full max-w-md p-4 bg-gray-700 rounded-lg text-center">
                            <p className="text-gray-400 mb-2">Archivo adjunto</p>
                            <a
                              href={selectedInscripcion.comprobante_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 justify-center"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Ver archivo
                            </a>
                          </div>
                        )}
                        {selectedInscripcion.comprobante_filename && (
                          <p className="text-sm text-gray-400">
                            Archivo: {selectedInscripcion.comprobante_filename}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
                  <p className="text-gray-400">No hay archivos adjuntos para esta inscripción</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDetailDialog}
              className="border-gray-700 text-gray-300"
            >
              Cerrar
            </Button>
            {selectedInscripcion && (
              <Button
                type="button"
                onClick={() => {
                  handleCloseDetailDialog()
                  handleOpenDialog(selectedInscripcion)
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

