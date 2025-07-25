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

// URLs de los Google Sheets CSV
const TITULOS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTezjXDYOeKyM5qecI5wIVupip5PyL3nWVBhsGG1vt4f54zy4BUlfuSNQhoP52TOqDJdw9E80daISfA/pub?gid=786786570&single=true&output=csv'
const PARTIDOS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTezjXDYOeKyM5qecI5wIVupip5PyL3nWVBhsGG1vt4f54zy4BUlfuSNQhoP52TOqDJdw9E80daISfA/pub?gid=1033099147&single=true&output=csv'

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
  const [titulosData, setTitulosData] = useState([])
  const [partidosData, setPartidosData] = useState([])
  const [error, setError] = useState(null)
  const [selectedCategoria, setSelectedCategoria] = useState('todos')
  const [selectedAño, setSelectedAño] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
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
          nombre: row.Jugador || row['Jugador '] || '',
          categoria: row.Categoria || '',
          titulos: parseInt(row['Titulos'] || '0') || 0,
          año: row.Año || row['Año'] || '2025'
        })).filter(row => row.nombre && row.nombre.trim() !== '')

        // Fetch partidos CSV
        const partidosResponse = await fetch(PARTIDOS_URL)
        if (!partidosResponse.ok) {
          throw new Error('Error al cargar los datos de partidos')
        }
        const partidosCSV = await partidosResponse.text()
        const partidosRaw = await parseCSV(partidosCSV)
        
        // Transformar datos de partidos
        const partidosTransformed = partidosRaw.map(row => ({
          id: row.id,
          nombre: row.Jugador || row['Jugador '] || '',
          categoria: row.Categoria || '',
          partidosGanados: parseInt(row['Partidos Ganados'] || '0') || 0,
          año: row.Año || row['Año'] || '2025'
        })).filter(row => row.nombre && row.nombre.trim() !== '')

        setTitulosData(titulosTransformed)
        setPartidosData(partidosTransformed)
        
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar datos según selección y búsqueda
  const filteredTitulos = titulosData.filter(row => {
    if (selectedAño !== 'todos' && row.año !== selectedAño) return false
    if (selectedCategoria !== 'todos' && row.categoria !== selectedCategoria) return false
    if (searchTerm && !row.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  }).sort((a, b) => b.titulos - a.titulos)

  const filteredPartidos = partidosData.filter(row => {
    if (selectedAño !== 'todos' && row.año !== selectedAño) return false
    if (selectedCategoria !== 'todos' && row.categoria !== selectedCategoria) return false
    if (searchTerm && !row.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    // Primero por año (más reciente primero)
    if (b.año !== a.año) {
      return b.año - a.año
    }
    // Si tienen el mismo año, ordenar por partidos ganados (descendente)
    return b.partidosGanados - a.partidosGanados
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
    <div className="min-h-screen bg-black">
      <main className="container mx-auto px-4 pb-8 max-w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 pt-8">Rankings</h1>
          <p className="text-sm sm:text-base text-gray-400">Los mejores jugadores de 3gen Padel</p>
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
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
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
                  <SelectItem value="C5">C5</SelectItem>
                  <SelectItem value="C6">C6</SelectItem>
                  <SelectItem value="C7">C7</SelectItem>
                  <SelectItem value="C8">C8</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Contenedor de las dos tablas lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabla de Títulos */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#E2FF1B]" />
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Títulos por Jugador</h2>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                  <Crown className="w-4 h-4" />
                  <span>{filteredTitulos.length} Registros</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Pos</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Jugador</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Categoría</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Año</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Títulos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTitulos.length > 0 ? (
                      filteredTitulos.map((row, index) => (
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
                              <Crown className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm sm:text-base text-white font-bold">{row.titulos}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-400">
                          No se encontraron títulos con los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tabla de Partidos Ganados */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#E2FF1B]" />
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Partidos Ganados por Jugador</h2>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{filteredPartidos.length} Registros</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Pos</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Jugador</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Categoría</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Año</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-medium text-gray-400">Partidos Ganados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartidos.length > 0 ? (
                      filteredPartidos.map((row, index) => (
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
                              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                              <span className="text-sm sm:text-base text-white font-bold">{row.partidosGanados}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-400">
                          No se encontraron partidos con los filtros seleccionados
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