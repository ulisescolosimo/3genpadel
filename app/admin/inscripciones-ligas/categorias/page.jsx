"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Trophy, Users, Calendar, Eye, CheckCircle, XCircle, Clock, Search, RefreshCw, ArrowLeft, User, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AdminInscripcionesCategoriasPage() {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState([])
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

      if (categoriasError) throw categoriasError
      
      console.log('Categorías obtenidas:', categoriasData)

      // Obtener todas las inscripciones
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('ligainscripciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (inscripcionesError) throw inscripcionesError
      
      console.log('Inscripciones obtenidas:', inscripcionesData)

      // Procesar los datos para incluir estadísticas
      const categoriasProcesadas = categoriasData.map(categoria => {
        const inscripciones = inscripcionesData.filter(i => i.liga_categoria_id === categoria.id) || []
        const aprobadas = inscripciones.filter(i => i.estado === 'aprobada').length
        const pendientes = inscripciones.filter(i => i.estado === 'pendiente').length
        const rechazadas = inscripciones.filter(i => i.estado === 'rechazada').length
        const total = inscripciones.length
        const disponible = aprobadas < categoria.max_inscripciones

        return {
          ...categoria,
          liga: categoria.ligas?.nombre || 'N/A',
          liga_id: categoria.ligas?.id || null,
          fecha_inicio: categoria.ligas?.fecha_inicio || null,
          estado_liga: categoria.ligas?.estado || 'N/A',
          estadisticas: {
            aprobadas,
            pendientes,
            rechazadas,
            total,
            disponible,
            cupos_disponibles: categoria.max_inscripciones - aprobadas
          },
          inscripciones: inscripciones
        }
      })

      setCategorias(categoriasProcesadas)

      // Extraer ligas únicas para los filtros
      const ligas = [...new Set(categoriasProcesadas.map(c => c.liga).filter(l => l !== 'N/A'))]
      setLigasDisponibles(ligas)

    } catch (error) {
      console.error('Error fetching categorias:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
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
    const matchesLiga = filterLiga === 'all' || categoria.liga === filterLiga
    const matchesSearch = searchTerm === '' || 
      categoria.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoria.liga.toLowerCase().includes(searchTerm.toLowerCase())

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/inscripciones-ligas">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Inscripciones por Categoría</h1>
              <p className="text-gray-400">Gestiona las inscripciones organizadas por categorías</p>
            </div>
          </div>
          <Button onClick={fetchCategorias} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Liga</label>
                <Select value={filterLiga} onValueChange={setFilterLiga}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las ligas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ligas</SelectItem>
                    {ligasDisponibles.map(liga => (
                      <SelectItem key={liga} value={liga}>{liga}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Buscar</label>
                <Input
                  placeholder="Buscar por categoría o liga..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full border-white/20 text-white hover:bg-white/10">
                  Limpiar filtros
                </Button>
              </div>
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
                      {categoria.liga} • Inicio: {new Date(categoria.fecha_inicio).toLocaleDateString('es-ES')}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant={categoria.estado_liga === 'abierta' ? 'default' : 'secondary'}>
                      {categoria.estado_liga === 'abierta' ? 'Abierta' : 'Cerrada'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{categoria.estadisticas.aprobadas}</div>
                    <div className="text-sm text-green-300">Aprobadas</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{categoria.estadisticas.pendientes}</div>
                    <div className="text-sm text-yellow-300">Pendientes</div>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{categoria.estadisticas.rechazadas}</div>
                    <div className="text-sm text-red-300">Rechazadas</div>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{categoria.estadisticas.cupos_disponibles}</div>
                    <div className="text-sm text-blue-300">Cupos disponibles</div>
                  </div>
                </div>

                {/* Lista de Inscripciones */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#E2FF1B]" />
                    Inscripciones ({categoria.estadisticas.total})
                  </h4>
                  
                  {categoria.inscripciones.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                      <p>No hay inscripciones en esta categoría</p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex flex-col gap-1">
                      {categoria.inscripciones.slice(0, 5).map((inscripcion) => (
                        <Link key={inscripcion.id} href={`/admin/inscripciones-ligas/detalle/${inscripcion.id}`}>
                          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-white">
                                  {inscripcion.titular_1_nombre} {inscripcion.titular_1_apellido} & {inscripcion.titular_2_nombre} {inscripcion.titular_2_apellido}
                                </p>
                                <p className="text-sm text-gray-300 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {inscripcion.contacto_celular}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getEstadoColor(inscripcion.estado)}>
                                {getEstadoText(inscripcion.estado)}
                              </Badge>
                              <Eye className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </Link>
                      ))}
                      
                      {categoria.inscripciones.length > 5 && (
                        <div className="text-center pt-2">
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