"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import HtmlContent from '@/components/ui/html-content'
import DescriptionCard from '@/components/ui/description-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Users, Calendar, MapPin, DollarSign, Upload, AlertCircle, CheckCircle, Clock, LogIn, Search, Plus, User, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/AuthProvider'

export default function LigaInscripcionPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [liga, setLiga] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    titular_1_email: '',
    titular_1_nombre: '',
    titular_1_apellido: '',
    titular_1_id: null,
    titular_2_email: '',
    titular_2_nombre: '',
    titular_2_apellido: '',
    titular_2_id: null,
    suplente_1_email: '',
    suplente_1_nombre: '',
    suplente_1_apellido: '',
    suplente_1_id: null,
    suplente_2_email: '',
    suplente_2_nombre: '',
    suplente_2_apellido: '',
    suplente_2_id: null,
    liga_categoria_id: '',
    contacto_celular: '',
    aclaraciones: ''
  })
  const [comprobanteFile, setComprobanteFile] = useState(null)
  const [jugadoresEncontrados, setJugadoresEncontrados] = useState({})
  
  // Nuevo estado para manejar las posiciones de los jugadores
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState({
    titular_2: null,
    suplente_1: null,
    suplente_2: null
  })
  
  // Estados para la búsqueda de jugadores
  const [emailBusqueda, setEmailBusqueda] = useState('')
  const [jugadorEncontrado, setJugadorEncontrado] = useState(null)
  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: '',
    apellido: ''
  })

  // Verificar autenticación
  useEffect(() => {
    if (!user) {
      toast({
        title: "Acceso denegado",
        description: "Debes iniciar sesión para acceder a esta página",
        variant: "destructive"
      })
      router.push('/inscripciones/ligas')
      return
    }
  }, [user, router, toast])

  useEffect(() => {
    if (id && user) {
      fetchLigaData()
    }
  }, [id, user])

  // Auto-asignar usuario logueado como titular 1
  useEffect(() => {
    if (user && user.email && !formData.titular_1_id) {
      // Buscar si el usuario ya existe como jugador
      const buscarUsuarioJugador = async () => {
        try {
          const { data, error } = await supabase
            .from('jugador')
            .select('*')
            .eq('email', user.email.toLowerCase())
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Error buscando jugador:', error)
            return
          }

          if (data) {
            // Usuario encontrado como jugador, auto-asignar como titular 1
            setJugadoresEncontrados(prev => ({
              ...prev,
              titular_1: { ...data, encontrado: true }
            }))
            
            setFormData(prev => ({
              ...prev,
              titular_1_email: user.email,
              titular_1_id: data.id,
              titular_1_nombre: data.nombre,
              titular_1_apellido: data.apellido || ''
            }))

            toast({
              title: "Auto-asignado como Titular 1",
              description: `${data.nombre} ${data.apellido || ''}`,
              variant: "default"
            })
          } else {
            // Usuario no encontrado como jugador, crear uno nuevo
            const { data: nuevoJugador, error: crearError } = await supabase
              .from('jugador')
              .insert({
                email: user.email.toLowerCase(),
                nombre: user.user_metadata?.full_name || user.email?.split('@')[0],
                apellido: '',
                ranking_puntos: 0
              })
              .select()
              .single()

            if (crearError) {
              console.error('Error creando jugador:', crearError)
              return
            }

            setJugadoresEncontrados(prev => ({
              ...prev,
              titular_1: { ...nuevoJugador, encontrado: true }
            }))
            
            setFormData(prev => ({
              ...prev,
              titular_1_email: user.email,
              titular_1_id: nuevoJugador.id,
              titular_1_nombre: nuevoJugador.nombre,
              titular_1_apellido: nuevoJugador.apellido || ''
            }))

            toast({
              title: "Auto-asignado como Titular 1",
              description: `${nuevoJugador.nombre} ${nuevoJugador.apellido || ''}`,
              variant: "default"
            })
          }
        } catch (error) {
          console.error('Error en auto-asignación:', error)
        }
      }

      buscarUsuarioJugador()
    }
  }, [user, toast, formData.titular_1_id])

  const fetchLigaData = async () => {
    try {
      // Obtener datos de la liga
      const { data: ligaData, error: ligaError } = await supabase
        .from('ligas')
        .select('*')
        .eq('id', id)
        .single()

      if (ligaError) throw ligaError

      // Obtener categorías de la liga con información de inscripciones
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('liga_categorias')
        .select(`
          *,
          ligainscripciones (id, estado)
        `)
        .eq('liga_id', id)

      if (categoriasError) throw categoriasError

      // Procesar categorías para incluir información de disponibilidad (solo inscripciones aprobadas)
      const categoriasProcesadas = categoriasData.map(cat => {
        const inscripcionesAprobadas = cat.ligainscripciones?.filter(ins => ins.estado === 'aprobada')?.length || 0
        return {
          ...cat,
          inscripcionesActuales: inscripcionesAprobadas,
          disponible: inscripcionesAprobadas < cat.max_inscripciones
        }
      })

      setLiga(ligaData)
      setCategorias(categoriasProcesadas)
    } catch (error) {
      console.error('Error fetching liga data:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la liga",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const buscarJugador = async (email) => {
    if (!email) return

    try {
      const { data, error } = await supabase
        .from('jugador')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // Jugador encontrado - mostrar opciones de posición
        toast({
          title: "Jugador encontrado",
          description: `${data.nombre} ${data.apellido || ''} - Selecciona una posición`,
          variant: "default"
        })
        
        // Retornar el jugador para que se pueda asignar a una posición
        return data
      } else {
        // Jugador no encontrado - permitir crear nuevo
        toast({
          title: "Jugador no encontrado",
          description: "Completa los datos para crear un nuevo jugador",
          variant: "default"
        })
        
        // Retornar un objeto con el email para crear nuevo jugador
        return { email: email.toLowerCase(), nuevo: true }
      }
    } catch (error) {
      console.error('Error buscando jugador:', error)
      toast({
        title: "Error",
        description: "Error al buscar jugador",
        variant: "destructive"
      })
      return null
    }
  }

  const crearJugador = async (email, nombre, apellido) => {
    try {
      const { data, error } = await supabase
        .from('jugador')
        .insert({
          email: email.toLowerCase(),
          nombre,
          apellido,
          ranking_puntos: 0
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error creando jugador:', error)
      throw error
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Función para asignar un jugador a una posición
  const asignarJugadorAPosicion = (jugador, posicion) => {
    // Limpiar la posición anterior si el jugador ya estaba asignado
    const posicionAnterior = Object.keys(jugadoresSeleccionados).find(
      pos => jugadoresSeleccionados[pos]?.email === jugador.email
    )
    
    if (posicionAnterior) {
      setJugadoresSeleccionados(prev => ({
        ...prev,
        [posicionAnterior]: null
      }))
      
      // Limpiar datos del formulario de la posición anterior
      setFormData(prev => ({
        ...prev,
        [`${posicionAnterior}_email`]: '',
        [`${posicionAnterior}_nombre`]: '',
        [`${posicionAnterior}_apellido`]: '',
        [`${posicionAnterior}_id`]: null
      }))
      
      setJugadoresEncontrados(prev => ({
        ...prev,
        [posicionAnterior]: null
      }))
    }

    // Asignar el jugador a la nueva posición
    setJugadoresSeleccionados(prev => ({
      ...prev,
      [posicion]: jugador
    }))
    
    // Actualizar datos del formulario
    setFormData(prev => ({
      ...prev,
      [`${posicion}_email`]: jugador.email,
      [`${posicion}_nombre`]: jugador.nombre,
      [`${posicion}_apellido`]: jugador.apellido || '',
      [`${posicion}_id`]: jugador.id
    }))
    
    setJugadoresEncontrados(prev => ({
      ...prev,
      [posicion]: { ...jugador, encontrado: true }
    }))

    toast({
      title: "Jugador asignado",
      description: `${jugador.nombre} ${jugador.apellido || ''} asignado como ${posicion.replace('_', ' ')}`,
      variant: "default"
    })
  }

  // Función para quitar un jugador de una posición
  const quitarJugadorDePosicion = (posicion) => {
    setJugadoresSeleccionados(prev => ({
      ...prev,
      [posicion]: null
    }))
    
    // Limpiar datos del formulario
    setFormData(prev => ({
      ...prev,
      [`${posicion}_email`]: '',
      [`${posicion}_nombre`]: '',
      [`${posicion}_apellido`]: '',
      [`${posicion}_id`]: null
    }))
    
    setJugadoresEncontrados(prev => ({
      ...prev,
      [posicion]: null
    }))

    toast({
      title: "Jugador removido",
      description: `Jugador removido de la posición ${posicion.replace('_', ' ')}`,
      variant: "default"
    })
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 1024 * 1024 * 1024) { // 1GB
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 1GB.",
          variant: "destructive"
        })
        return
      }
      setComprobanteFile(file)
    }
  }

  const uploadFile = async (file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `comprobantes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('liga-inscripciones')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('liga-inscripciones')
        .getPublicUrl(filePath)

      return { url: publicUrl, filename: fileName }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar campos requeridos
      const requiredFields = [
        'titular_1_email', 'titular_2_email', 'suplente_1_email', 'suplente_2_email',
        'liga_categoria_id', 'contacto_celular'
      ]

      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`El campo ${field} es requerido`)
        }
      }

      // Validar que todos los jugadores estén asignados
      const jugadoresRequeridos = ['titular_2', 'suplente_1', 'suplente_2']
      for (const posicion of jugadoresRequeridos) {
        if (!jugadoresSeleccionados[posicion]) {
          throw new Error(`Debes asignar un jugador como ${posicion.replace('_', ' ')}`)
        }
      }

      if (!comprobanteFile) {
        throw new Error('Debe subir un comprobante de pago')
      }

      // Verificar que la categoría aún esté disponible
      const categoriaSeleccionada = categorias.find(cat => cat.id === parseInt(formData.liga_categoria_id))
      if (!categoriaSeleccionada || !categoriaSeleccionada.disponible) {
        throw new Error('La categoría seleccionada ya no está disponible')
      }

      // Obtener IDs de los jugadores asignados
      const jugadoresIds = {
        titular_1: formData.titular_1_id, // El usuario logueado
        titular_2: jugadoresSeleccionados.titular_2.id,
        suplente_1: jugadoresSeleccionados.suplente_1.id,
        suplente_2: jugadoresSeleccionados.suplente_2.id
      }

      // Subir archivo
      const fileData = await uploadFile(comprobanteFile)

      // Guardar inscripción en la base de datos
      const { error } = await supabase
        .from('ligainscripciones')
        .insert({
          liga_categoria_id: parseInt(formData.liga_categoria_id),
          titular_1_id: jugadoresIds.titular_1,
          titular_2_id: jugadoresIds.titular_2,
          suplente_1_id: jugadoresIds.suplente_1,
          suplente_2_id: jugadoresIds.suplente_2,
          contacto_celular: formData.contacto_celular,
          aclaraciones: formData.aclaraciones,
          comprobante_url: fileData.url,
          comprobante_filename: fileData.filename
        })

      if (error) {
        if (error.message.includes('máximo')) {
          throw new Error('Esta categoría ya alcanzó el máximo de inscripciones permitidas')
        }
        throw error
      }

      toast({
        title: "¡Inscripción exitosa!",
        description: "Tu inscripción ha sido enviada. Te contactaremos pronto.",
        variant: "default"
      })

      // Recargar datos para actualizar contadores
      await fetchLigaData()

      // Redirigir a la página de ligas
      router.push('/inscripciones/ligas')
      setFormData(prev => ({
        ...prev,
        titular_2_email: '',
        titular_2_nombre: '',
        titular_2_apellido: '',
        titular_2_id: null,
        suplente_1_email: '',
        suplente_1_nombre: '',
        suplente_1_apellido: '',
        suplente_1_id: null,
        suplente_2_email: '',
        suplente_2_nombre: '',
        suplente_2_apellido: '',
        suplente_2_id: null,
        liga_categoria_id: '',
        contacto_celular: '',
        aclaraciones: ''
      }))
      setComprobanteFile(null)
      setJugadoresEncontrados({})
      setJugadoresSeleccionados({
        titular_2: null,
        suplente_1: null,
        suplente_2: null
      })
      setEmailBusqueda('')
      setJugadorEncontrado(null)
      setNuevoJugador({ nombre: '', apellido: '' })

      // Recargar datos para actualizar contadores
      await fetchLigaData()

    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: error.message || "Hubo un error al enviar la inscripción",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatText = (text) => {
    if (!text) return ''
    // Convertir \n literales a saltos de línea reales
    return text.replace(/\\n/g, '\n')
  }

  const renderJugadorSection = (tipo, titulo) => {
    const jugador = jugadoresEncontrados[tipo]
    const email = formData[`${tipo}_email`]
    const nombre = formData[`${tipo}_nombre`]
    const apellido = formData[`${tipo}_apellido`]
    
    // Verificar si es titular 1 y el usuario está logueado
    const esTitular1Logueado = tipo === 'titular_1' && user && user.email === email

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
          {titulo} *
          {esTitular1Logueado && (
            <Badge className="ml-2 bg-[#E2FF1B] text-black text-xs">
              <User className="w-3 h-3 mr-1" />
              Tú
            </Badge>
          )}
        </h3>
        
        {/* Email y búsqueda */}
        <div className="space-y-2">
          <Label htmlFor={`${tipo}_email`} className="text-white">Email {titulo} *</Label>
          <div className="flex gap-2">
            <Input
              id={`${tipo}_email`}
              type="email"
              value={email}
              onChange={(e) => handleInputChange(`${tipo}_email`, e.target.value)}
              className="bg-white/10 border-white/20 text-white flex-1"
              placeholder="jugador@email.com"
              required
              disabled={esTitular1Logueado}
            />
            <Button
              type="button"
              onClick={() => buscarJugador(email, tipo)}
              disabled={!email || esTitular1Logueado}
              className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 h-10"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Resultado de búsqueda */}
        {jugador && (
          <div className={`p-3 rounded-lg border ${
            jugador.encontrado 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}>
            {jugador.encontrado ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Jugador encontrado: {jugador.nombre} {jugador.apellido || ''}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400">
                <Plus className="w-4 h-4" />
                <span>Crear nuevo jugador</span>
              </div>
            )}
          </div>
        )}

        {/* Campos para nuevo jugador */}
        {jugador && !jugador.encontrado && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${tipo}_nombre`} className="text-white">Nombre *</Label>
              <Input
                id={`${tipo}_nombre`}
                value={nombre}
                onChange={(e) => handleInputChange(`${tipo}_nombre`, e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                required
                disabled={esTitular1Logueado}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${tipo}_apellido`} className="text-white">Apellido</Label>
              <Input
                id={`${tipo}_apellido`}
                value={apellido}
                onChange={(e) => handleInputChange(`${tipo}_apellido`, e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                disabled={esTitular1Logueado}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Nueva función para renderizar la sección de selección de jugadores
  const renderSeleccionJugadores = () => {
    const handleBuscarJugador = async () => {
      if (!emailBusqueda) return
      
      const jugador = await buscarJugador(emailBusqueda)
      setJugadorEncontrado(jugador)
    }

    const getPosicionesDisponibles = () => {
      const posiciones = [
        { key: 'titular_2', label: 'Titular 2' },
        { key: 'suplente_1', label: 'Suplente 1' },
        { key: 'suplente_2', label: 'Suplente 2' }
      ]
      
      return posiciones.filter(pos => !jugadoresSeleccionados[pos.key])
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
          Selección de Jugadores
        </h3>

        {/* Búsqueda de jugadores */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Buscar jugador por email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={emailBusqueda}
                onChange={(e) => setEmailBusqueda(e.target.value)}
                className="bg-white/10 border-white/20 text-white flex-1"
                placeholder="jugador@email.com"
              />
              <Button
                type="button"
                onClick={handleBuscarJugador}
                disabled={!emailBusqueda}
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 h-10"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Resultado de búsqueda y opciones de posición */}
          {jugadorEncontrado && (
            <div className={`rounded-lg p-4 border ${
              jugadorEncontrado.nuevo 
                ? 'bg-yellow-500/10 border-yellow-500/20' 
                : 'bg-green-500/10 border-green-500/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {jugadorEncontrado.nuevo ? (
                    <>
                      <Plus className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium text-yellow-400">Crear nuevo jugador</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="font-medium text-green-400">{jugadorEncontrado.nombre} {jugadorEncontrado.apellido || ''}</span>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setJugadorEncontrado(null)
                    setEmailBusqueda('')
                    setNuevoJugador({ nombre: '', apellido: '' })
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {jugadorEncontrado.nuevo ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Nombre *</Label>
                      <Input
                        value={nuevoJugador.nombre}
                        onChange={(e) => setNuevoJugador(prev => ({ ...prev, nombre: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Nombre del jugador"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Apellido</Label>
                      <Input
                        value={nuevoJugador.apellido}
                        onChange={(e) => setNuevoJugador(prev => ({ ...prev, apellido: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Apellido del jugador"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">Crear y asignar como:</p>
                    <div className="flex flex-wrap gap-2">
                      {getPosicionesDisponibles().map((posicion) => (
                        <Button
                          key={posicion.key}
                          type="button"
                          onClick={async () => {
                            if (!nuevoJugador.nombre) {
                              toast({
                                title: "Error",
                                description: "El nombre es obligatorio",
                                variant: "destructive"
                              })
                              return
                            }
                            
                            try {
                              const jugadorCreado = await crearJugador(
                                jugadorEncontrado.email,
                                nuevoJugador.nombre,
                                nuevoJugador.apellido
                              )
                              
                              asignarJugadorAPosicion(jugadorCreado, posicion.key)
                              setJugadorEncontrado(null)
                              setEmailBusqueda('')
                              setNuevoJugador({ nombre: '', apellido: '' })
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Error al crear el jugador",
                                variant: "destructive"
                              })
                            }
                          }}
                          className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                          size="sm"
                          disabled={!nuevoJugador.nombre}
                        >
                          {posicion.label}
                        </Button>
                      ))}
                      {getPosicionesDisponibles().length === 0 && (
                        <p className="text-sm text-yellow-400">Todas las posiciones están ocupadas</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Asignar como:</p>
                  <div className="flex flex-wrap gap-2">
                    {getPosicionesDisponibles().map((posicion) => (
                      <Button
                        key={posicion.key}
                        type="button"
                        onClick={() => {
                          asignarJugadorAPosicion(jugadorEncontrado, posicion.key)
                          setJugadorEncontrado(null)
                          setEmailBusqueda('')
                        }}
                        className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                        size="sm"
                      >
                        {posicion.label}
                      </Button>
                    ))}
                    {getPosicionesDisponibles().length === 0 && (
                      <p className="text-sm text-yellow-400">Todas las posiciones están ocupadas</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Jugadores asignados */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Jugadores Asignados</h4>
          
          {Object.entries(jugadoresSeleccionados).map(([posicion, jugador]) => (
            <div key={posicion} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#E2FF1B] text-black text-xs">
                      {posicion.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    <span className="text-white font-medium">
                      {jugador ? `${jugador.nombre} ${jugador.apellido || ''}` : 'Sin asignar'}
                    </span>
                  </div>
                  {jugador && (
                    <p className="text-sm text-gray-400 mt-1">{jugador.email}</p>
                  )}
                </div>
                {jugador && (
                  <Button
                    type="button"
                    onClick={() => quitarJugadorDePosicion(posicion)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#E2FF1B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Cargando información de la liga...</p>
        </div>
      </div>
    )
  }

  if (!liga) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Liga no encontrada</h3>
          <p className="text-gray-400 mb-6">La liga que buscas no existe o ha sido eliminada</p>
          <Link href="/inscripciones/ligas">
            <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
              Volver a Ligas
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const ligaDisponible = liga.estado === 'abierta' && categorias.some(cat => cat.disponible)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="container mx-auto">
          <Link href="/inscripciones/ligas" className="inline-flex items-center gap-2 text-[#E2FF1B] hover:text-[#E2FF1B]/80 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver a Ligas
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="text-[#E2FF1B]">{liga.nombre}</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {/* Descripción de la Liga */}
          <div className="lg:col-span-3">
            <DescriptionCard content={liga.descripcion} />
          </div>
          {/* Información de la Liga */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-white/10 sticky top-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-[#E2FF1B]" />
                  Información de la Liga
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="font-semibold">Inicio</p>
                      <p className="text-sm">{formatDate(liga.fecha_inicio)}</p>
                    </div>
                  </div>
                  
                  {liga.formato && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Users className="w-5 h-5 text-[#E2FF1B]" />
                      <div>
                        <p className="font-semibold">Formato</p>
                        <p className="text-sm">{liga.formato}</p>
                      </div>
                    </div>
                  )}
                  
                  {liga.horarios && (
                    <div className="flex items-start gap-3 text-gray-300">
                      <Clock className="w-5 h-5 text-[#E2FF1B] mt-1" />
                      <div>
                        <p className="font-semibold">Horarios</p>
                        <div className="text-sm">
                          <HtmlContent content={liga.horarios} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {liga.costo_inscripcion && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <DollarSign className="w-5 h-5 text-[#E2FF1B]" />
                      <div>
                        <p className="font-semibold">Costos</p>
                        <p className="text-sm">Inscripción ${liga.costo_inscripcion.toLocaleString()} por equipo</p>
                        {liga.costo_partido && (
                          <p className="text-sm">Partido ${liga.costo_partido.toLocaleString()} por jugador</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Categorías Disponibles */}
                <div className="bg-[#E2FF1B]/10 border border-[#E2FF1B]/20 rounded-lg p-4">
                  <h4 className="font-semibold text-[#E2FF1B] mb-3">Categorías Disponibles</h4>
                  <div className="space-y-2">
                    {categorias.map((categoria) => (
                      <div key={categoria.id} className="flex justify-between items-center text-sm">
                        <span className="text-white font-medium">{categoria.categoria}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">
                            {categoria.inscripcionesActuales}/{categoria.max_inscripciones}
                          </span>
                          <Badge 
                            variant={categoria.disponible ? 'default' : 'secondary'}
                            className={categoria.disponible ? 'bg-green-500' : 'bg-red-500'}
                          >
                            {categoria.disponible ? 'Disponible' : 'Completa'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {liga.cronograma && (
                  <div className="bg-[#E2FF1B]/10 border border-[#E2FF1B]/20 rounded-lg p-4">
                    <h4 className="font-semibold text-[#E2FF1B] mb-2">Cronograma</h4>
                    <div className="text-sm text-gray-300">
                      <HtmlContent content={liga.cronograma} />
                    </div>
                  </div>
                )}

                {liga.importante && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Importante
                    </h4>
                    <div className="text-sm text-gray-300">
                      <HtmlContent content={liga.importante} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulario de Inscripción */}
          <div className="lg:col-span-2">
            {!ligaDisponible ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {liga.estado === 'cerrada' ? 'Inscripciones Cerradas' : 'Todas las Categorías Completas'}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {liga.estado === 'cerrada' 
                      ? 'Las inscripciones para esta liga han sido cerradas.'
                      : 'Todas las categorías de esta liga han alcanzado su cupo máximo.'
                    }
                  </p>
                  <Link href="/inscripciones/ligas">
                    <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                      Ver Otras Ligas
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white">Formulario de Inscripción</CardTitle>
                  <CardDescription className="text-gray-400">
                    Busca jugadores existentes por email o crea nuevos jugadores para tu equipo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Titular 1 (Usuario logueado) */}
                    {renderJugadorSection('titular_1', 'Titular 1')}

                    {/* Selección de otros jugadores */}
                    {renderSeleccionJugadores()}

                    {/* Categoría y Contacto */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoria" className="text-white">Categoría *</Label>
                        <Select value={formData.liga_categoria_id} onValueChange={(value) => handleInputChange('liga_categoria_id', value)} required>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-white/20">
                            {categorias
                              .filter(cat => cat.disponible)
                              .map((categoria) => (
                                <SelectItem 
                                  key={categoria.id} 
                                  value={categoria.id.toString()} 
                                  className="text-white hover:bg-[#E2FF1B]/10 focus:bg-[#E2FF1B]/10"
                                >
                                  {categoria.categoria} ({categoria.inscripcionesActuales}/{categoria.max_inscripciones})
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contacto_celular" className="text-white">Contacto/Celular *</Label>
                        <Input
                          id="contacto_celular"
                          type="tel"
                          value={formData.contacto_celular}
                          onChange={(e) => handleInputChange('contacto_celular', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="+54 9 11 1234-5678"
                          required
                        />
                      </div>
                    </div>

                    {/* Comprobante de Pago */}
                    <div className="space-y-2">
                      <Label htmlFor="comprobante" className="text-white">Comprobante de Inscripción (Transferencia) *</Label>
                      <div className="bg-[#E2FF1B]/10 border border-[#E2FF1B]/20 rounded-lg p-4">
                        <p className="text-sm text-[#E2FF1B] mb-2">
                          <strong>Alias:</strong> stefanolorenzo
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                          Sube 1 archivo compatible. Tamaño máximo: 1 GB.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            id="comprobante"
                            type="file"
                            onChange={handleFileChange}
                            className="bg-white/10 border-white/20 text-white file:bg-[#E2FF1B] file:text-black file:border-0 file:rounded file:px-4 file:py-2 file:cursor-pointer file:mr-4 file:font-medium hover:file:bg-[#E2FF1B]/90 transition-colors"
                            accept="image/*,.pdf,.doc,.docx"
                            required
                          />
                          {comprobanteFile && (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        {comprobanteFile && (
                          <p className="text-sm text-gray-300 mt-2">
                            Archivo seleccionado: {comprobanteFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Aclaraciones */}
                    <div className="space-y-2">
                      <Label htmlFor="aclaraciones" className="text-white">Aclaraciones</Label>
                      <Textarea
                        id="aclaraciones"
                        value={formData.aclaraciones}
                        onChange={(e) => handleInputChange('aclaraciones', e.target.value)}
                        className="bg-white/10 border-white/20 text-white min-h-[100px]"
                        placeholder="Información adicional o aclaraciones sobre tu inscripción..."
                      />
                    </div>

                    {/* Botón de Envío */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors py-3 text-lg font-semibold"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          Enviando inscripción...
                        </div>
                      ) : (
                        'Enviar Inscripción'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 