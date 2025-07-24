"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trophy, Users, Calendar, Eye, CheckCircle, XCircle, Clock, Search, RefreshCw, Plus, Edit, Trash2, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AdminLigasPartidosPage() {
  const { toast } = useToast()
  const [partidos, setPartidos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterCategoria, setFilterCategoria] = useState('all')
  const [filterEstado, setFilterEstado] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPartido, setEditingPartido] = useState(null)
  const [formData, setFormData] = useState({
    liga_categoria_id: '',
    ronda: '',
    equipo_a_id: '',
    equipo_b_id: '',
    equipo_ganador_id: '',
    puntos_por_jugador: 3,
    fecha: '',
    estado: 'pendiente'
  })

  const rondas = ['Octavos', 'Cuartos', 'Semis', 'Final']
  const estados = ['pendiente', 'jugado', 'cancelado']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Obtener categorías
      const { data: categoriasData, error: categoriasError } = await supabase
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

      if (categoriasError) throw categoriasError
      setCategorias(categoriasData || [])

      // Obtener inscripciones aprobadas
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('ligainscripciones')
        .select(`
          id,
          liga_categoria_id,
          titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
            id,
            nombre,
            apellido
          ),
          titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
            id,
            nombre,
            apellido
          ),
          suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
            id,
            nombre,
            apellido
          ),
          suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
            id,
            nombre,
            apellido
          )
        `)
        .eq('estado', 'aprobada')
        .order('created_at', { ascending: false })

      if (inscripcionesError) throw inscripcionesError
      setInscripciones(inscripcionesData || [])

      // Obtener partidos
      await fetchPartidos()
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchPartidos = async () => {
    try {
      const { data, error } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            ligas (
              id,
              nombre,
              fecha_inicio
            )
          ),
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
        .order('created_at', { ascending: false })

      if (error) throw error
      setPartidos(data || [])
    } catch (error) {
      console.error('Error fetching partidos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los partidos",
        variant: "destructive"
      })
    }
  }

  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'N/A'
    const titular1 = equipo.titular_1?.nombre || 'N/A'
    const titular2 = equipo.titular_2?.nombre || 'N/A'
    return `${titular1} & ${titular2}`
  }

  const getCategoriaNombre = (partido) => {
    const categoria = categorias.find(cat => cat.id === partido.liga_categoria_id)
    if (!categoria) return 'N/A'
    return `${categoria.ligas?.nombre || 'N/A'} - ${categoria.categoria}`
  }

  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'secondary',
      jugado: 'default',
      cancelado: 'destructive'
    }
    return <Badge variant={variants[estado]}>{estado}</Badge>
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      liga_categoria_id: '',
      ronda: '',
      equipo_a_id: '',
      equipo_b_id: '',
      equipo_ganador_id: '',
      puntos_por_jugador: 3,
      fecha: '',
      estado: 'pendiente'
    })
    setEditingPartido(null)
    setShowCreateForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const partidoData = {
        ...formData,
        liga_categoria_id: parseInt(formData.liga_categoria_id),
        equipo_a_id: parseInt(formData.equipo_a_id),
        equipo_b_id: parseInt(formData.equipo_b_id),
        equipo_ganador_id: formData.equipo_ganador_id ? parseInt(formData.equipo_ganador_id) : null,
        puntos_por_jugador: parseInt(formData.puntos_por_jugador),
        fecha: formData.fecha ? new Date(formData.fecha).toISOString() : null
      }

      if (editingPartido) {
        const { error } = await supabase
          .from('liga_partidos')
          .update(partidoData)
          .eq('id', editingPartido.id)

        if (error) throw error

        toast({
          title: "Partido actualizado",
          description: "El partido se actualizó correctamente",
          variant: "default"
        })
      } else {
        const { error } = await supabase
          .from('liga_partidos')
          .insert([partidoData])

        if (error) throw error

        toast({
          title: "Partido creado",
          description: "El partido se creó correctamente",
          variant: "default"
        })
      }

      resetForm()
      fetchPartidos()
    } catch (error) {
      console.error('Error saving partido:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el partido",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (partido) => {
    setEditingPartido(partido)
    setFormData({
      liga_categoria_id: partido.liga_categoria_id.toString(),
      ronda: partido.ronda,
      equipo_a_id: partido.equipo_a_id.toString(),
      equipo_b_id: partido.equipo_b_id.toString(),
      equipo_ganador_id: partido.equipo_ganador_id?.toString() || '',
      puntos_por_jugador: partido.puntos_por_jugador,
      fecha: partido.fecha ? new Date(partido.fecha).toISOString().slice(0, 16) : '',
      estado: partido.estado
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (partido) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este partido?')) return

    try {
      const { error } = await supabase
        .from('liga_partidos')
        .delete()
        .eq('id', partido.id)

      if (error) throw error

      toast({
        title: "Partido eliminado",
        description: "El partido se eliminó correctamente",
        variant: "default"
      })

      fetchPartidos()
    } catch (error) {
      console.error('Error deleting partido:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el partido",
        variant: "destructive"
      })
    }
  }

  const getInscripcionesByCategoria = (categoriaId) => {
    return inscripciones.filter(ins => ins.liga_categoria_id === parseInt(categoriaId))
  }

  const filteredPartidos = partidos.filter(partido => {
    const matchesCategoria = filterCategoria === 'all' || partido.liga_categoria_id === parseInt(filterCategoria)
    const matchesEstado = filterEstado === 'all' || partido.estado === filterEstado
    const matchesSearch = searchTerm === '' || 
      getEquipoNombre(partido.equipo_a).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEquipoNombre(partido.equipo_b).toLowerCase().includes(searchTerm.toLowerCase()) ||
      partido.ronda.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategoria && matchesEstado && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Partidos</h1>
          <p className="text-gray-600">Administra los partidos de las ligas</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Partido
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Categoría</label>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.ligas?.nombre} - {categoria.categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {estados.map(estado => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Buscar equipos o ronda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={fetchData}
                disabled={refreshing}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de partidos */}
      <div className="grid gap-4">
        {filteredPartidos.map(partido => (
          <Card key={partido.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <Badge variant="outline">{partido.ronda}</Badge>
                    {getEstadoBadge(partido.estado)}
                    <span className="text-sm text-gray-500">
                      {getCategoriaNombre(partido)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="font-medium">Equipo A</p>
                      <p className="text-sm text-gray-600">
                        {getEquipoNombre(partido.equipo_a)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">VS</p>
                      <p className="text-sm text-gray-500">
                        {partido.fecha ? new Date(partido.fecha).toLocaleDateString() : 'Fecha por definir'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Equipo B</p>
                      <p className="text-sm text-gray-600">
                        {getEquipoNombre(partido.equipo_b)}
                      </p>
                    </div>
                  </div>
                  {partido.equipo_ganador && (
                    <div className="mt-2 text-center">
                      <Badge variant="default" className="flex items-center gap-1 mx-auto w-fit">
                        <Award className="h-3 w-3" />
                        Ganador: {getEquipoNombre(partido.equipo_ganador)}
                        <span className="ml-1">(+{partido.puntos_por_jugador} pts)</span>
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(partido)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(partido)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPartidos.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No se encontraron partidos</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de creación/edición */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPartido ? 'Editar Partido' : 'Crear Nuevo Partido'}
            </DialogTitle>
            <DialogDescription>
              {editingPartido ? 'Modifica los datos del partido' : 'Define un nuevo partido para la liga'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoría</label>
                <Select 
                  value={formData.liga_categoria_id} 
                  onValueChange={(value) => handleInputChange('liga_categoria_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(categoria => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.ligas?.nombre} - {categoria.categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ronda</label>
                <Select 
                  value={formData.ronda} 
                  onValueChange={(value) => handleInputChange('ronda', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ronda" />
                  </SelectTrigger>
                  <SelectContent>
                    {rondas.map(ronda => (
                      <SelectItem key={ronda} value={ronda}>
                        {ronda}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Equipo A</label>
                <Select 
                  value={formData.equipo_a_id} 
                  onValueChange={(value) => handleInputChange('equipo_a_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo A" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.liga_categoria_id && 
                      getInscripcionesByCategoria(formData.liga_categoria_id).map(inscripcion => (
                        <SelectItem key={inscripcion.id} value={inscripcion.id.toString()}>
                          {getEquipoNombre(inscripcion)}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Equipo B</label>
                <Select 
                  value={formData.equipo_b_id} 
                  onValueChange={(value) => handleInputChange('equipo_b_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo B" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.liga_categoria_id && 
                      getInscripcionesByCategoria(formData.liga_categoria_id)
                        .filter(ins => ins.id.toString() !== formData.equipo_a_id)
                        .map(inscripcion => (
                          <SelectItem key={inscripcion.id} value={inscripcion.id.toString()}>
                            {getEquipoNombre(inscripcion)}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Puntos por jugador</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.puntos_por_jugador}
                  onChange={(e) => handleInputChange('puntos_por_jugador', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha</label>
                <Input
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value) => handleInputChange('estado', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map(estado => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.estado === 'jugado' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Equipo Ganador</label>
                <Select 
                  value={formData.equipo_ganador_id} 
                  onValueChange={(value) => handleInputChange('equipo_ganador_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ganador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin ganador</SelectItem>
                    {formData.equipo_a_id && (
                      <SelectItem value={formData.equipo_a_id}>
                        {getEquipoNombre(inscripciones.find(ins => ins.id.toString() === formData.equipo_a_id))}
                      </SelectItem>
                    )}
                    {formData.equipo_b_id && (
                      <SelectItem value={formData.equipo_b_id}>
                        {getEquipoNombre(inscripciones.find(ins => ins.id.toString() === formData.equipo_b_id))}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingPartido ? 'Actualizar' : 'Crear'} Partido
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 