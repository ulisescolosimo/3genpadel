'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle, Clock, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  useEffect(() => {
    // Simular carga del mapa
    const timer = setTimeout(() => setIsMapLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const validateField = (name, value) => {
    let error = ''
    switch (name) {
      case 'nombre':
        if (!value) error = 'El nombre es requerido'
        else if (value.length < 2) error = 'El nombre debe tener al menos 2 caracteres'
        break
      case 'email':
        if (!value) error = 'El email es requerido'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email inválido'
        break
      case 'asunto':
        if (!value) error = 'El asunto es requerido'
        break
      case 'mensaje':
        if (!value) error = 'El mensaje es requerido'
        else if (value.length < 10) error = 'El mensaje debe tener al menos 10 caracteres'
        break
    }
    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Validación en tiempo real
    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validación final
    const newErrors = {}
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) newErrors[key] = error
    })
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Por favor, corrige los errores en el formulario')
      return
    }

    setIsSubmitting(true)

    try {
      // Simulación de envío
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSubmitSuccess(true)
      setFormData({
        nombre: '',
        email: '',
        asunto: '',
        mensaje: ''
      })
      toast.success('¡Mensaje enviado con éxito!')
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
      toast.error('Error al enviar el mensaje. Por favor, intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E2FF1B]/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative container mx-auto px-2 sm:px-4 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Contáctanos
            </h1>
            <p className="text-lg sm:text-xl text-gray-400">
              ¿Tienes alguna pregunta o sugerencia? Estamos aquí para ayudarte.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Información de Contacto */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Información de contacto</h3>
            <div className="space-y-4 sm:space-y-6">
              {/* Horario de Atención */}
              <div className="bg-gray-800/30 rounded-lg p-3 sm:p-4">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Horario de Atención
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm sm:text-base">Lunes a Viernes</span>
                    <span className="text-white font-medium text-sm sm:text-base">8:00 - 10:00</span>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B] mt-1" />
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">Dirección</p>
                    <a 
                      href="https://g.co/kgs/FFU53qm" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#E2FF1B] transition-colors text-sm sm:text-base"
                    >
                      Delgado 864, Colegiales, CABA
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B] mt-1" />
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">Teléfono</p>
                    <div className="space-y-1">
                      <a 
                        href="https://wa.me/5491135921988" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-gray-400 hover:text-[#E2FF1B] transition-colors text-sm sm:text-base"
                      >
                        +54 9 11 3592-1988
                      </a>
                      <a 
                        href="https://wa.me/5491149285316" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-gray-400 hover:text-[#E2FF1B] transition-colors text-sm sm:text-base"
                      >
                        +54 9 11 4928-5316
                      </a>
                      <a 
                        href="https://wa.me/5491132673029" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-gray-400 hover:text-[#E2FF1B] transition-colors text-sm sm:text-base"
                      >
                        +54 9 11 3267-3029
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B] mt-1" />
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">Email</p>
                    <a 
                      href="mailto:info@lanormanda.com" 
                      className="text-gray-400 hover:text-[#E2FF1B] transition-colors text-sm sm:text-base"
                    >
                      info@lanormanda.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario y Mapa en la misma fila */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Formulario de Contacto */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E2FF1B]/20 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 sm:w-6 sm:h-6 text-[#E2FF1B]" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Envíanos un mensaje</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Estamos aquí para ayudarte</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="group">
                    <Label htmlFor="name" className="text-white font-medium mb-2 block text-sm sm:text-base">Nombre completo</Label>
                    <div className="relative">
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-[#E2FF1B] focus:ring-[#E2FF1B]/20 transition-all duration-300 h-10 sm:h-12 text-sm sm:text-base"
                        placeholder="Tu nombre completo"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 w-1 bg-[#E2FF1B] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-r-md" />
                    </div>
                  </div>
                  <div className="group">
                    <Label htmlFor="email" className="text-white font-medium mb-2 block text-sm sm:text-base">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-[#E2FF1B] focus:ring-[#E2FF1B]/20 transition-all duration-300 h-10 sm:h-12 text-sm sm:text-base"
                        placeholder="tu@email.com"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 w-1 bg-[#E2FF1B] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-r-md" />
                    </div>
                  </div>
                </div>
                
                <div className="group">
                  <Label htmlFor="message" className="text-white font-medium mb-2 block text-sm sm:text-base">Mensaje</Label>
                  <div className="relative">
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="min-h-[100px] sm:min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-[#E2FF1B] focus:ring-[#E2FF1B]/20 transition-all duration-300 resize-none text-sm sm:text-base"
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                      required
                    />
                    <div className="absolute inset-y-0 right-0 w-1 bg-[#E2FF1B] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-r-md" />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#E2FF1B] to-[#E2FF1B]/90 text-black font-semibold hover:from-[#E2FF1B]/90 hover:to-[#E2FF1B] transform hover:scale-[1.02] transition-all duration-300 h-10 sm:h-12 text-base sm:text-lg shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Enviando mensaje...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Enviar mensaje</span>
                    </div>
                  )}
                </Button>
              </form>
            </div>

            {/* Mapa */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#E2FF1B]/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-white">Ubicación</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Delgado 864, Colegiales, CABA</p>
                  </div>
                </div>
              </div>
              <div className="h-[300px] sm:h-[400px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3285.1234567890123!2d-58.4558858!3d-34.578475!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5e78893fb43%3A0xb3403f99edbe45fb!2sLa%20Normanda%20Padel%20%26%20Gym!5e0!3m2!1ses!2sar!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 