'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Users,
  PlayCircle,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function EtapaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [etapa, setEtapa] = useState(null)
  const [stats, setStats] = useState({
    inscripciones: 0,
    partidosJugados: 0,
    partidosPendientes: 0
  })

  useEffect(() => {
    if (params.id) {
      fetchData()
    }
  }, [params.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: etapaData, error: etapaError } = await supabase
        .from('circuitooka_etapas')
        .select('*')
        .eq('id', params.id)
        .single()

      if (etapaError) throw etapaError
      setEtapa(etapaData)

      // Obtener estadísticas
      const { count: inscripciones } = await supabase
        .from('circuitooka_inscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('etapa_id', params.id)
        .eq('estado', 'activa')

      const { count: partidosJugados } = await supabase
        .from('circuitooka_partidos')
        .select('*', { count: 'exact', head: true })
        .eq('etapa_id', params.id)
        .eq('estado', 'jugado')

      const { count: partidosPendientes } = await supabase
        .from('circuitooka_partidos')
        .select('*', { count: 'exact', head: true })
        .eq('etapa_id', params.id)
        .eq('estado', 'pendiente')

      setStats({
        inscripciones: inscripciones || 0,
        partidosJugados: partidosJugados || 0,
        partidosPendientes: partidosPendientes || 0
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  if (!etapa) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Etapa no encontrada</p>
        <Link href="/admin/circuitooka/etapas">
          <Button className="mt-4">Volver a Etapas</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/circuitooka/etapas">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-yellow-500" />
              {etapa.nombre}
            </h1>
            <p className="text-gray-400 mt-2">
              {new Date(etapa.fecha_inicio).toLocaleDateString()} -{' '}
              {new Date(etapa.fecha_fin).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge
          className={
            etapa.estado === 'activa'
              ? 'bg-green-500/20 text-green-400 border-green-500/50'
              : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
          }
        >
          {etapa.estado}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Inscripciones</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.inscripciones}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Partidos Jugados</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.partidosJugados}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Partidos Pendientes</CardTitle>
            <PlayCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.partidosPendientes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inscripciones" className="w-full">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="inscripciones" className="text-gray-400 data-[state=active]:text-white">
            Inscripciones
          </TabsTrigger>
          <TabsTrigger value="partidos" className="text-gray-400 data-[state=active]:text-white">
            Partidos
          </TabsTrigger>
          <TabsTrigger value="rankings" className="text-gray-400 data-[state=active]:text-white">
            Rankings
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="text-gray-400 data-[state=active]:text-white">
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inscripciones" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Inscripciones por División</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Lista de inscripciones por división (pendiente de implementar)</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partidos" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Partidos de la Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/circuitooka/partidos?etapa_id=${etapa.id}`}>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  Ver todos los partidos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rankings" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Rankings por División</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/circuitooka/rankings?etapa_id=${etapa.id}`}>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  Ver rankings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracion" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Configuración de la Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Configuración de cupos y parámetros (pendiente de implementar)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}













