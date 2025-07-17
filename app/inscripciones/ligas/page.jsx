"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Calendar, MapPin, ArrowLeft, Star, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LigasPage() {
  const [selectedLevel, setSelectedLevel] = useState('all')
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

  const filteredLigas = selectedLevel === 'all' 
    ? ligas 
    : ligas.filter(liga => liga.nombre.toLowerCase().includes(selectedLevel.toLowerCase()))

  const getStatusBadge = (liga) => {
    if (liga.estado === 'cerrada') {
      return { text: 'Cerrada', variant: 'destructive', className: 'bg-red-500' }
    }
    if (liga.inscripcionesActuales >= liga.maxInscripciones) {
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
          <p className="text-white">Cargando ligas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="pt-32 pb-8 px-4">
        <div className="container mx-auto">
          <Link href="/inscripciones" className="inline-flex items-center gap-2 text-[#E2FF1B] hover:text-[#E2FF1B]/80 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver a Inscripciones
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="text-[#E2FF1B]">Ligas</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Únete a nuestras ligas competitivas y mejora tu ranking jugando contra los mejores
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button
              variant={selectedLevel === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('all')}
              className={selectedLevel === 'all' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Todas las Ligas
            </Button>
            <Button
              variant={selectedLevel === 'agosto' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('agosto')}
              className={selectedLevel === 'agosto' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Agosto 2025
            </Button>
            <Button
              variant={selectedLevel === 'septiembre' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('septiembre')}
              className={selectedLevel === 'septiembre' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Septiembre 2025
            </Button>
          </div>
        </div>
      </div>

      {/* Ligas Grid */}
      <div className="container mx-auto px-4 pb-16">
        {ligas.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay ligas disponibles</h3>
            <p className="text-gray-400">Próximamente tendremos nuevas ligas para ti</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredLigas.map((liga) => {
              const statusBadge = getStatusBadge(liga)
              const isInscribible = liga.estado === 'abierta' && liga.inscripcionesActuales < liga.maxInscripciones
              
              return (
                <Card key={liga.id} className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#E2FF1B]/20 transition-colors">
                        <Trophy className="w-6 h-6 text-[#E2FF1B]" />
                      </div>
                      <Badge 
                        variant={statusBadge.variant}
                        className={statusBadge.className}
                      >
                        {statusBadge.text}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-white mb-2">{liga.nombre}</CardTitle>
                    <CardDescription className="text-gray-400">{liga.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Users className="w-4 h-4" />
                        <span>Categorías: {liga.categorias}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>Inicio: {formatDate(liga.fecha_inicio)}</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>Plazas por categoría:</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-gray-400 font-medium">Categoría</div>
                            <div className="text-gray-400 font-medium text-right">Inscritos</div>
                            {liga.categoriasDetalle.map((cat, index) => (
                              <>
                                <div key={`cat-${index}`} className="text-[#E2FF1B] font-medium">{cat.categoria}</div>
                                <div key={`count-${index}`} className="text-right">
                                  <span className={`${cat.disponible ? 'text-white' : 'text-red-400'}`}>
                                    {cat.inscripcionesActuales}
                                  </span>
                                  <span className="text-white">/{cat.maxInscripciones}</span>
                                  {cat.disponible ? (
                                    <span className="ml-1 text-white text-[10px]">●</span>
                                  ) : (
                                    <span className="ml-1 text-red-400 text-[10px]">●</span>
                                  )}
                                </div>
                              </>
                            ))}
                          </div>
                        </div>
                      </div>
                      {liga.costo_inscripcion && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Star className="w-4 h-4" />
                          <span className="font-semibold text-[#E2FF1B]">${liga.costo_inscripcion.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {liga.formato && (
                        <div className="pt-4">
                          <h4 className="text-sm font-semibold text-white mb-2">Formato:</h4>
                          <p className="text-xs text-gray-400">{liga.formato}</p>
                        </div>
                      )}
                      
                      {isInscribible ? (
                        <Link href={`/inscripciones/ligas/${liga.id}`}>
                          <Button 
                            className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors mt-6"
                          >
                            Inscribirse
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          className="w-full bg-gray-600 text-white cursor-not-allowed mt-6"
                          disabled
                        >
                          {liga.estado === 'cerrada' ? 'Cerrada' : 'Completa'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Información Importante</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#E2FF1B] mb-4">¿Cómo funcionan las ligas?</h3>
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