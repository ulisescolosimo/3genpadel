'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AdminLigasCategoriasPage() {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState([])
  const [ligas, setLigas] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLiga, setFilterLiga] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState(null)
  const [formData, setFormData] = useState({
    liga_id: '',
    categoria: '',
    max_inscripciones: 16
  })

  const categoriasDisponibles = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setRefreshing(true)
      await Promise.all([
        fetchCategorias(),
        fetchLigas()
      ])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('liga_categorias')
        .select(`
          *,
          ligas (
            id,
            nombre,
            fecha_inicio
          )
        `)
        .order('liga_id', { ascending: true })
        .order('categoria', { ascending: true })

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error('Error fetching categorias:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive"
      })
    }
  }

  const fetchLigas = async () => {
    try {
      const { data, error } = await supabase
        .from('ligas')
        .select('id, nombre, fecha_inicio')
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
      liga_id: '',
      categoria: '',
      max_inscripciones: 16
    })
    setEditingCategoria(null)
    setShowCreateForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const categoriaData = {
        ...formData,
        max_inscripciones: parseInt(formData.max_inscripciones)
      }

      if (editingCategoria) {
        // Actualizar categoría existente
        const { error } = await supabase
          .from('liga_categorias')
          .update(categoriaData)
          .eq('id', editingCategoria.id)

        if (error) throw error

        toast({
          title: "Categoría actualizada",
          description: "La categoría se actualizó correctamente",
          variant: "default"
        })
      } else {
        // Crear nueva categoría
        const { error } = await supabase
          .from('liga_categorias')
          .insert([categoriaData])

        if (error) throw error

        toast({
          title: "Categoría creada",
          description: "La categoría se creó correctamente",
          variant: "default"
        })
      }

      resetForm()
      fetchCategorias()
    } catch (error) {
      console.error('Error saving categoria:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la categoría",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (categoria) => {
    setEditingCategoria(categoria)
    setFormData({
      liga_id: categoria.liga_id.toString(),
      categoria: categoria.categoria,
      max_inscripciones: categoria.max_inscripciones
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (categoriaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return

    try {
      const { error } = await supabase
        .from('liga_categorias')
        .delete()
        .eq('id', categoriaId)

      if (error) throw error

      toast({
        title: "Categoría eliminada",
        description: "La categoría se eliminó correctamente",
        variant: "default"
      })

      fetchCategorias()
    } catch (error) {
      console.error('Error deleting categoria:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive"
      })
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

  const filteredCategorias = categorias.filter(categoria => {
    const matchesSearch = searchTerm === '' || 
      categoria.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoria.ligas?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLiga = filterLiga === 'all' || categoria.liga_id.toString() === filterLiga
    return matchesSearch && matchesLiga
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
              <h1 className="text-3xl font-bold text-white mb-2">Categorías de Ligas</h1>
              <p className="text-gray-400">Gestionar categorías y cupos de las ligas</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchAllData}
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
                Nueva Categoría
              </Button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Categorías</p>
                    <p className="text-2xl font-bold text-white">{categorias.length}</p>
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
                    <p className="text-sm text-gray-400">Ligas Activas</p>
                    <p className="text-2xl font-bold text-green-400">
                      {new Set(categorias.map(c => c.liga_id)).size}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-blue-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Cupos Totales</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {categorias.reduce((sum, cat) => sum + cat.max_inscripciones, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
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
                    placeholder="Buscar por categoría o liga..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 pl-10 h-12"
                  />
                </div>
                
                <Select value={filterLiga} onValueChange={setFilterLiga}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
                    <SelectValue placeholder="Todas las ligas" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                      Todas las ligas
                    </SelectItem>
                    {ligas.map((liga) => (
                      <SelectItem key={liga.id} value={liga.id.toString()} className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                        {liga.nombre}
                      </SelectItem>
                    ))}
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
                {editingCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Liga *</label>
                    <Select value={formData.liga_id} onValueChange={(value) => handleInputChange('liga_id', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Seleccionar liga" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {ligas.map((liga) => (
                          <SelectItem key={liga.id} value={liga.id.toString()} className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                            {liga.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Categoría *</label>
                    <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {categoriasDisponibles.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Cupo Máximo *</label>
                    <Input
                      type="number"
                      value={formData.max_inscripciones}
                      onChange={(e) => handleInputChange('max_inscripciones', e.target.value)}
                      placeholder="16"
                      min="1"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                    {editingCategoria ? 'Actualizar Categoría' : 'Crear Categoría'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="border-white/20 text-white hover:bg-white/10">
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Categorías */}
        <div className="pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white">
              Categorías ({filteredCategorias.length})
            </h2>
            <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] w-fit">
              {filteredCategorias.length} categorías
            </Badge>
          </div>
          
          <div className="space-y-4">
            {filteredCategorias.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No se encontraron categorías</h3>
                  <p className="text-gray-400">Crea tu primera categoría para comenzar</p>
                </CardContent>
              </Card>
            ) : (
              filteredCategorias.map((categoria) => (
                <Card key={categoria.id} className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Badge className={`${getCategoriaColor(categoria.categoria)} border`}>
                            <span className="font-medium">{categoria.categoria}</span>
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {categoria.ligas?.nombre}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#E2FF1B]" />
                            <span className="text-gray-400">Cupo máximo:</span>
                            <span className="text-white font-semibold">{categoria.max_inscripciones} equipos</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-400">Liga:</span>
                            <span className="text-white">{categoria.ligas?.nombre}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-400">ID:</span>
                            <span className="text-white font-mono">{categoria.id}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 lg:flex-col">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(categoria)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(categoria.id)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 