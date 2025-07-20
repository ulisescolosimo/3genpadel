"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import HtmlContent from '@/components/ui/html-content'
import { Trophy, Users, Calendar, MapPin, ArrowLeft, Star, Clock, Award, Target, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

export default function LigasPage() {
  const { user } = useAuth()
  const [ligas, setLigas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLigas()
  }, [])

  const fetchLigas = async () => {
    try {
      const { data, error } = await supabase
        .from('ligas')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            max_inscripciones,
            ligainscripciones (id, estado)
          )
        `)
        .order('fecha_inicio', { ascending: false })

      if (error) throw error

      // Procesar los datos para incluir información de inscripciones por categoría
      const ligasProcesadas = data.map(liga => {
        const categorias = liga.liga_categorias || []
        
        // Procesar cada categoría con sus inscripciones (solo aprobadas)
        const categoriasConInscripciones = categorias.map(cat => {
          const inscripcionesAprobadas = cat.ligainscripciones?.filter(ins => ins.estado === 'aprobada')?.length || 0
          return {
            categoria: cat.categoria,
            inscripcionesActuales: inscripcionesAprobadas,
            maxInscripciones: cat.max_inscripciones,
            disponible: inscripcionesAprobadas < cat.max_inscripciones
          }
        })
        
        const categoriasDisponibles = categorias.map(cat => cat.categoria).join(', ')
        
        return {
          ...liga,
          categorias: categoriasDisponibles,
          categoriasDetalle: categoriasConInscripciones,
          inscripcionesActuales: categorias.reduce((total, cat) => {
            const inscripcionesAprobadas = cat.ligainscripciones?.filter(ins => ins.estado === 'aprobada')?.length || 0
            return total + inscripcionesAprobadas
          }, 0),
          maxInscripciones: categorias.reduce((total, cat) => total + cat.max_inscripciones, 0)
        }
      })

      setLigas(ligasProcesadas)
    } catch (error) {
      console.error('Error fetching ligas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (liga) => {
    if (liga.estado === 'cerrada') {
      return { text: 'Cerrada', variant: 'destructive', className: 'bg-red-500' }
    }
    
    // Verificar si hay al menos una categoría con plazas disponibles
    const hayCategoriasDisponibles = liga.categoriasDetalle?.some(cat => cat.disponible) || false
    if (!hayCategoriasDisponibles) {
      return { text: 'Completa', variant: 'secondary', className: 'bg-yellow-500' }
    }
    return { text: 'Abierta', variant: 'default', className: 'bg-green-500' }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Cargando liga...</p>
        </div>
      </div>
    )
  }

  if (ligas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="pt-12 pb-8 px-4">
          <div className="container mx-auto">
            <Link href="/inscripciones" className="inline-flex items-center gap-2 text-[#E2FF1B] hover:text-[#E2FF1B]/80 transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Volver a Inscripciones
            </Link>
            
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No hay ligas disponibles</h3>
              <p className="text-gray-400">Próximamente tendremos nuevas ligas para ti</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar solo la primera liga con protagonismo
  const liga = ligas[0]
  const statusBadge = getStatusBadge(liga)
  
  // Verificar si hay al menos una categoría con plazas disponibles
  const hayCategoriasDisponibles = liga.categoriasDetalle?.some(cat => cat.disponible) || false
  const isInscribible = liga.estado === 'abierta' && hayCategoriasDisponibles && user

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="container mx-auto">
          <Link href="/inscripciones" className="inline-flex items-center gap-2 text-[#E2FF1B] hover:text-[#E2FF1B]/80 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver a Inscripciones
          </Link>
          
          <div className="text-center mb-12 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="text-[#E2FF1B]">Liga</span> Actual
            </h1>
            <p className="text-xl text-gray-300">
              Únete a nuestra liga competitiva y mejora tu ranking jugando contra los mejores
            </p>
          </div>
        </div>
      </div>

      {/* Liga Destacada */}
      <div className="container mx-auto px-4 pb-4">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 overflow-hidden">
            {/* Header con imagen de fondo */}
            <div className="relative bg-gradient-to-r from-[#E2FF1B]/10 to-[#E2FF1B]/5 p-8 border-b border-white/10">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-[#E2FF1B]/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-[#E2FF1B]" />
                </div>
                <Badge 
                  variant={statusBadge.variant}
                  className={`${statusBadge.className} text-sm px-4 py-2`}
                >
                  {statusBadge.text}
                </Badge>
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold text-white mb-4">{liga.nombre}</CardTitle>
              <div className="text-lg text-gray-300 max-w-3xl">
                <HtmlContent content={liga.descripcion} />
              </div>
            </div>

            <CardContent className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Información Principal */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-[#E2FF1B] flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Información General
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-300">
                        <Users className="w-5 h-5 text-[#E2FF1B]" />
                        <span className="font-medium">Categorías:</span>
                        <span className="text-white">{liga.categorias}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-300">
                        <Calendar className="w-5 h-5 text-[#E2FF1B]" />
                        <span className="font-medium">Fecha de inicio:</span>
                        <span className="text-white">{formatDate(liga.fecha_inicio)}</span>
                      </div>
                      
                      {liga.costo_inscripcion && (
                        <div className="flex items-center gap-3 text-gray-300">
                          <Star className="w-5 h-5 text-[#E2FF1B]" />
                          <span className="font-medium">Costo de inscripción:</span>
                          <span className="text-[#E2FF1B] font-bold text-lg">${liga.costo_inscripcion.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {liga.formato && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-[#E2FF1B] flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Formato de Juego
                      </h4>
                      <p className="text-gray-300 leading-relaxed">{liga.formato}</p>
                    </div>
                  )}
                </div>

                {/* Estado de Inscripciones */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-[#E2FF1B] flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Estado de Inscripciones
                  </h3>
                  
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="space-y-4">
                      {liga.categoriasDetalle.map((cat, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[#E2FF1B] font-semibold">{cat.categoria}</span>
                            <span className={`text-sm ${cat.disponible ? 'text-white' : 'text-red-400'}`}>
                              {cat.inscripcionesActuales}/{cat.maxInscripciones}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                cat.disponible ? 'bg-[#E2FF1B]' : 'bg-red-500'
                              }`}
                              style={{ width: `${(cat.inscripcionesActuales / cat.maxInscripciones) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {cat.disponible ? (
                              <>
                                <div className="w-2 h-2 bg-[#E2FF1B] rounded-full"></div>
                                <span className="text-green-400">Plazas disponibles</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-red-400">Categoría completa</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón de Inscripción */}
                  <div className="">
                    {!user ? (
                      <Button 
                        className="w-full bg-gray-600 text-white cursor-not-allowed py-6 text-lg font-semibold"
                        disabled
                      >
                        <LogIn className="w-5 h-5 mr-2" />
                        Inicia sesión para inscribirte
                      </Button>
                    ) : isInscribible ? (
                      <Link href={`/inscripciones/ligas/${liga.id}`}>
                        <Button 
                          className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors py-6 text-lg font-semibold"
                        >
                          ¡Inscribirse Ahora!
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full bg-gray-600 text-white cursor-not-allowed py-6 text-lg font-semibold"
                        disabled
                      >
                        {liga.estado === 'cerrada' ? 'Liga Cerrada' : 'Liga Completa'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Información Importante</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#E2FF1B] mb-4">¿Cómo funciona la liga?</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Juegas partidos semanales contra otros jugadores</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Ganas puntos según tus resultados</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Mejoras tu ranking en la tabla de posiciones</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Participas en torneos especiales</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#E2FF1B] mb-4">Requisitos</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Ser mayor de 18 años</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Pago de inscripción al inicio</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Compromiso de asistencia semanal</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Equipamiento básico de padel</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 