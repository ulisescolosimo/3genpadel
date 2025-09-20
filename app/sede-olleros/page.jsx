'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Star, Calendar, MapPin, Phone, Mail, Zap, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SedeOllerosPage() {
  const [selectedImage, setSelectedImage] = useState(0)
  
  const images = [
    '1f23bb38-696d-4a93-88f5-b15a870d9463.JPG',
    '305a8f1b-2a44-4ca8-a685-cbb3b8d2f8c0.JPG',
    '313f2b1d-55ca-4c7d-ab14-f0fb8c209f97.JPG',
    '5b30f465-a449-4849-8f01-2edc6f680395.JPG',
    '5d681fda-92a2-4e30-aeb2-5d218dda6b0a.JPG',
    '605d63a1-554b-4e2b-8d00-31c945dda5a9.JPG',
    '67bf875f-af56-4279-a994-61a2fa6fb3e9.JPG',
    '6a1e4c11-ef21-4f12-b2f1-f53aa1105848.JPG',
    '88bc2c70-c85c-48aa-8813-19c289146082.JPG',
    '8aedb0a6-9742-4135-a0cb-fe3f8f640217.jpg',
    '8ff124ca-dadc-4de3-95fb-3c1f6aedcca6.JPG',
    'a2bc5341-2e6e-4345-82be-ef6bb48936b0.JPG',
    'b75656ae-ba9d-4839-8be3-cdfec7684fd7.JPG',
    'd22c29d8-4262-4ed4-bdab-d1780cccd3dc.JPG',
    'e530bae5-e8d6-47ff-a98e-2aa46d51120c.JPG',
    'ebef0cdf-cfee-49af-bc78-d7a2f5078534.JPG',
    'f18dfe07-fc7f-4d38-bed4-a508b7c92b2b.JPG',
    'IMG_8842.jpg',
    'IMG_8843.jpg',
    'IMG_8844.jpg'
  ]


  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }

  const openWhatsApp = (mensaje) => {
    const message = encodeURIComponent(mensaje)
    const whatsappUrl = `https://wa.me/5491167617557?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-3 sm:gap-6 lg:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:text-[#E2FF1B] hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                <span className="text-[#E2FF1B]">Sede</span> Olleros
              </h1>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl font-medium">Olleros 1515, Palermo, CABA</p>
            </div>
          </div>
        </div>
      </div>


      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Horarios Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-white">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 inline mr-2 text-[#E2FF1B]" />
              Reserva tu Clase - Sede Olleros
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300">
              Selecciona el horario que mejor se adapte a tu nivel y disponibilidad
            </p>
          </div>
          <div className="calendly-inline-widget" data-url="https://calendly.com/3gen" style={{minWidth: '320px', height: '700px'}}></div>

        </div>

        {/* Clases Personalizadas Section */}
        <div className="max-w-6xl mx-auto mb-16">
            <div className="text-center mb-8 md:mb-12">
              <div className="bg-gradient-to-r from-[#E2FF1B]/10 to-transparent p-8 md:p-12 rounded-3xl border border-[#E2FF1B]/20 mb-8">
                <div className="max-w-4xl mx-auto">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#E2FF1B]/20 rounded-full border border-[#E2FF1B]/30 mb-6">
                    <Trophy className="w-6 h-6 text-[#E2FF1B]" />
                    <span className="text-[#E2FF1B] font-semibold text-lg">Clases Privadas</span>
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
                    <span className="text-[#E2FF1B]">Reservar</span> Clase Privada
                  </h2>
                  
                  <div className="space-y-4 mb-8">
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed">
                      Solicitá una clase privada con uno de nuestros entrenadores profesionales para una experiencia más personalizada.
                    </p>
                  </div>

                </div>
              </div>
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
                    <div className="px-3 py-1 bg-[#E2FF1B]/20 text-[#E2FF1B] text-xs font-medium rounded-full inline-block mb-4 w-fit">
                      Técnica Avanzada
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-center leading-relaxed text-sm">
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
                        onClick={() => openWhatsApp('Hola! Me interesa reservar una clase privada con Stefano Lorenzo. ¿Podrían darme más información sobre disponibilidad y precios?')}
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
                    <div className="px-3 py-1 bg-[#E2FF1B]/20 text-[#E2FF1B] text-xs font-medium rounded-full inline-block mb-4 w-fit">
                      Táctica Profesional
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-center leading-relaxed text-sm">
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
                        onClick={() => openWhatsApp('Hola! Me interesa reservar una clase privada con Ignacio Begher. ¿Podrían darme más información sobre disponibilidad y precios?')}
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
                  incluyendo Nacho y Stefano que comparten su experiencia y técnicas de alto nivel. 
                  Aprovechá la oportunidad de entrenar con los mejores.
                </p>
              </div>
            </div>
          </div>

        {/* Contacto Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-white">
              <MapPin className="w-6 h-6 md:w-8 md:h-8 inline mr-2 text-[#E2FF1B]" />
              Contacto y Ubicación
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300">
              Información de contacto y ubicación de nuestra sede
            </p>
          </div>

        {/* Map and Gallery Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          {/* Image Gallery */}
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Galería de Imágenes</h3>
            
            {/* Main Image */}
            <div className="relative mb-3 md:mb-4">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <Image
                  src={`/images/olleros/${images[selectedImage]}`}
                  alt={`Sede Olleros - Imagen ${selectedImage + 1}`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              
              {/* Navigation Buttons */}
              <button
                onClick={prevImage}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 md:p-2 rounded-full transition-colors"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 md:p-2 rounded-full transition-colors"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 rotate-180" />
              </button>
              
              {/* Image Counter */}
              <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
                {selectedImage + 1} / {images.length}
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Ubicación en el Mapa</h3>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3623.6404302172423!2d-58.435393999999995!3d-34.5621083!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5b74694e459%3A0x400c1d4d3358a78a!2sAv.%20Olleros%201515%2C%20C1426CRA%20Cdad.%20Aut%C3%B3noma%20de%20Buenos%20Aires!5e1!3m2!1ses!2sar!4v1757616908186!5m2!1ses!2sar" 
                width="100%" 
                height="100%" 
                style={{border: 0}} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

          {/* Contact Information - Full Width */}
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-6 bg-white/5 rounded-lg w-full">
                <MapPin className="w-6 h-6 text-[#E2FF1B] flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg mb-1">Dirección</h4>
                  <p className="text-gray-300 text-base">Av. Olleros 1515, Palermo, CABA</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-6 bg-white/5 rounded-lg w-full">
                <Phone className="w-6 h-6 text-[#E2FF1B] flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg mb-1">Teléfono</h4>
                  <p className="text-gray-300 text-base">+54 9 11 6761-7557</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-6 bg-white/5 rounded-lg w-full">
                <Mail className="w-6 h-6 text-[#E2FF1B] flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg mb-1">Email</h4>
                  <p className="text-gray-300 text-base">tresgenpadel@hotmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
