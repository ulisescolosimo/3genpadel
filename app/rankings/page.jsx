'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Spinner } from '@/components/ui/spinner'
import { Trophy, Medal, Users, ArrowUp, ArrowDown, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Base de datos de ejemplo más extensa
const mockRankings = [
  // Hombres
  { id: 1, nombre: 'Martín Sánchez', puntos: 1850, posicion: 1, cambio: 2, genero: 'hombre', nivel: 'Avanzado' },
  { id: 2, nombre: 'Lucas Rodríguez', puntos: 1800, posicion: 2, cambio: -1, genero: 'hombre', nivel: 'Avanzado' },
  { id: 3, nombre: 'Juan Pérez', puntos: 1750, posicion: 3, cambio: 1, genero: 'hombre', nivel: 'Intermedio' },
  { id: 4, nombre: 'Carlos Gómez', puntos: 1700, posicion: 4, cambio: 0, genero: 'hombre', nivel: 'Intermedio' },
  { id: 5, nombre: 'Pedro Martínez', puntos: 1650, posicion: 5, cambio: -2, genero: 'hombre', nivel: 'Intermedio' },
  { id: 6, nombre: 'Diego Fernández', puntos: 1600, posicion: 6, cambio: 1, genero: 'hombre', nivel: 'Intermedio' },
  { id: 7, nombre: 'Santiago López', puntos: 1550, posicion: 7, cambio: 0, genero: 'hombre', nivel: 'Principiante' },
  { id: 8, nombre: 'Alejandro Torres', puntos: 1500, posicion: 8, cambio: -1, genero: 'hombre', nivel: 'Principiante' },
  { id: 9, nombre: 'Matías Ramírez', puntos: 1450, posicion: 9, cambio: 2, genero: 'hombre', nivel: 'Principiante' },
  { id: 10, nombre: 'Nicolás Díaz', puntos: 1400, posicion: 10, cambio: 0, genero: 'hombre', nivel: 'Principiante' },

  // Mujeres
  { id: 11, nombre: 'María García', puntos: 1850, posicion: 1, cambio: 2, genero: 'mujer', nivel: 'Avanzado' },
  { id: 12, nombre: 'Ana Martínez', puntos: 1800, posicion: 2, cambio: -1, genero: 'mujer', nivel: 'Avanzado' },
  { id: 13, nombre: 'Laura Fernández', puntos: 1750, posicion: 3, cambio: 1, genero: 'mujer', nivel: 'Intermedio' },
  { id: 14, nombre: 'Sofía López', puntos: 1700, posicion: 4, cambio: 0, genero: 'mujer', nivel: 'Intermedio' },
  { id: 15, nombre: 'Valentina Rodríguez', puntos: 1650, posicion: 5, cambio: -2, genero: 'mujer', nivel: 'Intermedio' },
  { id: 16, nombre: 'Camila Sánchez', puntos: 1600, posicion: 6, cambio: 1, genero: 'mujer', nivel: 'Intermedio' },
  { id: 17, nombre: 'Lucía Pérez', puntos: 1550, posicion: 7, cambio: 0, genero: 'mujer', nivel: 'Principiante' },
  { id: 18, nombre: 'Isabella Gómez', puntos: 1500, posicion: 8, cambio: -1, genero: 'mujer', nivel: 'Principiante' },
  { id: 19, nombre: 'Emma Torres', puntos: 1450, posicion: 9, cambio: 2, genero: 'mujer', nivel: 'Principiante' },
  { id: 20, nombre: 'Mía Ramírez', puntos: 1400, posicion: 10, cambio: 0, genero: 'mujer', nivel: 'Principiante' },

  // Mixto
  { id: 21, nombre: 'Martín y María', puntos: 1900, posicion: 1, cambio: 2, genero: 'mixto', nivel: 'Avanzado' },
  { id: 22, nombre: 'Lucas y Ana', puntos: 1850, posicion: 2, cambio: -1, genero: 'mixto', nivel: 'Avanzado' },
  { id: 23, nombre: 'Juan y Laura', puntos: 1800, posicion: 3, cambio: 1, genero: 'mixto', nivel: 'Intermedio' },
  { id: 24, nombre: 'Carlos y Sofía', puntos: 1750, posicion: 4, cambio: 0, genero: 'mixto', nivel: 'Intermedio' },
  { id: 25, nombre: 'Pedro y Valentina', puntos: 1700, posicion: 5, cambio: -2, genero: 'mixto', nivel: 'Intermedio' },
]

export default function Rankings() {
  const [loading, setLoading] = useState(true)
  const [rankings, setRankings] = useState([])
  const [error, setError] = useState(null)
  const [selectedGender, setSelectedGender] = useState('todos')
  const [selectedLevel, setSelectedLevel] = useState('todos')

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // Filtrar rankings según selección
        let filteredRankings = [...mockRankings]
        
        if (selectedGender !== 'todos') {
          filteredRankings = filteredRankings.filter(player => player.genero === selectedGender)
        }
        
        if (selectedLevel !== 'todos') {
          filteredRankings = filteredRankings.filter(player => player.nivel === selectedLevel)
        }

        // Reordenar posiciones después de filtrar
        filteredRankings = filteredRankings
          .sort((a, b) => b.puntos - a.puntos)
          .map((player, index) => ({
            ...player,
            posicion: index + 1
          }))

        setRankings(filteredRankings)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [selectedGender, selectedLevel])

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
                <span>{rankings.length} Jugadores</span>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Género</label>
                <Select
                  value={selectedGender}
                  onValueChange={setSelectedGender}
                >
                  <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="hombre">Hombres</SelectItem>
                    <SelectItem value="mujer">Mujeres</SelectItem>
                    <SelectItem value="mixto">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Nivel</label>
                <Select
                  value={selectedLevel}
                  onValueChange={setSelectedLevel}
                >
                  <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Avanzado">Avanzado</SelectItem>
                    <SelectItem value="Intermedio">Intermedio</SelectItem>
                    <SelectItem value="Principiante">Principiante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {rankings.map((jugador) => (
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
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400">
                        <span>{jugador.puntos} pts</span>
                        {jugador.cambio !== 0 && (
                          <span className={`flex items-center gap-0.5 sm:gap-1 ${
                            jugador.cambio > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {jugador.cambio > 0 ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )}
                            {Math.abs(jugador.cambio)}
                          </span>
                        )}
                        <span className="text-[10px] sm:text-xs bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">
                          {jugador.nivel}
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
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 