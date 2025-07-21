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
          ),
          titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            dni,
            ranking_puntos
          ),
          titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            dni,
            ranking_puntos
          ),
          suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            dni,
            ranking_puntos
          ),
          suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            dni,
            ranking_puntos
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Procesar los datos para usar información de la tabla usuarios
      const inscripcionProcesada = {
        ...data,
        // Usar datos de la tabla usuarios si están disponibles, sino usar los campos directos
        titular_1_nombre: data.titular_1?.nombre || data.titular_1_nombre || 'N/A',
        titular_1_apellido: data.titular_1?.apellido || data.titular_1_apellido || '',
        titular_1_email: data.titular_1?.email || data.titular_1_email || 'N/A',
        titular_1_telefono: data.titular_1?.telefono || 'N/A',
        titular_1_ranking: data.titular_1?.ranking_puntos || 0,
        
        titular_2_nombre: data.titular_2?.nombre || data.titular_2_nombre || 'N/A',
        titular_2_apellido: data.titular_2?.apellido || data.titular_2_apellido || '',
        titular_2_email: data.titular_2?.email || data.titular_2_email || 'N/A',
        titular_2_telefono: data.titular_2?.telefono || 'N/A',
        titular_2_ranking: data.titular_2?.ranking_puntos || 0,
        
        suplente_1_nombre: data.suplente_1?.nombre || data.suplente_1_nombre || 'N/A',
        suplente_1_apellido: data.suplente_1?.apellido || data.suplente_1_apellido || '',
        suplente_1_email: data.suplente_1?.email || data.suplente_1_email || 'N/A',
        suplente_1_telefono: data.suplente_1?.telefono || 'N/A',
        suplente_1_ranking: data.suplente_1?.ranking_puntos || 0,
        
        suplente_2_nombre: data.suplente_2?.nombre || data.suplente_2_nombre || 'N/A',
        suplente_2_apellido: data.suplente_2?.apellido || data.suplente_2_apellido || '',
        suplente_2_email: data.suplente_2?.email || data.suplente_2_email || 'N/A',
        suplente_2_telefono: data.suplente_2?.telefono || 'N/A',
        suplente_2_ranking: data.suplente_2?.ranking_puntos || 0
      }

      setInscripcion(inscripcionProcesada)
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
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href="/admin/inscripciones-ligas">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="text-left">
              <h1 className="text-xl sm:text-3xl font-bold text-white">Detalle de Inscripción</h1>
              <p className="text-gray-400 text-sm sm:text-base">Información completa de la inscripción #{inscripcion.id}</p>
            </div>
          </div>
          <div className="md:hidden justify-start flex sm:justify-end">
            <Badge className={`${getEstadoColor(inscripcion.estado)} text-white text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2`}>
              {getEstadoText(inscripcion.estado)}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-2 lg:gap-4">
          {/* Información Principal */}
          <div className="flex-1 space-y-2 sm:space-y-4">
            {/* Información de la Liga */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-xl">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Información de la Liga
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="text-left">
                    <h4 className="font-semibold text-white text-sm sm:text-lg">{liga?.nombre}</h4>
                    <p className="text-gray-300 text-sm sm:text-base">{categoria?.categoria}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-400">Fecha de inicio</p>
                    <p className="font-medium text-white text-sm sm:text-base">{formatDate(liga?.fecha_inicio)}</p>
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
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-xl">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Información del Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-6">
                {/* Titulares */}
                <div>
                  <h4 className="font-semibold text-white mb-2 sm:mb-3 text-left">Jugadores Titulares</h4>
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <p className="font-medium text-blue-300 text-left">Titular 1</p>
                        <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs self-start sm:self-auto">
                          {inscripcion.titular_1_ranking > 0 ? `${inscripcion.titular_1_ranking} pts` : 'Sin puntos'}
                        </Badge>
                      </div>
                      <p className="text-blue-200 font-semibold mb-1 text-left">
                        {inscripcion.titular_1_nombre} {inscripcion.titular_1_apellido}
                      </p>
                      <div className="space-y-1 text-xs text-blue-300 text-left">
                        <p>{inscripcion.titular_1_email}</p>
                        {inscripcion.titular_1_telefono !== 'N/A' && (
                          <p>📞 {inscripcion.titular_1_telefono}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <p className="font-medium text-blue-300 text-left">Titular 2</p>
                        <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs self-start sm:self-auto">
                          {inscripcion.titular_2_ranking > 0 ? `${inscripcion.titular_2_ranking} pts` : 'Sin puntos'}
                        </Badge>
                      </div>
                      <p className="text-blue-200 font-semibold mb-1 text-left">
                        {inscripcion.titular_2_nombre} {inscripcion.titular_2_apellido}
                      </p>
                      <div className="space-y-1 text-xs text-blue-300 text-left">
                        <p>{inscripcion.titular_2_email}</p>
                        {inscripcion.titular_2_telefono !== 'N/A' && (
                          <p>📞 {inscripcion.titular_2_telefono}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suplentes */}
                <div>
                  <h4 className="font-semibold text-white mb-2 sm:mb-3 text-left">Jugadores Suplentes</h4>
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <p className="font-medium text-green-300 text-left">Suplente 1</p>
                        <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs self-start sm:self-auto">
                          {inscripcion.suplente_1_ranking > 0 ? `${inscripcion.suplente_1_ranking} pts` : 'Sin puntos'}
                        </Badge>
                      </div>
                      <p className="text-green-200 font-semibold mb-1 text-left">
                        {inscripcion.suplente_1_nombre} {inscripcion.suplente_1_apellido}
                      </p>
                      <div className="space-y-1 text-xs text-green-300 text-left">
                        <p>{inscripcion.suplente_1_email}</p>
                        {inscripcion.suplente_1_telefono !== 'N/A' && (
                          <p>📞 {inscripcion.suplente_1_telefono}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <p className="font-medium text-green-300 text-left">Suplente 2</p>
                        <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs self-start sm:self-auto">
                          {inscripcion.suplente_2_ranking > 0 ? `${inscripcion.suplente_2_ranking} pts` : 'Sin puntos'}
                        </Badge>
                      </div>
                      <p className="text-green-200 font-semibold mb-1 text-left">
                        {inscripcion.suplente_2_nombre} {inscripcion.suplente_2_apellido}
                      </p>
                      <div className="space-y-1 text-xs text-green-300 text-left">
                        <p>{inscripcion.suplente_2_email}</p>
                        {inscripcion.suplente_2_telefono !== 'N/A' && (
                          <p>📞 {inscripcion.suplente_2_telefono}</p>
                        )}
                      </div>
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
                    <h4 className="font-semibold text-white mb-2 text-left">Aclaraciones</h4>
                    <p className="text-gray-300 bg-white/5 border border-white/10 p-3 rounded-lg text-left">
                      {inscripcion.aclaraciones}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comprobante de Pago */}
            {inscripcion.comprobante_url && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="flex items-center gap-2 text-white text-base sm:text-xl">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    Comprobante de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-left">
                      <p className="text-sm text-gray-300">
                        Archivo: {inscripcion.comprobante_filename || 'comprobante.pdf'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Subido el {formatDate(inscripcion.created_at)}
                      </p>
                    </div>
                    <Button onClick={downloadComprobante} variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel Lateral */}
          <div className="flex flex-col gap-2 sm:gap-4 w-full lg:w-80">
            {/* Estado y Acciones */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="p-2 sm:p-4">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-xl">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Estado y Acciones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 space-y-2 sm:space-y-4">
                {/* Estado Actual */}
                <div className="text-center">
                  <div className="mb-2 sm:mb-3">
                    <Badge className={`${getEstadoColor(inscripcion.estado)} text-white text-sm sm:text-lg px-3 py-2 sm:px-6 sm:py-3 font-semibold`}>
                      {getEstadoText(inscripcion.estado)}
                    </Badge>
                  </div>
                  
                  {/* Indicador visual del estado */}
                  <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                      inscripcion.estado === 'aprobada' ? 'bg-green-500' : 
                      inscripcion.estado === 'pendiente' ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-400">
                      {inscripcion.estado === 'aprobada' ? 'Inscripción confirmada' : 
                       inscripcion.estado === 'pendiente' ? 'En revisión' : 
                       'Inscripción rechazada'}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Acciones */}
                <div className="space-y-1 sm:space-y-2">
                  
                  {/* Botón Aprobar */}
                  <Button 
                    onClick={() => updateEstado('aprobada')} 
                    disabled={updating || inscripcion.estado === 'aprobada'}
                    className={`w-full h-10 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-200 ${
                      inscripcion.estado === 'aprobada' 
                        ? 'bg-green-600/50 text-green-200 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 hover:scale-[1.02]'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    {inscripcion.estado === 'aprobada' ? 'Aprobada' : 'Aprobar'}
                  </Button>
                  
                  {/* Botón Pendiente */}
                  <Button 
                    onClick={() => updateEstado('pendiente')} 
                    disabled={updating || inscripcion.estado === 'pendiente'}
                    className={`w-full h-10 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-200 ${
                      inscripcion.estado === 'pendiente' 
                        ? 'bg-yellow-600/50 text-yellow-200 cursor-not-allowed' 
                        : 'bg-yellow-600 hover:bg-yellow-700 hover:scale-[1.02]'
                    }`}
                  >
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    {inscripcion.estado === 'pendiente' ? 'Pendiente' : 'Pendiente'}
                  </Button>
                  
                  {/* Botón Rechazar */}
                  <Button 
                    onClick={() => updateEstado('rechazada')} 
                    disabled={updating || inscripcion.estado === 'rechazada'}
                    className={`w-full h-10 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-200 ${
                      inscripcion.estado === 'rechazada' 
                        ? 'bg-red-600/50 text-red-200 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 hover:scale-[1.02]'
                    }`}
                  >
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    {inscripcion.estado === 'rechazada' ? 'Rechazada' : 'Rechazar'}
                  </Button>
                </div>

                {/* Información adicional */}
                <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-xs text-gray-400 text-center">
                    💡 <strong>Tip:</strong> Los cambios de estado se aplican inmediatamente y se notifican al equipo.
                  </p>
                </div>
              </CardContent>
            </Card>

                            {/* Información Adicional */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="p-2 sm:p-4">
                    <CardTitle className="text-white text-base sm:text-xl">Información Adicional</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4 space-y-2">
                    <div className="text-left">
                      <p className="text-sm text-gray-400">Fecha de inscripción</p>
                      <p className="font-medium text-white text-sm sm:text-base">{formatDate(inscripcion.created_at)}</p>
                    </div>
                    
                    <div className="text-left">
                      <p className="text-sm text-gray-400">Cupos en categoría</p>
                      <p className="font-medium text-white text-sm sm:text-base">
                        {categoria?.max_inscripciones || 0} cupos máximos
                      </p>
                    </div>

                    {liga?.horarios && (
                      <div className="text-left">
                        <p className="text-sm text-gray-400">Horarios</p>
                        <div className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: liga.horarios }} />
                      </div>
                    )}

                    {liga?.cronograma && (
                      <div className="text-left">
                        <p className="text-sm text-gray-400">Cronograma</p>
                        <div className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: liga.cronograma }} />
                      </div>
                    )}
                  </CardContent>
                </Card>

            {/* Información Importante */}
            {liga?.importante && (
              <Card className="border-red-500/20 bg-red-500/10">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="flex items-center gap-2 text-red-400 text-base sm:text-xl">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Importante
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="text-sm text-red-300 text-left" dangerouslySetInnerHTML={{ __html: liga.importante }} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 