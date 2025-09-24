'use client'

import { useState } from 'react'
import { Clock, Users, Target, Award, Calendar, Star, BookOpen, Dumbbell, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AcademiaPage() {
  const [activeTab, setActiveTab] = useState('formato')

  const openWhatsApp = (turno) => {
    const message = encodeURIComponent(`Hola! Me gustaría inscribirme en la Academia 3gen Padel para el turno de ${turno.horario}. ¿Podrían darme más información sobre disponibilidad y precios?`)
    const whatsappUrl = `https://wa.me/5491135921988?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const turnos = [
    {
      id: 1,
      horario: 'Lunes',
      horarios: ['08:00 - 10:00'],
      nivel: 'Iniciantes'
    },
    {
      id: 2,
      horario: 'Martes',
      horarios: ['08:00 - 10:00'],
      nivel: 'Intermedio'
    },
    {
      id: 3,
      horario: 'Miércoles',
      horarios: ['08:00 - 10:00'],
      nivel: 'Iniciantes'
    },
    {
      id: 4,
      horario: 'Jueves',
      horarios: ['08:00 - 10:00'],
      nivel: 'Avanzado'
    },
    {
      id: 5,
      horario: 'Viernes',
      horarios: ['08:00 - 10:00'],
      nivel: 'Intermedio'
    }
  ]

  const formatoEntrenamiento = [
    {
      fase: 'Padel Competitivo',
      duracion: '45 minutos',
      descripcion: 'Juego real con situaciones competitivas, estrategias de partido y desarrollo de la mentalidad ganadora.',
      icon: Target,
      color: 'text-blue-400'
    },
    {
      fase: 'Padel Técnico',
      duracion: '45 minutos',
      descripcion: 'Perfeccionamiento de técnicas específicas, golpes avanzados y corrección de movimientos.',
      icon: Award,
      color: 'text-green-400'
    },
    {
      fase: 'Entrenamiento Físico',
      duracion: '30 minutos',
      descripcion: 'Preparación física específica para pádel, resistencia, velocidad y coordinación.',
      icon: Dumbbell,
      color: 'text-orange-400'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 px-4 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E2FF1B]/20 to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-6xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
              <span className="text-[#E2FF1B]">Academia</span> 3gen Padel
            </h1>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6 md:mb-8 px-2">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full text-sm md:text-base">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#E2FF1B]" />
                <span>Clases de 2 horas</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full text-sm md:text-base">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-[#E2FF1B]" />
                <span>Profesores expertos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full text-sm md:text-base">
                <Star className="w-4 h-4 md:w-5 md:h-5 text-[#E2FF1B]" />
                <span>Metodología probada</span>
              </div>
            </div>
            <div className="flex justify-center px-4">
              <Button 
                onClick={() => {
                  const message = encodeURIComponent('Hola! Me gustaría obtener más información sobre la Academia 3gen Padel. ¿Podrían contarme sobre los turnos disponibles y precios?')
                  const whatsappUrl = `https://wa.me/5491135921988?text=${message}`
                  window.open(whatsappUrl, '_blank')
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 md:px-8 md:py-3 rounded-full font-semibold text-base md:text-lg flex items-center gap-2 md:gap-3 transition-all duration-300 hover:scale-105 w-full max-w-sm"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span className="hidden sm:inline">Consultar por WhatsApp</span>
                <span className="sm:hidden">Consultar</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="px-4 lg:px-8 py-6 md:py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mb-8 md:mb-12">
            <Button
              onClick={() => setActiveTab('formato')}
              variant={activeTab === 'formato' ? 'default' : 'outline'}
              className={`${activeTab === 'formato' ? 'bg-[#E2FF1B] text-black' : 'text-white border-white/20'} w-full sm:w-auto text-sm md:text-base`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Formato de Entrenamiento</span>
              <span className="sm:hidden">Formato</span>
            </Button>
            <Button
              onClick={() => setActiveTab('turnos')}
              variant={activeTab === 'turnos' ? 'default' : 'outline'}
              className={`${activeTab === 'turnos' ? 'bg-[#E2FF1B] text-black' : 'text-white border-white/20'} w-full sm:w-auto text-sm md:text-base`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Turnos Disponibles</span>
              <span className="sm:hidden">Turnos</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="px-4 lg:px-8 pb-12 md:pb-20">
        <div className="container mx-auto max-w-7xl">
          {activeTab === 'formato' && (
            <div className="max-w-full mx-auto">
              <div className="text-center mb-8 md:mb-12 px-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">Nuestro Formato de Entrenamiento</h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-300">
                  Cada clase de 2 horas está diseñada para desarrollar jugadores completos
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
                {formatoEntrenamiento.map((fase, index) => (
                  <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-3 md:mb-4">
                        <div className={`p-2 md:p-3 rounded-full bg-white/10 ${fase.color}`}>
                          <fase.icon className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                      </div>
                      <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#E2FF1B]">{fase.fase}</CardTitle>
                      <CardDescription className="text-base md:text-lg font-semibold text-white">
                        {fase.duracion}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-center leading-relaxed text-sm md:text-base">
                        {fase.descripcion}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-gradient-to-r from-[#E2FF1B]/10 to-transparent p-6 md:p-8 rounded-2xl border border-[#E2FF1B]/20">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-[#E2FF1B]">
                    <Zap className="w-5 h-5 md:w-6 md:h-6 inline mr-2" />
                    Supervisión Profesional
                  </h3>
                  <p className="text-sm md:text-lg text-gray-300 leading-relaxed">
                    Todo el entrenamiento se desarrolla bajo la mirada experta de nuestros profesores certificados, 
                    quienes garantizan que cada movimiento, técnica y estrategia sea ejecutada correctamente. 
                    Nuestros instructores no solo enseñan, sino que también motivan y guían a cada jugador 
                    hacia su máximo potencial.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'turnos' && (
            <div className="max-w-full mx-auto">
              <div className="text-center mb-8 md:mb-12 px-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">Turnos Disponibles</h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-300">
                  Horarios flexibles para adaptarse a tu rutina
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {turnos.map((turno) => (
                  <Card key={turno.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full flex flex-col">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl md:text-2xl font-bold text-[#E2FF1B] flex items-center gap-3">
                        <Calendar className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                        {turno.horario}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-[#E2FF1B] flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">Horarios:</h4>
                            <div className="space-y-1">
                              {turno.horarios.map((horario, index) => (
                                <p key={index} className="text-gray-300 text-sm md:text-base">
                                  {horario}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Target className="w-5 h-5 text-[#E2FF1B] flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">
                              {turno.nivel === 'Iniciantes' ? '' : 'Nivel:'}
                            </h4>
                            <p className="text-gray-300 text-sm md:text-base">{turno.nivel}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-2">
                        <Button
                          onClick={() => openWhatsApp(turno)}
                          className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm md:text-base py-3 font-bold transition-all duration-300 hover:scale-105"
                        >
                          Inscribirse en este turno
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-8 md:mt-12 bg-gradient-to-r from-[#E2FF1B]/10 to-transparent p-6 md:p-8 rounded-2xl border border-[#E2FF1B]/20">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-[#E2FF1B]">
                    <Users className="w-5 h-5 md:w-6 md:h-6 inline mr-2" />
                    Grupos Reducidos
                  </h3>
                  <p className="text-sm md:text-lg text-gray-300 leading-relaxed">
                    Mantenemos grupos pequeños para garantizar atención personalizada. 
                    Cada profesor puede dedicar tiempo individual a cada jugador, 
                    asegurando que todos progresen a su ritmo y alcancen sus objetivos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
} 