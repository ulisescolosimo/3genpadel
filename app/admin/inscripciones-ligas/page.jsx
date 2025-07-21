"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Trophy, Users, Calendar, Download, Eye, CheckCircle, XCircle, Clock, Search, RefreshCw, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AdminInscripcionesLigasPage() {
  const { toast } = useToast()
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategoria, setFilterCategoria] = useState('all')
  const [filterLiga, setFilterLiga] = useState('all')
  const [filterEstado, setFilterEstado] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([])
  const [ligasDisponibles, setLigasDisponibles] = useState([])
  const [cuposInfo, setCuposInfo] = useState({})

  useEffect(() => {
    fetchInscripciones()
  }, [])

  const fetchInscripciones = async () => {
    try {
      setRefreshing(true)
      const { data, error } = await supabase
        .from('ligainscripciones')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            max_inscripciones,
            ligas (
              id,
              nombre,
              fecha_inicio
            )
          ),
          titular_1:jugador!ligainscripciones_titular_1_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          ),
          titular_2:jugador!ligainscripciones_titular_2_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          ),
          suplente_1:jugador!ligainscripciones_suplente_1_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          ),
          suplente_2:jugador!ligainscripciones_suplente_2_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Procesar los datos para incluir información de categoría y liga
      const inscripcionesProcesadas = data.map(inscripcion => ({
        ...inscripcion,
        categoria: inscripcion.liga_categorias?.categoria || 'N/A',
        liga: inscripcion.liga_categorias?.ligas?.nombre || 'N/A',
        liga_id: inscripcion.liga_categorias?.ligas?.id || null,
        fecha_inicio: inscripcion.liga_categorias?.ligas?.fecha_inicio || null,
        liga_categoria_id: inscripcion.liga_categoria_id,
        max_inscripciones: inscripcion.liga_categorias?.max_inscripciones || 0,
        // Usar datos de la tabla jugador si están disponibles, sino usar los campos directos
        titular_1_nombre: inscripcion.titular_1?.nombre || inscripcion.titular_1_nombre || 'N/A',
        titular_1_apellido: inscripcion.titular_1?.apellido || inscripcion.titular_1_apellido || '',
        titular_1_email: inscripcion.titular_1?.email || inscripcion.titular_1_email || 'N/A',
        titular_1_telefono: inscripcion.titular_1?.telefono || 'N/A',
        titular_1_ranking: inscripcion.titular_1?.ranking_puntos || 0,
        
        titular_2_nombre: inscripcion.titular_2?.nombre || inscripcion.titular_2_nombre || 'N/A',
        titular_2_apellido: inscripcion.titular_2?.apellido || inscripcion.titular_2_apellido || '',
        titular_2_email: inscripcion.titular_2?.email || inscripcion.titular_2_email || 'N/A',
        titular_2_telefono: inscripcion.titular_2?.telefono || 'N/A',
        titular_2_ranking: inscripcion.titular_2?.ranking_puntos || 0,
        
        suplente_1_nombre: inscripcion.suplente_1?.nombre || inscripcion.suplente_1_nombre || 'N/A',
        suplente_1_apellido: inscripcion.suplente_1?.apellido || inscripcion.suplente_1_apellido || '',
        suplente_1_email: inscripcion.suplente_1?.email || inscripcion.suplente_1_email || 'N/A',
        suplente_1_telefono: inscripcion.suplente_1?.telefono || 'N/A',
        suplente_1_ranking: inscripcion.suplente_1?.ranking_puntos || 0,
        
        suplente_2_nombre: inscripcion.suplente_2?.nombre || inscripcion.suplente_2_nombre || 'N/A',
        suplente_2_apellido: inscripcion.suplente_2?.apellido || inscripcion.suplente_2_apellido || '',
        suplente_2_email: inscripcion.suplente_2?.email || inscripcion.suplente_2_email || 'N/A',
        suplente_2_telefono: inscripcion.suplente_2?.telefono || 'N/A',
        suplente_2_ranking: inscripcion.suplente_2?.ranking_puntos || 0
      }))

      setInscripciones(inscripcionesProcesadas)

      // Extraer categorías y ligas únicas para los filtros
      const categorias = [...new Set(inscripcionesProcesadas.map(i => i.categoria).filter(c => c !== 'N/A'))]
      const ligas = [...new Set(inscripcionesProcesadas.map(i => i.liga).filter(l => l !== 'N/A'))]
      
      setCategoriasDisponibles(categorias)
      setLigasDisponibles(ligas)

      // Calcular información de cupos por categoría
      const cuposCalculados = {}
      inscripcionesProcesadas.forEach(inscripcion => {
        if (inscripcion.liga_categoria_id) {
          const key = `${inscripcion.liga_categoria_id}`
          if (!cuposCalculados[key]) {
            cuposCalculados[key] = {
              categoria: inscripcion.categoria,
              liga: inscripcion.liga,
              max_inscripciones: inscripcion.max_inscripciones,
              aprobadas: 0,
              pendientes: 0,
              rechazadas: 0,
              total: 0
            }
          }
          
          cuposCalculados[key].total++
          if (inscripcion.estado === 'aprobada') {
            cuposCalculados[key].aprobadas++
          } else if (inscripcion.estado === 'pendiente') {
            cuposCalculados[key].pendientes++
          } else if (inscripcion.estado === 'rechazada') {
            cuposCalculados[key].rechazadas++
          }
        }
      })

      setCuposInfo(cuposCalculados)

    } catch (error) {
      console.error('Error fetching inscripciones:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las inscripciones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateEstado = async (id, nuevoEstado) => {
    try {
      // Obtener la inscripción actual para mostrar información de cupos
      const inscripcionActual = inscripciones.find(i => i.id === id)
      const cuposActuales = inscripcionActual ? getCuposDisponibles(inscripcionActual.liga_categoria_id) : 0
      
      const { error } = await supabase
        .from('ligainscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      if (error) throw error

      // Mensaje personalizado según el cambio de estado
      let mensaje = `Inscripción ${nuevoEstado}`
      if (inscripcionActual) {
        if (nuevoEstado === 'aprobada') {
          const nuevosCupos = cuposActuales - 1
          mensaje = `Inscripción aprobada. Quedan ${nuevosCupos} cupos disponibles en ${inscripcionActual.categoria} - ${inscripcionActual.liga}`
        } else if (nuevoEstado === 'rechazada' && inscripcionActual.estado === 'aprobada') {
          const nuevosCupos = cuposActuales + 1
          mensaje = `Inscripción rechazada. Ahora hay ${nuevosCupos} cupos disponibles en ${inscripcionActual.categoria} - ${inscripcionActual.liga}`
        } else if (nuevoEstado === 'pendiente' && inscripcionActual.estado === 'aprobada') {
          const nuevosCupos = cuposActuales + 1
          mensaje = `Inscripción puesta en pendiente. Ahora hay ${nuevosCupos} cupos disponibles en ${inscripcionActual.categoria} - ${inscripcionActual.liga}`
        }
      }

      toast({
        title: "Estado actualizado",
        description: mensaje,
        variant: "default"
      })

      fetchInscripciones()
    } catch (error) {
      console.error('Error updating estado:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
    }
  }

  const downloadComprobante = async (url, filename) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast({
        title: "Descarga iniciada",
        description: "El archivo se está descargando",
        variant: "default"
      })
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo",
        variant: "destructive"
      })
    }
  }

  const filteredInscripciones = inscripciones.filter(inscripcion => {
    const matchesCategoria = filterCategoria === 'all' || inscripcion.categoria === filterCategoria
    const matchesLiga = filterLiga === 'all' || inscripcion.liga === filterLiga
    const matchesEstado = filterEstado === 'all' || inscripcion.estado === filterEstado
    const matchesSearch = searchTerm === '' || 
      inscripcion.titular_1_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_1_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_1_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_2_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_2_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_2_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_1_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_1_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_1_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_2_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_2_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_2_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.contacto_celular.includes(searchTerm) ||
      inscripcion.titular_1_telefono.includes(searchTerm) ||
      inscripcion.titular_2_telefono.includes(searchTerm) ||
      inscripcion.suplente_1_telefono.includes(searchTerm) ||
      inscripcion.suplente_2_telefono.includes(searchTerm)

    return matchesCategoria && matchesLiga && matchesEstado && matchesSearch
  })

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada': return 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200'
      case 'rechazada': return 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-200'
      case 'pendiente': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 hover:border-yellow-500/50 transition-all duration-200'
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400 hover:bg-gray-500/30 hover:border-gray-500/50 transition-all duration-200'
    }
  }

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'aprobada': return 'Aprobada'
      case 'rechazada': return 'Rechazada'
      case 'pendiente': return 'Pendiente'
      default: return estado
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'aprobada': return <CheckCircle className="w-4 h-4" />
      case 'rechazada': return <XCircle className="w-4 h-4" />
      case 'pendiente': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const clearFilters = () => {
    setFilterCategoria('all')
    setFilterLiga('all')
    setFilterEstado('all')
    setSearchTerm('')
  }

  const getCuposInfo = (liga_categoria_id) => {
    return cuposInfo[liga_categoria_id] || {
      categoria: 'N/A',
      liga: 'N/A',
      max_inscripciones: 0,
      aprobadas: 0,
      pendientes: 0,
      rechazadas: 0,
      total: 0
    }
  }

  const getCuposDisponibles = (liga_categoria_id) => {
    const info = getCuposInfo(liga_categoria_id)
    return info.max_inscripciones - info.aprobadas
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="pt-8 pb-8">

          {/* Estadísticas - Optimizadas para mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-400">Total</p>
                    <p className="text-lg md:text-2xl font-bold text-white">{inscripciones.length}</p>
                  </div>
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center">
                    <Trophy className="w-4 h-4 md:w-6 md:h-6 text-[#E2FF1B]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-yellow-500/30 transition-all duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-400">Pendientes</p>
                    <p className="text-lg md:text-2xl font-bold text-yellow-400">
                      {inscripciones.filter(i => i.estado === 'pendiente').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 md:w-6 md:h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-green-500/30 transition-all duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-400">Aprobadas</p>
                    <p className="text-lg md:text-2xl font-bold text-green-400">
                      {inscripciones.filter(i => i.estado === 'aprobada').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-red-500/30 transition-all duration-300">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-400">Rechazadas</p>
                    <p className="text-lg md:text-2xl font-bold text-red-400">
                      {inscripciones.filter(i => i.estado === 'rechazada').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <XCircle className="w-4 h-4 md:w-6 md:h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y Búsqueda - Rediseño Mejorado */}
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="p-4 sm:p-6">
              {/* Header con título y botones de acción */}
              <div className="flex flex-col gap-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  <h3 className="text-base sm:text-lg font-semibold text-white">Filtros y Búsqueda</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/admin/inscripciones-ligas/categorias">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Ver por Categorías
                    </Button>
                  </Link>
                  <Button
                    onClick={fetchInscripciones}
                    disabled={refreshing}
                    size="sm"
                    className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                  >
                    {refreshing ? (
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    )}
                    Actualizar
                  </Button>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>

              {/* Búsqueda principal - Destacada */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, apellido o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 pl-10 h-12 text-base"
                  />
                </div>
              </div>

              {/* Filtros en grid responsive - Optimizado para mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {/* Liga */}
                <div className="space-y-1 md:space-y-2">
                  <label className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2">
                    <Trophy className="w-3 h-3 md:w-4 md:h-4 text-[#E2FF1B]" />
                    Liga
                  </label>
                  <Select value={filterLiga} onValueChange={setFilterLiga}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-10 md:h-11 text-sm">
                      <SelectValue placeholder="Todas las ligas" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                        Todas las ligas
                      </SelectItem>
                      {ligasDisponibles.map((liga) => (
                        <SelectItem key={liga} value={liga} className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                          {liga}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Categoría */}
                <div className="space-y-1 md:space-y-2">
                  <label className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-[#E2FF1B]" />
                    Categoría
                  </label>
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-10 md:h-11 text-sm">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                        Todas las categorías
                      </SelectItem>
                      {categoriasDisponibles.map((categoria) => (
                        <SelectItem key={categoria} value={categoria} className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Estado */}
                <div className="space-y-1 md:space-y-2">
                  <label className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-[#E2FF1B]" />
                    Estado
                  </label>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-10 md:h-11 text-sm">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                        Todos los estados
                      </SelectItem>
                      <SelectItem value="pendiente" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                        Pendiente
                      </SelectItem>
                      <SelectItem value="aprobada" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                        Aprobada
                      </SelectItem>
                      <SelectItem value="rechazada" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">
                        Rechazada
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtros activos - Chips */}
              {(filterLiga !== 'all' || filterCategoria !== 'all' || filterEstado !== 'all' || searchTerm) && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-400">Filtros activos:</span>
                    {filterLiga !== 'all' && (
                      <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] text-xs">
                        Liga: {filterLiga}
                      </Badge>
                    )}
                    {filterCategoria !== 'all' && (
                      <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] text-xs">
                        Categoría: {filterCategoria}
                      </Badge>
                    )}
                    {filterEstado !== 'all' && (
                      <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] text-xs">
                        Estado: {filterEstado}
                      </Badge>
                    )}
                    {searchTerm && (
                      <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] text-xs">
                        Búsqueda: "{searchTerm}"
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Inscripciones */}
        <div className="pb-16">
        <div className="space-y-6">
          {filteredInscripciones.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No se encontraron inscripciones</h3>
                <p className="text-gray-400">Intenta ajustar los filtros o la búsqueda</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Resultados ({filteredInscripciones.length})
                </h2>
                <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] w-fit">
                  {filteredInscripciones.length} inscripciones
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredInscripciones.map((inscripcion) => (
                <Link key={inscripcion.id} href={`/admin/inscripciones-ligas/detalle/${inscripcion.id}`}>
                  <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="p-4">
                    {/* Header con badges - Compacto para grid */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className={`${getEstadoColor(inscripcion.estado)} border cursor-pointer text-xs`}>
                        <div className="flex items-center gap-1">
                          {getEstadoIcon(inscripcion.estado)}
                          <span className="font-medium">{getEstadoText(inscripcion.estado)}</span>
                        </div>
                      </Badge>
                      <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] text-xs">
                        {inscripcion.categoria}
                      </Badge>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                        {inscripcion.liga}
                      </Badge>
                    </div>
                    
                    {/* Fecha */}
                    <div className="mb-3">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(inscripcion.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    {/* Información de cupos - Compacta */}
                    {inscripcion.liga_categoria_id && (
                      <div className="mb-3 p-2 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-400">Cupos:</span>
                            <span className="font-semibold text-white">
                              {getCuposDisponibles(inscripcion.liga_categoria_id)}/{inscripcion.max_inscripciones}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs px-1 py-0">
                              {getCuposInfo(inscripcion.liga_categoria_id).aprobadas} ✓
                            </Badge>
                            <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs px-1 py-0">
                              {getCuposInfo(inscripcion.liga_categoria_id).pendientes} ⏱
                            </Badge>
                            <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs px-1 py-0">
                              {getCuposInfo(inscripcion.liga_categoria_id).rechazadas} ✗
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Información del equipo - Compacta */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                          <Users className="w-3 h-3 text-[#E2FF1B]" />
                          Titulares
                        </h3>
                        <div className="bg-white/5 rounded-lg p-2 space-y-1">
                          <div>
                            <p className="text-gray-300 text-xs font-medium">
                              <span className="text-[#E2FF1B]">1.</span> {inscripcion.titular_1_nombre} {inscripcion.titular_1_apellido}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {inscripcion.titular_1_ranking > 0 ? `${inscripcion.titular_1_ranking} pts` : 'Sin puntos'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-300 text-xs font-medium">
                              <span className="text-[#E2FF1B]">2.</span> {inscripcion.titular_2_nombre} {inscripcion.titular_2_apellido}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {inscripcion.titular_2_ranking > 0 ? `${inscripcion.titular_2_ranking} pts` : 'Sin puntos'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                          <Users className="w-3 h-3 text-[#E2FF1B]" />
                          Suplentes
                        </h3>
                        <div className="bg-white/5 rounded-lg p-2 space-y-1">
                          <div>
                            <p className="text-gray-300 text-xs font-medium">
                              <span className="text-[#E2FF1B]">1.</span> {inscripcion.suplente_1_nombre} {inscripcion.suplente_1_apellido}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {inscripcion.suplente_1_ranking > 0 ? `${inscripcion.suplente_1_ranking} pts` : 'Sin puntos'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-300 text-xs font-medium">
                              <span className="text-[#E2FF1B]">2.</span> {inscripcion.suplente_2_nombre} {inscripcion.suplente_2_apellido}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {inscripcion.suplente_2_ranking > 0 ? `${inscripcion.suplente_2_ranking} pts` : 'Sin puntos'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Información adicional */}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-gray-300 text-xs">
                        <strong className="text-white">Contacto:</strong> {inscripcion.contacto_celular}
                      </p>
                      {inscripcion.aclaraciones && (
                        <div className="mt-2 p-2 bg-white/5 rounded text-xs">
                          <p className="text-gray-300">
                            <strong className="text-white">Aclaraciones:</strong> {inscripcion.aclaraciones}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Acciones - Compactas */}
                    <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-white/10">
                      {inscripcion.comprobante_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            downloadComprobante(inscripcion.comprobante_url, inscripcion.comprobante_filename)
                          }}
                          className="border-white/20 text-white hover:bg-white/10 h-8 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Comprobante
                        </Button>
                      )}
                      
                      {/* Botones de cambio de estado - Compactos */}
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            updateEstado(inscripcion.id, 'aprobada')
                          }}
                          disabled={inscripcion.estado === 'aprobada' || getCuposDisponibles(inscripcion.liga_categoria_id) === 0}
                          className={`h-8 text-xs font-semibold ${
                            inscripcion.estado === 'aprobada' || getCuposDisponibles(inscripcion.liga_categoria_id) === 0
                              ? 'bg-green-600/50 text-green-200 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            updateEstado(inscripcion.id, 'rechazada')
                          }}
                          disabled={inscripcion.estado === 'rechazada'}
                          className={`h-8 text-xs font-semibold ${
                            inscripcion.estado === 'rechazada' 
                              ? 'bg-red-600/50 text-red-200 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            updateEstado(inscripcion.id, 'pendiente')
                          }}
                          disabled={inscripcion.estado === 'pendiente'}
                          className={`h-8 text-xs font-semibold ${
                            inscripcion.estado === 'pendiente' 
                              ? 'bg-yellow-600/50 text-yellow-200 cursor-not-allowed' 
                              : 'bg-yellow-600 hover:bg-yellow-700'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))}
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}