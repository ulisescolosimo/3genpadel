'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Shuffle,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  PlayCircle,
  UserPlus,
  Trash2,
  Eye,
  Save
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

export default function SorteosPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [etapas, setEtapas] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [jugadoresInscriptos, setJugadoresInscriptos] = useState([])
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])
  const [parejasFormadas, setParejasFormadas] = useState([])
  const [partidosSorteados, setPartidosSorteados] = useState([])
  const [filtros, setFiltros] = useState({
    etapa_id: 'all',
    division_id: 'all',
    fecha_partido: new Date().toISOString().split('T')[0]
  })
  const [busquedaJugador, setBusquedaJugador] = useState('')
  const [jugadoresResultados, setJugadoresResultados] = useState([])
  const [ejecutandoSorteo, setEjecutandoSorteo] = useState(false)
  const [mostrandoResultado, setMostrandoResultado] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (filtros.etapa_id !== 'all' && filtros.division_id !== 'all' && filtros.fecha_partido) {
      fetchJugadoresInscriptos()
      fetchParejasExistentes()
      fetchPartidosExistentes()
    }
  }, [filtros])

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

  const fetchJugadoresInscriptos = async () => {
    try {
      const { data, error } = await supabase
        .from('circuitooka_inscripciones')
        .select(`
          usuario_id,
          usuario:usuarios!circuitooka_inscripciones_usuario_id_fkey (
            id,
            nombre,
            apellido,
            email
          )
        `)
        .eq('etapa_id', filtros.etapa_id)
        .eq('division_id', filtros.division_id)
        .eq('estado', 'activa')

      if (error) throw error

      const jugadores = (data || [])
        .map(inscripcion => inscripcion.usuario)
        .filter(usuario => usuario !== null)

      setJugadoresInscriptos(jugadores)
    } catch (error) {
      console.error('Error fetching jugadores inscriptos:', error)
    }
  }

  const fetchParejasExistentes = async () => {
    try {
      const params = new URLSearchParams()
      params.append('etapa_id', filtros.etapa_id)
      params.append('division_id', filtros.division_id)
      params.append('fecha_partido', filtros.fecha_partido)

      const response = await fetch(`/api/circuitooka/parejas?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setParejasFormadas(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching parejas:', error)
    }
  }

  const fetchPartidosExistentes = async () => {
    try {
      const params = new URLSearchParams()
      params.append('etapa_id', filtros.etapa_id)
      params.append('division_id', filtros.division_id)
      params.append('fecha_partido', filtros.fecha_partido)

      const response = await fetch(`/api/circuitooka/partidos?${params.toString()}`)
      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        setMostrandoResultado(true)
        setPartidosSorteados(result.data)
      }
    } catch (error) {
      console.error('Error fetching partidos:', error)
    }
  }

  const buscarJugadores = async (termino) => {
    if (!termino || termino.length < 2) {
      setJugadoresResultados([])
      return
    }

    try {
      const terminoLower = termino.toLowerCase()
      const jugadoresFiltrados = jugadoresInscriptos.filter(jugador => {
        const nombre = `${jugador.nombre || ''} ${jugador.apellido || ''}`.toLowerCase()
        const email = (jugador.email || '').toLowerCase()
        return nombre.includes(terminoLower) || email.includes(terminoLower)
      })

      // Excluir jugadores ya agregados
      const idsDisponibles = jugadoresDisponibles.map(j => j.id)
      const jugadoresDisponiblesFiltrados = jugadoresFiltrados.filter(
        j => !idsDisponibles.includes(j.id)
      )

      setJugadoresResultados(jugadoresDisponiblesFiltrados.slice(0, 10))
    } catch (error) {
      console.error('Error buscando jugadores:', error)
    }
  }

  const agregarJugadorDisponible = (jugador) => {
    if (!jugadoresDisponibles.find(j => j.id === jugador.id)) {
      setJugadoresDisponibles([...jugadoresDisponibles, jugador])
      setBusquedaJugador('')
      setJugadoresResultados([])
    }
  }

  const eliminarJugadorDisponible = (jugadorId) => {
    setJugadoresDisponibles(jugadoresDisponibles.filter(j => j.id !== jugadorId))
  }

  const ejecutarSorteo = async () => {
    if (filtros.etapa_id === 'all' || filtros.division_id === 'all' || !filtros.fecha_partido) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar etapa, división y fecha',
        variant: 'destructive'
      })
      return
    }

    if (jugadoresDisponibles.length < 4) {
      toast({
        title: 'Error',
        description: 'Se necesitan al menos 4 jugadores disponibles para realizar un sorteo',
        variant: 'destructive'
      })
      return
    }

    try {
      setEjecutandoSorteo(true)

      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para ejecutar el sorteo',
          variant: 'destructive'
        })
        return
      }

      // Ejecutar sorteo de un solo partido
      const response = await fetch('/api/circuitooka/sorteos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          etapa_id: filtros.etapa_id,
          division_id: filtros.division_id,
          fecha_partido: filtros.fecha_partido,
          jugadores_disponibles: jugadoresDisponibles.map(j => j.id),
          un_partido: true // Indicar que queremos sortear solo un partido
        })
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast({
        title: 'Éxito',
        description: `Partido sorteado correctamente. Se generó 1 partido con 2 parejas formadas.`
      })

      setMostrandoResultado(true)
      
      // Recargar parejas y partidos desde la base de datos para obtener datos completos
      await fetchParejasExistentes()
      await fetchPartidosExistentes()
    } catch (error) {
      console.error('Error ejecutando sorteo:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo ejecutar el sorteo',
        variant: 'destructive'
      })
    } finally {
      setEjecutandoSorteo(false)
    }
  }

  const obtenerNombreJugador = (jugador) => {
    if (!jugador) return 'N/A'
    return `${jugador.nombre || ''} ${jugador.apellido || ''}`.trim() || jugador.email || 'N/A'
  }

  const obtenerNombrePareja = (pareja) => {
    const jugador1 = obtenerNombreJugador(pareja.jugador_1)
    const jugador2 = obtenerNombreJugador(pareja.jugador_2)
    return `${jugador1} / ${jugador2}`
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
          <h1 className="text-3xl font-bold text-white">Sorteos de Partidos</h1>
          <p className="text-gray-400 mt-1">Gestiona los sorteos de partidos para cada fecha</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Configuración del Sorteo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-400 mb-2 block">Etapa *</Label>
              <Select
                value={filtros.etapa_id}
                onValueChange={(value) => setFiltros({ ...filtros, etapa_id: value })}
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
              <Label className="text-gray-400 mb-2 block">División *</Label>
              <Select
                value={filtros.division_id}
                onValueChange={(value) => setFiltros({ ...filtros, division_id: value })}
                disabled={filtros.etapa_id === 'all'}
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
            <div>
              <Label className="text-gray-400 mb-2 block">Fecha del Partido *</Label>
              <Input
                type="date"
                value={filtros.fecha_partido}
                onChange={(e) => setFiltros({ ...filtros, fecha_partido: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jugadores Disponibles */}
      {filtros.etapa_id !== 'all' && filtros.division_id !== 'all' && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Jugadores Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Búsqueda de jugadores */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar jugador por nombre o email..."
                  value={busquedaJugador}
                  onChange={(e) => {
                    setBusquedaJugador(e.target.value)
                    buscarJugadores(e.target.value)
                  }}
                  className="bg-gray-800 border-gray-700 text-white pl-10"
                />
                {busquedaJugador && jugadoresResultados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {jugadoresResultados.map((jugador) => (
                      <button
                        key={jugador.id}
                        onClick={() => agregarJugadorDisponible(jugador)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{obtenerNombreJugador(jugador)}</div>
                          <div className="text-sm text-gray-400">{jugador.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista de jugadores disponibles */}
              {jugadoresDisponibles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {jugadoresDisponibles.map((jugador) => (
                    <div
                      key={jugador.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-white font-medium">{obtenerNombreJugador(jugador)}</div>
                          <div className="text-sm text-gray-400">{jugador.email}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarJugadorDisponible(jugador.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay jugadores disponibles seleccionados</p>
                  <p className="text-sm mt-1">Busca y agrega jugadores que estén disponibles para esta fecha</p>
                </div>
              )}

              {/* Botón ejecutar sorteo */}
              {jugadoresDisponibles.length >= 4 && (
                <div className="flex justify-end">
                  <Button
                    onClick={ejecutarSorteo}
                    disabled={ejecutandoSorteo}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    {ejecutandoSorteo ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sorteando Partido...
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-4 h-4 mr-2" />
                        Sortear un Partido
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Información sobre jugadores disponibles */}
              {jugadoresDisponibles.length >= 4 && (
                <div className="mt-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <strong className="text-white">{jugadoresDisponibles.length}</strong> jugadores disponibles
                    {jugadoresDisponibles.length >= 4 && (
                      <span className="text-green-400 ml-2">
                        • Puedes sortear {Math.floor(jugadoresDisponibles.length / 4)} partido{Math.floor(jugadoresDisponibles.length / 4) !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cada vez que ejecutes el sorteo, se generará un partido con 4 jugadores seleccionados aleatoriamente
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parejas Formadas */}
      {parejasFormadas.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Parejas Formadas ({parejasFormadas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {parejasFormadas.map((pareja, index) => (
                <div
                  key={pareja.id || index}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={pareja.tipo_formacion === 'elegida_por_jugadores' ? 'default' : 'secondary'}
                      className={
                        pareja.tipo_formacion === 'elegida_por_jugadores'
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white'
                      }
                    >
                      {pareja.tipo_formacion === 'elegida_por_jugadores' ? 'Elegida' : 'Asignada'}
                    </Badge>
                  </div>
                  <div className="text-white">
                    <div className="font-medium">{obtenerNombrePareja(pareja)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado del Sorteo */}
      {mostrandoResultado && partidosSorteados.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Partidos Generados ({partidosSorteados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {partidosSorteados.map((partido, index) => (
                <div
                  key={partido.id || index}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-gray-300 border-gray-600">
                      Partido {index + 1}
                    </Badge>
                    <Badge
                      variant={
                        partido.estado === 'jugado'
                          ? 'default'
                          : partido.estado === 'cancelado'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {partido.estado || 'pendiente'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Equipo A</div>
                      <div className="text-white">
                        {partido.jugador_a1?.nombre && partido.jugador_a1?.apellido
                          ? `${partido.jugador_a1.nombre} ${partido.jugador_a1.apellido}`
                          : 'N/A'} / {' '}
                        {partido.jugador_a2?.nombre && partido.jugador_a2?.apellido
                          ? `${partido.jugador_a2.nombre} ${partido.jugador_a2.apellido}`
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Equipo B</div>
                      <div className="text-white">
                        {partido.jugador_b1?.nombre && partido.jugador_b1?.apellido
                          ? `${partido.jugador_b1.nombre} ${partido.jugador_b1.apellido}`
                          : 'N/A'} / {' '}
                        {partido.jugador_b2?.nombre && partido.jugador_b2?.apellido
                          ? `${partido.jugador_b2.nombre} ${partido.jugador_b2.apellido}`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {partido.cancha && (
                    <div className="mt-3 text-sm text-gray-400">
                      Cancha: {partido.cancha} {partido.horario && `- ${partido.horario}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay resultados */}
      {filtros.etapa_id !== 'all' && filtros.division_id !== 'all' && 
       jugadoresDisponibles.length === 0 && parejasFormadas.length === 0 && !mostrandoResultado && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <Shuffle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Selecciona jugadores disponibles y ejecuta un sorteo</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

