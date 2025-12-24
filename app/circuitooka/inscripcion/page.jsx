'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Trophy,
  ArrowLeft,
  ArrowRight,
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
  const [inscripcionesUsuario, setInscripcionesUsuario] = useState([])

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

  useEffect(() => {
    if (usuario) {
      fetchInscripcionesUsuario()
    }
  }, [usuario])

  useEffect(() => {
    if (formData.etapa_id) {
      verificarInscripcion()
    }
  }, [formData.etapa_id])

  // Limpiar división seleccionada si está inscripta en la etapa actual
  useEffect(() => {
    if (formData.etapa_id && formData.division_id && inscripcionesUsuario.length > 0) {
      const inscripto = inscripcionesUsuario.some(
        ins => ins.etapa_id === formData.etapa_id && ins.division_id === formData.division_id && ins.estado === 'activa'
      )
      if (inscripto) {
        setFormData(prev => ({ ...prev, division_id: '' }))
        toast({
          title: 'División no disponible',
          description: 'Ya estás inscripto en esta división para esta etapa',
          variant: 'destructive'
        })
      }
    }
  }, [formData.etapa_id, inscripcionesUsuario])

  useEffect(() => {
    if (usuario && formData.etapa_id) {
      fetchInscripcionesUsuario()
    }
  }, [usuario, formData.etapa_id])

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

  const fetchInscripcionesUsuario = async () => {
    if (!usuario) return

    try {
      const { data, error } = await supabase
        .from('circuitooka_inscripciones')
        .select('*')
        .eq('usuario_id', usuario.id)
        .eq('estado', 'activa')

      if (error) throw error
      setInscripcionesUsuario(data || [])
    } catch (error) {
      console.error('Error obteniendo inscripciones del usuario:', error)
    }
  }

  const verificarInscripcion = async () => {
    if (!usuario || !formData.etapa_id) return

    try {
      // Buscar TODAS las inscripciones activas en esta etapa (no solo una)
      const { data, error } = await supabase
        .from('circuitooka_inscripciones')
        .select('*')
        .eq('etapa_id', formData.etapa_id)
        .eq('usuario_id', usuario.id)
        .eq('estado', 'activa')

      if (error) throw error

      if (data && data.length > 0) {
        setYaInscripto(true)
        // Si hay múltiples inscripciones, tomar la primera para mostrar
        setInscripcionExistente(data[0])
      } else {
        setYaInscripto(false)
        setInscripcionExistente(null)
      }
    } catch (error) {
      console.error('Error verificando inscripción:', error)
    }
  }

  // Verificar si el usuario está inscripto en una división específica
  const estaInscriptoEnDivision = (divisionId) => {
    if (!formData.etapa_id) return false
    return inscripcionesUsuario.some(
      ins => ins.etapa_id === formData.etapa_id && ins.division_id === divisionId && ins.estado === 'activa'
    )
  }

  // Verificar si el usuario ya está inscripto en alguna división de esta etapa
  const estaInscriptoEnEtapa = () => {
    if (!formData.etapa_id) return false
    return inscripcionesUsuario.some(
      ins => ins.etapa_id === formData.etapa_id && ins.estado === 'activa'
    )
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

    // Verificar si ya está inscripto en alguna división de esta etapa
    if (estaInscriptoEnEtapa()) {
      toast({
        title: 'Error',
        description: 'Ya estás inscripto en una división de esta etapa. No puedes inscribirte en múltiples divisiones de la misma etapa.',
        variant: 'destructive'
      })
      return
    }

    // Verificar si ya está inscripto en esta división específica
    if (estaInscriptoEnDivision(formData.division_id)) {
      toast({
        title: 'Error',
        description: 'Ya estás inscripto en esta división para esta etapa',
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">Inscripción a Circuitooka</h1>
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
            <Card className="bg-green-900/20 border-green-500/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">¡Ya estás inscripto!</h3>
                    <p className="text-gray-300">
                      Tienes una inscripción activa en esta etapa.
                    </p>
                  </div>
                  <Link href="/circuitooka/partidos">
                    <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 w-full sm:w-auto">
                      Ver mis partidos
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
                <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center gap-2 break-words">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
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
                    {estaInscriptoEnEtapa() ? (
                      <Alert className="bg-yellow-900/20 border-yellow-500/50">
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                        <AlertTitle className="text-yellow-300">Ya estás inscripto</AlertTitle>
                        <AlertDescription className="text-yellow-200">
                          Ya tienes una inscripción activa en esta etapa. No puedes inscribirte en múltiples divisiones de la misma etapa.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <Select
                          value={formData.division_id}
                          onValueChange={(value) => setFormData({ ...formData, division_id: value })}
                          disabled={!formData.etapa_id}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Seleccionar división" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {divisiones.map((division) => {
                              const inscripto = estaInscriptoEnDivision(division.id)
                              return (
                                <SelectItem 
                                  key={division.id} 
                                  value={division.id} 
                                  disabled={inscripto}
                                  className={`${
                                    inscripto 
                                      ? 'text-gray-500 cursor-not-allowed opacity-50' 
                                      : 'text-white hover:bg-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{division.nombre}</span>
                                    {inscripto && (
                                      <Badge variant="outline" className="ml-2 bg-green-900/20 border-green-500/30 text-green-400 text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Ya inscripto
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        {divisionSeleccionada && divisionSeleccionada.descripcion && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-400">{divisionSeleccionada.descripcion}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Información del usuario */}
                  {usuario && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="text-white text-sm sm:text-base font-semibold mb-2 break-words">Datos de inscripción</h3>
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
                      disabled={
                        submitting || 
                        !formData.etapa_id || 
                        !formData.division_id || 
                        estaInscriptoEnEtapa() ||
                        estaInscriptoEnDivision(formData.division_id)
                      }
                      className="flex-1 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <CardTitle className="text-white text-base sm:text-lg md:text-xl flex items-center gap-2 break-words">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
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
                  <span>Las Divisiones 1 y 2 son exclusivas.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

