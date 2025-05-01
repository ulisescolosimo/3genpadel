'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, ExternalLink, Calendar, MapPin, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react'

export default function LiveTournamentNotification() {
  const [isMinimized, setIsMinimized] = useState(true)

  // Datos de ejemplo - estos podrían venir de una configuración
  const tournamentInfo = {
    nombre: "Torneo Internacional de Pádel",
    jugadores: [
      { nombre: "Jugador 1", apellido: "Academia", ranking: "Top 50" },
      { nombre: "Jugador 2", apellido: "Academia", ranking: "Top 30" }
    ],
    ubicacion: "Madrid, España",
    fecha: "15-17 Marzo 2024",
    categoria: "Open",
    resultado: "1-0",
    siguientePartido: "Cuartos de Final",
    hora: "18:30"
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in sm:bottom-6 sm:right-6">
      <div 
        className={`bg-gray-900/90 backdrop-blur-sm border border-[#E2FF1B]/20 rounded-xl shadow-lg transition-all duration-300 ${
          isMinimized 
            ? 'p-2.5 sm:p-3 w-[140px] sm:w-[180px] cursor-pointer hover:bg-gray-800/90 border-[#E2FF1B]/40 group touch-manipulation' 
            : 'p-3 sm:p-4 w-[calc(100vw-2rem)] sm:w-[400px] md:max-w-sm'
        }`}
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors duration-200">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
              </div>
              {!isMinimized && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Torneo en vivo</p>
                  <p className="text-sm sm:text-base font-medium text-white line-clamp-1">{tournamentInfo.nombre}</p>
                </div>
              )}
              {isMinimized && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-[pulse_6s_ease-in-out_infinite]" />
                    <span className="text-[10px] sm:text-xs text-red-500 font-medium">LIVE</span>
                  </div>
                  <span className="hidden sm:block text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Click para ver más</span>
                </div>
              )}
            </div>
            {!isMinimized && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white h-8 w-8 p-0"
                onClick={() => setIsMinimized(true)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Contenido */}
          {!isMinimized && (
            <div className="space-y-2 sm:space-y-3">
              <span className="inline-block px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-[#E2FF1B]/10 text-[#E2FF1B] rounded-full">
                {tournamentInfo.categoria}
              </span>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="line-clamp-1">
                  {tournamentInfo.jugadores[0].nombre} {tournamentInfo.jugadores[0].apellido} ({tournamentInfo.jugadores[0].ranking}) & 
                  {tournamentInfo.jugadores[1].nombre} {tournamentInfo.jugadores[1].apellido} ({tournamentInfo.jugadores[1].ranking})
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="line-clamp-1">{tournamentInfo.ubicacion}</span>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="line-clamp-1">{tournamentInfo.fecha}</span>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{tournamentInfo.hora}</span>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-gray-400">Próximo partido:</p>
                <p className="text-sm sm:text-base font-medium text-white line-clamp-1">{tournamentInfo.siguientePartido}</p>
                <p className="text-xs sm:text-sm text-[#E2FF1B]">Resultado actual: {tournamentInfo.resultado}</p>
              </div>

              <Button
                size="sm"
                className="w-full bg-transparent border border-[#E2FF1B] text-[#E2FF1B] p-1.5 sm:p-2 text-xs sm:text-sm hover:bg-[#E2FF1B] hover:text-black transition-colors duration-200 touch-manipulation"
                onClick={() => window.open('https://www.worldpadeltour.com', '_blank')}
              >
                <Trophy className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Ver En Vivo
                <ExternalLink className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 