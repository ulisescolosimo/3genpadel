'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, ExternalLink, Calendar, MapPin, Users, Clock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useTournamentData } from '@/hooks/useTournamentData'

// Función para formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return null
  try {
    // Si viene en formato DD/MM o DD/MM/YYYY, parsearlo correctamente
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/')
      const currentYear = new Date().getFullYear()
      const fullYear = year || currentYear
      // Crear fecha con UTC para evitar problemas de zona horaria
      const date = new Date(fullYear, parseInt(month) - 1, parseInt(day))
      
      if (isNaN(date.getTime())) {
        return dateString
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
      })
    }
    
    // Si viene en formato ISO, parsearlo normalmente pero considerando zona horaria
    const date = new Date(dateString + 'T00:00:00')
    if (isNaN(date.getTime())) {
      return dateString
    }
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    })
  } catch {
    return dateString
  }
}

export default function LiveTournamentNotification() {
  const [isMinimized, setIsMinimized] = useState(true)
  const [currentTournamentIndex, setCurrentTournamentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [direction, setDirection] = useState('right') // 'left' or 'right'
  
  const { tournaments, loading } = useTournamentData()

  useEffect(() => {
    // Reset índice si no hay torneos o si el índice actual es mayor que los torneos disponibles
    if (tournaments.length === 0 || currentTournamentIndex >= tournaments.length) {
      setCurrentTournamentIndex(0)
    }
  }, [tournaments, currentTournamentIndex])

  // Función para cambiar entre torneos con animación
  const nextTournament = () => {
    if (tournaments.length > 1 && !isTransitioning) {
      setIsTransitioning(true)
      setDirection('right')
      
      setTimeout(() => {
        setCurrentTournamentIndex((prev) => (prev + 1) % tournaments.length)
        setTimeout(() => setIsTransitioning(false), 100)
      }, 150)
    }
  }

  const previousTournament = () => {
    if (tournaments.length > 1 && !isTransitioning) {
      setIsTransitioning(true)
      setDirection('left')
      
      setTimeout(() => {
        setCurrentTournamentIndex((prev) => (prev - 1 + tournaments.length) % tournaments.length)
        setTimeout(() => setIsTransitioning(false), 100)
      }, 150)
    }
  }

  // No mostrar si no hay torneos activos o está cargando
  if (loading || tournaments.length === 0) {
    return null
  }

  const currentTournament = tournaments[currentTournamentIndex]

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in sm:bottom-6 sm:right-6 max-w-[calc(100vw-2rem)]">
      <div 
        className={`bg-gray-900/95 backdrop-blur-sm border border-[#E2FF1B]/20 rounded-lg shadow-xl transition-all duration-300 ${
          isMinimized 
            ? 'p-2 sm:p-2.5 w-[160px] sm:w-[180px] cursor-pointer hover:bg-gray-800/95 hover:border-[#E2FF1B]/40 group touch-manipulation hover:shadow-xl' 
            : 'p-3 sm:p-3.5 w-[280px] sm:w-[320px] max-w-[calc(100vw-2rem)]'
        }`}
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        <div className={`flex flex-col transition-all duration-200 ${isMinimized ? 'gap-1' : 'gap-2.5 sm:gap-3'}`}>
          {/* Header */}
          {!isMinimized && (
            <div className="space-y-2">
              {/* Línea superior: EN VIVO + Controles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping opacity-75" />
                  </div>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">LIVE</span>
                  {tournaments.length > 1 && (
                    <div className="flex items-center gap-1 ml-2">
                      {tournaments.map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            index === currentTournamentIndex
                              ? 'bg-[#E2FF1B] scale-110'
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {tournaments.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isTransitioning}
                        className={`text-gray-400 hover:text-white h-6 w-6 p-0 transition-all duration-200 ${
                          isTransitioning ? 'opacity-50 scale-95' : 'hover:scale-110 hover:bg-[#E2FF1B]/10'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          previousTournament()
                        }}
                      >
                        <ChevronLeft className={`h-3 w-3 transition-transform duration-200 ${
                          isTransitioning && direction === 'left' ? 'scale-125' : ''
                        }`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isTransitioning}
                        className={`text-gray-400 hover:text-white h-6 w-6 p-0 transition-all duration-200 ${
                          isTransitioning ? 'opacity-50 scale-95' : 'hover:scale-110 hover:bg-[#E2FF1B]/10'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          nextTournament()
                        }}
                      >
                        <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${
                          isTransitioning && direction === 'right' ? 'scale-125' : ''
                        }`} />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white h-6 w-6 p-0"
                    onClick={() => setIsMinimized(true)}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Línea inferior: Nombre del torneo */}
              <div>
                <h3 className={`text-sm font-bold text-white leading-tight transition-all duration-200 ${
                  isTransitioning 
                    ? direction === 'right' ? 'translate-x-2 opacity-0' : '-translate-x-2 opacity-0'
                    : 'translate-x-0 opacity-100'
                }`}>
                  {currentTournament.nombre_torneo || 'Torneo en Vivo'}
                </h3>
                {currentTournament.categoria && (
                  <p className={`text-[10px] text-[#E2FF1B] font-medium uppercase tracking-wide transition-all duration-200 ${
                    isTransitioning 
                      ? direction === 'right' ? 'translate-x-2 opacity-0' : '-translate-x-2 opacity-0'
                      : 'translate-x-0 opacity-100'
                  }`}>
                    {currentTournament.categoria}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {isMinimized && (
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-gradient-to-br from-[#E2FF1B]/20 to-[#E2FF1B]/10 rounded-lg group-hover:from-[#E2FF1B]/30 group-hover:to-[#E2FF1B]/20 transition-all duration-300">
                <Trophy className="w-4 h-4 text-[#E2FF1B]" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping opacity-75" />
                  </div>
                  <span className="text-[10px] text-red-500 font-medium">LIVE</span>
                </div>
                <span className="text-[10px] text-gray-400 leading-none">Toca para ver más</span>
              </div>
            </div>
          )}

          {/* Contenido */}
          {!isMinimized && (
            <div className={`space-y-2 sm:space-y-3 transition-all duration-200 ${
              isTransitioning 
                ? direction === 'right' ? 'translate-x-2 opacity-0' : '-translate-x-2 opacity-0'
                : 'translate-x-0 opacity-100'
            }`}>
              {/* Jugadores */}
              {(currentTournament.jugador1_nombre || currentTournament.jugador2_nombre) && (
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-md p-2">
                  <div className="flex items-center justify-between gap-1">
                    {currentTournament.jugador1_nombre && (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-xs font-semibold text-white truncate">
                          {currentTournament.jugador1_nombre} {currentTournament.jugador1_apellido}
                        </span>
                        {currentTournament.ranking_jugador1 && (
                          <span className="bg-[#E2FF1B]/20 text-[#E2FF1B] px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0">
                            #{currentTournament.ranking_jugador1}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {currentTournament.jugador1_nombre && currentTournament.jugador2_nombre && (
                      <div className="flex items-center justify-center px-1 flex-shrink-0">
                        <div className="w-1 h-1 rounded-full bg-[#E2FF1B] mx-1"></div>
                        <div className="w-1 h-1 rounded-full bg-[#E2FF1B]"></div>
                      </div>
                    )}
                    
                    {currentTournament.jugador2_nombre && (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                        {currentTournament.ranking_jugador2 && (
                          <span className="bg-[#E2FF1B]/20 text-[#E2FF1B] px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0">
                            #{currentTournament.ranking_jugador2}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-white truncate">
                          {currentTournament.jugador2_nombre} {currentTournament.jugador2_apellido}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Información del evento */}
              {(currentTournament.fecha || currentTournament.hora || currentTournament.ubicacion_torneo) && (
                <div className="bg-gray-800/20 border border-gray-700/20 rounded-md p-2">
                  <div className="flex items-center gap-3 text-xs text-white font-medium">
                    {currentTournament.fecha && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(currentTournament.fecha)}</span>
                      </div>
                    )}
                    {currentTournament.hora && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{currentTournament.hora}</span>
                      </div>
                    )}
                    {currentTournament.ubicacion_torneo && (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{currentTournament.ubicacion_torneo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(currentTournament.proximo_partido_fecha || currentTournament.proximo_partido_hora) && (
                <div className="bg-gray-800/25 border border-gray-700/25 rounded-md p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">Próximo</span>
                  </div>
                  <div className="space-y-1">
                    {currentTournament.proximo_partido_fecha && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-white font-medium">{formatDate(currentTournament.proximo_partido_fecha)}</span>
                      </div>
                    )}
                    {currentTournament.proximo_partido_hora && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-white font-medium">{currentTournament.proximo_partido_hora}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentTournament.link_en_vivo && (
                <Button
                  size="sm"
                  className="w-full bg-[#E2FC1D] hover:bg-[#D4E619] text-black font-bold py-2 text-xs transition-all duration-200 transform hover:scale-[1.02] touch-manipulation focus:ring-2 focus:ring-[#E2FC1D]/50 focus:ring-offset-2 focus:ring-offset-gray-900"
                  onClick={() => window.open(currentTournament.link_en_vivo, '_blank')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Play className="h-3 w-3 fill-current" />
                    <span className="uppercase tracking-wide">Ver en vivo</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 