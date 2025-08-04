'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Spinner } from '@/components/ui/spinner'
import { Trophy, Medal, Users, ArrowUp, ArrowDown, Filter, Crown, Info, Award, Target, Search, X, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from 'next/link'

export default function Rankings() {
  const [loading, setLoading] = useState(true)
  const [rankingsData, setRankingsData] = useState([])
  const [titulosData, setTitulosData] = useState([])
  const [error, setError] = useState(null)
  const [selectedCategoria, setSelectedCategoria] = useState('todos')
  const [selectedAño, setSelectedAño] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [showInfoDialog, setShowInfoDialog] = useState(false)

  // Función para cargar datos de ranking_jugadores desde Supabase
  const fetchRankingData = async () => {
    try {
      const { data, error } = await supabase
        .from('ranking_jugadores')
        .select(`
          *,
          usuario:usuarios(id, nombre, apellido, email)
        `)
        .order('puntos', { ascending: false })

      if (error) {
        throw new Error('Error al cargar los datos de ranking')
      }

      // Función para capitalizar la primera letra de cada palabra
      const capitalizeWords = (str) => {
        if (!str) return str
        return str
          .toLowerCase()
          .split(' ')
          .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
          .join(' ')
      }

      // Transformar datos para el formato esperado
      const transformedData = data.map((jugador, index) => {
        // Usar el nombre del usuario vinculado si está disponible, sino usar el nombre del jugador
        let nombreMostrar = ''
        if (jugador.usuario) {
          // Usar el nombre completo del usuario vinculado
          nombreMostrar = `${jugador.usuario.nombre} ${jugador.usuario.apellido}`
        } else {
          // Usar el nombre del jugador de ranking
          nombreMostrar = jugador.nombre ? `${jugador.nombre} ${jugador.apellido}` : jugador.apellido
        }

        return {
          id: jugador.id,
          nombre: capitalizeWords(nombreMostrar),
          categoria: jugador.categoria || 'Sin categoría',
          puntos: jugador.puntos || 0,
          año: '2025',
          usuario_vinculado: jugador.usuario
        }
      }).filter(row => row.nombre && row.nombre.trim() !== '')

      return transformedData
    } catch (err) {
      console.error('Error cargando datos de ranking:', err)
      return []
    }
  }

  // Función para cargar datos de títulos desde Supabase
  const fetchTitulosData = async () => {
    try {
      const { data, error } = await supabase
        .from('titulos_jugadores')
        .select(`
          *,
          usuario:usuarios(id, nombre, apellido, email)
        `)
        .order('titulos', { ascending: false })

      if (error) {
        throw new Error('Error al cargar los datos de títulos')
      }

      // Transformar datos de títulos
      const titulosTransformed = data.map((jugador, index) => {
        // Usar el nombre del usuario vinculado si está disponible, sino usar el nombre del jugador
        let nombreMostrar = ''
        if (jugador.usuario) {
          // Usar el nombre completo del usuario vinculado
          nombreMostrar = `${jugador.usuario.nombre} ${jugador.usuario.apellido}`
        } else {
          // Usar el nombre del jugador de títulos
          nombreMostrar = jugador.nombre ? `${jugador.nombre} ${jugador.apellido}` : jugador.apellido
        }

        return {
          id: jugador.id,
          nombre: limpiarNombreDuplicado(nombreMostrar),
          categoria: jugador.categoria || 'Sin categoría',
          titulos: jugador.titulos || 0,
          año: jugador.anio || '2025',
          usuario_vinculado: jugador.usuario
        }
      }).filter(row => row.nombre && row.nombre.trim() !== '')

      setTitulosData(titulosTransformed)
    } catch (err) {
      console.error('Error cargando títulos:', err)
    }
  }

  // Función para capitalizar nombres (primera letra de cada palabra en mayúscula)
  const capitalizarNombre = (nombre) => {
    if (!nombre) return ''
    return nombre
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ')
  }

  // Función para manejar nombres duplicados (ej: "Azaretto Azaretto" -> "Azaretto")
  const limpiarNombreDuplicado = (nombre) => {
    if (!nombre) return nombre
    
    const palabras = nombre.trim().split(' ')
    if (palabras.length === 2 && palabras[0].toLowerCase() === palabras[1].toLowerCase()) {
      // Si las dos palabras son iguales, devolver solo una
      return capitalizarNombre(palabras[0])
    }
    
    return capitalizarNombre(nombre)
  }

  // Función para agrupar títulos por jugador
  const agruparTitulosPorJugador = (titulosData) => {
    const jugadoresAgrupados = {}
    
    titulosData.forEach(row => {
      // Usar el nombre tal como viene de fetchTitulosData (ya capitalizado)
      const nombreKey = row.nombre.trim().toLowerCase()
      
      if (jugadoresAgrupados[nombreKey]) {
        // Si el jugador ya existe, sumar títulos y agregar torneo individual
        jugadoresAgrupados[nombreKey].titulos += row.titulos
        jugadoresAgrupados[nombreKey].torneos.push({
          categoria: row.categoria,
          año: row.año,
          titulos: row.titulos,
          id: row.id // Agregar ID único para cada torneo
        })
        // Mantener el usuario vinculado si existe
        if (row.usuario_vinculado && !jugadoresAgrupados[nombreKey].usuario_vinculado) {
          jugadoresAgrupados[nombreKey].usuario_vinculado = row.usuario_vinculado
        }
      } else {
        // Si es la primera vez que aparece este jugador
        jugadoresAgrupados[nombreKey] = {
          id: `titulo-${row.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nombre: row.nombre.trim(), // Usar el nombre original ya capitalizado
          titulos: row.titulos,
          usuario_vinculado: row.usuario_vinculado,
          torneos: [{
            categoria: row.categoria,
            año: row.año,
            titulos: row.titulos,
            id: row.id // Agregar ID único para cada torneo
          }]
        }
      }
    })
    
    // Convertir el objeto a array y asignar nuevos IDs
    return Object.values(jugadoresAgrupados)
      .map((jugador, index) => ({
        ...jugador,
        id: `titulo-agrupado-${index + 1}`
      }))
      .sort((a, b) => b.titulos - a.titulos)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Cargar datos de ranking desde Supabase
        const data = await fetchRankingData()
        setRankingsData(data)
        
        // Cargar datos de títulos
        await fetchTitulosData()
        
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
        // Mostrar el popup informativo después de cargar los datos
        setShowInfoDialog(true)
      }
    }

    fetchData()
  }, []) // Solo ejecutar una vez al cargar la página

  // Filtrar datos según selección y búsqueda
  const filteredRankings = rankingsData.filter(row => {
    if (selectedAño !== 'todos' && row.año !== selectedAño) return false
    if (selectedCategoria !== 'todos' && row.categoria !== selectedCategoria) return false
    if (searchTerm && !row.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  }).sort((a, b) => b.puntos - a.puntos)

  // Debug: verificar que el filtrado funciona
  console.log('Search term:', searchTerm)
  console.log('Filtered rankings count:', filteredRankings.length)
  console.log('Original rankings count:', rankingsData.length)

  const filteredTitulos = titulosData.filter(row => {
    // Solo filtrar por año si el usuario ha seleccionado un año específico
    if (selectedAño !== 'todos' && row.año !== selectedAño) return false
    if (selectedCategoria !== 'todos' && row.categoria !== selectedCategoria) return false
    return true
  })

  // Función para obtener la posición real en el ranking por puntos
  const getPosicionReal = (usuarioId) => {
    if (!usuarioId) return null
    
    // Ordenar todos los rankings por puntos (sin filtros)
    const rankingsCompletos = rankingsData.sort((a, b) => b.puntos - a.puntos)
    
    // Encontrar la posición del jugador
    const posicion = rankingsCompletos.findIndex(jugador => 
      jugador.usuario_vinculado?.id === usuarioId
    )
    
    return posicion !== -1 ? posicion + 1 : null
  }

  // Agrupar títulos por jugador y aplicar filtro de búsqueda después del agrupamiento
  const titulosAgrupados = agruparTitulosPorJugador(filteredTitulos).filter(jugador => {
    if (searchTerm && !jugador.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black container mx-auto px-4 pb-8 flex flex-col">
      <main className="flex-1 flex flex-col">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 pt-8">Ranking 2025</h1>
              <p className="text-sm sm:text-base text-gray-400">Los mejores jugadores de 3gen Padel por categorías</p>
            </div>
            <button
              onClick={() => setShowInfoDialog(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-500/30 mt-3 sm:mt-0 w-fit"
            >
              <Info className="w-4 h-4" />
              <span className="text-sm">Info puntos</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Buscar jugador</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-800 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Año</label>
              <Select
                value={selectedAño}
                onValueChange={setSelectedAño}
              >
                <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="todos">Todos los años</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Categoría</label>
              <Select
                value={selectedCategoria}
                onValueChange={setSelectedCategoria}
              >
                <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                  <SelectItem value="C3">C3</SelectItem>
                  <SelectItem value="C4">C4</SelectItem>
                  <SelectItem value="C5">C5</SelectItem>
                  <SelectItem value="C6">C6</SelectItem>
                  <SelectItem value="C7">C7</SelectItem>
                  <SelectItem value="C8">C8</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Contenedor de las dos tablas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Tabla de Rankings por Puntos */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col">
            <div className="p-4 sm:p-6 flex-1 flex flex-col">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-2 lg:mb-0">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#E2FF1B]" />
                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      {selectedCategoria !== 'todos' ? `Ranking ${selectedCategoria}` : 'Ranking por puntos'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{filteredRankings.length} Registros</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto lg:overflow-visible flex-1">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Pos</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Jugador</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Categoría</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Año</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRankings.length > 0 ? (
                      filteredRankings.map((row, index) => (
                        <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700 text-white text-xs font-bold">
                                {index + 1}
                              </div>
                              {index < 3 && (
                                <Medal className={`w-4 h-4 ${
                                  index === 0 ? 'text-yellow-400' :
                                  index === 1 ? 'text-gray-300' :
                                  'text-amber-600'
                                }`} />
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              {row.usuario_vinculado ? (
                                <Link 
                                  href={`/jugadores/${row.usuario_vinculado.id}?posicion=${getPosicionReal(row.usuario_vinculado.id)}`}
                                  className="text-sm sm:text-base text-white font-medium hover:text-[#E2FC1D] transition-colors"
                                >
                                  {row.nombre}
                                </Link>
                              ) : (
                                <span className="text-sm sm:text-base text-white font-medium opacity-75">
                                  {row.nombre}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full text-xs border border-blue-500/30">
                              {row.categoria}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded-full text-xs border border-green-500/30">
                              {row.año}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm sm:text-base text-white font-bold">{row.puntos}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-400">
                          No se encontraron rankings con los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tabla de Títulos */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col">
            <div className="p-4 sm:p-6 flex-1 flex flex-col">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-2 lg:mb-0">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#E2FF1B]" />
                    <h2 className="text-lg sm:text-xl font-semibold text-white">Títulos por jugador</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                      <Crown className="w-4 h-4" />
                      <span>{titulosAgrupados.length} Jugadores</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto lg:overflow-visible flex-1">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Pos</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Jugador</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Títulos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {titulosAgrupados.length > 0 ? (
                      titulosAgrupados.map((row, index) => (
                        <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700 text-white text-xs font-bold">
                                {index + 1}
                              </div>
                              {index < 3 && (
                                <Medal className={`w-4 h-4 ${
                                  index === 0 ? 'text-yellow-400' :
                                  index === 1 ? 'text-gray-300' :
                                  'text-amber-600'
                                }`} />
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              {row.usuario_vinculado ? (
                                <Link 
                                  href={`/jugadores/${row.usuario_vinculado.id}?posicion=${getPosicionReal(row.usuario_vinculado.id)}`}
                                  className="text-sm sm:text-base text-white font-medium hover:text-[#E2FC1D] transition-colors"
                                >
                                  {row.nombre}
                                </Link>
                              ) : (
                                <span className="text-sm sm:text-base text-white font-medium opacity-75">
                                  {row.nombre}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="relative group">
                              <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-yellow-400" />
                                <span className="text-lg text-white font-bold">{row.titulos}</span>
                              </div>
                              <div className="absolute top-1/2 right-full transform -translate-y-1/2 mr-2 hidden md:group-hover:block z-[9999] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-gray-800 border border-yellow-500/30 rounded-lg p-3 shadow-xl text-xs backdrop-blur-sm min-w-[280px]">
                                  {row.torneos.map((torneo, idx) => (
                                    <div key={torneo.id || idx} className="text-white flex items-center justify-between py-1">
                                      <div className="flex items-center gap-2">
                                        <span className="bg-[#E2FC1D]/20 text-[#E2FC1D] px-1.5 py-0.5 rounded text-xs border border-[#E2FC1D]/30">
                                          {torneo.categoria}
                                        </span>
                                        <span className="text-gray-300 text-xs">
                                          {torneo.año}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Trophy className="w-3 h-3 text-yellow-400" />
                                        <span className="text-yellow-400 text-xs font-medium">
                                          {torneo.titulos} título{torneo.titulos !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-gray-400">
                          No se encontraron títulos con los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Popup informativo sobre puntos */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#E2FF1B]" />
              Sistema de Puntos 2025
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <p className="text-gray-300 text-xs sm:text-sm">
              Los puntos se otorgan según la fase del torneo en la que el jugador participe:
            </p>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600/20 text-green-300 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border border-green-500/30 flex-shrink-0">
                    1
                  </div>
                  <span className="text-white text-xs sm:text-sm font-medium truncate">Fase de Grupos</span>
                </div>
                <span className="text-green-300 text-xs sm:text-sm font-bold ml-2 flex-shrink-0">1 punto</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600/20 text-blue-300 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border border-blue-500/30 flex-shrink-0">
                    2
                  </div>
                  <span className="text-white text-xs sm:text-sm font-medium truncate">Octavos de Final</span>
                </div>
                <span className="text-blue-300 text-xs sm:text-sm font-bold ml-2 flex-shrink-0">2 puntos</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600/20 text-purple-300 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border border-purple-500/30 flex-shrink-0">
                    3
                  </div>
                  <span className="text-white text-xs sm:text-sm font-medium truncate">Cuartos de Final</span>
                </div>
                <span className="text-purple-300 text-xs sm:text-sm font-bold ml-2 flex-shrink-0">3 puntos</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-600/20 text-orange-300 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border border-orange-500/30 flex-shrink-0">
                    4
                  </div>
                  <span className="text-white text-xs sm:text-sm font-medium truncate">Semifinales</span>
                </div>
                <span className="text-orange-300 text-xs sm:text-sm font-bold ml-2 flex-shrink-0">5 puntos</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-600/20 text-yellow-300 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border border-yellow-500/30 flex-shrink-0">
                    5
                  </div>
                  <span className="text-white text-xs sm:text-sm font-medium truncate">Final</span>
                </div>
                <span className="text-yellow-300 text-xs sm:text-sm font-bold ml-2 flex-shrink-0">7 puntos</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-xs">
                <strong>Nota:</strong> Los puntos se acumulan a lo largo de la temporada 2025. 
                Cuanto más lejos llegues en los torneos, más puntos obtienes.
              </p>
            </div>
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-xs">
                Ranking sujeto a pendiente actualización.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 