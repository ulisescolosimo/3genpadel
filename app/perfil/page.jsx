'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatArgentineDate, formatArgentineDateTime } from '@/lib/date-utils'
import { 
  Edit, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Trophy, 
  Star, 
  Users, 
  TrendingUp,
  User,
  Settings,
  LogOut,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Save,
  Camera,
  Upload,
  X,
  Gamepad2,
  Award,
  CalendarDays,
  Zap,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, loading: authLoading, signOut, impersonatedUser } = useAuth()
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  // Debug logs
  console.log('ProfilePage - user:', user)
  console.log('ProfilePage - impersonatedUser:', impersonatedUser)
  console.log('ProfilePage - authLoading:', authLoading)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [inscripcionesLigas, setInscripcionesLigas] = useState([])
  const [loadingInscripciones, setLoadingInscripciones] = useState(true)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Nuevos estados para partidos
  const [partidos, setPartidos] = useState([])
  const [loadingPartidos, setLoadingPartidos] = useState(true)
  
  // Estados para ranking points
  const [rankingData, setRankingData] = useState(null)
  const [loadingRanking, setLoadingRanking] = useState(true)
  
  const router = useRouter()

  // Formulario de edición
  const [editForm, setEditForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    nivel: "",
    fecha_nacimiento: "",
    dni: "",
    lado: "none"
  })

  // Función para formatear fechas de partidos
  const formatearFecha = (fecha) => {
    return formatArgentineDateTime(fecha)
  }

  // Función para obtener el nombre del equipo
  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'N/A'
    const titular1 = equipo.titular_1?.nombre || 'N/A'
    const titular2 = equipo.titular_2?.nombre || 'N/A'
    return `${titular1} & ${titular2}`
  }

  // Función para obtener el nombre de la categoría
  const getCategoriaNombre = (partido) => {
    if (!partido.liga_categorias) return 'N/A'
    return `${partido.liga_categorias.ligas?.nombre || 'N/A'} - ${partido.liga_categorias.categoria}`
  }

  // Función para obtener el badge de estado
  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'secondary',
      jugado: 'default',
      cancelado: 'destructive'
    }
    return <Badge variant={variants[estado]}>{estado}</Badge>
  }

  // Función para obtener el rol del usuario en el partido
  const getRolEnPartido = (partido) => {
    if (!usuario?.id) return null
    
    // Verificar si el usuario está en equipo_a
    if (partido.equipo_a) {
      if (partido.equipo_a.titular_1?.id === usuario.id) return 'Titular 1'
      if (partido.equipo_a.titular_2?.id === usuario.id) return 'Titular 2'
    }
    
    // Verificar si el usuario está en equipo_b
    if (partido.equipo_b) {
      if (partido.equipo_b.titular_1?.id === usuario.id) return 'Titular 1'
      if (partido.equipo_b.titular_2?.id === usuario.id) return 'Titular 2'
    }
    
    return null
  }

  // Función para obtener el equipo del usuario
  const getEquipoUsuario = (partido) => {
    if (!usuario?.id) return null
    
    if (partido.equipo_a) {
      if (partido.equipo_a.titular_1?.id === usuario.id || partido.equipo_a.titular_2?.id === usuario.id) {
        return { equipo: partido.equipo_a, esEquipoA: true }
      }
    }
    
    if (partido.equipo_b) {
      if (partido.equipo_b.titular_1?.id === usuario.id || partido.equipo_b.titular_2?.id === usuario.id) {
        return { equipo: partido.equipo_b, esEquipoA: false }
      }
    }
    
    return null
  }

  // Función para obtener el resultado del partido para el usuario
  const getResultadoPartido = (partido) => {
    const equipoUsuario = getEquipoUsuario(partido)
    if (!equipoUsuario) return null
    
    if (partido.estado !== 'jugado' || !partido.equipo_ganador_id) return null
    
    const esGanador = partido.equipo_ganador_id === equipoUsuario.equipo.id
    return {
      resultado: esGanador ? 'victoria' : 'derrota',
      equipoGanador: partido.equipo_ganador ? getEquipoNombre(partido.equipo_ganador) : 'N/A'
    }
  }

  // Función para cargar partidos del usuario
  const fetchPartidos = async () => {
    if (!usuario?.id) return

    try {
      setLoadingPartidos(true)

      // Primero obtener las inscripciones del usuario
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('ligainscripciones')
        .select('id')
        .or(`titular_1_id.eq.${usuario.id},titular_2_id.eq.${usuario.id},suplente_1_id.eq.${usuario.id},suplente_2_id.eq.${usuario.id}`)

      if (inscripcionesError) {
        console.error('Error fetching inscripciones:', inscripcionesError)
        setPartidos([])
        return
      }

      if (!inscripcionesData || inscripcionesData.length === 0) {
        setPartidos([])
        return
      }

      // Obtener los IDs de las inscripciones
      const inscripcionIds = inscripcionesData.map(ins => ins.id)

      // Buscar partidos donde el usuario participa
      const { data: partidosData, error: partidosError } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            ligas (
              id,
              nombre,
              fecha_inicio
            )
          ),
          equipo_a:ligainscripciones!liga_partidos_equipo_a_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            )
          ),
          equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            )
          ),
          equipo_ganador:ligainscripciones!liga_partidos_equipo_ganador_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            )
          )
        `)
        .or(`equipo_a_id.in.(${inscripcionIds.join(',')}),equipo_b_id.in.(${inscripcionIds.join(',')})`)
        .order('fecha', { ascending: true })

      if (partidosError) {
        console.error('Error fetching partidos:', partidosError)
        setPartidos([])
      } else {
        setPartidos(partidosData || [])
      }

    } catch (error) {
      console.error('Error fetching partidos:', error)
      setPartidos([])
    } finally {
      setLoadingPartidos(false)
    }
  }

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        setLoading(true)
        
        // Verificar si hay usuario autenticado o impersonado
        if (!user && !impersonatedUser) {
          console.log('No hay usuario autenticado')
          router.push('/login')
          return
        }

        // Usar el usuario impersonado si existe, sino el usuario normal
        const currentUser = impersonatedUser || user
        console.log('Usuario actual:', currentUser)

        // Evitar cargar si ya tenemos los datos del usuario
        if (usuario && usuario.id === currentUser.id) {
          setLoading(false)
          return
        }

        // Buscar usuario primero por ID (más confiable para usuarios de Google)
        console.log('Buscando usuario con ID:', currentUser.id)
        
        let { data: usuarioData, error: usuarioError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        // Si no se encuentra por ID, buscar por email como fallback
        if (usuarioError && usuarioError.code === 'PGRST116') {
          console.log('Usuario no encontrado por ID, buscando por email...')
          const { data: usuarioPorEmail, error: emailError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', user.email.toLowerCase())
            .single()
          
          if (!emailError && usuarioPorEmail) {
            console.log('Usuario encontrado por email, actualizando ID...')
            // Actualizar el usuario existente con el ID correcto
            const { data: updatedUser, error: updateError } = await supabase
              .from('usuarios')
              .update({ id: user.id })
              .eq('email', user.email.toLowerCase())
              .select()
              .single()
            
            if (!updateError) {
              usuarioData = updatedUser
              usuarioError = null
            } else {
              console.error('Error actualizando ID del usuario:', updateError)
              usuarioError = updateError
            }
          } else {
            usuarioData = usuarioPorEmail
            usuarioError = emailError
          }
        }

        console.log('Resultado búsqueda usuario:', { usuarioData, usuarioError })

        if (usuarioError) {
          if (usuarioError.code === 'PGRST116') {
            // No se encontró usuario, crear uno nuevo usando la API
            console.log('No se encontró usuario, creando uno nuevo usando API...')
            
            try {
              const response = await fetch('/api/create-user-auto', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  email: user.email,
                  fullName: user.user_metadata?.full_name || "",
                  avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture
                })
              })

              const result = await response.json()

              if (!response.ok) {
                console.error('Error en API create-user-auto:', result.error)
                toast.error('Error al crear perfil de usuario')
                return
              }

              if (!result.success) {
                console.error('API create-user-auto falló:', result)
                toast.error('Error al crear perfil de usuario')
                return
              }

              console.log('Usuario creado exitosamente:', result.user)
              setUsuario(result.user)
              setEditForm({
                nombre: result.user.nombre || "",
                apellido: result.user.apellido || "",
                telefono: result.user.telefono || "",
                nivel: result.user.nivel || "",
                fecha_nacimiento: result.user.fecha_nacimiento || "",
                dni: result.user.dni?.toString() || "",
                lado: result.user.lado || "none"
              })
            } catch (apiError) {
              console.error('Error llamando a create-user-auto:', apiError)
              toast.error('Error al crear perfil de usuario')
              return
            }
          } else {
            // Otro tipo de error
            console.error('Error obteniendo usuario:', usuarioError)
            toast.error('Error al cargar datos del usuario')
            return
          }
        } else if (usuarioData) {
          // Usuario encontrado
          console.log('Usuario encontrado:', usuarioData)
          setUsuario(usuarioData)
          setEditForm({
            nombre: usuarioData.nombre || "",
            apellido: usuarioData.apellido || "",
            telefono: usuarioData.telefono || "",
            nivel: usuarioData.nivel || "",
            fecha_nacimiento: usuarioData.fecha_nacimiento || "",
            dni: usuarioData.dni?.toString() || "",
            lado: usuarioData.lado || "none"
          })
        }

      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar el perfil')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && (user || impersonatedUser)) {
      loadUserAndProfile()
    } else if (!authLoading && !user && !impersonatedUser) {
      // Si no hay usuario autenticado y la autenticación ya terminó de cargar
      router.push('/login')
    }
  }, [user, impersonatedUser, authLoading, router])

  // Cargar partidos cuando el usuario esté disponible
  useEffect(() => {
    if (usuario?.id) {
      fetchPartidos()
    }
  }, [usuario])

  // Cargar inscripciones cuando el usuario esté disponible
  useEffect(() => {
    if (usuario?.id) {
      fetchInscripciones()
    }
  }, [usuario])

  // Cargar datos de ranking cuando el usuario esté disponible
  useEffect(() => {
    if (usuario?.id) {
      fetchRankingData()
    }
  }, [usuario])

  const fetchInscripciones = async () => {
    if (!usuario?.id) return

    try {
      setLoadingInscripciones(true)

      const { data: ligasData, error: ligasError } = await supabase
        .from('ligainscripciones')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            ligas (
              id,
              nombre,
              fecha_inicio,
              estado,
              descripcion
            )
          )
        `)
        .or(`titular_1_id.eq.${usuario.id},titular_2_id.eq.${usuario.id},suplente_1_id.eq.${usuario.id},suplente_2_id.eq.${usuario.id}`)
        .order('created_at', { ascending: false })

      if (ligasError) {
        console.error('Error fetching ligas inscripciones:', ligasError)
        setInscripcionesLigas([])
      } else {
        setInscripcionesLigas(ligasData || [])
      }

    } catch (error) {
      console.error('Error fetching inscripciones:', error)
      setInscripcionesLigas([])
    } finally {
      setLoadingInscripciones(false)
    }
  }

  // Función para cargar datos de ranking del usuario
  const fetchRankingData = async () => {
    if (!usuario?.id) return

    try {
      setLoadingRanking(true)

      const { data: rankingData, error: rankingError } = await supabase
        .from('ranking_jugadores')
        .select('*')
        .eq('usuario_id', usuario.id)
        .single()

      if (rankingError) {
        if (rankingError.code === 'PGRST116') {
          // No hay datos de ranking para este usuario
          setRankingData(null)
        } else {
          console.error('Error fetching ranking data:', rankingError)
          setRankingData(null)
        }
      } else {
        setRankingData(rankingData)
      }

    } catch (error) {
      console.error('Error fetching ranking data:', error)
      setRankingData(null)
    } finally {
      setLoadingRanking(false)
    }
  }

  const handleEditProfile = () => {
    if (usuario) {
      setEditForm({
        nombre: usuario.nombre || "",
        apellido: usuario.apellido || "",
        telefono: usuario.telefono || "",
        nivel: usuario.nivel || "",
        fecha_nacimiento: usuario.fecha_nacimiento || "",
        dni: usuario.dni?.toString() || "",
        lado: usuario.lado || "none"
      })
    }
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      
      // Validaciones
      if (!editForm.nombre?.trim()) {
        toast.error('El nombre es obligatorio')
        return
      }

      if (!editForm.dni?.trim()) {
        toast.error('El DNI es obligatorio')
        return
      }

      // Validar formato de DNI
      const dniClean = editForm.dni.trim()
      if (!/^\d{7,8}$/.test(dniClean)) {
        toast.error('El DNI debe tener 7 u 8 dígitos numéricos')
        return
      }

      // Validar que el DNI sea un número válido
      const dniNumber = parseInt(dniClean)
      if (isNaN(dniNumber) || dniNumber <= 0) {
        toast.error('El DNI debe ser un número válido')
        return
      }

      // Verificar que el usuario existe antes de actualizar
      if (!usuario?.id) {
        toast.error('No se encontró el usuario para actualizar')
        return
      }

      console.log('Actualizando usuario con ID:', usuario.id)
      console.log('Datos a actualizar:', editForm)

      // Actualizar usuario
      const updateData = {
        nombre: editForm.nombre.trim(),
        apellido: editForm.apellido?.trim() || "",
        dni: parseInt(dniClean), // Convertir a integer
        nivel: editForm.nivel?.trim() || "",
        telefono: editForm.telefono?.trim() || "",
        fecha_nacimiento: editForm.fecha_nacimiento || null,
        lado: editForm.lado === "none" ? null : editForm.lado
        // No incluir updated_at ya que se actualiza automáticamente
      }

      // Primero verificar que el usuario existe
      const { data: usuarioExistente, error: checkError } = await supabase
        .from('usuarios')
        .select('id, email')
        .eq('id', usuario.id)
        .single()

      if (checkError) {
        console.error('Error verificando usuario:', checkError)
        if (checkError.code === 'PGRST116') {
          // El usuario no existe, intentar recrearlo
          console.log('Usuario no encontrado, recreando...')
          
          // Usar la API para recrear el usuario
          try {
            const response = await fetch('/api/create-user-auto', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                email: user.email,
                fullName: `${editForm.nombre.trim()} ${editForm.apellido?.trim() || ""}`.trim(),
                avatarUrl: usuario.avatar_url
              })
            })

            const result = await response.json()

            if (!response.ok) {
              console.error('Error en API create-user-auto:', result.error)
              toast.error('Error al recrear el perfil')
              return
            }

            if (!result.success) {
              console.error('API create-user-auto falló:', result)
              toast.error('Error al recrear el perfil')
              return
            }

            const newUsuario = result.user

            setUsuario(newUsuario)
            toast.success('Perfil recreado y actualizado correctamente')
            setIsEditModalOpen(false)
            return
          } catch (apiError) {
            console.error('Error llamando a create-user-auto:', apiError)
            toast.error('Error al recrear el perfil')
            return
          }
        } else {
          throw checkError
        }
      }

      // El usuario existe, proceder con la actualización
      const { data: updatedUsuario, error: updateError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', usuario.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error actualizando usuario:', updateError)
        throw updateError
      }

      // Actualizar estado local
      setUsuario(updatedUsuario)
      
      toast.success('Perfil actualizado correctamente')
      setIsEditModalOpen(false)

    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Error al actualizar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // No necesitamos hacer router.push aquí porque signOut ya maneja la redirección
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }


  // Función para refrescar datos del usuario
  const refreshUsuario = async () => {
    try {
      console.log('Refrescando datos del usuario...')
      
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .single()

      if (usuarioError) {
        console.error('Error refrescando usuario:', usuarioError)
        toast.error('Error al refrescar datos del usuario')
        return
      }

      if (usuarioData) {
        setUsuario(usuarioData)
        setEditForm({
          nombre: usuarioData.nombre || "",
          apellido: usuarioData.apellido || "",
          telefono: usuarioData.telefono || "",
          nivel: usuarioData.nivel || "",
          fecha_nacimiento: usuarioData.fecha_nacimiento || "",
          dni: usuarioData.dni?.toString() || "",
          lado: usuarioData.lado || "none"
        })
        toast.success('Datos refrescados correctamente')
      }
      
    } catch (error) {
      console.error('Error refrescando usuario:', error)
      toast.error('Error al refrescar datos')
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada': return 'bg-green-500/20 border-green-500/30 text-green-400'
      case 'rechazada': return 'bg-red-500/20 border-red-500/30 text-red-400'
      case 'pendiente': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'aprobada': return <CheckCircle className="w-4 h-4" />
      case 'rechazada': return <XCircle className="w-4 h-4" />
      case 'pendiente': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'aprobada': return 'Aprobada'
      case 'rechazada': return 'Rechazada'
      case 'pendiente': return 'Pendiente'
      default: return estado
    }
  }

  // Función para formatear fechas correctamente sin problemas de zona horaria
  const formatDate = (dateString) => {
    return formatArgentineDate(dateString)
  }

  const getRolUsuario = (inscripcion) => {
    if (!usuario?.id) return 'Jugador'
    
    if (inscripcion.titular_1_id === usuario.id) return 'Titular 1'
    if (inscripcion.titular_2_id === usuario.id) return 'Titular 2'
    if (inscripcion.suplente_1_id === usuario.id) return 'Suplente 1'
    if (inscripcion.suplente_2_id === usuario.id) return 'Suplente 2'
    return 'Jugador'
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const getUserDisplayName = () => {
    return `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() || 'Usuario'
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    processFile(file)
  }

  const processFile = (file) => {
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB')
      return
    }

    setSelectedFile(file)
    
    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
    }
    reader.readAsDataURL(file)
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
      processFile(files[0])
    }
  }

  const handleUploadAvatar = async () => {
    if (!selectedFile || !usuario?.id) {
      toast.error('Por favor selecciona una imagen')
      return
    }

    try {
      setIsUploadingAvatar(true)
      console.log('Iniciando subida de avatar...')

      // Generar nombre único para el archivo
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${usuario.id}-${Date.now()}.${fileExt}`
      console.log('Nombre del archivo:', fileName)

      // Subir archivo a Supabase Storage
      console.log('Subiendo archivo a storage...')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('perfil')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError)
        toast.error(`Error subiendo archivo: ${uploadError.message}`)
        return
      }

      console.log('Archivo subido correctamente:', uploadData)

      // Obtener URL pública del archivo
      console.log('Obteniendo URL pública...')
      const { data: { publicUrl } } = supabase.storage
        .from('perfil')
        .getPublicUrl(fileName)

      console.log('URL pública obtenida:', publicUrl)

      // Actualizar usuario con la nueva URL del avatar
      console.log('Actualizando usuario en base de datos...')
      const { data: updatedUsuario, error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: publicUrl })
        .eq('id', usuario.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error actualizando avatar:', updateError)
        toast.error(`Error actualizando perfil: ${updateError.message}`)
        return
      }

      console.log('Usuario actualizado correctamente:', updatedUsuario)

      // Actualizar estado local
      setUsuario(updatedUsuario)
      
      // Limpiar estado
      setSelectedFile(null)
      setPreviewUrl(null)
      setIsDragOver(false)
      setIsAvatarModalOpen(false)
      
      toast.success('Avatar actualizado correctamente')

    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error(`Error inesperado: ${error.message}`)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!usuario?.id) return

    try {
      setIsUploadingAvatar(true)

      // Actualizar usuario removiendo el avatar_url
      const { data: updatedUsuario, error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: null })
        .eq('id', usuario.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error removiendo avatar:', updateError)
        throw updateError
      }

      // Actualizar estado local
      setUsuario(updatedUsuario)
      
      toast.success('Avatar removido correctamente')

    } catch (error) {
      console.error('Error removing avatar:', error)
      toast.error('Error al remover el avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Mostrar spinner mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E2FF1B] mx-auto"></div>
          <p className="mt-4 text-white">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Debes iniciar sesión para acceder al perfil</p>
          <Button 
            onClick={() => router.push('/login')}
            className="mt-4 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
          >
            Ir al Login
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E2FF1B] mx-auto"></div>
          <p className="mt-4 text-white">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">No se pudo cargar el perfil</p>
          <Button 
            onClick={() => router.push('/login')}
            className="mt-4 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
          >
            Ir al Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage
                  src={usuario.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                  alt={getUserDisplayName()}
                />
                <AvatarFallback className="text-base sm:text-lg">
                  {getInitials(getUserDisplayName())}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-6 w-6 sm:h-8 sm:w-8 rounded-full p-0 border-gray-600 bg-gray-800 hover:bg-gray-700"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Mi perfil
                <span className="block text-lg sm:text-xl text-[#E2FF1B] mt-1">
                  {usuario.nombre} {usuario.apellido}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1">Gestiona tu información personal</p>
            </div>
          </div>



          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleEditProfile}
                  className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 text-sm sm:text-base w-full sm:w-auto"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Editar Perfil
                </Button>
              </DialogTrigger>
              
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 text-sm sm:text-base w-full sm:w-auto"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                {impersonatedUser ? 'Salir del Modo Admin' : 'Cerrar Sesión'}
              </Button>
              
              <DialogContent className="bg-gray-900 border-gray-800 text-white w-[95vw] max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle>Editar Perfil de Jugador</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <Input
                      value={editForm.nombre}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white h-10 sm:h-9"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Apellido
                    </label>
                    <Input
                      value={editForm.apellido}
                      onChange={(e) => setEditForm(prev => ({ ...prev, apellido: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white h-10 sm:h-9"
                      placeholder="Tu apellido"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      DNI *
                    </label>
                    <Input
                      value={editForm.dni}
                      onChange={(e) => setEditForm(prev => ({ ...prev, dni: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white h-10 sm:h-9"
                      placeholder="12345678"
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <Input
                      value={editForm.telefono}
                      onChange={(e) => setEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white h-10 sm:h-9"
                      placeholder="01112345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <Input
                      type="date"
                      value={editForm.fecha_nacimiento}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white h-10 sm:h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Lado (Drive/Revés)
                    </label>
                    <Select value={editForm.lado || "none"} onValueChange={(value) => setEditForm(prev => ({ ...prev, lado: value === "none" ? null : value }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 focus:ring-2 focus:ring-[#E2FF1B] focus:border-[#E2FF1B] h-10 sm:h-9">
                        <SelectValue placeholder="Selecciona un lado" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="none" className="text-white hover:bg-gray-700 focus:bg-gray-700">No especificado</SelectItem>
                        <SelectItem value="drive" className="text-white hover:bg-gray-700 focus:bg-gray-700">Drive</SelectItem>
                        <SelectItem value="reves" className="text-white hover:bg-gray-700 focus:bg-gray-700">Revés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 h-10 sm:h-9"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setIsEditModalOpen(false)}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 h-10 sm:h-9"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Información del Perfil */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Nombre Completo</p>
                      <p className="text-sm sm:text-base text-white">
                        {usuario.nombre} {usuario.apellido}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Email</p>
                      <p className="text-sm sm:text-base text-white">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Teléfono</p>
                      <p className="text-sm sm:text-base text-white">{usuario.telefono || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Fecha de Nacimiento</p>
                      <p className="text-sm sm:text-base text-white">
                        {usuario.fecha_nacimiento 
                          ? formatArgentineDate(usuario.fecha_nacimiento)
                          : 'No especificada'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">DNI</p>
                      {usuario.dni ? (
                        <p className="text-sm sm:text-base text-white">
                          {usuario.dni.toString()}
                        </p>
                      ) : (
                        <div className="mt-1 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs">
                          <div className="flex items-center gap-1 text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-red-300">
                              Debes configurar tu DNI para poder inscribirte en ligas.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Lado</p>
                      <p className="text-sm sm:text-base text-white">
                        {usuario.lado === 'drive' ? 'Drive' : usuario.lado === 'reves' ? 'Revés' : 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ranking Points */}
            {rankingData && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    Ranking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400">Puntos Totales</p>
                        <p className="text-lg sm:text-xl text-white font-bold">
                          {rankingData.puntos || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400">Categoría</p>
                        <p className="text-sm sm:text-base text-white">
                          {rankingData.categoria || 'Sin categoría'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-400">Posición</p>
                        <p className="text-sm sm:text-base text-white">
                          {rankingData.posicion || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-[#E2FF1B]/10 border border-[#E2FF1B]/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-[#E2FF1B]" />
                      <span className="text-sm font-medium text-[#E2FF1B]">Sistema de puntos</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Los puntos se acumulan según tu rendimiento en los torneos. 
                      Cuanto más lejos llegues, más puntos obtienes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inscripciones Activas */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  Inscripciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInscripciones ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E2FF1B] mx-auto"></div>
                    <p className="text-gray-400 mt-2 text-sm">Cargando inscripciones...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inscripcionesLigas.length > 0 ? (
                      <div className="space-y-3">
                        {inscripcionesLigas.map((inscripcion) => (
                          <div key={inscripcion.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Trophy className="w-4 h-4 text-[#E2FF1B]" />
                                  <h5 className="text-white font-semibold text-sm sm:text-base">
                                    {inscripcion.liga_categorias?.ligas?.nombre || 'Liga'}
                                  </h5>
                                </div>
                                
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs sm:text-sm text-gray-300">
                                      Categoría: <span className="text-[#E2FF1B] font-medium">{inscripcion.liga_categorias?.categoria || 'N/A'}</span>
                                    </span>
                                  </div>
                                  

                                  
                                  {inscripcion.liga_categorias?.ligas?.fecha_inicio && (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs sm:text-sm text-gray-300">
                                        Inicio: {formatDate(inscripcion.liga_categorias.ligas.fecha_inicio)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    inscripcion.estado === 'aprobada' 
                                      ? 'text-green-400 border-green-500/30 bg-green-500/10' 
                                      : inscripcion.estado === 'rechazada'
                                      ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                      : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    {getEstadoIcon(inscripcion.estado)}
                                    <span className="text-xs">{getEstadoText(inscripcion.estado)}</span>
                                  </div>
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No tienes inscripciones activas en ligas</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-800"
                          onClick={() => router.push('/inscripciones/ligas')}
                        >
                          Ver Ligas Disponibles
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Partidos */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  Partidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPartidos ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E2FF1B] mx-auto"></div>
                    <p className="text-gray-400 mt-2 text-sm">Cargando partidos...</p>
                  </div>
                ) : (
                  <Tabs defaultValue="proximos" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 rounded-lg p-1">
                      <TabsTrigger value="proximos" className="w-full rounded-md data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                        Próximos Partidos
                      </TabsTrigger>
                      <TabsTrigger value="jugados" className="w-full rounded-md data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                        Partidos Jugados
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="proximos" className="space-y-4">
                      {partidos.filter(p => p.estado === 'pendiente').length === 0 ? (
                        <div className="text-center py-4">
                          <CalendarDays className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No tienes próximos partidos programados.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                                                     {partidos.filter(p => p.estado === 'pendiente').map((partido) => (
                             <div key={partido.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
                               <div className="flex items-start justify-between mb-3">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-2">
                                     <Trophy className="w-4 h-4 text-[#E2FF1B]" />
                                     <h5 className="text-white font-semibold text-sm sm:text-base">
                                       {getCategoriaNombre(partido)}
                                     </h5>
                                   </div>
                                   
                                   <div className="space-y-1.5">
                                     <div className="flex items-center gap-2">
                                       <Calendar className="w-3 h-3 text-gray-400" />
                                       <span className="text-xs sm:text-sm text-gray-300">
                                         {formatearFecha(partido.fecha)?.fecha} a las {formatearFecha(partido.fecha)?.hora}
                                       </span>
                                     </div>
                                     
                                     <div className="flex items-center gap-2">
                                       <Users className="w-3 h-3 text-gray-400" />
                                       <span className="text-xs sm:text-sm text-gray-300">
                                         {getEquipoNombre(partido.equipo_a)} vs {getEquipoNombre(partido.equipo_b)}
                                       </span>
                                     </div>
                                     
                                     <div className="flex items-center gap-2">
                                       <User className="w-3 h-3 text-gray-400" />
                                       <span className="text-xs sm:text-sm text-gray-300">
                                         Tu rol: <span className="text-[#E2FF1B] font-medium">{getRolEnPartido(partido)}</span>
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                                 
                                 <div className="flex flex-col items-end gap-2">
                                   <Badge variant="outline" className="text-[#E2FF1B] border-[#E2FF1B]/30 bg-[#E2FF1B]/10">
                                     <div className="flex items-center gap-1">
                                       <Clock className="w-3 h-3" />
                                       <span className="text-xs">Próximo</span>
                                     </div>
                                   </Badge>
                                   
                                   {partido.ronda && (
                                     <Badge variant="outline" className="text-gray-400 border-gray-600 bg-gray-800/50">
                                       <span className="text-xs">{partido.ronda}</span>
                                     </Badge>
                                   )}
                                 </div>
                               </div>
                               
                               {partido.equipo_ganador_id && (
                                 <div className="mt-3 pt-3 border-t border-gray-700">
                                   <div className="flex items-center gap-2">
                                     <Award className="w-3 h-3 text-yellow-400" />
                                     <span className="text-xs text-yellow-400">
                                       Ganador: {getEquipoNombre(partido.equipo_ganador)}
                                     </span>
                                   </div>
                                 </div>
                               )}
                             </div>
                           ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="jugados" className="space-y-4">
                      {partidos.filter(p => p.estado === 'jugado').length === 0 ? (
                        <div className="text-center py-4">
                          <Award className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No tienes partidos jugados registrados.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                                                     {partidos.filter(p => p.estado === 'jugado').map((partido) => {
                             const resultado = getResultadoPartido(partido)
                             return (
                               <div key={partido.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
                                 <div className="flex items-start justify-between mb-3">
                                   <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-2">
                                       <Trophy className="w-4 h-4 text-[#E2FF1B]" />
                                       <h5 className="text-white font-semibold text-sm sm:text-base">
                                         {getCategoriaNombre(partido)}
                                       </h5>
                                     </div>
                                     
                                     <div className="space-y-1.5">
                                       <div className="flex items-center gap-2">
                                         <Calendar className="w-3 h-3 text-gray-400" />
                                         <span className="text-xs sm:text-sm text-gray-300">
                                           {formatearFecha(partido.fecha)?.fecha} a las {formatearFecha(partido.fecha)?.hora}
                                         </span>
                                       </div>
                                       
                                       <div className="flex items-center gap-2">
                                         <Users className="w-3 h-3 text-gray-400" />
                                         <span className="text-xs sm:text-sm text-gray-300">
                                           {getEquipoNombre(partido.equipo_a)} vs {getEquipoNombre(partido.equipo_b)}
                                         </span>
                                       </div>
                                       
                                       <div className="flex items-center gap-2">
                                         <User className="w-3 h-3 text-gray-400" />
                                         <span className="text-xs sm:text-sm text-gray-300">
                                           Tu rol: <span className="text-[#E2FF1B] font-medium">{getRolEnPartido(partido)}</span>
                                         </span>
                                       </div>
                                     </div>
                                   </div>
                                   
                                   <div className="flex flex-col items-end gap-2">
                                     <Badge 
                                       variant="outline" 
                                       className={`${
                                         resultado?.resultado === 'victoria' 
                                           ? 'text-green-400 border-green-500/30 bg-green-500/10' 
                                           : 'text-red-400 border-red-500/30 bg-red-500/10'
                                       }`}
                                     >
                                       <div className="flex items-center gap-1">
                                         {resultado?.resultado === 'victoria' ? (
                                           <Award className="w-3 h-3" />
                                         ) : (
                                           <XCircle className="w-3 h-3" />
                                         )}
                                         <span className="text-xs">
                                           {resultado?.resultado === 'victoria' ? 'Victoria' : 'Derrota'}
                                         </span>
                                       </div>
                                     </Badge>
                                     
                                     {partido.ronda && (
                                       <Badge variant="outline" className="text-gray-400 border-gray-600 bg-gray-800/50">
                                         <span className="text-xs">{partido.ronda}</span>
                                       </Badge>
                                     )}
                                   </div>
                                 </div>
                                 
                                 {resultado && (
                                   <div className="mt-3 pt-3 border-t border-gray-700">
                                     <div className="flex items-center gap-2">
                                       <Trophy className="w-3 h-3 text-yellow-400" />
                                       <span className="text-xs text-yellow-400">
                                         Ganador: {resultado.equipoGanador}
                                       </span>
                                     </div>
                                   </div>
                                 )}
                               </div>
                             )
                           })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => router.push('/inscripciones/ligas')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Ver Ligas
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => router.push('/academia')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Ver Academia
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => router.push('/contacto')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Contacto
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Avatar Edit Modal */}
        <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Cambiar Foto de Perfil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6">
              {/* Current Avatar Preview */}
              <div className="flex justify-center">
                <Avatar className="h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32">
                  <AvatarImage
                    src={usuario.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                    alt={getUserDisplayName()}
                  />
                  <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl">
                    {getInitials(getUserDisplayName())}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* File Upload */}
              <div className="space-y-2 sm:space-y-3">
                <Label className="block text-sm font-medium text-gray-300 text-center sm:text-left">
                  Seleccionar Nueva Imagen
                </Label>
                
                {/* Drag & Drop Zone */}
                <div
                  className={`relative w-full p-4 sm:p-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
                    isDragOver 
                      ? 'border-[#E2FF1B] bg-[#E2FF1B]/10' 
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                    <div className={`p-2 sm:p-3 rounded-full ${
                      isDragOver ? 'bg-[#E2FF1B]/20' : 'bg-gray-700/50'
                    }`}>
                      <Upload className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        isDragOver ? 'text-[#E2FF1B]' : 'text-gray-400'
                      }`} />
                    </div>
                    
                    <div className="text-center">
                      <p className={`text-xs sm:text-sm font-medium ${
                        isDragOver ? 'text-[#E2FF1B]' : 'text-gray-300'
                      }`}>
                        {isDragOver ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Formatos: JPG, PNG, GIF • Máximo 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="space-y-2 sm:space-y-3">
                  <label className="block text-sm font-medium text-gray-300 text-center sm:text-left">
                    Vista Previa
                  </label>
                  <div className="flex justify-center">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28">
                      <AvatarImage src={previewUrl} alt="Preview" />
                      <AvatarFallback className="text-lg sm:text-xl md:text-2xl">Preview</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:gap-3 pt-4">
                {usuario.avatar_url && (
                  <Button
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    variant="outline"
                    className="w-full border-red-600 text-red-400 hover:bg-red-600/10 py-2.5 sm:py-3"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400 mr-2"></div>
                        Removiendo...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Remover
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleUploadAvatar}
                  disabled={!selectedFile || isUploadingAvatar}
                  className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 py-2.5 sm:py-3"
                >
                  {isUploadingAvatar ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Subiendo imagen...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Avatar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setIsAvatarModalOpen(false)
                    setSelectedFile(null)
                    setPreviewUrl(null)
                    setIsDragOver(false)
                  }}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 py-2.5 sm:py-3"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 