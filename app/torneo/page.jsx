'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, Calendar, Clock, Users, MapPin } from 'lucide-react'

// Configuración para evitar pre-renderizado estático
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function TorneoPage() {
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
        
        // Estructura simplificada para Bracketry - Estructura completa del torneo
        const data = {
          rounds: [
            { name: "Octavos de Final" },
            { name: "Cuartos de Final" },
            { name: "Semifinal" },
            { name: "Final" }
          ],
          matches: [
            // Octavos de Final (roundIndex: 0)
            {
              roundIndex: 0,
              order: 0,
              sides: [
                {
                  contestantId: "equipo_a"
                },
                {
                  contestantId: "equipo_b"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 1,
              sides: [
                {
                  contestantId: "equipo_c"
                },
                {
                  contestantId: "equipo_d"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 2,
              sides: [
                {
                  contestantId: "equipo_e"
                },
                {
                  contestantId: "equipo_f"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 3,
              sides: [
                {
                  contestantId: "equipo_g"
                },
                {
                  contestantId: "equipo_h"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 4,
              sides: [
                {
                  contestantId: "equipo_i"
                },
                {
                  contestantId: "equipo_j"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 5,
              sides: [
                {
                  contestantId: "equipo_k"
                },
                {
                  contestantId: "equipo_l"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 6,
              sides: [
                {
                  contestantId: "equipo_m"
                },
                {
                  contestantId: "equipo_n"
                }
              ]
            },
            {
              roundIndex: 0,
              order: 7,
              sides: [
                {
                  contestantId: "equipo_o"
                },
                {
                  contestantId: "equipo_p"
                }
              ]
            }
          ],
          contestants: {
            equipo_a: {
              players: [
                { title: "Equipo A" }
              ]
            },
            equipo_b: {
              players: [
                { title: "Equipo B" }
              ]
            },
            equipo_c: {
              players: [
                { title: "Equipo C" }
              ]
            },
            equipo_d: {
              players: [
                { title: "Equipo D" }
              ]
            },
            equipo_e: {
              players: [
                { title: "Equipo E" }
              ]
            },
            equipo_f: {
              players: [
                { title: "Equipo F" }
              ]
            },
            equipo_g: {
              players: [
                { title: "Equipo G" }
              ]
            },
            equipo_h: {
              players: [
                { title: "Equipo H" }
              ]
            },
            equipo_i: {
              players: [
                { title: "Equipo I" }
              ]
            },
            equipo_j: {
              players: [
                { title: "Equipo J" }
              ]
            },
            equipo_k: {
              players: [
                { title: "Equipo K" }
              ]
            },
            equipo_l: {
              players: [
                { title: "Equipo L" }
              ]
            },
            equipo_m: {
              players: [
                { title: "Equipo M" }
              ]
            },
            equipo_n: {
              players: [
                { title: "Equipo N" }
              ]
            },
            equipo_o: {
              players: [
                { title: "Equipo O" }
              ]
            },
            equipo_p: {
              players: [
                { title: "Equipo P" }
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
          scrollButtonSvgColor: "#E2FC1D",
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
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
            <span className="text-[#E2FF1B]">Brackets</span>
          </h1>
          <div className="flex justify-center mt-4">
            <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/20">
              <Trophy className="h-4 w-4 mr-2" />
              Ver Partidos
            </Button>
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
