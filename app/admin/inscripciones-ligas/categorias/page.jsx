"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Trophy, Users, Calendar, Eye, CheckCircle, XCircle, Clock, Search, RefreshCw, ArrowLeft, User, Phone, Filter, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AdminInscripcionesCategoriasPage() {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState([])
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterLiga, setFilterLiga] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [ligasDisponibles, setLigasDisponibles] = useState([])

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      setRefreshing(true)
      
      // Obtener todas las categorías
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('liga_categorias')
        .select(`
          *,
          ligas (
            id,
            nombre,
            fecha_inicio,
            estado
          )
        `)
        .order('id', { ascending: false })

      if (categoriasError) {
        console.error('Error fetching categorias:', categoriasError)
        throw categoriasError
      }
      
      console.log('Categorías obtenidas:', categoriasData)

      // Obtener todas las inscripciones con joins a la tabla usuarios
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('ligainscripciones')
        .select(`
          *,
          titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          ),
          titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          ),
          suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          ),
          suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          )
        `)
        .order('created_at', { ascending: false })

      if (inscripcionesError) {
        console.error('Error fetching inscripciones:', inscripcionesError)
        throw inscripcionesError
      }

      console.log('Inscripciones obtenidas:', inscripcionesData)

      // Procesar las inscripciones usando datos de la tabla usuarios
      const inscripcionesProcesadas = inscripcionesData?.map(inscripcion => ({
        ...inscripcion,
        // Usar datos de la tabla usuarios si están disponibles, sino usar los campos directos
        titular_1_nombre: inscripcion.titular_1?.nombre || inscripcion.titular_1_nombre || 'N/A',
        titular_1_apellido: inscripcion.titular_1?.apellido || inscripcion.titular_1_apellido || '',
        titular_1_email: inscripcion.titular_1?.email || inscripcion.titular_1_email || 'N/A',
        titular_1_telefono: inscripcion.titular_1?.telefono || inscripcion.titular_1_telefono || 'N/A',
        titular_1_ranking: inscripcion.titular_1?.ranking_puntos || inscripcion.titular_1_ranking || 0,
        
        titular_2_nombre: inscripcion.titular_2?.nombre || inscripcion.titular_2_nombre || 'N/A',
        titular_2_apellido: inscripcion.titular_2?.apellido || inscripcion.titular_2_apellido || '',
        titular_2_email: inscripcion.titular_2?.email || inscripcion.titular_2_email || 'N/A',
        titular_2_telefono: inscripcion.titular_2?.telefono || inscripcion.titular_2_telefono || 'N/A',
        titular_2_ranking: inscripcion.titular_2?.ranking_puntos || inscripcion.titular_2_ranking || 0,
        
        suplente_1_nombre: inscripcion.suplente_1?.nombre || inscripcion.suplente_1_nombre || 'N/A',
        suplente_1_apellido: inscripcion.suplente_1?.apellido || inscripcion.suplente_1_apellido || '',
        suplente_1_email: inscripcion.suplente_1?.email || inscripcion.suplente_1_email || 'N/A',
        suplente_1_telefono: inscripcion.suplente_1?.telefono || inscripcion.suplente_1_telefono || 'N/A',
        suplente_1_ranking: inscripcion.suplente_1?.ranking_puntos || inscripcion.suplente_1_ranking || 0,
        
        suplente_2_nombre: inscripcion.suplente_2?.nombre || inscripcion.suplente_2_nombre || 'N/A',
        suplente_2_apellido: inscripcion.suplente_2?.apellido || inscripcion.suplente_2_apellido || '',
        suplente_2_email: inscripcion.suplente_2?.email || inscripcion.suplente_2_email || 'N/A',
        suplente_2_telefono: inscripcion.suplente_2?.telefono || inscripcion.suplente_2_telefono || 'N/A',
        suplente_2_ranking: inscripcion.suplente_2?.ranking_puntos || inscripcion.suplente_2_ranking || 0
      })) || []

      console.log('Inscripciones procesadas:', inscripcionesProcesadas)

      // Procesar categorías con información de inscripciones
      const categoriasProcesadas = categoriasData?.map(categoria => {
        const inscripcionesCategoria = inscripcionesProcesadas.filter(ins => ins.liga_categoria_id === categoria.id)
        
        return {
          ...categoria,
          inscripciones: inscripcionesCategoria,
          total_inscripciones: inscripcionesCategoria.length,
          aprobadas: inscripcionesCategoria.filter(ins => ins.estado === 'aprobada').length,
          pendientes: inscripcionesCategoria.filter(ins => ins.estado === 'pendiente').length,
          rechazadas: inscripcionesCategoria.filter(ins => ins.estado === 'rechazada').length,
          cupos_disponibles: categoria.max_inscripciones - inscripcionesCategoria.filter(ins => ins.estado === 'aprobada').length
        }
      }) || []

      console.log('Categorías procesadas:', categoriasProcesadas)

      setCategorias(categoriasProcesadas)
      setInscripciones(inscripcionesProcesadas)

      // Extraer ligas únicas para los filtros
      const ligas = [...new Set(categoriasProcesadas.map(c => c.ligas?.nombre).filter(l => l))]
      setLigasDisponibles(ligas)

    } catch (error) {
      console.error('Error fetching categorias:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las categorías",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada': return 'bg-green-500'
      case 'pendiente': return 'bg-yellow-500'
      case 'rechazada': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'aprobada': return 'Aprobada'
      case 'pendiente': return 'Pendiente'
      case 'rechazada': return 'Rechazada'
      default: return 'Desconocido'
    }
  }

  const filteredCategorias = categorias.filter(categoria => {
    const matchesLiga = filterLiga === 'all' || categoria.ligas?.nombre === filterLiga
    const matchesSearch = searchTerm === '' || 
      categoria.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoria.ligas?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
              // Buscar en los usuarios de las inscripciones de esta categoría
      categoria.inscripciones.some(inscripcion => 
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
        inscripcion.contacto_celular.includes(searchTerm)
      )

    return matchesLiga && matchesSearch
  })

  const clearFilters = () => {
    setFilterLiga('all')
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Cargando categorías...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header mejorado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Inscripciones por Categoría</h1>
              <p className="text-gray-400">Gestiona las inscripciones organizadas por categorías</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={fetchCategorias} disabled={refreshing} className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Link href="/admin/inscripciones-ligas">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros mejorados */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header de filtros */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#E2FF1B]" />
                  <h3 className="text-lg font-semibold text-white">Filtros</h3>
                </div>
                {(filterLiga !== 'all' || searchTerm) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>

              {/* Grid de filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtro de Liga */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#E2FF1B]" />
                    Liga
                  </label>
                  <Select value={filterLiga} onValueChange={setFilterLiga}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-11 text-sm transition-all duration-200 hover:bg-white/15 hover:border-white/30 focus:ring-2 focus:ring-[#E2FF1B]/20">
                      <SelectValue placeholder="Todas las ligas" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl">
                      <SelectItem value="all" className="text-white hover:bg-[#E2FF1B]/20 hover:text-[#E2FF1B] focus:bg-[#E2FF1B]/20 focus:text-[#E2FF1B] transition-all duration-200">
                        <div className="flex items-center gap-3 py-1">
                          <div className="w-2 h-2 bg-[#E2FF1B] rounded-full flex-shrink-0"></div>
                          <span className="font-medium">Todas las ligas</span>
                        </div>
                      </SelectItem>
                      {ligasDisponibles.map(liga => (
                        <SelectItem key={liga} value={liga} className="text-white hover:bg-[#E2FF1B]/20 hover:text-[#E2FF1B] focus:bg-[#E2FF1B]/20 focus:text-[#E2FF1B] transition-all duration-200">
                          <div className="flex items-center gap-3 py-1">
                            <div className="w-2 h-2 bg-[#E2FF1B] rounded-full flex-shrink-0"></div>
                            <span className="font-medium">{liga}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Búsqueda */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#E2FF1B]" />
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por categoría, liga o jugador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 pl-10 h-11 text-sm transition-all duration-200 hover:bg-white/15 hover:border-white/30 focus:ring-2 focus:ring-[#E2FF1B]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Filtros activos */}
              {(filterLiga !== 'all' || searchTerm) && (
                <div className="pt-4 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-400">Filtros activos:</span>
                    {filterLiga !== 'all' && (
                      <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] text-xs">
                        Liga: {filterLiga}
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
            </div>
          </CardContent>
        </Card>

        {/* Lista de Categorías */}
        <div className="grid gap-6">
          {filteredCategorias.map((categoria) => (
            <Card key={categoria.id} className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2 text-white">
                      <Trophy className="w-5 h-5 text-[#E2FF1B]" />
                      {categoria.categoria}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-300">
                      {categoria.ligas?.nombre} • Inicio: {new Date(categoria.ligas?.fecha_inicio).toLocaleDateString('es-ES')}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant={categoria.ligas?.estado === 'abierta' ? 'default' : 'secondary'}>
                      {categoria.ligas?.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{categoria.aprobadas}</div>
                    <div className="text-sm text-green-300">Aprobadas</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{categoria.pendientes}</div>
                    <div className="text-sm text-yellow-300">Pendientes</div>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{categoria.rechazadas}</div>
                    <div className="text-sm text-red-300">Rechazadas</div>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{categoria.cupos_disponibles}</div>
                    <div className="text-sm text-blue-300">Cupos disponibles</div>
                  </div>
                </div>

                {/* Grid de Inscripciones */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#E2FF1B]" />
                    Inscripciones ({categoria.total_inscripciones})
                  </h4>
                  
                  {categoria.inscripciones.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                      <p>No hay inscripciones en esta categoría</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {categoria.inscripciones.slice(0, 8).map((inscripcion) => (
                        <Link key={inscripcion.id} href={`/admin/inscripciones-ligas/detalle/${inscripcion.id}`}>
                          <Card className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 cursor-pointer h-full">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <Badge className={`${getEstadoColor(inscripcion.estado)} text-xs`}>
                                    {getEstadoText(inscripcion.estado)}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="font-medium text-white text-sm">
                                    {inscripcion.titular_1_nombre} {inscripcion.titular_1_apellido} & {inscripcion.titular_2_nombre} {inscripcion.titular_2_apellido}
                                  </p>
                                  <p className="text-xs text-gray-300 mt-1">
                                    Suplentes: {inscripcion.suplente_1_nombre} {inscripcion.suplente_1_apellido} & {inscripcion.suplente_2_nombre} {inscripcion.suplente_2_apellido}
                                  </p>
                                  <p className="text-xs text-gray-300 flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3" />
                                    {inscripcion.contacto_celular}
                                  </p>
                                </div>
                                <div className="flex justify-end">
                                  <Eye className="w-4 h-4 text-gray-400" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                      
                      {categoria.inscripciones.length > 8 && (
                        <div className="col-span-full text-center pt-2">
                          <Link href={`/admin/inscripciones-ligas/categoria/${categoria.id}`}>
                            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                              Ver todas las inscripciones ({categoria.inscripciones.length})
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCategorias.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No se encontraron categorías</h3>
            <p className="text-gray-400">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
} 