'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Star, Calendar, MapPin, Phone, Mail, Zap, Trophy, Clock, Lock, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function EntrenamientosGrupalesPage() {
  const [selectedImage, setSelectedImage] = useState(0)
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(true)
  const { toast } = useToast()
  
  // Contraseña aleatoria generada
  const correctPassword = 'PADEL2025'
  
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

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (password === correctPassword) {
      setIsAuthenticated(true)
      setShowPasswordForm(false)
      toast({
        title: "¡Acceso concedido!",
        description: "Bienvenido al sistema de reservas de entrenamientos grupales.",
        variant: "default",
      })
    } else {
      toast({
        title: "Contraseña incorrecta",
        description: "Por favor, contacta con nosotros para obtener acceso.",
        variant: "destructive",
      })
    }
  }

  const requestAccess = () => {
    const message = 'Hola! Me interesa inscribirme en los entrenamientos grupales. ¿Podrían proporcionarme la contraseña de acceso?'
    const whatsappUrl = `https://wa.me/5491135921988?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Solo cargar el script cuando el usuario esté autenticado
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')
      
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://assets.calendly.com/assets/external/widget.js'
        script.async = true
        document.head.appendChild(script)
      }
    }
  }, [isAuthenticated])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-3 sm:gap-6 lg:gap-4">
            <Link href="/sede-olleros">
              <Button variant="ghost" size="sm" className="text-white hover:text-[#E2FF1B] hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                <span className="text-[#E2FF1B]">Entrenamientos</span> Grupales
              </h1>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl font-medium">Entrenamiento en grupo con profesores</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Horarios Section */}
        <div className="max-w-6xl mx-auto mb-16">
          
          {/* Información de Horarios - Tarjetas flotantes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Ubicación */}
              <div className="group flex">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-[#E2FF1B]/50 transition-all duration-300 hover:bg-black/60 flex flex-col w-full">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#E2FF1B]/20 rounded-full mx-auto mb-4 group-hover:bg-[#E2FF1B]/30 transition-colors">
                    <MapPin className="w-6 h-6 text-[#E2FF1B]" />
                  </div>
                  <h3 className="text-lg font-bold text-white text-center mb-2">Ubicación</h3>
                  <p className="text-gray-300 text-center text-sm leading-relaxed flex-grow">
                    Av. Olleros 1515<br />
                    Palermo, CABA
                  </p>
                </div>
              </div>
              
              {/* Días */}
              <div className="group flex">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-[#E2FF1B]/50 transition-all duration-300 hover:bg-black/60 flex flex-col w-full">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#E2FF1B]/20 rounded-full mx-auto mb-4 group-hover:bg-[#E2FF1B]/30 transition-colors">
                    <Calendar className="w-6 h-6 text-[#E2FF1B]" />
                  </div>
                  <h3 className="text-lg font-bold text-white text-center">Días</h3>
                  <div className="flex-grow flex flex-col justify-center">
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="bg-[#E2FF1B]/20 text-[#E2FF1B] px-3 py-1 rounded-full text-xs font-medium">Martes</span>
                      <span className="bg-[#E2FF1B]/20 text-[#E2FF1B] px-3 py-1 rounded-full text-xs font-medium">Miércoles</span>
                      <span className="bg-[#E2FF1B]/20 text-[#E2FF1B] px-3 py-1 rounded-full text-xs font-medium">Viernes</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Horarios */}
              <div className="group flex">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-[#E2FF1B]/50 transition-all duration-300 hover:bg-black/60 flex flex-col w-full">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#E2FF1B]/20 rounded-full mx-auto mb-4 group-hover:bg-[#E2FF1B]/30 transition-colors">
                    <Clock className="w-6 h-6 text-[#E2FF1B]" />
                  </div>
                  <h3 className="text-lg font-bold text-white text-center mb-2">Horarios</h3>
                  <div className="flex-grow flex flex-col justify-center">
                    <div className="text-center">
                      <p className="text-white text-lg font-bold mb-2">12:00 - 16:00 hs</p>
                      <span className="inline-flex items-center gap-1 bg-[#E2FF1B]/20 text-[#E2FF1B] px-3 py-1 rounded-full text-xs font-medium">
                        <Zap className="w-3 h-3" />
                        Turnos disponibles
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
          {/* Formulario de contraseña */}
          {showPasswordForm && (
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-[#E2FF1B]/20 rounded-full mx-auto mb-6">
                  <Lock className="w-8 h-8 text-[#E2FF1B]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Acceso a Reservas</h3>
                <p className="text-gray-300 mb-6">
                  Para acceder al sistema de reservas, necesitas una contraseña de acceso.
                </p>
                
                <form onSubmit={handlePasswordSubmit} className="max-w-md mx-auto">
                  <div className="mb-6">
                    <Input
                      type="password"
                      placeholder="Ingresa la contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#E2FF1B] focus:ring-[#E2FF1B]/20"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      type="submit"
                      className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 font-bold"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Acceder
                    </Button>
                    
                    <Button 
                      type="button"
                      onClick={requestAccess}
                      variant="outline"
                      className="border-[#E2FF1B]/50 text-[#E2FF1B] hover:bg-[#E2FF1B]/10 font-bold"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Solicitar Acceso
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Widget de Calendly - Solo visible después de autenticación */}
          {isAuthenticated && (
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-[#E2FF1B]/20">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-[#E2FF1B] mb-2">Sistema de Reservas</h3>
                <p className="text-gray-300 text-sm">Selecciona tu horario preferido para entrenamientos grupales</p>
              </div>
              <div 
                id="calendly-widget"
                className="calendly-inline-widget" 
                data-url="https://calendly.com/3gen?hide_landing_page_details=1&hide_gdpr_banner=1" 
                style={{minWidth: '320px', height: '700px'}}
              ></div>
            </div>
          )}
        </div>

        {/* Información adicional sobre entrenamientos grupales */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-[#E2FF1B]/10 to-transparent p-6 md:p-8 rounded-2xl border border-[#E2FF1B]/20">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 text-[#E2FF1B]">
                <Trophy className="w-5 h-5 md:w-6 md:h-6 inline mr-2" />
                Entrenamientos Grupales
              </h3>
              <p className="text-sm md:text-lg text-gray-300 leading-relaxed mb-6">
                Nuestros entrenamientos grupales están diseñados para mejorar tu técnica y juego en compañía de otros jugadores. 
                Perfectos para aprender, practicar y divertirte mientras mejorás tu nivel de pádel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sede-olleros/clases-privadas">
                  <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm py-3 px-6 font-bold transition-all duration-300 hover:scale-105">
                    <Trophy className="w-4 h-4 mr-2" />
                    Clases Privadas
                  </Button>
                </Link>
                <Button 
                  onClick={() => openWhatsApp('Hola! Me interesa información sobre los entrenamientos grupales. ¿Podrían darme más detalles?')}
                  variant="outline"
                  className="border-[#E2FF1B]/50 text-[#E2FF1B] hover:bg-[#E2FF1B]/10 text-sm py-3 px-6 font-bold transition-all duration-300"
                >
                  Más Información
                </Button>
              </div>
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
