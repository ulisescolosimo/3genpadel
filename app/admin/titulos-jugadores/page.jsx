'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminHeader from '@/components/AdminHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/hooks/use-toast'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Users, 
  Trophy, 
  Link, 
  Unlink,
  Filter,
  Download,
  Upload,
  FileText,
  AlertTriangle,
  Crown
} from 'lucide-react'

export default function TitulosJugadores() {
  const [jugadores, setJugadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')
  const [showLinkedOnly, setShowLinkedOnly] = useState(false)
  const [showUnlinkedOnly, setShowUnlinkedOnly] = useState(false)
  
  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJugador, setEditingJugador] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    titulos: 0,
    categoria: ''
  })

  // Estados para vincular usuarios
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedJugador, setSelectedJugador] = useState(null)
  const [searchUsuario, setSearchUsuario] = useState('')

  // Estados para importación masiva
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState('')
  const [importCategoria, setImportCategoria] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchJugadores()
  }, [])

  const fetchJugadores = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('titulos_jugadores')
        .select(`
          *,
          usuario:usuarios(id, nombre, apellido, email)
        `)
        .order('titulos', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setJugadores(data || [])
    } catch (error) {
      console.error('Error fetching jugadores:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los jugadores",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsuariosDisponibles = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email')
        .neq('rol', 'admin')
        .order('nombre')

      if (error) throw error

      setUsuariosDisponibles(data || [])
    } catch (error) {
      console.error('Error fetching usuarios:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const capitalizeWords = (str) => {
      return str.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    }

    try {
      const jugadorData = {
        nombre: capitalizeWords(formData.nombre),
        apellido: capitalizeWords(formData.apellido),
        titulos: formData.titulos,
        categoria: formData.categoria
      }

      if (editingJugador) {
        const { error } = await supabase
          .from('titulos_jugadores')
          .update(jugadorData)
          .eq('id', editingJugador.id)

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Jugador actualizado correctamente"
        })
      } else {
        const { error } = await supabase
          .from('titulos_jugadores')
          .insert(jugadorData)

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Jugador creado correctamente"
        })
      }

      setIsModalOpen(false)
      setEditingJugador(null)
      setFormData({ nombre: '', apellido: '', titulos: 0, categoria: '' })
      fetchJugadores()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el jugador",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (jugador) => {
    setEditingJugador(jugador)
    setFormData({
      nombre: jugador.nombre,
      apellido: jugador.apellido,
      titulos: jugador.titulos,
      categoria: jugador.categoria
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este jugador?')) return

    try {
      const { error } = await supabase
        .from('titulos_jugadores')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Jugador eliminado correctamente"
      })

      fetchJugadores()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el jugador",
        variant: "destructive"
      })
    }
  }

  const handleLinkUser = async (jugadorId, usuarioId) => {
    try {
      const { error } = await supabase
        .from('titulos_jugadores')
        .update({ usuario_id: usuarioId })
        .eq('id', jugadorId)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Jugador vinculado correctamente"
      })

      setShowLinkModal(false)
      setSelectedJugador(null)
      fetchJugadores()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudo vincular el jugador",
        variant: "destructive"
      })
    }
  }

  const handleUnlinkUser = async (jugadorId) => {
    try {
      const { error } = await supabase
        .from('titulos_jugadores')
        .update({ usuario_id: null })
        .eq('id', jugadorId)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Vínculo removido correctamente"
      })

      fetchJugadores()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudo remover el vínculo",
        variant: "destructive"
      })
    }
  }

  const openLinkModal = (jugador) => {
    setSelectedJugador(jugador)
    setSearchUsuario('')
    fetchUsuariosDisponibles()
    setShowLinkModal(true)
  }

  const handleImportData = async () => {
    if (!importCategoria || !importData.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      })
      return
    }

    setImporting(true)

    try {
      const lines = importData.trim().split('\n')
      const jugadoresData = []

      for (const line of lines) {
        const parts = line.trim().split(' ')
        if (parts.length >= 2) {
          const titulos = parseInt(parts[parts.length - 1])
          
          if (!isNaN(titulos)) {
            // El apellido es todo excepto el último elemento (que son los títulos)
            const apellido = parts.slice(0, -1).join(' ')
            
            jugadoresData.push({
              nombre: '', // Dejamos nombre vacío, solo apellido
              apellido: apellido,
              titulos: titulos,
              categoria: importCategoria
            })
          }
        }
      }

      if (jugadoresData.length === 0) {
        toast({
          title: "Error",
          description: "No se encontraron datos válidos para importar",
          variant: "destructive"
        })
        return
      }

      // Verificar si ya existen registros para esta categoría
      const { data: existingData } = await supabase
        .from('titulos_jugadores')
        .select('id')
        .eq('categoria', importCategoria)

      if (existingData && existingData.length > 0) {
        if (!confirm(`Ya existen registros para la categoría ${importCategoria}. ¿Deseas eliminar los existentes e importar los nuevos?`)) {
          return
        }

        // Eliminar registros existentes de la categoría
        await supabase
          .from('titulos_jugadores')
          .delete()
          .eq('categoria', importCategoria)
      }

      const { error } = await supabase
        .from('titulos_jugadores')
        .insert(jugadoresData)

      if (error) throw error

      toast({
        title: "Éxito",
        description: `${jugadoresData.length} jugadores importados correctamente`
      })

      setShowImportModal(false)
      setImportData('')
      setImportCategoria('')
      fetchJugadores()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron importar los datos",
        variant: "destructive"
      })
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteCategoria = async (categoria) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar todos los jugadores de la categoría ${categoria}?`)) return

    try {
      const { error } = await supabase
        .from('titulos_jugadores')
        .delete()
        .eq('categoria', categoria)

      if (error) throw error

      toast({
        title: "Éxito",
        description: `Todos los jugadores de ${categoria} han sido eliminados`
      })

      fetchJugadores()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron eliminar los jugadores",
        variant: "destructive"
      })
    }
  }

  const handleUpdateLinkedNames = async () => {
    try {
      setLoading(true)

      // Obtener todos los jugadores con usuario_id
      const { data: linkedJugadores, error: fetchError } = await supabase
        .from('titulos_jugadores')
        .select(`
          id,
          usuario_id,
          usuario:usuarios(nombre, apellido)
        `)
        .not('usuario_id', 'is', null)

      if (fetchError) throw fetchError

      // Actualizar nombres de jugadores vinculados
      for (const jugador of linkedJugadores) {
        if (jugador.usuario) {
          const { error: updateError } = await supabase
            .from('titulos_jugadores')
            .update({
              nombre: jugador.usuario.nombre,
              apellido: jugador.usuario.apellido
            })
            .eq('id', jugador.id)

          if (updateError) {
            console.error('Error updating jugador:', updateError)
          }
        }
      }

      toast({
        title: "Éxito",
        description: "Nombres actualizados correctamente"
      })

      fetchJugadores()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los nombres",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnificarDuplicados = async () => {
    try {
      setLoading(true)

      // Obtener todos los jugadores
      const { data: allJugadores, error: fetchError } = await supabase
        .from('titulos_jugadores')
        .select('*')
        .order('nombre')

      if (fetchError) throw fetchError

      // Agrupar por nombre y apellido
      const grupos = {}
      allJugadores.forEach(jugador => {
        const key = `${jugador.nombre?.toLowerCase().trim()}-${jugador.apellido?.toLowerCase().trim()}`
        if (!grupos[key]) {
          grupos[key] = []
        }
        grupos[key].push(jugador)
      })

      let unificados = 0
      let eliminados = 0

      // Procesar cada grupo
      for (const [key, jugadores] of Object.entries(grupos)) {
        if (jugadores.length > 1) {
          // Ordenar por usuario_id (los vinculados primero)
          jugadores.sort((a, b) => {
            if (a.usuario_id && !b.usuario_id) return -1
            if (!a.usuario_id && b.usuario_id) return 1
            return 0
          })

          const jugadorPrincipal = jugadores[0]
          const jugadoresSecundarios = jugadores.slice(1)

          // Sumar títulos
          const totalTitulos = jugadores.reduce((sum, j) => sum + (j.titulos || 0), 0)
          
          // Recopilar todas las categorías únicas
          const categoriasUnicas = [...new Set(jugadores.map(j => j.categoria).filter(Boolean))]
          const categoriasTexto = categoriasUnicas.join(', ')
          
          // Actualizar el jugador principal
          const { error: updateError } = await supabase
            .from('titulos_jugadores')
            .update({
              titulos: totalTitulos,
              categoria: categoriasTexto // Guardar todas las categorías
            })
            .eq('id', jugadorPrincipal.id)

          if (updateError) {
            console.error('Error updating jugador principal:', updateError)
            continue
          }

          // Eliminar jugadores duplicados
          for (const jugador of jugadoresSecundarios) {
            const { error: deleteError } = await supabase
              .from('titulos_jugadores')
              .delete()
              .eq('id', jugador.id)

            if (deleteError) {
              console.error('Error deleting jugador:', deleteError)
            } else {
              eliminados++
            }
          }

          unificados++
        }
      }

      toast({
        title: "Éxito",
        description: `${unificados} grupos unificados, ${eliminados} registros eliminados`
      })

      fetchJugadores()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron unificar los registros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRevisarTitulos = async () => {
    try {
      setLoading(true)

      // Obtener todos los jugadores
      const { data: allJugadores, error: fetchError } = await supabase
        .from('titulos_jugadores')
        .select('*')
        .order('nombre')

      if (fetchError) throw fetchError

      let actualizados = 0

      // Revisar cada jugador individualmente
      for (const jugador of allJugadores) {
        // Buscar registros duplicados para este jugador
        const { data: duplicados, error: searchError } = await supabase
          .from('titulos_jugadores')
          .select('*')
          .eq('nombre', jugador.nombre)
          .eq('apellido', jugador.apellido)

        if (searchError) {
          console.error('Error searching duplicates:', searchError)
          continue
        }

        if (duplicados && duplicados.length > 1) {
          // Ordenar por usuario_id (los vinculados primero)
          duplicados.sort((a, b) => {
            if (a.usuario_id && !b.usuario_id) return -1
            if (!a.usuario_id && b.usuario_id) return 1
            return 0
          })

          const jugadorPrincipal = duplicados[0]
          const jugadoresSecundarios = duplicados.slice(1)

          // Sumar títulos
          const totalTitulos = duplicados.reduce((sum, j) => sum + (j.titulos || 0), 0)
          
          // Recopilar todas las categorías únicas
          const categoriasUnicas = [...new Set(duplicados.map(j => j.categoria).filter(Boolean))]
          const categoriasTexto = categoriasUnicas.join(', ')
          
          // Actualizar el jugador principal
          const { error: updateError } = await supabase
            .from('titulos_jugadores')
            .update({
              titulos: totalTitulos,
              categoria: categoriasTexto
            })
            .eq('id', jugadorPrincipal.id)

          if (updateError) {
            console.error('Error updating jugador principal:', updateError)
            continue
          }

          // Eliminar jugadores duplicados
          for (const jugadorSec of jugadoresSecundarios) {
            const { error: deleteError } = await supabase
              .from('titulos_jugadores')
              .delete()
              .eq('id', jugadorSec.id)

            if (deleteError) {
              console.error('Error deleting jugador:', deleteError)
            }
          }

          actualizados++
        }
      }

      toast({
        title: "Éxito",
        description: `${actualizados} jugadores revisados y actualizados`
      })

      fetchJugadores()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron revisar los títulos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Función helper para mostrar el nombre correctamente
  const getDisplayName = (jugador) => {
    if (jugador.usuario) {
      // Si está vinculado, mostrar nombre completo del usuario
      return `${jugador.usuario.nombre} ${jugador.usuario.apellido}`
    } else {
      // Si no está vinculado y nombre = apellido, mostrar solo uno
      if (jugador.nombre === jugador.apellido) {
        return jugador.nombre
      }
      // Si son diferentes, mostrar ambos
      return `${jugador.nombre} ${jugador.apellido}`
    }
  }

  const handleExportData = () => {
    const csvContent = [
      ['Nombre', 'Apellido', 'Títulos', 'Categoría', 'Usuario Vinculado'],
      ...jugadores.map(jugador => [
        jugador.nombre,
        jugador.apellido,
        jugador.titulos,
        jugador.categoria,
        jugador.usuario ? `${jugador.usuario.nombre} ${jugador.usuario.apellido}` : 'No vinculado'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'titulos_jugadores.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Éxito",
      description: "Datos exportados correctamente"
    })
  }

  // Filtrar jugadores
  const filteredJugadores = jugadores.filter(jugador => {
    const displayName = getDisplayName(jugador)
    const matchesSearch = !searchTerm || 
      displayName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategoria = filterCategoria === 'todas' || jugador.categoria === filterCategoria
    
    const matchesLinkFilter = 
      (!showLinkedOnly && !showUnlinkedOnly) ||
      (showLinkedOnly && jugador.usuario_id) ||
      (showUnlinkedOnly && !jugador.usuario_id)

    return matchesSearch && matchesCategoria && matchesLinkFilter
  })

  const categorias = [...new Set(jugadores.map(j => j.categoria).filter(Boolean))]

  const stats = {
    total: jugadores.length,
    vinculados: jugadores.filter(j => j.usuario_id).length,
    noVinculados: jugadores.filter(j => !j.usuario_id).length,
    conTitulos: jugadores.filter(j => j.titulos > 0).length
  }

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Títulos por Jugador</h1>
          <p className="text-gray-400">Administra los títulos ganados por jugadores y sus vínculos con usuarios registrados</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Total jugadores</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Link className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Vinculados</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{stats.vinculados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Unlink className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Sin vincular</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{stats.noVinculados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Con títulos</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{stats.conTitulos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="space-y-3 mb-6">
          {/* Primera fila: Búsqueda y filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar jugador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-800 text-white placeholder-gray-400"
              />
            </div>
            
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="bg-gray-900/50 border-gray-800 text-white">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="todas" className="text-white hover:bg-gray-800">Todas las categorías</SelectItem>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-800">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                variant={showLinkedOnly ? "default" : "outline"}
                onClick={() => {
                  setShowLinkedOnly(!showLinkedOnly)
                  setShowUnlinkedOnly(false)
                }}
                size="sm"
                className="flex-1"
              >
                <Link className="w-4 h-4 mr-1" />
                <span className="hidden xs:inline">Vinculados</span>
              </Button>
              <Button
                variant={showUnlinkedOnly ? "default" : "outline"}
                onClick={() => {
                  setShowUnlinkedOnly(!showUnlinkedOnly)
                  setShowLinkedOnly(false)
                }}
                size="sm"
                className="flex-1"
              >
                <Unlink className="w-4 h-4 mr-1" />
                <span className="hidden xs:inline">Sin vincular</span>
              </Button>
            </div>
          </div>
          
          {/* Segunda fila: Botones de acción */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Nuevo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingJugador ? 'Editar Jugador' : 'Agregar Jugador'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre" className="text-white">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="apellido" className="text-white">Apellido</Label>
                      <Input
                        id="apellido"
                        value={formData.apellido}
                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="titulos" className="text-white">Títulos</Label>
                      <Input
                        id="titulos"
                        type="number"
                        min="0"
                        value={formData.titulos}
                        onChange={(e) => setFormData({...formData, titulos: parseInt(e.target.value) || 0})}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoria" className="text-white">Categoría</Label>
                      <Input
                        id="categoria"
                        value={formData.categoria}
                        onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                        placeholder="Ej: C4, C5, C6..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsModalOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingJugador ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Importar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Importar Títulos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="importCategoria" className="text-white">Categoría</Label>
                    <Input
                      id="importCategoria"
                      value={importCategoria}
                      onChange={(e) => setImportCategoria(e.target.value)}
                      placeholder="Ej: C4"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="importData" className="text-white">Datos (formato: "Apellido Títulos")</Label>
                    <textarea
                      id="importData"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Ej:&#10;ACETO 1&#10;BEGHER 1&#10;GONEN 1&#10;DI NUCCI 1"
                      className="w-full h-32 p-2 border rounded bg-gray-800 border-gray-700 text-white placeholder-gray-400 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Formato: Apellido(s) seguido del número de títulos. Solo se guardará el apellido.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowImportModal(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleImportData} 
                      disabled={importing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {importing ? <Spinner className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      {importing ? 'Importando...' : 'Importar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={handleExportData} className="w-full">
              <Download className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleUpdateLinkedNames}
              className="w-full border-orange-600 text-orange-400 hover:bg-orange-900/20"
              disabled={loading}
            >
              <User className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleUnificarDuplicados}
              className="w-full border-purple-600 text-purple-400 hover:bg-purple-900/20"
              disabled={loading}
            >
              <Users className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Unificar</span>
            </Button>
            

          </div>
        </div>

        {/* Tabla */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Jugadores con Títulos ({filteredJugadores.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Vista de escritorio */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-3 text-gray-400">Nombre</th>
                        <th className="text-left p-3 text-gray-400">Categoría</th>
                        <th className="text-left p-3 text-gray-400">Títulos</th>
                        <th className="text-left p-3 text-gray-400">Usuario Vinculado</th>
                        <th className="text-left p-3 text-gray-400">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJugadores.map((jugador) => (
                        <tr key={jugador.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3">
                            <div className="font-medium text-white">
                              {getDisplayName(jugador)}
                            </div>
                          </td>
                                                     <td className="p-3">
                             <Badge 
                               variant="outline" 
                               className="text-xs border-[#E2FC1D] text-[#E2FC1D]"
                             >
                               {jugador.categoria}
                             </Badge>
                           </td>
                                                     <td className="p-3">
                             <div className="flex items-center gap-2">
                               <Trophy className="w-4 h-4 text-yellow-400" />
                               <span className="font-medium text-white">
                                 {jugador.titulos}
                               </span>
                             </div>
                           </td>
                          <td className="p-3">
                            {jugador.usuario ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-white">
                                  {jugador.usuario.nombre} {jugador.usuario.apellido}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Unlink className="w-4 h-4 text-orange-400" />
                                <span className="text-sm text-gray-400">Sin vincular</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(jugador)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openLinkModal(jugador)}
                              >
                                {jugador.usuario ? <Unlink className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(jugador.id)}
                                className="text-red-400 border-red-600 hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista móvil */}
                <div className="md:hidden space-y-3">
                  {filteredJugadores.map((jugador) => (
                    <Card key={jugador.id} className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-white">
                              {getDisplayName(jugador)}
                            </h3>
                                                         <div className="flex items-center gap-2 mt-1">
                               <Badge 
                                 variant="outline" 
                                 className="text-xs border-[#E2FC1D] text-[#E2FC1D]"
                               >
                                 {jugador.categoria}
                               </Badge>
                               <div className="flex items-center gap-1">
                                 <Trophy className="w-3 h-3 text-yellow-400" />
                                 <span className="text-sm text-gray-400">
                                   {jugador.titulos} títulos
                                 </span>
                               </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(jugador)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openLinkModal(jugador)}
                            >
                              {jugador.usuario ? <Unlink className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(jugador.id)}
                              className="text-red-400 border-red-600 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {jugador.usuario ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-white">
                              {jugador.usuario.nombre} {jugador.usuario.apellido}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Unlink className="w-4 h-4 text-orange-400" />
                            <span className="text-sm text-gray-400">Sin vincular</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

                 {/* Modal para vincular usuarios */}
         <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
           <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
             <DialogHeader>
               <DialogTitle className="text-white flex items-center gap-2">
                 <Link className="w-5 h-5 text-blue-400" />
                 Vincular Jugador: {selectedJugador ? getDisplayName(selectedJugador) : ''}
               </DialogTitle>
             </DialogHeader>
             <div className="space-y-4">
               {/* Información del jugador seleccionado */}
               {selectedJugador && (
                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="font-medium text-white text-lg">
                         {getDisplayName(selectedJugador)}
                       </h3>
                       <div className="flex items-center gap-2 mt-1">
                         <Badge 
                           variant="outline" 
                           className="text-xs border-[#E2FC1D] text-[#E2FC1D]"
                         >
                           {selectedJugador.categoria}
                         </Badge>
                         <div className="flex items-center gap-1">
                           <Trophy className="w-3 h-3 text-yellow-400" />
                           <span className="text-sm text-gray-400">
                             {selectedJugador.titulos} títulos
                           </span>
                         </div>
                       </div>
                     </div>
                     {selectedJugador.usuario && (
                       <div className="text-right">
                         <div className="flex items-center gap-2 text-green-400">
                           <User className="w-4 h-4" />
                           <span className="text-sm">Ya vinculado</span>
                         </div>
                         <div className="text-xs text-gray-400 mt-1">
                           {selectedJugador.usuario.nombre} {selectedJugador.usuario.apellido}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Búsqueda de usuarios */}
               <div>
                 <Label className="text-white">Buscar Usuario</Label>
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <Input
                     placeholder="Buscar por nombre, apellido o email..."
                     value={searchUsuario}
                     onChange={(e) => setSearchUsuario(e.target.value)}
                     className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                   />
                 </div>
               </div>

               {/* Lista de usuarios */}
               <div className="max-h-80 overflow-y-auto space-y-2">
                 {usuariosDisponibles
                   .filter(usuario => 
                     usuario.nombre.toLowerCase().includes(searchUsuario.toLowerCase()) ||
                     usuario.apellido.toLowerCase().includes(searchUsuario.toLowerCase()) ||
                     usuario.email.toLowerCase().includes(searchUsuario.toLowerCase())
                   )
                   .map(usuario => (
                     <div
                       key={usuario.id}
                       className="flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                       onClick={() => handleLinkUser(selectedJugador.id, usuario.id)}
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                           <span className="text-blue-400 font-medium text-sm">
                             {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                           </span>
                         </div>
                         <div>
                           <div className="font-medium text-white">
                             {usuario.nombre} {usuario.apellido}
                           </div>
                           <div className="text-sm text-gray-400">{usuario.email}</div>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <Link className="w-4 h-4 text-blue-400" />
                         <span className="text-xs text-gray-400">Vincular</span>
                       </div>
                     </div>
                   ))}
                 
                 {/* Mensaje si no hay usuarios */}
                 {usuariosDisponibles.filter(usuario => 
                   usuario.nombre.toLowerCase().includes(searchUsuario.toLowerCase()) ||
                   usuario.apellido.toLowerCase().includes(searchUsuario.toLowerCase()) ||
                   usuario.email.toLowerCase().includes(searchUsuario.toLowerCase())
                 ).length === 0 && searchUsuario && (
                   <div className="text-center py-8 text-gray-400">
                     <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                     <p>No se encontraron usuarios que coincidan con "{searchUsuario}"</p>
                   </div>
                 )}
               </div>

               {/* Botones de acción */}
               <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                 <Button 
                   variant="outline" 
                   onClick={() => setShowLinkModal(false)}
                   className="border-gray-600 text-gray-300 hover:bg-gray-800"
                 >
                   Cancelar
                 </Button>
                 {selectedJugador?.usuario && (
                   <Button 
                     variant="outline" 
                     onClick={() => handleUnlinkUser(selectedJugador.id)}
                     className="border-red-600 text-red-400 hover:bg-red-900/20"
                   >
                     <Unlink className="w-4 h-4 mr-2" />
                     Desvincular
                   </Button>
                 )}
               </div>
             </div>
           </DialogContent>
         </Dialog>
      </div>
    </div>
  )
} 