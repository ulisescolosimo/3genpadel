'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Spinner } from '@/components/ui/spinner'
import { Trophy, Medal, Users, ArrowUp, ArrowDown, Filter, Crown, Info, Award, Target, Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Papa from 'papaparse'

// URLs de los Google Sheets CSV para 2025
const C8_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJlPwCH1_F1wzoxo5Ss37zJXLaozte-5FHUlFIpLcHFoI4Lf6D4oaLRteb-2NdP9ktJMkXwoG3OJWG/pub?gid=1793750983&single=true&output=csv'
const C7_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJlPwCH1_F1wzoxo5Ss37zJXLaozte-5FHUlFIpLcHFoI4Lf6D4oaLRteb-2NdP9ktJMkXwoG3OJWG/pub?gid=1978502011&single=true&output=csv'
const C6_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJlPwCH1_F1wzoxo5Ss37zJXLaozte-5FHUlFIpLcHFoI4Lf6D4oaLRteb-2NdP9ktJMkXwoG3OJWG/pub?gid=1279295909&single=true&output=csv'
const C4_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJlPwCH1_F1wzoxo5Ss37zJXLaozte-5FHUlFIpLcHFoI4Lf6D4oaLRteb-2NdP9ktJMkXwoG3OJWG/pub?gid=1997800809&single=true&output=csv'

// URLs para títulos (desde rankings2)
const TITULOS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTezjXDYOeKyM5qecI5wIVupip5PyL3nWVBhsGG1vt4f54zy4BUlfuSNQhoP52TOqDJdw9E80daISfA/pub?gid=786786570&single=true&output=csv'

// Mapeo de categorías a URLs
const CATEGORIA_URLS = {
  'C4': C4_URL,
  'C6': C6_URL,
  'C7': C7_URL,
  'C8': C8_URL
}

// Función para parsear CSV usando Papa Parse
const parseCSV = (csvText) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const filteredData = results.data
          .filter(row => {
            const hasContent = Object.values(row).some(value => value && value.toString().trim() !== '')
            return hasContent
          })
          .map((row, index) => ({
            id: index + 1,
            ...row
          }))
        
        resolve(filteredData)
      },
      error: (error) => {
        console.error('Papa Parse error:', error)
        reject(error)
      }
    })
  })
}

export default function Rankings() {
  const [loading, setLoading] = useState(true)
  const [rankingsData, setRankingsData] = useState([])
  const [titulosData, setTitulosData] = useState([])
  const [error, setError] = useState(null)
  const [selectedCategoria, setSelectedCategoria] = useState('todos')
  const [selectedAño, setSelectedAño] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  // Función para cargar datos de una categoría específica
  const fetchCategoriaData = async (categoria) => {
    const url = CATEGORIA_URLS[categoria]
    if (!url) return []

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Error al cargar datos de ${categoria}`)
      }
      
      const csvText = await response.text()
      const rawData = await parseCSV(csvText)
      
      // Transformar datos según el formato de cada categoría
      const transformedData = rawData.map(row => ({
        id: row.id,
        nombre: row.Jugador || row['Jugador '] || '',
        categoria: categoria,
        puntos: parseInt(row['Puntos'] || row['Puntos Re'] || '0') || 0,
        año: '2025'
      })).filter(row => row.nombre && row.nombre.trim() !== '')

      return transformedData
    } catch (err) {
      console.error(`Error procesando ${categoria}:`, err)
      return []
    }
  }

  // Función para cargar todos los datos
  const fetchAllData = async () => {
    const allData = []
    
    for (const categoria of Object.keys(CATEGORIA_URLS)) {
      const data = await fetchCategoriaData(categoria)
      allData.push(...data)
    }
    
    return allData
  }

  // Función para cargar datos de títulos
  const fetchTitulosData = async () => {
    try {
      // Fetch títulos CSV
      const titulosResponse = await fetch(TITULOS_URL)
      if (!titulosResponse.ok) {
        throw new Error('Error al cargar los datos de títulos')
      }
      const titulosCSV = await titulosResponse.text()
      const titulosRaw = await parseCSV(titulosCSV)
      
      // Transformar datos de títulos
      const titulosTransformed = titulosRaw.map(row => ({
        id: row.id,
        nombre: row.Jugador || row['Jugador '] || row['Jugador'] || '',
        categoria: row.Categoria || row['Categoria'] || '',
        titulos: parseInt(row['Titulos'] || row['Titulos '] || '0') || 0,
        año: row.Año || row['Año'] || '2025'
      })).filter(row => row.nombre && row.nombre.trim() !== '')

      setTitulosData(titulosTransformed)
    } catch (err) {
      console.error('Error cargando títulos:', err)
    }
  }

  // Función para agrupar títulos por jugador
  const agruparTitulosPorJugador = (titulosData) => {
    const jugadoresAgrupados = {}
    
    titulosData.forEach(row => {
      const nombre = row.nombre.trim()
      
      if (jugadoresAgrupados[nombre]) {
        // Si el jugador ya existe, sumar títulos y agregar categoría
        jugadoresAgrupados[nombre].titulos += row.titulos
        jugadoresAgrupados[nombre].categorias.push({
          categoria: row.categoria,
          año: row.año,
          titulos: row.titulos
        })
      } else {
        // Si es la primera vez que aparece este jugador
        jugadoresAgrupados[nombre] = {
          id: row.id,
          nombre: nombre,
          titulos: row.titulos,
          categorias: [{
            categoria: row.categoria,
            año: row.año,
            titulos: row.titulos
          }]
        }
      }
    })
    
    // Convertir el objeto a array y asignar nuevos IDs
    return Object.values(jugadoresAgrupados)
      .map((jugador, index) => ({
        ...jugador,
        id: index + 1
      }))
      .sort((a, b) => b.titulos - a.titulos)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        let data
        if (selectedCategoria !== 'todos') {
          // Si hay filtro de categoría, cargar solo esa categoría
          data = await fetchCategoriaData(selectedCategoria)
        } else {
          // Si no hay filtro, cargar todas las categorías
          data = await fetchAllData()
        }

        setRankingsData(data)
        
        // Cargar datos de títulos
        await fetchTitulosData()
        
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedCategoria]) // Re-ejecutar cuando cambie la categoría seleccionada

  // Filtrar datos según selección y búsqueda
  const filteredRankings = rankingsData.filter(row => {
    if (selectedAño !== 'todos' && row.año !== selectedAño) return false
    if (searchTerm && !row.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  }).sort((a, b) => b.puntos - a.puntos)

  const filteredTitulos = titulosData.filter(row => {
    // Solo filtrar por año si el usuario ha seleccionado un año específico
    if (selectedAño !== 'todos' && row.año !== selectedAño) return false
    if (selectedCategoria !== 'todos' && row.categoria !== selectedCategoria) return false
    if (searchTerm && !row.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Agrupar títulos por jugador
  const titulosAgrupados = agruparTitulosPorJugador(filteredTitulos)

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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 pt-8">Rankings 2025</h1>
          <p className="text-sm sm:text-base text-gray-400">Los mejores jugadores de 3gen Padel por categorías</p>
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
                  <SelectItem value="C4">C4</SelectItem>
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
                      {selectedCategoria !== 'todos' ? `Rankings ${selectedCategoria}` : 'Rankings por puntos'}
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
                            <span className="text-sm sm:text-base text-white font-medium">{row.nombre}</span>
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
                            <span className="text-sm sm:text-base text-white font-medium">{row.nombre}</span>
                          </td>
                          <td className="p-3">
                            <div className="relative group">
                              <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-yellow-400" />
                                <span className="text-lg text-white font-bold">{row.titulos}</span>
                              </div>
                              <div className="absolute top-1/2 right-full transform -translate-y-1/2 mr-2 hidden group-hover:block z-[9999] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-gray-800 border border-yellow-500/30 rounded-lg p-2 shadow-xl text-xs backdrop-blur-sm">
                                  <div className="text-yellow-400 font-semibold mb-1 text-center border-b border-yellow-500/20 pb-1">
                                    Títulos
                                  </div>
                                  {row.categorias.map((cat, idx) => (
                                    <div key={idx} className="text-white flex items-center gap-2 py-1">
                                      <span className="bg-blue-600/20 text-blue-300 px-1.5 py-0.5 rounded text-xs border border-blue-500/30">
                                        {cat.categoria}
                                      </span>
                                      <span className="text-gray-300 text-xs">
                                        {cat.año}
                                      </span>
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
    </div>
  )
} 