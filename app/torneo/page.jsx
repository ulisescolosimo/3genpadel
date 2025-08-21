'use client'

import { useEffect, useRef, useState } from 'react'
import { createBracket } from 'bracketry'
import { Button } from '@/components/ui/button'
import { Trophy, Calendar, Clock, Users, MapPin } from 'lucide-react'

export default function TorneoPage() {
  const bracketRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (bracketRef.current) {
      try {
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

        // Crear el bracket
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
        console.error('Error creating bracket:', err)
        setError(`Error al crear el bracket: ${err.message}`)
      }
    }
  }, [])

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
          {error ? (
            <div className="text-center text-red-400 py-8">
              <p className="mb-4 text-lg">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/80 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/20"
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <div 
              ref={bracketRef} 
              className="w-full flex items-center justify-center"
              style={{ height: '800px', width: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
