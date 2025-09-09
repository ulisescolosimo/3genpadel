'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, Calendar, Clock, Users, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Configuración para evitar pre-renderizado estático
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function C7BracketPage() {
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
        
        // Estructura para Bracketry - Liga C7
        const data = {
          rounds: [
            { name: "Octavos de Final" },
            { name: "Cuartos de Final" },
            { name: "Semifinal" },
            { name: "Final" }
          ],
          matches: [
            // Octavos de Final (roundIndex: 0) - 8 partidos para completar el bracket
            // Bracket superior izquierdo
            {
              roundIndex: 0,
              order: 0,
              sides: [
                {
                  contestantId: "cobreros_montero" // 1 - Pasan directamente a cuartos
                },
                {
                  contestantId: "empty_1" // Bracket libre
                }
              ]
            },
            {
              roundIndex: 0,
              order: 1,
              sides: [
                {
                  contestantId: "torres_schvab"
                },
                {
                  contestantId: "firpo_propato"
                }
              ]
            },
            // Bracket superior derecho
            {
              roundIndex: 0,
              order: 2,
              sides: [
                {
                  contestantId: "couto_sequeira"
                },
                {
                  contestantId: "silva_madriz"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 3,
              sides: [
                {
                  contestantId: "empty_2" // Bracket libre (arriba)
                },
                {
                  contestantId: "barbieri_epstein" // 4 - Pasan directamente a cuartos (abajo)
                }
              ]
            },
            // Bracket inferior izquierdo
            {
              roundIndex: 0,
              order: 4,
              sides: [
                {
                  contestantId: "langer_len" // 3 - Pasan directamente a cuartos
                },
                {
                  contestantId: "empty_3" // Bracket libre
                }
              ]
            },
            {
              roundIndex: 0,
              order: 5,
              sides: [
                {
                  contestantId: "delgado_delgado"
                },
                {
                  contestantId: "urretabizcaya_cutraro"
                }
              ]
            },
            // Bracket inferior derecho
            {
              roundIndex: 0,
              order: 6,
              sides: [
                {
                  contestantId: "schaefer_muedra"
                },
                {
                  contestantId: "vinue_hau"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 7,
              sides: [
                {
                  contestantId: "empty_4" // Bracket libre (arriba)
                },
                {
                  contestantId: "gaffney_clucellas" // 2 - Pasan directamente a cuartos (abajo)
                }
              ]
            },
            // Cuartos de Final (roundIndex: 1) - 4 partidos ya jugados
            {
              roundIndex: 1,
              order: 0,
              sides: [
                {
                  contestantId: "cobreros_montero", // 1 - Pasa directamente a cuartos (arriba)
                  score: "6-4 / 6-2"
                },
                {
                  contestantId: "torres_schvab" // Torres-Schvab pasa directamente a cuartos
                }
              ]
            },
            {
              roundIndex: 1,
              order: 1,
              sides: [
                {
                  contestantId: "couto_sequeira", // Couto-Sequeira pasa directamente a cuartos
                  score: "6-3 / 6-1"
                },
                {
                  contestantId: "barbieri_epstein" // 4 - Pasa directamente a cuartos (abajo)
                }
              ]
            },
            {
              roundIndex: 1,
              order: 2,
              sides: [
                {
                  contestantId: "langer_len", // 3 - Pasa directamente a cuartos (arriba)
                  score: "6-2 / 6-4"
                },
                {
                  contestantId: "delgado_delgado" // Delgado-Delgado pasa directamente a cuartos
                }
              ]
            },
            {
              roundIndex: 1,
              order: 3,
              sides: [
                {
                  contestantId: "vinue_hau" // Vinue-Hau pasa directamente a cuartos
                },
                {
                  contestantId: "gaffney_clucellas", // 2 - Pasa directamente a cuartos (abajo)
                  score: "6-1 / 6-3"
                }
              ]
            },
            // Semifinal (roundIndex: 2) - Partidos ya jugados
            {
              roundIndex: 2,
              order: 0,
              sides: [
                {
                  contestantId: "langer_len",
                  score: "6-4 / 6-2"
                },
                {
                  contestantId: "gaffney_clucellas"
                }
              ]
            },
            {
              roundIndex: 2,
              order: 1,
              sides: [
                {
                  contestantId: "couto_sequeira"
                },
                {
                  contestantId: "cobreros_montero",
                  score: "6-3 / 6-1"
                }
              ]
            },
            // Final (roundIndex: 3) - Partido programado
            {
              roundIndex: 3,
              order: 0,
              sides: [
                {
                  contestantId: "langer_len"
                },
                {
                  contestantId: "cobreros_montero"
                }
              ]
            }
          ],
          contestants: {
            // Parejas que juegan en octavos
            torres_schvab: {
              players: [
                { title: "8 Torres - Schvab" }
              ]
            },
            firpo_propato: {
              players: [
                { title: "9 Firpo - Propato" }
              ]
            },
            couto_sequeira: {
              players: [
                { title: "5 Couto - Sequeira" }
              ]
            },
            silva_madriz: {
              players: [
                { title: "12 Silva - Madriz" }
              ]
            },
            delgado_delgado: {
              players: [
                { title: "6 Delgado - Delgado" }
              ]
            },
            urretabizcaya_cutraro: {
              players: [
                { title: "11 Urretabizcaya - Cutraro" }
              ]
            },
            schaefer_muedra: {
              players: [
                { title: "7 Schaefer - Muedra" }
              ]
            },
            vinue_hau: {
              players: [
                { title: "10 Vinue - Hau" }
              ]
            },
            // Parejas que pasan directamente a cuartos (tienen bye)
            cobreros_montero: {
              players: [
                { title: "1 Cobreros - Montero" }
              ]
            },
            barbieri_epstein: {
              players: [
                { title: "4 Barbieri - Epstein" }
              ]
            },
            langer_len: {
              players: [
                { title: "3 Langer - Len" }
              ]
            },
            gaffney_clucellas: {
              players: [
                { title: "2 Gaffney - Clucellas" }
              ]
            },
            // Brackets libres (sin partidos)
            empty_1: {
              players: [
                { title: "" }
              ]
            },
            empty_2: {
              players: [
                { title: "" }
              ]
            },
            empty_3: {
              players: [
                { title: "" }
              ]
            },
            empty_4: {
              players: [
                { title: "" }
              ]
            },
            // Placeholders para los ganadores de octavos
            winner_octavos_1: {
              players: [
                { title: "" }
              ]
            },
            winner_octavos_2: {
              players: [
                { title: "" }
              ]
            },
            winner_octavos_3: {
              players: [
                { title: "" }
              ]
            },
            winner_octavos_4: {
              players: [
                { title: "" }
              ]
            },
            winner_octavos_5: {
              players: [
                { title: "" }
              ]
            },
            winner_octavos_6: {
              players: [
                { title: "" }
              ]
            },
            winner_octavos_7: {
              players: [
                { title: "" }
              ]
            },
            winner_octavos_8: {
              players: [
                { title: "" }
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
          matchGap: 20
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
            <span className="text-[#E2FF1B]">Liga Agosto 2025 - C7</span>
          </h1>
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
