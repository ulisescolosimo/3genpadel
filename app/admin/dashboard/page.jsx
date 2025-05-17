'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTorneos: 0,
    torneosActivos: 0,
    totalInscripciones: 0,
    inscripcionesPendientes: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [proximosTorneos, setProximosTorneos] = useState([])
  const [inscripcionesRecientes, setInscripcionesRecientes] = useState([])

  useEffect(() => {
    fetchStats()
    fetchProximosTorneos()
    fetchInscripcionesRecientes()
  }, [])

  const fetchStats = async () => {
    try {
      // Obtener total de torneos
      const { count: totalTorneos, error: torneosError } = await supabase
        .from('torneos')
        .select('*', { count: 'exact', head: true })
      if (torneosError) throw torneosError

      // Obtener torneos activos
      const { count: torneosActivos, error: activosError } = await supabase
        .from('torneos')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['abierto', 'en_curso'])
      if (activosError) throw activosError

      // Obtener total de inscripciones
      const { count: totalInscripciones, error: inscripcionesError } = await supabase
        .from('registros_torneo')
        .select('*', { count: 'exact', head: true })
      if (inscripcionesError) throw inscripcionesError

      // Obtener inscripciones pendientes
      const { count: inscripcionesPendientes, error: pendientesError } = await supabase
        .from('registros_torneo')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')
      if (pendientesError) throw pendientesError

      setStats({
        totalTorneos,
        torneosActivos,
        totalInscripciones,
        inscripcionesPendientes
      })
      setLoading(false)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Error al cargar las estadísticas')
      setLoading(false)
    }
  }

  const fetchProximosTorneos = async () => {
    try {
      // Traer próximos torneos (abiertos o en curso, ordenados por fecha de inicio)
      const { data: torneos, error } = await supabase
        .from('torneos')
        .select('id, nombre, fecha_inicio, fecha_fin, ubicacion, categoria, estado')
        .in('estado', ['abierto', 'en_curso'])
        .order('fecha_inicio', { ascending: true })
        .limit(5)
      if (error) throw error

      // Para cada torneo, traer la cantidad de inscriptos
      const torneosConInscriptos = await Promise.all(
        (torneos || []).map(async (torneo) => {
          const { count, error: inscError } = await supabase
            .from('registros_torneo')
            .select('*', { count: 'exact', head: true })
            .eq('torneo_id', torneo.id)
            .neq('estado', 'cancelado')
          return {
            ...torneo,
            inscriptos: count || 0
          }
        })
      )
      setProximosTorneos(torneosConInscriptos)
    } catch (err) {
      console.error('Error fetching próximos torneos:', err)
      setProximosTorneos([])
    }
  }

  const fetchInscripcionesRecientes = async () => {
    try {
      // Traer las últimas 5 inscripciones
      const { data, error } = await supabase
        .from('registros_torneo')
        .select('id, nombre, apellido, email, torneo_id, fecha_registro, torneo:torneo_id (nombre)')
        .order('fecha_registro', { ascending: false })
        .limit(5)
      if (error) throw error
      setInscripcionesRecientes(data || [])
    } catch (err) {
      console.error('Error fetching inscripciones recientes:', err)
      setInscripcionesRecientes([])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2FF1B] border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Torneos',
      value: stats.totalTorneos,
      icon: Trophy,
      color: 'text-blue-500'
    },
    {
      title: 'Torneos Activos',
      value: stats.torneosActivos,
      icon: Calendar,
      color: 'text-green-500'
    },
    {
      title: 'Total Inscripciones',
      value: stats.totalInscripciones,
      icon: Users,
      color: 'text-purple-500'
    },
    {
      title: 'Inscripciones Pendientes',
      value: stats.inscripcionesPendientes,
      icon: TrendingUp,
      color: 'text-yellow-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Resumen general de torneos e inscripciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gray-800/50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Próximos Torneos</h2>
            <div className="space-y-4">
              {proximosTorneos.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay torneos próximos</p>
              ) : (
                proximosTorneos.map((torneo) => (
                  <div key={torneo.id} className="bg-gray-800/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold text-base">{torneo.nombre}</p>
                      <p className="text-gray-400 text-sm">{torneo.categoria} | {torneo.ubicacion}</p>
                      <p className="text-gray-400 text-xs">{new Date(torneo.fecha_inicio).toLocaleDateString()} - {new Date(torneo.fecha_fin).toLocaleDateString()}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        torneo.estado === 'abierto' ? 'bg-green-700/30 text-green-400' :
                        torneo.estado === 'en_curso' ? 'bg-blue-700/30 text-blue-400' :
                        torneo.estado === 'finalizado' ? 'bg-gray-700/30 text-gray-400' :
                        'bg-red-700/30 text-red-400'
                      }`}>
                        {torneo.estado.charAt(0).toUpperCase() + torneo.estado.slice(1)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[#E2FF1B] font-bold text-lg">{torneo.inscriptos}</span>
                      <span className="text-xs text-gray-400">inscriptos</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Inscripciones Recientes</h2>
            <div className="space-y-4">
              {inscripcionesRecientes.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay inscripciones recientes</p>
              ) : (
                inscripcionesRecientes.map((insc) => (
                  <div key={insc.id} className="bg-gray-800/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold text-base">{insc.nombre} {insc.apellido}</p>
                      <p className="text-gray-400 text-sm">{insc.email}</p>
                      <p className="text-gray-400 text-xs">Torneo: {insc.torneo?.nombre || insc.torneo_id}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-400">{new Date(insc.fecha_registro).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 