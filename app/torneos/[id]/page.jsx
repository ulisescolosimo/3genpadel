'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { MapPin, Calendar, Users, Trophy, Info, ArrowRight, Clock, Award, ChevronRight, X, Check, User } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function TorneoDetalle({ params }) {
  const [torneo, setTorneo] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTorneo = async () => {
      try {
        const { data, error } = await supabase
          .from('torneo')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        setTorneo(data)
      } catch (err) {
        setError('Error al cargar el torneo')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    const fetchParticipantes = async () => {
      try {
        console.log('Fetching participants for tournament ID:', params.id)
        
        const { data, error } = await supabase
          .from('registros_torneo')
          .select('*')
          .eq('torneo_id', params.id)
          // Remove the estado filter to see all registrations
          .order('fecha_registro', { ascending: true })

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        console.log('Raw participants data:', data)
        console.log('Number of participants:', data?.length || 0)
        
        setParticipantes(data || [])
      } catch (err) {
        console.error('Error al cargar participantes:', err)
      }
    }

    fetchTorneo()
    fetchParticipantes()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  if (error || !torneo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Torneo no encontrado'}</p>
          <Link href="/torneos">
            <Button className="rounded-full bg-[#E2FF1B] text-black hover:bg-yellow-400 px-8 h-12 text-lg">
              Volver a Torneos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E2FF1B]/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
              <Link 
                href="/torneos" 
                className="flex items-center gap-1 hover:text-[#E2FF1B] transition-colors group"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Volver a Torneos
              </Link>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-[#E2FF1B] line-clamp-1">{torneo.nombre}</span>
            </div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Badge variant={
                  torneo.estado === 'abierto' ? 'default' :
                  torneo.estado === 'en_curso' ? 'secondary' :
                  torneo.estado === 'finalizado' ? 'success' :
                  torneo.estado === 'cancelado' ? 'destructive' :
                  'outline'
                }>
                  {torneo.estado.charAt(0).toUpperCase() + torneo.estado.slice(1)}
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white line-clamp-2">{torneo.nombre}</h1>
              </div>
            </div>
            <p className="text-sm sm:text-base md:text-xl text-gray-400 mb-4 max-w-3xl line-clamp-3 sm:line-clamp-none">
              {torneo.descripcion}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="informacion" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-3 sm:mb-4 bg-gray-900/50 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
              <TabsTrigger 
                value="informacion"
                className="data-[state=active]:bg-[#E2FF1B] data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-[#E2FF1B]/20 rounded-md sm:rounded-lg text-xs sm:text-sm"
              >
                <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Información
              </TabsTrigger>
              <TabsTrigger 
                value="participantes"
                className="data-[state=active]:bg-[#E2FF1B] data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-[#E2FF1B]/20 rounded-md sm:rounded-lg text-xs sm:text-sm"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Participantes
              </TabsTrigger>
              <TabsTrigger 
                value="reglas"
                className="data-[state=active]:bg-[#E2FF1B] data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-[#E2FF1B]/20 rounded-md sm:rounded-lg text-xs sm:text-sm"
              >
                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Reglas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informacion" className="space-y-3 sm:space-y-4">
              <Card className="bg-gray-900/50 border-gray-800 rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-gray-900/70 transition-colors duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Info className="h-5 w-5 sm:h-6 sm:w-6 text-[#E2FF1B]" />
                    Detalles del Torneo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-colors">
                        <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400">Fecha</p>
                          <p className="text-sm sm:text-base font-medium text-white">
                            {format(new Date(torneo.fecha_inicio), "d 'de' MMMM", { locale: es })} - {format(new Date(torneo.fecha_fin), "d 'de' MMMM", { locale: es })}
                          </p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-colors">
                        <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400">Ubicación</p>
                          <p className="text-sm sm:text-base font-medium text-white line-clamp-1">{torneo.ubicacion}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-colors">
                        <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors">
                          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400">Categoría</p>
                          <p className="text-sm sm:text-base font-medium text-white">{torneo.categoria}</p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-colors">
                        <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400">Cupo</p>
                          <p className="text-sm sm:text-base font-medium text-white">
                            {torneo.cupo_maximo ? (
                              <>
                                {participantes.length} / {torneo.cupo_maximo} plazas
                                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm ${
                                  torneo.plazas_disponibles <= 0 ? 'text-red-400' : 'text-green-400'
                                }`}>
                                  ({torneo.plazas_disponibles} disponibles)
                                </span>
                              </>
                            ) : (
                              'Sin límite de cupo'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-gray-900/70 transition-colors duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-[#E2FF1B]" />
                    Participar en el Torneo
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-400">
                    {torneo.cupo_maximo && torneo.plazas_disponibles <= 0 ? (
                      <span className="text-red-400 flex items-center gap-1.5 sm:gap-2">
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        Cupo completo - No hay plazas disponibles
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                        Regístrate para competir en este emocionante torneo
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-colors">
                      <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400">Duración Estimada</p>
                        <p className="text-sm sm:text-base font-medium text-white">2 días</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {torneo.cupo_maximo && torneo.plazas_disponibles <= 0 ? (
                    <Button 
                      disabled 
                      className="w-full rounded-xl bg-gray-800/50 text-gray-400 cursor-not-allowed h-12 text-base border border-gray-700"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Cupo Completo
                    </Button>
                  ) : (
                    <Link href={`/torneos/${torneo.id}/registro`} className="w-full">
                      <Button className="w-full rounded-xl bg-[#E2FF1B] text-black hover:bg-black hover:text-[#E2FF1B] h-12 text-base font-medium border border-[#E2FF1B] transition-all duration-300 group">
                        <span className="flex items-center justify-center gap-2">
                          <User className="h-5 w-5 text-black group-hover:text-[#E2FF1B] transition-colors" />
                          Registrarse
                          <ArrowRight className="h-5 w-5 text-black group-hover:text-[#E2FF1B] group-hover:translate-x-1 transition-all" />
                        </span>
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="participantes" className="space-y-3 sm:space-y-4">
              <Card className="bg-gray-900/50 border-gray-800 rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-gray-900/70 transition-colors duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#E2FF1B]" />
                    Lista de Participantes
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-400">
                    {participantes.length} jugadores registrados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {participantes.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <p className="text-sm sm:text-base text-gray-400">Aún no hay participantes registrados</p>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:gap-3">
                        {participantes.map((participante, index) => (
                          <div 
                            key={participante.id} 
                            className="group flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                              </div>
                              <div>
                                <p className="text-sm sm:text-base font-medium text-white line-clamp-1">{participante.nombre}</p>
                                <p className="text-xs sm:text-sm text-gray-400 line-clamp-1">{participante.email}</p>
                              </div>
                            </div>
                            <Badge variant={
                              participante.estado === 'pendiente' ? 'secondary' :
                              participante.estado === 'confirmado' ? 'default' :
                              'outline'
                            }>
                              {participante.estado.charAt(0).toUpperCase() + participante.estado.slice(1)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reglas" className="space-y-3 sm:space-y-4">
              <Card className="bg-gray-900/50 border-gray-800 rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-gray-900/70 transition-colors duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-[#E2FF1B]" />
                    Reglas del Torneo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="group p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-colors">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                        Formato de Juego
                      </h3>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                        <li className="flex items-start gap-1.5 sm:gap-2">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B] flex-shrink-0 mt-0.5" />
                          <span>Partidos al mejor de 3 sets</span>
                        </li>
                        <li className="flex items-start gap-1.5 sm:gap-2">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B] flex-shrink-0 mt-0.5" />
                          <span>Sistema de eliminación directa</span>
                        </li>
                        <li className="flex items-start gap-1.5 sm:gap-2">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B] flex-shrink-0 mt-0.5" />
                          <span>Tie-break en todos los sets</span>
                        </li>
                      </ul>
                    </div>

                    <div className="group p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-colors">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                        Premios
                      </h3>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                        <li className="flex items-start gap-1.5 sm:gap-2">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B] flex-shrink-0 mt-0.5" />
                          <span>Premio en efectivo para los ganadores</span>
                        </li>
                        <li className="flex items-start gap-1.5 sm:gap-2">
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B] flex-shrink-0 mt-0.5" />
                          <span>Trofeos para los tres primeros lugares</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 