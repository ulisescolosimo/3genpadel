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
        
        // Estructura para Bracketry - Liga C7 Octubre/Noviembre
        const data = {
          rounds: [
            { name: "Octavos de Final" },
            { name: "Cuartos de Final" },
            { name: "Semifinal" },
            { name: "Final" }
          ],
          matches: [
            // Octavos de Final (roundIndex: 0)
            // Bracket superior izquierdo
            {
              roundIndex: 0,
              order: 0,
              sides: [
                { contestantId: "fernandez_garibaldi" }, // 1 - Pasa directo a cuartos
                { contestantId: "empty_1" }
              ]
            },
            {
              roundIndex: 0,
              order: 1,
              sides: [
                { contestantId: "martinez_echeverria" }, // 8
                { contestantId: "paco_berges" } // 9
              ]
            },
            // Bracket superior derecho
            {
              roundIndex: 0,
              order: 2,
              sides: [
                { contestantId: "fracchia_pablo" }, // 5
                { contestantId: "empty_2" }
              ]
            },
            {
              roundIndex: 0,
              order: 3,
              sides: [
                { contestantId: "empty_3" },
                { contestantId: "langer_len" } // 4
              ]
            },
            // Bracket inferior izquierdo
            {
              roundIndex: 0,
              order: 4,
              sides: [
                { contestantId: "gaffney_clucellas" }, // 3
                { contestantId: "empty_4" }
              ]
            },
            {
              roundIndex: 0,
              order: 5,
              sides: [
                { contestantId: "delgado_delgado" }, // 6
                { contestantId: "empty_5" }
              ]
            },
            // Bracket inferior derecho
            {
              roundIndex: 0,
              order: 6,
              sides: [
                { contestantId: "hueso_gimenez" }, // 7
                { contestantId: "schvab_firpo" } // 10
              ]
            },
            {
              roundIndex: 0,
              order: 7,
              sides: [
                { contestantId: "empty_6" },
                { contestantId: "cardenas_bukovac" } // 2 - Pasa directo a cuartos
              ]
            },
            // Cuartos de Final (roundIndex: 1)
            {
              roundIndex: 1,
              order: 0,
              sides: [
                { contestantId: "fernandez_garibaldi" }, // 1
                { contestantId: "winner_octavos_1" } // Ganador de 8 vs 9
              ]
            },
            {
              roundIndex: 1,
              order: 1,
              sides: [
                { contestantId: "fracchia_pablo" }, // 5
                { contestantId: "langer_len" } // 4
              ]
            },
            {
              roundIndex: 1,
              order: 2,
              sides: [
                { contestantId: "gaffney_clucellas" }, // 3
                { contestantId: "delgado_delgado" } // 6
              ]
            },
            {
              roundIndex: 1,
              order: 3,
              sides: [
                { contestantId: "winner_octavos_2" }, // Ganador de 7 vs 10
                { contestantId: "cardenas_bukovac" } // 2
              ]
            },
            // Semifinal (roundIndex: 2)
            {
              roundIndex: 2,
              order: 0,
              sides: [
                { contestantId: "winner_q1" },
                { contestantId: "winner_q2" }
              ]
            },
            {
              roundIndex: 2,
              order: 1,
              sides: [
                { contestantId: "winner_q3" },
                { contestantId: "winner_q4" }
              ]
            },
            // Final (roundIndex: 3)
            {
              roundIndex: 3,
              order: 0,
              sides: [
                { contestantId: "winner_s1" },
                { contestantId: "winner_s2" }
              ]
            }
          ],
          contestants: {
            // Equipos que juegan en octavos
            martinez_echeverria: {
              players: [{ title: "8 Martinez - Echeverria" }]
            },
            paco_berges: {
              players: [{ title: "9 Paco - Berges" }]
            },
            hueso_gimenez: {
              players: [{ title: "7 Hueso - Gimenez" }]
            },
            schvab_firpo: {
              players: [{ title: "10 Schvab - Firpo" }]
            },
            // Equipos que pasan directamente a cuartos
            fernandez_garibaldi: {
              players: [{ title: "1 Fernandez - Garibaldi" }]
            },
            cardenas_bukovac: {
              players: [{ title: "2 Cardenas - Bukovac" }]
            },
            gaffney_clucellas: {
              players: [{ title: "3 Gaffney - Clucellas" }]
            },
            langer_len: {
              players: [{ title: "4 Langer - Len" }]
            },
            fracchia_pablo: {
              players: [{ title: "5 Fracchia - Pablo" }]
            },
            delgado_delgado: {
              players: [{ title: "6 Delgado - Delgado" }]
            },
            // Brackets libres (sin partidos)
            empty_1: { players: [{ title: "" }] },
            empty_2: { players: [{ title: "" }] },
            empty_3: { players: [{ title: "" }] },
            empty_4: { players: [{ title: "" }] },
            empty_5: { players: [{ title: "" }] },
            empty_6: { players: [{ title: "" }] },
            // Placeholders para los ganadores
            winner_octavos_1: { players: [{ title: "" }] },
            winner_octavos_2: { players: [{ title: "" }] },
            winner_q1: { players: [{ title: "" }] },
            winner_q2: { players: [{ title: "" }] },
            winner_q3: { players: [{ title: "" }] },
            winner_q4: { players: [{ title: "" }] },
            winner_s1: { players: [{ title: "" }] },
            winner_s2: { players: [{ title: "" }] }
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
          <Link href="/partidos/brackets/liga-octubre-noviembre">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Liga Octubre/Noviembre
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
            <span className="text-[#E2FF1B]">Liga Octubre/Noviembre 2025 - C7</span>
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

