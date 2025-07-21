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
    titular_1_dni: '',
    titular_1_id: null,
    titular_2_email: '',
    titular_2_nombre: '',
    titular_2_apellido: '',
    titular_2_dni: '',
    titular_2_id: null,
    suplente_1_email: '',
    suplente_1_nombre: '',
    suplente_1_apellido: '',
    suplente_1_dni: '',
    suplente_1_id: null,
    suplente_2_email: '',
    suplente_2_nombre: '',
    suplente_2_apellido: '',
    suplente_2_dni: '',
    suplente_2_id: null,
    liga_categoria_id: '',
    contacto_celular: '',
    aclaraciones: ''
  })
  const [comprobanteFile, setComprobanteFile] = useState(null)
  const [jugadoresEncontrados, setJugadoresEncontrados] = useState({})
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Nuevo estado para manejar las posiciones de los jugadores
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState({
    titular_2: null,
    suplente_1: null,
    suplente_2: null
  })
  
  // Estados para la búsqueda de usuarios
  const [busqueda, setBusqueda] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState('email') // 'email' o 'dni'
  const [usuariosEncontrados, setUsuariosEncontrados] = useState([])
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [jugadorEncontrado, setJugadorEncontrado] = useState(null)
  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: ''
  })
  const [dniConfigurado, setDniConfigurado] = useState(false)
  const [verificandoDNI, setVerificandoDNI] = useState(true)
  const [creandoUsuario, setCreandoUsuario] = useState(false)
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([])
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false)

  // 1. Agregar estado para advertencia y bloqueo
  const [bloquearPorInscripcion, setBloquearPorInscripcion] = useState({
    bloquear: false,
    mensaje: ''
  })

  // Estado para verificar si el usuario ya está inscripto en esta liga específica
  const [yaInscriptoEnLiga, setYaInscriptoEnLiga] = useState({
    inscripto: false,
    mensaje: '',
    inscripcion: null
  })

  // Verificar autenticación y DNI
  useEffect(() => {
    const verificarAutenticacionYDNI = async () => {
      try {
        setVerificandoDNI(true)
        
        // Verificar autenticación
        if (!user) {
          toast({
            title: "Acceso denegado",
            description: "Debes iniciar sesión para acceder a esta página",
            variant: "destructive"
          })
          router.push('/inscripciones/ligas')
          return
        }

        // Verificar si el usuario tiene DNI configurado
        const { data: usuario, error: usuarioError } = await supabase
          .from('usuarios')
          .select('dni, nombre, apellido')
          .eq('email', user.email.toLowerCase())
          .single()

        if (usuarioError && usuarioError.code !== 'PGRST116') {
          console.error('Error verificando usuario:', usuarioError)
          setDniConfigurado(false)
          setVerificandoDNI(false)
          return
        }

        // Si no existe el usuario o no tiene DNI
        if (!usuario || !usuario.dni || usuario.dni.toString().trim() === '') {
          setDniConfigurado(false)
          setVerificandoDNI(false)
          return
        }

        // DNI configurado correctamente
        setDniConfigurado(true)
        setVerificandoDNI(false)
        
      } catch (error) {
        console.error('Error en verificación de DNI:', error)
        setDniConfigurado(false)
        setVerificandoDNI(false)
      }
    }

    if (user) {
      verificarAutenticacionYDNI()
    }
  }, [user, router, toast])

  useEffect(() => {
    if (id && user && !verificandoDNI) {
      fetchLigaData()
      verificarInscripcionEnLiga()
      cargarTodosLosUsuarios()
    }
  }, [id, user, verificandoDNI])

  // Función para verificar si el usuario ya está inscripto en esta liga específica
  const verificarInscripcionEnLiga = async () => {
    if (!user || !id) return

    try {
      // Buscar el usuario en la base de datos
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, dni')
        .eq('email', user.email.toLowerCase())
        .single()

      if (usuarioError && usuarioError.code !== 'PGRST116') {
        console.error('Error buscando usuario:', usuarioError)
        return
      }

      if (!usuario) return

      // Buscar inscripciones en esta liga específica donde el usuario participe
      const { data: inscripciones, error: inscripcionesError } = await supabase
        .from('ligainscripciones')
        .select(`
          id,
          estado,
          liga_categorias!inner(
            categoria,
            ligas!inner(
              id,
              nombre
            )
          )
        `)
        .eq('liga_categorias.ligas.id', id)
        .or(`titular_1_id.eq.${usuario.id},titular_2_id.eq.${usuario.id},suplente_1_id.eq.${usuario.id},suplente_2_id.eq.${usuario.id}`)

      if (inscripcionesError) {
        console.error('Error verificando inscripciones en liga:', inscripcionesError)
        return
      }

      if (inscripciones && inscripciones.length > 0) {
        const inscripcion = inscripciones[0]
        setYaInscriptoEnLiga({
          inscripto: true,
          mensaje: `Tu inscripción en la categoría ${inscripcion.liga_categorias.categoria} está ${inscripcion.estado === 'pendiente' ? 'en revisión' : inscripcion.estado}. Te contactaremos cuando sea procesada.`,
          inscripcion: inscripcion
        })
      }
    } catch (error) {
      console.error('Error verificando inscripción en liga:', error)
    }
  }

  // 2. Modificar el useEffect de autoasignación para buscar por email y DNI
  useEffect(() => {
    if (user && user.email && !formData.titular_1_id && !verificandoDNI) {
      const buscarUsuario = async () => {
        try {
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', user.email.toLowerCase())
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Error buscando usuario:', error)
            return
          }

          if (data) {
            // Buscar inscripciones por email o DNI
            let filtros = []
            if (data.id) filtros.push(`titular_1_id.eq.${data.id},titular_2_id.eq.${data.id},suplente_1_id.eq.${data.id},suplente_2_id.eq.${data.id}`)
            if (data.dni) filtros.push(`titular_1_dni.eq.${data.dni},titular_2_dni.eq.${data.dni},suplente_1_dni.eq.${data.dni},suplente_2_dni.eq.${data.dni}`)

            let inscripcionesExistentes = []
            let errorInscripciones = null

            // Buscar por ID usuario
            if (filtros.length > 0) {
              const { data: insc1, error: err1 } = await supabase
                .from('ligainscripciones')
                .select('id, estado, liga_categorias!inner(ligas!inner(id, nombre))')
                .or(filtros[0])
                .in('estado', ['pendiente', 'aprobada'])
              if (err1) errorInscripciones = err1
              if (insc1) inscripcionesExistentes = inscripcionesExistentes.concat(insc1)
            }
            // Buscar por DNI si existe y es distinto del ID
            if (filtros.length > 1) {
              const { data: insc2, error: err2 } = await supabase
                .from('ligainscripciones')
                .select('id, estado, liga_categorias!inner(ligas!inner(id, nombre))')
                .or(filtros[1])
                .in('estado', ['pendiente', 'aprobada'])
              if (err2) errorInscripciones = err2
              if (insc2) inscripcionesExistentes = inscripcionesExistentes.concat(insc2)
            }

            if (errorInscripciones) {
              console.error('Error verificando inscripciones existentes:', errorInscripciones)
            } else if (inscripcionesExistentes && inscripcionesExistentes.length > 0) {
              const inscripcion = inscripcionesExistentes[0]
              const ligaNombre = inscripcion.liga_categorias?.ligas?.nombre || 'una liga'
              setBloquearPorInscripcion({
                bloquear: true,
                mensaje: `Ya tienes una inscripción ${inscripcion.estado} en ${ligaNombre}. No puedes inscribirte nuevamente hasta que se resuelva.`
              })
              return
            }

            // Usuario encontrado y sin inscripciones pendientes/confirmadas, auto-asignar como titular 1
            console.log('Debug - Auto-asignando usuario encontrado:', data)
            setJugadoresEncontrados(prev => ({
              ...prev,
              titular_1: { ...data, encontrado: true }
            }))
            setFormData(prev => ({
              ...prev,
              titular_1_email: user.email,
              titular_1_id: data.id,
              titular_1_nombre: data.nombre,
              titular_1_apellido: data.apellido || '',
              titular_1_dni: data.dni?.toString() || ''
            }))
            toast({
              title: "Auto-asignado como Titular 1",
              description: `${data.nombre} ${data.apellido || ''}`,
              variant: "default"
            })
          } else {
            // Usuario no encontrado, crear uno nuevo
            const { data: nuevoUsuario, error: crearError } = await supabase
              .from('usuarios')
              .insert({
                id: user.id,
                email: user.email.toLowerCase(),
                nombre: user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || "",
                apellido: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
                dni: null, // DNI como null inicialmente
                ranking_puntos: 0,
                cuenta_activada: true,
                rol: 'user'
              })
              .select()
              .single()

            if (crearError) {
              console.error('Error creando usuario:', crearError)
              return
            }

            console.log('Debug - Auto-asignando nuevo usuario creado:', nuevoUsuario)
            setJugadoresEncontrados(prev => ({
              ...prev,
              titular_1: { ...nuevoUsuario, encontrado: true }
            }))
            setFormData(prev => ({
              ...prev,
              titular_1_email: user.email,
              titular_1_id: nuevoUsuario.id,
              titular_1_nombre: nuevoUsuario.nombre,
              titular_1_apellido: nuevoUsuario.apellido || '',
              titular_1_dni: nuevoUsuario.dni?.toString() || ''
            }))
            toast({
              title: "Auto-asignado como Titular 1",
              description: `${nuevoUsuario.nombre} ${nuevoUsuario.apellido || ''}`,
              variant: "default"
            })
          }
        } catch (error) {
          console.error('Error en auto-asignación:', error)
        }
      }
      buscarUsuario()
    }
  }, [user, toast, formData.titular_1_id])

  // Limpiar búsqueda cuando cambia el tipo
  useEffect(() => {
    console.log('🔄 Cambiando tipo de búsqueda a:', tipoBusqueda)
    setBusqueda('')
    setUsuariosEncontrados([])
    setMostrarDropdown(false)
    setJugadorEncontrado(null)
    setNuevoJugador({ nombre: '', apellido: '', dni: '', email: '' })
  }, [tipoBusqueda])

  // Recargar usuarios cuando cambien los jugadores seleccionados
  useEffect(() => {
    if (user && !verificandoDNI) {
      cargarTodosLosUsuarios()
    }
  }, [jugadoresSeleccionados, user, verificandoDNI])



  // Asegurar que el email del Titular 1 siempre sea el del usuario logueado
  useEffect(() => {
    if (user && user.email && formData.titular_1_email !== user.email) {
      setFormData(prev => ({
        ...prev,
        titular_1_email: user.email
      }))
    }
  }, [user, formData.titular_1_email])

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

  const cargarTodosLosUsuarios = async () => {
    try {
      setCargandoUsuarios(true)
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .neq('rol', 'admin')
        .order('nombre', { ascending: true })

      if (error) throw error

      // Filtrar y marcar usuarios según su disponibilidad
      const usuariosProcesados = await Promise.all(data.map(async (usuario) => {
        // Verificar si es el usuario logueado (Titular 1)
        const esUsuarioLogueado = user && usuario.email === user.email.toLowerCase()
        
        // Verificar si ya está asignado a otra posición (por email)
        const yaAsignado = Object.values(jugadoresSeleccionados).some(
          jugador => jugador && jugador.email === usuario.email
        )
        
        // Verificar si el DNI ya está siendo usado por un jugador asignado
        const dniYaAsignado = Object.values(jugadoresSeleccionados).some(
          jugador => jugador && jugador.dni === usuario.dni
        )
        
        // Encontrar la posición asignada
        const posicionAsignada = Object.keys(jugadoresSeleccionados).find(
          pos => jugadoresSeleccionados[pos]?.email === usuario.email
        )

        // Encontrar la posición asignada por DNI
        const posicionAsignadaPorDNI = Object.keys(jugadoresSeleccionados).find(
          pos => jugadoresSeleccionados[pos]?.dni === usuario.dni
        )

        // Verificar si tiene inscripciones pendientes o confirmadas
        const { data: inscripcionesExistentes, error: errorInscripciones } = await supabase
          .from('ligainscripciones')
          .select('id, estado, liga_categorias!inner(ligas!inner(id, nombre))')
          .or(`titular_1_id.eq.${usuario.id},titular_2_id.eq.${usuario.id},suplente_1_id.eq.${usuario.id},suplente_2_id.eq.${usuario.id}`)
          .in('estado', ['pendiente', 'aprobada'])

        const tieneInscripcionPendiente = inscripcionesExistentes && inscripcionesExistentes.length > 0
        const inscripcionInfo = tieneInscripcionPendiente ? inscripcionesExistentes[0] : null
        
        return {
          ...usuario,
          disponible: !esUsuarioLogueado && !yaAsignado && !dniYaAsignado && !tieneInscripcionPendiente,
          esUsuarioLogueado,
          yaAsignado,
          dniYaAsignado,
          posicionAsignada,
          posicionAsignadaPorDNI,
          tieneInscripcionPendiente,
          inscripcionInfo
        }
      }))

      setTodosLosUsuarios(usuariosProcesados)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      })
    } finally {
      setCargandoUsuarios(false)
    }
  }

  const buscarUsuarios = async (termino, tipo) => {
    console.log('🔍 Iniciando búsqueda:', { termino, tipo })
    
    if (!termino || termino.trim() === '') {
      console.log('❌ Término de búsqueda vacío')
      setUsuariosEncontrados([])
      setMostrarDropdown(false)
      return
    }

    try {
      let query = supabase
        .from('usuarios')
        .select('*')
        .neq('rol', 'admin') // Excluir usuarios con rol admin
        .limit(10)

      if (tipo === 'email') {
        query = query.ilike('email', `%${termino.toLowerCase()}%`)
        console.log('📧 Buscando por email:', termino.toLowerCase())
      } else if (tipo === 'dni') {
        // Buscar por DNI (coincidencia parcial o exacta)
        const dniTermino = termino.trim()
        
        // Si es un número válido, buscar por coincidencia exacta
        const dniNumber = parseInt(dniTermino)
        if (!isNaN(dniNumber)) {
          query = query.eq('dni', dniNumber)
          console.log('🆔 Buscando por DNI exacto:', dniNumber)
        } else {
          // Si no es un número válido, buscar por coincidencia de string en el DNI
          query = query.ilike('dni::text', `%${dniTermino}%`)
          console.log('🆔 Buscando por DNI parcial:', dniTermino)
        }
      }

      console.log('🔍 Ejecutando query...')
      const { data, error } = await query

      if (error) {
        console.error('❌ Error buscando usuarios:', error)
        setUsuariosEncontrados([])
        setMostrarDropdown(false)
        throw error
      }

      console.log('✅ Usuarios encontrados:', data?.length || 0)
      console.log('📋 Usuarios encontrados:', data)

      // Marcar usuarios que no están disponibles (asignados, usuario logueado, o con inscripciones pendientes/confirmadas)
      const usuariosConEstado = await Promise.all(data.map(async (usuario) => {
        // Verificar si es el usuario logueado (Titular 1)
        const esUsuarioLogueado = user && usuario.email === user.email.toLowerCase()
        
        // Verificar si ya está asignado a otra posición (por email)
        const yaAsignado = Object.values(jugadoresSeleccionados).some(
          jugador => jugador && jugador.email === usuario.email
        )
        
        // Verificar si el DNI ya está siendo usado por un jugador asignado
        const dniYaAsignado = Object.values(jugadoresSeleccionados).some(
          jugador => jugador && jugador.dni === usuario.dni
        )
        
        // Encontrar la posición asignada
        const posicionAsignada = Object.keys(jugadoresSeleccionados).find(
          pos => jugadoresSeleccionados[pos]?.email === usuario.email
        )

        // Encontrar la posición asignada por DNI
        const posicionAsignadaPorDNI = Object.keys(jugadoresSeleccionados).find(
          pos => jugadoresSeleccionados[pos]?.dni === usuario.dni
        )

        // Verificar si tiene inscripciones pendientes o confirmadas
        const { data: inscripcionesExistentes, error: errorInscripciones } = await supabase
          .from('ligainscripciones')
          .select('id, estado, liga_categorias!inner(ligas!inner(id, nombre))')
          .or(`titular_1_id.eq.${usuario.id},titular_2_id.eq.${usuario.id},suplente_1_id.eq.${usuario.id},suplente_2_id.eq.${usuario.id}`)
          .in('estado', ['pendiente', 'aprobada'])

        const tieneInscripcionPendiente = inscripcionesExistentes && inscripcionesExistentes.length > 0
        const inscripcionInfo = tieneInscripcionPendiente ? inscripcionesExistentes[0] : null
        
        return {
          ...usuario,
          disponible: !esUsuarioLogueado && !yaAsignado && !dniYaAsignado && !tieneInscripcionPendiente,
          esUsuarioLogueado,
          yaAsignado,
          dniYaAsignado,
          posicionAsignada,
          posicionAsignadaPorDNI,
          tieneInscripcionPendiente,
          inscripcionInfo
        }
      }))
      
      const usuariosDisponibles = usuariosConEstado

      console.log('✅ Usuarios disponibles después de filtrar:', usuariosDisponibles.length)
      console.log('📋 Usuarios disponibles:', usuariosDisponibles)
      console.log('👤 Usuario logueado:', user?.email)
      console.log('🎯 Jugadores seleccionados:', jugadoresSeleccionados)
      console.log('🔍 Tipo de búsqueda:', tipo)
      console.log('🔍 Término de búsqueda:', termino)
      setUsuariosEncontrados(usuariosDisponibles)
      setMostrarDropdown(true) // Siempre mostrar dropdown, incluso si no hay resultados
    } catch (error) {
      console.error('❌ Error en búsqueda:', error)
      setUsuariosEncontrados([])
      setMostrarDropdown(false)
      throw error // Re-lanzar el error para que se maneje en handleBuscarUsuarios
    }
  }

  const buscarJugador = async (email) => {
    if (!email) return

    try {
      console.log('Buscando usuario con email:', email.toLowerCase())
      
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase())
        .neq('rol', 'admin') // Excluir usuarios con rol admin

      if (error) {
        console.error('Error en búsqueda:', error)
        throw error
      }

      console.log('Resultado de búsqueda:', usuarios)

      if (usuarios && usuarios.length > 0) {
        const data = usuarios[0]
        
        // Verificar si es el usuario logueado
        if (user && data.email === user.email.toLowerCase()) {
          toast({
            title: "Usuario no disponible",
            description: "No puedes asignarte a otra posición, ya eres el Titular 1",
            variant: "destructive"
          })
          return null
        }
        
        // Verificar si ya está asignado a otra posición
        const yaAsignado = Object.values(jugadoresSeleccionados).some(
          jugador => jugador && jugador.email === data.email
        )
        
        if (yaAsignado) {
          const posicionAsignada = Object.keys(jugadoresSeleccionados).find(
            pos => jugadoresSeleccionados[pos]?.email === data.email
          )
          toast({
            title: "Usuario ya asignado",
            description: `${data.nombre} ${data.apellido || ''} ya está asignado como ${posicionAsignada?.replace('_', ' ')}`,
            variant: "destructive"
          })
          return null
        }
        
        // Verificar si tiene inscripciones pendientes o confirmadas
        const { data: inscripcionesExistentes, error: errorInscripciones } = await supabase
          .from('ligainscripciones')
          .select('id, estado, liga_categorias!inner(ligas!inner(id, nombre))')
          .or(`titular_1_id.eq.${data.id},titular_2_id.eq.${data.id},suplente_1_id.eq.${data.id},suplente_2_id.eq.${data.id}`)
          .in('estado', ['pendiente', 'aprobada'])

        if (errorInscripciones) {
          console.error('Error verificando inscripciones existentes:', errorInscripciones)
        } else if (inscripcionesExistentes && inscripcionesExistentes.length > 0) {
          const inscripcion = inscripcionesExistentes[0]
          const ligaNombre = inscripcion.liga_categorias?.ligas?.nombre || 'una liga'
          toast({
            title: "Usuario no disponible",
            description: `${data.nombre} ${data.apellido || ''} ya tiene una inscripción ${inscripcion.estado} en ${ligaNombre}. No puede inscribirse nuevamente.`,
            variant: "destructive"
          })
          return null
        }
        
        // Usuario encontrado y disponible - mostrar opciones de posición
        toast({
          title: "Usuario encontrado",
          description: `${data.nombre} ${data.apellido || ''} (DNI: ${data.dni}) - Selecciona una posición`,
          variant: "default"
        })
        
        // Retornar el usuario para que se pueda asignar a una posición
        return data
      } else {
        // Usuario no encontrado - permitir crear nuevo
        toast({
          title: "Usuario no encontrado",
          description: "Completa los datos para crear un nuevo usuario",
          variant: "default"
        })
        
        // Retornar un objeto con el email para crear nuevo usuario
        return { email: email.toLowerCase(), nuevo: true }
      }
    } catch (error) {
      console.error('Error buscando usuario:', error)
      toast({
        title: "Error",
        description: "Error al buscar usuario: " + error.message,
        variant: "destructive"
      })
      return null
    }
  }



  const seleccionarUsuario = (usuario) => {
    setJugadorEncontrado(usuario)
    setBusqueda('')
    setUsuariosEncontrados([])
    setMostrarDropdown(false)
    
    // Mostrar notificación con información del usuario seleccionado
    toast({
      title: "Usuario seleccionado",
      description: `${usuario.nombre} ${usuario.apellido || ''} (DNI: ${usuario.dni}) - Selecciona una posición`,
      variant: "default"
    })
  }

  const crearJugador = async (email, nombre, apellido, dni) => {
    try {
      setCreandoUsuario(true)
      
      // Validar que el DNI esté presente
      if (!dni || dni.trim() === '') {
        throw new Error('El DNI es obligatorio para crear un usuario')
      }

      // Validar formato de DNI (7-8 dígitos)
      const dniRegex = /^\d{7,8}$/
      if (!dniRegex.test(dni.trim())) {
        throw new Error('El DNI debe tener 7 u 8 dígitos numéricos')
      }

      console.log('Creando usuario a través de API:', { email, nombre, apellido, dni })

      // Validar que el email no esté ya en uso
      console.log('Verificando si el email ya está en uso...')
      const { data: usuarioExistente, error: errorEmail } = await supabase
        .from('usuarios')
        .select('id, email, nombre, apellido, dni')
        .eq('email', email.toLowerCase())
        .single()

      if (errorEmail && errorEmail.code !== 'PGRST116') {
        console.error('Error verificando email:', errorEmail)
        throw new Error('Error al verificar si el email está en uso')
      }

      if (usuarioExistente) {
        throw new Error('Ya existe un usuario con ese email')
      }

      // Usar el endpoint de API para crear el usuario con autenticación
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          dni: dni.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario')
      }

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al crear usuario')
      }

      console.log('Usuario creado exitosamente:', result.user)

      // Verificar que el usuario realmente existe en la base de datos
      console.log('Verificando que el usuario existe en la base de datos...')
      const { data: usuarioVerificado, error: errorVerificacion } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', result.user.email)
        .single()

      if (errorVerificacion) {
        console.error('Error verificando usuario creado:', errorVerificacion)
        toast({
          title: "Advertencia",
          description: "Usuario creado pero puede haber un delay en la disponibilidad para búsqueda",
          variant: "default"
        })
      } else {
        console.log('Usuario verificado en base de datos:', usuarioVerificado)
      }

      // Mostrar mensaje informativo sobre la contraseña temporal
      if (result.tempPassword) {
        toast({
          title: "Usuario creado exitosamente",
          description: `Se ha creado una cuenta para ${result.user.nombre} ${result.user.apellido}. La contraseña temporal es: ${result.tempPassword}. Deberá cambiarla al iniciar sesión.`,
          variant: "default"
        })
      } else {
        toast({
          title: "Usuario creado exitosamente",
          description: `Se ha creado una cuenta para ${result.user.nombre} ${result.user.apellido}. El usuario estará disponible para búsqueda en unos segundos.`,
          variant: "default"
        })
      }

      return result.user
    } catch (error) {
      console.error('Error creando usuario:', error)
      throw error
    } finally {
      setCreandoUsuario(false)
    }
  }

  const handleInputChange = (field, value) => {
    // No permitir modificar el email del Titular 1
    if (field === 'titular_1_email' && user && user.email) {
      return // No hacer nada si intentan modificar el email del Titular 1
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Función para asignar un jugador a una posición
  const asignarJugadorAPosicion = (jugador, posicion) => {
    // Verificar que el usuario no sea el mismo que está logueado (Titular 1)
    if (user && jugador.email === user.email) {
      toast({
        title: "Error",
        description: "No puedes asignarte a otra posición, ya eres el Titular 1",
        variant: "destructive"
      })
      return
    }

    // Verificar que el jugador no esté ya asignado a otra posición (por email)
    const posicionAnterior = Object.keys(jugadoresSeleccionados).find(
      pos => jugadoresSeleccionados[pos]?.email === jugador.email
    )
    
    if (posicionAnterior) {
      // Mostrar mensaje informativo
      toast({
        title: "Usuario ya asignado",
        description: `${jugador.nombre} ${jugador.apellido || ''} ya está asignado como ${posicionAnterior.replace('_', ' ')}`,
        variant: "destructive"
      })
      return
    }

    // Verificar que el DNI no esté ya siendo usado por otro jugador
    const posicionAnteriorPorDNI = Object.keys(jugadoresSeleccionados).find(
      pos => jugadoresSeleccionados[pos]?.dni === jugador.dni
    )
    
    if (posicionAnteriorPorDNI) {
      // Mostrar mensaje informativo
      toast({
        title: "DNI ya usado",
        description: `El DNI ${jugador.dni} ya está siendo usado por ${jugadoresSeleccionados[posicionAnteriorPorDNI].nombre} ${jugadoresSeleccionados[posicionAnteriorPorDNI].apellido || ''} como ${posicionAnteriorPorDNI.replace('_', ' ')}`,
        variant: "destructive"
      })
      return
    }

    // Verificar que la posición no esté ya ocupada
    if (jugadoresSeleccionados[posicion]) {
      toast({
        title: "Posición ocupada",
        description: `La posición ${posicion.replace('_', ' ')} ya está ocupada por ${jugadoresSeleccionados[posicion].nombre} ${jugadoresSeleccionados[posicion].apellido || ''}`,
        variant: "destructive"
      })
      return
    }

    // Asignar el jugador a la posición
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
      [`${posicion}_dni`]: jugador.dni || '',
      [`${posicion}_id`]: jugador.id
    }))
    
    setJugadoresEncontrados(prev => ({
      ...prev,
      [posicion]: { ...jugador, encontrado: true }
    }))

    toast({
      title: "Usuario asignado",
      description: `${jugador.nombre} ${jugador.apellido || ''} (DNI: ${jugador.dni}) asignado como ${posicion.replace('_', ' ')}`,
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
      [`${posicion}_dni`]: '',
      [`${posicion}_id`]: null
    }))
    
    setJugadoresEncontrados(prev => ({
      ...prev,
      [posicion]: null
    }))

    toast({
      title: "Usuario removido",
      description: `Usuario removido de la posición ${posicion.replace('_', ' ')}`,
      variant: "default"
    })
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    processComprobanteFile(file)
  }

  const processComprobanteFile = (file) => {
    if (!file) return

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 10MB.",
        variant: "destructive"
      })
      return
    }

    setComprobanteFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processComprobanteFile(files[0])
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
      // Validar campos requeridos con mensajes personalizados
      const requiredFieldsValidation = [
        { field: 'titular_1_email', message: 'El email del Titular 1 es requerido' },
        { field: 'titular_2_email', message: 'El email del Titular 2 es requerido' },
        { field: 'suplente_1_email', message: 'El email del Suplente 1 es requerido' },
        { field: 'suplente_2_email', message: 'El email del Suplente 2 es requerido' },
        { field: 'liga_categoria_id', message: 'Debes seleccionar una categoría' },
        { field: 'contacto_celular', message: 'El número de contacto es requerido' }
      ]

      for (const validation of requiredFieldsValidation) {
        if (!formData[validation.field]) {
          throw new Error(validation.message)
        }
      }

      // Verificar que el usuario logueado tenga DNI configurado
      const { data: usuarioActual, error: usuarioError } = await supabase
        .from('usuarios')
        .select('dni, nombre, apellido')
        .eq('email', user.email.toLowerCase())
        .single()

      if (usuarioError || !usuarioActual?.dni || usuarioActual.dni.toString().trim() === '') {
        throw new Error('Debes configurar tu DNI en tu perfil antes de inscribirte')
      }

      // Validar que todos los jugadores estén asignados
      const jugadoresRequeridos = ['titular_2', 'suplente_1', 'suplente_2']
      for (const posicion of jugadoresRequeridos) {
        if (!jugadoresSeleccionados[posicion]) {
          throw new Error(`Debes asignar un jugador como ${posicion.replace('_', ' ')}`)
        }
      }

      // Verificar que no haya usuarios duplicados
      const emailsAsignados = new Set()
      const dnisAsignados = new Set()
      emailsAsignados.add(user.email.toLowerCase()) // Agregar el usuario logueado
      
      // Obtener el DNI del usuario logueado
      const { data: usuarioLogueado, error: errorUsuarioLogueado } = await supabase
        .from('usuarios')
        .select('dni')
        .eq('email', user.email.toLowerCase())
        .single()

      if (usuarioLogueado?.dni) {
        dnisAsignados.add(usuarioLogueado.dni.toString())
      }
      
      for (const posicion of jugadoresRequeridos) {
        const jugador = jugadoresSeleccionados[posicion]
        if (emailsAsignados.has(jugador.email.toLowerCase())) {
          throw new Error(`El usuario ${jugador.nombre} ${jugador.apellido || ''} está asignado a múltiples posiciones`)
        }
        if (dnisAsignados.has(jugador.dni?.toString())) {
          throw new Error(`El DNI ${jugador.dni} está siendo usado por múltiples jugadores`)
        }
        emailsAsignados.add(jugador.email.toLowerCase())
        if (jugador.dni) {
          dnisAsignados.add(jugador.dni.toString())
        }
      }

      // Verificar que ningún jugador del equipo ya tenga una inscripción pendiente o confirmada
      const todosLosJugadores = [
        { id: formData.titular_1_id, nombre: formData.titular_1_nombre, apellido: formData.titular_1_apellido },
        { id: jugadoresSeleccionados.titular_2.id, nombre: jugadoresSeleccionados.titular_2.nombre, apellido: jugadoresSeleccionados.titular_2.apellido },
        { id: jugadoresSeleccionados.suplente_1.id, nombre: jugadoresSeleccionados.suplente_1.nombre, apellido: jugadoresSeleccionados.suplente_1.apellido },
        { id: jugadoresSeleccionados.suplente_2.id, nombre: jugadoresSeleccionados.suplente_2.nombre, apellido: jugadoresSeleccionados.suplente_2.apellido }
      ]

      for (const jugador of todosLosJugadores) {
        const { data: inscripcionesExistentes, error: errorInscripciones } = await supabase
          .from('ligainscripciones')
          .select('id, estado, liga_categorias!inner(ligas!inner(id, nombre))')
          .or(`titular_1_id.eq.${jugador.id},titular_2_id.eq.${jugador.id},suplente_1_id.eq.${jugador.id},suplente_2_id.eq.${jugador.id}`)
          .in('estado', ['pendiente', 'aprobada'])

        if (errorInscripciones) {
          console.error('Error verificando inscripciones existentes:', errorInscripciones)
        } else if (inscripcionesExistentes && inscripcionesExistentes.length > 0) {
          const inscripcion = inscripcionesExistentes[0]
          const ligaNombre = inscripcion.liga_categorias?.ligas?.nombre || 'una liga'
          throw new Error(`${jugador.nombre} ${jugador.apellido || ''} ya tiene una inscripción ${inscripcion.estado} en ${ligaNombre}. No puede inscribirse nuevamente.`)
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

      // Obtener IDs de los usuarios asignados
      console.log('Debug - formData.titular_1_id:', formData.titular_1_id)
      console.log('Debug - user.id:', user.id)
      console.log('Debug - jugadoresSeleccionados:', jugadoresSeleccionados)
      
      const usuariosIds = {
        titular_1: formData.titular_1_id || user.id, // Usar formData.titular_1_id o user.id como respaldo
        titular_2: jugadoresSeleccionados.titular_2.id,
        suplente_1: jugadoresSeleccionados.suplente_1.id,
        suplente_2: jugadoresSeleccionados.suplente_2.id
      }
      
      console.log('Debug - usuariosIds:', usuariosIds)

      // Validar que el titular_1_id no sea null
      if (!usuariosIds.titular_1) {
        throw new Error('Error: No se pudo identificar el ID del Titular 1. Por favor, recarga la página e intenta nuevamente.')
      }

      // Subir archivo
      const fileData = await uploadFile(comprobanteFile)

      // Guardar inscripción en la base de datos
      const { error } = await supabase
        .from('ligainscripciones')
        .insert({
          liga_categoria_id: parseInt(formData.liga_categoria_id),
          titular_1_id: usuariosIds.titular_1,
          titular_2_id: usuariosIds.titular_2,
          suplente_1_id: usuariosIds.suplente_1,
          suplente_2_id: usuariosIds.suplente_2,
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
        titular_2_dni: '',
        titular_2_id: null,
        suplente_1_email: '',
        suplente_1_nombre: '',
        suplente_1_apellido: '',
        suplente_1_dni: '',
        suplente_1_id: null,
        suplente_2_email: '',
        suplente_2_nombre: '',
        suplente_2_apellido: '',
        suplente_2_dni: '',
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
      setBusqueda('')
      setJugadorEncontrado(null)
      setNuevoJugador({ nombre: '', apellido: '', dni: '', email: '' })

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
          {esTitular1Logueado && (
            <p className="text-sm text-[#E2FF1B] mb-2">
              Tu email se asigna automáticamente como Titular 1
            </p>
          )}
          <div className="flex gap-2">
            <Input
              id={`${tipo}_email`}
              type="email"
              value={esTitular1Logueado ? user.email : email}
              onChange={(e) => handleInputChange(`${tipo}_email`, e.target.value)}
              className="bg-white/10 border-white/20 text-white flex-1"
              placeholder={esTitular1Logueado ? user.email : "usuario@email.com"}
              required
              disabled={esTitular1Logueado}
              readOnly={esTitular1Logueado}
            />
            {!esTitular1Logueado && (
              <Button
                type="button"
                onClick={() => buscarJugador(email, tipo)}
                disabled={!email}
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 h-10"
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
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
                <span>Usuario encontrado: {jugador.nombre} {jugador.apellido || ''}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400">
                <Plus className="w-4 h-4" />
                <span>Crear nuevo usuario</span>
              </div>
            )}
          </div>
        )}

        {/* Campos para nuevo usuario */}
        {jugador && !jugador.encontrado && (
          <div className="grid md:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor={`${tipo}_dni`} className="text-white">DNI *</Label>
              <Input
                id={`${tipo}_dni`}
                value={formData[`${tipo}_dni`]}
                onChange={(e) => handleInputChange(`${tipo}_dni`, e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                required
                disabled={esTitular1Logueado}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Nueva función para renderizar la sección de selección de jugadores
  const handleBuscarUsuarios = async () => {
    console.log('🔘 Botón de búsqueda clickeado')
    console.log('📝 Estado actual:', { busqueda, tipoBusqueda })
    
    if (!busqueda || busqueda.trim() === '') {
      console.log('❌ Búsqueda vacía')
      toast({
        title: "Error",
        description: "Debes ingresar un término de búsqueda",
        variant: "destructive"
      })
      return
    }

    // Validar DNI si es búsqueda por DNI
    if (tipoBusqueda === 'dni') {
      const dniTermino = busqueda.trim()
      if (!dniTermino || dniTermino === '') {
        console.log('❌ DNI vacío:', busqueda)
        toast({
          title: "DNI requerido",
          description: "Debes ingresar un DNI para buscar",
          variant: "destructive"
        })
        return
      }
    }
    
    console.log('✅ Iniciando búsqueda...')
    try {
      await buscarUsuarios(busqueda, tipoBusqueda)
    } catch (error) {
      console.error('❌ Error en búsqueda:', error)
      toast({
        title: "Error",
        description: "Error al realizar la búsqueda",
        variant: "destructive"
      })
    }
  }

  // Función para refrescar la búsqueda después de crear un usuario
  const refrescarBusqueda = async (termino, tipo = 'email') => {
    console.log('🔄 Refrescando búsqueda para:', termino, 'tipo:', tipo)
    
    // Esperar un momento para que la base de datos se actualice
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Hacer una nueva búsqueda
    await buscarUsuarios(termino, tipo)
    
    console.log('✅ Búsqueda refrescada')
  }

  const renderSeleccionJugadores = () => {
    const handleInputChange = (value) => {
      setBusqueda(value)
      // Limpiar resultados cuando se borra el input
      if (!value || value.trim() === '') {
        setUsuariosEncontrados([])
        setMostrarDropdown(false)
      }
    }

    const getPosicionesDisponibles = (usuarioSeleccionado = null) => {
      const posiciones = [
        { key: 'titular_2', label: 'Titular 2' },
        { key: 'suplente_1', label: 'Suplente 1' },
        { key: 'suplente_2', label: 'Suplente 2' }
      ]
      
      return posiciones.filter(pos => {
        // Verificar que la posición no esté ocupada
        if (jugadoresSeleccionados[pos.key]) {
          return false
        }
        
        // Si hay un usuario seleccionado, verificar que no esté ya asignado a otra posición
        if (usuarioSeleccionado) {
          const yaAsignado = Object.values(jugadoresSeleccionados).some(
            jugador => jugador && jugador.email === usuarioSeleccionado.email
          )
          if (yaAsignado) {
            return false
          }
          
          // Verificar que el DNI no esté ya siendo usado por otro jugador
          const dniYaAsignado = Object.values(jugadoresSeleccionados).some(
            jugador => jugador && jugador.dni === usuarioSeleccionado.dni
          )
          if (dniYaAsignado) {
            return false
          }
        }
        
        return true
      })
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
          Selección de Jugadores
        </h3>

        {/* Búsqueda de usuarios mejorada */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-lg font-medium text-white mb-2">Buscar Jugador</h4>
              <p className="text-sm text-gray-400">
                Busca por email o DNI para encontrar jugadores disponibles
              </p>
            </div>
            
                          <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Select value={tipoBusqueda} onValueChange={setTipoBusqueda}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-full sm:w-32 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="email" className="text-white hover:bg-[#E2FF1B]/20 hover:text-[#E2FF1B] focus:bg-[#E2FF1B]/20 focus:text-[#E2FF1B] data-[highlighted]:bg-[#E2FF1B]/20 data-[highlighted]:text-[#E2FF1B]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#E2FF1B] rounded-full"></div>
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="dni" className="text-white hover:bg-[#E2FF1B]/20 hover:text-[#E2FF1B] focus:bg-[#E2FF1B]/20 focus:text-[#E2FF1B] data-[highlighted]:bg-[#E2FF1B]/20 data-[highlighted]:text-[#E2FF1B]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#E2FF1B] rounded-full"></div>
                      DNI
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <Input
                  type={tipoBusqueda === 'email' ? 'email' : 'text'}
                  value={busqueda}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="bg-white/10 border-white/20 text-white h-12 text-base"
                  placeholder={tipoBusqueda === 'email' ? 'usuario@email.com' : '42214710'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleBuscarUsuarios()
                    }
                  }}
                  onFocus={() => {
                    // No mostrar dropdown automáticamente al hacer focus
                  }}
                  onBlur={() => {
                    setTimeout(() => setMostrarDropdown(false), 200)
                  }}
                />
                
                {/* Dropdown de resultados mejorado */}
                {mostrarDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-white/20 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {usuariosEncontrados.length > 0 ? (
                      usuariosEncontrados.map((usuario) => {
                        return (
                          <div
                            key={usuario.id}
                            className={`p-4 border-b border-white/10 last:border-b-0 transition-all duration-200 ${
                              !usuario.disponible
                                ? 'bg-gray-800/50 cursor-not-allowed opacity-60' 
                                : 'hover:bg-white/10 cursor-pointer hover:scale-[1.02]'
                            }`}
                            onClick={() => {
                              if (usuario.disponible) {
                                seleccionarUsuario(usuario)
                              }
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-[#E2FF1B]/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-[#E2FF1B]" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-white font-semibold text-lg truncate">
                                      {usuario.nombre} {usuario.apellido || ''}
                                    </div>
                                    <div className="text-sm text-gray-400 truncate">
                                      {usuario.email}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Estados del usuario */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {usuario.yaAsignado && usuario.posicionAsignada && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                      Ya asignado como {usuario.posicionAsignada.replace('_', ' ')}
                                    </Badge>
                                  )}
                                  {usuario.dniYaAsignado && usuario.posicionAsignadaPorDNI && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                      DNI usado como {usuario.posicionAsignadaPorDNI.replace('_', ' ')}
                                    </Badge>
                                  )}
                                  {usuario.esUsuarioLogueado && (
                                    <Badge className="bg-[#E2FF1B]/20 text-[#E2FF1B] border-[#E2FF1B]/30 text-xs">
                                      Tú - Titular 1
                                    </Badge>
                                  )}
                                  {usuario.tieneInscripcionPendiente && usuario.inscripcionInfo && (
                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                      Inscripción {usuario.inscripcionInfo.estado} en {usuario.inscripcionInfo.liga_categorias?.ligas?.nombre || 'liga'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-left sm:text-right">
                                <div className="text-sm text-[#E2FF1B] font-medium">
                                  DNI: {usuario.dni}
                                </div>
                                {usuario.disponible && (
                                  <div className="text-xs text-green-400 mt-1">
                                    Disponible
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-gray-400 mb-4 px-2">
                          {tipoBusqueda === 'dni' 
                            ? `No se encontró usuario con DNI que contenga: "${busqueda}"`
                            : `No se encontró usuario con email: "${busqueda}"`
                          }
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            const nuevoUsuario = { 
                              email: tipoBusqueda === 'email' ? busqueda : '', 
                              dni: tipoBusqueda === 'dni' ? busqueda : '',
                              nuevo: true 
                            }
                            setJugadorEncontrado(nuevoUsuario)
                            setNuevoJugador({
                              nombre: '',
                              apellido: '',
                              dni: tipoBusqueda === 'dni' ? busqueda : '',
                              email: tipoBusqueda === 'email' ? busqueda : ''
                            })
                            setMostrarDropdown(false)
                          }}
                          className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Crear nuevo usuario
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={handleBuscarUsuarios}
                disabled={!busqueda || busqueda.trim() === ''}
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 h-12 px-6 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </Button>
            </div>
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
                      {creandoUsuario ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
                          <span className="font-medium text-yellow-400">Creando usuario...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-yellow-400" />
                          <span className="font-medium text-yellow-400">Crear nuevo usuario</span>
                        </>
                      )}
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
                    setBusqueda('')
                    setNuevoJugador({ nombre: '', apellido: '', dni: '', email: '' })
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
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Nombre *</Label>
                      <Input
                        value={nuevoJugador.nombre}
                        onChange={(e) => setNuevoJugador(prev => ({ ...prev, nombre: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Nombre del usuario"
                        disabled={creandoUsuario}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Apellido</Label>
                      <Input
                        value={nuevoJugador.apellido}
                        onChange={(e) => setNuevoJugador(prev => ({ ...prev, apellido: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Apellido del usuario"
                        disabled={creandoUsuario}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">DNI *</Label>
                      <Input
                        value={nuevoJugador.dni}
                        onChange={(e) => setNuevoJugador(prev => ({ ...prev, dni: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="DNI del usuario"
                        disabled={tipoBusqueda === 'dni' || creandoUsuario}
                        readOnly={tipoBusqueda === 'dni'}
                      />
                    </div>
                  </div>
                  
                  {/* Campo de email cuando se busca por DNI */}
                  {tipoBusqueda === 'dni' && (
                    <div className="space-y-2">
                      <Label className="text-white">Email *</Label>
                      <p className="text-sm text-[#E2FF1B] mb-2">
                        Como buscaste por DNI, necesitas ingresar un email para crear el usuario
                      </p>
                      <Input
                        type="email"
                        value={nuevoJugador.email}
                        onChange={(e) => setNuevoJugador(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="usuario@email.com"
                        disabled={creandoUsuario}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">Crear y asignar como:</p>
                    <div className="flex flex-wrap gap-2">
                      {getPosicionesDisponibles({ email: jugadorEncontrado.email }).map((posicion) => (
                        <Button
                          key={posicion.key}
                          type="button"
                          onClick={async () => {
                            // Validaciones básicas
                            if (!nuevoJugador.nombre || !nuevoJugador.dni) {
                              toast({
                                title: "Error",
                                description: "El nombre y DNI son obligatorios",
                                variant: "destructive"
                              })
                              return
                            }

                            // Validar email cuando se busca por DNI
                            if (tipoBusqueda === 'dni' && !nuevoJugador.email) {
                              toast({
                                title: "Error",
                                description: "El email es obligatorio cuando se busca por DNI",
                                variant: "destructive"
                              })
                              return
                            }

                            // Validar formato de email cuando se busca por DNI
                            if (tipoBusqueda === 'dni' && nuevoJugador.email) {
                              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                              if (!emailRegex.test(nuevoJugador.email)) {
                                toast({
                                  title: "Error",
                                  description: "El formato del email no es válido",
                                  variant: "destructive"
                                })
                                return
                              }
                            }

                            // Validar formato de DNI (7-8 dígitos)
                            const dniRegex = /^\d{7,8}$/
                            if (!dniRegex.test(nuevoJugador.dni)) {
                              toast({
                                title: "Error",
                                description: "El DNI debe tener 7 u 8 dígitos numéricos",
                                variant: "destructive"
                              })
                              return
                            }
                            
                            try {
                              const emailParaCrear = tipoBusqueda === 'dni' ? nuevoJugador.email : jugadorEncontrado.email
                              const usuarioCreado = await crearJugador(
                                emailParaCrear,
                                nuevoJugador.nombre,
                                nuevoJugador.apellido,
                                nuevoJugador.dni
                              )
                              
                              asignarJugadorAPosicion(usuarioCreado, posicion.key)
                              setJugadorEncontrado(null)
                              setBusqueda('')
                              setNuevoJugador({ nombre: '', apellido: '', dni: '', email: '' })
                              
                              // Refrescar la búsqueda para que el usuario aparezca en futuras búsquedas
                              console.log('Usuario creado y asignado, refrescando búsqueda...')
                              // Limpiar el estado de búsqueda para forzar una nueva búsqueda
                              setUsuariosEncontrados([])
                              setMostrarDropdown(false)
                              
                              // Refrescar la búsqueda después de un delay
                              setTimeout(() => {
                                refrescarBusqueda(usuarioCreado.email, 'email')
                              }, 2000)
                            } catch (error) {
                              console.error('Error creando usuario:', error)
                              toast({
                                title: "Error",
                                description: error.message || "Error al crear el usuario",
                                variant: "destructive"
                              })
                            }
                          }}
                          className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                          size="sm"
                          disabled={!nuevoJugador.nombre || creandoUsuario}
                        >
                          {creandoUsuario ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                              Creando...
                            </>
                          ) : (
                            posicion.label
                          )}
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
                    {getPosicionesDisponibles(jugadorEncontrado).map((posicion) => (
                      <Button
                        key={posicion.key}
                        type="button"
                        onClick={() => {
                          asignarJugadorAPosicion(jugadorEncontrado, posicion.key)
                          setJugadorEncontrado(null)
                          setBusqueda('')
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

        {/* Usuarios asignados */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Usuarios Asignados</h4>
          
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
            {yaInscriptoEnLiga.inscripto ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-16 h-16 text-[#E2FF1B] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Inscripción ya realizada
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {yaInscriptoEnLiga.mensaje}
                  </p>
                  <Link href="/inscripciones/ligas">
                    <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90">
                    Ver otras Ligas
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : !ligaDisponible ? (
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
                      Ver otras Ligas
                    </Button>
                  </Link>
                </CardContent>
              </Card>
                    ) : (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Formulario de Inscripción</CardTitle>
              <CardDescription className="text-gray-400">
                Busca usuarios existentes por email o crea nuevos usuarios para tu equipo
              </CardDescription>
            </CardHeader>

                                                  <CardContent>
                  {!dniConfigurado && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                          <h4 className="font-semibold">DNI requerido</h4>
                          <p className="text-sm text-red-300">
                            Debes configurar tu DNI en tu perfil antes de poder inscribirte en ligas.
                          </p>
                          <Button
                            onClick={() => router.push('/perfil')}
                            className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                            size="sm"
                          >
                            Configurar DNI en Perfil
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {bloquearPorInscripcion.bloquear && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                          <h4 className="font-semibold">No puedes inscribirte</h4>
                          <p className="text-sm text-red-300">{bloquearPorInscripcion.mensaje}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className={`space-y-6 ${!dniConfigurado || bloquearPorInscripcion.bloquear ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                  className="text-white hover:bg-[#E2FF1B]/20 hover:text-[#E2FF1B] focus:bg-[#E2FF1B]/20 focus:text-[#E2FF1B] data-[highlighted]:bg-[#E2FF1B]/20 data-[highlighted]:text-[#E2FF1B]"
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
                          Arrastra un archivo o haz clic para seleccionar. Tamaño máximo: 10MB.
                        </p>
                        
                        {/* Drag & Drop Zone */}
                        <div
                          className={`relative w-full p-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
                            isDragOver 
                              ? 'border-[#E2FF1B] bg-[#E2FF1B]/10' 
                              : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('comprobante-input').click()}
                        >
                          <input
                            id="comprobante-input"
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                            required
                          />
                          
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className={`p-3 rounded-full ${
                              isDragOver ? 'bg-[#E2FF1B]/20' : 'bg-gray-700/50'
                            }`}>
                              <Upload className={`w-6 h-6 ${
                                isDragOver ? 'text-[#E2FF1B]' : 'text-gray-400'
                              }`} />
                            </div>
                            
                            <div className="text-center">
                              <p className={`text-sm font-medium ${
                                isDragOver ? 'text-[#E2FF1B]' : 'text-gray-300'
                              }`}>
                                {isDragOver ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Formatos: JPG, PNG, PDF, DOC, DOCX • Máximo 10MB
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {comprobanteFile && (
                          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-green-400 font-medium">
                                  Archivo seleccionado
                                </p>
                                <p className="text-xs text-gray-300">
                                  {comprobanteFile.name} ({(comprobanteFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                              </div>
                            </div>
                          </div>
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