'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Users, 
  Calendar, 
  MapPin,
  TrendingUp,
  AlertCircle,
  Trophy,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function AdminDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalInscripciones: 0,
    inscripcionesPendientes: 0,
    inscripcionesAprobadas: 0,
    inscripcionesRechazadas: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [inscripcionesRecientes, setInscripcionesRecientes] = useState([])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setRefreshing(true)
      await Promise.all([
        fetchStats(),
        fetchInscripcionesRecientes()
      ])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Obtener total de inscripciones
      const { count: totalInscripciones, error: inscripcionesError } = await supabase
        .from('ligainscripciones')
        .select('*', { count: 'exact', head: true })
      if (inscripcionesError) throw inscripcionesError

      // Obtener inscripciones por estado
      const { count: inscripcionesPendientes, error: pendientesError } = await supabase
        .from('ligainscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')
      if (pendientesError) throw pendientesError

      const { count: inscripcionesAprobadas, error: aprobadasError } = await supabase
        .from('ligainscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'aprobada')
      if (aprobadasError) throw aprobadasError

      const { count: inscripcionesRechazadas, error: rechazadasError } = await supabase
        .from('ligainscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'rechazada')
      if (rechazadasError) throw rechazadasError

      setStats({
        totalInscripciones: totalInscripciones || 0,
        inscripcionesPendientes: inscripcionesPendientes || 0,
        inscripcionesAprobadas: inscripcionesAprobadas || 0,
        inscripcionesRechazadas: inscripcionesRechazadas || 0
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
      throw err
    }
  }

  const fetchInscripcionesRecientes = async () => {
    try {
      // Traer las últimas 5 inscripciones con información de categoría y liga
      const { data, error } = await supabase
        .from('ligainscripciones')
        .select(`
          *,
          liga_categorias (
            categoria,
            ligas (
              nombre
            )
          ),
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
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      
      const inscripcionesProcesadas = data?.map(inscripcion => ({
        ...inscripcion,
        categoria: inscripcion.liga_categorias?.categoria || 'N/A',
        liga: inscripcion.liga_categorias?.ligas?.nombre || 'N/A',
        // Usar datos de la tabla usuarios si están disponibles, sino usar los campos directos
        titular_1_nombre: inscripcion.titular_1?.nombre || inscripcion.titular_1_nombre || 'N/A',
        titular_1_apellido: inscripcion.titular_1?.apellido || inscripcion.titular_1_apellido || '',
        titular_1_email: inscripcion.titular_1?.email || inscripcion.titular_1_email || 'N/A',
        titular_1_ranking: inscripcion.titular_1?.ranking_puntos || 0,
        
        titular_2_nombre: inscripcion.titular_2?.nombre || inscripcion.titular_2_nombre || 'N/A',
        titular_2_apellido: inscripcion.titular_2?.apellido || inscripcion.titular_2_apellido || '',
        titular_2_email: inscripcion.titular_2?.email || inscripcion.titular_2_email || 'N/A',
        titular_2_ranking: inscripcion.titular_2?.ranking_puntos || 0,
        
        suplente_1_nombre: inscripcion.suplente_1?.nombre || inscripcion.suplente_1_nombre || 'N/A',
        suplente_1_apellido: inscripcion.suplente_1?.apellido || inscripcion.suplente_1_apellido || '',
        suplente_1_email: inscripcion.suplente_1?.email || inscripcion.suplente_1_email || 'N/A',
        suplente_1_ranking: inscripcion.suplente_1?.ranking_puntos || 0,
        
        suplente_2_nombre: inscripcion.suplente_2?.nombre || inscripcion.suplente_2_nombre || 'N/A',
        suplente_2_apellido: inscripcion.suplente_2?.apellido || inscripcion.suplente_2_apellido || '',
        suplente_2_email: inscripcion.suplente_2?.email || inscripcion.suplente_2_email || 'N/A',
        suplente_2_ranking: inscripcion.suplente_2?.ranking_puntos || 0
      })) || []
      
      setInscripcionesRecientes(inscripcionesProcesadas)
    } catch (err) {
      console.error('Error fetching inscripciones recientes:', err)
      setInscripcionesRecientes([])
    }
  }

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

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'aprobada': return 'Aprobada'
      case 'rechazada': return 'Rechazada'
      case 'pendiente': return 'Pendiente'
      default: return estado
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Inscripciones',
      value: stats.totalInscripciones,
      icon: Trophy,
      color: 'text-[#E2FF1B]',
      bgColor: 'bg-[#E2FF1B]/10',
      borderColor: 'border-[#E2FF1B]/30',
      description: 'Todas las inscripciones'
    },
    {
      title: 'Pendientes',
      value: stats.inscripcionesPendientes,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      description: 'Requieren revisión'
    },
    {
      title: 'Aprobadas',
      value: stats.inscripcionesAprobadas,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      description: 'Confirmadas'
    },
    {
      title: 'Rechazadas',
      value: stats.inscripcionesRechazadas,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      description: 'No aprobadas'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="pt-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard Admin</h1>
              <p className="text-gray-400">Panel de control y gestión de inscripciones</p>
            </div>
            <Button
              onClick={fetchAllData}
              disabled={refreshing}
              className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Actualizar
            </Button>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => (
              <Card key={stat.title} className={`bg-white/5 border-white/10 hover:${stat.borderColor} transition-all duration-300 group`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <Badge variant="outline" className={`${stat.borderColor} ${stat.color} text-xs`}>
                      {stat.description}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contenido principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inscripciones Recientes */}
            <div className="lg:col-span-2">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#E2FF1B]" />
                      <CardTitle className="text-white">Inscripciones Recientes</CardTitle>
                    </div>
                    <Badge variant="outline" className="border-[#E2FF1B]/30 text-[#E2FF1B]">
                      {inscripcionesRecientes.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                    {inscripcionesRecientes.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No hay inscripciones recientes</h3>
                        <p className="text-gray-400">Las nuevas inscripciones aparecerán aquí</p>
                      </div>
                    ) : (
                      inscripcionesRecientes.map((inscripcion) => (
                        <Link key={inscripcion.id} href={`/admin/inscripciones-ligas/detalle/${inscripcion.id}`}>
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-200 h-full cursor-pointer">
                            <div className="flex flex-col gap-3 h-full">
                              <div className="flex items-center justify-between">
                                <Badge className={`${getEstadoColor(inscripcion.estado)} border`}>
                                  <div className="flex items-center gap-1">
                                    {getEstadoIcon(inscripcion.estado)}
                                    <span className="text-xs font-medium">{getEstadoText(inscripcion.estado)}</span>
                                  </div>
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <div>
                                  <p className="text-white font-medium text-sm">
                                    {inscripcion.categoria} • {inscripcion.liga}
                                  </p>
                                  <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(inscripcion.created_at).toLocaleDateString('es-AR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-gray-300 text-xs font-medium">Titulares:</p>
                                    <p className="text-white text-xs">
                                      {inscripcion.titular_1_nombre} {inscripcion.titular_1_apellido} & {inscripcion.titular_2_nombre} {inscripcion.titular_2_apellido}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-300 text-xs font-medium">Suplentes:</p>
                                    <p className="text-white text-xs">
                                      {inscripcion.suplente_1_nombre} {inscripcion.suplente_1_apellido} & {inscripcion.suplente_2_nombre} {inscripcion.suplente_2_apellido}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones Rápidas */}
            <div>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#E2FF1B]" />
                    <CardTitle className="text-white">Acciones Rápidas</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                                         <Button 
                       variant="outline" 
                       className="w-full justify-start border-white/20 text-white hover:bg-white/10 hover:border-[#E2FF1B]/30"
                       onClick={() => window.location.href = '/admin/inscripciones-ligas'}
                     >
                       <Users className="w-4 h-4 mr-3" />
                       <div className="text-left">
                         <p className="font-medium">Gestionar Inscripciones</p>
                         <p className="text-xs text-gray-400">Ver y administrar todas</p>
                       </div>
                     </Button>
                     
                     <Button 
                       variant="outline" 
                       className="w-full justify-start border-white/20 text-white hover:bg-white/10 hover:border-[#E2FF1B]/30"
                       onClick={() => window.location.href = '/admin/ligas'}
                     >
                       <Trophy className="w-4 h-4 mr-3" />
                       <div className="text-left">
                         <p className="font-medium">Gestionar Ligas</p>
                         <p className="text-xs text-gray-400">Crear y administrar ligas</p>
                       </div>
                     </Button>
                     
                     <Button 
                       variant="outline" 
                       className="w-full justify-start border-white/20 text-white hover:bg-white/10 hover:border-[#E2FF1B]/30"
                     >
                       <BarChart3 className="w-4 h-4 mr-3" />
                       <div className="text-left">
                         <p className="font-medium">Estadísticas</p>
                         <p className="text-xs text-gray-400">Análisis detallado</p>
                       </div>
                     </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Información adicional */}
              <Card className="bg-white/5 border-white/10 mt-6">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-6 h-6 text-[#E2FF1B]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Sistema Activo</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      El sistema está funcionando correctamente y procesando inscripciones
                    </p>
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Operativo
                      </div>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 