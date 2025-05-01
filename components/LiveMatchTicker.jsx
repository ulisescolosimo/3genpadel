'use client'

import { useState, useEffect } from 'react'
import { Trophy, Users, Clock } from 'lucide-react'

// Datos de ejemplo para los partidos en vivo
const liveMatches = [
  {
    id: 1,
    jugador1: 'Martín Sánchez',
    jugador2: 'Lucas Rodríguez',
    torneo: 'Torneo Profesional 3gen',
    ronda: 'Semifinal',
    puntaje: '6-4, 3-2',
    tiempo: '45 min'
  },
  {
    id: 2,
    jugador1: 'María García',
    jugador2: 'Ana Martínez',
    torneo: 'Torneo Femenino 3gen',
    ronda: 'Cuartos de Final',
    puntaje: '7-5, 2-1',
    tiempo: '30 min'
  },
  {
    id: 3,
    jugador1: 'Carlos López',
    jugador2: 'Juan Pérez',
    torneo: 'Torneo Amateur',
    ronda: 'Final',
    puntaje: '6-3, 4-2',
    tiempo: '35 min'
  },
  {
    id: 4,
    jugador1: 'Laura Fernández',
    jugador2: 'Sofía Gómez',
    torneo: 'Torneo Juvenil',
    ronda: 'Semifinal',
    puntaje: '5-7, 6-4',
    tiempo: '50 min'
  },
  {
    id: 5,
    jugador1: 'Diego Martínez',
    jugador2: 'Alejandro Ruiz',
    torneo: 'Torneo Master',
    ronda: 'Cuartos',
    puntaje: '6-2, 6-3',
    tiempo: '40 min'
  },
  {
    id: 6,
    jugador1: 'Valentina Torres',
    jugador2: 'Camila Díaz',
    torneo: 'Torneo Elite',
    ronda: 'Final',
    puntaje: '7-6, 6-4',
    tiempo: '55 min'
  },
  {
    id: 7,
    jugador1: 'Roberto Álvarez',
    jugador2: 'Miguel Castro',
    torneo: 'Torneo Senior',
    ronda: 'Semifinal',
    puntaje: '6-1, 6-2',
    tiempo: '30 min'
  },
  {
    id: 8,
    jugador1: 'Lucía Herrera',
    jugador2: 'María Rodríguez',
    torneo: 'Torneo Femenino',
    ronda: 'Cuartos',
    puntaje: '6-4, 6-3',
    tiempo: '45 min'
  },
  {
    id: 9,
    jugador1: 'Javier Morales',
    jugador2: 'Andrés Silva',
    torneo: 'Torneo Open',
    ronda: 'Final',
    puntaje: '7-5, 6-7',
    tiempo: '60 min'
  },
  {
    id: 10,
    jugador1: 'Paula Vargas',
    jugador2: 'Daniela Soto',
    torneo: 'Torneo Junior',
    ronda: 'Semifinal',
    puntaje: '6-3, 6-4',
    tiempo: '40 min'
  }
]

export default function LiveMatchTicker() {
  const [displayedMatches, setDisplayedMatches] = useState([])

  useEffect(() => {
    // Función para obtener 10 partidos aleatorios
    const getRandomMatches = () => {
      const shuffled = [...liveMatches].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, 10)
    }

    // Inicializar con 10 partidos aleatorios
    setDisplayedMatches(getRandomMatches())

    // Cambiar los partidos cada 30 segundos
    const interval = setInterval(() => {
      setDisplayedMatches(getRandomMatches())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full bg-[#E2FF1B] text-black overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center py-2">
          <div className="flex items-center gap-2 mr-4">
            <div className="flex items-center gap-1 px-2 py-1 bg-black text-[#E2FF1B] rounded-full">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-bold">LIVE</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-8 animate-marquee-slow whitespace-nowrap">
              {displayedMatches.map((match, index) => (
                <div key={match.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{match.jugador1} vs {match.jugador2}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>{match.torneo} - {match.ronda}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{match.puntaje}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{match.tiempo}</span>
                  </div>
                  {index < displayedMatches.length - 1 && (
                    <div className="flex items-center">
                      <span className="text-black/40 font-light">|</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 