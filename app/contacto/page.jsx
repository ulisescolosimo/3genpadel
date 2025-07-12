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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#E2FF1B]/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Contáctanos
            </h1>
            <p className="text-xl text-gray-400">
              ¿Tienes alguna pregunta o sugerencia? Estamos aquí para ayudarte.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Información de Contacto y Horario en la misma fila */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información de Contacto */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#E2FF1B] mt-1" />
                  <div>
                    <p className="text-white font-medium">Dirección</p>
                    <a 
                      href="https://g.co/kgs/FFU53qm" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#E2FF1B] transition-colors"
                    >
                      Delgado 864, Colegiales, CABA
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#E2FF1B] mt-1" />
                  <div>
                    <p className="text-white font-medium">Teléfono</p>
                    <div className="space-y-1">
                      <a 
                        href="https://wa.me/5491135921988" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-gray-400 hover:text-[#E2FF1B] transition-colors"
                      >
                        +54 9 11 3592-1988
                      </a>
                      <a 
                        href="https://wa.me/5491149285316" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-gray-400 hover:text-[#E2FF1B] transition-colors"
                      >
                        +54 9 11 4928-5316
                      </a>
                      <a 
                        href="https://wa.me/5491132673029" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-gray-400 hover:text-[#E2FF1B] transition-colors"
                      >
                        +54 9 11 3267-3029
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#E2FF1B] mt-1" />
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <a 
                      href="mailto:info@lanormanda.com" 
                      className="text-gray-400 hover:text-[#E2FF1B] transition-colors"
                    >
                      info@lanormanda.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Horario de Atención */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Horario de Atención</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Lunes a Viernes</span>
                  <span className="text-white">7:00 - 23:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sábados</span>
                  <span className="text-white">8:00 - 22:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Domingos</span>
                  <span className="text-white">8:00 - 20:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario y Mapa en la misma fila */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario de Contacto */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Envíanos un Mensaje</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Mensaje</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="min-h-[150px] bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    placeholder="¿En qué podemos ayudarte?"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </div>
                  ) : (
                    'Enviar Mensaje'
                  )}
                </Button>
              </form>
            </div>

            {/* Mapa */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden h-full">
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
  )
} 