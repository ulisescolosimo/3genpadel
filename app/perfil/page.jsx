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
  LogOut
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { signOut } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: "",
    telefono: "",
    nivel: "",
    bio: "",
    ubicacion: "",
    fecha_nacimiento: ""
  })
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/callback?redirectTo=/perfil')
        return
      }

      console.log('User data from Supabase:', user)
      console.log('User metadata:', user.user_metadata)
      console.log('User profile:', user.profile)

      // Obtener información adicional del perfil
      const { data: profile, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('Profile from database:', profile)

      if (error) {
        console.error('Error fetching profile:', error)
      }

      setUser({
        ...user,
        profile: {
          ...profile,
          nombre: user.user_metadata?.name || profile?.nombre || user.email?.split('@')[0],
          telefono: profile?.telefono || "01156356439",
          nivel: profile?.nivel || "Avanzado"
        }
      })
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleEditProfile = () => {
    setEditForm({
      nombre: user.profile?.nombre || "",
      telefono: user.profile?.telefono || "",
      nivel: user.profile?.nivel || "",
      bio: user.profile?.bio || "",
      ubicacion: user.profile?.ubicacion || "",
      fecha_nacimiento: user.profile?.fecha_nacimiento || ""
    })
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      
      // Primero verificamos si el usuario existe
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      let updatedProfile
      
      if (existingUser) {
        // Si el usuario existe, actualizamos
        const { data, error: updateError } = await supabase
          .from('usuarios')
          .update({
            nombre: editForm.nombre,
            telefono: editForm.telefono,
            nivel: editForm.nivel,
            bio: editForm.bio,
            ubicacion: editForm.ubicacion,
            fecha_nacimiento: editForm.fecha_nacimiento,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single()

        if (updateError) throw updateError
        updatedProfile = data
      } else {
        // Si el usuario no existe, lo creamos
        const { data, error: insertError } = await supabase
          .from('usuarios')
          .insert({
            id: user.id,
            email: user.email,
            nombre: editForm.nombre,
            telefono: editForm.telefono,
            nivel: editForm.nivel,
            bio: editForm.bio,
            ubicacion: editForm.ubicacion,
            fecha_nacimiento: editForm.fecha_nacimiento,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (insertError) throw insertError
        updatedProfile = data
      }

      // Actualizar el estado local con los nuevos datos
      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...updatedProfile
        }
      }))

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

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">No se pudo cargar el perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
            <p className="text-gray-400 mt-1">Gestiona tu información personal</p>
          </div>
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
              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre
                    </label>
                    <Input
                      value={editForm.nombre}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
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
                        <SelectValue />
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
                      Ubicación
                    </label>
                    <Input
                      value={editForm.ubicacion}
                      onChange={(e) => setEditForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
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
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Biografía
                    </label>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
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
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
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
                      <p className="text-white">{user.profile?.telefono || 'No especificado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-sm text-gray-400">Ubicación</p>
                      <p className="text-white">{user.profile?.ubicacion || 'No especificada'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-sm text-gray-400">Fecha de Nacimiento</p>
                      <p className="text-white">
                        {user.profile?.fecha_nacimiento 
                          ? format(new Date(user.profile.fecha_nacimiento), "d 'de' MMMM 'de' yyyy", { locale: es })
                          : 'No especificada'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                {user.profile?.bio && (
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-sm text-gray-400 mb-2">Biografía</p>
                    <p className="text-white">{user.profile.bio}</p>
                  </div>
                )}
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
                    <p className="text-white">{user.profile?.nivel || 'No especificado'}</p>
                  </div>
                </div>
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
      </div>
    </div>
  )
} 