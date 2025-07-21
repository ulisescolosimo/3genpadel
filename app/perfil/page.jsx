'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
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
  X
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
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { signOut } = useAuth()
  const [user, setUser] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [inscripcionesLigas, setInscripcionesLigas] = useState([])
  const [loadingInscripciones, setLoadingInscripciones] = useState(true)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const router = useRouter()

  // Formulario de edición
  const [editForm, setEditForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    nivel: "",
    fecha_nacimiento: "",
    dni: ""
  })

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        setLoading(true)
        
        // Obtener usuario autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Error obteniendo usuario:', userError)
          router.push('/login')
          return
        }

        setUser(user)

        // Buscar usuario por email
        console.log('Buscando usuario con email:', user.email.toLowerCase())
        
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .single()

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
                dni: result.user.dni?.toString() || ""
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
            dni: usuarioData.dni?.toString() || ""
          })
        }

      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar el perfil')
      } finally {
        setLoading(false)
      }
    }

    loadUserAndProfile()
  }, [router])

  // Cargar inscripciones cuando el usuario esté disponible
  useEffect(() => {
    if (usuario?.id) {
      fetchInscripciones()
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

  const handleEditProfile = () => {
    if (usuario) {
      setEditForm({
        nombre: usuario.nombre || "",
        apellido: usuario.apellido || "",
        telefono: usuario.telefono || "",
        nivel: usuario.nivel || "",
        fecha_nacimiento: usuario.fecha_nacimiento || "",
        dni: usuario.dni?.toString() || ""
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
        fecha_nacimiento: editForm.fecha_nacimiento || null
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
      router.push('/')
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
          dni: usuarioData.dni?.toString() || ""
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

  if (!user || !usuario) {
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={usuario.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                  alt={getUserDisplayName()}
                />
                <AvatarFallback className="text-lg">
                  {getInitials(getUserDisplayName())}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 border-gray-600 bg-gray-800 hover:bg-gray-700"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-white">
                Mi Perfil
                <span className="block text-xl text-[#E2FF1B] mt-1">
                  {usuario.nombre} {usuario.apellido}
                </span>
              </h1>
              <p className="text-gray-400 mt-1">Gestiona tu información personal</p>
            </div>
          </div>

          {/* Alerta de DNI requerido */}
          {!usuario.dni && (
            <div className="mt-4 sm:mt-0 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <h4 className="font-semibold">DNI requerido</h4>
                  <p className="text-sm text-red-300">
                    Debes configurar tu DNI para poder inscribirte en ligas.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4 sm:mt-0">
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleEditProfile}
                  className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
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
                      className="bg-gray-800 border-gray-700 text-white"
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
                      className="bg-gray-800 border-gray-700 text-white"
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
                      className="bg-gray-800 border-gray-700 text-white"
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
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="01112345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nivel
                    </label>
                    <Select 
                      value={editForm.nivel} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, nivel: value }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Selecciona tu nivel" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="Principiante">Principiante</SelectItem>
                        <SelectItem value="Intermedio">Intermedio</SelectItem>
                        <SelectItem value="Avanzado">Avanzado</SelectItem>
                        <SelectItem value="Profesional">Profesional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <Input
                      type="date"
                      value={editForm.fecha_nacimiento}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
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
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Perfil */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-sm text-gray-400">Nombre Completo</p>
                      <p className="text-white">
                        {usuario.nombre} {usuario.apellido}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-sm text-gray-400">Teléfono</p>
                      <p className="text-white">{usuario.telefono || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-sm text-gray-400">Fecha de Nacimiento</p>
                      <p className="text-white">
                        {usuario.fecha_nacimiento 
                          ? format(new Date(usuario.fecha_nacimiento), "d 'de' MMMM 'de' yyyy", { locale: es })
                          : 'No especificada'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-sm text-gray-400">DNI</p>
                      <p className="text-white">
                        {usuario.dni?.toString() || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Información Deportiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-[#E2FF1B]" />
                  <div>
                    <p className="text-sm text-gray-400">Nivel</p>
                    <p className="text-white">{usuario.nivel || 'No especificado'}</p>
                  </div>
                </div>
                {usuario.ranking_puntos !== undefined && (
                  <div className="flex items-center gap-3 mt-3">
                    <TrendingUp className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-sm text-gray-400">Puntos de Ranking</p>
                      <p className="text-white">{usuario.ranking_puntos}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inscripciones Activas */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Inscripciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInscripciones ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E2FF1B] mx-auto"></div>
                    <p className="text-gray-400 mt-2">Cargando inscripciones...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inscripcionesLigas.length > 0 ? (
                      <div className="space-y-3">
                        {inscripcionesLigas.map((inscripcion) => (
                          <div key={inscripcion.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="text-white font-medium">
                                  {inscripcion.liga_categorias?.ligas?.nombre || 'Liga'}
                                </h5>
                                <p className="text-sm text-gray-400">
                                  Categoría: {inscripcion.liga_categorias?.categoria || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Rol: {getRolUsuario(inscripcion)}
                                </p>
                              </div>
                              <Badge className={`${getEstadoColor(inscripcion.estado)} border`}>
                                <div className="flex items-center gap-1">
                                  {getEstadoIcon(inscripcion.estado)}
                                  <span className="text-xs">{getEstadoText(inscripcion.estado)}</span>
                                </div>
                              </Badge>
                            </div>
                            {inscripcion.liga_categorias?.ligas?.fecha_inicio && (
                              <p className="text-xs text-gray-500">
                                Inicio: {format(new Date(inscripcion.liga_categorias.ligas.fecha_inicio), "d 'de' MMMM 'de' yyyy", { locale: es })}
                              </p>
                            )}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
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
                  onClick={() => router.push('/inscripciones/entrenamientos')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Ver Entrenamientos
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