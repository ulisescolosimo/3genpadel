'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Trophy, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ClasesPrivadasPage() {
  const openWhatsApp = (mensaje, telefono) => {
    const message = encodeURIComponent(mensaje)
    const whatsappUrl = `https://wa.me/${telefono}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-3 sm:gap-6 lg:gap-4">
            <Link href="/sede-olleros">
              <Button variant="ghost" size="sm" className="text-white hover:text-[#E2FF1B] hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                <span className="text-[#E2FF1B]">Clases</span> Profesionales
              </h1>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl font-medium">Entrenamiento personalizado con profesores</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Clases Personalizadas Section */}
        <div className="max-w-6xl mx-auto mb-16 flex flex-col items-center">
          
          {/* Ubicación */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#E2FF1B]/20 rounded-full border border-[#E2FF1B]/30 mb-6">
            <MapPin className="w-5 h-5 text-[#E2FF1B]" />
            <span className="text-[#E2FF1B] font-semibold text-sm tracking-wider">Olleros 1515</span>
          </div>

          {/* Head Coaches Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-[#E2FF1B] mb-4">
                Entrenadores Profesionales
              </h3>
              <p className="text-gray-300">
                Nuestros Head Coaches combinan experiencia profesional con metodologías avanzadas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Stefano Lorenzo */}
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#E2FF1B]/50 mx-auto">
                        <img 
                          src="/images/profesores/stf.jpg" 
                          alt="Stefano Lorenzo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#E2FF1B] rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-black" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-[#E2FF1B] mb-2">Stefano Lorenzo</CardTitle>
                  <CardDescription className="text-white font-medium mb-3">Head Coach</CardDescription>
                  <div className="px-3 py-1 bg-[#E2FF1B]/20 text-[#E2FF1B] text-xs font-medium rounded-full inline-block mb-4 w-fit mx-auto">
                    Técnica Avanzada
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-center leading-relaxed text-base">
                    Profesor de pádel con más de 10 años de experiencia. Jugador AJPP desde 2012.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white text-sm">Logros Destacados:</h4>
                    <ul className="space-y-1">
                      <li className="flex items-start text-gray-300 text-xs">
                        <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                        Ranking actual: Nº 99 de Argentina
                      </li>
                      <li className="flex items-start text-gray-300 text-xs">
                        <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                        Profesor de pádel con más de 10 años de experiencia
                      </li>
                      <li className="flex items-start text-gray-300 text-xs">
                        <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                        Jugador AJPP desde 2012
                      </li>
                    </ul>
                  </div>
                  <div className="pt-2">
                    <Button
                      onClick={() => openWhatsApp('Hola! Me interesa reservar una clase privada con Stefano Lorenzo. ¿Podrían darme más información sobre disponibilidad y precios?', '5491135921988')}
                      className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm py-3 font-bold transition-all duration-300 hover:scale-105"
                    >
                      Reservar con Stefano
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Ignacio Begher */}
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#E2FF1B]/50 mx-auto">
                        <img 
                          src="/images/profesores/nacho2.jpg" 
                          alt="Ignacio Begher"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#E2FF1B] rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-black" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-[#E2FF1B] mb-2">Ignacio Begher</CardTitle>
                  <CardDescription className="text-white font-medium mb-3">Head Coach</CardDescription>
                  <div className="px-3 py-1 bg-[#E2FF1B]/20 text-[#E2FF1B] text-xs font-medium rounded-full inline-block mb-4 w-fit mx-auto">
                    Táctica Profesional
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-center leading-relaxed text-base">
                    Profesor de pádel con más de 15 años de experiencia. Jugador AJPP desde 2007.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white text-sm">Logros Destacados:</h4>
                    <ul className="space-y-1">
                      <li className="flex items-start text-gray-300 text-xs">
                        <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                        Ranking actual: Nº 97 de Argentina
                      </li>
                      <li className="flex items-start text-gray-300 text-xs">
                        <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                        Profesor de pádel con más de 15 años de experiencia
                      </li>
                      <li className="flex items-start text-gray-300 text-xs">
                        <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                        Jugador AJPP desde 2007
                      </li>
                    </ul>
                  </div>
                  <div className="pt-2">
                    <Button
                      onClick={() => openWhatsApp('Hola! Me interesa reservar una clase privada con Ignacio Begher. ¿Podrían darme más información sobre disponibilidad y precios?', '5491132673029')}
                      className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm py-3 font-bold transition-all duration-300 hover:scale-105"
                    >
                      Reservar con Nacho
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#E2FF1B]/10 to-transparent p-6 md:p-8 rounded-2xl border border-[#E2FF1B]/20">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-[#E2FF1B]">
                <Star className="w-5 h-5 md:w-6 md:h-6 inline mr-2" />
                Profesionales de Primera División
              </h3>
              <p className="text-sm md:text-lg text-gray-300 leading-relaxed">
                Nuestras clases personalizadas están dirigidas por jugadores profesionales de primera división, 
                incluyendo Nacho y Stefano que comparten su experiencia y técnicas de alto nivel. <br></br>
                Aprovechá la oportunidad de entrenar con los mejores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
