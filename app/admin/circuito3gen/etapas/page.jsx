'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function EtapasPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [etapas, setEtapas] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEtapa, setEditingEtapa] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    año: new Date().getFullYear(),
    estado: 'activa'
  })

  useEffect(() => {
    fetchEtapas()
  }, [])

  const fetchEtapas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('circuito3gen_etapas')
        .select('*')
        .order('año', { ascending: false })
        .order('fecha_inicio', { ascending: false })

      if (error) throw error
      setEtapas(data || [])
    } catch (error) {
      console.error('Error fetching etapas:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar las etapas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (etapa = null) => {
    if (etapa) {
      setEditingEtapa(etapa)
      setFormData({
        nombre: etapa.nombre,
        fecha_inicio: etapa.fecha_inicio,
        fecha_fin: etapa.fecha_fin,
        año: etapa.año,
        estado: etapa.estado
      })
    } else {
      setEditingEtapa(null)
      setFormData({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
        año: new Date().getFullYear(),
        estado: 'activa'
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingEtapa(null)
    setFormData({
      nombre: '',
      fecha_inicio: '',
      fecha_fin: '',
      año: new Date().getFullYear(),
      estado: 'activa'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = '/api/circuito3gen/etapas'
      const method = editingEtapa ? 'PUT' : 'POST'
      const body = editingEtapa
        ? { id: editingEtapa.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar la etapa')
      }

      toast({
        title: 'Éxito',
        description: editingEtapa ? 'Etapa actualizada' : 'Etapa creada',
      })

      handleCloseDialog()
      fetchEtapas()
    } catch (error) {
      console.error('Error saving etapa:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta etapa?')) return

    try {
      const { error } = await supabase
        .from('circuito3gen_etapas')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Éxito',
        description: 'Etapa eliminada',
      })

      fetchEtapas()
    } catch (error) {
      console.error('Error deleting etapa:', error)
      toast({
        title: 'Error',
        description: 'Error al eliminar la etapa',
        variant: 'destructive'
      })
    }
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
            <Calendar className="w-8 h-8 text-yellow-500" />
            Gestión de Etapas
          </h1>
          <p className="text-gray-400 mt-2">Administra las etapas del circuito</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Etapa
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Etapas del Circuito</CardTitle>
        </CardHeader>
        <CardContent>
          {etapas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No hay etapas creadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {etapas.map((etapa) => (
                <div
                  key={etapa.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-semibold text-lg">{etapa.nombre}</h3>
                      <Badge
                        className={
                          etapa.estado === 'activa'
                            ? 'bg-green-500/20 text-green-400 border-green-500/50'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                        }
                      >
                        {etapa.estado}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                      <span>
                        {new Date(etapa.fecha_inicio).toLocaleDateString()} -{' '}
                        {new Date(etapa.fecha_fin).toLocaleDateString()}
                      </span>
                      <span>Año: {etapa.año}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/circuito3gen/etapas/${etapa.id}`}>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(etapa)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(etapa.id)}
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
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingEtapa ? 'Editar Etapa' : 'Nueva Etapa'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingEtapa
                ? 'Modifica los datos de la etapa'
                : 'Completa los datos para crear una nueva etapa'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_fin">Fecha Fin</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="año">Año</Label>
                  <Input
                    id="año"
                    type="number"
                    value={formData.año}
                    onChange={(e) => setFormData({ ...formData, año: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
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
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
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
                {editingEtapa ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}




















