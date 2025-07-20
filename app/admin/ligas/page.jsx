'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import RichTextEditor from '@/components/ui/rich-text-editor'
import HtmlContent from '@/components/ui/html-content'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AdminLigasPage() {
  const { toast } = useToast()
  const [ligas, setLigas] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingLiga, setEditingLiga] = useState(null)
  const [viewingLiga, setViewingLiga] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio: '',
    estado: 'abierta',
    descripcion: '',
    formato: '',
    horarios: '',
    costo_inscripcion: '',
    costo_partido: '',
    cronograma: '',
    importante: ''
  })
  const [categorias, setCategorias] = useState([])
  const [categoriasDisponibles] = useState(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'])

  useEffect(() => {
    fetchLigas()
  }, [])

  const fetchLigas = async () => {
    try {
      setRefreshing(true)
      const { data, error } = await supabase
        .from('ligas')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            max_inscripciones
          )
        `)
        .order('fecha_inicio', { ascending: false })

      if (error) throw error
      setLigas(data || [])
    } catch (error) {
      console.error('Error fetching ligas:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las ligas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      fecha_inicio: '',
      estado: 'abierta',
      descripcion: '',
      formato: '',
      horarios: '',
      costo_inscripcion: '',
      costo_partido: '',
      cronograma: '',
      importante: ''
    })
    setCategorias([])
    setEditingLiga(null)
    setShowCreateForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Form submitted - this should only happen when clicking the submit button')
    
    // Validar que haya al menos una categoría
    if (categorias.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos una categoría a la liga",
        variant: "destructive"
      })
      return
    }
    
    try {
      const ligaData = {
        ...formData,
        costo_inscripcion: formData.costo_inscripcion ? parseInt(formData.costo_inscripcion) : null,
        costo_partido: formData.costo_partido ? parseInt(formData.costo_partido) : null
      }

      if (editingLiga) {
        // Actualizar liga existente
        const { error } = await supabase
          .from('ligas')
          .update(ligaData)
          .eq('id', editingLiga.id)

        if (error) throw error

        // Obtener categorías existentes con sus inscripciones
        const { data: categoriasExistentes, error: fetchError } = await supabase
          .from('liga_categorias')
          .select(`
            id,
            categoria,
            max_inscripciones,
            ligainscripciones (id)
          `)
          .eq('liga_id', editingLiga.id)

        if (fetchError) throw fetchError

        // Procesar cada categoría nueva
        for (const nuevaCategoria of categorias) {
          const categoriaExistente = categoriasExistentes?.find(
            cat => cat.categoria === nuevaCategoria.categoria
          )

          if (categoriaExistente) {
            // Actualizar categoría existente solo si no tiene inscripciones o si el nuevo max es mayor
            const inscripcionesActuales = categoriaExistente.ligainscripciones?.length || 0
            
            if (nuevaCategoria.max_inscripciones >= inscripcionesActuales) {
              const { error: updateError } = await supabase
                .from('liga_categorias')
                .update({ max_inscripciones: nuevaCategoria.max_inscripciones })
                .eq('id', categoriaExistente.id)

              if (updateError) throw updateError
            } else {
              toast({
                title: "Advertencia",
                description: `No se puede reducir el cupo de ${nuevaCategoria.categoria} porque ya tiene ${inscripcionesActuales} inscripciones`,
                variant: "destructive"
              })
              return
            }
          } else {
            // Insertar nueva categoría
            const { error: insertError } = await supabase
              .from('liga_categorias')
              .insert({
                liga_id: editingLiga.id,
                categoria: nuevaCategoria.categoria,
                max_inscripciones: nuevaCategoria.max_inscripciones
              })

            if (insertError) throw insertError
          }
        }

        // Eliminar categorías que ya no están en la lista (solo si no tienen inscripciones)
        const categoriasAEliminar = categoriasExistentes?.filter(
          cat => !categorias.some(nuevaCat => nuevaCat.categoria === cat.categoria)
        ) || []

        for (const categoriaAEliminar of categoriasAEliminar) {
          const inscripcionesActuales = categoriaAEliminar.ligainscripciones?.length || 0
          
          if (inscripcionesActuales === 0) {
            const { error: deleteError } = await supabase
              .from('liga_categorias')
              .delete()
              .eq('id', categoriaAEliminar.id)

            if (deleteError) throw deleteError
          } else {
            toast({
              title: "Advertencia",
              description: `No se puede eliminar la categoría ${categoriaAEliminar.categoria} porque tiene ${inscripcionesActuales} inscripciones`,
              variant: "destructive"
            })
          }
        }

        toast({
          title: "Liga actualizada",
          description: `La liga se actualizó correctamente con ${categorias.length} categorías`,
          variant: "default"
        })
      } else {
        // Crear nueva liga con categorías
        const { data: ligaCreada, error: ligaError } = await supabase
          .from('ligas')
          .insert([ligaData])
          .select()

        if (ligaError) throw ligaError

        // Crear categorías para la nueva liga
        const categoriasData = categorias.map(cat => ({
          liga_id: ligaCreada[0].id,
          categoria: cat.categoria,
          max_inscripciones: cat.max_inscripciones
        }))

        const { error: categoriasError } = await supabase
          .from('liga_categorias')
          .insert(categoriasData)

        if (categoriasError) throw categoriasError

        toast({
          title: "Liga creada",
          description: `La liga se creó correctamente con ${categorias.length} categorías`,
          variant: "default"
        })
      }

      resetForm()
      fetchLigas()
    } catch (error) {
      console.error('Error saving liga:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la liga",
        variant: "destructive"
      })
    }
  }

  const handleEdit = async (liga) => {
    setEditingLiga(liga)
    setFormData({
      nombre: liga.nombre || '',
      fecha_inicio: liga.fecha_inicio || '',
      estado: liga.estado || 'abierta',
      descripcion: liga.descripcion || '',
      formato: liga.formato || '',
      horarios: liga.horarios || '',
      costo_inscripcion: liga.costo_inscripcion?.toString() || '',
      costo_partido: liga.costo_partido?.toString() || '',
      cronograma: liga.cronograma || '',
      importante: liga.importante || ''
    })
    
    // Cargar las categorías existentes de la liga
    try {
      const { data: categoriasExistentes, error } = await supabase
        .from('liga_categorias')
        .select('categoria, max_inscripciones')
        .eq('liga_id', liga.id)
        .order('categoria', { ascending: true })

      if (error) throw error

      setCategorias(categoriasExistentes || [])
    } catch (error) {
      console.error('Error fetching categorias:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías de la liga",
        variant: "destructive"
      })
      setCategorias([])
    }
    
    setShowCreateForm(true)
  }

  const handleCategoriaChange = (index, field, value) => {
    const nuevasCategorias = [...categorias]
    nuevasCategorias[index] = {
      ...nuevasCategorias[index],
      [field]: field === 'max_inscripciones' ? parseInt(value) || 16 : value
    }
    setCategorias(nuevasCategorias)
  }

  const agregarCategoria = () => {
    // Encontrar categorías disponibles (no usadas)
    const categoriasUsadas = categorias.map(cat => cat.categoria)
    const categoriasDisponibles = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'].filter(
      cat => !categoriasUsadas.includes(cat)
    )
    
    if (categoriasDisponibles.length === 0) {
      toast({
        title: "No hay más categorías disponibles",
        description: "Todas las categorías C1-C8 ya están agregadas",
        variant: "destructive"
      })
      return
    }
    
    setCategorias([
      ...categorias,
      {
        categoria: categoriasDisponibles[0],
        max_inscripciones: 16
      }
    ])
  }

  const eliminarCategoria = (index) => {
    const nuevasCategorias = categorias.filter((_, i) => i !== index)
    setCategorias(nuevasCategorias)
  }

  const handleDelete = async (ligaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta liga?')) return

    try {
      const { error } = await supabase
        .from('ligas')
        .delete()
        .eq('id', ligaId)

      if (error) throw error

      toast({
        title: "Liga eliminada",
        description: "La liga se eliminó correctamente",
        variant: "default"
      })

      fetchLigas()
    } catch (error) {
      console.error('Error deleting liga:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la liga",
        variant: "destructive"
      })
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'abierta': return 'bg-green-500/20 border-green-500/30 text-green-400'
      case 'cerrada': return 'bg-red-500/20 border-red-500/30 text-red-400'
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'abierta': return <CheckCircle className="w-4 h-4" />
      case 'cerrada': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getCategoriaColor = (categoria) => {
    const colors = {
      'C1': 'bg-red-500/20 border-red-500/30 text-red-400',
      'C2': 'bg-orange-500/20 border-orange-500/30 text-orange-400',
      'C3': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      'C4': 'bg-green-500/20 border-green-500/30 text-green-400',
      'C5': 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      'C6': 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      'C7': 'bg-pink-500/20 border-pink-500/30 text-pink-400',
      'C8': 'bg-gray-500/20 border-gray-500/30 text-gray-400'
    }
    return colors[categoria] || colors['C8']
  }

  const filteredLigas = ligas.filter(liga => {
    const matchesSearch = searchTerm === '' || 
      liga.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liga.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = filterEstado === 'all' || liga.estado === filterEstado
    return matchesSearch && matchesEstado
  })

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Gestión de Ligas</h1>
              <p className="text-gray-400">Crear y administrar ligas de pádel</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchLigas}
                disabled={refreshing}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {refreshing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Actualizar
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva liga
              </Button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Ligas</p>
                    <p className="text-2xl font-bold text-white">{ligas.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-[#E2FF1B]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-green-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Ligas Abiertas</p>
                    <p className="text-2xl font-bold text-green-400">
                      {ligas.filter(l => l.estado === 'abierta').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-red-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Ligas Cerradas</p>
                    <p className="text-2xl font-bold text-red-400">
                      {ligas.filter(l => l.estado === 'cerrada').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#E2FF1B]" />
                  <h3 className="text-lg font-semibold text-white">Filtros y Búsqueda</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 pl-10 h-12"
                  />
                </div>
                
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                      Todos los estados
                    </SelectItem>
                    <SelectItem value="abierta" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                      Abierta
                    </SelectItem>
                    <SelectItem value="cerrada" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                      Cerrada
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de Crear/Editar */}
        {showCreateForm && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white">
                {editingLiga ? 'Editar Liga' : 'Crear Nueva Liga'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Nombre de la Liga *</label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      placeholder="Ej: Liga de Verano 2024"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Fecha de Inicio *</label>
                    <Input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Estado</label>
                    <Select value={formData.estado} onValueChange={(value) => handleInputChange('estado', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        <SelectItem value="abierta" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                          Abierta
                        </SelectItem>
                        <SelectItem value="cerrada" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                          Cerrada
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Formato</label>
                    <Input
                      value={formData.formato}
                      onChange={(e) => handleInputChange('formato', e.target.value)}
                      placeholder="Ej: Eliminación simple, Round Robin"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Costo de Inscripción ($)</label>
                    <Input
                      type="number"
                      value={formData.costo_inscripcion}
                      onChange={(e) => handleInputChange('costo_inscripcion', e.target.value)}
                      placeholder="0"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Costo por Partido ($)</label>
                    <Input
                      type="number"
                      value={formData.costo_partido}
                      onChange={(e) => handleInputChange('costo_partido', e.target.value)}
                      placeholder="0"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Descripción</label>
                  <RichTextEditor
                    value={formData.descripcion}
                    onChange={(value) => handleInputChange('descripcion', value)}
                    placeholder="Descripción detallada de la liga..."
                    minHeight="150px"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Horarios</label>
                    <RichTextEditor
                      value={formData.horarios}
                      onChange={(value) => handleInputChange('horarios', value)}
                      placeholder="Horarios de juego..."
                      minHeight="150px"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Cronograma</label>
                    <RichTextEditor
                      value={formData.cronograma}
                      onChange={(value) => handleInputChange('cronograma', value)}
                      placeholder="Cronograma de partidos..."
                      minHeight="150px"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Información Importante</label>
                  <Textarea
                    value={formData.importante}
                    onChange={(e) => handleInputChange('importante', e.target.value)}
                    placeholder="Información importante para los participantes..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 min-h-[100px]"
                  />
                </div>

                {/* Sección de Categorías */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Categorías de la Liga</h3>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B]">
                        {categorias.length} categorías
                      </Badge>
                      <Button
                        type="button"
                        onClick={agregarCategoria}
                        variant="outline"
                        size="sm"
                        className="border-[#E2FF1B]/30 text-[#E2FF1B] hover:bg-[#E2FF1B]/10"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Categoría
                      </Button>
                    </div>
                  </div>
                  
                  {categorias.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-lg border border-dashed border-white/20">
                      <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No hay categorías agregadas</h3>
                      <p className="text-gray-400 mb-4">Agrega al menos una categoría para crear la liga</p>
                      <Button
                        type="button"
                        onClick={agregarCategoria}
                        className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Primera Categoría
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorias.map((categoria, index) => (
                        <Card key={`${categoria.categoria}-${index}`} className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge className={`${getCategoriaColor(categoria.categoria)} border`}>
                                <span className="font-medium">{categoria.categoria}</span>
                              </Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarCategoria(index)}
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <label className="text-xs text-gray-400">Categoría</label>
                                <Select 
                                  value={categoria.categoria} 
                                  onValueChange={(value) => handleCategoriaChange(index, 'categoria', value)}
                                >
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-900 border-white/20">
                                    {categoriasDisponibles.map((cat) => (
                                      <SelectItem 
                                        key={cat} 
                                        value={cat} 
                                        className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white"
                                        disabled={categorias.some((c, i) => i !== index && c.categoria === cat)}
                                      >
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-xs text-gray-400">Cupo máximo</label>
                                <Input
                                  type="number"
                                  value={categoria.max_inscripciones}
                                  onChange={(e) => handleCategoriaChange(index, 'max_inscripciones', e.target.value)}
                                  min="1"
                                  className="bg-white/10 border-white/20 text-white text-sm h-8"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-400 bg-white/5 p-3 rounded-lg">
                    <p><strong>Nota:</strong> Cada categoría debe tener un cupo máximo de inscripciones. Puedes agregar o eliminar categorías según necesites.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                    {editingLiga ? 'Actualizar' : 'Crear'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="border-white/20 text-white hover:bg-white/10">
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Ligas */}
        <div className="pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white">
              Ligas ({filteredLigas.length})
            </h2>
            <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] w-fit">
              {filteredLigas.length} ligas
            </Badge>
          </div>
          
          <div className="space-y-4">
            {filteredLigas.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No se encontraron ligas</h3>
                  <p className="text-gray-400">Crea tu primera liga para comenzar</p>
                </CardContent>
              </Card>
            ) : (
              filteredLigas.map((liga) => (
                <Card key={liga.id} className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header con gradiente */}
                    <div className="bg-gradient-to-r from-[#E2FF1B]/10 via-transparent to-transparent p-6 border-b border-white/10">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <Badge className={`${getEstadoColor(liga.estado)} border shadow-lg`}>
                              <div className="flex items-center gap-1">
                                {getEstadoIcon(liga.estado)}
                                <span className="font-medium capitalize">{liga.estado}</span>
                              </div>
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(liga.fecha_inicio).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[#E2FF1B] bg-[#E2FF1B]/10 px-3 py-1 rounded-full">
                              <Trophy className="w-4 h-4" />
                              <span>{liga.liga_categorias?.length || 0} categorías</span>
                            </div>
                          </div>
                          
                          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#E2FF1B] transition-colors duration-200">
                            {liga.nombre}
                          </h3>
                          
                          {liga.descripcion && (
                            <div className="text-gray-300 text-sm leading-relaxed">
                              <HtmlContent 
                                content={liga.descripcion} 
                                maxLength={150}
                                className="line-clamp-2"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 sm:flex-col">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingLiga(liga)}
                            className="border-white/20 text-white hover:bg-white/10 hover:border-[#E2FF1B]/30 transition-all duration-200"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(liga)}
                            className="border-white/20 text-white hover:bg-white/10 hover:border-[#E2FF1B]/30 transition-all duration-200"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(liga.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenido principal */}
                    <div className="p-6">
                      {/* Información de la liga */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {liga.formato && (
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-[#E2FF1B]" />
                              </div>
                              <span className="text-xs text-gray-400 uppercase tracking-wide">Formato</span>
                            </div>
                            <p className="text-white font-medium text-sm">{liga.formato}</p>
                          </div>
                        )}
                        
                        {liga.costo_inscripcion && (
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-green-500/30 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-green-400" />
                              </div>
                              <span className="text-xs text-gray-400 uppercase tracking-wide">Inscripción</span>
                            </div>
                            <p className="text-white font-bold text-lg">${liga.costo_inscripcion.toLocaleString()}</p>
                          </div>
                        )}
                        
                        {liga.costo_partido && (
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-blue-500/30 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-blue-400" />
                              </div>
                              <span className="text-xs text-gray-400 uppercase tracking-wide">Por Partido</span>
                            </div>
                            <p className="text-white font-bold text-lg">${liga.costo_partido.toLocaleString()}</p>
                          </div>
                        )}
                        
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/30 transition-all duration-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-xs text-gray-400 uppercase tracking-wide">Total Cupos</span>
                          </div>
                          <p className="text-white font-bold text-lg">
                            {liga.liga_categorias?.reduce((total, cat) => total + cat.max_inscripciones, 0) || 0}
                          </p>
                        </div>
                      </div>
                      
                      {/* Categorías */}
                      {liga.liga_categorias && liga.liga_categorias.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-[#E2FF1B] rounded-full"></div>
                            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Categorías Disponibles</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {liga.liga_categorias.map((cat) => (
                              <div key={cat.id} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-200 group/cat">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={`${getCategoriaColor(cat.categoria)} border text-xs font-medium`}>
                                    {cat.categoria}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Users className="w-3 h-3" />
                                    <span>{cat.max_inscripciones}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">Cupos disponibles</span>
                                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[#E2FF1B] rounded-full transition-all duration-300 group-hover/cat:w-full"
                                      style={{ width: '100%' }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal para ver detalles completos de la liga */}
      {viewingLiga && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{viewingLiga.nombre}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingLiga(null)}
                  className="text-white hover:bg-white/10"
                >
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className={`${getEstadoColor(viewingLiga.estado)} border`}>
                  <div className="flex items-center gap-1">
                    {getEstadoIcon(viewingLiga.estado)}
                    <span className="font-medium capitalize">{viewingLiga.estado}</span>
                  </div>
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                  <Calendar className="w-4 h-4" />
                  <span>Inicio: {new Date(viewingLiga.fecha_inicio).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#E2FF1B] bg-[#E2FF1B]/10 px-3 py-1 rounded-full">
                  <Trophy className="w-4 h-4" />
                  <span>{viewingLiga.liga_categorias?.length || 0} categorías</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Descripción */}
              {viewingLiga.descripcion && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#E2FF1B] rounded-full"></div>
                    Descripción
                  </h3>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <HtmlContent 
                      content={viewingLiga.descripcion} 
                      className="text-gray-300"
                    />
                  </div>
                </div>
              )}
              
              {/* Horarios */}
              {viewingLiga.horarios && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#E2FF1B] rounded-full"></div>
                    Horarios
                  </h3>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <HtmlContent 
                      content={viewingLiga.horarios} 
                      className="text-gray-300"
                    />
                  </div>
                </div>
              )}
              
              {/* Cronograma */}
              {viewingLiga.cronograma && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#E2FF1B] rounded-full"></div>
                    Cronograma
                  </h3>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <HtmlContent 
                      content={viewingLiga.cronograma} 
                      className="text-gray-300"
                    />
                  </div>
                </div>
              )}
              
              {/* Información Importante */}
              {viewingLiga.importante && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#E2FF1B] rounded-full"></div>
                    Información Importante
                  </h3>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <HtmlContent 
                      content={viewingLiga.importante} 
                      className="text-gray-300"
                    />
                  </div>
                </div>
              )}
              
              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingLiga.formato && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-2">Formato</h4>
                    <p className="text-gray-300">{viewingLiga.formato}</p>
                  </div>
                )}
                
                {viewingLiga.costo_inscripcion && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-2">Costo de Inscripción</h4>
                    <p className="text-[#E2FF1B] font-bold text-lg">${viewingLiga.costo_inscripcion.toLocaleString()}</p>
                  </div>
                )}
                
                {viewingLiga.costo_partido && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-2">Costo por Partido</h4>
                    <p className="text-[#E2FF1B] font-bold text-lg">${viewingLiga.costo_partido.toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {/* Categorías */}
              {viewingLiga.liga_categorias && viewingLiga.liga_categorias.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#E2FF1B] rounded-full"></div>
                    Categorías
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {viewingLiga.liga_categorias.map((cat) => (
                      <div key={cat.id} className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                        <Badge className={`${getCategoriaColor(cat.categoria)} border mb-2`}>
                          {cat.categoria}
                        </Badge>
                        <p className="text-white font-bold text-lg">{cat.max_inscripciones}</p>
                        <p className="text-gray-400 text-xs">cupos</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 