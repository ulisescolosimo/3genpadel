'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Settings,
  Save,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target
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
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [etapas, setEtapas] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [etapaSeleccionada, setEtapaSeleccionada] = useState('all')
  const [configuraciones, setConfiguraciones] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [formData, setFormData] = useState({
    etapa_id: '',
    division_id: 'general',
    cupos_ascenso_porcentaje: 20,
    cupos_ascenso_minimo: 2,
    cupos_ascenso_maximo: 10,
    jugadores_playoff_por_division: 4,
    horario_turno_noche_inicio: '20:00',
    horario_turno_noche_fin: '23:00'
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (etapaSeleccionada !== 'all') {
      fetchConfiguraciones()
    } else {
      setConfiguraciones([])
    }
  }, [etapaSeleccionada])

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
        .from('circuitooka_etapas')
        .select('*')
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
        .from('circuitooka_divisiones')
        .select('*')
        .order('numero_division', { ascending: true })

      if (error) throw error
      setDivisiones(data || [])
    } catch (error) {
      console.error('Error fetching divisiones:', error)
    }
  }

  const fetchConfiguraciones = async () => {
    try {
      const { data, error } = await supabase
        .from('circuitooka_configuracion')
        .select(`
          *,
          division:circuitooka_divisiones (
            id,
            nombre,
            numero_division
          )
        `)
        .eq('etapa_id', etapaSeleccionada)
        .order('division_id', { ascending: true, nullsFirst: false })

      if (error) throw error
      setConfiguraciones(data || [])
    } catch (error) {
      console.error('Error fetching configuraciones:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones',
        variant: 'destructive'
      })
    }
  }

  const handleCrearEditar = (config = null) => {
    if (config) {
      setEditingConfig(config)
      setFormData({
        etapa_id: config.etapa_id,
        division_id: config.division_id || 'general',
        cupos_ascenso_porcentaje: config.cupos_ascenso_porcentaje || 20,
        cupos_ascenso_minimo: config.cupos_ascenso_minimo || 2,
        cupos_ascenso_maximo: config.cupos_ascenso_maximo || 10,
        jugadores_playoff_por_division: config.jugadores_playoff_por_division || 4,
        horario_turno_noche_inicio: config.horario_turno_noche_inicio || '20:00',
        horario_turno_noche_fin: config.horario_turno_noche_fin || '23:00'
      })
    } else {
      setEditingConfig(null)
      setFormData({
        etapa_id: etapaSeleccionada,
        division_id: 'general',
        cupos_ascenso_porcentaje: 20,
        cupos_ascenso_minimo: 2,
        cupos_ascenso_maximo: 10,
        jugadores_playoff_por_division: 4,
        horario_turno_noche_inicio: '20:00',
        horario_turno_noche_fin: '23:00'
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para guardar la configuración',
          variant: 'destructive'
        })
        return
      }

      const configData = {
        etapa_id: formData.etapa_id,
        division_id: formData.division_id === 'general' || !formData.division_id ? null : formData.division_id,
        cupos_ascenso_porcentaje: parseInt(formData.cupos_ascenso_porcentaje),
        cupos_ascenso_minimo: parseInt(formData.cupos_ascenso_minimo),
        cupos_ascenso_maximo: parseInt(formData.cupos_ascenso_maximo),
        jugadores_playoff_por_division: parseInt(formData.jugadores_playoff_por_division),
        horario_turno_noche_inicio: formData.horario_turno_noche_inicio,
        horario_turno_noche_fin: formData.horario_turno_noche_fin
      }

      if (editingConfig) {
        // Actualizar
        const { error } = await supabase
          .from('circuitooka_configuracion')
          .update(configData)
          .eq('id', editingConfig.id)

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Configuración actualizada correctamente'
        })
      } else {
        // Crear
        const { error } = await supabase
          .from('circuitooka_configuracion')
          .insert(configData)

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Configuración creada correctamente'
        })
      }

      setIsDialogOpen(false)
      fetchConfiguraciones()
    } catch (error) {
      console.error('Error saving configuracion:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la configuración',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (configId) => {
    if (!confirm('¿Estás seguro de eliminar esta configuración?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('circuitooka_configuracion')
        .delete()
        .eq('id', configId)

      if (error) throw error

      toast({
        title: 'Éxito',
        description: 'Configuración eliminada correctamente'
      })

      fetchConfiguraciones()
    } catch (error) {
      console.error('Error deleting configuracion:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la configuración',
        variant: 'destructive'
      })
    }
  }

  const obtenerConfigGeneral = () => {
    return configuraciones.find(c => !c.division_id)
  }

  const obtenerConfigDivision = (divisionId) => {
    return configuraciones.find(c => c.division_id === divisionId)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuración</h1>
          <p className="text-gray-400 mt-1">Gestiona la configuración de cupos y playoffs por etapa y división</p>
        </div>
      </div>

      {/* Filtro de Etapa */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Seleccionar Etapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label className="text-gray-400 mb-2 block">Etapa *</Label>
            <Select
              value={etapaSeleccionada}
              onValueChange={(value) => setEtapaSeleccionada(value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Seleccionar etapa" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-700">Todas</SelectItem>
                {etapas.map((etapa) => (
                  <SelectItem key={etapa.id} value={etapa.id} className="text-white hover:bg-gray-700">
                    {etapa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Configuraciones */}
      {etapaSeleccionada !== 'all' && (
        <div className="space-y-6">
          {/* Configuración General */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración General de la Etapa
                </CardTitle>
                <Button
                  onClick={() => {
                    const configGeneral = obtenerConfigGeneral()
                    handleCrearEditar(configGeneral || null)
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  {obtenerConfigGeneral() ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {obtenerConfigGeneral() ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Cupos Ascenso/Descenso %</div>
                    <div className="text-xl font-bold text-white">
                      {obtenerConfigGeneral().cupos_ascenso_porcentaje}%
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Mínimo / Máximo Ascenso/Descenso</div>
                    <div className="text-xl font-bold text-white">
                      {obtenerConfigGeneral().cupos_ascenso_minimo} / {obtenerConfigGeneral().cupos_ascenso_maximo}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Jugadores Playoff</div>
                    <div className="text-xl font-bold text-white">
                      {obtenerConfigGeneral().jugadores_playoff_por_division}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay configuración general. Crea una para establecer valores por defecto.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuraciones por División */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Configuraciones por División
                </CardTitle>
                <Button
                  onClick={() => handleCrearEditar(null)}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Configuración
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {divisiones.map((division) => {
                  const configDivision = obtenerConfigDivision(division.id)
                  return (
                    <div
                      key={division.id}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold">
                            {division.numero_division}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{division.nombre}</div>
                            <div className="text-gray-400 text-sm">{division.descripcion || 'Sin descripción'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {configDivision ? (
                            <>
                              <Badge variant="default" className="bg-green-600 text-white">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Configurada
                              </Badge>
                              <Button
                                onClick={() => handleCrearEditar(configDivision)}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(configDivision.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline" className="border-gray-600 text-gray-400">
                                Usa configuración general
                              </Badge>
                              <Button
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    etapa_id: etapaSeleccionada,
                                    division_id: division.id
                                  })
                                  handleCrearEditar(null)
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-gray-700"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {configDivision && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-700">
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Cupos Ascenso/Descenso %</div>
                            <div className="text-white font-semibold">
                              {configDivision.cupos_ascenso_porcentaje}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Mín / Máx Ascenso/Descenso</div>
                            <div className="text-white font-semibold">
                              {configDivision.cupos_ascenso_minimo} / {configDivision.cupos_ascenso_maximo}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Playoff</div>
                            <div className="text-white font-semibold">
                              {configDivision.jugadores_playoff_por_division}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Turno Noche</div>
                            <div className="text-white font-semibold text-xs">
                              {configDivision.horario_turno_noche_inicio} - {configDivision.horario_turno_noche_fin}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog de Crear/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              {editingConfig ? 'Editar Configuración' : 'Nueva Configuración'}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              {formData.division_id && formData.division_id !== 'general'
                ? `Configuración específica para ${divisiones.find(d => d.id === formData.division_id)?.nombre}`
                : 'Configuración general de la etapa (se usará como fallback si no hay configuración por división)'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* División */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <Label className="text-white font-semibold mb-3 block text-base">División</Label>
              <Select
                value={formData.division_id}
                onValueChange={(value) => setFormData({ ...formData, division_id: value })}
                disabled={!!editingConfig}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-11">
                  <SelectValue placeholder="Seleccionar división (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="general" className="text-white hover:bg-gray-700">
                    General (para toda la etapa)
                  </SelectItem>
                  {divisiones.map((division) => (
                    <SelectItem key={division.id} value={division.id} className="text-white hover:bg-gray-700">
                      {division.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-2">
                Deja "General" para configuración de toda la etapa, o selecciona una división para configuración específica
              </p>
            </div>

            {/* Cupos de Ascenso/Descenso */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <Label className="text-white font-semibold mb-4 block text-base">Cupos de Ascenso y Descenso</Label>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300 mb-2 block font-medium">
                    Porcentaje (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.cupos_ascenso_porcentaje}
                    onChange={(e) => setFormData({ ...formData, cupos_ascenso_porcentaje: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white h-11 text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    % de jugadores que ascienden/descienden. Se calcula primero, luego se aplican los límites.
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block font-medium">
                    Mínimo
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.cupos_ascenso_minimo}
                    onChange={(e) => setFormData({ ...formData, cupos_ascenso_minimo: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white h-11 text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Límite inferior. Ej: 10 jugadores × 15% = 1.5 → se aplica mínimo 2.
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block font-medium">
                    Máximo
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.cupos_ascenso_maximo}
                    onChange={(e) => setFormData({ ...formData, cupos_ascenso_maximo: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white h-11 text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Límite superior. Ej: 50 jugadores × 15% = 7.5 → se aplica máximo 4.
                  </p>
                </div>
              </div>
            </div>

            {/* Playoffs y Horarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Playoffs */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <Label className="text-white font-semibold mb-3 block text-base">
                  Jugadores Playoff por División
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jugadores_playoff_por_division}
                  onChange={(e) => setFormData({ ...formData, jugadores_playoff_por_division: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white h-11 text-lg font-semibold"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Cantidad de jugadores que participan en playoffs de ascenso/descenso
                </p>
              </div>

              {/* Horarios Turno Noche */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <Label className="text-white font-semibold mb-3 block text-base">
                  Horario Turno Noche
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-300 mb-2 block text-sm font-medium">Inicio</Label>
                    <Input
                      type="time"
                      value={formData.horario_turno_noche_inicio}
                      onChange={(e) => setFormData({ ...formData, horario_turno_noche_inicio: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block text-sm font-medium">Fin</Label>
                    <Input
                      type="time"
                      value={formData.horario_turno_noche_fin}
                      onChange={(e) => setFormData({ ...formData, horario_turno_noche_fin: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white h-11"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Rango horario para identificar partidos del turno nocturno
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 h-11"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

