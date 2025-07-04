"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy, Calendar, Users, ArrowRight, Star, Award, Clock, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { motion } from "framer-motion"
import { handleAuthError, supabase } from "@/lib/supabase"
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

export default function Home() {
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  }, [Autoplay({ delay: 3000, stopOnInteraction: false })])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    let mounted = true

    const fetchTorneos = async () => {
      try {
        const { data, error } = await supabase
          .from('torneo')
          .select('*')
          .eq('estado', 'abierto')
          .order('fecha_inicio', { ascending: true })
          .limit(3)

        if (error) {
          throw handleAuthError(error)
        }

        if (mounted) {
          setTorneos(data || [])
        }
      } catch (error) {
        console.error('Error fetching torneos:', error)
        if (mounted) {
          setError(error.message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchTorneos()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Error al cargar los torneos</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
        >
          Intentar nuevamente
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">

      {/* Hero Section */}
      <section className="relative flex w-full min-h-[100vh] items-center justify-center overflow-hidden -mt-16">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <img
            src="/images/background-padel.jpg"
            alt="Fondo Pádel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" /> {/* Overlay más transparente */}
        </div>

        {/* Efecto de partículas */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-full bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        {/* Gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#E2FF1B]/10 via-purple-500/10 to-[#E2FF1B]/10 animate-gradient-x" />

        {/* Contenido principal */}
        <div className="container relative mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center space-y-8 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E2FF1B] to-white animate-gradient-x">
                  3gen Padel Academy
                </span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link href="/torneos">
                <Button
                  size="lg"
                  className="group relative px-6 py-4 text-base font-medium bg-transparent text-[#E2FF1B] border-2 border-[#E2FF1B] rounded-xl transition-all duration-300 hover:text-black overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-[#E2FF1B] group-hover:text-black transition-colors duration-300" />
                    Ver torneos
                    <ArrowRight className="h-4 w-4 text-[#E2FF1B] group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-[#E2FF1B]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-[#E2FF1B] rounded-xl translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                </Button>
              </Link>
            </motion.div>

            {/* Tarjetas flotantes */}
            <div className="absolute top-1/2 left-0 w-full h-full -translate-y-1/2 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 0.5, x: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-1/4 left-[10%] w-32 h-32 bg-[#E2FF1B]/10 rounded-full blur-3xl"
              />
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 0.5, x: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="absolute top-1/3 right-[10%] w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
              />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/20 rounded-full p-1">
            <motion.div
              animate={{
                y: [0, 12, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-1.5 h-1.5 bg-white/60 rounded-full mx-auto"
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12 bg-gray-900">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center space-y-2">
              <div className="text-3xl font-bold text-[#E2FF1B]">500+</div>
              <div className="text-sm text-gray-400">Jugadores Activos</div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="text-3xl font-bold text-[#E2FF1B]">50+</div>
              <div className="text-sm text-gray-400">Torneos Organizados</div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="text-3xl font-bold text-[#E2FF1B]">1000+</div>
              <div className="text-sm text-gray-400">Partidos Jugados</div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="text-3xl font-bold text-[#E2FF1B]">4.8/5</div>
              <div className="text-sm text-gray-400">Valoración Media</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-12 bg-black">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Por qué elegir 3gen Padel Academy?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Descubre las ventajas de ser parte de 3gen Padel Academy
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Torneos Exclusivos
                </h3>
              </div>
              <p className="text-gray-400">
                Participa en torneos organizados por 3gen Padel Academy con
                diferentes niveles de dificultad.
              </p>
            </div>
            <div className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Reserva Fácil
                </h3>
              </div>
              <p className="text-gray-400">
                Proceso de inscripción sencillo y rápido para todos los torneos
                disponibles.
              </p>
            </div>
            <div className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <Users className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Comunidad Activa
                </h3>
              </div>
              <p className="text-gray-400">
                Forma parte de la comunidad de 3gen Padel Academy y mejora tu
                nivel.
              </p>
            </div>
            <div className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <Star className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Profesores Expertos
                </h3>
              </div>
              <p className="text-gray-400">
                Aprende de los mejores profesionales con años de experiencia en
                el mundo del padel.
              </p>
            </div>
            <div className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <Award className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Premios y Reconocimientos
                </h3>
              </div>
              <p className="text-gray-400">
                Participa en torneos con premios y obtén reconocimientos por tu
                desempeño.
              </p>
            </div>
            <div className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20">
              <div className="flex items-center space-x-4 mb-3">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <Clock className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Nuestros Turnos
                </h3>
              </div>
              <p className="text-gray-400 mb-2 text-sm">
                Lunes a Viernes de 8 am a 10 am
              </p>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mr-2"></span>
                  Iniciantes
                </span>
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mr-2"></span>
                  Nivelación
                </span>
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mr-2"></span>
                  Femenino
                </span>
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mr-2"></span>
                  Avanzado
                </span>
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mr-2"></span>
                  Intermedio
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Merchandising Section */}
      <section className="w-full py-12 md:py-24 bg-black">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Merchandising 3gen
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Descubre nuestra colección de productos exclusivos
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {/* Estructura base para todas las cards */}
                <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                  <div className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden rounded-t-xl bg-black/20">
                      <img
                        src="/images/products/camiseta-3gen.jpg"
                        alt="Camiseta 3gen"
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">Camiseta 3gen</h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">Camiseta oficial de 3gen Padel Academy</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-[#E2FF1B]">$29.999</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gorra */}
                <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                  <div className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden rounded-t-xl bg-black/20">
                      <img
                        src="/images/products/gorra-3gen.jpg"
                        alt="Gorra 3gen"
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">Gorra 3gen</h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">Gorra ajustable con logo bordado</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-[#E2FF1B]">$19.999</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bolsa de Pádel */}
                <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                  <div className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden rounded-t-xl bg-black/20">
                      <img
                        src="/images/products/bolsa-padel.jpg"
                        alt="Bolsa de Pádel"
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">Bolsa de Pádel</h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">Bolsa térmica para 2 palas</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-[#E2FF1B]">$49.999</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toalla */}
                <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                  <div className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden rounded-t-xl bg-black/20">
                      <img
                        src="/images/products/toalla-3gen.jpg"
                        alt="Toalla 3gen"
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">Toalla 3gen</h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">Toalla de microfibra absorbente</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-[#E2FF1B]">$14.999</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Muñequera */}
                <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                  <div className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden rounded-t-xl bg-black/20">
                      <img
                        src="/images/products/munequera-3gen.jpg"
                        alt="Muñequera 3gen"
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">Muñequera 3gen</h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">Muñequera elástica con logo</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-[#E2FF1B]">$9.999</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calcetines */}
                <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                  <div className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden rounded-t-xl bg-black/20">
                      <img
                        src="/images/products/calcetines-3gen.jpg"
                        alt="Calcetines 3gen"
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">Calcetines 3gen</h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">Pack de 3 pares de calcetines técnicos</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-[#E2FF1B]">$24.999</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mochila */}
                <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                  <div className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden rounded-t-xl bg-black/20">
                      <img
                        src="/images/products/mochila-3gen.jpg"
                        alt="Mochila 3gen"
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">Mochila 3gen</h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">Mochila deportiva con compartimento para pala</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-[#E2FF1B]">$39.999</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Riñonera */}
                <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                  <div className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden rounded-t-xl bg-black/20">
                      <img
                        src="/images/products/rinonera-3gen.jpg"
                        alt="Riñonera 3gen"
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">Riñonera 3gen</h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">Riñonera deportiva con múltiples bolsillos</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-[#E2FF1B]">$19.999</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles del carrusel */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
              onClick={scrollNext}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full py-16 md:py-24 overflow-hidden">
        {/* Fondo con gradiente y efecto de partículas */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#E2FF1B]/5 via-purple-500/5 to-[#E2FF1B]/5 animate-gradient-x" />
        </div>

        {/* Círculos decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#E2FF1B]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E2FF1B] to-white animate-gradient-x">
                  ¿Listo para competir?
                </span>
              </h2>
              <p className="max-w-[600px] text-gray-200 md:text-xl mx-auto">
                Regístrate ahora y comienza a participar en los torneos de
                3gen Padel Academy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link href="/torneos">
                <Button
                  size="lg"
                  className="group relative px-6 py-4 text-base font-medium bg-transparent text-[#E2FF1B] border-2 border-[#E2FF1B] rounded-xl transition-all duration-300 hover:text-black overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-[#E2FF1B] group-hover:text-black transition-colors duration-300" />
                    Ver torneos
                    <ArrowRight className="h-4 w-4 text-[#E2FF1B] group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-[#E2FF1B]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-[#E2FF1B] rounded-xl translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                </Button>
              </Link>
            </motion.div>

            {/* Elementos decorativos adicionales */}
            <div className="absolute top-1/2 left-0 w-full h-full -translate-y-1/2 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 0.5, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-1/4 left-[10%] w-32 h-32 bg-[#E2FF1B]/10 rounded-full blur-3xl"
              />
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 0.5, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.7 }}
                className="absolute top-1/3 right-[10%] w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 