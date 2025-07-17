"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Users, Calendar, MapPin, DollarSign, Upload, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function LigaInscripcionPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const [liga, setLiga] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
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
    liga_categoria_id: '',
    contacto_celular: '',
    aclaraciones: ''
  })
  const [comprobanteFile, setComprobanteFile] = useState(null)

  useEffect(() => {
    if (id) {
      fetchLigaData()
    }
  }, [id])

  const fetchLigaData = async () => {
    try {
      // Obtener datos de la liga
      const { data: ligaData, error: ligaError } = await supabase
        .from('ligas')
        .select('*')
        .eq('id', id)
        .single()

      if (ligaError) throw ligaError

      // Obtener categorías de la liga con información de inscripciones
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('liga_categorias')
        .select(`
          *,
          ligainscripciones (id, estado)
        `)
        .eq('liga_id', id)

      if (categoriasError) throw categoriasError

      // Procesar categorías para incluir información de disponibilidad (solo inscripciones aprobadas)
      const categoriasProcesadas = categoriasData.map(cat => {
        const inscripcionesAprobadas = cat.ligainscripciones?.filter(ins => ins.estado === 'aprobada')?.length || 0
        return {
          ...cat,
          inscripcionesActuales: inscripcionesAprobadas,
          disponible: inscripcionesAprobadas < cat.max_inscripciones
        }
      })

      setLiga(ligaData)
      setCategorias(categoriasProcesadas)
    } catch (error) {
      console.error('Error fetching liga data:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la liga",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

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
        'liga_categoria_id', 'contacto_celular'
      ]

      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`El campo ${field} es requerido`)
        }
      }

      if (!comprobanteFile) {
        throw new Error('Debe subir un comprobante de pago')
      }

      // Verificar que la categoría aún esté disponible
      const categoriaSeleccionada = categorias.find(cat => cat.id === parseInt(formData.liga_categoria_id))
      if (!categoriaSeleccionada || !categoriaSeleccionada.disponible) {
        throw new Error('La categoría seleccionada ya no está disponible')
      }

      // Subir archivo
      const fileData = await uploadFile(comprobanteFile)

      // Guardar inscripción en la base de datos
      const { error } = await supabase
        .from('ligainscripciones')
        .insert({
          liga_categoria_id: parseInt(formData.liga_categoria_id),
          titular_1_nombre: formData.titular_1_nombre,
          titular_1_apellido: formData.titular_1_apellido,
          titular_2_nombre: formData.titular_2_nombre,
          titular_2_apellido: formData.titular_2_apellido,
          suplente_1_nombre: formData.suplente_1_nombre,
          suplente_1_apellido: formData.suplente_1_apellido,
          suplente_2_nombre: formData.suplente_2_nombre,
          suplente_2_apellido: formData.suplente_2_apellido,
          contacto_celular: formData.contacto_celular,
          aclaraciones: formData.aclaraciones,
          comprobante_url: fileData.url,
          comprobante_filename: fileData.filename
        })

      if (error) {
        if (error.message.includes('máximo')) {
          throw new Error('Esta categoría ya alcanzó el máximo de inscripciones permitidas')
        }
        throw error
      }

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
        liga_categoria_id: '',
        contacto_celular: '',
        aclaraciones: ''
      })
      setComprobanteFile(null)

      // Recargar datos para actualizar contadores
      await fetchLigaData()

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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatText = (text) => {
    if (!text) return ''
    // Convertir \n literales a saltos de línea reales
    return text.replace(/\\n/g, '\n')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Cargando información de la liga...</p>
        </div>
      </div>
    )
  }

  if (!liga) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Liga no encontrada</h3>
          <p className="text-gray-400 mb-6">La liga que buscas no existe o ha sido eliminada</p>
          <Link href="/inscripciones/ligas">
            <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
              Volver a Ligas
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const ligaDisponible = liga.estado === 'abierta' && categorias.some(cat => cat.disponible)

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
              <span className="text-[#E2FF1B]">{liga.nombre}</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {liga.descripcion}
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
                      <p className="text-sm">{formatDate(liga.fecha_inicio)}</p>
                    </div>
                  </div>
                  
                  {liga.formato && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Users className="w-5 h-5 text-[#E2FF1B]" />
                      <div>
                        <p className="font-semibold">Formato</p>
                        <p className="text-sm">{liga.formato}</p>
                      </div>
                    </div>
                  )}
                  
                  {liga.horarios && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Clock className="w-5 h-5 text-[#E2FF1B]" />
                      <div>
                        <p className="font-semibold">Horarios</p>
                        <p className="text-sm">{liga.horarios}</p>
                      </div>
                    </div>
                  )}
                  
                  {liga.costo_inscripcion && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <DollarSign className="w-5 h-5 text-[#E2FF1B]" />
                      <div>
                        <p className="font-semibold">Costos</p>
                        <p className="text-sm">Inscripción ${liga.costo_inscripcion.toLocaleString()} por equipo</p>
                        {liga.costo_partido && (
                          <p className="text-sm">Partido ${liga.costo_partido.toLocaleString()} por jugador</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Categorías Disponibles */}
                <div className="bg-[#E2FF1B]/10 border border-[#E2FF1B]/20 rounded-lg p-4">
                  <h4 className="font-semibold text-[#E2FF1B] mb-3">Categorías Disponibles</h4>
                  <div className="space-y-2">
                    {categorias.map((categoria) => (
                      <div key={categoria.id} className="flex justify-between items-center text-sm">
                        <span className="text-white font-medium">{categoria.categoria}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300">
                            {categoria.inscripcionesActuales}/{categoria.max_inscripciones}
                          </span>
                          <Badge 
                            variant={categoria.disponible ? 'default' : 'secondary'}
                            className={categoria.disponible ? 'bg-green-500' : 'bg-red-500'}
                          >
                            {categoria.disponible ? 'Disponible' : 'Completa'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {liga.cronograma && (
                  <div className="bg-[#E2FF1B]/10 border border-[#E2FF1B]/20 rounded-lg p-4">
                    <h4 className="font-semibold text-[#E2FF1B] mb-2">Cronograma</h4>
                    <div className="text-sm text-gray-300 whitespace-pre-line">
                      {formatText(liga.cronograma)}
                    </div>
                  </div>
                )}

                {liga.importante && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Importante
                    </h4>
                    <div className="text-sm text-gray-300 whitespace-pre-line">
                      {formatText(liga.importante)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulario de Inscripción */}
          <div className="lg:col-span-2">
            {!ligaDisponible ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {liga.estado === 'cerrada' ? 'Inscripciones Cerradas' : 'Todas las Categorías Completas'}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {liga.estado === 'cerrada' 
                      ? 'Las inscripciones para esta liga han sido cerradas.'
                      : 'Todas las categorías de esta liga han alcanzado su cupo máximo.'
                    }
                  </p>
                  <Link href="/inscripciones/ligas">
                    <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                      Ver Otras Ligas
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
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
                        <Select value={formData.liga_categoria_id} onValueChange={(value) => handleInputChange('liga_categoria_id', value)} required>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-white/20">
                            {categorias
                              .filter(cat => cat.disponible)
                              .map((categoria) => (
                                <SelectItem 
                                  key={categoria.id} 
                                  value={categoria.id.toString()} 
                                  className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10"
                                >
                                  {categoria.categoria} ({categoria.inscripcionesActuales}/{categoria.max_inscripciones})
                                </SelectItem>
                              ))
                            }
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 