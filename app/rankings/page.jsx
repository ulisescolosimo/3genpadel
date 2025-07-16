'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Spinner } from '@/components/ui/spinner'
import { Trophy, Medal, Users, ArrowUp, ArrowDown, Filter, Crown, Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Papa from 'papaparse'

// URL del Google Sheets CSV
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTezjXDYOeKyM5qecI5wIVupip5PyL3nWVBhsGG1vt4f54zy4BUlfuSNQhoP52TOqDJdw9E80daISfA/pub?gid=0&single=true&output=csv'

// Función para parsear CSV usando Papa Parse
const parseCSV = (csvText) => {
  console.log('Parsing CSV with Papa Parse...')
  console.log('CSV Text length:', csvText.length)
  console.log('First 200 chars:', csvText.substring(0, 200))
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Papa Parse results:', results)
        console.log('Parsed data:', results.data)
        console.log('Number of rows:', results.data.length)
        
        // Mostrar headers detectados
        if (results.data.length > 0) {
          console.log('Headers detected:', Object.keys(results.data[0]))
        }
        
        // Filtrar filas vacías y agregar IDs
        console.log('Raw results.data length:', results.data.length)
        console.log('First few raw rows:', results.data.slice(0, 3))
        console.log('First row keys:', Object.keys(results.data[0]))
        console.log('First row values:', Object.values(results.data[0]))
        
        // Primero, vamos a ver todas las filas que tienen algún contenido
        const nonEmptyRows = results.data.filter(row => {
          const hasContent = Object.values(row).some(value => value && value.toString().trim() !== '')
          console.log('Row has content:', hasContent, 'Values:', Object.values(row))
          return hasContent
        })
        
        console.log('Non-empty rows:', nonEmptyRows.length)
        console.log('First few non-empty rows:', nonEmptyRows.slice(0, 3))
        
        const filteredData = nonEmptyRows
          .filter(row => {
            console.log('Checking row for jugador:', row)
            console.log('row._1:', row._1)
            console.log('row._5 (año):', row._5)
            console.log('row._1 type:', typeof row._1)
            console.log('row._1 length:', row._1 ? row._1.length : 'undefined')
            
            // Verificar que tenga jugador válido
            const hasValidJugador = row._1 && row._1.trim() !== ''
            
            console.log('Has valid jugador:', hasValidJugador)
            console.log('Is valid:', hasValidJugador)
            
            return hasValidJugador
          })
          .map((row, index) => ({
            id: index + 1,
            ...row
          }))
        
        console.log('Filtered data length:', filteredData.length)
        console.log('Filtered data:', filteredData)
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
  const [rankings, setRankings] = useState([])
  const [error, setError] = useState(null)
  const [selectedCategoria, setSelectedCategoria] = useState('todos')
  const [selectedAño, setSelectedAño] = useState('todos')

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true)
        
        // Fetch CSV from Google Sheets
        const response = await fetch(GOOGLE_SHEETS_URL)
        if (!response.ok) {
          throw new Error('Error al cargar los datos del ranking')
        }
        
        const csvText = await response.text()
        console.log('CSV Raw Text:', csvText)
        
        const rawData = await parseCSV(csvText)
        console.log('Parsed Raw Data length:', rawData.length)
        console.log('Parsed Raw Data:', rawData)
        
        if (rawData.length === 0) {
          console.log('No raw data found, stopping here')
          setRankings([])
          setLoading(false)
          return
        }
        
        // Transformar datos al formato que necesitamos
        console.log('Starting transformation...')
        const transformedData = rawData.map(jugador => {
          console.log('Processing jugador:', jugador)
          
          const transformed = {
            id: jugador.id,
            nombre: jugador._1, // Jugador está en _1
            posicion: 0, // Se calculará después
            categoria: jugador._6, // Categoria está en _6
            partidosFase: parseInt(jugador._2) || 0, // Partidos Ganados Fase está en _2
            partidosLlave: parseInt(jugador._3) || 0, // Partidos Ganados Llave está en _3
            partidosTotal: parseInt(jugador._4) || 0, // Partidos Ganados Total está en _4
            titulos: parseInt(jugador._7) || 0, // Titulos está en _7
            año: jugador._5 || '2025' // Año está en _5
          }
          
          console.log('Transformed jugador:', transformed)
          return transformed
        })
        
        // Ordenar por partidos totales y asignar posiciones
        const sortedData = transformedData
          .sort((a, b) => b.partidosTotal - a.partidosTotal)
          .map((jugador, index) => ({
            ...jugador,
            posicion: index + 1
          }))
        
        console.log('Final Transformed Data length:', sortedData.length)
        console.log('Final Transformed Data:', sortedData)
        setRankings(sortedData)
        console.log('Rankings state set with', sortedData.length, 'items')
      } catch (err) {
        console.error('Error fetching rankings:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [])

  console.log('Current rankings state:', rankings)
  console.log('Current rankings length:', rankings.length)
  
  // Filtrar rankings según selección
  const filteredRankings = rankings.filter(jugador => {
    // Filtro por año
    if (selectedAño !== 'todos' && jugador.año !== selectedAño) {
      return false
    }
    
    // Filtro por categoría
    if (selectedCategoria !== 'todos' && jugador.categoria !== selectedCategoria) {
      return false
    }
    
    return true
  }).map((jugador, index) => ({
    ...jugador,
    posicion: index + 1
  }))
  
  console.log('Filtered rankings length:', filteredRankings.length)
  console.log('Filtered rankings:', filteredRankings)

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
      <main className="container mx-auto px-4 pb-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 pt-8">Rankings</h1>
          <p className="text-sm sm:text-base text-gray-400">Los mejores jugadores de 3gen Padel</p>
        </div>

        <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#E2FF1B]" />
                <h2 className="text-lg sm:text-xl font-semibold text-white">Clasificación General</h2>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>{filteredRankings.length} Jugadores</span>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
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

            <div className="space-y-3 sm:space-y-4">
              {filteredRankings.length > 0 ? (
                filteredRankings.map((jugador) => (
                  <div
                    key={jugador.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-700 text-white text-sm sm:text-base font-bold">
                        {jugador.posicion}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base text-white font-medium">{jugador.nombre}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-300 mt-1">
                          <span className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                            {jugador.categoria}
                          </span>
                          <span className="bg-green-600/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">
                            {jugador.año}
                          </span>
                          {jugador.titulos > 0 && (
                            <span className="flex items-center gap-1 bg-yellow-600/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">
                              <Crown className="w-3 h-3" />
                              {jugador.titulos}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-300 mt-2">
                          <span className="flex items-center gap-1 group relative">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            <span className="font-medium text-blue-300">{jugador.partidosFase}</span>
                            <span>Fase</span>
                            <Info className="w-3 h-3 text-gray-500 ml-1 cursor-help" />
                            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-gray-700">
                              Partidos ganados en la fase de grupos
                            </div>
                          </span>
                          <span className="flex items-center gap-1 group relative">
                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                            <span className="font-medium text-purple-300">{jugador.partidosLlave}</span>
                            <span>Llave</span>
                            <Info className="w-3 h-3 text-gray-500 ml-1 cursor-help" />
                            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-gray-700">
                              Partidos ganados en la fase eliminatoria
                            </div>
                          </span>
                          <span className="flex items-center gap-1 group relative">
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                            <span className="font-medium text-white">{jugador.partidosTotal}</span>
                            <span>Total</span>
                            <Info className="w-3 h-3 text-gray-500 ml-1 cursor-help" />
                            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-gray-700">
                              Total de partidos ganados (Fase + Llave)
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                    {jugador.posicion <= 3 && (
                      <Medal className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        jugador.posicion === 1 ? 'text-yellow-400' :
                        jugador.posicion === 2 ? 'text-gray-300' :
                        'text-amber-600'
                      }`} />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white mb-2">No se encontraron jugadores</h3>
                    <p className="text-gray-400 text-sm">
                      {selectedAño !== 'todos' && selectedCategoria !== 'todos' 
                        ? `No hay jugadores en ${selectedAño} de la categoría ${selectedCategoria}`
                        : selectedAño !== 'todos'
                        ? `No hay jugadores en ${selectedAño}`
                        : selectedCategoria !== 'todos'
                        ? `No hay jugadores en la categoría ${selectedCategoria}`
                        : 'No hay jugadores disponibles'
                      }
                    </p>
                  </div>
                  {(selectedAño !== 'todos' || selectedCategoria !== 'todos') && (
                    <button
                      onClick={() => {
                        setSelectedAño('todos')
                        setSelectedCategoria('todos')
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Ver todos los jugadores
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 