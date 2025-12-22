'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Target,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Users,
  Trophy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function DivisionesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [divisiones, setDivisiones] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDivision, setEditingDivision] = useState(null)
  const [formData, setFormData] = useState({
    numero_division: '',
    nombre: '',
    descripcion: '',
    orden: ''
  })
  const [stats, setStats] = useState({})

  useEffect(() => {
    fetchDivisiones()
  }, [])

  const fetchDivisiones = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('circuitooka_divisiones')
        .select('*')
        .order('numero_division', { ascending: true })

      if (error) throw error
      setDivisiones(data || [])

      // Obtener estadísticas por división
      await fetchStats(data || [])
    } catch (error) {
      console.error('Error fetching divisiones:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar las divisiones',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (divisionesData) => {
    try {
      const statsData = {}
      
      for (const division of divisionesData) {
        // Contar inscripciones activas
        const { count: inscripciones } = await supabase
          .from('circuitooka_inscripciones')
          .select('*', { count: 'exact', head: true })
          .eq('division_id', division.id)
          .eq('estado', 'activa')

        // Contar partidos jugados
        const { count: partidosJugados } = await supabase
          .from('circuitooka_partidos')
          .select('*', { count: 'exact', head: true })
          .eq('division_id', division.id)
          .eq('estado', 'jugado')

        statsData[division.id] = {
          inscripciones: inscripciones || 0,
          partidosJugados: partidosJugados || 0
        }
      }

      setStats(statsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleOpenDialog = (division = null) => {
    if (division) {
      setEditingDivision(division)
      setFormData({
        numero_division: division.numero_division.toString(),
        nombre: division.nombre,
        descripcion: division.descripcion || '',
        orden: division.orden.toString()
      })
    } else {
      setEditingDivision(null)
      // Obtener el siguiente número de división disponible
      const siguienteNumero = divisiones.length > 0
        ? Math.max(...divisiones.map(d => d.numero_division)) + 1
        : 1
      setFormData({
        numero_division: siguienteNumero.toString(),
        nombre: `División ${siguienteNumero}`,
        descripcion: '',
        orden: siguienteNumero.toString()
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingDivision(null)
    setFormData({
      numero_division: '',
      nombre: '',
      descripcion: '',
      orden: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const numeroDivision = parseInt(formData.numero_division)
      const orden = parseInt(formData.orden)

      // Validar que el número de división esté entre 1 y 4
      if (numeroDivision < 1 || numeroDivision > 4) {
        throw new Error('El número de división debe estar entre 1 y 4')
      }

      // Validar que no exista otra división con el mismo número (si es nueva)
      if (!editingDivision) {
        const existe = divisiones.some(d => d.numero_division === numeroDivision)
        if (existe) {
          throw new Error(`Ya existe una división con el número ${numeroDivision}`)
        }
      } else {
        // Si está editando, verificar que no haya conflicto con otra división
        const existe = divisiones.some(
          d => d.numero_division === numeroDivision && d.id !== editingDivision.id
        )
        if (existe) {
          throw new Error(`Ya existe otra división con el número ${numeroDivision}`)
        }
      }

      const dataToSave = {
        numero_division: numeroDivision,
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        orden: orden
      }

      if (editingDivision) {
        const { error } = await supabase
          .from('circuitooka_divisiones')
          .update(dataToSave)
          .eq('id', editingDivision.id)

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'División actualizada correctamente',
        })
      } else {
        const { error } = await supabase
          .from('circuitooka_divisiones')
          .insert(dataToSave)

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'División creada correctamente',
        })
      }

      handleCloseDialog()
      fetchDivisiones()
    } catch (error) {
      console.error('Error saving division:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta división? Esta acción no se puede deshacer.')) return

    try {
      // Verificar que no haya inscripciones activas en esta división
      const { count: inscripciones } = await supabase
        .from('circuitooka_inscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('division_id', id)
        .eq('estado', 'activa')

      if (inscripciones > 0) {
        throw new Error('No se puede eliminar una división con inscripciones activas')
      }

      const { error } = await supabase
        .from('circuitooka_divisiones')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Éxito',
        description: 'División eliminada',
      })

      fetchDivisiones()
    } catch (error) {
      console.error('Error deleting division:', error)
      toast({
        title: 'Error',
        description: error.message,
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
            <Target className="w-8 h-8 text-yellow-500" />
            Gestión de Divisiones
          </h1>
          <p className="text-gray-400 mt-2">Administra las divisiones del circuito</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchDivisiones}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva División
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <p className="text-gray-400 text-sm">
            Las divisiones representan los diferentes niveles del circuito. Hay 4 divisiones (1-4), 
            donde la División 1 es el nivel más alto. La División 2 requiere evaluación del organizador 
            para ingresar.
          </p>
        </CardContent>
      </Card>

      {/* Lista de divisiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {divisiones.map((division) => (
          <Card key={division.id} className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {division.nombre}
                </CardTitle>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                  #{division.numero_division}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {division.descripcion && (
                <p className="text-gray-400 text-sm mb-4">{division.descripcion}</p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Inscripciones
                  </span>
                  <span className="text-white font-semibold">
                    {stats[division.id]?.inscripciones || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Partidos Jugados
                  </span>
                  <span className="text-white font-semibold">
                    {stats[division.id]?.partidosJugados || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDialog(division)}
                  className="flex-1 text-gray-400 hover:text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(division.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {divisiones.length === 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">No hay divisiones creadas</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera División
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingDivision ? 'Editar División' : 'Nueva División'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingDivision
                ? 'Modifica los datos de la división'
                : 'Completa los datos para crear una nueva división'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_division">Número de División</Label>
                  <Input
                    id="numero_division"
                    type="number"
                    min="1"
                    max="4"
                    value={formData.numero_division}
                    onChange={(e) => setFormData({ ...formData, numero_division: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                    disabled={!!editingDivision}
                  />
                  <p className="text-xs text-gray-500 mt-1">Entre 1 y 4</p>
                </div>
                <div>
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Orden de visualización</p>
                </div>
              </div>
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
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                  placeholder="Descripción de la división..."
                />
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
                {editingDivision ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}




