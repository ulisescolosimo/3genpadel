'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Star, Calendar, MapPin, Phone, Mail, Zap, Trophy, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SedeOllerosPage() {
  const [selectedImage, setSelectedImage] = useState(0)
  
  const images = [
    '305a8f1b-2a44-4ca8-a685-cbb3b8d2f8c0.JPG',
    '5b30f465-a449-4849-8f01-2edc6f680395.JPG',
    '5d681fda-92a2-4e30-aeb2-5d218dda6b0a.JPG',
    '605d63a1-554b-4e2b-8d00-31c945dda5a9.JPG',
    '67bf875f-af56-4279-a994-61a2fa6fb3e9.JPG',
    '6a1e4c11-ef21-4f12-b2f1-f53aa1105848.JPG',
    '88bc2c70-c85c-48aa-8813-19c289146082.JPG',
    '8ff124ca-dadc-4de3-95fb-3c1f6aedcca6.JPG',
    'a2bc5341-2e6e-4345-82be-ef6bb48936b0.JPG',
    'b75656ae-ba9d-4839-8be3-cdfec7684fd7.JPG',
    'd22c29d8-4262-4ed4-bdab-d1780cccd3dc.JPG',
    'e530bae5-e8d6-47ff-a98e-2aa46d51120c.JPG',
    'ebef0cdf-cfee-49af-bc78-d7a2f5078534.JPG',
    'f18dfe07-fc7f-4d38-bed4-a508b7c92b2b.JPG',
    'IMG_8842.jpg',
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

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Introducción Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#E2FF1B]/20 rounded-full border border-[#E2FF1B]/30 mb-6">
              <MapPin className="w-5 h-5 text-[#E2FF1B]" />
              <span className="text-[#E2FF1B] font-semibold text-sm tracking-wider">Olleros 1515</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
              <span className="text-[#E2FF1B]">Sede</span> Olleros
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Nuestra sede principal ubicada en Palermo, donde podés disfrutar de clases grupales y clases privadas con profesionales de primera división
            </p>
          </div>
        </div>

        {/* Servicios Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-white">
              <span className="text-[#E2FF1B]">Nuestros</span> Servicios
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Ofrecemos diferentes modalidades de entrenamiento para adaptarnos a tus necesidades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#E2FF1B]/20 rounded-2xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-[#E2FF1B]" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-[#E2FF1B] mb-2">Clases Grupales</CardTitle>
                <CardDescription className="text-white font-medium mb-3">Aprende en equipo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-center leading-relaxed text-base">
                  Entrenamientos diseñados para mejorar tu técnica y juego en compañía de otros jugadores. 
                  Perfectos para aprender, practicar y divertirte.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white text-sm">Horarios:</h4>
                  <ul className="space-y-1">
                    <li className="flex items-start text-gray-300 text-xs">
                      <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                      Martes, Miércoles y Viernes
                    </li>
                    <li className="flex items-start text-gray-300 text-xs">
                      <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                      12:00 a 16:00 hs
                    </li>
                  </ul>
                </div>
                <div className="pt-2">
                  <Link href="/sede-olleros/clases-grupales">
                    <Button className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm py-3 font-bold transition-all duration-300 hover:scale-105">
                      Ver Clases Grupales
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Clases Privadas */}
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#E2FF1B]/20 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-[#E2FF1B]" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-[#E2FF1B] mb-2">Clases Profesionales</CardTitle>
                <CardDescription className="text-white font-medium mb-3">Entrenamiento personalizado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-center leading-relaxed text-base">
                  Clases personalizadas con nuestros Head Coaches profesionales de primera división. 
                  Stefano Lorenzo e Ignacio Begher te ayudarán a mejorar tu juego.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white text-sm">Entrenadores:</h4>
                  <ul className="space-y-1">
                    <li className="flex items-start text-gray-300 text-xs">
                      <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                      Stefano Lorenzo - Ranking Nº 99 Argentina
                    </li>
                    <li className="flex items-start text-gray-300 text-xs">
                      <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                      Ignacio Begher - Ranking Nº 97 Argentina
                    </li>
                  </ul>
                </div>
                <div className="pt-2">
                  <Link href="/sede-olleros/clases-profesionales">
                    <Button className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm py-3 font-bold transition-all duration-300 hover:scale-105">
                      Ver Clases Profesionales
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contacto Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-white">
              <MapPin className="w-6 h-6 md:w-8 md:h-8 inline mr-2 text-[#E2FF1B]" />
              Contacto y Ubicación
            </h2>
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
              {/* Dirección - Click para abrir Google Maps */}
              <a 
                href="https://www.google.com/maps?q=Av.+Olleros+1515,+Palermo,+CABA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-6 bg-white/5 rounded-lg w-full hover:bg-white/10 hover:border-[#E2FF1B]/30 border border-transparent transition-all duration-300 group cursor-pointer"
              >
                <div className="w-12 h-12 bg-[#E2FF1B]/20 rounded-lg flex items-center justify-center group-hover:bg-[#E2FF1B]/30 transition-colors">
                  <MapPin className="w-6 h-6 text-[#E2FF1B] flex-shrink-0" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg mb-1 group-hover:text-[#E2FF1B] transition-colors">Dirección</h4>
                  <p className="text-gray-300 text-base group-hover:text-white transition-colors">Av. Olleros 1515, Palermo, CABA</p>
                </div>
              </a>
              
              {/* Teléfono - Click para llamar */}
              <a 
                href="tel:+5491167617557"
                className="flex items-center gap-3 p-6 bg-white/5 rounded-lg w-full hover:bg-white/10 hover:border-[#E2FF1B]/30 border border-transparent transition-all duration-300 group cursor-pointer"
              >
                <div className="w-12 h-12 bg-[#E2FF1B]/20 rounded-lg flex items-center justify-center group-hover:bg-[#E2FF1B]/30 transition-colors">
                  <Phone className="w-6 h-6 text-[#E2FF1B] flex-shrink-0" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg mb-1 group-hover:text-[#E2FF1B] transition-colors">Teléfono</h4>
                  <p className="text-gray-300 text-base group-hover:text-white transition-colors">+54 9 11 6761-7557</p>
                </div>
              </a>
              
              {/* Email - Click para enviar email */}
              <a 
                href="mailto:tresgenpadel@hotmail.com"
                className="flex items-center gap-3 p-6 bg-white/5 rounded-lg w-full hover:bg-white/10 hover:border-[#E2FF1B]/30 border border-transparent transition-all duration-300 group cursor-pointer"
              >
                <div className="w-12 h-12 bg-[#E2FF1B]/20 rounded-lg flex items-center justify-center group-hover:bg-[#E2FF1B]/30 transition-colors">
                  <Mail className="w-6 h-6 text-[#E2FF1B] flex-shrink-0" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg mb-1 group-hover:text-[#E2FF1B] transition-colors">Email</h4>
                  <p className="text-gray-300 text-base group-hover:text-white transition-colors">tresgenpadel@hotmail.com</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
