'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Trophy,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

export default function AscensosDescensosPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [etapas, setEtapas] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [etapaSeleccionada, setEtapaSeleccionada] = useState('all')
  const [divisionSeleccionada, setDivisionSeleccionada] = useState('all')
  const [datosAscensosDescensos, setDatosAscensosDescensos] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [resumenProcesamiento, setResumenProcesamiento] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (etapaSeleccionada !== 'all' && divisionSeleccionada !== 'all') {
      fetchAscensosDescensos()
    } else {
      setDatosAscensosDescensos(null)
    }
  }, [etapaSeleccionada, divisionSeleccionada])

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

  const fetchAscensosDescensos = async () => {
    try {
      setCargando(true)
      const params = new URLSearchParams()
      params.append('etapa_id', etapaSeleccionada)
      params.append('division_id', divisionSeleccionada)

      const response = await fetch(`/api/circuitooka/ascensos-descensos?${params.toString()}`)
      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setDatosAscensosDescensos(result.data)
    } catch (error) {
      console.error('Error fetching ascensos/descensos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de ascensos/descensos',
        variant: 'destructive'
      })
    } finally {
      setCargando(false)
    }
  }

  const handleProcesar = async () => {
    if (etapaSeleccionada === 'all') {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una etapa',
        variant: 'destructive'
      })
      return
    }

    if (!confirm('¿Estás seguro de procesar los ascensos y descensos para esta etapa? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setProcesando(true)

      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para procesar ascensos/descensos',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch('/api/circuitooka/ascensos-descensos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          etapa_id: etapaSeleccionada
        })
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setResumenProcesamiento(result.data)
      setIsDialogOpen(true)

      toast({
        title: 'Éxito',
        description: 'Ascensos y descensos procesados correctamente'
      })

      // Recargar datos si hay una división seleccionada
      if (divisionSeleccionada !== 'all') {
        fetchAscensosDescensos()
      }
    } catch (error) {
      console.error('Error procesando ascensos/descensos:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron procesar los ascensos/descensos',
        variant: 'destructive'
      })
    } finally {
      setProcesando(false)
    }
  }

  const obtenerNombreJugador = (usuario) => {
    if (!usuario) return 'N/A'
    return `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'N/A'
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
          <h1 className="text-3xl font-bold text-white">Ascensos y Descensos</h1>
          <p className="text-gray-400 mt-1">Gestiona los movimientos entre divisiones al finalizar una etapa</p>
        </div>
        {etapaSeleccionada !== 'all' && (
          <Button
            onClick={handleProcesar}
            disabled={procesando}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            {procesando ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Procesar Ascensos/Descensos
              </>
            )}
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400 mb-2 block">Etapa *</Label>
              <Select
                value={etapaSeleccionada}
                onValueChange={(value) => {
                  setEtapaSeleccionada(value)
                  setDivisionSeleccionada('all')
                  setDatosAscensosDescensos(null)
                }}
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
            <div>
              <Label className="text-gray-400 mb-2 block">División</Label>
              <Select
                value={divisionSeleccionada}
                onValueChange={(value) => setDivisionSeleccionada(value)}
                disabled={etapaSeleccionada === 'all'}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Seleccionar división" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">Todas</SelectItem>
                  {divisiones.map((division) => (
                    <SelectItem key={division.id} value={division.id} className="text-white hover:bg-gray-700">
                      {division.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa */}
      {etapaSeleccionada !== 'all' && divisionSeleccionada !== 'all' && (
        <>
          {cargando ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Spinner />
            </div>
          ) : datosAscensosDescensos ? (
            <div className="space-y-6">
              {/* Cupos */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Cupos Calculados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Jugadores Inscriptos</div>
                      <div className="text-2xl font-bold text-white">
                        {datosAscensosDescensos.cupos?.jugadores_inscriptos || 0}
                      </div>
                    </div>
                    <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                      <div className="text-green-400 text-sm mb-1 flex items-center gap-1">
                        <ArrowUp className="w-4 h-4" />
                        Cupos de Ascenso
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        {datosAscensosDescensos.cupos?.cupos_ascenso || 0}
                      </div>
                    </div>
                    <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                      <div className="text-red-400 text-sm mb-1 flex items-center gap-1">
                        <ArrowDown className="w-4 h-4" />
                        Cupos de Descenso
                      </div>
                      <div className="text-2xl font-bold text-red-400">
                        {datosAscensosDescensos.cupos?.cupos_descenso || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Jugadores que Ascienden */}
              {datosAscensosDescensos.jugadores_ascenso && datosAscensosDescensos.jugadores_ascenso.length > 0 && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Jugadores que Ascienden ({datosAscensosDescensos.jugadores_ascenso.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {datosAscensosDescensos.jugadores_ascenso.map((ranking, index) => (
                        <div
                          key={ranking.id || index}
                          className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {obtenerNombreJugador(ranking.usuario)}
                              </div>
                              <div className="text-gray-400 text-sm">
                                Promedio: {ranking.promedio_final?.toFixed(2) || '0.00'} • 
                                Posición: {ranking.posicion_ranking || '-'}
                              </div>
                            </div>
                          </div>
                          <Badge variant="default" className="bg-green-600 text-white">
                            <ArrowUp className="w-3 h-3 mr-1" />
                            Ascenso
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Jugadores que Descienden */}
              {datosAscensosDescensos.jugadores_descenso && datosAscensosDescensos.jugadores_descenso.length > 0 && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      Jugadores que Descienden ({datosAscensosDescensos.jugadores_descenso.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {datosAscensosDescensos.jugadores_descenso.map((ranking, index) => (
                        <div
                          key={ranking.id || index}
                          className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {obtenerNombreJugador(ranking.usuario)}
                              </div>
                              <div className="text-gray-400 text-sm">
                                Promedio: {ranking.promedio_final?.toFixed(2) || '0.00'} • 
                                Posición: {ranking.posicion_ranking || '-'}
                              </div>
                            </div>
                          </div>
                          <Badge variant="destructive">
                            <ArrowDown className="w-3 h-3 mr-1" />
                            Descenso
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Jugadores en Playoff */}
              {datosAscensosDescensos.jugadores_playoff && (
                <>
                  {(datosAscensosDescensos.jugadores_playoff.playoff_ascenso?.length > 0 || 
                    datosAscensosDescensos.jugadores_playoff.playoff_descenso?.length > 0) && (
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          Jugadores en Playoff
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {datosAscensosDescensos.jugadores_playoff.playoff_ascenso?.length > 0 && (
                            <div>
                              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                <ArrowUp className="w-4 h-4 text-green-400" />
                                Playoff de Ascenso ({datosAscensosDescensos.jugadores_playoff.playoff_ascenso.length})
                              </h4>
                              <div className="space-y-2">
                                {datosAscensosDescensos.jugadores_playoff.playoff_ascenso.map((ranking, index) => (
                                  <div
                                    key={ranking.id || index}
                                    className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center text-black font-bold text-xs">
                                      {index + 1}
                                    </div>
                                    <div className="text-white">
                                      {obtenerNombreJugador(ranking.usuario)}
                                    </div>
                                    <div className="text-gray-400 text-sm ml-auto">
                                      Promedio: {ranking.promedio_final?.toFixed(2) || '0.00'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {datosAscensosDescensos.jugadores_playoff.playoff_descenso?.length > 0 && (
                            <div>
                              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                <ArrowDown className="w-4 h-4 text-red-400" />
                                Playoff de Descenso ({datosAscensosDescensos.jugadores_playoff.playoff_descenso.length})
                              </h4>
                              <div className="space-y-2">
                                {datosAscensosDescensos.jugadores_playoff.playoff_descenso.map((ranking, index) => (
                                  <div
                                    key={ranking.id || index}
                                    className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center text-black font-bold text-xs">
                                      {index + 1}
                                    </div>
                                    <div className="text-white">
                                      {obtenerNombreJugador(ranking.usuario)}
                                    </div>
                                    <div className="text-gray-400 text-sm ml-auto">
                                      Promedio: {ranking.promedio_final?.toFixed(2) || '0.00'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Mensaje si no hay datos */}
              {(!datosAscensosDescensos.jugadores_ascenso || datosAscensosDescensos.jugadores_ascenso.length === 0) &&
               (!datosAscensosDescensos.jugadores_descenso || datosAscensosDescensos.jugadores_descenso.length === 0) && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No hay jugadores para ascenso o descenso en esta división</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Selecciona una etapa y una división para ver los ascensos/descensos</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog de Resumen de Procesamiento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Resumen de Procesamiento</DialogTitle>
            <DialogDescription className="text-gray-400">
              Cambios aplicados a la etapa
            </DialogDescription>
          </DialogHeader>

          {resumenProcesamiento && (
            <div className="space-y-4">
              {resumenProcesamiento.ascensos && resumenProcesamiento.ascensos.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Ascensos ({resumenProcesamiento.ascensos.length})
                  </h3>
                  <div className="space-y-2">
                    {resumenProcesamiento.ascensos.map((ascenso, index) => (
                      <div key={index} className="text-sm">
                        <span className="text-white font-medium">
                          {obtenerNombreJugador(ascenso.jugador)}
                        </span>
                        <span className="text-gray-400 ml-2">
                          División {ascenso.division_origen} → División {ascenso.division_destino}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resumenProcesamiento.descensos && resumenProcesamiento.descensos.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    Descensos ({resumenProcesamiento.descensos.length})
                  </h3>
                  <div className="space-y-2">
                    {resumenProcesamiento.descensos.map((descenso, index) => (
                      <div key={index} className="text-sm">
                        <span className="text-white font-medium">
                          {obtenerNombreJugador(descenso.jugador)}
                        </span>
                        <span className="text-gray-400 ml-2">
                          División {descenso.division_origen} → División {descenso.division_destino}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resumenProcesamiento.playoffs && resumenProcesamiento.playoffs.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    Playoffs Identificados
                  </h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    {resumenProcesamiento.playoffs.map((playoff, index) => (
                      <div key={index}>
                        División {playoff.division}: {playoff.playoff_ascenso?.length || 0} jugadores para playoff de ascenso, {playoff.playoff_descenso?.length || 0} para descenso
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}








