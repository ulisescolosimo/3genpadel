"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Calendar, Eye, Plus, Gamepad2, BarChart3, Settings, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function AdminLigasPage() {
  const { toast } = useToast()
  const [ligas, setLigas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Obtener ligas
      const { data: ligasData, error: ligasError } = await supabase
        .from('ligas')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            max_inscripciones,
            ligainscripciones (id, estado)
          )
        `)
        .order('fecha_inicio', { ascending: false })

      if (ligasError) throw ligasError
      setLigas(ligasData || [])

      // Obtener categorías
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('liga_categorias')
        .select(`
          id,
          categoria,
          ligas (
            id,
            nombre,
            fecha_inicio
          )
        `)
        .order('liga_id', { ascending: true })
        .order('categoria', { ascending: true })

      if (categoriasError) throw categoriasError
      setCategorias(categoriasData || [])

      // Obtener partidos
      const { data: partidosData, error: partidosError } = await supabase
        .from('liga_partidos')
        .select('*')
        .order('created_at', { ascending: false })

      if (partidosError) throw partidosError
      setPartidos(partidosData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const variants = {
      abierta: 'default',
      cerrada: 'secondary',
      en_curso: 'default',
      finalizada: 'destructive'
    }
    return <Badge variant={variants[estado]}>{estado}</Badge>
  }

  const getInscripcionesCount = (liga) => {
    if (!liga.liga_categorias) return 0
    return liga.liga_categorias.reduce((total, cat) => {
      const inscripcionesAprobadas = cat.ligainscripciones?.filter(ins => ins.estado === 'aprobada')?.length || 0
      return total + inscripcionesAprobadas
    }, 0)
  }

  const getMaxInscripciones = (liga) => {
    if (!liga.liga_categorias) return 0
    return liga.liga_categorias.reduce((total, cat) => total + cat.max_inscripciones, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Ligas</h1>
          <p className="text-gray-600">Administra ligas, categorías y partidos</p>
        </div>
        <Button onClick={fetchData} disabled={refreshing} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{ligas.length}</p>
                <p className="text-sm text-gray-600">Ligas Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{categorias.length}</p>
                <p className="text-sm text-gray-600">Categorías</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{partidos.length}</p>
                <p className="text-sm text-gray-600">Partidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {partidos.filter(p => p.estado === 'jugado').length}
                </p>
                <p className="text-sm text-gray-600">Jugados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enlaces rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/ligas/categorias">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Categorías</p>
                  <p className="text-sm text-gray-600">Gestionar categorías</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/ligas/partidos">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Gamepad2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Partidos</p>
                  <p className="text-sm text-gray-600">Crear y gestionar partidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/ligas/brackets">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Brackets</p>
                  <p className="text-sm text-gray-600">Ver brackets de torneos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/inscripciones-ligas">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Inscripciones</p>
                  <p className="text-sm text-gray-600">Revisar inscripciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Lista de ligas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ligas Activas
          </CardTitle>
          <CardDescription>
            Gestiona las ligas y sus configuraciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {ligas.map(liga => (
              <div key={liga.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{liga.nombre}</h3>
                    {getEstadoBadge(liga.estado)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(liga.fecha_inicio).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {getInscripcionesCount(liga)}/{getMaxInscripciones(liga)} inscripciones
                    </span>
                    <span>
                      {liga.liga_categorias?.length || 0} categorías
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/ligas/categorias`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Categorías
                    </Button>
                  </Link>
                  <Link href={`/admin/ligas/brackets`}>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Brackets
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {ligas.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No hay ligas activas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partidos recientes */}
      {partidos.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Partidos Recientes
            </CardTitle>
            <CardDescription>
              Últimos partidos creados o actualizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {partidos.slice(0, 5).map(partido => (
                <div key={partido.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{partido.ronda}</p>
                    <p className="text-sm text-gray-600">
                      Categoría ID: {partido.liga_categoria_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={partido.estado === 'jugado' ? 'default' : 'secondary'}>
                      {partido.estado}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(partido.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/admin/ligas/partidos">
                <Button variant="outline">
                  Ver Todos los Partidos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 