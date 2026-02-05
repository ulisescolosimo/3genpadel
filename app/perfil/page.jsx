'use client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatArgentineDate, formatArgentineDateTime, formatPartidoDateTimeArgentina } from '@/lib/date-utils'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
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
  LogOut,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
  Save,
  Camera,
  Upload,
  X,
  Gamepad2,
  Award,
  CalendarDays,
  Zap,
  Info,
  PlayCircle,
  BarChart3,
  Target,
  ChevronLeft,
  ChevronRight
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
import { formatNombreJugador } from '@/lib/utils'
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
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Estados para Circuito 3GEN
  const [inscripcionesCircuitooka, setInscripcionesCircuitooka] = useState([])
  const [loadingInscripcionesCircuitooka, setLoadingInscripcionesCircuitooka] = useState(true)
  const [partidosCircuitooka, setPartidosCircuitooka] = useState([])
  const [loadingPartidosCircuitooka, setLoadingPartidosCircuitooka] = useState(true)
  const [rankingCircuitooka, setRankingCircuitooka] = useState(null)
  const [loadingRankingCircuitooka, setLoadingRankingCircuitooka] = useState(true)
  
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

  // Función para obtener el nombre del jugador (usada en Circuito 3GEN), formateado a título
  const obtenerNombreJugador = (jugador) => {
    if (!jugador) return 'N/A'
    const raw = `${jugador.nombre || ''} ${jugador.apellido || ''}`.trim()
    return formatNombreJugador(raw) || 'N/A'
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

  // Cargar datos de ranking cuando el usuario esté disponible
  useEffect(() => {
    if (usuario?.id) {
      fetchCircuitookaData()
    }
  }, [usuario])

  // Función para cargar datos del Circuito 3GEN
  const fetchCircuitookaData = async () => {
    if (!usuario?.id) return

    try {
      // Cargar inscripciones con relaciones explícitas
      setLoadingInscripcionesCircuitooka(true)
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('circuito3gen_inscripciones')
        .select(`
          *,
          etapa:circuito3gen_etapas!circuito3gen_inscripciones_etapa_id_fkey (
            id,
            nombre,
            estado,
            fecha_inicio,
            fecha_fin
          ),
          division:circuito3gen_divisiones!circuito3gen_inscripciones_division_id_fkey (
            id,
            numero_division,
            nombre
          )
        `)
        .eq('usuario_id', usuario.id)
        .order('fecha_inscripcion', { ascending: false })

      if (inscripcionesError) {
        console.error('Error fetching Circuito 3GEN inscripciones:', inscripcionesError)
        setInscripcionesCircuitooka([])
      } else {
        setInscripcionesCircuitooka(inscripcionesData || [])
      }

      // Cargar partidos
      setLoadingPartidosCircuitooka(true)
      const params = new URLSearchParams()
      params.append('usuario_id', usuario.id)
      
      const response = await fetch(`/api/circuito3gen/partidos?${params.toString()}`)
      const result = await response.json()

      if (!result.success) {
        console.error('Error fetching Circuito 3GEN partidos:', result.error)
        setPartidosCircuitooka([])
      } else {
        // Ordenar: pendientes primero, luego jugados
        const partidosOrdenados = (result.data || []).sort((a, b) => {
          if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1
          if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1
          const fechaA = new Date(a.fecha_partido)
          const fechaB = new Date(b.fecha_partido)
          return a.estado === 'pendiente' ? fechaA - fechaB : fechaB - fechaA
        })
        setPartidosCircuitooka(partidosOrdenados)
      }

      // Cargar ranking - buscar en todas las inscripciones activas
      setLoadingRankingCircuitooka(true)
      
      // Obtener todas las inscripciones activas del usuario
      const inscripcionesActivas = (inscripcionesData || []).filter(
        ins => ins.estado === 'activa'
      )

      if (inscripcionesActivas.length > 0) {
        // Intentar obtener ranking de la inscripción más reciente primero
        // Ordenar por fecha de inscripción descendente
        const inscripcionesOrdenadas = inscripcionesActivas.sort((a, b) => {
          const fechaA = new Date(a.fecha_inscripcion || 0)
          const fechaB = new Date(b.fecha_inscripcion || 0)
          return fechaB - fechaA
        })

        // Intentar obtener ranking de cada inscripción activa hasta encontrar una
        let rankingEncontrado = null
        for (const inscripcion of inscripcionesOrdenadas) {
          try {
            const rankingResponse = await fetch(
              `/api/circuito3gen/rankings?etapa_id=${inscripcion.etapa_id}&division_id=${inscripcion.division_id}&usuario_id=${usuario.id}`
            )
            const rankingResult = await rankingResponse.json()

            if (rankingResult.success && rankingResult.data) {
              rankingEncontrado = rankingResult.data
              break // Encontramos un ranking, salir del loop
            }
          } catch (error) {
            console.error(`Error obteniendo ranking para etapa ${inscripcion.etapa_id}, división ${inscripcion.division_id}:`, error)
            continue // Intentar con la siguiente inscripción
          }
        }

        setRankingCircuitooka(rankingEncontrado)
      } else {
        setRankingCircuitooka(null)
      }

    } catch (error) {
      console.error('Error fetching Circuito 3GEN data:', error)
      setInscripcionesCircuitooka([])
      setPartidosCircuitooka([])
      setRankingCircuitooka(null)
    } finally {
      setLoadingInscripcionesCircuitooka(false)
      setLoadingPartidosCircuitooka(false)
      setLoadingRankingCircuitooka(false)
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

        <div className="space-y-6 sm:space-y-8">
          {/* Primera fila: Ranking Circuito 3GEN e Información Personal (50/50) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Circuito 3GEN - Ranking */}
            <Card className="bg-gray-900/50 border-gray-800 border-[#E2FF1B]/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  Ranking Circuito 3GEN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {usuario.promedio_global !== null && usuario.promedio_global !== undefined ? (
                  <>
                    <div className="bg-[#E2FF1B]/10 border-2 border-[#E2FF1B]/50 rounded-lg p-6 text-center">
                      <p className="text-sm text-white mb-2">Puntaje Global</p>
                      <p className="text-4xl sm:text-5xl font-bold text-[#E2FF1B] mb-2">
                        {usuario.promedio_global.toFixed(2)}
                      </p>
                      <p className="text-xs text-white">Usado para calcular tu posición en el ranking</p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10"
                      onClick={() => router.push('/circuito3gen/rankings')}
                    >
                      Rankings Completos
                      <BarChart3 className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-4">No tienes puntaje global aún</p>
                    <p className="text-gray-500 text-xs mb-4">Juega partidos en Circuito 3GEN para obtener tu puntaje</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-[#E2FF1B] text-[#E2FF1B] hover:bg-[#E2FF1B]/10"
                      onClick={() => router.push('/circuito3gen/inscripcion')}
                    >
                      Inscribirme en Circuito 3GEN
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Perfil */}
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
                      <p className="text-sm sm:text-base text-white">
                        {usuario.dni ? usuario.dni.toString() : 'No especificado'}
                      </p>
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
          </div>

          {/* Segunda fila: Inscripciones y Partidos Circuito 3GEN (50/50) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Circuito 3GEN - Inscripciones */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  Inscripciones Circuito 3GEN
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInscripcionesCircuitooka ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E2FF1B] mx-auto"></div>
                    <p className="text-gray-400 mt-2 text-sm">Cargando inscripciones...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inscripcionesCircuitooka.length > 0 ? (
                      <div className="space-y-3">
                        {inscripcionesCircuitooka.map((inscripcion) => (
                          <div key={inscripcion.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Trophy className="w-4 h-4 text-[#E2FF1B]" />
                                  <h5 className="text-white font-semibold text-sm sm:text-base">
                                    {inscripcion.etapa?.nombre || 'Etapa'}
                                  </h5>
                                </div>
                                
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <Target className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs sm:text-sm text-gray-300">
                                      División: <span className="text-[#E2FF1B] font-medium">{inscripcion.division?.nombre || 'N/A'}</span>
                                    </span>
                                  </div>
                                  
                                  {inscripcion.etapa?.fecha_inicio && (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs sm:text-sm text-gray-300">
                                        Inicio: {formatArgentineDate(inscripcion.etapa.fecha_inicio)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    inscripcion.estado === 'activa' 
                                      ? 'text-green-400 border-green-500/30 bg-green-500/10' 
                                      : inscripcion.estado === 'cancelada'
                                      ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                      : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    {inscripcion.estado === 'activa' ? (
                                      <CheckCircle className="w-3 h-3" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    <span className="text-xs capitalize">{inscripcion.estado}</span>
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
                        <p className="text-gray-400 text-sm">No tienes inscripciones en Circuito 3GEN</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-800"
                          onClick={() => router.push('/circuito3gen/inscripcion')}
                        >
                          Inscribirme en Circuito 3GEN
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Circuito 3GEN - Partidos */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Partidos Circuito 3GEN
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPartidosCircuitooka ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E2FF1B] mx-auto"></div>
                    <p className="text-gray-400 mt-2 text-sm">Cargando partidos...</p>
                  </div>
                ) : (
                  <Tabs defaultValue="proximos" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 rounded-lg p-1">
                      <TabsTrigger value="proximos" className="w-full rounded-md data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                        Próximos
                      </TabsTrigger>
                      <TabsTrigger value="jugados" className="w-full rounded-md data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                        Jugados
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="proximos" className="space-y-4">
                      {partidosCircuitooka.filter(p => p.estado === 'pendiente').length === 0 ? (
                        <div className="text-center py-4">
                          <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No tienes próximos partidos programados.</p>
                        </div>
                      ) : (
                        <div className="relative w-full">
                          <Swiper
                            modules={[Navigation]}
                            spaceBetween={0}
                            slidesPerView={1}
                            navigation={{
                              nextEl: '.swiper-button-next-proximos',
                              prevEl: '.swiper-button-prev-proximos',
                            }}
                            className="w-full"
                          >
                            {partidosCircuitooka.filter(p => p.estado === 'pendiente').map((partido) => {
                              const esEquipoA = partido.jugador_a1_id === usuario?.id || partido.jugador_a2_id === usuario?.id
                              const companero = esEquipoA 
                                ? (partido.jugador_a1_id === usuario?.id ? partido.jugador_a2 : partido.jugador_a1)
                                : (partido.jugador_b1_id === usuario?.id ? partido.jugador_b2 : partido.jugador_b1)
                              const oponentes = esEquipoA 
                                ? [partido.jugador_b1, partido.jugador_b2].filter(Boolean)
                                : [partido.jugador_a1, partido.jugador_a2].filter(Boolean)

                              return (
                                <SwiperSlide key={partido.id} className="!h-auto !w-full">
                                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-all duration-200 h-full w-full">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Trophy className="w-4 h-4 text-[#E2FF1B] flex-shrink-0" />
                                          <h5 className="text-white font-semibold text-sm sm:text-base truncate">
                                            {partido.division?.nombre || `División ${partido.division?.numero_division}`}
                                          </h5>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-xs sm:text-sm text-gray-300">
                                              {formatPartidoDateTimeArgentina(partido.fecha_partido, partido.horario)}
                                            </span>
                                          </div>
                                          
                                          {partido.cancha && (
                                            <div className="flex items-center gap-2">
                                              <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                              <span className="text-xs sm:text-sm text-blue-400">
                                                {partido.cancha}
                                              </span>
                                            </div>
                                          )}

                                          <div className="pt-2 border-t border-gray-700 text-xs sm:text-sm text-gray-300">
                                            <div className="mb-1">
                                              <strong>Tu pareja:</strong> {obtenerNombreJugador(companero)}
                                            </div>
                                            <div>
                                              <strong>Oponentes:</strong> {oponentes.map(o => obtenerNombreJugador(o)).join(' / ')}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <Badge variant="outline" className="text-[#E2FF1B] border-[#E2FF1B]/30 bg-[#E2FF1B]/10 flex-shrink-0">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span className="text-xs whitespace-nowrap">Pendiente</span>
                                        </div>
                                      </Badge>
                                    </div>
                                  </div>
                                </SwiperSlide>
                              )
                            })}
                          </Swiper>
                          
                          {/* Controles de navegación personalizados */}
                          <div className="flex items-center justify-center gap-4 mt-4">
                            <button 
                              type="button"
                              className="swiper-button-prev-proximos p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Partido anterior"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button 
                              type="button"
                              className="swiper-button-next-proximos p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Partido siguiente"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="jugados" className="space-y-4">
                      {partidosCircuitooka.filter(p => p.estado === 'jugado').length === 0 ? (
                        <div className="text-center py-4">
                          <Award className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No tienes partidos jugados registrados.</p>
                        </div>
                      ) : (
                        <div className="relative w-full">
                          <Swiper
                            modules={[Navigation]}
                            spaceBetween={0}
                            slidesPerView={1}
                            navigation={{
                              nextEl: '.swiper-button-next-jugados',
                              prevEl: '.swiper-button-prev-jugados',
                            }}
                            className="w-full"
                          >
                            {partidosCircuitooka.filter(p => p.estado === 'jugado').map((partido) => {
                              const esEquipoA = partido.jugador_a1_id === usuario?.id || partido.jugador_a2_id === usuario?.id
                              const equipoJugador = esEquipoA ? 'A' : 'B'
                              const gano = partido.equipo_ganador === equipoJugador
                              const companero = esEquipoA 
                                ? (partido.jugador_a1_id === usuario?.id ? partido.jugador_a2 : partido.jugador_a1)
                                : (partido.jugador_b1_id === usuario?.id ? partido.jugador_b2 : partido.jugador_b1)
                              const oponentes = esEquipoA 
                                ? [partido.jugador_b1, partido.jugador_b2].filter(Boolean)
                                : [partido.jugador_a1, partido.jugador_a2].filter(Boolean)

                              return (
                                <SwiperSlide key={partido.id} className="!h-auto !w-full">
                                  <div className={`bg-gray-800/50 rounded-lg p-4 border ${gano ? 'border-green-500/50' : 'border-red-500/50'} hover:bg-gray-800/70 transition-all duration-200 h-full w-full`}>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Trophy className="w-4 h-4 text-[#E2FF1B] flex-shrink-0" />
                                          <h5 className="text-white font-semibold text-sm sm:text-base truncate">
                                            {partido.division?.nombre || `División ${partido.division?.numero_division}`}
                                          </h5>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-xs sm:text-sm text-gray-300">
                                              {formatPartidoDateTimeArgentina(partido.fecha_partido, partido.horario)}
                                            </span>
                                          </div>
                                          
                                          <div className="pt-2 border-t border-gray-700">
                                            <div className="text-xs sm:text-sm text-gray-300 mb-2">
                                              <strong>Resultado:</strong>
                                            </div>
                                            <div className="text-sm font-bold text-white mb-1">
                                              Equipo {equipoJugador}: {equipoJugador === 'A' ? partido.sets_equipo_a : partido.sets_equipo_b} sets
                                            </div>
                                            <div className="text-sm font-bold text-gray-400">
                                              Equipo {equipoJugador === 'A' ? 'B' : 'A'}: {equipoJugador === 'A' ? partido.sets_equipo_b : partido.sets_equipo_a} sets
                                            </div>
                                          </div>

                                          <div className="pt-2 border-t border-gray-700 text-xs sm:text-sm text-gray-300">
                                            <div className="mb-1">
                                              <strong>Tu pareja:</strong> {obtenerNombreJugador(companero)}
                                            </div>
                                            <div>
                                              <strong>Oponentes:</strong> {oponentes.map(o => obtenerNombreJugador(o)).join(' / ')}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <Badge 
                                        variant="outline" 
                                        className={`${gano ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'} flex-shrink-0`}
                                      >
                                        <div className="flex items-center gap-1">
                                          {gano ? (
                                            <Award className="w-3 h-3" />
                                          ) : (
                                            <XCircle className="w-3 h-3" />
                                          )}
                                          <span className="text-xs whitespace-nowrap">{gano ? 'Victoria' : 'Derrota'}</span>
                                        </div>
                                      </Badge>
                                    </div>
                                  </div>
                                </SwiperSlide>
                              )
                            })}
                          </Swiper>
                          
                          {/* Controles de navegación personalizados */}
                          <div className="flex items-center justify-center gap-4 mt-4">
                            <button 
                              type="button"
                              className="swiper-button-prev-jugados p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Partido anterior"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button 
                              type="button"
                              className="swiper-button-next-jugados p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Partido siguiente"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
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