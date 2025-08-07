"use client"

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
  onWinnerSelection,
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
              <p className={`text-xs sm:text-sm mt-1 leading-tight ${
                ganadorNombre && partido.equipo_ganador_id === partido.equipo_a?.id 
                  ? "text-black" 
                  : "text-gray-300"
              }`}>
                {equipoANombre}
              </p>
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
              <p className={`text-xs sm:text-sm mt-1 leading-tight ${
                ganadorNombre && partido.equipo_ganador_id === partido.equipo_b?.id 
                  ? "text-black" 
                  : "text-gray-300"
              }`}>
                {equipoBNombre}
              </p>
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
                className="flex items-center gap-1 mx-auto w-fit text-black font-bold bg-[#E2FC1D]"
              >
                <Award className="h-3 w-3" />
                Ganador: {ganadorNombre}
                <span className="ml-1">(+{partido.puntos_por_jugador} pts)</span>
              </Badge>
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

          {/* Botones de selección de ganador para partidos pendientes */}
          {esPendiente && (
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-400 mb-2">Seleccionar ganador:</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  size="sm"
                  onClick={() => onWinnerSelection(partido.equipo_a_id)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-8"
                  title={`Ganador: ${equipoANombre}`}
                >
                  <Award className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{equipoANombre}</span>
                  <span className="sm:hidden">Equipo A</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onWinnerSelection(partido.equipo_b_id)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-8"
                  title={`Ganador: ${equipoBNombre}`}
                >
                  <Award className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{equipoBNombre}</span>
                  <span className="sm:hidden">Equipo B</span>
                </Button>
              </div>
              <p className="text-xs text-[#E2FF1B] mt-1">
                +{partido.puntos_por_jugador} puntos por jugador
              </p>
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
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [selectedPartido, setSelectedPartido] = useState(null)
  const [formData, setFormData] = useState({
    liga_categoria_id: '',
    ronda: '',
    equipo_a_id: '',
    equipo_b_id: '',
    equipo_ganador_id: '',
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
    const titular1 = equipo.titular_1?.apellido || 'N/A'
    const titular2 = equipo.titular_2?.apellido || 'N/A'
    return `${titular1} & ${titular2}`
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

      const partidoData = {
        ...formData,
        liga_categoria_id: parseInt(formData.liga_categoria_id),
        equipo_a_id: parseInt(formData.equipo_a_id),
        equipo_b_id: parseInt(formData.equipo_b_id),
        equipo_ganador_id: formData.equipo_ganador_id && formData.equipo_ganador_id !== 'none' ? parseInt(formData.equipo_ganador_id) : null,
        puntos_por_jugador: parseInt(formData.puntos_por_jugador),
        fecha: fechaISO,
        cancha: formData.cancha ? parseInt(formData.cancha) : null,
        resultado: formData.resultado || null
      }

      if (editingPartido) {
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

        if (!equipoError && equipoGanadorData) {
          const puntos = partido.puntos_por_jugador || 3

          if (equipoGanadorData.titular_1_id) {
            updates.push(
              supabase
                .from('usuarios')
                .update({ 
                  ranking_puntos: supabase.raw(`GREATEST(COALESCE(ranking_puntos, 0) - ${puntos}, 0)`) 
                })
                .eq('id', equipoGanadorData.titular_1_id)
            )
          }

          if (equipoGanadorData.titular_2_id) {
            updates.push(
              supabase
                .from('usuarios')
                .update({ 
                  ranking_puntos: supabase.raw(`GREATEST(COALESCE(ranking_puntos, 0) - ${puntos}, 0)`) 
                })
                .eq('id', equipoGanadorData.titular_2_id)
            )
          }
        }
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

      const mensaje = partido.equipo_ganador_id && partido.estado === 'jugado'
        ? "El partido se eliminó correctamente y se restaron los puntos del equipo ganador."
        : "El partido se eliminó correctamente"

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
    setShowWinnerModal(true)
  }

  const handleWinnerSelection = async (equipoId) => {
    if (!selectedPartido) return

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

      // Paso 3: Obtener equipo ganador con información de titulares
      const { data: equipoGanadorData, error: equipoError } = await supabase
        .from('ligainscripciones')
        .select(`
          id,
          titular_1_id,
          titular_2_id
        `)
        .eq('id', nuevoGanadorId)
        .single()

      if (equipoError) throw equipoError

      // Paso 4: Sumar puntos a titulares del nuevo ganador
      const categoriaPartido = selectedPartido.liga_categorias?.categoria
      
      if (equipoGanadorData.titular_1_id) {
        // Actualizar usuarios.ranking_puntos
        updates.push(
          supabase
            .from('usuarios')
            .update({ 
              ranking_puntos: supabase.raw(`COALESCE(ranking_puntos, 0) + ${puntos}`) 
            })
            .eq('id', equipoGanadorData.titular_1_id)
        )
        
        // Actualizar ranking_jugadores
        if (categoriaPartido) {
          updates.push(
            supabase
              .from('ranking_jugadores')
              .upsert({
                usuario_id: equipoGanadorData.titular_1_id,
                categoria: categoriaPartido,
                puntos: supabase.raw(`COALESCE(puntos, 0) + ${puntos}`),
                activo: true
              }, {
                onConflict: 'usuario_id,categoria'
              })
          )
        }
      }

      if (equipoGanadorData.titular_2_id) {
        // Actualizar usuarios.ranking_puntos
        updates.push(
          supabase
            .from('usuarios')
            .update({ 
              ranking_puntos: supabase.raw(`COALESCE(ranking_puntos, 0) + ${puntos}`) 
            })
            .eq('id', equipoGanadorData.titular_2_id)
        )
        
        // Actualizar ranking_jugadores
        if (categoriaPartido) {
          updates.push(
            supabase
              .from('ranking_jugadores')
              .upsert({
                usuario_id: equipoGanadorData.titular_2_id,
                categoria: categoriaPartido,
                puntos: supabase.raw(`COALESCE(puntos, 0) + ${puntos}`),
                activo: true
              }, {
                onConflict: 'usuario_id,categoria'
              })
          )
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
        ? `Se cambió el ganador del partido. Se sumaron ${puntos} puntos al nuevo ganador (ranking general y ${categoriaPartido}).`
        : `Se estableció el ganador del partido y se sumaron ${puntos} puntos a cada jugador del equipo ganador (ranking general y ${categoriaPartido}).`

      toast({
        title: "Ganador establecido",
        description: mensaje,
        variant: "default"
      })

      setShowWinnerModal(false)
      setSelectedPartido(null)
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

  const handleDirectWinnerSelection = async (partido, equipoId) => {
    try {
      const nuevoGanadorId = parseInt(equipoId)
      const puntos = partido.puntos_por_jugador
      
      if (!puntos || puntos <= 0) {
        toast({
          title: "Error",
          description: "El partido debe tener puntos por jugador configurados",
          variant: "destructive"
        })
        return
      }

      // Paso 2: Actualizar el partido
      const { error: updateError } = await supabase
        .from('liga_partidos')
        .update({ 
          equipo_ganador_id: nuevoGanadorId,
          estado: 'jugado'
        })
        .eq('id', partido.id)

      if (updateError) throw updateError

      // Paso 3: Obtener información completa del partido para la categoría
      const { data: partidoCompleto, error: partidoError } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            id,
            categoria
          )
        `)
        .eq('id', partido.id)
        .single()

      if (partidoError) throw partidoError

      // Obtener equipo ganador con información de titulares
      const { data: equipoGanadorData, error: equipoError } = await supabase
        .from('ligainscripciones')
        .select(`
          id,
          titular_1_id,
          titular_2_id
        `)
        .eq('id', nuevoGanadorId)
        .single()

      if (equipoError) throw equipoError

      // Paso 4: Sumar puntos a titulares del nuevo ganador
      const categoriaPartido = partidoCompleto.liga_categorias?.categoria
      
      if (equipoGanadorData.titular_1_id) {
        // Actualizar usuarios.ranking_puntos
        const { data: user1Data, error: user1Error } = await supabase
          .from('usuarios')
          .select('ranking_puntos')
          .eq('id', equipoGanadorData.titular_1_id)
          .single()

        if (!user1Error && user1Data) {
          const nuevosPuntos = (user1Data.ranking_puntos || 0) + puntos
          await supabase
            .from('usuarios')
            .update({ ranking_puntos: nuevosPuntos })
            .eq('id', equipoGanadorData.titular_1_id)
        }
        
        // Actualizar ranking_jugadores
        if (categoriaPartido) {
          await supabase
            .from('ranking_jugadores')
            .upsert({
              usuario_id: equipoGanadorData.titular_1_id,
              categoria: categoriaPartido,
              puntos: supabase.raw(`COALESCE(puntos, 0) + ${puntos}`),
              activo: true
            }, {
              onConflict: 'usuario_id,categoria'
            })
        }
      }

      if (equipoGanadorData.titular_2_id) {
        // Actualizar usuarios.ranking_puntos
        const { data: user2Data, error: user2Error } = await supabase
          .from('usuarios')
          .select('ranking_puntos')
          .eq('id', equipoGanadorData.titular_2_id)
          .single()

        if (!user2Error && user2Data) {
          const nuevosPuntos = (user2Data.ranking_puntos || 0) + puntos
          await supabase
            .from('usuarios')
            .update({ ranking_puntos: nuevosPuntos })
            .eq('id', equipoGanadorData.titular_2_id)
        }
        
        // Actualizar ranking_jugadores
        if (categoriaPartido) {
          await supabase
            .from('ranking_jugadores')
            .upsert({
              usuario_id: equipoGanadorData.titular_2_id,
              categoria: categoriaPartido,
              puntos: supabase.raw(`COALESCE(puntos, 0) + ${puntos}`),
              activo: true
            }, {
              onConflict: 'usuario_id,categoria'
            })
        }
      }

      // Mensaje personalizado según si se cambió el ganador o se estableció por primera vez
      const mensaje = partido.equipo_ganador_id && partido.equipo_ganador_id !== nuevoGanadorId
        ? `Se cambió el ganador del partido. Se sumaron ${puntos} puntos al nuevo ganador (ranking general y ${categoriaPartido}).`
        : `Se estableció el ganador del partido y se sumaron ${puntos} puntos a cada jugador del equipo ganador (ranking general y ${categoriaPartido}).`

      toast({
        title: "Ganador establecido",
        description: mensaje,
        variant: "default"
      })

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

  const getInscripcionesByCategoria = (categoriaId) => {
    return inscripciones.filter(ins => ins.liga_categoria_id === parseInt(categoriaId))
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
                 onWinnerSelection={(equipoId) => handleDirectWinnerSelection(partido, equipoId)}
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
             <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 mx-4 sm:mx-0">
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
               <form onSubmit={handleSubmit} className="space-y-4">
                 {/* Primera fila - Categoría y Ronda */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">Categoría</label>
                     <Select 
                       value={formData.liga_categoria_id} 
                       onValueChange={(value) => handleInputChange('liga_categoria_id', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                         <SelectValue placeholder="Seleccionar categoría" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         {categorias.map(categoria => (
                           <SelectItem key={categoria.id} value={categoria.id.toString()}>
                             {categoria.ligas?.nombre} - {categoria.categoria}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">Ronda</label>
                     <Select 
                       value={formData.ronda} 
                       onValueChange={(value) => handleInputChange('ronda', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                         <SelectValue placeholder="Seleccionar ronda" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         {rondas.map(ronda => (
                           <SelectItem key={ronda} value={ronda}>
                             {ronda}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 {/* Segunda fila - Equipos */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">Equipo A</label>
                     <Select 
                       value={formData.equipo_a_id} 
                       onValueChange={(value) => handleInputChange('equipo_a_id', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                         <SelectValue placeholder="Seleccionar equipo A" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         {formData.liga_categoria_id && 
                           getInscripcionesByCategoria(formData.liga_categoria_id).map(inscripcion => (
                             <SelectItem key={inscripcion.id} value={inscripcion.id.toString()}>
                               {getEquipoNombre(inscripcion)}
                             </SelectItem>
                           ))
                         }
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">Equipo B</label>
                     <Select 
                       value={formData.equipo_b_id} 
                       onValueChange={(value) => handleInputChange('equipo_b_id', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                         <SelectValue placeholder="Seleccionar equipo B" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         {formData.liga_categoria_id && 
                           getInscripcionesByCategoria(formData.liga_categoria_id)
                             .filter(ins => ins.id.toString() !== formData.equipo_a_id)
                             .map(inscripcion => (
                               <SelectItem key={inscripcion.id} value={inscripcion.id.toString()}>
                                 {getEquipoNombre(inscripcion)}
                               </SelectItem>
                             ))
                         }
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 {/* Tercera fila - Configuración del partido */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">Puntos por jugador</label>
                     <Input
                       type="number"
                       min="0"
                       value={formData.puntos_por_jugador}
                       onChange={(e) => handleInputChange('puntos_por_jugador', e.target.value)}
                       required
                       className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9"
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">
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
                       className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9"
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">
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
                       className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9"
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">Estado</label>
                     <Select 
                       value={formData.estado} 
                       onValueChange={(value) => handleInputChange('estado', value)}
                       required
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                         <SelectValue placeholder="Seleccionar estado" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         {estados.map(estado => (
                           <SelectItem key={estado} value={estado}>
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
                     <label className="text-sm font-medium mb-2 block text-white">Cancha</label>
                     <Select 
                       value={formData.cancha} 
                       onValueChange={(value) => handleInputChange('cancha', value)}
                     >
                       <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                         <SelectValue placeholder="Seleccionar cancha" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         {canchas.map(cancha => (
                           <SelectItem key={cancha} value={cancha.toString()}>
                             Cancha {cancha}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">Resultado</label>
                     <Input
                       type="text"
                       placeholder="Ej: 6-1 / 5-7 / 6-4"
                       value={formData.resultado}
                       onChange={(e) => handleInputChange('resultado', e.target.value)}
                       className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9"
                     />
                   </div>
                 </div>

                 {/* Equipo Ganador - Condicional */}
                 {formData.estado === 'jugado' && (
                   <div>
                     <label className="text-sm font-medium mb-2 block text-white">Equipo Ganador</label>
                     <Select 
                       value={formData.equipo_ganador_id} 
                       onValueChange={(value) => handleInputChange('equipo_ganador_id', value)}
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

               {/* Modal para seleccionar ganador - Mobile Responsive */}
        <Dialog open={showWinnerModal} onOpenChange={setShowWinnerModal}>
          <DialogContent className="max-w-md bg-gray-900 border-gray-800 mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Award className="h-5 w-5 text-[#E2FF1B]" />
                <span className="hidden sm:inline">Seleccionar Ganador</span>
                <span className="sm:hidden">Ganador</span>
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Elige el equipo ganador del partido
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
                    +{selectedPartido.puntos_por_jugador} puntos por jugador
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
                      Al cambiar el ganador, se sumarán {selectedPartido.puntos_por_jugador} puntos al nuevo ganador
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={() => handleWinnerSelection(selectedPartido.equipo_a_id)}
                    className={`h-12 sm:h-10 ${
                      selectedPartido.equipo_ganador_id === selectedPartido.equipo_a_id
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    <span className="text-sm sm:text-base">
                      {getEquipoNombre(selectedPartido.equipo_a)}
                    </span>
                    {selectedPartido.equipo_ganador_id === selectedPartido.equipo_a_id && (
                      <span className="text-xs ml-2 opacity-75">(Ganador actual)</span>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleWinnerSelection(selectedPartido.equipo_b_id)}
                    className={`h-12 sm:h-10 ${
                      selectedPartido.equipo_ganador_id === selectedPartido.equipo_b_id
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    <span className="text-sm sm:text-base">
                      {getEquipoNombre(selectedPartido.equipo_b)}
                    </span>
                    {selectedPartido.equipo_ganador_id === selectedPartido.equipo_b_id && (
                      <span className="text-xs ml-2 opacity-75">(Ganador actual)</span>
                    )}
                  </Button>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowWinnerModal(false)}
                    className="border-white/20 text-white hover:bg-white/10 h-10 sm:h-9"
                  >
                    Cancelar
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