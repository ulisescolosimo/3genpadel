"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Calendar, 
  Trophy, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Users,
  MapPin,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AdminInscripcionDetallePage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [inscripcion, setInscripcion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) {
      fetchInscripcion()
    }
  }, [id])

  const fetchInscripcion = async () => {
    try {
      const { data, error } = await supabase
        .from('ligainscripciones')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            max_inscripciones,
            ligas (
              id,
              nombre,
              fecha_inicio,
              formato,
              horarios,
              costo_inscripcion,
              costo_partido,
              descripcion,
              cronograma,
              importante
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setInscripcion(data)
    } catch (error) {
      console.error('Error fetching inscripcion:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la inscripción",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateEstado = async (nuevoEstado) => {
    try {
      setUpdating(true)
      
      const { error } = await supabase
        .from('ligainscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: `Inscripción ${nuevoEstado} exitosamente`,
        variant: "default"
      })

      fetchInscripcion()
    } catch (error) {
      console.error('Error updating estado:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const downloadComprobante = async () => {
    if (!inscripcion?.comprobante_url) return

    try {
      const response = await fetch(inscripcion.comprobante_url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = inscripcion.comprobante_filename || 'comprobante.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast({
        title: "Descarga iniciada",
        description: "El archivo se está descargando",
        variant: "default"
      })
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo",
        variant: "destructive"
      })
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada': return 'bg-green-500'
      case 'pendiente': return 'bg-yellow-500'
      case 'rechazada': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'aprobada': return 'Aprobada'
      case 'pendiente': return 'Pendiente'
      case 'rechazada': return 'Rechazada'
      default: return 'Desconocido'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Cargando inscripción...</p>
        </div>
      </div>
    )
  }

  if (!inscripcion) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Inscripción no encontrada</h3>
          <p className="text-gray-400 mb-6">La inscripción que buscas no existe o ha sido eliminada</p>
          <Link href="/admin/inscripciones-ligas">
            <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
              Volver a Inscripciones
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const liga = inscripcion.liga_categorias?.ligas
  const categoria = inscripcion.liga_categorias

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/inscripciones-ligas">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Detalle de Inscripción</h1>
              <p className="text-gray-400">Información completa de la inscripción #{inscripcion.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getEstadoColor(inscripcion.estado)} text-white`}>
              {getEstadoText(inscripcion.estado)}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información de la Liga */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="w-5 h-5 text-[#E2FF1B]" />
                  Información de la Liga
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white">{liga?.nombre}</h4>
                    <p className="text-gray-300">{categoria?.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Fecha de inicio</p>
                    <p className="font-medium text-white">{formatDate(liga?.fecha_inicio)}</p>
                  </div>
                </div>
                
                {liga?.formato && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Formato: {liga.formato}</span>
                  </div>
                )}
                
                {liga?.costo_inscripcion && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      Costo inscripción: ${liga.costo_inscripcion.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Equipo */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-[#E2FF1B]" />
                  Información del Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Titulares */}
                <div>
                  <h4 className="font-semibold text-white mb-3">Jugadores Titulares</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="font-medium text-blue-300">Titular 1</p>
                      <p className="text-blue-200">
                        {inscripcion.titular_1_nombre} {inscripcion.titular_1_apellido}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="font-medium text-blue-300">Titular 2</p>
                      <p className="text-blue-200">
                        {inscripcion.titular_2_nombre} {inscripcion.titular_2_apellido}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Suplentes */}
                <div>
                  <h4 className="font-semibold text-white mb-3">Jugadores Suplentes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="font-medium text-green-300">Suplente 1</p>
                      <p className="text-green-200">
                        {inscripcion.suplente_1_nombre} {inscripcion.suplente_1_apellido}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="font-medium text-green-300">Suplente 2</p>
                      <p className="text-green-200">
                        {inscripcion.suplente_2_nombre} {inscripcion.suplente_2_apellido}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    Contacto: {inscripcion.contacto_celular}
                  </span>
                </div>

                {/* Aclaraciones */}
                {inscripcion.aclaraciones && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Aclaraciones</h4>
                    <p className="text-gray-300 bg-white/5 border border-white/10 p-3 rounded-lg">
                      {inscripcion.aclaraciones}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comprobante de Pago */}
            {inscripcion.comprobante_url && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="w-5 h-5 text-[#E2FF1B]" />
                    Comprobante de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">
                        Archivo: {inscripcion.comprobante_filename || 'comprobante.pdf'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Subido el {formatDate(inscripcion.created_at)}
                      </p>
                    </div>
                    <Button onClick={downloadComprobante} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Estado y Acciones */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Estado y Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge className={`${getEstadoColor(inscripcion.estado)} text-white text-lg px-4 py-2`}>
                    {getEstadoText(inscripcion.estado)}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button 
                    onClick={() => updateEstado('aprobada')} 
                    disabled={updating || inscripcion.estado === 'aprobada'}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprobar
                  </Button>
                  
                  <Button 
                    onClick={() => updateEstado('pendiente')} 
                    disabled={updating || inscripcion.estado === 'pendiente'}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pendiente
                  </Button>
                  
                  <Button 
                    onClick={() => updateEstado('rechazada')} 
                    disabled={updating || inscripcion.estado === 'rechazada'}
                    variant="outline"
                    className="w-full text-red-400 border-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Información Adicional */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Información Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Fecha de inscripción</p>
                  <p className="font-medium text-white">{formatDate(inscripcion.created_at)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Cupos en categoría</p>
                  <p className="font-medium text-white">
                    {categoria?.max_inscripciones || 0} cupos máximos
                  </p>
                </div>

                {liga?.horarios && (
                  <div>
                    <p className="text-sm text-gray-400">Horarios</p>
                    <div className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: liga.horarios }} />
                  </div>
                )}

                {liga?.cronograma && (
                  <div>
                    <p className="text-sm text-gray-400">Cronograma</p>
                    <div className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: liga.cronograma }} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información Importante */}
            {liga?.importante && (
              <Card className="border-red-500/20 bg-red-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    Importante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-red-300" dangerouslySetInnerHTML={{ __html: liga.importante }} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 