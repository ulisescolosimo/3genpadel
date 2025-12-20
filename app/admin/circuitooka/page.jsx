'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Trophy,
  Calendar,
  Users,
  PlayCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'

export default function CircuitookaDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    etapasActivas: 0,
    totalInscripciones: 0,
    partidosPendientes: 0,
    partidosJugados: 0,
    jugadoresActivos: 0
  })
  const [etapasActivas, setEtapasActivas] = useState([])
  const [partidosRecientes, setPartidosRecientes] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      await Promise.all([
        fetchStats(),
        fetchEtapasActivas(),
        fetchPartidosRecientes()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar los datos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Etapas activas
      const { count: etapasActivas } = await supabase
        .from('circuitooka_etapas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activa')

      // Total inscripciones
      const { count: totalInscripciones } = await supabase
        .from('circuitooka_inscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activa')

      // Partidos pendientes
      const { count: partidosPendientes } = await supabase
        .from('circuitooka_partidos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      // Partidos jugados
      const { count: partidosJugados } = await supabase
        .from('circuitooka_partidos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'jugado')

      // Jugadores activos (únicos)
      const { data: inscripciones } = await supabase
        .from('circuitooka_inscripciones')
        .select('usuario_id')
        .eq('estado', 'activa')

      const jugadoresUnicos = new Set(inscripciones?.map(i => i.usuario_id) || [])
      const jugadoresActivos = jugadoresUnicos.size

      setStats({
        etapasActivas: etapasActivas || 0,
        totalInscripciones: totalInscripciones || 0,
        partidosPendientes: partidosPendientes || 0,
        partidosJugados: partidosJugados || 0,
        jugadoresActivos
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      throw error
    }
  }

  const fetchEtapasActivas = async () => {
    try {
      const { data, error } = await supabase
        .from('circuitooka_etapas')
        .select('*')
        .eq('estado', 'activa')
        .order('fecha_inicio', { ascending: false })
        .limit(3)

      if (error) throw error
      setEtapasActivas(data || [])
    } catch (error) {
      console.error('Error fetching etapas:', error)
    }
  }

  const fetchPartidosRecientes = async () => {
    try {
      const { data, error } = await supabase
        .from('circuitooka_partidos')
        .select(`
          *,
          division:circuitooka_divisiones (
            numero_division,
            nombre
          )
        `)
        .eq('estado', 'pendiente')
        .order('fecha_partido', { ascending: true })
        .order('horario', { ascending: true })
        .limit(5)

      if (error) throw error
      setPartidosRecientes(data || [])
    } catch (error) {
      console.error('Error fetching partidos:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Dashboard Circuitooka
          </h1>
          <p className="text-gray-400 mt-2">Vista general del circuito</p>
        </div>
        <Button
          onClick={fetchData}
          disabled={refreshing}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Etapas Activas</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.etapasActivas}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Jugadores Activos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.jugadoresActivos}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Inscripciones</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalInscripciones}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Partidos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.partidosPendientes}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Partidos Jugados</CardTitle>
            <PlayCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.partidosJugados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/circuitooka/etapas">
          <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-500" />
                Gestionar Etapas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Crear y editar etapas del circuito</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/circuitooka/partidos">
          <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-yellow-500" />
                Gestionar Partidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Crear y editar partidos</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/circuitooka/rankings">
          <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-500" />
                Ver Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Consultar rankings por división</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/circuitooka/sorteos">
          <Card className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-500" />
                Ejecutar Sorteos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Sortear partidos para una fecha</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Etapas Activas */}
      {etapasActivas.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-500" />
                Etapas Activas
              </span>
              <Link href="/admin/circuitooka/etapas">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Ver todas <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {etapasActivas.map((etapa) => (
                <div
                  key={etapa.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div>
                    <h3 className="text-white font-semibold">{etapa.nombre}</h3>
                    <p className="text-gray-400 text-sm">
                      {new Date(etapa.fecha_inicio).toLocaleDateString()} -{' '}
                      {new Date(etapa.fecha_fin).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    {etapa.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partidos Recientes */}
      {partidosRecientes.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-yellow-500" />
                Próximos Partidos
              </span>
              <Link href="/admin/circuitooka/partidos">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Ver todos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partidosRecientes.map((partido) => (
                <div
                  key={partido.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="text-white font-semibold">
                      División {partido.division?.numero_division}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(partido.fecha_partido).toLocaleDateString()}
                      {partido.horario && ` - ${partido.horario}`}
                    </p>
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                    {partido.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

