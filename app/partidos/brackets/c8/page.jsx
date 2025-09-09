'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, Calendar, Clock, Users, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Configuración para evitar pre-renderizado estático
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function C8BracketPage() {
  const bracketRef = useRef(null)
  const [error, setError] = useState(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Verificación adicional para asegurar que estamos en el cliente
    if (typeof window === 'undefined') {
      console.log('No estamos en el cliente, saltando inicialización')
      return
    }
    
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Verificar que estamos en el cliente antes de crear el bracket
    if (!isClient || !bracketRef.current) return

    // Importar Bracketry dinámicamente solo en el cliente
    const loadBracketry = async () => {
      try {
        // Verificación adicional para asegurar que estamos en el cliente
        if (typeof window === 'undefined') {
          console.log('No estamos en el cliente, saltando carga de Bracketry')
          return
        }

        // Verificación adicional para asegurar que el DOM esté listo
        if (!document || !document.body) {
          console.log('DOM no está listo, saltando carga de Bracketry')
          return
        }

        // Verificación adicional para asegurar que el elemento ref esté disponible
        if (!bracketRef.current) {
          console.log('Elemento ref no está disponible, saltando carga de Bracketry')
          return
        }

        const { createBracket } = await import('bracketry')
        
        // Verificación adicional para asegurar que la función createBracket esté disponible
        if (typeof createBracket !== 'function') {
          console.log('createBracket no es una función, saltando carga de Bracketry')
          return
        }
        
        // Estructura para Bracketry - Liga C8 (Cuartos de Final)
        const data = {
          rounds: [
            { name: "Cuartos de Final" },
            { name: "Semifinal" },
            { name: "Final" }
          ],
          matches: [
            // Cuartos de Final (roundIndex: 0) - Partidos ya jugados
            {
              roundIndex: 0,
              order: 0,
              sides: [
                {
                  contestantId: "olivares_martia",
                  score: "6-4 / 6-2"
                },
                {
                  contestantId: "lifschitz_gutraich"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 1,
              sides: [
                {
                  contestantId: "coligionis_buchovsky"
                },
                {
                  contestantId: "delupi_salaya",
                  score: "6-3 / 6-1"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 2,
              sides: [
                {
                  contestantId: "hueso_gimenez",
                  score: "6-2 / 6-4"
                },
                {
                  contestantId: "agrawal_knyazev"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 3,
              sides: [
                {
                  contestantId: "priegue_garcia",
                  score: "6-1 / 6-3"
                },
                {
                  contestantId: "kitagawa_kitagawa"
                }
              ]
            },
            // Semifinal (roundIndex: 1) - Partidos ya jugados
            {
              roundIndex: 1,
              order: 0,
              sides: [
                {
                  contestantId: "olivares_martia"
                },
                {
                  contestantId: "delupi_salaya",
                  score: "6-4 / 6-2"
                }
              ]
            },
            {
              roundIndex: 1,
              order: 1,
              sides: [
                {
                  contestantId: "hueso_gimenez",
                  score: "6-3 / 6-1"
                },
                {
                  contestantId: "priegue_garcia"
                }
              ]
            },
            // Final (roundIndex: 2) - Partido ya jugado
            {
              roundIndex: 2,
              order: 0,
              sides: [
                {
                  contestantId: "hueso_gimenez",
                  score: "7-5 / 6-4"
                },
                {
                  contestantId: "priegue_garcia"
                }
              ]
            }
          ],
          contestants: {
            olivares_martia: {
              players: [
                { title: "Olivares Prado - Martia" }
              ]
            },
            lifschitz_gutraich: {
              players: [
                { title: "Lifschitz - Gutraich" }
              ]
            },
            coligionis_buchovsky: {
              players: [
                { title: "Coligionis - Buchovsky" }
              ]
            },
            delupi_salaya: {
              players: [
                { title: "Delupi - Salaya" }
              ]
            },
            hueso_gimenez: {
              players: [
                { title: "Hueso - Gimenez" }
              ]
            },
            agrawal_knyazev: {
              players: [
                { title: "Agrawal - Knyazev" }
              ]
            },
            priegue_garcia: {
              players: [
                { title: "Priegue - Garcia" }
              ]
            },
            kitagawa_kitagawa: {
              players: [
                { title: "Kitagawa - Kitagawa" }
              ]
            }
          }
        }

        createBracket(data, bracketRef.current, {
          verticalScrollMode: "mixed",
          matchTextColor: "#ffffff",
          roundTitleColor: "#ffffff",
          highlightedPlayerTitleColor: "#E2FC1D",
          connectionLinesColor: "#E2FC1D",
          highlightedConnectionLinesColor: "#E2FC1D",
          navButtonSvgColor: "#E2FC1D",
          rootBorderColor: "#161D29",
          matchWidth: 200,
          matchHeight: 60,
          roundGap: 100,
          matchGap: 20,
          winnerBackgroundColor: "#E2FC1D",
          winnerTextColor: "#000000"
        })
        
        setError(null)
      } catch (err) {
        console.error('Error loading Bracketry:', err)
        setError('Error al cargar el bracket')
      }
    }

    // Solo ejecutar en el cliente con verificación adicional
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Agregar un pequeño delay para asegurar que el DOM esté completamente listo
      setTimeout(() => {
        loadBracketry()
      }, 100)
    }
  }, [isClient])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-10">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/partidos/brackets">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Brackets
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
            <span className="text-[#E2FF1B]">Liga Agosto 2025 - C8</span>
          </h1>
          
          {/* Campeones Banner */}
          <div className="bg-gradient-to-r from-[#E2FF1B]/15 to-[#E2FF1B]/5 backdrop-blur-sm rounded-lg border border-[#E2FF1B]/30 p-4 mx-auto max-w-xl">
            <div className="text-center">
              <div className="text-sm font-medium text-[#E2FF1B] mb-1">
                CAMPEONES
              </div>
              <div className="text-lg font-bold text-white">
                Hueso - Gimenez
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Final: 7-5 / 6-4 vs Priegue - Garcia
              </div>
            </div>
          </div>
        </div>

        {/* Bracket */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
          {!isClient ? (
            <div className="text-center text-gray-400 py-8">
              <p className="mb-4 text-lg">Inicializando...</p>
              <p>Preparando la aplicación del torneo.</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">
              <p className="mb-4 text-lg">{error}</p>
              <p>Hubo un problema al cargar el bracket.</p>
            </div>
          ) : (
            <div
              ref={bracketRef}
              className="w-full flex items-center justify-center"
              style={{ height: '800px', width: '100%' }}
              suppressHydrationWarning={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
