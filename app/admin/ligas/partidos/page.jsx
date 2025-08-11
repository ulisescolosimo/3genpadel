"use client"

/**
 * Página de administración de partidos de ligas
 * 
 * Funcionalidades principales:
 * - Crear, editar y eliminar partidos
 * - Selección específica de jugadores ganadores (T1, T2, S1, S2)
 * - Asignación de puntos solo a jugadores seleccionados
 * - Visualización detallada de los 4 jugadores por equipo
 * - Integración con ranking_jugadores para puntos por categoría
 * 
 * Cambios implementados:
 * - Mostrar los 4 jugadores inscriptos por equipo (titular 1, titular 2, suplente 1, suplente 2)
 * - Permitir seleccionar específicamente qué jugadores ganaron
 * - Asignar puntos solo a los jugadores seleccionados
 * - Vincular correctamente con ranking_jugadores
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Users, Calendar, Eye, CheckCircle, XCircle, Clock, Search, RefreshCw, Plus, Edit, Trash2, Award, Filter, BarChart3, Activity, Target, Gamepad2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { handleRankingProfile } from '@/lib/ranking-utils'
import Link from 'next/link'

// Función de utilidad para formatear fechas
const formatearFecha = (fecha) => {
  if (!fecha) return null
  
  try {
    const fechaObj = new Date(fecha)
    return {
      fecha: fechaObj.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      }),
      hora: fechaObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  } catch (error) {
    console.error('Error formateando fecha:', error)
    return null
  }
}

// Componente para estado vacío
const EmptyState = ({ searchTerm, filterCategoria, filterEstado }) => {
  const tieneFiltros = searchTerm || filterCategoria !== 'all' || filterEstado !== 'all'
  
  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="pt-8 pb-8 text-center">
        <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <Gamepad2 className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No se encontraron partidos</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          {tieneFiltros 
            ? 'Intenta ajustar los filtros de búsqueda'
            : 'Crea el primer partido para comenzar'
          }
        </p>
      </CardContent>
    </Card>
  )
}

// Componente para renderizar un partido individual
const PartidoCard = ({ 
  partido, 
  onEdit, 
  onDelete, 
  onSetWinner, 
  getEquipoNombre, 
  getCategoriaNombre, 
  getEstadoBadge 
}) => {
  // Memoizar cálculos costosos
  const equipoANombre = getEquipoNombre(partido.equipo_a)
  const equipoBNombre = getEquipoNombre(partido.equipo_b)
  const categoriaNombre = getCategoriaNombre(partido)
  const fechaFormateada = formatearFecha(partido.fecha)
  // Solo mostrar ganador si el partido está jugado Y tiene un equipo ganador asignado
  const ganadorNombre = (partido.estado === 'jugado' && partido.equipo_ganador_id && partido.equipo_ganador) 
    ? getEquipoNombre(partido.equipo_ganador) 
    : null
  const necesitaGanador = partido.estado === 'jugado' && !partido.equipo_ganador_id
  const esPendiente = partido.estado === 'pendiente'

  return (
    <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <CardContent className="p-6">
        {/* Header con badges - Mobile responsive */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" className="text-[#E2FF1B] border-[#E2FF1B]/30 bg-[#E2FF1B]/10">
            {partido.ronda}
          </Badge>
          {getEstadoBadge(partido.estado)}
          <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">
            {categoriaNombre}
          </span>
        </div>

        {/* Layout responsive para equipos y fecha */}
        <div className="space-y-4">
          {/* Equipos y VS - Mobile first */}
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Equipo A */}
            <div className={`text-center p-3 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center ${
              ganadorNombre && partido.equipo_ganador_id === partido.equipo_a?.id 
                ? "bg-[#E2FC1D]" 
                : "bg-gray-800/30"
            }`}>
              <p className={`font-medium text-sm sm:text-base ${
                ganadorNombre && partido.equipo_ganador_id === partido.equipo_a?.id 
                  ? "text-black" 
                  : "text-white"
              }`}>Equipo A</p>
              <div className={`text-xs sm:text-sm mt-1 leading-tight ${
                ganadorNombre && partido.equipo_ganador_id === partido.equipo_a?.id 
                  ? "text-black" 
                  : "text-gray-300"
              }`}>
                <div className="space-y-1">
                  {partido.equipo_a?.titular_1?.apellido && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">T1</span>
                      <span>{partido.equipo_a.titular_1.apellido}</span>
                    </div>
                  )}
                  {partido.equipo_a?.titular_2?.apellido && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">T2</span>
                      <span>{partido.equipo_a.titular_2.apellido}</span>
                    </div>
                  )}
                  {partido.equipo_a?.suplente_1?.apellido && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded">S1</span>
                      <span>{partido.equipo_a.suplente_1.apellido}</span>
                    </div>
                  )}
                  {partido.equipo_a?.suplente_2?.apellido && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded">S2</span>
                      <span>{partido.equipo_a.suplente_2.apellido}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VS y Fecha - Centrado */}
            <div className="text-center flex flex-col items-center justify-center order-first sm:order-none">
              <div className="bg-[#E2FF1B]/20 rounded-full p-2 mb-2">
                <p className="font-bold text-[#E2FF1B] text-lg sm:text-xl">VS</p>
              </div>
              {fechaFormateada ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs sm:text-sm text-[#E2FF1B] font-medium">
                    {fechaFormateada.fecha}
                  </span>
                  <span className="text-xs text-gray-400">
                    {fechaFormateada.hora}
                  </span>
                  {partido.cancha && (
                    <span className="text-xs text-blue-400 font-medium">
                      Cancha {partido.cancha}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-500">Fecha por definir</span>
              )}
            </div>

            {/* Equipo B */}
            <div className={`text-center p-3 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center ${
              ganadorNombre && partido.equipo_ganador_id === partido.equipo_b?.id 
                ? "bg-[#E2FC1D]" 
                : "bg-gray-800/30"
            }`}>
              <p className={`font-medium text-sm sm:text-base ${
                ganadorNombre && partido.equipo_ganador_id === partido.equipo_b?.id 
                  ? "text-black" 
                  : "text-white"
              }`}>Equipo B</p>
              <div className={`text-xs sm:text-sm mt-1 leading-tight ${
                ganadorNombre && partido.equipo_ganador_id === partido.equipo_b?.id 
                  ? "text-black" 
                  : "text-gray-300"
              }`}>
                <div className="space-y-1">
                  {partido.equipo_b?.titular_1?.apellido && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">T1</span>
                      <span>{partido.equipo_b.titular_1.apellido}</span>
                    </div>
                  )}
                  {partido.equipo_b?.titular_2?.apellido && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">T2</span>
                      <span>{partido.equipo_b.titular_2.apellido}</span>
                    </div>
                  )}
                  {partido.equipo_b?.suplente_1?.apellido && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded">S1</span>
                      <span>{partido.equipo_b.suplente_1.apellido}</span>
                    </div>
                  )}
                  {partido.equipo_b?.suplente_2?.apellido && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded">S2</span>
                      <span>{partido.equipo_b.suplente_2.apellido}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Categoría en mobile */}
          <div className="sm:hidden">
            <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
              {categoriaNombre}
            </span>
          </div>

          {/* Ganador */}
          {ganadorNombre && (
            <div className="text-center">
              <Badge 
                variant="default" 
                className="flex items-center gap-1 mx-auto w-fit text-black font-bold bg-[#E2FC1D] mb-2"
              >
                <Award className="h-3 w-3" />
                Ganador: {ganadorNombre}
                <span className="ml-1">(+{partido.puntos_por_jugador} pts)</span>
              </Badge>
              
              {/* Mostrar jugadores del equipo ganador */}
              <div className="text-xs text-gray-300 space-y-1">
                <p className="text-[#E2FF1B] font-medium">Jugadores del equipo ganador:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {partido.equipo_ganador?.titular_1?.apellido && (
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[10px]">
                      T1: {partido.equipo_ganador.titular_1.apellido}
                    </span>
                  )}
                  {partido.equipo_ganador?.titular_2?.apellido && (
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[10px]">
                      T2: {partido.equipo_ganador.titular_2.apellido}
                    </span>
                  )}
                  {partido.equipo_ganador?.suplente_1?.apellido && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px]">
                      S1: {partido.equipo_ganador.suplente_1.apellido}
                    </span>
                  )}
                  {partido.equipo_ganador?.suplente_2?.apellido && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px]">
                      S2: {partido.equipo_ganador.suplente_2.apellido}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resultado */}
          {partido.resultado && (
            <div className="text-center">
              <Badge 
                variant="outline" 
                className="flex items-center gap-1 mx-auto w-fit text-green-400 border-green-400/30"
              >
                <span className="text-xs">Resultado: {partido.resultado}</span>
              </Badge>
            </div>
          )}


        </div>

        {/* Botones de acción - Responsive */}
        <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-4 pt-4 border-t border-gray-800/50">
          {necesitaGanador && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetWinner(partido)}
              className="border-[#E2FF1B]/30 text-[#E2FF1B] hover:bg-[#E2FF1B]/10 text-xs sm:text-sm"
              title="Establecer ganador"
            >
              <Award className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(partido)}
            className="border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm"
            title="Editar partido"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(partido)}
            className="border-red-400/30 text-red-400 hover:bg-red-400/10 text-xs sm:text-sm"
            title="Eliminar partido"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminLigasPartidosPage() {
  const { toast } = useToast()
  const [partidos, setPartidos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterCategoria, setFilterCategoria] = useState('all')
  const [filterEstado, setFilterEstado] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPartido, setEditingPartido] = useState(null)
  const [selectedPartido, setSelectedPartido] = useState(null)
  const [selectedJugadores, setSelectedJugadores] = useState([])
  const [showJugadoresSelection, setShowJugadoresSelection] = useState(false)
  const [formData, setFormData] = useState({
    liga_categoria_id: '',
    ronda: '',
    equipo_a_id: '',
    equipo_b_id: '',
    equipo_ganador_id: '',
    jugadores_ganadores: [],
    puntos_por_jugador: '',
    fecha: '',
    estado: 'pendiente',
    cancha: '',
    resultado: ''
  })

  const rondas = ['Grupos', 'Octavos', 'Cuartos', 'Semifinal', 'Final']
  const estados = ['pendiente', 'jugado', 'cancelado']
  const canchas = [1, 2, 3]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
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

      // Obtener inscripciones aprobadas
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('ligainscripciones')
        .select(`
          id,
          liga_categoria_id,
          titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
            id,
            nombre,
            apellido
          ),
          titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
            id,
            nombre,
            apellido
          ),
          suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
            id,
            nombre,
            apellido
          ),
          suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
            id,
            nombre,
            apellido
          )
        `)
        .eq('estado', 'aprobada')
        .order('created_at', { ascending: false })

      if (inscripcionesError) throw inscripcionesError
      setInscripciones(inscripcionesData || [])

      // Obtener partidos
      await fetchPartidos()
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

  const fetchPartidos = async () => {
    try {
      const { data, error } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            ligas (
              id,
              nombre,
              fecha_inicio
            )
          ),
          equipo_a:ligainscripciones!liga_partidos_equipo_a_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            ),
            suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
              id,
              nombre,
              apellido
            )
          ),
          equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            ),
            suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
              id,
              nombre,
              apellido
            )
          ),
          equipo_ganador:ligainscripciones!liga_partidos_equipo_ganador_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            ),
            suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
              id,
              nombre,
              apellido
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPartidos(data || [])
    } catch (error) {
      console.error('Error fetching partidos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los partidos",
        variant: "destructive"
      })
    }
  }

  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'N/A'
    
    const jugadores = []
    
    if (equipo.titular_1?.apellido) {
      jugadores.push(`${equipo.titular_1.apellido} (T1)`)
    }
    if (equipo.titular_2?.apellido) {
      jugadores.push(`${equipo.titular_2.apellido} (T2)`)
    }
    if (equipo.suplente_1?.apellido) {
      jugadores.push(`${equipo.suplente_1.apellido} (S1)`)
    }
    if (equipo.suplente_2?.apellido) {
      jugadores.push(`${equipo.suplente_2.apellido} (S2)`)
    }
    
    return jugadores.length > 0 ? jugadores.join(' & ') : 'N/A'
  }

  const getCategoriaNombre = (partido) => {
    const categoria = categorias.find(cat => cat.id === partido.liga_categoria_id)
    if (!categoria) return 'N/A'
    return `${categoria.ligas?.nombre || 'N/A'} - ${categoria.categoria}`
  }

  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'secondary',
      jugado: 'default',
      cancelado: 'destructive'
    }
    return <Badge variant={variants[estado]}>{estado}</Badge>
  }

  // Función auxiliar para obtener solo titulares de un equipo (para selección de equipo ganador)
  const getTitularesEquipo = (equipo) => {
    const jugadores = []
    
    if (equipo.titular_1?.id) {
      jugadores.push({
        id: equipo.titular_1.id,
        nombre: equipo.titular_1.nombre,
        apellido: equipo.titular_1.apellido,
        tipo: 'Titular 1',
        rol: 'T1',
        color: 'bg-blue-500/20 text-blue-400'
      })
    }
    
    if (equipo.titular_2?.id) {
      jugadores.push({
        id: equipo.titular_2.id,
        nombre: equipo.titular_2.nombre,
        apellido: equipo.titular_2.apellido,
        tipo: 'Titular 2',
        rol: 'T2',
        color: 'bg-blue-500/20 text-blue-400'
      })
    }
    
    return jugadores
  }

  // Función auxiliar para obtener todos los jugadores de un equipo
  const getJugadoresEquipo = (equipo) => {
    const jugadores = []
    
    if (equipo.titular_1?.id) {
      jugadores.push({
        id: equipo.titular_1.id,
        nombre: equipo.titular_1.nombre,
        apellido: equipo.titular_1.apellido,
        tipo: 'Titular 1',
        rol: 'T1',
        color: 'bg-blue-500/20 text-blue-400'
      })
    }
    
    if (equipo.titular_2?.id) {
      jugadores.push({
        id: equipo.titular_2.id,
        nombre: equipo.titular_2.nombre,
        apellido: equipo.titular_2.apellido,
        tipo: 'Titular 2',
        rol: 'T2',
        color: 'bg-blue-500/20 text-blue-400'
      })
    }
    
    if (equipo.suplente_1?.id) {
      jugadores.push({
        id: equipo.suplente_1.id,
        nombre: equipo.suplente_1.nombre,
        apellido: equipo.suplente_1.apellido,
        tipo: 'Suplente 1',
        rol: 'S1',
        color: 'bg-green-500/20 text-green-400'
      })
    }
    
    if (equipo.suplente_2?.id) {
      jugadores.push({
        id: equipo.suplente_2.id,
        nombre: equipo.suplente_2.nombre,
        apellido: equipo.suplente_2.apellido,
        tipo: 'Suplente 2',
        rol: 'S2',
        color: 'bg-green-500/20 text-green-400'
      })
    }
    
    return jugadores
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      liga_categoria_id: '',
      ronda: '',
      equipo_a_id: '',
      equipo_b_id: '',
      equipo_ganador_id: '',
      jugadores_ganadores: [],
      puntos_por_jugador: '',
      fecha: '',
      estado: 'pendiente',
      cancha: '',
      resultado: ''
    })
    setEditingPartido(null)
    setShowCreateForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Crear la fecha respetando la zona horaria local
      let fechaISO = null
      if (formData.fecha) {
        // Crear la fecha en la zona horaria local
        const [fecha, hora] = formData.fecha.split('T')
        const fechaLocal = new Date(`${fecha}T${hora}:00`)
        // Convertir a ISO string manteniendo la zona horaria local
        const offset = fechaLocal.getTimezoneOffset() * 60000
        fechaISO = new Date(fechaLocal.getTime() - offset).toISOString()
      }

      // Validar puntos por jugador
      if (!formData.puntos_por_jugador || parseInt(formData.puntos_por_jugador) <= 0) {
        toast({
          title: "Error",
          description: "Los puntos por jugador deben ser mayores a 0",
          variant: "destructive"
        })
        return
      }

      // Validar que si hay equipo ganador, se seleccionen los jugadores
      if (formData.equipo_ganador_id && formData.equipo_ganador_id !== 'none' && formData.estado === 'jugado') {
        if (!formData.jugadores_ganadores || formData.jugadores_ganadores.length !== 2) {
          toast({
            title: "Error",
            description: "Debes seleccionar exactamente 2 jugadores del equipo ganador",
            variant: "destructive"
          })
          return
        }
      }

      const partidoData = {
        ...formData,
        liga_categoria_id: parseInt(formData.liga_categoria_id),
        equipo_a_id: parseInt(formData.equipo_a_id),
        equipo_b_id: parseInt(formData.equipo_b_id),
        equipo_ganador_id: formData.equipo_ganador_id && formData.equipo_ganador_id !== 'none' ? parseInt(formData.equipo_ganador_id) : null,
        jugadores_ganadores: formData.jugadores_ganadores || null,
        puntos_por_jugador: parseInt(formData.puntos_por_jugador),
        fecha: fechaISO,
        cancha: formData.cancha ? parseInt(formData.cancha) : null,
        resultado: formData.resultado || null
      }

      if (editingPartido) {
        // Si estamos editando y hay un cambio en el ganador o jugadores, manejar los puntos
        if (editingPartido.equipo_ganador_id !== partidoData.equipo_ganador_id || 
            JSON.stringify(editingPartido.jugadores_ganadores) !== JSON.stringify(formData.jugadores_ganadores)) {
          
          // Si había un ganador anterior, restar sus puntos
          if (editingPartido.equipo_ganador_id && editingPartido.estado === 'jugado') {
            await handleRemovePreviousWinnerPoints(editingPartido)
          }
          
          // Si hay un nuevo ganador y jugadores seleccionados, asignar puntos
          // SOLO si el estado es 'jugado' y hay un cambio real
          if (partidoData.equipo_ganador_id && 
              formData.jugadores_ganadores?.length === 2 && 
              partidoData.estado === 'jugado' &&
              (editingPartido.equipo_ganador_id !== partidoData.equipo_ganador_id || 
               !editingPartido.jugadores_ganadores || 
               editingPartido.jugadores_ganadores.length === 0)) {
            
            console.log('🔍 DEBUG: Asignando puntos por cambio de ganador')
            console.log('Puntos por jugador:', partidoData.puntos_por_jugador)
            console.log('Jugadores ganadores:', formData.jugadores_ganadores)
            
            const categoriaPartido = await getCategoriaFromPartido(editingPartido.id)
            if (categoriaPartido) {
              for (const jugadorId of formData.jugadores_ganadores) {
                const { data: userData } = await supabase
                  .from('usuarios')
                  .select('id, nombre, apellido')
                  .eq('id', jugadorId)
                  .single()
                
                if (userData) {
                  console.log(`🎯 Asignando ${partidoData.puntos_por_jugador} puntos a ${userData.nombre} ${userData.apellido}`)
                  await handleRankingProfile(userData, partidoData.puntos_por_jugador, categoriaPartido)
                }
              }
            }
          } else {
            console.log('🔍 DEBUG: No se asignaron puntos - condiciones no cumplidas')
            console.log('Estado:', partidoData.estado)
            console.log('Equipo ganador:', partidoData.equipo_ganador_id)
            console.log('Jugadores ganadores:', formData.jugadores_ganadores)
          }
        }

        const { error } = await supabase
          .from('liga_partidos')
          .update(partidoData)
          .eq('id', editingPartido.id)

        if (error) throw error

        toast({
          title: "Partido actualizado",
          description: "El partido se actualizó correctamente",
          variant: "default"
        })
      } else {
        const { error } = await supabase
          .from('liga_partidos')
          .insert([partidoData])

        if (error) throw error

        toast({
          title: "Partido creado",
          description: "El partido se creó correctamente",
          variant: "default"
        })
      }

      resetForm()
      fetchPartidos()
    } catch (error) {
      console.error('Error saving partido:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el partido",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (partido) => {
    setEditingPartido(partido)
    
    // Manejar la fecha correctamente para la zona horaria local
    let fechaFormateada = ''
    if (partido.fecha) {
      const fechaLocal = new Date(partido.fecha)
      const year = fechaLocal.getFullYear()
      const month = String(fechaLocal.getMonth() + 1).padStart(2, '0')
      const day = String(fechaLocal.getDate()).padStart(2, '0')
      const hours = String(fechaLocal.getHours()).padStart(2, '0')
      const minutes = String(fechaLocal.getMinutes()).padStart(2, '0')
      fechaFormateada = `${year}-${month}-${day}T${hours}:${minutes}`
    }

         setFormData({
       liga_categoria_id: partido.liga_categoria_id.toString(),
       ronda: partido.ronda,
       equipo_a_id: partido.equipo_a_id.toString(),
       equipo_b_id: partido.equipo_b_id.toString(),
       equipo_ganador_id: partido.equipo_ganador_id?.toString() || 'none',
       jugadores_ganadores: partido.jugadores_ganadores || [],
       puntos_por_jugador: partido.puntos_por_jugador,
       fecha: fechaFormateada,
       estado: partido.estado,
       cancha: partido.cancha?.toString() || '',
       resultado: partido.resultado || ''
     })
    setShowCreateForm(true)
  }

  const handleDelete = async (partido) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este partido?')) return

    try {
      const updates = []

      // Si el partido tenía un ganador, restar sus puntos antes de eliminar
      if (partido.equipo_ganador_id && partido.estado === 'jugado') {
        const { data: equipoGanadorData, error: equipoError } = await supabase
          .from('ligainscripciones')
          .select(`
            id,
            titular_1_id,
            titular_2_id
          `)
          .eq('id', partido.equipo_ganador_id)
          .single()

        // Los puntos ahora se manejan solo en ranking_jugadores, no en usuarios.ranking_puntos
      }

      // Ejecutar las actualizaciones de puntos si las hay
      if (updates.length > 0) {
        const updateResults = await Promise.all(updates)
        const errors = updateResults.filter(result => result.error)
        if (errors.length > 0) {
          console.error('Errores al restar puntos:', errors)
          throw new Error('Error al restar puntos de los jugadores')
        }
      }

      // Eliminar el partido
      const { error } = await supabase
        .from('liga_partidos')
        .delete()
        .eq('id', partido.id)

      if (error) throw error

      const mensaje = "El partido se eliminó correctamente"

      toast({
        title: "Partido eliminado",
        description: mensaje,
        variant: "default"
      })

      fetchPartidos()
    } catch (error) {
      console.error('Error deleting partido:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el partido",
        variant: "destructive"
      })
    }
  }

  const handleSetWinner = (partido) => {
    setSelectedPartido(partido)
    setSelectedJugadores([])
    setShowJugadoresSelection(true)
  }

  // Función para selección de ganador con selección específica de jugadores
  const handleWinnerSelection = async (equipoId) => {
    if (!selectedPartido || selectedJugadores.length !== 2) {
      toast({
        title: "Error",
        description: "Debes seleccionar exactamente 2 jugadores",
        variant: "destructive"
      })
      return
    }

    try {
      const nuevoGanadorId = parseInt(equipoId)
      const puntos = selectedPartido.puntos_por_jugador
      
      if (!puntos || puntos <= 0) {
        toast({
          title: "Error",
          description: "El partido debe tener puntos por jugador configurados",
          variant: "destructive"
        })
        return
      }

      // Paso 1: Si hay un ganador anterior, restar sus puntos antes de asignar los nuevos
      if (selectedPartido.equipo_ganador_id && selectedPartido.equipo_ganador_id !== nuevoGanadorId) {
        await handleRemovePreviousWinnerPoints(selectedPartido)
      }

      const updates = []

      // Paso 2: Actualizar el partido
      const { error: updateError } = await supabase
        .from('liga_partidos')
        .update({ 
          equipo_ganador_id: nuevoGanadorId,
          estado: 'jugado'
        })
        .eq('id', selectedPartido.id)

      if (updateError) throw updateError

      // Paso 3: Obtener equipo ganador con información de todos los jugadores
      const { data: equipoGanadorData, error: equipoError } = await supabase
        .from('ligainscripciones')
        .select(`
          id,
          titular_1_id,
          titular_2_id,
          suplente_1_id,
          suplente_2_id
        `)
        .eq('id', nuevoGanadorId)
        .single()

      if (equipoError) throw equipoError

      // Paso 4: Sumar puntos solo a los jugadores seleccionados
      const categoriaPartido = selectedPartido.liga_categorias?.categoria
      
      // Procesar cada jugador seleccionado
      for (const jugadorId of selectedJugadores) {
        // Obtener datos del usuario
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('id, nombre, apellido')
          .eq('id', jugadorId)
          .single()

        if (!userError && userData) {
          // Los puntos ahora se manejan solo en ranking_jugadores
          
          // Usar la nueva función helper para manejar ranking_jugadores
          if (categoriaPartido) {
            try {
              const result = await handleRankingProfile(userData, puntos, categoriaPartido)
              console.log(`Perfil de ranking ${result.created ? 'creado' : 'actualizado'} para ${userData.nombre} ${userData.apellido}`)
            } catch (error) {
              console.error(`Error procesando perfil de ranking para ${userData.nombre} ${userData.apellido}:`, error)
              // Continuar con otros jugadores aunque falle uno
            }
          }
        }
      }

      // Ejecutar todas las actualizaciones
      if (updates.length > 0) {
        const updateResults = await Promise.all(updates)
        
        // Verificar si hubo errores en las actualizaciones
        const errors = updateResults.filter(result => result.error)
        if (errors.length > 0) {
          console.error('Errores al actualizar puntos:', errors)
          throw new Error('Error al actualizar puntos de los jugadores')
        }
      }

      // Mensaje personalizado según si se cambió el ganador o se estableció por primera vez
      const mensaje = selectedPartido.equipo_ganador_id && selectedPartido.equipo_ganador_id !== nuevoGanadorId
        ? `Se cambió el ganador del partido. Se sumaron ${puntos} puntos a los jugadores seleccionados (${categoriaPartido}).`
        : `Se estableció el ganador del partido y se sumaron ${puntos} puntos a los jugadores seleccionados (${categoriaPartido}).`

      toast({
        title: "Ganador establecido",
        description: mensaje,
        variant: "default"
      })

      setShowJugadoresSelection(false)
      setSelectedPartido(null)
      setSelectedJugadores([])
      fetchPartidos()
    } catch (error) {
      console.error('Error setting winner:', error)
      toast({
        title: "Error",
        description: "No se pudo establecer el ganador ni actualizar puntos",
        variant: "destructive"
      })
    }
  }

  // Función para eliminar puntos del ganador anterior si existe
  const handleRemovePreviousWinnerPoints = async (partido) => {
    try {
      const { data: equipoGanadorData, error: equipoError } = await supabase
        .from('ligainscripciones')
        .select(`
          id,
          titular_1_id,
          titular_2_id,
          suplente_1_id,
          suplente_2_id
        `)
        .eq('id', partido.equipo_ganador_id)
        .single()

      if (equipoError) {
        console.error('Error al obtener datos del equipo ganador anterior:', equipoError)
        return
      }

      const jugadoresIds = [
        equipoGanadorData.titular_1_id,
        equipoGanadorData.titular_2_id,
        equipoGanadorData.suplente_1_id,
        equipoGanadorData.suplente_2_id
      ].filter(Boolean)

      const updates = []
      for (const jugadorId of jugadoresIds) {
        if (jugadorId) {
          // Los puntos ahora se manejan solo en ranking_jugadores, no en usuarios.ranking_puntos
        }
      }

      if (updates.length > 0) {
        const updateResults = await Promise.all(updates)
        const errors = updateResults.filter(result => result.error)
        if (errors.length > 0) {
          console.error('Errores al restar puntos del ganador anterior:', errors)
          throw new Error('Error al restar puntos del ganador anterior')
        }
      }
    } catch (error) {
      console.error('Error en handleRemovePreviousWinnerPoints:', error)
      throw error
    }
  }



  // Nota: handleRankingProfile se importa desde @/lib/ranking-utils

  // Función para obtener información de los jugadores ganadores
  const getJugadoresGanadores = (partido) => {
    if (!partido.equipo_ganador_id || !partido.equipo_ganador) return null
    
    const equipoGanador = partido.equipo_ganador
    const jugadores = []
    
    if (equipoGanador.titular_1?.id) {
      jugadores.push({
        nombre: equipoGanador.titular_1.nombre,
        apellido: equipoGanador.titular_1.apellido,
        tipo: 'Titular 1',
        rol: 'T1'
      })
    }
    if (equipoGanador.titular_2?.id) {
      jugadores.push({
        nombre: equipoGanador.titular_2.nombre,
        apellido: equipoGanador.titular_2.apellido,
        tipo: 'Titular 2',
        rol: 'T2'
      })
    }
    if (equipoGanador.suplente_1?.id) {
      jugadores.push({
        nombre: equipoGanador.suplente_1.nombre,
        apellido: equipoGanador.suplente_1.apellido,
        tipo: 'Suplente 1',
        rol: 'S1'
      })
    }
    if (equipoGanador.suplente_2?.id) {
      jugadores.push({
        nombre: equipoGanador.suplente_2.nombre,
        apellido: equipoGanador.suplente_2.apellido,
        tipo: 'Suplente 2',
        rol: 'S2'
      })
    }
    
    return jugadores
  }

  const getInscripcionesByCategoria = (categoriaId) => {
    return inscripciones.filter(ins => ins.liga_categoria_id === parseInt(categoriaId))
  }

  // Función auxiliar para obtener la categoría de un partido
  const getCategoriaFromPartido = async (partidoId) => {
    try {
      const { data: partido, error } = await supabase
        .from('liga_partidos')
        .select(`
          liga_categoria_id,
          liga_categorias!inner(categoria)
        `)
        .eq('id', partidoId)
        .single()
      
      if (error) throw error
      return partido.liga_categorias?.categoria
    } catch (error) {
      console.error('Error obteniendo categoría del partido:', error)
      return null
    }
  }

  const filteredPartidos = partidos.filter(partido => {
    const matchesCategoria = filterCategoria === 'all' || partido.liga_categoria_id === parseInt(filterCategoria)
    const matchesEstado = filterEstado === 'all' || partido.estado === filterEstado
    const matchesSearch = searchTerm === '' || 
      getEquipoNombre(partido.equipo_a).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEquipoNombre(partido.equipo_b).toLowerCase().includes(searchTerm.toLowerCase()) ||
      partido.ronda.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategoria && matchesEstado && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4">
                 {/* Header Mejorado - Mobile Responsive */}
         <div className="pt-4 sm:pt-8 pb-6 sm:pb-8">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
             <div className="text-center sm:text-left">
               <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                 <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 text-[#E2FF1B]" />
                 <span className="hidden sm:inline">Gestión de Partidos</span>
                 <span className="sm:hidden">Partidos</span>
               </h1>
               <p className="text-gray-400 mt-1 text-sm sm:text-base">
                 Administra y organiza los partidos de las ligas
               </p>
             </div>
             <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
               <Link href="/admin/ligas/tabla-posiciones">
                 <Button 
                   variant="outline"
                   className="border-[#E2FF1B]/30 text-[#E2FF1B] hover:bg-[#E2FF1B]/10 hover:border-[#E2FF1B]/50 flex items-center justify-center gap-2 w-full sm:w-auto transition-all duration-200"
                 >
                   <Trophy className="h-4 w-4" />
                   <span className="hidden sm:inline">Tabla de Posiciones</span>
                   <span className="sm:hidden">Posiciones</span>
                 </Button>
               </Link>
               <Button 
                 onClick={() => setShowCreateForm(true)} 
                 className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 flex items-center justify-center gap-2 w-full sm:w-auto"
               >
                 <Plus className="h-4 w-4" />
                 <span className="hidden sm:inline">Nuevo Partido</span>
                 <span className="sm:hidden">Crear</span>
               </Button>
             </div>
           </div>

                     {/* Filtros Mejorados - Mobile Responsive */}
           <Card className="mb-6 bg-gray-900/50 border-gray-800">
             <CardHeader className="pb-4">
               <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                 <Filter className="h-5 w-5 text-[#E2FF1B]" />
                 <span className="hidden sm:inline">Filtros y Búsqueda</span>
                 <span className="sm:hidden">Filtros</span>
               </CardTitle>
               <CardDescription className="text-gray-400 text-sm">
                 Filtra y busca partidos específicos
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                 <div>
                   <label className="text-sm font-medium mb-2 block text-white">Categoría</label>
                   <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                     <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                       <SelectValue placeholder="Todas las categorías" />
                     </SelectTrigger>
                     <SelectContent className="bg-gray-800 border-gray-700">
                       <SelectItem value="all">Todas las categorías</SelectItem>
                       {categorias.map(categoria => (
                         <SelectItem key={categoria.id} value={categoria.id.toString()}>
                           {categoria.ligas?.nombre} - {categoria.categoria}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <label className="text-sm font-medium mb-2 block text-white">Estado</label>
                   <Select value={filterEstado} onValueChange={setFilterEstado}>
                     <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                       <SelectValue placeholder="Todos los estados" />
                     </SelectTrigger>
                     <SelectContent className="bg-gray-800 border-gray-700">
                       <SelectItem value="all">Todos los estados</SelectItem>
                       {estados.map(estado => (
                         <SelectItem key={estado} value={estado}>
                           {estado}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="sm:col-span-2 lg:col-span-1">
                   <label className="text-sm font-medium mb-2 block text-white">Buscar</label>
                   <Input
                     placeholder="Buscar equipos o ronda..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9"
                   />
                 </div>
                 <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                   <Button 
                     variant="outline" 
                     onClick={fetchData}
                     disabled={refreshing}
                     className="w-full border-white/20 text-white hover:bg-white/10 h-10 sm:h-9"
                   >
                     <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                     <span className="hidden sm:inline">Actualizar</span>
                     <span className="sm:hidden">Refrescar</span>
                   </Button>
                 </div>
               </div>
             </CardContent>
           </Card>
  
                     {/* Estadísticas Rápidas - Mobile Responsive */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
             <Card className="bg-gray-900/50 border-gray-800">
               <CardContent className="p-3 sm:p-4">
                 <div className="flex items-center gap-2 sm:gap-3">
                   <div className="bg-blue-500/20 rounded-full p-1.5 sm:p-2">
                     <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                   </div>
                   <div>
                     <p className="text-lg sm:text-2xl font-bold text-white">{filteredPartidos.length}</p>
                     <p className="text-xs sm:text-sm text-gray-400">Total</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-gray-900/50 border-gray-800">
               <CardContent className="p-3 sm:p-4">
                 <div className="flex items-center gap-2 sm:gap-3">
                   <div className="bg-green-500/20 rounded-full p-1.5 sm:p-2">
                     <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                   </div>
                   <div>
                     <p className="text-lg sm:text-2xl font-bold text-white">
                       {filteredPartidos.filter(p => p.estado === 'jugado').length}
                     </p>
                     <p className="text-xs sm:text-sm text-gray-400">Jugados</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-gray-900/50 border-gray-800">
               <CardContent className="p-3 sm:p-4">
                 <div className="flex items-center gap-2 sm:gap-3">
                   <div className="bg-yellow-500/20 rounded-full p-1.5 sm:p-2">
                     <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                   </div>
                   <div>
                     <p className="text-lg sm:text-2xl font-bold text-white">
                       {filteredPartidos.filter(p => p.estado === 'pendiente').length}
                     </p>
                     <p className="text-xs sm:text-sm text-gray-400">Pendientes</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-gray-900/50 border-gray-800">
               <CardContent className="p-3 sm:p-4">
                 <div className="flex items-center gap-2 sm:gap-3">
                   <div className="bg-red-500/20 rounded-full p-1.5 sm:p-2">
                     <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                   </div>
                   <div>
                     <p className="text-lg sm:text-2xl font-bold text-white">
                       {filteredPartidos.filter(p => p.estado === 'cancelado').length}
                     </p>
                     <p className="text-xs sm:text-sm text-gray-400">Cancelados</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>

                     {/* Lista de partidos mejorada */}
           <div className="grid gap-4">
             {filteredPartidos.map(partido => (
               <PartidoCard
                 key={partido.id}
                 partido={partido}
                 onEdit={handleEdit}
                 onDelete={handleDelete}
                 onSetWinner={handleSetWinner}

                 getEquipoNombre={getEquipoNombre}
                 getCategoriaNombre={getCategoriaNombre}
                 getEstadoBadge={getEstadoBadge}
               />
             ))}
           </div>

                     {filteredPartidos.length === 0 && (
             <EmptyState 
               searchTerm={searchTerm}
               filterCategoria={filterCategoria}
               filterEstado={filterEstado}
             />
           )}

                     {/* Modal de creación/edición mejorado - Mobile Responsive */}
           <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
             <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                 <DialogTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                   <Gamepad2 className="h-5 w-5 text-[#E2FF1B]" />
                   <span className="hidden sm:inline">
                     {editingPartido ? 'Editar Partido' : 'Crear Nuevo Partido'}
                   </span>
                   <span className="sm:hidden">
                     {editingPartido ? 'Editar' : 'Crear'} Partido
                   </span>
                 </DialogTitle>
                 <DialogDescription className="text-gray-400 text-sm">
                   {editingPartido ? 'Modifica los datos del partido' : 'Define un nuevo partido para la liga'}
                 </DialogDescription>
               </DialogHeader>
               
                                {/* Información sobre selección de jugadores */}
                 <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                   <p className="text-xs sm:text-sm text-blue-400 mb-2 font-medium">💡 Nueva funcionalidad:</p>
                   <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                     Cuando selecciones un equipo ganador con estado "jugado", podrás elegir exactamente 2 jugadores específicos (T1, T2, S1, S2) que recibirán los puntos del partido.
                   </p>
                 </div>
               <form onSubmit={handleSubmit} className="space-y-4">
                 {/* Primera fila - Categoría, Ronda y Puntos */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">Categoría</label>
                     <Select 
                       value={formData.liga_categoria_id} 
                       onValueChange={(value) => handleInputChange('liga_categoria_id', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base">
                         <SelectValue placeholder="Seleccionar categoría" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                         {categorias.map(categoria => (
                           <SelectItem key={categoria.id} value={categoria.id.toString()} className="text-sm sm:text-base py-3 sm:py-2">
                             <span className="truncate block">{categoria.ligas?.nombre} - {categoria.categoria}</span>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">Ronda</label>
                     <Select 
                       value={formData.ronda} 
                       onValueChange={(value) => handleInputChange('ronda', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base">
                         <SelectValue placeholder="Seleccionar ronda" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         {rondas.map(ronda => (
                           <SelectItem key={ronda} value={ronda} className="text-sm sm:text-base py-3 sm:py-2">
                             {ronda}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">Puntos por jugador</label>
                     <Input
                       type="number"
                       min="0"
                       value={formData.puntos_por_jugador}
                       onChange={(e) => handleInputChange('puntos_por_jugador', e.target.value)}
                       required
                       className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base"
                     />
                   </div>
                 </div>

                 {/* Segunda fila - Equipos */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">Equipo A</label>
                     <Select 
                       value={formData.equipo_a_id} 
                       onValueChange={(value) => handleInputChange('equipo_a_id', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base">
                         <SelectValue placeholder="Seleccionar equipo A" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                         {formData.liga_categoria_id && 
                           getInscripcionesByCategoria(formData.liga_categoria_id).map(inscripcion => (
                             <SelectItem key={inscripcion.id} value={inscripcion.id.toString()} className="text-sm sm:text-base py-3 sm:py-2">
                               <span className="truncate block">{getEquipoNombre(inscripcion)}</span>
                             </SelectItem>
                           ))
                         }
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">Equipo B</label>
                     <Select 
                       value={formData.equipo_b_id} 
                       onValueChange={(value) => handleInputChange('equipo_b_id', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base">
                         <SelectValue placeholder="Seleccionar equipo B" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                         {formData.liga_categoria_id && 
                           getInscripcionesByCategoria(formData.liga_categoria_id)
                             .filter(ins => ins.id.toString() !== formData.equipo_a_id)
                             .map(inscripcion => (
                               <SelectItem key={inscripcion.id} value={inscripcion.id.toString()} className="text-sm sm:text-base py-3 sm:py-2">
                                 <span className="truncate block">{getEquipoNombre(inscripcion)}</span>
                               </SelectItem>
                             ))
                         }
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 {/* Tercera fila - Configuración del partido */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">
                       Fecha del Partido
                     </label>
                     <Input
                       type="date"
                       value={formData.fecha && formData.fecha.includes('T') ? formData.fecha.split('T')[0] : ''}
                       onChange={(e) => {
                         const nuevaFecha = e.target.value
                         // Preservar la hora existente o usar 12:00 como fallback
                         const horaExistente = formData.fecha && formData.fecha.includes('T') 
                           ? formData.fecha.split('T')[1] 
                           : '12:00'
                         handleInputChange('fecha', `${nuevaFecha}T${horaExistente}`)
                       }}
                       className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base"
                     />
                   </div>
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">
                       Hora del Partido
                     </label>
                     <Input
                       type="time"
                       value={formData.fecha && formData.fecha.includes('T') ? formData.fecha.split('T')[1] : ''}
                       onChange={(e) => {
                         const nuevaHora = e.target.value
                         // Preservar la fecha existente o usar la fecha actual como fallback
                         const fechaExistente = formData.fecha && formData.fecha.includes('T') 
                           ? formData.fecha.split('T')[0] 
                           : new Date().toISOString().split('T')[0]
                         handleInputChange('fecha', `${fechaExistente}T${nuevaHora}`)
                       }}
                       className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base"
                     />
                   </div>
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">Estado</label>
                     <Select 
                       value={formData.estado} 
                       onValueChange={(value) => handleInputChange('estado', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base">
                         <SelectValue placeholder="Seleccionar estado" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         {estados.map(estado => (
                           <SelectItem key={estado} value={estado} className="text-sm sm:text-base py-3 sm:py-2">
                             {estado}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 {/* Cuarta fila - Cancha y Resultado */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">Cancha</label>
                     <Select 
                       value={formData.cancha} 
                       onValueChange={(value) => handleInputChange('cancha', value)}
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base">
                         <SelectValue placeholder="Seleccionar cancha" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         {canchas.map(cancha => (
                           <SelectItem key={cancha} value={cancha.toString()} className="text-sm sm:text-base py-3 sm:py-2">
                             Cancha {cancha}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <label className="text-sm sm:text-base font-medium mb-2 block text-white">Resultado</label>
                     <Input
                       type="text"
                       placeholder="Ej: 6-1 / 5-7 / 6-4"
                       value={formData.resultado}
                       onChange={(e) => handleInputChange('resultado', e.target.value)}
                       className="bg-gray-800/50 border-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base"
                     />
                   </div>
                 </div>

                 {/* Equipo Ganador - Condicional */}
                 {formData.estado === 'jugado' && (
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium mb-2 block text-white">Equipo Ganador</label>
                       <Select 
                         value={formData.equipo_ganador_id} 
                         onValueChange={(value) => {
                           handleInputChange('equipo_ganador_id', value)
                           // Limpiar jugadores seleccionados al cambiar equipo
                           if (value !== formData.equipo_ganador_id) {
                             setFormData(prev => ({ ...prev, jugadores_ganadores: [] }))
                           }
                         }}
                       >
                         <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                           <SelectValue placeholder="Seleccionar ganador" />
                         </SelectTrigger>
                         <SelectContent className="bg-gray-800 border-gray-700">
                           <SelectItem value="none">Sin ganador</SelectItem>
                           {formData.equipo_a_id && (
                             <SelectItem value={formData.equipo_a_id}>
                               {getEquipoNombre(inscripciones.find(ins => ins.id.toString() === formData.equipo_a_id))}
                             </SelectItem>
                           )}
                           {formData.equipo_b_id && (
                             <SelectItem value={formData.equipo_b_id}>
                               {getEquipoNombre(inscripciones.find(ins => ins.id.toString() === formData.equipo_b_id))}
                             </SelectItem>
                           )}
                         </SelectContent>
                       </Select>
                     </div>

                     {/* Selección de jugadores específicos del equipo ganador */}
                     {formData.equipo_ganador_id && formData.equipo_ganador_id !== 'none' && (
                       <div className="space-y-3">
                         <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                           <p className="text-xs text-blue-400 mb-1">Equipo ganador seleccionado:</p>
                           <p className="text-sm text-white font-medium">
                             {(() => {
                               const equipoGanador = inscripciones.find(ins => ins.id.toString() === formData.equipo_ganador_id)
                               if (!equipoGanador) return 'Equipo no encontrado'
                               return getEquipoNombre(equipoGanador)
                             })()}
                           </p>
                           <p className="text-xs text-gray-400 mt-1">
                             Selecciona exactamente 2 jugadores que jugaron y ganaron el partido:
                           </p>
                           <p className="text-xs text-gray-400 mt-2">
                             <strong>Roles disponibles:</strong> T1 (Titular 1), T2 (Titular 2), S1 (Suplente 1), S2 (Suplente 2)
                           </p>
                         </div>
                         
                         <div className="flex items-center justify-between">
                           <p className="text-sm text-gray-400 font-medium">Jugadores que recibirán puntos:</p>
                           <span className={`text-xs px-2 py-1 rounded ${
                             (formData.jugadores_ganadores?.length || 0) === 2 
                               ? 'bg-green-500/20 text-green-400' 
                               : 'bg-yellow-500/20 text-yellow-400'
                           }`}>
                             {formData.jugadores_ganadores?.length || 0}/2
                           </span>
                         </div>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div>
                             <label className="text-sm text-gray-400 mb-2 block">Primer jugador:</label>
                             <Select 
                               value={formData.jugadores_ganadores?.[0] || ''} 
                               onValueChange={(value) => {
                                 if (value) {
                                   setFormData(prev => ({
                                     ...prev,
                                     jugadores_ganadores: [value, prev.jugadores_ganadores?.[1]].filter(Boolean)
                                   }))
                                 }
                                 // Si se cambia el primer jugador y el segundo era el mismo, limpiar el segundo
                                 if (value && formData.jugadores_ganadores?.[1] === value) {
                                   setFormData(prev => ({
                                     ...prev,
                                     jugadores_ganadores: [value]
                                   }))
                                 }
                               }}
                             >
                               <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                 <SelectValue placeholder="Seleccionar jugador" />
                               </SelectTrigger>
                               <SelectContent className="bg-gray-800 border-gray-700">
                                 {(() => {
                                   const equipoGanador = inscripciones.find(ins => ins.id.toString() === formData.equipo_ganador_id)
                                   if (!equipoGanador) return []
                                   const jugadores = getJugadoresEquipo(equipoGanador)
                                   
                                   return jugadores.map((jugador) => (
                                     <SelectItem key={jugador.id} value={jugador.id}>
                                       <div className="flex items-center gap-2">
                                         <span className={`text-xs px-2 py-1 rounded-full ${jugador.color}`}>
                                           {jugador.rol}
                                         </span>
                                         <span>{jugador.nombre} {jugador.apellido}</span>
                                       </div>
                                     </SelectItem>
                                   ))
                                 })()}
                               </SelectContent>
                             </Select>
                           </div>
                           
                           <div>
                             <label className="text-sm text-gray-400 mb-2 block">Segundo jugador:</label>
                             <Select 
                               value={formData.jugadores_ganadores?.[1] || ''} 
                               onValueChange={(value) => {
                                 if (value) {
                                   setFormData(prev => ({
                                     ...prev,
                                     jugadores_ganadores: [prev.jugadores_ganadores?.[0], value].filter(Boolean)
                                   }))
                                 }
                               }}
                             >
                               <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                 <SelectValue placeholder="Seleccionar jugador" />
                               </SelectTrigger>
                               <SelectContent className="bg-gray-800 border-gray-700">
                                 {(() => {
                                   const equipoGanador = inscripciones.find(ins => ins.id.toString() === formData.equipo_ganador_id)
                                   if (!equipoGanador) return []
                                   const jugadores = getJugadoresEquipo(equipoGanador)
                                   
                                   // Filtrar jugadores para excluir el primer jugador seleccionado
                                   const jugadoresDisponibles = jugadores.filter(jugador => jugador.id !== formData.jugadores_ganadores?.[0])
                                   
                                   return jugadoresDisponibles.map((jugador) => (
                                     <SelectItem key={jugador.id} value={jugador.id}>
                                       <div className="flex items-center gap-2">
                                         <span className={`text-xs px-2 py-1 rounded-full ${jugador.color}`}>
                                           {jugador.rol}
                                         </span>
                                         <span>{jugador.nombre} {jugador.apellido}</span>
                                       </div>
                                     </SelectItem>
                                   ))
                                 })()}
                               </SelectContent>
                             </Select>
                           </div>
                         </div>
                         
                         {/* Botón para limpiar selección */}
                         {(formData.jugadores_ganadores?.[0] || formData.jugadores_ganadores?.[1]) && (
                           <div className="flex justify-center">
                             <Button
                               type="button"
                               variant="outline"
                               size="sm"
                               onClick={() => setFormData(prev => ({ ...prev, jugadores_ganadores: [] }))}
                               className="border-gray-600 text-gray-300 hover:bg-gray-700"
                             >
                               Limpiar selección
                             </Button>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 )}

                 {/* Botones de acción */}
                 <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                   <Button 
                     type="button" 
                     variant="outline" 
                     onClick={resetForm} 
                     className="border-white/20 text-white hover:bg-white/10 h-10 sm:h-9 w-full sm:w-auto"
                   >
                     Cancelar
                   </Button>
                   <Button 
                     type="submit" 
                     className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 h-10 sm:h-9 w-full sm:w-auto"
                   >
                     {editingPartido ? 'Actualizar' : 'Crear'} Partido
                   </Button>
                 </div>
               </form>
             </DialogContent>
           </Dialog>

               {/* Modal para seleccionar jugadores y ganador - Mobile Responsive */}
        <Dialog open={showJugadoresSelection} onOpenChange={setShowJugadoresSelection}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Award className="h-5 w-5 text-[#E2FF1B]" />
                <span className="hidden sm:inline">Seleccionar Ganador y Jugadores</span>
                <span className="sm:hidden">Ganador y Jugadores</span>
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Selecciona el equipo ganador y los 2 jugadores que recibirán los puntos
              </DialogDescription>
            </DialogHeader>
            
            {selectedPartido && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Partido</p>
                  <p className="text-white font-medium text-sm sm:text-base">
                    {getEquipoNombre(selectedPartido.equipo_a)} vs {getEquipoNombre(selectedPartido.equipo_b)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{selectedPartido.ronda}</p>
                  <p className="text-xs text-[#E2FF1B] mt-2">
                    +{selectedPartido.puntos_por_jugador} puntos por jugador seleccionado
                  </p>
                </div>

                {/* Información sobre ganador actual */}
                {selectedPartido.equipo_ganador_id && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-400 mb-1">Ganador actual:</p>
                    <p className="text-sm text-white font-medium">
                      {getEquipoNombre(selectedPartido.equipo_ganador)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Al cambiar el ganador, se restarán los puntos anteriores y se sumarán {selectedPartido.puntos_por_jugador} puntos a los jugadores seleccionados
                    </p>
                  </div>
                )}

                {/* Selección de equipo ganador */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 font-medium">Selecciona el equipo ganador:</p>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={() => {
                        setSelectedJugadores([])
                        setSelectedPartido(prev => ({ ...prev, equipo_ganador_id: prev.equipo_a_id }))
                      }}
                      className={`h-12 sm:h-10 ${
                        selectedPartido.equipo_ganador_id === selectedPartido.equipo_a_id
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <span className="text-sm sm:text-base block">
                          {(() => {
                            const equipo = selectedPartido.equipo_a
                            const titulares = getTitularesEquipo(equipo)
                            return titulares.map(t => `${t.apellido} (${t.rol})`).join(' & ')
                          })()}
                        </span>
                        {selectedPartido.equipo_ganador_id === selectedPartido.equipo_a_id && (
                          <span className="text-xs opacity-75">(Ganador actual)</span>
                        )}
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setSelectedJugadores([])
                        setSelectedPartido(prev => ({ ...prev, equipo_ganador_id: prev.equipo_b_id }))
                      }}
                      className={`h-12 sm:h-10 ${
                        selectedPartido.equipo_ganador_id === selectedPartido.equipo_b_id
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <span className="text-sm sm:text-base block">
                          {(() => {
                            const equipo = selectedPartido.equipo_b
                            const titulares = getTitularesEquipo(equipo)
                            return titulares.map(t => `${t.apellido} (${t.rol})`).join(' & ')
                          })()}
                        </span>
                        {selectedPartido.equipo_ganador_id === selectedPartido.equipo_b_id && (
                          <span className="text-xs opacity-75">(Ganador actual)</span>
                        )}
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Selección de jugadores */}
                {selectedPartido.equipo_ganador_id && (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-3">
                      <p className="text-xs text-blue-400 mb-1">Equipo ganador seleccionado:</p>
                      <p className="text-sm text-white font-medium">
                        {(() => {
                          const equipoGanador = selectedPartido.equipo_ganador_id === selectedPartido.equipo_a_id 
                            ? selectedPartido.equipo_a 
                            : selectedPartido.equipo_b
                          const titulares = getTitularesEquipo(equipoGanador)
                          return titulares.map(t => `${t.apellido} (${t.rol})`).join(' & ')
                        })()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Ahora selecciona exactamente 2 jugadores que jugaron y ganaron el partido (pueden ser titulares, suplentes o una mezcla):
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 font-medium">Selecciona exactamente 2 jugadores que recibirán los puntos:</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        selectedJugadores.length === 2 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {selectedJugadores.length}/2
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Primer jugador:</label>
                          <Select 
                            value={selectedJugadores[0] || ''} 
                            onValueChange={(value) => {
                              if (value) {
                                setSelectedJugadores(prev => [value, prev[1]].filter(Boolean))
                              }
                            }}
                          >
                            <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                              <SelectValue placeholder="Seleccionar jugador" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              {(() => {
                                const equipoGanador = selectedPartido.equipo_ganador_id === selectedPartido.equipo_a_id 
                                  ? selectedPartido.equipo_a 
                                  : selectedPartido.equipo_b
                                const jugadores = getJugadoresEquipo(equipoGanador)
                                
                                return jugadores.map((jugador) => (
                                  <SelectItem key={jugador.id} value={jugador.id}>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-2 py-1 rounded-full ${jugador.color}`}>
                                        {jugador.rol}
                                      </span>
                                      <span>{jugador.nombre} {jugador.apellido}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Segundo jugador:</label>
                          <Select 
                            value={selectedJugadores[1] || ''} 
                            onValueChange={(value) => {
                              if (value) {
                                setSelectedJugadores(prev => [prev[0], value].filter(Boolean))
                              }
                            }}
                          >
                            <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                              <SelectValue placeholder="Seleccionar jugador" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              {(() => {
                                const equipoGanador = selectedPartido.equipo_ganador_id === selectedPartido.equipo_a_id 
                                  ? selectedPartido.equipo_a 
                                  : selectedPartido.equipo_b
                                const jugadores = getJugadoresEquipo(equipoGanador)
                                
                                return jugadores.map((jugador) => (
                                  <SelectItem key={jugador.id} value={jugador.id}>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-2 py-1 rounded-full ${jugador.color}`}>
                                        {jugador.rol}
                                      </span>
                                      <span>{jugador.nombre} {jugador.apellido}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Botón para limpiar selección */}
                      {(selectedJugadores[0] || selectedJugadores[1]) && (
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedJugadores([])}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            Limpiar selección
                          </Button>
                        </div>
                      )}
                    </div>
                    

                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowJugadoresSelection(false)
                      setSelectedPartido(null)
                      setSelectedJugadores([])
                    }}
                    className="border-white/20 text-white hover:bg-white/10 h-10 sm:h-9"
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    onClick={() => handleWinnerSelection(selectedPartido.equipo_ganador_id)}
                    disabled={selectedJugadores.length !== 2}
                    className="bg-[#E2FF1B] hover:bg-[#E2FF1B]/80 text-gray-900 font-medium h-10 sm:h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Ganador
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
     </div>
     </div>
     </div>
   )
} 

   