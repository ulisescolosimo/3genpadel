"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, Medal, TrendingUp, TrendingDown, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Componente para mostrar la tabla de posiciones
const TablaPosiciones = ({ liga, partidos, inscripciones, categoria }) => {
  // Función para validar el formato del resultado
  const validarFormatoResultado = (resultado) => {
    if (!resultado || typeof resultado !== 'string') return false
    
    const sets = resultado.split('/').map(set => set.trim()).filter(set => set.length > 0)
    if (sets.length < 2) return false
    
    // Verificar que cada set tenga el formato "X-Y" donde X e Y son números
    const formatoValido = sets.every(set => {
      const [gamesA, gamesB] = set.split('-')
      return gamesA && gamesB && !isNaN(parseInt(gamesA)) && !isNaN(parseInt(gamesB))
    })
    
    return formatoValido
  }

  // Función para calcular diferencias de sets y games basándose en el resultado
  const calcularDiferenciasResultado = (partido, equipoId) => {
    if (!validarFormatoResultado(partido.resultado)) {
      return { difSets: 0, difGames: 0 }
    }
    
    // El resultado está en formato: "7-5 / 3-6 / 6-3" o "7-6 / 6-4"
    const sets = partido.resultado.split('/').map(set => set.trim()).filter(set => set.length > 0)
    let gamesAFavor = 0
    let gamesEnContra = 0
    let setsAFavor = 0
    let setsEnContra = 0
    
    sets.forEach((set, index) => {
      const [gamesA, gamesB] = set.split('-').map(g => parseInt(g.trim()))
      if (isNaN(gamesA) || isNaN(gamesB)) {
        return
      }
      
      // Determinar qué equipo es el equipoId
      const esEquipoA = partido.equipo_a_id === equipoId
      const esEquipoB = partido.equipo_b_id === equipoId
      
      if (esEquipoA) {
        gamesAFavor += gamesA
        gamesEnContra += gamesB
        if (gamesA > gamesB) setsAFavor++
        else setsEnContra++
      } else if (esEquipoB) {
        gamesAFavor += gamesB
        gamesEnContra += gamesA
        if (gamesB > gamesA) setsAFavor++
        else setsEnContra++
      }
    })
    
    return {
      difSets: setsAFavor - setsEnContra,
      difGames: gamesAFavor - gamesEnContra
    }
  }

  // Calcular estadísticas de cada equipo
  const calcularEstadisticasEquipo = (equipoId) => {
    const partidosEquipo = partidos.filter(p => {
      const matchEquipo = p.equipo_a_id === equipoId || p.equipo_b_id === equipoId
      const matchEstado = p.estado === 'jugado'
      const matchCategoria = !categoria || p.liga_categorias?.id === categoria.id
      const tieneResultadoValido = validarFormatoResultado(p.resultado)
      
      return matchEquipo && matchEstado && matchCategoria && tieneResultadoValido
    })

    let partidosJugados = 0
    let partidosGanados = 0
    let partidosPerdidos = 0
    let puntos = 0
    let totalDifSets = 0
    let totalDifGames = 0

    partidosEquipo.forEach(partido => {
      partidosJugados++
      
      if (partido.equipo_ganador_id === equipoId) {
        partidosGanados++
        // Solo sumar puntos si están configurados
        if (partido.puntos_por_jugador && partido.puntos_por_jugador > 0) {
          puntos += partido.puntos_por_jugador
        }
      } else {
        partidosPerdidos++
      }
      
      // Calcular diferencias de sets y games
      const diferencias = calcularDiferenciasResultado(partido, equipoId)
      totalDifSets += diferencias.difSets
      totalDifGames += diferencias.difGames
    })

    return {
      partidosJugados,
      partidosGanados,
      partidosPerdidos,
      puntos,
      diferencia: partidosGanados - partidosPerdidos,
      difSets: totalDifSets,
      difGames: totalDifGames
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
  
  // Ordenar por puntos (descendente), luego por diferencia de sets, luego por diferencia de games
  const equiposOrdenados = equipos.sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos
    if (b.difSets !== a.difSets) return b.difSets - a.difSets
    return b.difGames - a.difGames
  })

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#E2FF1B]" />
          {categoria ? `${liga.nombre} - ${categoria.categoria}` : `Tabla de Posiciones - ${liga.nombre}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3 text-gray-300 font-medium">Pos</th>
                <th className="text-left p-3 text-gray-300 font-medium">Equipo</th>
                <th className="text-center p-3 text-gray-300 font-medium">PJ</th>
                <th className="text-center p-3 text-gray-300 font-medium">PG</th>
                <th className="text-center p-3 text-gray-300 font-medium">PP</th>
                <th className="text-center p-3 text-gray-300 font-medium">Pts</th>
                <th className="text-center p-3 text-gray-300 font-medium">Dif</th>
                <th className="text-center p-3 text-gray-300 font-medium">Dif Sets</th>
                <th className="text-center p-3 text-gray-300 font-medium">Dif Games</th>
              </tr>
            </thead>
            <tbody>
              {equiposOrdenados.map((equipo, index) => (
                <tr 
                  key={equipo.id} 
                  className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                    index < 3 ? 'bg-[#E2FF1B]/5' : ''
                  }`}
                >
                                     <td className="p-3">
                     <div className="flex items-center gap-2">
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
                  <td className="p-3 text-center">
                    <span className={`font-medium ${
                      equipo.difSets > 0 ? 'text-green-400' : 
                      equipo.difSets < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {equipo.difSets > 0 ? '+' : ''}{equipo.difSets}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-medium ${
                      equipo.difGames > 0 ? 'text-green-400' : 
                      equipo.difGames < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {equipo.difGames > 0 ? '+' : ''}{equipo.difGames}
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E2FF1B]"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-10">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link href="/partidos">
              <Button variant="ghost" className="text-white hover:text-[#E2FF1B] hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Partidos
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
            <span className="text-[#E2FF1B]">Tabla de</span> Posiciones
          </h1>
          <p className="text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto mb-4 px-4">
            Consulta la clasificación actual de todas las ligas y categorías
          </p>
        </div>

        {/* Filtros de liga y categoría */}
        <Card className="mb-6 bg-black/20 backdrop-blur-sm border-white/10">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Filtros en columna para mobile */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-white">Seleccionar Liga</label>
                  <Select value={selectedLiga} onValueChange={setSelectedLiga}>
                    <SelectTrigger className="bg-black/20 border-white/20 text-white h-12 w-full">
                      <SelectValue placeholder="Todas las ligas" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/20">
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
                    <SelectTrigger className="bg-black/20 border-white/20 text-white h-12 w-full">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/20">
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
              
              {/* Botón de actualizar centrado para mobile */}
              <div className="flex justify-center">
                <Button 
                  onClick={fetchData} 
                  disabled={refreshing}
                  className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 flex items-center gap-2 h-12 px-8 w-full sm:w-auto"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
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
                  <div className="mb-4">
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
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No hay partidos jugados</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                No se encontraron partidos jugados para mostrar las tablas de posiciones
              </p>
            </CardContent>
          </Card>
        )}

        {selectedLiga !== 'all' && selectedCategoria === 'all' && 
         filteredCategorias.every(categoria => 
           getPartidosByLigaYCategoria(selectedLiga, categoria.id.toString()).length === 0
         ) && (
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
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
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
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
  )
}
