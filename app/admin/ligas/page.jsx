"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Trophy, Users, Calendar, Eye, Plus, Gamepad2, BarChart3, Settings, RefreshCw, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AdminLigasPage() {
  const { toast } = useToast()
  const [ligas, setLigas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Estados para edición de ligas
  const [editingLiga, setEditingLiga] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: '',
    fecha_inicio: '',
    estado: '',
    descripcion: '',
    formato: '',
    horarios: '',
    costo_inscripcion: '',
    costo_partido: '',
    cronograma: '',
    importante: ''
  })
  const [saving, setSaving] = useState(false)
  
  // Estados para doble confirmación de eliminación
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)
  const [ligaToDelete, setLigaToDelete] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Obtener ligas
      const { data: ligasData, error: ligasError } = await supabase
        .from('ligas')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            max_inscripciones,
            ligainscripciones (id, estado)
          )
        `)
        .order('fecha_inicio', { ascending: false })

      if (ligasError) throw ligasError
      setLigas(ligasData || [])

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

      // Obtener partidos con información relacionada
      const { data: partidosData, error: partidosError } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            categoria,
            ligas (
              nombre,
              fecha_inicio
            )
          ),
          equipo_a:ligainscripciones!liga_partidos_equipo_a_id_fkey (
            id,
            contacto_celular,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              nombre,
              apellido
            )
          ),
          equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
            id,
            contacto_celular,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              nombre,
              apellido
            )
          ),
          equipo_ganador:ligainscripciones!liga_partidos_equipo_ganador_id_fkey (
            id
          )
        `)
        .order('created_at', { ascending: false })

      if (partidosError) throw partidosError
      setPartidos(partidosData || [])
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

  const getEstadoBadge = (estado) => {
    const variants = {
      abierta: 'default',
      cerrada: 'secondary'
    }
    return <Badge variant={variants[estado] || 'secondary'}>{estado}</Badge>
  }

  const getInscripcionesCount = (liga) => {
    if (!liga.liga_categorias) return 0
    return liga.liga_categorias.reduce((total, cat) => {
      const inscripcionesAprobadas = cat.ligainscripciones?.filter(ins => ins.estado === 'aprobada')?.length || 0
      return total + inscripcionesAprobadas
    }, 0)
  }

  const getMaxInscripciones = (liga) => {
    if (!liga.liga_categorias) return 0
    return liga.liga_categorias.reduce((total, cat) => total + cat.max_inscripciones, 0)
  }

  // Función para formatear fechas correctamente sin problemas de zona horaria
  const formatDate = (dateString) => {
    if (!dateString) return ''
    // Para fechas en formato YYYY-MM-DD, crear la fecha directamente
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  // Funciones para editar ligas
  const openEditModal = (liga) => {
    setEditingLiga(liga)
    setEditForm({
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
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingLiga(null)
    setEditForm({
      nombre: '',
      fecha_inicio: '',
      estado: '',
      descripcion: '',
      formato: '',
      horarios: '',
      costo_inscripcion: '',
      costo_partido: '',
      cronograma: '',
      importante: ''
    })
  }

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveLiga = async () => {
    try {
      setSaving(true)
      
      const ligaData = {
        nombre: editForm.nombre,
        fecha_inicio: editForm.fecha_inicio,
        estado: editForm.estado,
        descripcion: editForm.descripcion,
        formato: editForm.formato,
        horarios: editForm.horarios,
        costo_inscripcion: editForm.costo_inscripcion ? parseFloat(editForm.costo_inscripcion) : null,
        costo_partido: editForm.costo_partido ? parseFloat(editForm.costo_partido) : null,
        cronograma: editForm.cronograma,
        importante: editForm.importante
      }

      let error
      if (editingLiga) {
        // Actualizar liga existente
        const { error: updateError } = await supabase
          .from('ligas')
          .update(ligaData)
          .eq('id', editingLiga.id)
        error = updateError
      } else {
        // Crear nueva liga
        const { error: insertError } = await supabase
          .from('ligas')
          .insert(ligaData)
        error = insertError
      }

      if (error) throw error

      toast({
        title: "Éxito",
        description: editingLiga ? "Liga actualizada correctamente" : "Liga creada correctamente",
      })

      closeEditModal()
      fetchData() // Recargar datos
    } catch (error) {
      console.error('Error saving liga:', error)
      toast({
        title: "Error",
        description: editingLiga ? "No se pudo actualizar la liga" : "No se pudo crear la liga",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteLiga = (liga) => {
    setLigaToDelete(liga)
    setDeleteConfirmModal(true)
  }

  const cancelDelete = () => {
    setDeleteConfirmModal(false)
    setLigaToDelete(null)
  }

  const deleteLiga = async () => {
    if (!ligaToDelete) return

    try {
      const { error } = await supabase
        .from('ligas')
        .delete()
        .eq('id', ligaToDelete.id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Liga eliminada correctamente",
      })

      setDeleteConfirmModal(false)
      setLigaToDelete(null)
      fetchData() // Recargar datos
    } catch (error) {
      console.error('Error deleting liga:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la liga",
        variant: "destructive"
      })
    }
  }

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
      <div className="container mx-auto px-2 sm:px-4">
        {/* Header */}
                  <div className="pt-4 sm:pt-8 pb-4 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Gestión de Ligas</h1>
              <p className="text-sm sm:text-base text-gray-400">Administra ligas, categorías y partidos</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchData} 
                disabled={refreshing} 
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm sm:text-base"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                onClick={() => {
                  setEditForm({
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
                  setEditingLiga(null)
                  setIsEditModalOpen(true)
                }}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Nueva Liga
              </Button>
            </div>
          </div>

          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-[#E2FF1B]" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{ligas.length}</p>
                    <p className="text-xs sm:text-sm text-gray-400">Ligas Activas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{partidos.length}</p>
                    <p className="text-xs sm:text-sm text-gray-400">Partidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-orange-500/30 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {ligas.reduce((total, liga) => {
                        return total + liga.liga_categorias?.reduce((catTotal, cat) => {
                          return catTotal + (cat.ligainscripciones?.filter(ins => ins.estado === 'aprobada')?.length || 0)
                        }, 0) || 0
                      }, 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">Inscripciones Aprobadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {partidos.filter(p => p.estado === 'jugado').length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">Partidos Jugados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enlaces rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Link href="/admin/ligas/categorias">
              <Card className="bg-white/5 border-white/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">Categorías</p>
                      <p className="text-xs sm:text-sm text-gray-400">Gestionar categorías</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/ligas/partidos">
              <Card className="bg-white/5 border-white/10 hover:border-green-500/30 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">Partidos</p>
                      <p className="text-xs sm:text-sm text-gray-400">Crear y gestionar partidos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/ligas/partidos">
              <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">Partidos</p>
                      <p className="text-xs sm:text-sm text-gray-400">Ver partidos de torneos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/inscripciones-ligas">
              <Card className="bg-white/5 border-white/10 hover:border-orange-500/30 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">Inscripciones</p>
                      <p className="text-xs sm:text-sm text-gray-400">Revisar inscripciones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Lista de ligas */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-lg sm:text-xl">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                Ligas Activas
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm sm:text-base">
                Gestiona las ligas y sus configuraciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {ligas.map(liga => (
                  <div key={liga.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg hover:border-[#E2FF1B]/30 transition-all duration-200">
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-semibold text-base sm:text-lg text-white">{liga.nombre}</h3>
                        {getEstadoBadge(liga.estado)}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formatDate(liga.fecha_inicio)}
                        </span>
                        <span>
                          {liga.liga_categorias?.length || 0} categorías
                        </span>
                        {liga.costo_inscripcion && (
                          <span className="text-green-400">
                            ${liga.costo_inscripcion}
                          </span>
                        )}
                      </div>
                      
                      {/* Inscripciones por categoría */}
                      {liga.liga_categorias && liga.liga_categorias.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Inscripciones por categoría:</p>
                          <div className="flex flex-wrap gap-2">
                            {liga.liga_categorias.map(categoria => {
                              const inscripcionesAprobadas = categoria.ligainscripciones?.filter(ins => ins.estado === 'aprobada')?.length || 0
                              return (
                                <span key={categoria.id} className="text-xs bg-white/5 px-2 py-1 rounded border border-white/10">
                                  <span className="text-[#E2FF1B] font-medium">{categoria.categoria}:</span> <span className="text-white">{inscripcionesAprobadas}/{categoria.max_inscripciones}</span>
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-white/20 text-white hover:bg-white/10 hover:border-[#E2FF1B]/30 text-xs sm:text-sm"
                        onClick={() => openEditModal(liga)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Editar
                      </Button>
                      <Link href={`/admin/ligas/categorias`}>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 hover:border-[#E2FF1B]/30 text-xs sm:text-sm">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Ver Categorías
                        </Button>
                      </Link>
                      <Link href={`/admin/ligas/partidos`}>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 hover:border-[#E2FF1B]/30 text-xs sm:text-sm">
                          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Partidos
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 text-xs sm:text-sm"
                        onClick={() => confirmDeleteLiga(liga)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {ligas.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm sm:text-base">No hay ligas activas</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Partidos recientes */}
          {partidos.length > 0 && (
            <Card className="mt-6 sm:mt-8 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-lg sm:text-xl">
                  <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                  Partidos Recientes
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm sm:text-base">
                  Últimos partidos creados o actualizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {partidos.slice(0, 5).map(partido => (
                    <div key={partido.id} className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg hover:border-[#E2FF1B]/30 transition-all duration-200">
                      {/* Header del partido */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Badge variant={partido.estado === 'jugado' ? 'default' : 'secondary'} className="text-xs">
                            {partido.estado}
                          </Badge>
                          <span className="text-[#E2FF1B] font-medium text-xs sm:text-sm">
                            {partido.ronda}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(partido.created_at).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Información de liga y categoría */}
                      <div className="mb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <span className="text-white font-medium">
                            {partido.liga_categorias?.ligas?.nombre || 'Liga N/A'}
                          </span>
                          <span className="text-gray-400 hidden sm:inline">•</span>
                          <span className="text-[#E2FF1B] font-medium">
                            {partido.liga_categorias?.categoria || 'Categoría N/A'}
                          </span>
                          {partido.fecha && (
                            <>
                              <span className="text-gray-400 hidden sm:inline">•</span>
                              <span className="text-gray-400">
                                {new Date(partido.fecha).toLocaleDateString('es-AR')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Equipos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                        <div className="bg-white/5 rounded p-2 sm:p-3">
                          <p className="text-xs text-gray-400 mb-1">Equipo A</p>
                          <div className="text-xs sm:text-sm text-white">
                            <p>
                              {partido.equipo_a?.titular_1?.nombre} {partido.equipo_a?.titular_1?.apellido} & 
                              {partido.equipo_a?.titular_2?.nombre} {partido.equipo_a?.titular_2?.apellido}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Tel: {partido.equipo_a?.contacto_celular || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded p-2 sm:p-3">
                          <p className="text-xs text-gray-400 mb-1">Equipo B</p>
                          <div className="text-xs sm:text-sm text-white">
                            <p>
                              {partido.equipo_b?.titular_1?.nombre} {partido.equipo_b?.titular_1?.apellido} & 
                              {partido.equipo_b?.titular_2?.nombre} {partido.equipo_b?.titular_2?.apellido}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Tel: {partido.equipo_b?.contacto_celular || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400 gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          {partido.puntos_por_jugador && (
                            <span>Puntos: {partido.puntos_por_jugador}</span>
                          )}
                          {partido.estado === 'jugado' && partido.equipo_ganador_id && partido.equipo_ganador && (
                            <span className="text-green-400 font-medium">
                              Ganador: {partido.equipo_ganador.id === partido.equipo_a?.id ? 'Equipo A' : 'Equipo B'}
                            </span>
                          )}
                        </div>
                        <span>ID: {partido.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link href="/admin/ligas/partidos">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-[#E2FF1B]/30 text-sm sm:text-base">
                      Ver Todos los Partidos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingLiga ? 'Editar Liga' : 'Crear Nueva Liga'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingLiga ? 'Modifica los datos de la liga seleccionada' : 'Completa los datos para crear una nueva liga'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Primera fila: Nombre y Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre" className="text-white">Nombre de la Liga</Label>
                <Input
                  id="nombre"
                  value={editForm.nombre}
                  onChange={(e) => handleEditFormChange('nombre', e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Nombre de la liga"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="estado" className="text-white">Estado</Label>
                <Select value={editForm.estado} onValueChange={(value) => handleEditFormChange('estado', value)}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/20">
                    <SelectItem value="abierta" className="text-white">Abierta</SelectItem>
                    <SelectItem value="cerrada" className="text-white">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Segunda fila: Fecha de inicio y Costos */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha_inicio" className="text-white">Fecha de Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={editForm.fecha_inicio}
                  onChange={(e) => handleEditFormChange('fecha_inicio', e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="costo_inscripcion" className="text-white">Costo de Inscripción</Label>
                <Input
                  id="costo_inscripcion"
                  type="number"
                  value={editForm.costo_inscripcion}
                  onChange={(e) => handleEditFormChange('costo_inscripcion', e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="0"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="costo_partido" className="text-white">Costo por Partido</Label>
                <Input
                  id="costo_partido"
                  type="number"
                  value={editForm.costo_partido}
                  onChange={(e) => handleEditFormChange('costo_partido', e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="0"
                />
              </div>
            </div>
            
            {/* Tercera fila: Descripción y Formato */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="descripcion" className="text-white">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={editForm.descripcion}
                  onChange={(e) => handleEditFormChange('descripcion', e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Descripción de la liga"
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="formato" className="text-white">Formato</Label>
                <Textarea
                  id="formato"
                  value={editForm.formato}
                  onChange={(e) => handleEditFormChange('formato', e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Formato de la liga"
                  rows={3}
                />
              </div>
            </div>
            
            {/* Cuarta fila: Horarios y Cronograma */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="horarios" className="text-white">Horarios</Label>
                <Textarea
                  id="horarios"
                  value={editForm.horarios}
                  onChange={(e) => handleEditFormChange('horarios', e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Horarios de los partidos"
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="cronograma" className="text-white">Cronograma</Label>
                <Textarea
                  id="cronograma"
                  value={editForm.cronograma}
                  onChange={(e) => handleEditFormChange('cronograma', e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Cronograma de la liga"
                  rows={3}
                />
              </div>
            </div>
            
            {/* Quinta fila: Información Importante (ancho completo) */}
            <div className="grid gap-2">
              <Label htmlFor="importante" className="text-white">Información Importante</Label>
              <Textarea
                id="importante"
                value={editForm.importante}
                onChange={(e) => handleEditFormChange('importante', e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Información importante para los participantes"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal} className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </Button>
                            <Button 
                  onClick={saveLiga} 
                  disabled={saving}
                  className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                >
                  {saving ? 'Guardando...' : (editingLiga ? 'Guardar Cambios' : 'Crear Liga')}
                </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={deleteConfirmModal} onOpenChange={setDeleteConfirmModal}>
        <DialogContent className="bg-gray-900 border-red-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Esta acción no se puede deshacer
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <p className="text-white font-medium mb-2">¿Estás seguro de que quieres eliminar esta liga?</p>
              {ligaToDelete && (
                <div className="text-gray-300">
                  <p><strong>Nombre:</strong> {ligaToDelete.nombre}</p>
                  <p><strong>Fecha de inicio:</strong> {formatDate(ligaToDelete.fecha_inicio)}</p>
                  <p><strong>Estado:</strong> {ligaToDelete.estado}</p>
                  <p><strong>Categorías:</strong> {ligaToDelete.liga_categorias?.length || 0}</p>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-400 font-medium mb-2">⚠️ Advertencia</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Se eliminarán todas las categorías asociadas</li>
                <li>• Se eliminarán todas las inscripciones</li>
                <li>• Se eliminarán todos los partidos</li>
                <li>• Esta acción es irreversible</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete} className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button 
              onClick={deleteLiga} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 