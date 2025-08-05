"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy, Calendar, Users, ArrowRight, Star, Award, Clock, ShoppingBag, ChevronLeft, ChevronRight, MessageCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import * as XLSX from "xlsx"
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectFade, Autoplay as SwiperAutoplay, Pagination } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

export default function Home() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    slidesToScroll: 1
  }, [Autoplay({ delay: 3000, stopOnInteraction: false, playOnInit: true })])

  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  // Hook para detectar el tamaño de pantalla
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px es el breakpoint md de Tailwind
    }

    // Verificar al cargar
    checkIsMobile()

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', checkIsMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Función para formatear precios
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  // Cargar productos del Excel
  useEffect(() => {
    const fetchExcelData = async () => {
      setIsLoadingProducts(true)
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRJlPwCH1_F1wzoxo5Ss37zJXLaozte-5FHUlFIpLcHFoI4Lf6D4oaLRteb-2NdP9ktJMkXwoG3OJWG/pub?gid=0&single=true&output=csv')
        const csvText = await response.text()
        
        // Convertir CSV a workbook
        const workbook = XLSX.read(csvText, { type: 'string' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // Extraer las columnas que nos interesan
        const headers = jsonData[0]
        const filteredData = jsonData.slice(1)
          .filter(row => row[0] && row[0].trim() !== '') // Filtrar filas vacías
          .map(row => {
            // Limpiar y convertir precios
            const precioRegularStr = (row[2] || '').toString().replace(/[^\d,]/g, '').replace(',', '.')
            const precio3GENStr = (row[3] || '').toString().replace(/[^\d,]/g, '').replace(',', '.')
            
            return {
              nombre: row[0]?.trim() || '',
              talle: row[1]?.trim() || '',
              precioRegular: parseFloat(precioRegularStr) || 0,
              precio3GEN: parseFloat(precio3GENStr) || 0,
              stock: parseInt(row[4]) || 0,
              imagen: row[5]?.trim() || '' // Nueva columna de imagen
            }
          })
        
        // Convertir datos del Excel a productos
        const excelProducts = filteredData.map((item, index) => ({
          id: index + 1,
          name: item.nombre,
          description: `${item.nombre} - Talle: ${item.talle}`,
          price: item.precio3GEN, // Usar precio 3GEN como precio principal
          originalPrice: item.precioRegular,
          talle: item.talle,
          stock: item.stock,
          image: item.imagen, // Usar imagen del Excel o placeholder
          category: "indumentaria" // Categoría por defecto
        }))
        
        // Filtrar productos únicos por nombre y excluir productos específicos
        const uniqueProducts = excelProducts.filter((product, index, self) => 
          index === self.findIndex(p => p.name === product.name) &&
          product.name !== "Short Joma Negro y Gris" &&
          product.name !== "Buzo Joma Azul Medio Cierre"
        )
        
        // Agregar productos de categoría Paletas (si existen en los datos)
        const productsWithPaletas = [...uniqueProducts]
        
        // Si no hay productos de paletas en los datos originales, agregar algunos de ejemplo
        const paletasProducts = [
          {
            id: uniqueProducts.length + 1,
            name: "Paleta Head Delta Pro",
            description: "Paleta profesional de alta gama",
            price: 45000,
            originalPrice: 52000,
            talle: "N/A",
            stock: 10,
            image: "/images/products/paleta-head.jpg",
            category: "paletas"
          },
          {
            id: uniqueProducts.length + 2,
            name: "Paleta Bullpadel Vertex",
            description: "Paleta de competición avanzada",
            price: 38000,
            originalPrice: 42000,
            talle: "N/A",
            stock: 8,
            image: "/images/products/paleta-bullpadel.jpg",
            category: "paletas"
          }
        ]
        
        // Combinar productos únicos con paletas
        const finalProducts = [...uniqueProducts, ...paletasProducts]
        
        setProducts(finalProducts)
      } catch (error) {
        console.error('Error al obtener datos del Excel:', error)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchExcelData()
  }, [])

  // Array de imágenes del hero para desktop
  const heroImagesDesktop = [
    '/images/home/1.jpg',
    '/images/home/2.jpg',
    '/images/home/3.jpg',
    '/images/home/4.jpg',
    '/images/home/5.jpg',
    '/images/home/6.jpg',
    '/images/home/7.jpg'
  ]

  // Array de imágenes del hero para móvil
  const heroImagesMobile = [
    '/images/home/mobile/1.jpg',
    '/images/home/mobile/2.jpg',
    '/images/home/mobile/3.jpg',
    '/images/home/mobile/4.jpg',
    '/images/home/mobile/5.jpg',
    '/images/home/mobile/6.jpg',
    '/images/home/mobile/7.jpg',
    '/images/home/mobile/8.jpg',
    '/images/home/mobile/9.jpg'
  ]

  // Seleccionar el array de imágenes según el dispositivo
  const heroImages = isMobile ? heroImagesMobile : heroImagesDesktop

  return (
    <div className="flex flex-col min-h-screen bg-black">

      {/* Hero Section */}
      <section className={`relative flex w-full items-center justify-center overflow-hidden -mt-16 ${isMobile ? 'min-h-[120vh]' : 'min-h-[100vh]'}`}>
        {/* Carrusel de imágenes de fondo con Swiper */}
        <div className="absolute inset-0">
          <Swiper
            modules={[EffectFade, SwiperAutoplay]}
            effect="fade"
            fadeEffect={{
              crossFade: true
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            loop={true}
            className="h-full w-full"
          >
            {heroImages.map((image, index) => (
              <SwiperSlide key={index}>
                <div className={`relative w-full ${isMobile ? 'h-[120vh]' : 'h-[100vh]'}`}>
                  <img
                    src={image}
                    alt={`Imagen ${index + 1} de 3gen Padel Academy`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Efecto de partículas */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-full bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        {/* Gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#E2FF1B]/10 via-purple-500/10 to-[#E2FF1B]/10 animate-gradient-x" />

        {/* Contenido principal */}
        <div className="container relative mx-auto px-4 md:px-6 max-w-7xl z-20">
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
              <Link href="/academia">
                <Button
                  size="lg"
                  className="group relative px-6 py-4 text-base font-medium bg-transparent text-[#E2FF1B] border-2 border-[#E2FF1B] rounded-xl transition-all duration-300 hover:text-black overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-[#E2FF1B] group-hover:text-black transition-colors duration-300" />
                    Conocé nuestra academia
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

        {/* Transición suave hacia la siguiente sección */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 via-gray-800/80 to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Efecto de partículas sutil */}
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center opacity-10" />
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Números que hablan
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Mirá los logros que hacen de 3gen Padel Academy la mejor opción para tu desarrollo
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {/* Jugadores Activos */}
            <div className="group relative">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-[#E2FF1B]/30 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E2FF1B]/10">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative">
                    <div className="text-4xl md:text-4xl font-bold text-[#E2FF1B] group-hover:scale-110 transition-transform duration-300">
                      500+
                    </div>
                  </div>
                  <div className="text-sm md:text-base text-white font-semibold">
                    Jugadores Activos
                  </div>
                  <div className="text-xs text-gray-400">
                    Comunidad creciente
                  </div>
                </div>
              </div>
            </div>

            {/* Clases Organizadas */}
            <div className="group relative">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-[#E2FF1B]/30 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E2FF1B]/10">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative">
                    <div className="text-4xl md:text-4xl font-bold text-[#E2FF1B] group-hover:scale-110 transition-transform duration-300">
                      50+
                    </div>
                  </div>
                  <div className="text-sm md:text-base text-white font-semibold">
                    Clases Organizadas
                  </div>
                  <div className="text-xs text-gray-400">
                    Experiencia garantizada
                  </div>
                </div>
              </div>
            </div>

            {/* Partidos Jugados */}
            <div className="group relative">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-[#E2FF1B]/30 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E2FF1B]/10">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative">
                    <div className="text-4xl md:text-4xl font-bold text-[#E2FF1B] group-hover:scale-110 transition-transform duration-300">
                      1000+
                    </div>
                  </div>
                  <div className="text-sm md:text-base text-white font-semibold">
                    Partidos Jugados
                  </div>
                  <div className="text-xs text-gray-400">
                    Diversión asegurada
                  </div>
                </div>
              </div>
            </div>

            {/* Valoración Media */}
            <div className="group relative">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-[#E2FF1B]/30 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E2FF1B]/10">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative">
                    <div className="text-4xl md:text-4xl font-bold text-[#E2FF1B] group-hover:scale-110 transition-transform duration-300">
                      4.8/5
                    </div>
                  </div>
                  <div className="text-sm md:text-base text-white font-semibold">
                    Valoración Media
                  </div>
                  <div className="text-xs text-gray-400">
                    Excelencia comprobada
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <a 
              href="https://wa.me/5491167617557?text=Hola! Me interesa unirme a la comunidad de 3gen Padel Academy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#E2FF1B]/20 to-[#E2FF1B]/10 rounded-full px-6 py-3 border border-[#E2FF1B]/30 hover:from-[#E2FF1B]/30 hover:to-[#E2FF1B]/20 transition-all duration-300 cursor-pointer"
            >
              <span className="text-[#E2FF1B] text-sm font-medium">
                ¡Únete a nuestra comunidad!
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-12 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative">
        {/* Efecto de partículas sutil */}
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center opacity-5" />
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Por qué elegir 3gen Padel Academy?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Conocé las ventajas de ser parte de 3gen Padel Academy
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Clases
                </h3>
              </div>
              <p className="text-gray-400">
                Participá en clases organizadas por 3gen Padel Academy con
                diferentes niveles de dificultad.
              </p>
            </div>
            <a 
              href="https://wa.me/5491167617557?text=Hola! Me interesa reservar en 3gen Padel Academy"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20 cursor-pointer block"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Reserva Fácil
                </h3>
              </div>
              <p className="text-gray-400">
                Proceso de inscripción sencillo y rápido para todas las clases
                disponibles.
              </p>
            </a>

            <div className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <Star className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Quiénes somos
                </h3>
              </div>
              <p className="text-gray-400">
                Aprendé de los mejores profesionales con años de experiencia en
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
                Participá en clases con premios y obtené reconocimientos por tu
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
            <div className="group p-6 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors duration-200 border border-gray-800 hover:border-[#E2FF1B]/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-[#E2FF1B]/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-[#E2FF1B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Partidos
                </h3>
              </div>
              <p className="text-gray-400">
                Disfrutá de partidos organizados y mejorá tu juego en un ambiente competitivo y divertido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Merchandising Section */}
      <section className="w-full py-12 md:py-24 bg-gradient-to-b from-gray-900 via-gray-800 to-black relative">
        {/* Efecto de partículas sutil */}
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center opacity-5" />
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Merchandising 3gen
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Conocé nuestra colección de productos exclusivos
            </p>
          </div>

          <div className="relative">
            {isLoadingProducts ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-[#E2FF1B] animate-spin mb-4" />
                <p className="text-gray-400 text-lg">Cargando productos...</p>
              </div>
            ) : (
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] p-2">
                      <div className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 h-full flex flex-col">
                        <div className="relative aspect-square overflow-hidden rounded-t-xl bg-black/20">
                          <img
                            src={product.image || "/images/products/camiseta-3gen.jpg"}
                            alt={product.name}
                            className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="text-lg font-semibold text-white mb-4 line-clamp-1">{product.name}</h3>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-[#E2FF1B]">{formatPrice(product.price)}</span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-sm text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controles del carrusel */}
            {!isLoadingProducts && products.length > 0 && (
              <>
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
              </>
            )}
          </div>

          {/* Enlace para ver todos los productos */}
          {!isLoadingProducts && products.length > 0 && (
            <div className="text-center mt-8">
              <Link href="/merchandising">
                <Button
                  variant="outline"
                  className="group relative px-6 py-3 text-base font-medium bg-transparent text-[#E2FF1B] border-2 border-[#E2FF1B] rounded-xl transition-all duration-300 hover:text-black overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#E2FF1B] group-hover:text-black transition-colors duration-300" />
                    Ver todos los productos
                    <ArrowRight className="h-4 w-4 text-[#E2FF1B] group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-[#E2FF1B]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-[#E2FF1B] rounded-xl translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                </Button>
              </Link>
            </div>
          )}
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
                  ¿Listo para aprender?
                </span>
              </h2>
              <p className="max-w-[600px] text-gray-200 md:text-xl mx-auto">
                Anotate ahora y empezá a mejorar tu juego en
                3gen Padel Academy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link href="/academia">
                <Button
                  size="lg"
                  className="group relative px-6 py-4 text-base font-medium bg-transparent text-[#E2FF1B] border-2 border-[#E2FF1B] rounded-xl transition-all duration-300 hover:text-black overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-[#E2FF1B] group-hover:text-black transition-colors duration-300" />
                    Conocé nuestra academia
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