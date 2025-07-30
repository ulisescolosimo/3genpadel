"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, Users, Calendar, Eye, BarChart3, RefreshCw, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

// Componente para mostrar la tabla de posiciones
const TablaPosiciones = ({ liga, partidos, inscripciones, categoria }) => {
  // Calcular estadísticas de cada equipo
  const calcularEstadisticasEquipo = (equipoId) => {
    const partidosEquipo = partidos.filter(p => {
      const matchEquipo = p.equipo_a_id === equipoId || p.equipo_b_id === equipoId
      const matchEstado = p.estado === 'jugado'
      const matchCategoria = !categoria || p.liga_categorias?.id === categoria.id
      
      return matchEquipo && matchEstado && matchCategoria
    })

    let partidosJugados = 0
    let partidosGanados = 0
    let partidosPerdidos = 0
    let puntos = 0

    partidosEquipo.forEach(partido => {
      partidosJugados++
      
      if (partido.equipo_ganador_id === equipoId) {
        partidosGanados++
        puntos += partido.puntos_por_jugador || 3
      } else {
        partidosPerdidos++
      }
    })

    return {
      partidosJugados,
      partidosGanados,
      partidosPerdidos,
      puntos,
      diferencia: partidosGanados - partidosPerdidos
    }
  }

  // Obtener equipos únicos de la liga y categoría
  const obtenerEquipos = () => {
    const equiposIds = new Set()
    partidos.forEach(partido => {
      const matchLiga = partido.liga_categorias?.ligas?.id === liga.id
      const matchCategoria = !categoria || partido.liga_categorias?.id === categoria.id
      
      if (matchLiga && matchCategoria) {
        equiposIds.add(partido.equipo_a_id)
        equiposIds.add(partido.equipo_b_id)
      }
    })

    return Array.from(equiposIds).map(equipoId => {
      const inscripcion = inscripciones.find(ins => ins.id === equipoId)
      if (!inscripcion) return null

      const stats = calcularEstadisticasEquipo(equipoId)
      return {
        id: equipoId,
        nombre: `${inscripcion.titular_1?.nombre} ${inscripcion.titular_1?.apellido} & ${inscripcion.titular_2?.nombre} ${inscripcion.titular_2?.apellido}`,
        ...stats
      }
    }).filter(equipo => equipo !== null)
  }

  const equipos = obtenerEquipos()
  
  // Ordenar por puntos (descendente) y luego por diferencia de goles
  const equiposOrdenados = equipos.sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos
    return b.diferencia - a.diferencia
  })

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#E2FF1B]" />
          {categoria ? `${liga.nombre} - ${categoria.categoria}` : `Tabla de Posiciones - ${liga.nombre}`}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {categoria ? `Clasificación de la categoría ${categoria.categoria}` : 'Clasificación actual de los equipos'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-gray-300 font-medium">Pos</th>
                <th className="text-left p-3 text-gray-300 font-medium">Equipo</th>
                <th className="text-center p-3 text-gray-300 font-medium">PJ</th>
                <th className="text-center p-3 text-gray-300 font-medium">PG</th>
                <th className="text-center p-3 text-gray-300 font-medium">PP</th>
                <th className="text-center p-3 text-gray-300 font-medium">Pts</th>
                <th className="text-center p-3 text-gray-300 font-medium">Dif</th>
              </tr>
            </thead>
            <tbody>
              {equiposOrdenados.map((equipo, index) => (
                <tr 
                  key={equipo.id} 
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                    index < 3 ? 'bg-[#E2FF1B]/5' : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Medal className="h-4 w-4 text-yellow-400" />}
                      {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                      {index === 2 && <Medal className="h-4 w-4 text-orange-600" />}
                      <span className={`font-bold ${
                        index < 3 ? 'text-[#E2FF1B]' : 'text-white'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{equipo.nombre}</span>
                      {index < equiposOrdenados.length - 1 && 
                       equiposOrdenados[index + 1].puntos === equipo.puntos && (
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      )}
                      {index > 0 && 
                       equiposOrdenados[index - 1].puntos === equipo.puntos && (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center text-gray-300">{equipo.partidosJugados}</td>
                  <td className="p-3 text-center text-green-400 font-medium">{equipo.partidosGanados}</td>
                  <td className="p-3 text-center text-red-400 font-medium">{equipo.partidosPerdidos}</td>
                  <td className="p-3 text-center">
                    <Badge variant="default" className="bg-[#E2FF1B] text-black font-bold">
                      {equipo.puntos}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-medium ${
                      equipo.diferencia > 0 ? 'text-green-400' : 
                      equipo.diferencia < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {equipo.diferencia > 0 ? '+' : ''}{equipo.diferencia}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {equiposOrdenados.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-400">No hay equipos registrados en esta liga</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function TablaPosicionesPage() {
  const { toast } = useToast()
  const [ligas, setLigas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [partidos, setPartidos] = useState([])
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedLiga, setSelectedLiga] = useState('all')
  const [selectedCategoria, setSelectedCategoria] = useState('all')
  const [filteredCategorias, setFilteredCategorias] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

     // Filtrar categorías cuando cambie la liga seleccionada
   useEffect(() => {
     if (selectedLiga === 'all') {
       setFilteredCategorias([])
       setSelectedCategoria('all')
     } else {
       const categoriasLiga = categorias.filter(cat => 
         cat.liga_id === parseInt(selectedLiga)
       )
       setFilteredCategorias(categoriasLiga)
       setSelectedCategoria('all')
     }
   }, [selectedLiga, categorias])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Obtener ligas
      const { data: ligasData, error: ligasError } = await supabase
        .from('ligas')
        .select('*')
        .order('fecha_inicio', { ascending: false })

      if (ligasError) throw ligasError
      setLigas(ligasData || [])

             // Obtener categorías
       const { data: categoriasData, error: categoriasError } = await supabase
         .from('liga_categorias')
         .select(`
           id,
           categoria,
           liga_id,
           ligas (
             id,
             nombre,
             fecha_inicio
           )
         `)
         .order('categoria')

       if (categoriasError) throw categoriasError
       setCategorias(categoriasData || [])

       // Obtener partidos con información relacionada
       const { data: partidosData, error: partidosError } = await supabase
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
               nombre,
               apellido
             ),
             titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
               nombre,
               apellido
             )
           ),
           equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
             id,
             titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
               nombre,
               apellido
             ),
             titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
               nombre,
               apellido
             )
           ),
           equipo_ganador:ligainscripciones!liga_partidos_equipo_ganador_id_fkey (
             id
           )
         `)
         .eq('estado', 'jugado')
         .order('created_at', { ascending: false })

             if (partidosError) throw partidosError
       setPartidos(partidosData || [])

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
          )
        `)
        .eq('estado', 'aprobada')
        .order('created_at', { ascending: false })

      if (inscripcionesError) throw inscripcionesError
      setInscripciones(inscripcionesData || [])
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

  const getLigaById = (ligaId) => {
    return ligas.find(liga => liga.id === parseInt(ligaId))
  }

  const getPartidosByLiga = (ligaId) => {
    return partidos.filter(partido => 
      partido.liga_categorias?.ligas?.id === parseInt(ligaId)
    )
  }

  const getPartidosByLigaYCategoria = (ligaId, categoriaId) => {
    return partidos.filter(partido => {
      const matchLiga = partido.liga_categorias?.ligas?.id === parseInt(ligaId)
      const matchCategoria = categoriaId === 'all' || partido.liga_categorias?.id === parseInt(categoriaId)
      return matchLiga && matchCategoria
    })
  }

  const getCategoriaById = (categoriaId) => {
    return categorias.find(cat => cat.id === parseInt(categoriaId))
  }

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
        {/* Header */}
        <div className="pt-4 sm:pt-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-[#E2FF1B]" />
                <span className="hidden sm:inline">Tablas de Posiciones</span>
                <span className="sm:hidden">Posiciones</span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Clasificación de equipos por liga
              </p>
            </div>
            <Button 
              onClick={fetchData} 
              disabled={refreshing}
              className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
              <span className="sm:hidden">Refrescar</span>
            </Button>
          </div>

          {/* Filtros de liga y categoría */}
          <Card className="mb-6 bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-white">Seleccionar Liga</label>
                  <Select value={selectedLiga} onValueChange={setSelectedLiga}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                      <SelectValue placeholder="Todas las ligas" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">Todas las ligas</SelectItem>
                      {ligas.map(liga => (
                        <SelectItem key={liga.id} value={liga.id.toString()}>
                          {liga.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-white">Seleccionar Categoría</label>
                  <Select 
                    value={selectedCategoria} 
                    onValueChange={setSelectedCategoria}
                    disabled={selectedLiga === 'all' || filteredCategorias.length === 0}
                  >
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-10 sm:h-9">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {filteredCategorias.map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                          {categoria.categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-4">
                <div className="flex items-center gap-1">
                  <Medal className="h-4 w-4 text-yellow-400" />
                  <span>1º</span>
                </div>
                <div className="flex items-center gap-1">
                  <Medal className="h-4 w-4 text-gray-400" />
                  <span>2º</span>
                </div>
                <div className="flex items-center gap-1">
                  <Medal className="h-4 w-4 text-orange-600" />
                  <span>3º</span>
                </div>
              </div>
            </CardContent>
          </Card>

                     {/* Tablas de posiciones */}
           <div className="space-y-6">
             {selectedLiga === 'all' ? (
               // Mostrar todas las ligas con todas sus categorías
               ligas.map(liga => {
                 const categoriasLiga = categorias.filter(cat => cat.liga_id === liga.id)
                 const partidosLiga = getPartidosByLiga(liga.id)
                 

                 
                 // Solo mostrar ligas que tengan partidos jugados
                 if (partidosLiga.length === 0) return null

                 return (
                   <div key={liga.id} className="space-y-4">
                     <div className="border-b border-gray-700 pb-2">
                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
                         <Trophy className="h-5 w-5 text-[#E2FF1B]" />
                         {liga.nombre}
                       </h2>
                     </div>
                     {categoriasLiga.map(categoria => {
                       const partidosCategoria = getPartidosByLigaYCategoria(liga.id.toString(), categoria.id.toString())
                       // Solo mostrar categorías que tengan partidos jugados
                       if (partidosCategoria.length === 0) return null

                       return (
                         <TablaPosiciones
                           key={categoria.id}
                           liga={liga}
                           partidos={partidosCategoria}
                           inscripciones={inscripciones}
                           categoria={categoria}
                         />
                       )
                     })}
                   </div>
                 )
               })
             ) : (
               // Mostrar liga específica con todas sus categorías o categoría específica
               (() => {
                 const liga = getLigaById(selectedLiga)
                 if (!liga) return null

                 // Si hay categoría específica seleccionada, mostrar solo esa
                 if (selectedCategoria !== 'all') {
                   const categoria = getCategoriaById(selectedCategoria)
                   if (!categoria) return null

                   const partidosFiltrados = getPartidosByLigaYCategoria(selectedLiga, selectedCategoria)
                   if (partidosFiltrados.length === 0) return null

                   return (
                     <TablaPosiciones
                       liga={liga}
                       partidos={partidosFiltrados}
                       inscripciones={inscripciones}
                       categoria={categoria}
                     />
                   )
                 }

                 // Si no hay categoría específica, mostrar todas las categorías de la liga
                 const categoriasLiga = filteredCategorias
                 return (
                   <div className="space-y-4">
                     <div className="border-b border-gray-700 pb-2">
                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
                         <Trophy className="h-5 w-5 text-[#E2FF1B]" />
                         {liga.nombre}
                       </h2>
                     </div>
                     {categoriasLiga.map(categoria => {
                       const partidosCategoria = getPartidosByLigaYCategoria(selectedLiga, categoria.id.toString())
                       if (partidosCategoria.length === 0) return null

                       return (
                         <TablaPosiciones
                           key={categoria.id}
                           liga={liga}
                           partidos={partidosCategoria}
                           inscripciones={inscripciones}
                           categoria={categoria}
                         />
                       )
                     })}
                   </div>
                 )
               })()
             )}
           </div>

          {/* Estado vacío */}
          {selectedLiga === 'all' && ligas.filter(liga => {
            const categoriasLiga = categorias.filter(cat => cat.ligas?.id === liga.id)
            return categoriasLiga.some(categoria => 
              getPartidosByLigaYCategoria(liga.id.toString(), categoria.id.toString()).length > 0
            )
          }).length === 0 && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No hay partidos jugados</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  No se encontraron partidos jugados para mostrar las tablas de posiciones
                </p>
                <div className="mt-4">
                  <Link href="/admin/ligas/partidos">
                    <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Gestionar Partidos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedLiga !== 'all' && selectedCategoria === 'all' && 
           filteredCategorias.every(categoria => 
             getPartidosByLigaYCategoria(selectedLiga, categoria.id.toString()).length === 0
           ) && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No hay partidos jugados</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  No se encontraron partidos jugados para la liga seleccionada
                </p>
              </CardContent>
            </Card>
          )}

          {selectedLiga !== 'all' && selectedCategoria !== 'all' && 
           getPartidosByLigaYCategoria(selectedLiga, selectedCategoria).length === 0 && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No hay partidos jugados</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  No se encontraron partidos jugados para la liga y categoría seleccionadas
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 