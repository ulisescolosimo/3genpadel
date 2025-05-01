'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function TournamentDetail() {
  const { id } = useParams()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTournament()
  }, [id])

  const fetchTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('torneo')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTournament(data)
    } catch (error) {
      console.error('Error fetching tournament:', error)
      setError('Error al cargar los detalles del torneo')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E2FF1B] mx-auto"></div>
          <p className="mt-4 text-white">Cargando detalles del torneo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-black mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-[#E2FF1B] text-black font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors duration-300"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-black mb-4">Torneo no encontrado</h2>
          <p className="text-gray-600 mb-6">El torneo que buscas no existe o ha sido eliminado.</p>
          <Link
            href="/"
            className="inline-block bg-[#E2FF1B] text-black font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors duration-300"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-black mb-3">{tournament.nombre}</h1>
                <p className="text-lg text-gray-600">{tournament.descripcion}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                tournament.estado === 'abierto' ? 'bg-[#E2FF1B] text-black' :
                tournament.estado === 'en curso' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {tournament.estado}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-black mb-4">Información del Torneo</h2>
                  <div className="space-y-4 text-gray-600">
                    <p className="flex items-center">
                      <svg className="w-6 h-6 mr-3 text-[#E2FF1B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        <span className="font-semibold">Fecha de inicio:</span>{' '}
                        {new Date(tournament.fecha_inicio).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <svg className="w-6 h-6 mr-3 text-[#E2FF1B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        <span className="font-semibold">Fecha de fin:</span>{' '}
                        {new Date(tournament.fecha_fin).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <svg className="w-6 h-6 mr-3 text-[#E2FF1B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        <span className="font-semibold">Ubicación:</span> {tournament.ubicacion}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <svg className="w-6 h-6 mr-3 text-[#E2FF1B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>
                        <span className="font-semibold">Categoría:</span> {tournament.categoria}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-black mb-4">Inscripción</h2>
                  <p className="text-gray-600 mb-6">
                    {tournament.estado === 'abierto' 
                      ? 'Las inscripciones están abiertas para este torneo.'
                      : 'Las inscripciones están cerradas para este torneo.'}
                  </p>
                  {tournament.estado === 'abierto' && (
                    <Link
                      href={`/tournament/${tournament.id}/register`}
                      className="inline-block bg-[#E2FF1B] text-black font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors duration-300"
                    >
                      Inscribirse al Torneo
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/"
                className="text-[#E2FF1B] hover:text-opacity-80 transition-colors duration-300 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a la lista de torneos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 