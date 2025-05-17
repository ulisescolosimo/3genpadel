'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function AdminTorneos() {
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTorneo, setEditingTorneo] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    ubicacion: '',
    categoria: '',
    estado: 'abierto',
    cupo_maximo: '',
    plazas_disponibles: ''
  })

  useEffect(() => {
    fetchTorneos()
  }, [])

  const fetchTorneos = async () => {
    try {
      const { data, error } = await supabase
        .from('torneo')
        .select('*')
        .order('fecha_inicio', { ascending: false })

      if (error) throw error

      setTorneos(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching torneos:', err)
      setError('Error al cargar los torneos')
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      ubicacion: '',
      categoria: '',
      estado: 'abierto',
      cupo_maximo: '',
      plazas_disponibles: ''
    })
    setEditingTorneo(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTorneo) {
        const { error } = await supabase
          .from('torneo')
          .update(formData)
          .eq('id', editingTorneo.id)

        if (error) throw error

        toast.success('Torneo actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('torneo')
          .insert([formData])

        if (error) throw error

        toast.success('Torneo creado correctamente')
      }

      setIsDialogOpen(false)
      resetForm()
      fetchTorneos()
    } catch (err) {
      console.error('Error saving torneo:', err)
      toast.error('Error al guardar el torneo')
    }
  }

  const handleEdit = (torneo) => {
    setEditingTorneo(torneo)
    setFormData({
      nombre: torneo.nombre,
      descripcion: torneo.descripcion,
      fecha_inicio: torneo.fecha_inicio,
      fecha_fin: torneo.fecha_fin,
      ubicacion: torneo.ubicacion,
      categoria: torneo.categoria,
      estado: torneo.estado,
      cupo_maximo: torneo.cupo_maximo,
      plazas_disponibles: torneo.plazas_disponibles
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este torneo?')) return

    try {
      const { error } = await supabase
        .from('torneo')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Torneo eliminado correctamente')
      fetchTorneos()
    } catch (err) {
      console.error('Error deleting torneo:', err)
      toast.error('Error al eliminar el torneo')
    }
  }

  const filteredTorneos = torneos.filter(torneo =>
    torneo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    torneo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Torneos</h1>
          <p className="text-gray-400 mt-1">Administra los torneos del sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
              className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Torneo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTorneo ? 'Editar Torneo' : 'Crear Nuevo Torneo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Nombre</label>
                <Input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Descripción</label>
                <Textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Fecha Inicio</label>
                  <Input
                    type="datetime-local"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleInputChange}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Fecha Fin</label>
                  <Input
                    type="datetime-local"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleInputChange}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Ubicación</label>
                  <Input
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Categoría</label>
                  <Input
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Estado</label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => handleSelectChange('estado', value)}
                  >
                    <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="abierto">Abierto</SelectItem>
                      <SelectItem value="en_curso">En Curso</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Cupo Máximo</label>
                  <Input
                    type="number"
                    name="cupo_maximo"
                    value={formData.cupo_maximo}
                    onChange={handleInputChange}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Plazas Disponibles</label>
                  <Input
                    type="number"
                    name="plazas_disponibles"
                    value={formData.plazas_disponibles}
                    onChange={handleInputChange}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                  {editingTorneo ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Buscar torneos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-900/50 border-gray-800 text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTorneos.map((torneo) => (
          <Card key={torneo.id} className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{torneo.nombre}</h3>
                  <p className="text-sm text-gray-400 mt-1">{torneo.categoria}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(torneo)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(torneo.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{torneo.descripcion}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estado:</span>
                  <span className={`font-medium ${
                    torneo.estado === 'abierto' ? 'text-green-500' :
                    torneo.estado === 'en_curso' ? 'text-blue-500' :
                    torneo.estado === 'finalizado' ? 'text-gray-500' :
                    'text-red-500'
                  }`}>
                    {torneo.estado.charAt(0).toUpperCase() + torneo.estado.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ubicación:</span>
                  <span className="text-white">{torneo.ubicacion}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Plazas:</span>
                  <span className="text-white">
                    {torneo.plazas_disponibles}/{torneo.cupo_maximo}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 