"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Users, Calendar, MapPin, DollarSign, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function LigaAgosto2025Page() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    titular_1_nombre: '',
    titular_1_apellido: '',
    titular_2_nombre: '',
    titular_2_apellido: '',
    suplente_1_nombre: '',
    suplente_1_apellido: '',
    suplente_2_nombre: '',
    suplente_2_apellido: '',
    categoria: '',
    contacto_celular: '',
    aclaraciones: ''
  })
  const [comprobanteFile, setComprobanteFile] = useState(null)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 1024 * 1024 * 1024) { // 1GB
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 1GB.",
          variant: "destructive"
        })
        return
      }
      setComprobanteFile(file)
    }
  }

  const uploadFile = async (file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `comprobantes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('liga-inscripciones')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('liga-inscripciones')
        .getPublicUrl(filePath)

      return { url: publicUrl, filename: fileName }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar campos requeridos
      const requiredFields = [
        'titular_1_nombre', 'titular_1_apellido',
        'titular_2_nombre', 'titular_2_apellido',
        'suplente_1_nombre', 'suplente_1_apellido',
        'suplente_2_nombre', 'suplente_2_apellido',
        'categoria', 'contacto_celular'
      ]

      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`El campo ${field} es requerido`)
        }
      }

      if (!comprobanteFile) {
        throw new Error('Debe subir un comprobante de pago')
      }

      // Subir archivo
      const fileData = await uploadFile(comprobanteFile)

      // Guardar inscripción en la base de datos
      const { error } = await supabase
        .from('ligainscripciones')
        .insert({
          ...formData,
          comprobante_url: fileData.url,
          comprobante_filename: fileData.filename
        })

      if (error) throw error

      toast({
        title: "¡Inscripción exitosa!",
        description: "Tu inscripción ha sido enviada. Te contactaremos pronto.",
        variant: "default"
      })

      // Limpiar formulario
      setFormData({
        titular_1_nombre: '',
        titular_1_apellido: '',
        titular_2_nombre: '',
        titular_2_apellido: '',
        suplente_1_nombre: '',
        suplente_1_apellido: '',
        suplente_2_nombre: '',
        suplente_2_apellido: '',
        categoria: '',
        contacto_celular: '',
        aclaraciones: ''
      })
      setComprobanteFile(null)

    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: error.message || "Hubo un error al enviar la inscripción",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="container mx-auto">
          <Link href="/inscripciones/ligas" className="inline-flex items-center gap-2 text-[#E2FF1B] hover:text-[#E2FF1B]/80 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver a Ligas
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="text-[#E2FF1B]">Ligas Agosto 2025</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Inscripción para las ligas competitivas de agosto 2025
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Información de la Liga */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-white/10 sticky top-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-[#E2FF1B]" />
                  Información de la Liga
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="font-semibold">Inicio</p>
                      <p className="text-sm">02 de Agosto 2025</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-300">
                    <Users className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="font-semibold">Formato</p>
                      <p className="text-sm">2 partidos de clasificación + Llave eliminatoria</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="font-semibold">Horarios</p>
                      <p className="text-sm">Sábados o Domingos desde las 20hs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-300">
                    <DollarSign className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="font-semibold">Costos</p>
                      <p className="text-sm">Inscripción $20.000 por equipo</p>
                      <p className="text-sm">Partido $12.000 por jugador</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#E2FF1B]/10 border border-[#E2FF1B]/20 rounded-lg p-4">
                  <h4 className="font-semibold text-[#E2FF1B] mb-2">Cronograma Tentativo</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 02/08 o 03/08 - Primer partido de Clasificación</li>
                    <li>• 09/08 o 10/08 - Segundo partido de Clasificación</li>
                    <li>• 16/08 o 17/08 - Octavos de Final</li>
                    <li>• 23/08 o 25/08 - Cuartos de Final</li>
                    <li>• 30/08 o 31/08 - Semifinales</li>
                    <li>• 06/09 - Finales</li>
                  </ul>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Importante
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• No se puede elegir día de juego</li>
                    <li>• No se permiten postergaciones</li>
                    <li>• No hay partidos durante la semana</li>
                    <li>• Ganadores de categorías 2025 solo pueden anotarse en superior</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulario de Inscripción */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Formulario de Inscripción</CardTitle>
                <CardDescription className="text-gray-400">
                  Completa todos los campos requeridos para inscribir tu equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Titulares */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                      Titulares *
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="titular_1_nombre" className="text-white">Nombre Titular 1 *</Label>
                        <Input
                          id="titular_1_nombre"
                          value={formData.titular_1_nombre}
                          onChange={(e) => handleInputChange('titular_1_nombre', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="titular_1_apellido" className="text-white">Apellido Titular 1 *</Label>
                        <Input
                          id="titular_1_apellido"
                          value={formData.titular_1_apellido}
                          onChange={(e) => handleInputChange('titular_1_apellido', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="titular_2_nombre" className="text-white">Nombre Titular 2 *</Label>
                        <Input
                          id="titular_2_nombre"
                          value={formData.titular_2_nombre}
                          onChange={(e) => handleInputChange('titular_2_nombre', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="titular_2_apellido" className="text-white">Apellido Titular 2 *</Label>
                        <Input
                          id="titular_2_apellido"
                          value={formData.titular_2_apellido}
                          onChange={(e) => handleInputChange('titular_2_apellido', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Suplentes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                      Suplentes *
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="suplente_1_nombre" className="text-white">Nombre Suplente #1 *</Label>
                        <Input
                          id="suplente_1_nombre"
                          value={formData.suplente_1_nombre}
                          onChange={(e) => handleInputChange('suplente_1_nombre', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="suplente_1_apellido" className="text-white">Apellido Suplente #1 *</Label>
                        <Input
                          id="suplente_1_apellido"
                          value={formData.suplente_1_apellido}
                          onChange={(e) => handleInputChange('suplente_1_apellido', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="suplente_2_nombre" className="text-white">Nombre Suplente #2 *</Label>
                        <Input
                          id="suplente_2_nombre"
                          value={formData.suplente_2_nombre}
                          onChange={(e) => handleInputChange('suplente_2_nombre', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="suplente_2_apellido" className="text-white">Apellido Suplente #2 *</Label>
                        <Input
                          id="suplente_2_apellido"
                          value={formData.suplente_2_apellido}
                          onChange={(e) => handleInputChange('suplente_2_apellido', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Categoría y Contacto */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoria" className="text-white">Categoría *</Label>
                      <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)} required>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/20">
                          <SelectItem value="C6" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10">C6</SelectItem>
                          <SelectItem value="C7" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10">C7</SelectItem>
                          <SelectItem value="C8" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10">C8</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contacto_celular" className="text-white">Contacto/Celular *</Label>
                      <Input
                        id="contacto_celular"
                        type="tel"
                        value={formData.contacto_celular}
                        onChange={(e) => handleInputChange('contacto_celular', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="+54 9 11 1234-5678"
                        required
                      />
                    </div>
                  </div>

                  {/* Comprobante de Pago */}
                  <div className="space-y-2">
                    <Label htmlFor="comprobante" className="text-white">Comprobante de Inscripción (Transferencia) *</Label>
                    <div className="bg-[#E2FF1B]/10 border border-[#E2FF1B]/20 rounded-lg p-4">
                      <p className="text-sm text-[#E2FF1B] mb-2">
                        <strong>Alias:</strong> stefanolorenzo
                      </p>
                      <p className="text-xs text-gray-400 mb-4">
                        Sube 1 archivo compatible. Tamaño máximo: 1 GB.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          id="comprobante"
                          type="file"
                          onChange={handleFileChange}
                          className="bg-white/10 border-white/20 text-white file:bg-[#E2FF1B] file:text-black file:border-0 file:rounded file:px-4 file:py-2 file:cursor-pointer file:mr-4 file:font-medium hover:file:bg-[#E2FF1B]/90 transition-colors"
                          accept="image/*,.pdf,.doc,.docx"
                          required
                        />
                        {comprobanteFile && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      {comprobanteFile && (
                        <p className="text-sm text-gray-300 mt-2">
                          Archivo seleccionado: {comprobanteFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Aclaraciones */}
                  <div className="space-y-2">
                    <Label htmlFor="aclaraciones" className="text-white">Aclaraciones</Label>
                    <Textarea
                      id="aclaraciones"
                      value={formData.aclaraciones}
                      onChange={(e) => handleInputChange('aclaraciones', e.target.value)}
                      className="bg-white/10 border-white/20 text-white min-h-[100px]"
                      placeholder="Información adicional o aclaraciones sobre tu inscripción..."
                    />
                  </div>

                  {/* Botón de Envío */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors py-3 text-lg font-semibold"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Enviando inscripción...
                      </div>
                    ) : (
                      'Enviar Inscripción'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 