'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Trophy,
  Calendar,
  Users,
  TrendingUp,
  ArrowRight,
  PlayCircle,
  Award,
  Target,
  BarChart3,
  CheckCircle,
  Info,
  Clock,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function CircuitookaPage() {
  const [loading, setLoading] = useState(true)
  const [etapaActiva, setEtapaActiva] = useState(null)
  const [stats, setStats] = useState({
    totalJugadores: 0,
    totalPartidos: 0
  })
  const [isReglamentoOpen, setIsReglamentoOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener etapa activa (solo una)
      const { data: etapa, error: etapaError } = await supabase
        .from('circuito3gen_etapas')
        .select('*')
        .eq('estado', 'activa')
        .order('fecha_inicio', { ascending: false })
        .limit(1)
        .single()

      if (etapaError && etapaError.code !== 'PGRST116') throw etapaError
      setEtapaActiva(etapa || null)

      // Obtener estadísticas - todos los jugadores únicos registrados y todos los partidos
      // Contar jugadores únicos desde rankings e inscripciones (combinar ambas fuentes)
      const [rankingsResult, inscripcionesResult, partidosResult] = await Promise.all([
        supabase
          .from('circuito3gen_rankings')
          .select('usuario_id'),
        supabase
          .from('circuito3gen_inscripciones')
          .select('usuario_id'),
        supabase
          .from('circuito3gen_partidos')
          .select('*', { count: 'exact', head: true })
      ])

      // Combinar ambos conjuntos para obtener todos los jugadores únicos
      const usuariosRankings = new Set(rankingsResult.data?.map(r => r.usuario_id).filter(Boolean) || [])
      const usuariosInscripciones = new Set(inscripcionesResult.data?.map(i => i.usuario_id).filter(Boolean) || [])
      
      // Unir ambos sets para obtener el total de jugadores únicos
      const todosLosUsuarios = new Set([...usuariosRankings, ...usuariosInscripciones])
      const totalJugadores = todosLosUsuarios.size

      setStats({
        totalJugadores: totalJugadores,
        totalPartidos: partidosResult.count || 0
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      // Si es solo fecha (YYYY-MM-DD), crear el objeto Date con componentes locales
      let date
      if (typeof dateString === 'string') {
        if (dateString.includes('T')) {
          // Si tiene hora, usar directamente (pero podría tener problemas de zona horaria)
          date = new Date(dateString)
        } else {
          // Si es solo fecha YYYY-MM-DD, parsear manualmente para usar zona horaria local
          const [year, month, day] = dateString.split('-')
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        }
      } else {
        date = new Date(dateString)
      }
      
      return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
      })
    } catch (error) {
      console.error('Error formateando fecha:', error)
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-20 pb-12 sm:pb-16">
        {/* Fondo animado de pádel */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900" style={{ zIndex: 0, pointerEvents: 'none' }}>
          {/* Canchas en perspectiva */}
          <div className="absolute inset-0 opacity-10 hidden sm:block">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  top: `${20 + i * 25}%`,
                  left: `${-10 + i * 15}%`,
                  width: 'clamp(200px, 400px, 90vw)',
                  height: 'clamp(100px, 200px, 45vw)',
                  transform: `perspective(800px) rotateY(-45deg) rotateX(20deg)`,
                  transformStyle: 'preserve-3d',
                  animation: `float${i} ${8 + i * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 1.5}s`
                }}
              >
                {/* Cancha de pádel */}
                <div className="relative w-full h-full border-2 border-[#E2FF1B]/30 rounded-lg">
                  {/* Líneas de la cancha */}
                  <div className="absolute inset-0 border-t-2 border-b-2 border-[#E2FF1B]/20" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#E2FF1B]/20 transform -translate-x-1/2" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-[#E2FF1B]/20 transform -translate-y-1/2" />
                  {/* Red */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-[#E2FF1B]/40 transform -translate-x-1/2">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E2FF1B]/60 to-transparent animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pelotas de pádel rebotando */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#E2FF1B]/20 border border-[#E2FF1B]/40"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `bouncePadel${i % 3} ${4 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  boxShadow: `0 0 20px rgba(226, 255, 27, 0.3), inset -5px -5px 10px rgba(0, 0, 0, 0.3)`
                }}
              >
                {/* Efecto de brillo en la pelota */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              </div>
            ))}
          </div>

          {/* Trayectorias de pelotas */}
          <svg className="absolute inset-0 w-full h-full opacity-20 hidden sm:block" style={{ zIndex: 1, pointerEvents: 'none' }}>
            {[...Array(4)].map((_, i) => (
              <path
                key={i}
                d={`M ${100 + i * 200},${200 + i * 100} Q ${400 + i * 150},${100 + i * 150} ${600 + i * 200},${300 + i * 100}`}
                stroke="#E2FF1B"
                strokeWidth="2"
                fill="none"
                strokeDasharray="15 10"
                strokeDashoffset="1000"
                style={{
                  animation: `drawPath ${6 + i}s linear infinite`,
                  animationDelay: `${i * 1.5}s`
                }}
              />
            ))}
          </svg>

          {/* Partículas flotantes (simulando pelotas pequeñas) */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#E2FF1B]/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `floatParticle ${8 + Math.random() * 4}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`,
                  boxShadow: `0 0 10px rgba(226, 255, 27, 0.5)`
                }}
              />
            ))}
          </div>
        </div>

        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#E2FF1B]/10 via-purple-500/10 to-[#E2FF1B]/10 animate-gradient-x" style={{ zIndex: 10, pointerEvents: 'none' }} />
        
        <div className="container relative mx-auto px-4 md:px-6 max-w-7xl" style={{ zIndex: 20 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 sm:space-y-6"
          >
            <div className="flex justify-center mb-2 sm:mb-4">
              <Trophy className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-[#E2FF1B]" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter px-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E2FF1B] to-white">
                Circuito 3GEN
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              El circuito de pádel más competitivo de la región. Competí, mejorá y ascendé de división.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-2 sm:pt-4 px-4">
              <Link href="/circuito3gen/inscripcion" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm sm:text-base">
                  Inscribirme
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <Link href="/circuito3gen/rankings" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10 text-sm sm:text-base">
                  Ver Rankings
                  <BarChart3 className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Jugadores Registrados</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white truncate">{stats.totalJugadores}</p>
                    </div>
                    <Users className="w-10 h-10 sm:w-12 sm:h-12 text-[#E2FF1B] flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Partidos Jugados</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white truncate">{stats.totalPartidos}</p>
                    </div>
                    <PlayCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#E2FF1B] flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Etapa Activa */}
      {etapaActiva && (
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 flex-wrap">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#E2FF1B] flex-shrink-0" />
                <span className="break-words">Etapa actual</span>
              </h2>
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-[#E2FF1B]/50 transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <CardTitle className="text-white text-base sm:text-lg md:text-xl lg:text-2xl break-words">{etapaActiva.nombre}</CardTitle>
                    <Badge className="bg-green-600 text-white self-start sm:self-auto">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activa
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-400">
                        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <span className="break-words"><strong className="text-gray-300">Inicio:</strong> {formatDate(etapaActiva.fecha_inicio)}</span>
                      </div>
                      {etapaActiva.fecha_fin && (
                        <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-400">
                          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                          <span className="break-words"><strong className="text-gray-300">Fin:</strong> {formatDate(etapaActiva.fecha_fin)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                      <Link href={`/circuito3gen/rankings?etapa=${etapaActiva.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10 text-sm sm:text-base">
                          Ver Rankings
                          <BarChart3 className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href="/circuito3gen/inscripcion" className="flex-1">
                        <Button className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm sm:text-base">
                          Inscribirme
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Cómo Funciona */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 flex items-center justify-center gap-2 flex-wrap px-2">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#E2FF1B] flex-shrink-0" />
              <span className="break-words">¿Cómo funciona?</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto px-4">
              Un sistema competitivo basado en rankings y ascensos de división
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: Target,
                title: 'Inscribite',
                description: 'Elegí tu división inicial y unite al circuito. El proceso es simple y rápido, solo necesitás inscribirte.'
              },
              {
                icon: PlayCircle,
                title: 'Jugá partidos cuando quieras',
                description: 'Participá en partidos organizados por el circuito. No hay obligación de jugar cada fecha.'
              },
              {
                icon: TrendingUp,
                title: 'Mejorá tu Ranking',
                description: 'Ganá partidos y subí en el ranking de tu división. Cada victoria suma puntos y mejora tu posición.'
              },
              {
                icon: Trophy,
                title: 'Ascendé',
                description: 'Los mejores jugadores ascienden de división al finalizar cada etapa. Demostrá tu nivel y subí de categoría.'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm h-full">
                  <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 text-center">
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 bg-[#E2FF1B]/10 rounded-full">
                        <step.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#E2FF1B]" />
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-2 break-words px-2 min-h-[3.5rem] sm:min-h-[4rem] flex items-center justify-center leading-tight">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 px-2">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sistema de Rankings */}
      <section className="py-12 sm:py-16 bg-gray-800/30">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 flex items-center justify-center gap-2 flex-wrap px-2">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#E2FF1B] flex-shrink-0" />
              <span className="break-words">Sistema de Rankings</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto px-4">
              Tu posición se calcula basándose en tu rendimiento y participación
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-2 break-words">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B] flex-shrink-0" />
                  <span>Promedio Individual</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-gray-300 text-xs sm:text-sm">
                  Partidos ganados / Partidos jugados. Mide tu efectividad personal.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-2 break-words">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B] flex-shrink-0" />
                  <span>Promedio General</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-gray-300 text-xs sm:text-sm">
                  Partidos ganados / Total de partidos de la división. Compara tu rendimiento con el resto.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-2 break-words">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B] flex-shrink-0" />
                  <span>Bonus por Jugar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-gray-300 text-xs sm:text-sm">
                  Partidos jugados / Total de partidos de la división. Incentiva la participación activa.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-6 sm:mt-8 px-4">
            <Link href="/circuito3gen/rankings" className="inline-block w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10 text-sm sm:text-base">
                Rankings Completos
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 break-words px-2">
              ¿Listo para competir?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6 sm:mb-8 px-4">
              Únete al circuito más competitivo y demuestra tu nivel
            </p>
            <Link href="/circuito3gen/inscripcion" className="inline-block w-full sm:w-auto px-4">
              <Button size="lg" className="w-full sm:w-auto bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm sm:text-base">
                Inscribirme
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Botón flotante para reglamento */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        onClick={() => setIsReglamentoOpen(true)}
        className="fixed bottom-6 right-6 z-40 group block"
        aria-label="Ver reglamento del torneo"
      >
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E2FF1B] to-[#E2FF1B]/60 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center justify-center w-14 h-14 bg-black rounded-full border border-gray-800 group-hover:border-[#E2FF1B]/40 transition-all duration-300 hover:scale-105">
            <FileText className="w-6 h-6 text-[#E2FF1B] group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
        <div className="absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-[#E2FF1B]/30">
            Ver Reglamento
          </div>
        </div>
      </motion.button>

      {/* Modal del Reglamento */}
      <Dialog open={isReglamentoOpen} onOpenChange={setIsReglamentoOpen}>
        <DialogContent className="bg-black/95 backdrop-blur-sm border-white/10 text-white w-[95vw] max-w-6xl mx-auto max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <DialogTitle className="flex items-center gap-2 text-[#E2FF1B] text-lg sm:text-xl">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              Reglamento del Torneo - Circuito 3GEN
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-[calc(90vh-100px)] p-6">
            <iframe
              src="https://drive.google.com/file/d/1KPsS3R6t2jwLZxJZ6MdxXxbOdditZOP4/preview"
              className="w-full h-full border-0 rounded-lg"
              allow="autoplay"
              title="Reglamento del Torneo Circuito 3GEN"
            />
          </div>
          <div className="px-6 pb-6 pt-4 border-t border-white/10 flex justify-end">
            <Button
              onClick={() => setIsReglamentoOpen(false)}
              variant="outline"
              className="border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

