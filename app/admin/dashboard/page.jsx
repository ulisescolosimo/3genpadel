'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Calendar, 
  MapPin,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalInscripciones: 0,
    inscripcionesPendientes: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inscripcionesRecientes, setInscripcionesRecientes] = useState([])

  useEffect(() => {
    fetchStats()
    fetchInscripcionesRecientes()
  }, [])

  const fetchStats = async () => {
    try {
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

  const fetchInscripcionesRecientes = async () => {
    try {
      // Traer las últimas 5 inscripciones
      const { data, error } = await supabase
        .from('registros_torneo')
        .select('id, nombre, apellido, email, fecha_registro')
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
        <p className="text-gray-400 mt-1">Resumen general de inscripciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <h2 className="text-lg font-semibold text-white mb-4">Inscripciones Recientes</h2>
            <div className="space-y-4">
              {inscripcionesRecientes.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay inscripciones recientes</p>
              ) : (
                inscripcionesRecientes.map((inscripcion) => (
                  <div key={inscripcion.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">
                        {inscripcion.nombre} {inscripcion.apellido}
                      </p>
                      <p className="text-gray-400 text-sm">{inscripcion.email}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(inscripcion.fecha_registro).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#E2FF1B]" />
                  <div>
                    <p className="text-white font-medium">Ver todas las inscripciones</p>
                    <p className="text-gray-400 text-sm">Gestionar inscripciones</p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#E2FF1B]" />
                  <div>
                    <p className="text-white font-medium">Configuración</p>
                    <p className="text-gray-400 text-sm">Ajustes del sistema</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 