'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  PlayCircle,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Download,
  User,
  Calendar,
  MapPin,
  Trophy,
  Users,
  UserPlus,
  X
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { formatNombreJugador } from '@/lib/utils'

export default function PartidosPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [partidos, setPartidos] = useState([])
  const [etapas, setEtapas] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [filtros, setFiltros] = useState({
    etapa_id: 'all',
    division_id: 'all',
    estado: 'all',
    fecha_partido: '',
    busqueda: ''
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPartido, setEditingPartido] = useState(null)
  const [formData, setFormData] = useState({
    etapa_id: '',
    division_id: '',
    fecha_partido: new Date().toISOString().split('T')[0],
    jugador_a1_id: '',
    jugador_a2_id: '',
    jugador_b1_id: '',
    jugador_b2_id: '',
    jugador_a1_nombre: '',
    jugador_a2_nombre: '',
    jugador_b1_nombre: '',
    jugador_b2_nombre: '',
    cancha: '',
    lugar: '',
    horario: '',
    estado: 'pendiente',
    equipo_ganador: '',
    sets_equipo_a: 0,
    sets_equipo_b: 0,
    games_equipo_a: 0,
    games_equipo_b: 0,
    sets: [] // Array de sets: [{equipo_a: 6, equipo_b: 4}, ...]
  })
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])
  const [busquedaJugador, setBusquedaJugador] = useState('')
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null)
  const [campoJugadorActivo, setCampoJugadorActivo] = useState(null) // 'a1', 'a2', 'b1', 'b2'
  const [jugadoresPartido, setJugadoresPartido] = useState({
    a1: null,
    a2: null,
    b1: null,
    b2: null
  })
  const [modoManual, setModoManual] = useState({
    a1: false,
    a2: false,
    b1: false,
    b2: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchPartidos()
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
        .from('circuito3gen_etapas')
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
        .from('circuito3gen_divisiones')
        .select('*')
        .order('numero_division', { ascending: true })

      if (error) throw error
      setDivisiones(data || [])
    } catch (error) {
      console.error('Error fetching divisiones:', error)
    }
  }

  const fetchPartidos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filtros.etapa_id && filtros.etapa_id !== 'all') {
        params.append('etapa_id', filtros.etapa_id)
      }
      if (filtros.division_id && filtros.division_id !== 'all') {
        params.append('division_id', filtros.division_id)
      }
      if (filtros.estado && filtros.estado !== 'all') {
        params.append('estado', filtros.estado)
      }
      if (filtros.fecha_partido) {
        params.append('fecha_partido', filtros.fecha_partido)
      }

      const response = await fetch(`/api/circuito3gen/partidos?${params.toString()}`)
      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      let partidosFiltrados = result.data || []

      // Filtro de búsqueda por nombre de jugador (incluye nombres manuales)
      if (filtros.busqueda) {
        const busquedaLower = filtros.busqueda.toLowerCase()
        partidosFiltrados = partidosFiltrados.filter(partido => {
          const nombres = [
            partido.jugador_a1?.nombre,
            partido.jugador_a1?.apellido,
            partido.jugador_a2?.nombre,
            partido.jugador_a2?.apellido,
            partido.jugador_b1?.nombre,
            partido.jugador_b1?.apellido,
            partido.jugador_b2?.nombre,
            partido.jugador_b2?.apellido,
            partido.jugador_a1_nombre,
            partido.jugador_a2_nombre,
            partido.jugador_b1_nombre,
            partido.jugador_b2_nombre
          ].filter(Boolean).join(' ').toLowerCase()
          return nombres.includes(busquedaLower)
        })
      }

      setPartidos(partidosFiltrados)
    } catch (error) {
      console.error('Error fetching partidos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los partidos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const buscarJugadores = async (termino, divisionId, campoActual) => {
    if (!termino || termino.trim() === '' || termino.length < 2) {
      setJugadoresDisponibles([])
      return
    }

    try {
      // Si hay división seleccionada, buscar solo jugadores inscriptos en esa división
      let query = supabase
        .from('usuarios')
        .select('id, nombre, apellido, email, telefono')
        .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,email.ilike.%${termino}%`)
        .neq('rol', 'admin')
        .limit(20)

      if (divisionId && formData.etapa_id) {
        // Buscar jugadores inscriptos en esta etapa y división
        const { data: inscripciones } = await supabase
          .from('circuito3gen_inscripciones')
          .select('usuario_id')
          .eq('etapa_id', formData.etapa_id)
          .eq('division_id', divisionId)
          .eq('estado', 'activa')

        if (inscripciones && inscripciones.length > 0) {
          const userIds = inscripciones.map(i => i.usuario_id)
          query = query.in('id', userIds)
        } else {
          setJugadoresDisponibles([])
          return
        }
      }

      const { data, error } = await query

      if (error) throw error

      // Filtrar jugadores que ya están seleccionados en otros campos
      const jugadoresYaSeleccionados = [
        formData.jugador_a1_id,
        formData.jugador_a2_id,
        formData.jugador_b1_id,
        formData.jugador_b2_id
      ].filter(id => id && id !== formData[campoActual]) // Excluir el campo actual

      const jugadoresFiltrados = (data || []).filter(
        jugador => !jugadoresYaSeleccionados.includes(jugador.id)
      )

      setJugadoresDisponibles(jugadoresFiltrados)
    } catch (error) {
      console.error('Error buscando jugadores:', error)
      setJugadoresDisponibles([])
    }
  }

  // Función para calcular totales de games desde los sets
  const calcularTotalesGames = (sets) => {
    if (!sets || sets.length === 0) return { totalGamesA: 0, totalGamesB: 0 }
    const totalGamesA = sets.reduce((sum, set) => sum + (parseInt(set.equipo_a) || 0), 0)
    const totalGamesB = sets.reduce((sum, set) => sum + (parseInt(set.equipo_b) || 0), 0)
    return { totalGamesA, totalGamesB }
  }

  // Función para calcular sets ganados desde los sets
  const calcularSetsGanados = (sets) => {
    if (!sets || sets.length === 0) return { setsA: 0, setsB: 0 }
    let setsA = 0
    let setsB = 0
    sets.forEach(set => {
      const gamesA = parseInt(set.equipo_a) || 0
      const gamesB = parseInt(set.equipo_b) || 0
      if (gamesA > gamesB) setsA++
      else if (gamesB > gamesA) setsB++
    })
    return { setsA, setsB }
  }

  const seleccionarJugador = (jugador, campo) => {
    const key = campo === 'jugador_a1_id' ? 'a1' : campo === 'jugador_a2_id' ? 'a2' : campo === 'jugador_b1_id' ? 'b1' : 'b2'
    const nombreCampo = campo.replace('_id', '_nombre')
    
    // Limpiar nombre manual y establecer ID
    setFormData({ 
      ...formData, 
      [campo]: jugador.id,
      [nombreCampo]: '' // Limpiar nombre manual
    })
    setJugadoresPartido({ ...jugadoresPartido, [key]: jugador })
    setModoManual({ ...modoManual, [key]: false }) // Volver a modo búsqueda
    setBusquedaJugador('')
    setJugadoresDisponibles([])
    setCampoJugadorActivo(null)
  }

  const obtenerNombreJugadorInput = (campo) => {
    const key = campo === 'jugador_a1_id' ? 'a1' : campo === 'jugador_a2_id' ? 'a2' : campo === 'jugador_b1_id' ? 'b1' : 'b2'
    const nombreCampo = campo.replace('_id', '_nombre')
    
    // Si está en modo manual y el campo está activo, mostrar búsqueda
    if (campoJugadorActivo === campo && modoManual[key]) {
      return busquedaJugador
    }
    
    // Si está en modo manual y hay nombre manual, mostrarlo
    if (modoManual[key] && formData[nombreCampo]) {
      return formData[nombreCampo]
    }
    
    // Si está en modo búsqueda y el campo está activo, mostrar búsqueda
    if (campoJugadorActivo === campo && !modoManual[key]) {
      return busquedaJugador
    }
    
    // Si hay jugador seleccionado, mostrar su nombre
    if (jugadoresPartido[key]) {
      return `${jugadoresPartido[key].nombre} ${jugadoresPartido[key].apellido}`
    }
    
    return ''
  }
  
  const alternarModoManual = (campo) => {
    const key = campo === 'jugador_a1_id' ? 'a1' : campo === 'jugador_a2_id' ? 'a2' : campo === 'jugador_b1_id' ? 'b1' : 'b2'
    const nuevoModo = !modoManual[key]
    
    setModoManual({ ...modoManual, [key]: nuevoModo })
    
    // Limpiar datos cuando se cambia de modo
    if (nuevoModo) {
      // Cambiar a modo manual: limpiar ID y nombre de jugador
      const idCampo = campo
      const nombreCampo = campo.replace('_id', '_nombre')
      setFormData({
        ...formData,
        [idCampo]: '',
        [nombreCampo]: ''
      })
      setJugadoresPartido({ ...jugadoresPartido, [key]: null })
    } else {
      // Cambiar a modo búsqueda: limpiar nombre manual
      const nombreCampo = campo.replace('_id', '_nombre')
      setFormData({
        ...formData,
        [nombreCampo]: ''
      })
    }
    
    setBusquedaJugador('')
    setJugadoresDisponibles([])
  }

  const handleOpenDialog = (partido = null) => {
    if (partido) {
      setEditingPartido(partido)
      setJugadoresPartido({
        a1: partido.jugador_a1,
        a2: partido.jugador_a2,
        b1: partido.jugador_b1,
        b2: partido.jugador_b2
      })
      
      // Determinar modo manual basado en si hay nombre pero no ID
      setModoManual({
        a1: !partido.jugador_a1_id && !!partido.jugador_a1_nombre,
        a2: !partido.jugador_a2_id && !!partido.jugador_a2_nombre,
        b1: !partido.jugador_b1_id && !!partido.jugador_b1_nombre,
        b2: !partido.jugador_b2_id && !!partido.jugador_b2_nombre
      })
      
      // Parsear resultado_detallado si existe, o crear sets vacíos
      let sets = []
      if (partido.resultado_detallado && partido.resultado_detallado.sets) {
        sets = partido.resultado_detallado.sets
      } else if (partido.games_equipo_a > 0 || partido.games_equipo_b > 0) {
        // Si hay games pero no resultado_detallado, crear un set único con los totales
        // Esto es para compatibilidad con datos antiguos
        sets = [{ equipo_a: partido.games_equipo_a || 0, equipo_b: partido.games_equipo_b || 0 }]
      }
      
      setFormData({
        etapa_id: partido.etapa_id,
        division_id: partido.division_id,
        fecha_partido: partido.fecha_partido,
        jugador_a1_id: partido.jugador_a1_id || '',
        jugador_a2_id: partido.jugador_a2_id || '',
        jugador_b1_id: partido.jugador_b1_id || '',
        jugador_b2_id: partido.jugador_b2_id || '',
        jugador_a1_nombre: partido.jugador_a1_nombre || '',
        jugador_a2_nombre: partido.jugador_a2_nombre || '',
        jugador_b1_nombre: partido.jugador_b1_nombre || '',
        jugador_b2_nombre: partido.jugador_b2_nombre || '',
        cancha: partido.cancha || '',
        lugar: partido.lugar || '',
        horario: partido.horario || '',
        estado: partido.estado,
        equipo_ganador: partido.equipo_ganador || '',
        sets_equipo_a: partido.sets_equipo_a || 0,
        sets_equipo_b: partido.sets_equipo_b || 0,
        games_equipo_a: partido.games_equipo_a || 0,
        games_equipo_b: partido.games_equipo_b || 0,
        sets: sets
      })
    } else {
      setEditingPartido(null)
      setJugadoresPartido({
        a1: null,
        a2: null,
        b1: null,
        b2: null
      })
      setModoManual({
        a1: false,
        a2: false,
        b1: false,
        b2: false
      })
      setFormData({
        etapa_id: '',
        division_id: '',
        fecha_partido: new Date().toISOString().split('T')[0],
        jugador_a1_id: '',
        jugador_a2_id: '',
        jugador_b1_id: '',
        jugador_b2_id: '',
        jugador_a1_nombre: '',
        jugador_a2_nombre: '',
        jugador_b1_nombre: '',
        jugador_b2_nombre: '',
        cancha: '',
        lugar: '',
        horario: '',
        estado: 'pendiente',
        equipo_ganador: '',
        sets_equipo_a: 0,
        sets_equipo_b: 0,
        games_equipo_a: 0,
        games_equipo_b: 0,
        sets: []
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingPartido(null)
    setFormData({
      etapa_id: '',
      division_id: '',
      fecha_partido: new Date().toISOString().split('T')[0],
      jugador_a1_id: '',
      jugador_a2_id: '',
      jugador_b1_id: '',
      jugador_b2_id: '',
      jugador_a1_nombre: '',
      jugador_a2_nombre: '',
      jugador_b1_nombre: '',
      jugador_b2_nombre: '',
      cancha: '',
      horario: '',
      estado: 'pendiente',
      equipo_ganador: '',
      sets_equipo_a: 0,
      sets_equipo_b: 0,
      games_equipo_a: 0,
      games_equipo_b: 0,
      sets: []
    })
    setJugadorSeleccionado(null)
    setBusquedaJugador('')
    setCampoJugadorActivo(null)
    setJugadoresPartido({
      a1: null,
      a2: null,
      b1: null,
      b2: null
    })
    setModoManual({
      a1: false,
      a2: false,
      b1: false,
      b2: false
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para crear partidos',
          variant: 'destructive'
        })
        return
      }

      // Calcular totales de games y sets desde los sets individuales
      const { totalGamesA, totalGamesB } = calcularTotalesGames(formData.sets || [])
      const { setsA, setsB } = calcularSetsGanados(formData.sets || [])

      // Preparar el body con los datos calculados y resultado_detallado
      const bodyData = {
        ...formData,
        games_equipo_a: totalGamesA,
        games_equipo_b: totalGamesB,
        sets_equipo_a: setsA,
        sets_equipo_b: setsB,
        resultado_detallado: formData.sets && formData.sets.length > 0 
          ? { sets: formData.sets } 
          : null
      }

      // Remover el campo 'sets' del body ya que no existe en la BD
      delete bodyData.sets

      const url = editingPartido ? '/api/circuito3gen/partidos' : '/api/circuito3gen/partidos'
      const method = editingPartido ? 'PUT' : 'POST'

      const body = editingPartido
        ? { id: editingPartido.id, ...bodyData }
        : bodyData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast({
        title: 'Éxito',
        description: editingPartido ? 'Partido actualizado' : 'Partido creado'
      })

      handleCloseDialog()
      fetchPartidos()
    } catch (error) {
      console.error('Error saving partido:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el partido',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de cancelar este partido?')) return

    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para cancelar partidos',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch(`/api/circuito3gen/partidos?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast({
        title: 'Éxito',
        description: 'Partido cancelado'
      })

      fetchPartidos()
    } catch (error) {
      console.error('Error deleting partido:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cancelar el partido',
        variant: 'destructive'
      })
    }
  }

  const handleMarcarWO = async (partido, equipo) => {
    if (!confirm(`¿Marcar como WO (Walkover) para el equipo ${equipo}?`)) return

    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para marcar partidos como WO',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch('/api/circuito3gen/partidos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: partido.id,
          estado: 'WO',
          equipo_ganador: equipo === 'A' ? 'A' : 'B',
          sets_equipo_a: equipo === 'A' ? 2 : 0,
          sets_equipo_b: equipo === 'B' ? 2 : 0
        })
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      toast({
        title: 'Éxito',
        description: `Partido marcado como WO para equipo ${equipo}`
      })

      fetchPartidos()
    } catch (error) {
      console.error('Error marcando WO:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo marcar el partido como WO',
        variant: 'destructive'
      })
    }
  }

  const exportarCSV = () => {
    const headers = ['Fecha', 'Etapa', 'División', 'Equipo A (Jugador 1)', 'Equipo A (Jugador 2)', 'Equipo B (Jugador 1)', 'Equipo B (Jugador 2)', 'Estado', 'Ganador', 'Sets A', 'Sets B', 'Lugar', 'Cancha', 'Horario']
    const rows = partidos.map(p => [
      p.fecha_partido,
      p.etapa?.nombre || '',
      p.division?.nombre || '',
      `${p.jugador_a1?.nombre || ''} ${p.jugador_a1?.apellido || ''}`,
      `${p.jugador_a2?.nombre || ''} ${p.jugador_a2?.apellido || ''}`,
      `${p.jugador_b1?.nombre || ''} ${p.jugador_b1?.apellido || ''}`,
      `${p.jugador_b2?.nombre || ''} ${p.jugador_b2?.apellido || ''}`,
      p.estado,
      p.equipo_ganador || '',
      p.sets_equipo_a || 0,
      p.sets_equipo_b || 0,
      p.lugar === 'la_normanda' ? 'La normanda (Delgado 864)' : p.lugar === 'adr' ? 'ADR (Olleros 1515)' : '',
      p.cancha || '',
      p.horario || ''
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `partidos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { label: 'Pendiente', variant: 'secondary', icon: Clock },
      jugado: { label: 'Jugado', variant: 'default', icon: CheckCircle },
      cancelado: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
      WO: { label: 'WO', variant: 'outline', icon: XCircle }
    }
    const estadoInfo = estados[estado] || estados.pendiente
    const Icon = estadoInfo.icon
    return (
      <Badge variant={estadoInfo.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {estadoInfo.label}
      </Badge>
    )
  }

  const obtenerJugadorNombre = (jugador, nombreManual) => {
    const raw = nombreManual || (jugador ? `${jugador.nombre || ''} ${jugador.apellido || ''}`.trim() : '')
    return formatNombreJugador(raw) || 'N/A'
  }

  if (loading && partidos.length === 0) {
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
          <h1 className="text-3xl font-bold text-white">Partidos</h1>
          <p className="text-gray-400 mt-1">Gestiona los partidos del circuito</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportarCSV}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-yellow-500 text-black hover:bg-yellow-600"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Nuevo Partido
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-gray-400 mb-2 block">Etapa</Label>
              <Select
                value={filtros.etapa_id}
                onValueChange={(value) => setFiltros({ ...filtros, etapa_id: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Todas" />
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
                value={filtros.division_id}
                onValueChange={(value) => setFiltros({ ...filtros, division_id: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Todas" />
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
              <Label className="text-gray-400 mb-2 block">Estado</Label>
              <Select
                value={filtros.estado}
                onValueChange={(value) => setFiltros({ ...filtros, estado: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">Todos</SelectItem>
                  <SelectItem value="pendiente" className="text-white hover:bg-gray-700">Pendiente</SelectItem>
                  <SelectItem value="jugado" className="text-white hover:bg-gray-700">Jugado</SelectItem>
                  <SelectItem value="cancelado" className="text-white hover:bg-gray-700">Cancelado</SelectItem>
                  <SelectItem value="WO" className="text-white hover:bg-gray-700">WO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Fecha</Label>
              <Input
                type="date"
                value={filtros.fecha_partido}
                onChange={(e) => setFiltros({ ...filtros, fecha_partido: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Buscar jugador</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nombre o email..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Partidos */}
      <div className="grid gap-4">
        {partidos.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center">
              <PlayCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay partidos registrados</p>
            </CardContent>
          </Card>
        ) : (
          partidos.map((partido) => (
            <Card key={partido.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      {getEstadoBadge(partido.estado)}
                      <span className="text-gray-400 text-sm">
                        {partido.etapa?.nombre}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {partido.division?.nombre}
                      </span>
                      {partido.fecha_partido && (
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(partido.fecha_partido).toLocaleDateString('es-AR')}
                        </span>
                      )}
                      {partido.horario && (
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {partido.horario}
                        </span>
                      )}
                      {(partido.lugar || partido.cancha) && (
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {[
                            partido.lugar === 'la_normanda' && 'La normanda (Delgado 864)',
                            partido.lugar === 'adr' && 'ADR (Olleros 1515)',
                            partido.cancha && `Cancha ${partido.cancha}`
                          ].filter(Boolean).join(' - ')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Equipo A */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="font-semibold text-white">Equipo A</span>
                          {partido.equipo_ganador === 'A' && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="text-gray-300">
                            <User className="w-3 h-3 inline mr-1" />
                            {obtenerJugadorNombre(partido.jugador_a1, partido.jugador_a1_nombre)}
                            {partido.jugador_a1_nombre && (
                              <Badge variant="outline" className="ml-2 text-xs">No registrado</Badge>
                            )}
                          </div>
                          <div className="text-gray-300">
                            <User className="w-3 h-3 inline mr-1" />
                            {obtenerJugadorNombre(partido.jugador_a2, partido.jugador_a2_nombre)}
                            {partido.jugador_a2_nombre && (
                              <Badge variant="outline" className="ml-2 text-xs">No registrado</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Equipo B */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-red-400" />
                          <span className="font-semibold text-white">Equipo B</span>
                          {partido.equipo_ganador === 'B' && (
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="text-gray-300">
                            <User className="w-3 h-3 inline mr-1" />
                            {obtenerJugadorNombre(partido.jugador_b1, partido.jugador_b1_nombre)}
                            {partido.jugador_b1_nombre && (
                              <Badge variant="outline" className="ml-2 text-xs">No registrado</Badge>
                            )}
                          </div>
                          <div className="text-gray-300">
                            <User className="w-3 h-3 inline mr-1" />
                            {obtenerJugadorNombre(partido.jugador_b2, partido.jugador_b2_nombre)}
                            {partido.jugador_b2_nombre && (
                              <Badge variant="outline" className="ml-2 text-xs">No registrado</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resultado */}
                    {partido.estado === 'jugado' && (
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                        {/* Mostrar sets individuales si están disponibles en resultado_detallado */}
                        {partido.resultado_detallado && partido.resultado_detallado.sets && partido.resultado_detallado.sets.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-3 h-3 text-yellow-500" />
                              <span className="text-white font-semibold text-xs">Ganador: Equipo {partido.equipo_ganador}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                              {partido.resultado_detallado.sets.map((set, index) => {
                                const gamesA = set.equipo_a || 0
                                const gamesB = set.equipo_b || 0
                                const ganadorSet = gamesA > gamesB ? 'A' : gamesB > gamesA ? 'B' : null
                                const esGanador = ganadorSet === partido.equipo_ganador
                                
                                return (
                                  <div 
                                    key={index} 
                                    className={`flex items-center justify-between p-2 rounded border text-xs ${
                                      esGanador 
                                        ? 'bg-yellow-500/15 border-yellow-500/40' 
                                        : 'bg-gray-700/20 border-gray-600'
                                    }`}
                                  >
                                    <span className="text-gray-400 font-medium w-10">
                                      Set {index + 1}
                                    </span>
                                    <div className="flex items-center gap-2 flex-1 justify-center">
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-500 text-[10px]">A</span>
                                        <span className={`text-sm font-bold ${
                                          ganadorSet === 'A' ? 'text-yellow-500' : 'text-white'
                                        }`}>
                                          {gamesA}
                                        </span>
                                      </div>
                                      <span className="text-gray-500">-</span>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-sm font-bold ${
                                          ganadorSet === 'B' ? 'text-yellow-500' : 'text-white'
                                        }`}>
                                          {gamesB}
                                        </span>
                                        <span className="text-gray-500 text-[10px]">B</span>
                                      </div>
                                    </div>
                                    {ganadorSet && (
                                      <div className="w-6 text-right">
                                        <span className={`text-[10px] font-semibold ${
                                          esGanador ? 'text-yellow-500' : 'text-gray-400'
                                        }`}>
                                          {esGanador ? '✓' : ''}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          /* Mostrar solo totales si no hay sets individuales */
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Sets:</span>
                              <span className="text-white font-semibold">
                                {partido.sets_equipo_a || 0} - {partido.sets_equipo_b || 0}
                              </span>
                            </div>
                            {(partido.games_equipo_a > 0 || partido.games_equipo_b > 0) && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Games:</span>
                                <span className="text-white font-semibold">
                                  {partido.games_equipo_a || 0} - {partido.games_equipo_b || 0}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(partido)}
                      className="text-white hover:bg-gray-800"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    {partido.estado === 'pendiente' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarcarWO(partido, 'A')}
                          className="text-yellow-500 hover:bg-gray-800"
                        >
                          WO Equipo A
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarcarWO(partido, 'B')}
                          className="text-yellow-500 hover:bg-gray-800"
                        >
                          WO Equipo B
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(partido.id)}
                      className="text-red-400 hover:bg-gray-800"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog para crear/editar partido */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingPartido ? 'Editar Partido' : 'Nuevo Partido'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingPartido ? 'Modifica los datos del partido' : 'Crea un nuevo partido manualmente'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400 mb-2 block">Etapa *</Label>
                <Select
                  value={formData.etapa_id}
                  onValueChange={(value) => setFormData({ ...formData, etapa_id: value })}
                  required
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Seleccionar etapa" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
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
                  value={formData.division_id}
                  onValueChange={(value) => setFormData({ ...formData, division_id: value })}
                  required
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Seleccionar división" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
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
                  value={formData.fecha_partido}
                  onChange={(e) => setFormData({ ...formData, fecha_partido: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="pendiente" className="text-white hover:bg-gray-700">Pendiente</SelectItem>
                    <SelectItem value="jugado" className="text-white hover:bg-gray-700">Jugado</SelectItem>
                    <SelectItem value="cancelado" className="text-white hover:bg-gray-700">Cancelado</SelectItem>
                    <SelectItem value="WO" className="text-white hover:bg-gray-700">WO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Lugar</Label>
                <Select
                  value={formData.lugar || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, lugar: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Seleccionar lugar" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="none" className="text-white hover:bg-gray-700">Sin especificar</SelectItem>
                    <SelectItem value="la_normanda" className="text-white hover:bg-gray-700">La normanda (Delgado 864)</SelectItem>
                    <SelectItem value="adr" className="text-white hover:bg-gray-700">ADR (Olleros 1515)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Cancha</Label>
                <Input
                  value={formData.cancha}
                  onChange={(e) => setFormData({ ...formData, cancha: e.target.value })}
                  placeholder="Ej: Cancha 1"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Horario</Label>
                <Input
                  type="time"
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Jugadores */}
            <div className="border-t border-gray-800 pt-4">
              <h3 className="text-white font-semibold mb-4">Jugadores</h3>
              <div className="flex flex-row gap-6">
                {/* Equipo A */}
                <div className="flex-1">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-400 font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Equipo A
                    </h4>
                    
                    {/* Jugador A1 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-gray-400">Jugador 1 *</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => alternarModoManual('jugador_a1_id')}
                          className="text-xs text-gray-400 hover:text-white h-6 px-2"
                        >
                          {modoManual.a1 ? (
                            <>
                              <Search className="w-3 h-3 mr-1" />
                              Buscar
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              Nombre manual
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        {modoManual.a1 ? (
                          <>
                            <Input
                              placeholder="Ingresar nombre del jugador..."
                              value={formData.jugador_a1_nombre}
                              onChange={(e) => {
                                setFormData({ ...formData, jugador_a1_nombre: e.target.value })
                                setCampoJugadorActivo('jugador_a1_id')
                              }}
                              onFocus={() => setCampoJugadorActivo('jugador_a1_id')}
                              className="bg-gray-800 border-gray-700 text-white"
                              required
                            />
                          </>
                        ) : (
                          <>
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Buscar jugador..."
                              value={obtenerNombreJugadorInput('jugador_a1_id')}
                              onChange={(e) => {
                                setBusquedaJugador(e.target.value)
                                setCampoJugadorActivo('jugador_a1_id')
                                if (e.target.value.length >= 2) {
                                  buscarJugadores(e.target.value, formData.division_id, 'jugador_a1_id')
                                } else {
                                  setJugadoresDisponibles([])
                                }
                              }}
                              onFocus={() => {
                                setCampoJugadorActivo('jugador_a1_id')
                                if (jugadoresPartido.a1) {
                                  setBusquedaJugador(`${jugadoresPartido.a1.nombre} ${jugadoresPartido.a1.apellido}`)
                                } else {
                                  setBusquedaJugador('')
                                }
                              }}
                              className="bg-gray-800 border-gray-700 text-white pl-10"
                              required
                            />
                            {campoJugadorActivo === 'jugador_a1_id' && jugadoresDisponibles.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {jugadoresDisponibles.map((jugador) => (
                                  <div
                                    key={jugador.id}
                                    onClick={() => seleccionarJugador(jugador, 'jugador_a1_id')}
                                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                                  >
                                    <div className="font-medium text-white">
                                      {jugador.nombre} {jugador.apellido}
                                    </div>
                                    <div className="text-sm text-gray-400">{jugador.email}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Jugador A2 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-gray-400">Jugador 2 *</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => alternarModoManual('jugador_a2_id')}
                          className="text-xs text-gray-400 hover:text-white h-6 px-2"
                        >
                          {modoManual.a2 ? (
                            <>
                              <Search className="w-3 h-3 mr-1" />
                              Buscar
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              Nombre manual
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        {modoManual.a2 ? (
                          <>
                            <Input
                              placeholder="Ingresar nombre del jugador..."
                              value={formData.jugador_a2_nombre}
                              onChange={(e) => {
                                setFormData({ ...formData, jugador_a2_nombre: e.target.value })
                                setCampoJugadorActivo('jugador_a2_id')
                              }}
                              onFocus={() => setCampoJugadorActivo('jugador_a2_id')}
                              className="bg-gray-800 border-gray-700 text-white"
                              required
                            />
                          </>
                        ) : (
                          <>
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Buscar jugador..."
                              value={obtenerNombreJugadorInput('jugador_a2_id')}
                              onChange={(e) => {
                                setBusquedaJugador(e.target.value)
                                setCampoJugadorActivo('jugador_a2_id')
                                if (e.target.value.length >= 2) {
                                  buscarJugadores(e.target.value, formData.division_id, 'jugador_a2_id')
                                } else {
                                  setJugadoresDisponibles([])
                                }
                              }}
                              onFocus={() => {
                                setCampoJugadorActivo('jugador_a2_id')
                                if (jugadoresPartido.a2) {
                                  setBusquedaJugador(`${jugadoresPartido.a2.nombre} ${jugadoresPartido.a2.apellido}`)
                                } else {
                                  setBusquedaJugador('')
                                }
                              }}
                              className="bg-gray-800 border-gray-700 text-white pl-10"
                              required
                            />
                            {campoJugadorActivo === 'jugador_a2_id' && jugadoresDisponibles.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {jugadoresDisponibles.map((jugador) => (
                                  <div
                                    key={jugador.id}
                                    onClick={() => seleccionarJugador(jugador, 'jugador_a2_id')}
                                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                                  >
                                    <div className="font-medium text-white">
                                      {jugador.nombre} {jugador.apellido}
                                    </div>
                                    <div className="text-sm text-gray-400">{jugador.email}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equipo B */}
                <div className="flex-1">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Equipo B
                    </h4>
                    
                    {/* Jugador B1 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-gray-400">Jugador 1 *</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => alternarModoManual('jugador_b1_id')}
                          className="text-xs text-gray-400 hover:text-white h-6 px-2"
                        >
                          {modoManual.b1 ? (
                            <>
                              <Search className="w-3 h-3 mr-1" />
                              Buscar
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              Nombre manual
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        {modoManual.b1 ? (
                          <>
                            <Input
                              placeholder="Ingresar nombre del jugador..."
                              value={formData.jugador_b1_nombre}
                              onChange={(e) => {
                                setFormData({ ...formData, jugador_b1_nombre: e.target.value })
                                setCampoJugadorActivo('jugador_b1_id')
                              }}
                              onFocus={() => setCampoJugadorActivo('jugador_b1_id')}
                              className="bg-gray-800 border-gray-700 text-white"
                              required
                            />
                          </>
                        ) : (
                          <>
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Buscar jugador..."
                              value={obtenerNombreJugadorInput('jugador_b1_id')}
                              onChange={(e) => {
                                setBusquedaJugador(e.target.value)
                                setCampoJugadorActivo('jugador_b1_id')
                                if (e.target.value.length >= 2) {
                                  buscarJugadores(e.target.value, formData.division_id, 'jugador_b1_id')
                                } else {
                                  setJugadoresDisponibles([])
                                }
                              }}
                              onFocus={() => {
                                setCampoJugadorActivo('jugador_b1_id')
                                if (jugadoresPartido.b1) {
                                  setBusquedaJugador(`${jugadoresPartido.b1.nombre} ${jugadoresPartido.b1.apellido}`)
                                } else {
                                  setBusquedaJugador('')
                                }
                              }}
                              className="bg-gray-800 border-gray-700 text-white pl-10"
                              required
                            />
                            {campoJugadorActivo === 'jugador_b1_id' && jugadoresDisponibles.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {jugadoresDisponibles.map((jugador) => (
                                  <div
                                    key={jugador.id}
                                    onClick={() => seleccionarJugador(jugador, 'jugador_b1_id')}
                                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                                  >
                                    <div className="font-medium text-white">
                                      {jugador.nombre} {jugador.apellido}
                                    </div>
                                    <div className="text-sm text-gray-400">{jugador.email}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Jugador B2 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-gray-400">Jugador 2 *</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => alternarModoManual('jugador_b2_id')}
                          className="text-xs text-gray-400 hover:text-white h-6 px-2"
                        >
                          {modoManual.b2 ? (
                            <>
                              <Search className="w-3 h-3 mr-1" />
                              Buscar
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              Nombre manual
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        {modoManual.b2 ? (
                          <>
                            <Input
                              placeholder="Ingresar nombre del jugador..."
                              value={formData.jugador_b2_nombre}
                              onChange={(e) => {
                                setFormData({ ...formData, jugador_b2_nombre: e.target.value })
                                setCampoJugadorActivo('jugador_b2_id')
                              }}
                              onFocus={() => setCampoJugadorActivo('jugador_b2_id')}
                              className="bg-gray-800 border-gray-700 text-white"
                              required
                            />
                          </>
                        ) : (
                          <>
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Buscar jugador..."
                              value={obtenerNombreJugadorInput('jugador_b2_id')}
                              onChange={(e) => {
                                setBusquedaJugador(e.target.value)
                                setCampoJugadorActivo('jugador_b2_id')
                                if (e.target.value.length >= 2) {
                                  buscarJugadores(e.target.value, formData.division_id, 'jugador_b2_id')
                                } else {
                                  setJugadoresDisponibles([])
                                }
                              }}
                              onFocus={() => {
                                setCampoJugadorActivo('jugador_b2_id')
                                if (jugadoresPartido.b2) {
                                  setBusquedaJugador(`${jugadoresPartido.b2.nombre} ${jugadoresPartido.b2.apellido}`)
                                } else {
                                  setBusquedaJugador('')
                                }
                              }}
                              className="bg-gray-800 border-gray-700 text-white pl-10"
                              required
                            />
                            {campoJugadorActivo === 'jugador_b2_id' && jugadoresDisponibles.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {jugadoresDisponibles.map((jugador) => (
                                  <div
                                    key={jugador.id}
                                    onClick={() => seleccionarJugador(jugador, 'jugador_b2_id')}
                                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                                  >
                                    <div className="font-medium text-white">
                                      {jugador.nombre} {jugador.apellido}
                                    </div>
                                    <div className="text-sm text-gray-400">{jugador.email}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resultado (solo si está jugado) */}
            {formData.estado === 'jugado' && (
              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-white font-semibold mb-4">Resultado</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-400 mb-2 block">Equipo Ganador *</Label>
                    <Select
                      value={formData.equipo_ganador}
                      onValueChange={(value) => setFormData({ ...formData, equipo_ganador: value })}
                      required={formData.estado === 'jugado'}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="A" className="text-white hover:bg-gray-700">Equipo A</SelectItem>
                        <SelectItem value="B" className="text-white hover:bg-gray-700">Equipo B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sets individuales con games */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-gray-400">Sets del Partido</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSets = [...(formData.sets || []), { equipo_a: 0, equipo_b: 0 }]
                          setFormData({ ...formData, sets: newSets })
                        }}
                        className="text-gray-300 border-gray-600 hover:bg-gray-700"
                      >
                        + Agregar Set
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(formData.sets || []).map((set, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                          <span className="text-gray-400 text-sm font-medium w-16">Set {index + 1}</span>
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1">
                              <Label className="text-gray-400 text-xs mb-1 block">Equipo A</Label>
                              <Input
                                type="number"
                                min="0"
                                value={set.equipo_a || 0}
                                onChange={(e) => {
                                  const newSets = [...formData.sets]
                                  newSets[index] = { ...newSets[index], equipo_a: parseInt(e.target.value) || 0 }
                                  setFormData({ ...formData, sets: newSets })
                                }}
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </div>
                            <span className="text-gray-400 text-xl font-bold pt-5">-</span>
                            <div className="flex-1">
                              <Label className="text-gray-400 text-xs mb-1 block">Equipo B</Label>
                              <Input
                                type="number"
                                min="0"
                                value={set.equipo_b || 0}
                                onChange={(e) => {
                                  const newSets = [...formData.sets]
                                  newSets[index] = { ...newSets[index], equipo_b: parseInt(e.target.value) || 0 }
                                  setFormData({ ...formData, sets: newSets })
                                }}
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newSets = formData.sets.filter((_, i) => i !== index)
                                setFormData({ ...formData, sets: newSets })
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {(!formData.sets || formData.sets.length === 0) && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No hay sets agregados. Haz clic en "Agregar Set" para comenzar.
                        </div>
                      )}
                    </div>

                    {/* Totales calculados automáticamente */}
                    {(formData.sets && formData.sets.length > 0) && (
                      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Sets Totales:</span>
                            <span className="text-white font-semibold ml-2">
                              {calcularSetsGanados(formData.sets).setsA} - {calcularSetsGanados(formData.sets).setsB}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Games Totales:</span>
                            <span className="text-white font-semibold ml-2">
                              {calcularTotalesGames(formData.sets).totalGamesA} - {calcularTotalesGames(formData.sets).totalGamesB}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                {editingPartido ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

