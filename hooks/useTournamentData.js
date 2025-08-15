'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

const TournamentContext = createContext()

export function TournamentProvider({ children }) {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTournamentConfig()
    // Configurar auto-refresh cada 30 segundos
    const interval = setInterval(fetchTournamentConfig, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchTournamentConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .gte('fecha', new Date().toISOString().split('T')[0]) // Solo torneos de hoy en adelante
        .order('fecha', { ascending: true })

      if (error) throw error

      // Filtrar solo torneos que tengan datos mínimos
      const activeTournaments = data?.filter(tournament => 
        tournament.nombre_torneo || 
        tournament.jugador1_nombre || 
        tournament.jugador2_nombre
      ) || []

      setTournaments(activeTournaments)
    } catch (err) {
      console.error('Error fetching tournament config:', err)
      setTournaments([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <TournamentContext.Provider value={{ tournaments, loading, refetch: fetchTournamentConfig }}>
      {children}
    </TournamentContext.Provider>
  )
}

export function useTournamentData() {
  const context = useContext(TournamentContext)
  if (!context) {
    throw new Error('useTournamentData must be used within a TournamentProvider')
  }
  return context
}
