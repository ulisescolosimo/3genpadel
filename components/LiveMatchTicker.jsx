'use client'

import { useState, useEffect } from 'react'
import { Trophy, Users, Clock, MapPin } from 'lucide-react'

export default function LiveMatchTicker() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true)
        const response = await fetch('https://en.fantasypadeltour.com/api/tournaments?sort_by=start_date&order_by=desc', {
          headers: {
            'Authorization': 'Bearer CJW1y2Ac9Xyu6dishBqPb1MU8wVp6krmheLDx9z847d2b692',
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        // Tomar los primeros 8 torneos
        const first8Tournaments = data.data.slice(0, 8)
        setTournaments(first8Tournaments)
      } catch (err) {
        console.error('Error fetching tournaments:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchTournaments, 300000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
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
            <div className="flex-1 text-center">
              <span className="text-sm">Cargando torneos...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
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
            <div className="flex-1 text-center">
              <span className="text-sm">Error al cargar torneos</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
              {tournaments.map((tournament, index) => (
                <div key={tournament.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span className="font-medium">{tournament.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{tournament.location}, {tournament.country}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase">{tournament.level}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{tournament.status === 'finished' ? tournament.end_date : tournament.status === 'pending' ? tournament.start_date : tournament.status}</span>
                  </div>
                  {index < tournaments.length - 1 && (
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