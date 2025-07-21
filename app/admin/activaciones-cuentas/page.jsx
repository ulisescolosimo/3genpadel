"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  Filter, 
  Mail, 
  User,
  Phone,
  Trophy,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AdminActivacionesCuentasPage() {
  const { toast } = useToast()
  const [jugadores, setJugadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterEstado, setFilterEstado] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    activados: 0,
    pendientes: 0,
    porcentaje: 0
  })

  useEffect(() => {
    fetchJugadores()
  }, [])

  const fetchJugadores = async () => {
    try {
      setRefreshing(true)
      
      // Obtener todos los usuarios con información de activación
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setJugadores(data || [])

      // Calcular estadísticas
      const total = data?.length || 0
      const activados = data?.filter(u => u.cuenta_activada)?.length || 0
      const pendientes = total - activados
      const porcentaje = total > 0 ? Math.round((activados / total) * 100) : 0

      setStats({
        total,
        activados,
        pendientes,
        porcentaje
      })
    } catch (error) {
      console.error('Error fetching usuarios:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredJugadores = jugadores.filter(jugador => {
    const matchesEstado = filterEstado === 'all' || 
      (filterEstado === 'activados' && jugador.cuenta_activada) ||
      (filterEstado === 'pendientes' && !jugador.cuenta_activada)
    
    const matchesSearch = searchTerm === '' || 
      jugador.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jugador.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jugador.email?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesEstado && matchesSearch
  })

  const getEstadoColor = (activada) => {
    return activada ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }

  const getEstadoIcon = (activada) => {
    return activada ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getEstadoText = (activada) => {
    return activada ? 'Cuenta Activada' : 'Pendiente de Activación'
  }

  const handleEnviarRecordatorio = async (jugador) => {
    try {
      // Aquí podrías implementar el envío de email de recordatorio
      toast({
        title: "Recordatorio enviado",
        description: `Se envió un recordatorio a ${jugador.email}`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el recordatorio",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="container mx-auto">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Activaciones de Cuentas</h1>
          <p className="text-gray-400">Administra las cuentas de jugadores y su estado de activación</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Jugadores</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-[#E2FF1B]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Cuentas Activadas</p>
                  <p className="text-2xl font-bold text-green-400">{stats.activados}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendientes}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Porcentaje Activación</p>
                  <p className="text-2xl font-bold text-[#E2FF1B]">{stats.porcentaje}%</p>
                </div>
                <Trophy className="w-8 h-8 text-[#E2FF1B]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, apellido o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activados">Cuentas activadas</SelectItem>
                  <SelectItem value="pendientes">Pendientes de activación</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={fetchJugadores}
                disabled={refreshing}
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de jugadores */}
        <div className="space-y-4">
          {filteredJugadores.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No se encontraron jugadores</h3>
                <p className="text-gray-400">No hay jugadores que coincidan con los filtros aplicados</p>
              </CardContent>
            </Card>
          ) : (
            filteredJugadores.map((jugador) => (
              <Card key={jugador.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Información del jugador */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getEstadoColor(jugador.cuenta_activada)}>
                          {getEstadoIcon(jugador.cuenta_activada)}
                          <span className="ml-1">{getEstadoText(jugador.cuenta_activada)}</span>
                        </Badge>

                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {jugador.nombre} {jugador.apellido || ''}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {jugador.email}
                        </div>
                        {jugador.telefono && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {jugador.telefono}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {jugador.ranking_puntos || 0} puntos
                        </div>
                      </div>

                      {jugador.cuenta_activada && (
                        <div className="mt-2 text-sm text-green-400">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Cuenta activada el {new Date(jugador.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {!jugador.cuenta_activada && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEnviarRecordatorio(jugador)}
                          className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar Recordatorio
                        </Button>
                      )}
                      
                      <Link href={`/activar-cuenta?email=${jugador.email}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#E2FF1B]/30 text-[#E2FF1B] hover:bg-[#E2FF1B]/10"
                        >
                          {jugador.cuenta_activada ? 'Ver Cuenta' : 'Activar Cuenta'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Paginación o información adicional */}
        <div className="mt-8 text-center text-gray-400">
          <p>Mostrando {filteredJugadores.length} de {jugadores.length} jugadores</p>
        </div>
      </div>
    </div>
  )
} 