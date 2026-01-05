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
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

export default function CircuitookaPage() {
  const [loading, setLoading] = useState(true)
  const [etapaActiva, setEtapaActiva] = useState(null)
  const [stats, setStats] = useState({
    totalJugadores: 0,
    totalPartidos: 0
  })

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
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
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
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#E2FF1B]/10 via-purple-500/10 to-[#E2FF1B]/10 animate-gradient-x" />
        
        <div className="container relative mx-auto px-4 md:px-6 max-w-7xl z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center mb-4">
              <Trophy className="w-16 h-16 text-[#E2FF1B]" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E2FF1B] to-white">
                Circuito 3GEN
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              El circuito de pádel más competitivo de la región. Compite, mejora y asciende de división.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/circuito3gen/inscripcion">
                <Button size="lg" className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                  Inscribirme
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/circuito3gen/rankings">
                <Button size="lg" variant="outline" className="border-2 border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10">
                  Ver Rankings
                  <BarChart3 className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Jugadores Registrados</p>
                      <p className="text-3xl font-bold text-white">{stats.totalJugadores}</p>
                    </div>
                    <Users className="w-12 h-12 text-[#E2FF1B]" />
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
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Partidos Jugados</p>
                      <p className="text-3xl font-bold text-white">{stats.totalPartidos}</p>
                    </div>
                    <PlayCircle className="w-12 h-12 text-[#E2FF1B]" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Etapa Activa */}
      {etapaActiva && (
        <section className="py-12">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#E2FF1B]" />
                Etapa Actual
              </h2>
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-[#E2FF1B]/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg sm:text-xl md:text-2xl break-words">{etapaActiva.nombre}</CardTitle>
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activa
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span><strong className="text-gray-300">Inicio:</strong> {formatDate(etapaActiva.fecha_inicio)}</span>
                      </div>
                      {etapaActiva.fecha_fin && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span><strong className="text-gray-300">Fin:</strong> {formatDate(etapaActiva.fecha_fin)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Link href={`/circuito3gen/rankings?etapa=${etapaActiva.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10">
                          Ver Rankings
                          <BarChart3 className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href="/circuito3gen/inscripcion" className="flex-1">
                        <Button className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
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
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
              <Info className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#E2FF1B]" />
              ¿Cómo Funciona?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Un sistema competitivo basado en rankings y ascensos de división
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: 'Inscríbete',
                description: 'Elige tu división inicial y únete al circuito'
              },
              {
                icon: PlayCircle,
                title: 'Juega Partidos',
                description: 'Participa en partidos organizados por el circuito'
              },
              {
                icon: TrendingUp,
                title: 'Mejora tu Ranking',
                description: 'Gana partidos y sube en el ranking de tu división'
              },
              {
                icon: Trophy,
                title: 'Asciende',
                description: 'Los mejores jugadores ascienden de división al finalizar cada etapa'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm h-full">
                  <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-[#E2FF1B]/10 rounded-full">
                        <step.icon className="w-8 h-8 text-[#E2FF1B]" />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 break-words">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sistema de Rankings */}
      <section className="py-16 bg-gray-800/30">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
              <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#E2FF1B]" />
              Sistema de Rankings
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Tu posición se calcula basándose en tu rendimiento y participación
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-sm sm:text-base md:text-lg flex items-center gap-2 break-words">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Promedio Individual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Partidos ganados / Partidos jugados. Mide tu efectividad personal.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-sm sm:text-base md:text-lg flex items-center gap-2 break-words">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Promedio General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Partidos ganados / Total de partidos de la división. Compara tu rendimiento con el resto.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-sm sm:text-base md:text-lg flex items-center gap-2 break-words">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Bonus por Jugar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Partidos jugados / Total de partidos de la división. Incentiva la participación activa.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/circuito3gen/rankings">
              <Button size="lg" variant="outline" className="border-2 border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10">
                Ver Rankings Completos
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 break-words">
              ¿Listo para competir?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Únete al circuito más competitivo y demuestra tu nivel
            </p>
            <Link href="/circuito3gen/inscripcion">
              <Button size="lg" className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                Inscribirme
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

