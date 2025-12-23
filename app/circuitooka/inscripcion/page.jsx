'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Trophy,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info,
  User,
  Calendar,
  Target,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

export default function InscripcionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [etapasActivas, setEtapasActivas] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [usuario, setUsuario] = useState(null)
  const [formData, setFormData] = useState({
    etapa_id: '',
    division_id: '',
    division_solicitada: ''
  })
  const [yaInscripto, setYaInscripto] = useState(false)
  const [inscripcionExistente, setInscripcionExistente] = useState(null)

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.etapa_id) {
      verificarInscripcion()
    }
  }, [formData.etapa_id])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/circuitooka/inscripcion')
        return
      }

      const { data: usuarioData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      setUsuario(usuarioData)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/login?redirect=/circuitooka/inscripcion')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Obtener etapas activas
      const { data: etapas, error: etapasError } = await supabase
        .from('circuitooka_etapas')
        .select('*')
        .eq('estado', 'activa')
        .order('fecha_inicio', { ascending: false })

      if (etapasError) throw etapasError
      setEtapasActivas(etapas || [])

      // Si hay etapas activas, seleccionar la primera por defecto
      if (etapas && etapas.length > 0) {
        setFormData(prev => ({ ...prev, etapa_id: etapas[0].id }))
      }

      // Obtener divisiones (solo 3 y 4 para usuarios normales)
      const { data: divisionesData, error: divisionesError } = await supabase
        .from('circuitooka_divisiones')
        .select('*')
        .in('numero_division', [3, 4])
        .order('numero_division', { ascending: true })

      if (divisionesError) throw divisionesError
      setDivisiones(divisionesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const verificarInscripcion = async () => {
    if (!usuario || !formData.etapa_id) return

    try {
      const { data, error } = await supabase
        .from('circuitooka_inscripciones')
        .select('*')
        .eq('etapa_id', formData.etapa_id)
        .eq('usuario_id', usuario.id)
        .eq('estado', 'activa')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setYaInscripto(true)
        setInscripcionExistente(data)
      } else {
        setYaInscripto(false)
        setInscripcionExistente(null)
      }
    } catch (error) {
      console.error('Error verificando inscripción:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.etapa_id || !formData.division_id) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una etapa y una división',
        variant: 'destructive'
      })
      return
    }

    try {
      setSubmitting(true)

      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/circuitooka/inscripcion')
        return
      }

      const response = await fetch('/api/circuitooka/inscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          etapa_id: formData.etapa_id,
          division_id: formData.division_id,
          estado: 'activa'
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al inscribirse')
      }

      toast({
        title: 'Inscripción exitosa',
        description: 'Te has inscrito correctamente al circuito',
      })

      // Redirigir después de un momento
      setTimeout(() => {
        router.push('/circuitooka/partidos')
      }, 2000)
    } catch (error) {
      console.error('Error al inscribirse:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar la inscripción',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const etapaSeleccionada = etapasActivas.find(e => e.id === formData.etapa_id)
  const divisionSeleccionada = divisiones.find(d => d.id === formData.division_id)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/circuitooka">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-[#E2FF1B]" />
            <h1 className="text-4xl font-bold text-white">Inscripción a Circuitooka</h1>
          </div>
          <p className="text-gray-300">
            Únete al circuito más competitivo de pádel. Selecciona tu etapa y división.
          </p>
        </motion.div>

        {/* Ya inscripto */}
        {yaInscripto && inscripcionExistente && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="bg-blue-900/20 border-blue-500">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <AlertTitle className="text-blue-300">Ya estás inscripto</AlertTitle>
              <AlertDescription className="text-blue-200">
                Ya tienes una inscripción activa en esta etapa. 
                {inscripcionExistente.estado === 'pendiente' && ' Tu solicitud está pendiente de aprobación.'}
                <Link href="/circuitooka/partidos" className="ml-2 underline">
                  Ver mis partidos
                </Link>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Formulario */}
        {!yaInscripto && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-[#E2FF1B]" />
                  Datos de Inscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Etapa */}
                  <div>
                    <Label className="text-gray-300 mb-2 block">Etapa *</Label>
                    <Select
                      value={formData.etapa_id}
                      onValueChange={(value) => setFormData({ ...formData, etapa_id: value, division_id: '' })}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Seleccionar etapa" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {etapasActivas.map((etapa) => (
                          <SelectItem key={etapa.id} value={etapa.id} className="text-white hover:bg-gray-700">
                            {etapa.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {etapaSeleccionada && (
                      <div className="mt-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatDate(etapaSeleccionada.fecha_inicio)} - {etapaSeleccionada.fecha_fin ? formatDate(etapaSeleccionada.fecha_fin) : 'En curso'}
                      </div>
                    )}
                  </div>

                  {/* División */}
                  <div>
                    <Label className="text-gray-300 mb-2 block">División *</Label>
                    <Select
                      value={formData.division_id}
                      onValueChange={(value) => setFormData({ ...formData, division_id: value })}
                      disabled={!formData.etapa_id}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Seleccionar división" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {divisiones.map((division) => (
                          <SelectItem key={division.id} value={division.id} className="text-white hover:bg-gray-700">
                            {division.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {divisionSeleccionada && divisionSeleccionada.descripcion && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-400">{divisionSeleccionada.descripcion}</p>
                      </div>
                    )}
                  </div>

                  {/* Información del usuario */}
                  {usuario && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-2">Datos de inscripción</h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p><strong>Nombre:</strong> {usuario.nombre} {usuario.apellido}</p>
                        <p><strong>Email:</strong> {usuario.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Botón de envío */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={submitting || !formData.etapa_id || !formData.division_id}
                      className="flex-1 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Inscribirme
                        </>
                      )}
                    </Button>
                    <Link href="/circuitooka">
                      <Button type="button" variant="outline" className="border-gray-600 text-gray-300">
                        Cancelar
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Información adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-[#E2FF1B]" />
                Información Importante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-[#E2FF1B] mt-0.5 flex-shrink-0" />
                  <span>Al inscribirte, aceptas participar en los partidos organizados por el circuito.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-[#E2FF1B] mt-0.5 flex-shrink-0" />
                  <span>Tu disponibilidad se gestiona externamente por WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-[#E2FF1B] mt-0.5 flex-shrink-0" />
                  <span>Los ascensos y descensos se procesan al finalizar cada etapa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-[#E2FF1B] mt-0.5 flex-shrink-0" />
                  <span>Las Divisiones 1 y 2 son exclusivas y se gestionan desde el panel de administración.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

