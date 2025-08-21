'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminHeader from '@/components/AdminHeader'
import { linkGhostProfileToUser, getGhostProfiles, findDuplicateProfiles, mergeDuplicateProfiles } from '@/lib/ranking-utils'
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
  AlertTriangle
} from 'lucide-react'

export default function JugadoresRanking() {
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
    puntos: 0,
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

  // Estados para perfiles fantasma
  const [ghostProfiles, setGhostProfiles] = useState([])
  const [showGhostProfilesModal, setShowGhostProfilesModal] = useState(false)
  const [duplicateProfiles, setDuplicateProfiles] = useState([])
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false)

  useEffect(() => {
    fetchJugadores()
  }, [])

  const fetchJugadores = async () => {
    try {
      setLoading(true)
      
             let query = supabase
         .from('ranking_jugadores')
         .select(`
           *,
           usuario:usuarios(id, nombre, apellido, email)
         `)
         .order('puntos', { ascending: false })

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
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Función para capitalizar la primera letra de cada palabra
    const capitalizeWords = (str) => {
      if (!str) return str
      return str
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ')
    }

    // Capitalizar nombre y apellido antes de guardar
    const dataToSave = {
      ...formData,
      nombre: capitalizeWords(formData.nombre),
      apellido: capitalizeWords(formData.apellido)
    }
    
    try {
      if (editingJugador) {
                 // Actualizar jugador existente
         const { error } = await supabase
           .from('ranking_jugadores')
           .update(dataToSave)
           .eq('id', editingJugador.id)

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Jugador actualizado correctamente"
        })
             } else {
         // Crear nuevo jugador
         const { error } = await supabase
           .from('ranking_jugadores')
           .insert(dataToSave)

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Jugador creado correctamente"
        })
      }

      setIsModalOpen(false)
      setEditingJugador(null)
      setFormData({ nombre: '', apellido: '', puntos: 0, categoria: '' })
      fetchJugadores()
    } catch (error) {
      console.error('Error saving jugador:', error)
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
      puntos: jugador.puntos,
      categoria: jugador.categoria || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este jugador?')) return

    try {
             const { error } = await supabase
         .from('ranking_jugadores')
         .delete()
         .eq('id', id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Jugador eliminado correctamente"
      })
      fetchJugadores()
    } catch (error) {
      console.error('Error deleting jugador:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el jugador",
        variant: "destructive"
      })
    }
  }

  const handleLinkUser = async (jugadorId, usuarioId) => {
    try {
      // Obtener los datos del usuario para usar su nombre y apellido
      const { data: usuario, error: fetchError } = await supabase
        .from('usuarios')
        .select('nombre, apellido')
        .eq('id', usuarioId)
        .single()

      if (fetchError) throw fetchError

      // Función para capitalizar la primera letra de cada palabra
      const capitalizeWords = (str) => {
        if (!str) return str
        return str
          .toLowerCase()
          .split(' ')
          .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
          .join(' ')
      }

      // Actualizar el jugador con el usuario_id y los datos reales del usuario
      const { error } = await supabase
        .from('ranking_jugadores')
        .update({ 
          usuario_id: usuarioId,
          nombre: capitalizeWords(usuario.nombre),
          apellido: capitalizeWords(usuario.apellido)
        })
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
      console.error('Error linking jugador:', error)
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
         .from('ranking_jugadores')
         .update({ usuario_id: null })
         .eq('id', jugadorId)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Vínculo removido correctamente"
      })
      fetchJugadores()
    } catch (error) {
      console.error('Error unlinking jugador:', error)
      toast({
        title: "Error",
        description: "No se pudo remover el vínculo",
        variant: "destructive"
      })
    }
  }

  const openLinkModal = (jugador) => {
    if (!jugador) {
      console.error('No jugador provided to openLinkModal')
      return
    }
    setSelectedJugador(jugador)
    setSearchUsuario('')
    fetchUsuariosDisponibles()
    setShowLinkModal(true)
  }

  const handleImportData = async () => {
    if (!importData.trim() || !importCategoria.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      })
      return
    }

    try {
      setImporting(true)
      
      // Parsear los datos del Excel (formato: "Apellido Puntos")
      const lines = importData.trim().split('\n')
      const jugadores = []
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
                 // Buscar el patrón: número. Apellido Puntos
         const match = line.match(/^(\d+)\.\s+([^\s]+)\s+(\d+)$/)
         if (match) {
           const [, posicion, apellido, puntos] = match
           jugadores.push({
             nombre: null,
             apellido: apellido,
             puntos: parseInt(puntos)
           })
         } else {
           // Parsear como "Apellido Puntos"
           const parts = line.split(/\s+/)
           if (parts.length >= 2) {
             const puntos = parseInt(parts[parts.length - 1])
             const apellido = parts.slice(0, -1).join(' ') // Todo excepto el último elemento
             
             if (!isNaN(puntos)) {
               jugadores.push({
                 nombre: null,
                 apellido: apellido,
                 puntos: puntos
               })
             }
           }
         }
      }

      if (jugadores.length === 0) {
        toast({
          title: "Error",
          description: "No se pudieron parsear los datos. Asegúrate de que el formato sea correcto.",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/import-jugadores-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jugadores,
          categoria: importCategoria
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Mostrar modal de confirmación para eliminar existentes
          if (confirm(`Ya existen jugadores en la categoría ${importCategoria}. ¿Quieres eliminarlos e importar los nuevos?`)) {
            await handleDeleteCategoria(importCategoria)
            // Reintentar la importación
            const retryResponse = await fetch('/api/import-jugadores-ranking', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jugadores,
                categoria: importCategoria
              })
            })
            const retryResult = await retryResponse.json()
            
            if (retryResponse.ok) {
              toast({
                title: "Éxito",
                description: retryResult.message
              })
              setShowImportModal(false)
              setImportData('')
              setImportCategoria('')
              fetchJugadores()
            } else {
              toast({
                title: "Error",
                description: retryResult.error,
                variant: "destructive"
              })
            }
          }
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive"
          })
        }
        return
      }

      toast({
        title: "Éxito",
        description: result.message
      })
      setShowImportModal(false)
      setImportData('')
      setImportCategoria('')
      fetchJugadores()
    } catch (error) {
      console.error('Error importing data:', error)
      toast({
        title: "Error",
        description: "Error al importar los datos",
        variant: "destructive"
      })
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteCategoria = async (categoria) => {
    try {
      const response = await fetch('/api/import-jugadores-ranking', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoria })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      toast({
        title: "Éxito",
        description: result.message
      })
      fetchJugadores()
    } catch (error) {
      console.error('Error deleting categoria:', error)
      toast({
        title: "Error",
        description: "Error al eliminar la categoría",
        variant: "destructive"
      })
    }
  }

  const handleUpdateLinkedNames = async () => {
    if (!confirm('¿Estás seguro de que quieres actualizar los nombres de todos los jugadores vinculados? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setLoading(true)
      
      // Obtener todos los jugadores vinculados
      const { data: jugadoresVinculados, error: fetchError } = await supabase
        .from('ranking_jugadores')
        .select(`
          id,
          usuario_id,
          usuario:usuarios(id, nombre, apellido)
        `)
        .not('usuario_id', 'is', null)

      if (fetchError) throw fetchError

      if (jugadoresVinculados.length === 0) {
        toast({
          title: "Información",
          description: "No hay jugadores vinculados para actualizar"
        })
        return
      }

      // Función para capitalizar la primera letra de cada palabra
      const capitalizeWords = (str) => {
        if (!str) return str
        return str
          .toLowerCase()
          .split(' ')
          .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
          .join(' ')
      }

      // Actualizar cada jugador vinculado
      let updatedCount = 0
      for (const jugador of jugadoresVinculados) {
        if (jugador.usuario) {
          const { error: updateError } = await supabase
            .from('ranking_jugadores')
            .update({
              nombre: capitalizeWords(jugador.usuario.nombre),
              apellido: capitalizeWords(jugador.usuario.apellido)
            })
            .eq('id', jugador.id)

          if (updateError) {
            console.error(`Error updating jugador ${jugador.id}:`, updateError)
          } else {
            updatedCount++
          }
        }
      }

      toast({
        title: "Éxito",
        description: `Se actualizaron ${updatedCount} jugadores vinculados`
      })
      
      fetchJugadores()
    } catch (error) {
      console.error('Error updating linked names:', error)
      toast({
        title: "Error",
        description: "Error al actualizar los nombres de los jugadores vinculados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    const data = jugadores.map(j => ({
      nombre: j.nombre,
      apellido: j.apellido,
      puntos: j.puntos,
      categoria: j.categoria,
      usuario_vinculado: j.usuario ? `${j.usuario.nombre} ${j.usuario.apellido} (${j.usuario.email})` : 'No vinculado'
    }))

    const csv = [
      ['Nombre', 'Apellido', 'Puntos', 'Categoría', 'Usuario Vinculado'],
      ...data.map(j => [j.nombre, j.apellido, j.puntos, j.categoria, j.usuario_vinculado])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jugadores-ranking-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Función para cargar perfiles fantasma
  const loadGhostProfiles = async () => {
    try {
      const profiles = await getGhostProfiles()
      setGhostProfiles(profiles)
    } catch (error) {
      console.error('Error cargando perfiles fantasma:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles fantasma",
        variant: "destructive"
      })
    }
  }

  // Función para cargar perfiles duplicados
  const loadDuplicateProfiles = async () => {
    try {
      const duplicates = await findDuplicateProfiles()
      setDuplicateProfiles(duplicates)
    } catch (error) {
      console.error('Error cargando perfiles duplicados:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles duplicados",
        variant: "destructive"
      })
    }
  }

  // Función para vincular perfil fantasma a usuario
  const handleLinkGhostProfile = async (ghostProfileId, userId) => {
    try {
      const result = await linkGhostProfileToUser(ghostProfileId, userId)
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
          variant: "default"
        })
        
        // Recargar datos
        fetchJugadores()
        loadGhostProfiles()
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudo vincular el perfil",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error vinculando perfil fantasma:', error)
      toast({
        title: "Error",
        description: "No se pudo vincular el perfil fantasma",
        variant: "destructive"
      })
    }
  }

  // Función para fusionar perfiles duplicados
  const handleMergeDuplicates = async (profilesToMerge) => {
    try {
      const result = await mergeDuplicateProfiles(profilesToMerge)
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
          variant: "default"
        })
        
        // Recargar datos
        fetchJugadores()
        loadDuplicateProfiles()
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudieron fusionar los perfiles",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fusionando perfiles:', error)
      toast({
        title: "Error",
        description: "No se pudieron fusionar los perfiles duplicados",
        variant: "destructive"
      })
    }
  }

  // Filtrar jugadores
  const filteredJugadores = jugadores.filter(jugador => {
    const matchesSearch = !searchTerm || 
      `${jugador.nombre} ${jugador.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    
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
    conPuntos: jugadores.filter(j => j.puntos > 0).length
  }

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Jugadores Ranking</h1>
          <p className="text-gray-400">Administra los jugadores de ranking y sus vínculos con usuarios registrados</p>
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
                 <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
                 <div>
                   <p className="text-xs md:text-sm text-gray-400">Con puntos</p>
                   <p className="text-lg md:text-2xl font-bold text-white">{stats.conPuntos}</p>
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
             </Dialog>
             
             <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
               <DialogTrigger asChild>
                 <Button variant="outline" className="w-full">
                   <Upload className="w-4 h-4 mr-1" />
                   <span className="hidden sm:inline">Importar</span>
                 </Button>
               </DialogTrigger>
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
           </div>
         </div>

                 {/* Tabla */}
         <Card className="bg-gray-900/50 border-gray-800">
           <CardHeader>
             <CardTitle className="text-white">Jugadores de Ranking ({filteredJugadores.length})</CardTitle>
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
                         <th className="text-left p-3 text-gray-400">Puntos</th>
                         <th className="text-left p-3 text-gray-400">Usuario Vinculado</th>
                         <th className="text-left p-3 text-gray-400">Acciones</th>
                       </tr>
                     </thead>
                     <tbody>
                       {filteredJugadores.map((jugador) => (
                         <tr key={jugador.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                           <td className="p-3">
                             <div className="font-medium text-white">
                               {jugador.nombre} {jugador.apellido}
                             </div>
                           </td>
                           <td className="p-3">
                             {jugador.categoria && (
                               <Badge variant="outline" className="border-[#D2ED1A] text-[#D2ED1A]">
                                 {jugador.categoria}
                               </Badge>
                             )}
                           </td>
                           <td className="p-3">
                             <div className="flex items-center gap-2">
                               <Trophy className="w-4 h-4 text-yellow-400" />
                               <span className="font-medium text-white">{jugador.puntos}</span>
                             </div>
                           </td>
                           <td className="p-3">
                             {jugador.usuario ? (
                               <div className="flex items-center gap-2">
                                 <User className="w-4 h-4 text-green-400" />
                                 <span className="text-sm text-white">
                                   {jugador.usuario.nombre} {jugador.usuario.apellido}
                                 </span>
                                 <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                                   {jugador.usuario.email}
                                 </Badge>
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
                                 className="border-gray-700 text-gray-300 hover:bg-gray-800"
                               >
                                 <Edit className="w-4 h-4" />
                               </Button>
                               
                               {jugador.usuario ? (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleUnlinkUser(jugador.id)}
                                   className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                 >
                                   <Unlink className="w-4 h-4" />
                                 </Button>
                               ) : (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => openLinkModal(jugador)}
                                   className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                 >
                                   <Link className="w-4 h-4" />
                                 </Button>
                               )}
                               
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleDelete(jugador.id)}
                                 className="text-red-400 hover:text-red-300 border-red-700 hover:bg-red-900/20"
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
                     <div key={jugador.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                       <div className="flex justify-between items-start mb-3">
                         <div className="flex-1">
                           <div className="font-medium text-white text-lg">
                             {jugador.nombre} {jugador.apellido}
                           </div>
                           <div className="flex items-center gap-2 mt-1">
                             <Trophy className="w-4 h-4 text-yellow-400" />
                             <span className="text-sm text-gray-300">{jugador.puntos} puntos</span>
                           </div>
                         </div>
                         <div className="flex gap-1">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleEdit(jugador)}
                             className="border-gray-700 text-gray-300 hover:bg-gray-800 p-2"
                           >
                             <Edit className="w-4 h-4" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleDelete(jugador.id)}
                             className="text-red-400 hover:text-red-300 border-red-700 hover:bg-red-900/20 p-2"
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       </div>
                       
                       <div className="space-y-2">
                         {jugador.categoria && (
                           <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400">Categoría:</span>
                             <Badge variant="outline" className="border-[#D2ED1A] text-[#D2ED1A] text-xs">
                               {jugador.categoria}
                             </Badge>
                           </div>
                         )}
                         
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-400">Usuario:</span>
                           {jugador.usuario ? (
                             <div className="flex items-center gap-2">
                               <User className="w-3 h-3 text-green-400" />
                               <span className="text-sm text-white">
                                 {jugador.usuario.nombre} {jugador.usuario.apellido}
                               </span>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleUnlinkUser(jugador.id)}
                                 className="border-gray-700 text-gray-300 hover:bg-gray-800 p-1"
                               >
                                 <Unlink className="w-3 h-3" />
                               </Button>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               <Unlink className="w-3 h-3 text-orange-400" />
                               <span className="text-sm text-gray-400">Sin vincular</span>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => openLinkModal(jugador)}
                                 className="border-gray-700 text-gray-300 hover:bg-gray-800 p-1"
                               >
                                 <Link className="w-3 h-3" />
                               </Button>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 {filteredJugadores.length === 0 && (
                   <div className="text-center py-8 text-gray-400">
                     No se encontraron jugadores
                   </div>
                 )}
               </div>
             )}
           </CardContent>
         </Card>
      </div>

             {/* Modal para crear/editar jugador */}
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
         <DialogContent className="bg-gray-900 border-gray-800 w-[95vw] max-w-md mx-auto">
           <DialogHeader>
             <DialogTitle className="text-white text-lg sm:text-xl">
               {editingJugador ? 'Editar Jugador' : 'Nuevo Jugador'}
             </DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
               <div>
                 <Label htmlFor="nombre" className="text-gray-300 text-sm sm:text-base">Nombre</Label>
                 <Input
                   id="nombre"
                   value={formData.nombre}
                   onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                   required
                   className="bg-gray-800 border-gray-700 text-white h-10 sm:h-9"
                 />
               </div>
               <div>
                 <Label htmlFor="apellido" className="text-gray-300 text-sm sm:text-base">Apellido</Label>
                 <Input
                   id="apellido"
                   value={formData.apellido}
                   onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                   required
                   className="bg-gray-800 border-gray-700 text-white h-10 sm:h-9"
                 />
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
               <div>
                 <Label htmlFor="puntos" className="text-gray-300 text-sm sm:text-base">Puntos</Label>
                 <Input
                   id="puntos"
                   type="number"
                   value={formData.puntos}
                   onChange={(e) => setFormData({...formData, puntos: parseInt(e.target.value) || 0})}
                   required
                   className="bg-gray-800 border-gray-700 text-white h-10 sm:h-9"
                 />
               </div>
                              <div>
                  <Label htmlFor="categoria" className="text-gray-300 text-sm sm:text-base">Categoría</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-10 sm:h-9">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="C1" className="text-white hover:bg-gray-800">C1</SelectItem>
                      <SelectItem value="C2" className="text-white hover:bg-gray-800">C2</SelectItem>
                      <SelectItem value="C3" className="text-white hover:bg-gray-800">C3</SelectItem>
                      <SelectItem value="C4" className="text-white hover:bg-gray-800">C4</SelectItem>
                      <SelectItem value="C5" className="text-white hover:bg-gray-800">C5</SelectItem>
                      <SelectItem value="C6" className="text-white hover:bg-gray-800">C6</SelectItem>
                      <SelectItem value="C7" className="text-white hover:bg-gray-800">C7</SelectItem>
                      <SelectItem value="C8" className="text-white hover:bg-gray-800">C8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
             <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
               <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800 h-10 sm:h-9">
                 Cancelar
               </Button>
               <Button type="submit" className="bg-[#D2ED1A] text-black hover:bg-[#D2ED1A]/90 h-10 sm:h-9">
                 {editingJugador ? 'Actualizar' : 'Crear'}
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>

             {/* Modal para vincular usuarios */}
       <Dialog open={showLinkModal} onOpenChange={(open) => {
         if (!open) {
           setSelectedJugador(null)
           setSearchUsuario('')
         }
         setShowLinkModal(open)
       }}>
         <DialogContent className="bg-gray-900 border-gray-800 w-[95vw] max-w-2xl mx-auto">
           <DialogHeader>
             <DialogTitle className="text-white text-lg sm:text-xl">Vincular Jugador con Usuario</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             {selectedJugador ? (
               <div>
                 <p className="text-sm text-gray-400 mb-4">
                   Vinculando: <strong className="text-white">{selectedJugador.nombre} {selectedJugador.apellido}</strong>
                 </p>
               </div>
             ) : (
               <div className="text-center py-4 text-red-400">
                 Error: No se seleccionó un jugador válido
               </div>
             )}
             
             {selectedJugador && (
               <>
                 {/* Barra de búsqueda */}
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <Input
                     placeholder="Buscar usuario por nombre, apellido o email..."
                     value={searchUsuario}
                     onChange={(e) => setSearchUsuario(e.target.value)}
                     className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                   />
                 </div>
                 
                 <div className="max-h-80 overflow-y-auto space-y-2">
                   {usuariosDisponibles
                     .filter(usuario => 
                       !searchUsuario || 
                       `${usuario.nombre} ${usuario.apellido} ${usuario.email}`
                         .toLowerCase()
                         .includes(searchUsuario.toLowerCase())
                     )
                     .map((usuario) => (
                     <div
                       key={usuario.id}
                       className="flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                       onClick={() => handleLinkUser(selectedJugador.id, usuario.id)}
                     >
                       <div className="flex-1 min-w-0">
                         <div className="font-medium text-white truncate">
                           {usuario.nombre} {usuario.apellido}
                         </div>
                         <div className="text-sm text-gray-400 truncate">{usuario.email}</div>
                       </div>
                       <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 ml-2 flex-shrink-0 p-2">
                         <Link className="w-4 h-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
                 
                 {usuariosDisponibles.filter(usuario => 
                   !searchUsuario || 
                   `${usuario.nombre} ${usuario.apellido} ${usuario.email}`
                     .toLowerCase()
                     .includes(searchUsuario.toLowerCase())
                 ).length === 0 && (
                   <div className="text-center py-4 text-gray-400">
                     {searchUsuario ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios disponibles para vincular'}
                   </div>
                 )}
               </>
             )}
           </div>
         </DialogContent>
       </Dialog>

             {/* Modal para importación masiva */}
       <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
         <DialogContent className="w-[95vw] max-w-2xl bg-gray-900 border-gray-800 mx-auto">
           <DialogHeader>
             <DialogTitle className="text-white text-lg sm:text-xl">Importar Jugadores desde Excel</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
                          <div>
                <Label htmlFor="categoria" className="text-gray-300 text-sm sm:text-base">Categoría</Label>
                <Select value={importCategoria} onValueChange={setImportCategoria}>
                  <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white h-10 sm:h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="C1" className="text-white hover:bg-gray-800">C1</SelectItem>
                    <SelectItem value="C2" className="text-white hover:bg-gray-800">C2</SelectItem>
                    <SelectItem value="C3" className="text-white hover:bg-gray-800">C3</SelectItem>
                    <SelectItem value="C4" className="text-white hover:bg-gray-800">C4</SelectItem>
                    <SelectItem value="C5" className="text-white hover:bg-gray-800">C5</SelectItem>
                    <SelectItem value="C6" className="text-white hover:bg-gray-800">C6</SelectItem>
                    <SelectItem value="C7" className="text-white hover:bg-gray-800">C7</SelectItem>
                    <SelectItem value="C8" className="text-white hover:bg-gray-800">C8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
             
             <div>
               <Label htmlFor="data" className="text-gray-300 text-sm sm:text-base">Datos del Excel</Label>
               <div className="mt-1 p-3 bg-gray-800 rounded border border-gray-700">
                 <p className="text-xs sm:text-sm text-gray-400 mb-2">
                   <AlertTriangle className="w-4 h-4 inline mr-1" />
                   Formato esperado: "Apellido Puntos" (uno por línea)
                 </p>
                 <p className="text-xs sm:text-sm text-gray-400 mb-2">
                   Ejemplo:
                 </p>
                 <pre className="text-xs bg-gray-700 p-2 rounded border border-gray-600 text-gray-300 overflow-x-auto">
{`Re 17
Moreno 17
Barbieri 17
Epstein 17
Ostapechuk 14`}
                 </pre>
               </div>
               <textarea
                 id="data"
                 value={importData}
                 onChange={(e) => setImportData(e.target.value)}
                 placeholder="Pega aquí los datos del Excel..."
                 className="mt-2 w-full h-32 md:h-40 p-3 border border-gray-700 rounded resize-none bg-gray-800 text-white placeholder-gray-400"
               />
             </div>
             
             <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
               <Button 
                 type="button" 
                 variant="outline" 
                 onClick={() => setShowImportModal(false)}
                 className="border-gray-700 text-gray-300 hover:bg-gray-800 h-10 sm:h-9"
               >
                 Cancelar
               </Button>
               <Button 
                 onClick={handleImportData}
                 disabled={importing}
                 className="bg-[#D2ED1A] text-black hover:bg-[#D2ED1A]/90 h-10 sm:h-9"
               >
                 {importing ? <Spinner className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                 {importing ? 'Importando...' : 'Importar'}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  )
} 