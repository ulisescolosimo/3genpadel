"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Trophy, Users, Calendar, Download, Eye, CheckCircle, XCircle, Clock, Search, RefreshCw, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AdminInscripcionesLigasPage() {
  const { toast } = useToast()
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategoria, setFilterCategoria] = useState('all')
  const [filterEstado, setFilterEstado] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchInscripciones()
  }, [])

  const fetchInscripciones = async () => {
    try {
      setRefreshing(true)
      const { data, error } = await supabase
        .from('ligainscripciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setInscripciones(data || [])
    } catch (error) {
      console.error('Error fetching inscripciones:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las inscripciones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateEstado = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('ligainscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: `Inscripción ${nuevoEstado}`,
        variant: "default"
      })

      fetchInscripciones()
    } catch (error) {
      console.error('Error updating estado:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
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

  const filteredInscripciones = inscripciones.filter(inscripcion => {
    const matchesCategoria = filterCategoria === 'all' || inscripcion.categoria === filterCategoria
    const matchesEstado = filterEstado === 'all' || inscripcion.estado === filterEstado
    const matchesSearch = searchTerm === '' || 
      inscripcion.titular_1_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_1_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_2_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.titular_2_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscripcion.contacto_celular.includes(searchTerm)

    return matchesCategoria && matchesEstado && matchesSearch
  })

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada': return 'bg-green-500/20 border-green-500/30 text-green-400'
      case 'rechazada': return 'bg-red-500/20 border-red-500/30 text-red-400'
      case 'pendiente': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'aprobada': return <CheckCircle className="w-4 h-4" />
      case 'rechazada': return <XCircle className="w-4 h-4" />
      case 'pendiente': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const clearFilters = () => {
    setFilterCategoria('all')
    setFilterEstado('all')
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="pt-8 pb-8">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="text-[#E2FF1B]">Inscripciones Ligas</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Gestión de inscripciones para las Ligas de Agosto 2025
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Inscripciones</p>
                    <p className="text-2xl font-bold text-white">{inscripciones.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-[#E2FF1B]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-yellow-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {inscripciones.filter(i => i.estado === 'pendiente').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-green-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Aprobadas</p>
                    <p className="text-2xl font-bold text-green-400">
                      {inscripciones.filter(i => i.estado === 'aprobada').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:border-red-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Rechazadas</p>
                    <p className="text-2xl font-bold text-red-400">
                      {inscripciones.filter(i => i.estado === 'rechazada').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros Mejorados - Compacto para móvil */}
          <Card className="bg-white/5 border-white/10 mb-6 sm:mb-8">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                <span className="hidden sm:inline">Filtros y Búsqueda</span>
                <span className="sm:hidden">Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-6">
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                {/* Búsqueda */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-white flex items-center gap-1 sm:gap-2">
                    <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                    Buscar
                  </label>
                  <Input
                    placeholder="Nombre, apellido o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-9 sm:h-10 text-sm"
                  />
                </div>
                
                {/* Categoría */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-white">Categoría</label>
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">Todas las categorías</SelectItem>
                      <SelectItem value="C6" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">C6</SelectItem>
                      <SelectItem value="C7" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">C7</SelectItem>
                      <SelectItem value="C8" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">C8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Estado */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-white">Estado</label>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">Todos los estados</SelectItem>
                      <SelectItem value="pendiente" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">Pendiente</SelectItem>
                      <SelectItem value="aprobada" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">Aprobada</SelectItem>
                      <SelectItem value="rechazada" className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10 focus:text-white">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Botones */}
                <div className="flex gap-2 pt-2 sm:pt-0 sm:items-end">
                  <Button
                    onClick={fetchInscripciones}
                    disabled={refreshing}
                    className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 flex-1 h-9 sm:h-10 text-sm"
                  >
                    {refreshing ? (
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">Actualizar</span>
                    <span className="sm:hidden">Actualizar</span>
                  </Button>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 h-9 sm:h-10 text-sm px-3 sm:px-4"
                  >
                    <span className="hidden sm:inline">Limpiar</span>
                    <span className="sm:hidden">Limpiar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de Inscripciones */}
      <div className="container mx-auto px-4 pb-16">
        <div className="space-y-4">
          {filteredInscripciones.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No se encontraron inscripciones</h3>
                <p className="text-gray-400">Intenta ajustar los filtros o la búsqueda</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Resultados ({filteredInscripciones.length})
                </h2>
                <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B] w-fit">
                  {filteredInscripciones.length} inscripciones
                </Badge>
              </div>
              
              {filteredInscripciones.map((inscripcion) => (
                <Card key={inscripcion.id} className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group">
                  <CardContent className="p-4 sm:p-6">
                    {/* Header con badges - Mejorado para móvil */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                      <Badge className={`${getEstadoColor(inscripcion.estado)} border`}>
                        <div className="flex items-center gap-1">
                          {getEstadoIcon(inscripcion.estado)}
                          <span className="hidden sm:inline">{inscripcion.estado}</span>
                          <span className="sm:hidden">{inscripcion.estado.charAt(0).toUpperCase()}</span>
                        </div>
                      </Badge>
                      <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B]">
                        {inscripcion.categoria}
                      </Badge>
                      <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          {new Date(inscripcion.created_at).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="sm:hidden">
                          {new Date(inscripcion.created_at).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </span>
                    </div>
                    
                    {/* Información del equipo - Layout mejorado */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
                            <Users className="w-4 h-4 text-[#E2FF1B]" />
                            Titulares
                          </h3>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-gray-300 text-sm">
                              <span className="font-medium">1.</span> {inscripcion.titular_1_nombre} {inscripcion.titular_1_apellido}
                            </p>
                            <p className="text-gray-300 text-sm">
                              <span className="font-medium">2.</span> {inscripcion.titular_2_nombre} {inscripcion.titular_2_apellido}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
                            <Users className="w-4 h-4 text-[#E2FF1B]" />
                            Suplentes
                          </h3>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-gray-300 text-sm">
                              <span className="font-medium">1.</span> {inscripcion.suplente_1_nombre} {inscripcion.suplente_1_apellido}
                            </p>
                            <p className="text-gray-300 text-sm">
                              <span className="font-medium">2.</span> {inscripcion.suplente_2_nombre} {inscripcion.suplente_2_apellido}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Información adicional */}
                      <div className="space-y-2">
                        <p className="text-gray-300 text-sm">
                          <strong className="text-white">Contacto:</strong> {inscripcion.contacto_celular}
                        </p>
                        {inscripcion.aclaraciones && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-gray-300 text-sm">
                              <strong className="text-white">Aclaraciones:</strong> {inscripcion.aclaraciones}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Acciones - Mejoradas para móvil */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-white/10">
                      {inscripcion.comprobante_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadComprobante(inscripcion.comprobante_url, inscripcion.comprobante_filename)}
                          className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Comprobante
                        </Button>
                      )}
                      
                      {inscripcion.estado === 'pendiente' && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <Button
                            size="default"
                            onClick={() => updateEstado(inscripcion.id, 'aprobada')}
                            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none order-1 sm:order-none h-12 sm:h-9 text-base sm:text-sm font-semibold"
                          >
                            <CheckCircle className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                            Aprobar
                          </Button>
                          <Button
                            size="default"
                            onClick={() => updateEstado(inscripcion.id, 'rechazada')}
                            className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none order-2 sm:order-none h-12 sm:h-9 text-base sm:text-sm font-semibold"
                          >
                            <XCircle className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
} 