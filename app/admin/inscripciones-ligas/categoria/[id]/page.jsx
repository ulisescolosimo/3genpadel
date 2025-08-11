"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Trophy, Users, Calendar, Eye, CheckCircle, XCircle, Clock, Search, RefreshCw, ArrowLeft, User, Phone, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AdminInscripcionesCategoriaPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const [categoria, setCategoria] = useState(null)
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEstado, setFilterEstado] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) {
      fetchCategoriaData()
    }
  }, [id])

  const fetchCategoriaData = async () => {
    try {
      setRefreshing(true)
      
      // Obtener información de la categoría
      const { data: categoriaData, error: categoriaError } = await supabase
        .from('liga_categorias')
        .select(`
          *,
          ligas (
            id,
            nombre,
            fecha_inicio,
            estado
          )
        `)
        .eq('id', id)
        .single()

      if (categoriaError) throw categoriaError

      // Obtener todas las inscripciones de esta categoría
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('ligainscripciones')
        .select(`
          *,
          titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          ),
          titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          ),
          suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          ),
          suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey (
            id,
            nombre,
            apellido,
            email,
            telefono,
            ranking_puntos
          )
        `)
        .eq('liga_categoria_id', id)
        .order('created_at', { ascending: false })

      if (inscripcionesError) throw inscripcionesError

      // Procesar las inscripciones para usar información de la tabla usuarios
      const inscripcionesProcesadas = inscripcionesData.map(inscripcion => ({
        ...inscripcion,
        // Usar datos de la tabla usuarios si están disponibles, sino usar los campos directos
        titular_1_nombre: inscripcion.titular_1?.nombre || inscripcion.titular_1_nombre || 'N/A',
        titular_1_apellido: inscripcion.titular_1?.apellido || inscripcion.titular_1_apellido || '',
        titular_1_email: inscripcion.titular_1?.email || inscripcion.titular_1_email || 'N/A',
        titular_1_telefono: inscripcion.titular_1?.telefono || 'N/A',
        titular_1_ranking: 0,
        
        titular_2_nombre: inscripcion.titular_2?.nombre || inscripcion.titular_2_nombre || 'N/A',
        titular_2_apellido: inscripcion.titular_2?.apellido || inscripcion.titular_2_apellido || '',
        titular_2_email: inscripcion.titular_2?.email || inscripcion.titular_2_email || 'N/A',
        titular_2_telefono: inscripcion.titular_2?.telefono || 'N/A',
        titular_2_ranking: 0,
        
        suplente_1_nombre: inscripcion.suplente_1?.nombre || inscripcion.suplente_1_nombre || 'N/A',
        suplente_1_apellido: inscripcion.suplente_1?.apellido || inscripcion.suplente_1_apellido || '',
        suplente_1_email: inscripcion.suplente_1?.email || inscripcion.suplente_1_email || 'N/A',
        suplente_1_telefono: inscripcion.suplente_1?.telefono || 'N/A',
        suplente_1_ranking: 0,
        
        suplente_2_nombre: inscripcion.suplente_2?.nombre || inscripcion.suplente_2_nombre || 'N/A',
        suplente_2_apellido: inscripcion.suplente_2?.apellido || inscripcion.suplente_2_apellido || '',
        suplente_2_email: inscripcion.suplente_2?.email || inscripcion.suplente_2_email || 'N/A',
        suplente_2_telefono: inscripcion.suplente_2?.telefono || 'N/A',
        suplente_2_ranking: 0
      }))

      setCategoria(categoriaData)
      setInscripciones(inscripcionesProcesadas)

    } catch (error) {
      console.error('Error fetching categoria data:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la categoría",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateEstado = async (inscripcionId, nuevoEstado) => {
    try {
      setUpdating(true)
      
      const { error } = await supabase
        .from('ligainscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', inscripcionId)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: `Inscripción ${nuevoEstado} exitosamente`,
        variant: "default"
      })

      fetchCategoriaData()
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

  const downloadComprobante = async (url, filename) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
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

  const filteredInscripciones = inscripciones.filter(inscripcion => {
    const matchesEstado = filterEstado === 'all' || inscripcion.estado === filterEstado
    const matchesSearch = searchTerm === '' || 
      inscripcion.titular_1_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_1_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_1_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_2_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_2_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_2_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_1_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_1_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_1_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_2_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_2_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.suplente_2_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.contacto_celular.includes(searchTerm) ||
      inscripcion.titular_1_telefono.includes(searchTerm) ||
      inscripcion.titular_2_telefono.includes(searchTerm) ||
      inscripcion.suplente_1_telefono.includes(searchTerm) ||
      inscripcion.suplente_2_telefono.includes(searchTerm)

    return matchesEstado && matchesSearch
  })

  const estadisticas = {
    total: inscripciones.length,
    aprobadas: inscripciones.filter(i => i.estado === 'aprobada').length,
    pendientes: inscripciones.filter(i => i.estado === 'pendiente').length,
    rechazadas: inscripciones.filter(i => i.estado === 'rechazada').length,
    cupos_disponibles: categoria ? categoria.max_inscripciones - inscripciones.filter(i => i.estado === 'aprobada').length : 0
  }

  const clearFilters = () => {
    setFilterEstado('all')
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando categoría...</p>
        </div>
      </div>
    )
  }

  if (!categoria) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Categoría no encontrada</h3>
          <p className="text-gray-600 mb-6">La categoría que buscas no existe o ha sido eliminada</p>
          <Link href="/admin/inscripciones-ligas/categorias">
            <Button>
              Volver a Categorías
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/inscripciones-ligas/categorias">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{categoria.categoria}</h1>
              <p className="text-gray-600">
                {categoria.ligas?.nombre} • Inscripciones ({estadisticas.total})
              </p>
            </div>
          </div>
          <Button onClick={fetchCategoriaData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticas.aprobadas}</div>
              <div className="text-sm text-gray-600">Aprobadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.cupos_disponibles}</div>
              <div className="text-sm text-gray-600">Cupos disponibles</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Estado</label>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="aprobada">Aprobadas</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="rechazada">Rechazadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Buscar</label>
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Inscripciones */}
        <div className="space-y-4">
          {filteredInscripciones.map((inscripcion) => (
            <Card key={inscripcion.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {inscripcion.titular_1_nombre} {inscripcion.titular_1_apellido} & {inscripcion.titular_2_nombre} {inscripcion.titular_2_apellido}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {inscripcion.contacto_celular}
                        </p>
                      </div>
                      <Badge className={getEstadoColor(inscripcion.estado)}>
                        {getEstadoText(inscripcion.estado)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Titulares:</strong></p>
                        <div className="ml-2 space-y-1">
                                          <p>• {inscripcion.titular_1_nombre} {inscripcion.titular_1_apellido} ({inscripcion.titular_1_ranking > 0 ? `${inscripcion.titular_1_ranking} pts` : 'Sin puntos'})</p>
                <p>• {inscripcion.titular_2_nombre} {inscripcion.titular_2_apellido} ({inscripcion.titular_2_ranking > 0 ? `${inscripcion.titular_2_ranking} pts` : 'Sin puntos'})</p>
                        </div>
                        <p className="mt-2"><strong>Suplentes:</strong></p>
                        <div className="ml-2 space-y-1">
                                          <p>• {inscripcion.suplente_1_nombre} {inscripcion.suplente_1_apellido} ({inscripcion.suplente_1_ranking > 0 ? `${inscripcion.suplente_1_ranking} pts` : 'Sin puntos'})</p>
                <p>• {inscripcion.suplente_2_nombre} {inscripcion.suplente_2_apellido} ({inscripcion.suplente_2_ranking > 0 ? `${inscripcion.suplente_2_ranking} pts` : 'Sin puntos'})</p>
                        </div>
                      </div>
                      <div>
                        <p><strong>Fecha:</strong> {formatDate(inscripcion.created_at)}</p>
                        <p><strong>Contacto:</strong> {inscripcion.contacto_celular}</p>
                        {inscripcion.aclaraciones && (
                          <p><strong>Aclaraciones:</strong> {inscripcion.aclaraciones}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {inscripcion.comprobante_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadComprobante(inscripcion.comprobante_url, inscripcion.comprobante_filename)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Link href={`/admin/inscripciones-ligas/detalle/${inscripcion.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    
                    <div className="flex flex-col gap-1">
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={updating || inscripcion.estado === 'aprobada'}
                        onClick={() => updateEstado(inscripcion.id, 'aprobada')}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        disabled={updating || inscripcion.estado === 'pendiente'}
                        onClick={() => updateEstado(inscripcion.id, 'pendiente')}
                      >
                        <Clock className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        disabled={updating || inscripcion.estado === 'rechazada'}
                        onClick={() => updateEstado(inscripcion.id, 'rechazada')}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInscripciones.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron inscripciones</h3>
            <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
} 