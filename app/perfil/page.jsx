"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Phone, User, Mail, Calendar, Trophy, MapPin, Award, Users, Target, X } from "lucide-react"
import Header from "@/components/Header"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { toast } from "react-hot-toast"

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTournaments, setActiveTournaments] = useState([])
  const [stats, setStats] = useState({
    jugados: 0,
    ganados: 0,
    activos: 0,
    victorias: "0%"
  })
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
  const [registrosSinTorneo, setRegistrosSinTorneo] = useState([])
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

    const fetchActiveTournaments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('registros_torneo')
          .select(`
            *,
            torneo:torneo_id (
              id,
              nombre,
              descripcion,
              fecha_inicio,
              fecha_fin,
              ubicacion,
              categoria,
              estado,
              cupo_maximo,
              plazas_disponibles
            )
          `)
          .eq('email', user.email)
          .order('fecha_registro', { ascending: false })

        if (error) throw error

        console.log("Registros crudos traídos de Supabase:", data);

        // Filtrar registros sin torneo
        const registrosConTorneo = (data || []).filter(r => r.torneo && r.torneo.id);
        const registrosSinTorneo = (data || []).filter(r => !r.torneo || !r.torneo.id);

        console.log("Registros válidos (con torneo):", registrosConTorneo);
        console.log("Registros sin torneo (posibles huérfanos):", registrosSinTorneo);

        setActiveTournaments(registrosConTorneo);
        setRegistrosSinTorneo(registrosSinTorneo);
      } catch (error) {
        console.error('Error fetching active tournaments:', error)
      }
    }

    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Obtener todos los registros del usuario
        const { data: registros, error: registrosError } = await supabase
          .from('registros_torneo')
          .select('*')
          .eq('email', user.email)

        if (registrosError) throw registrosError

        // Calcular estadísticas
        const jugados = registros.length
        const ganados = registros.filter(r => r.estado === 'ganado').length
        const activos = registros.filter(r => r.estado === 'pendiente' || r.estado === 'confirmado').length
        const victorias = jugados > 0 ? Math.round((ganados / jugados) * 100) : 0

        setStats({
          jugados,
          ganados,
          activos,
          victorias: `${victorias}%`
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    getUser()
    fetchActiveTournaments()
    fetchStats()
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
        user_metadata: {
          ...prev.user_metadata,
          name: editForm.nombre,
          phone: editForm.telefono,
          level: editForm.nivel,
          bio: editForm.bio,
          location: editForm.ubicacion,
          birth_date: editForm.fecha_nacimiento
        },
        profile: {
          ...prev.profile,
          ...updatedProfile
        }
      }))

      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Hubo un error al guardar los cambios. Por favor, intenta nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <Header />
      
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="relative rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 overflow-hidden">
          {/* Header con imagen de perfil */}
          <div className="px-4 sm:px-8 pb-4 sm:pb-8">
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 pt-4 sm:pt-8">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E2FF1B] to-[#E2FF1B]/50 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative">
                    <img
                      src={user.user_metadata?.avatar_url || "https://via.placeholder.com/128"}
                      alt={user.profile?.nombre}
                      className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-gray-900 bg-gray-900 object-cover"
                    />
                  </div>
                </div>
                <div className="pb-2 sm:pb-4 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      {user.user_metadata?.name || user.profile?.nombre || user.email?.split('@')[0]}
                    </h1>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#E2FF1B]/20 text-[#E2FF1B] hover:bg-[#E2FF1B]/10"
                      onClick={handleEditProfile}
                    >
                      Editar Perfil
                    </Button>
                  </div>
                  <p className="text-sm sm:text-base text-gray-400 mt-1">{user.email}</p>
                  <div className="mt-2 sm:mt-3 flex flex-wrap justify-center sm:justify-start items-center gap-2">
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-[#E2FF1B]/10 text-[#E2FF1B] rounded-full border border-[#E2FF1B]/20">
                      {user.profile?.nivel}
                    </span>
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-gray-800/50 text-gray-400 rounded-full border border-gray-700/50">
                      <Calendar className="inline-block w-3 h-3 mr-1" />
                      Miembro desde {new Date(user.profile?.created_at || user.created_at).toLocaleDateString('es-ES', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-gray-800/50 text-gray-400 rounded-full border border-gray-700/50">
                      <Trophy className="inline-block w-3 h-3 mr-1" />
                      {stats.jugados} Torneos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 grid md:grid-cols-2 gap-4 sm:gap-8">
              {/* Información Personal */}
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 hover:bg-gray-800/70 transition-colors duration-300">
                <h2 className="text-lg sm:text-xl font-semibold text-[#E2FF1B] mb-4 sm:mb-6 flex items-center gap-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Información Personal
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-900/50 rounded-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Nombre</p>
                      <p className="text-sm sm:text-base text-white">{user.profile?.nombre}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-900/50 rounded-lg">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Email</p>
                      <p className="text-sm sm:text-base text-white">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-900/50 rounded-lg">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Teléfono</p>
                      <p className="text-sm sm:text-base text-white">{user.profile?.telefono || "No especificado"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-900/50 rounded-lg">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Ubicación</p>
                      <p className="text-sm sm:text-base text-white">{user.profile?.ubicacion || "No especificada"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-900/50 rounded-lg">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Fecha de Nacimiento</p>
                      <p className="text-sm sm:text-base text-white">
                        {user.profile?.fecha_nacimiento 
                          ? new Date(user.profile.fecha_nacimiento).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          : "No especificada"}
                      </p>
                    </div>
                  </div>
                  {user.profile?.bio && (
                    <div className="p-2 sm:p-3 bg-gray-900/50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Biografía</p>
                      <p className="text-sm sm:text-base text-white whitespace-pre-line">{user.profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Pádel */}
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 hover:bg-gray-800/70 transition-colors duration-300">
                <h2 className="text-lg sm:text-xl font-semibold text-[#E2FF1B] mb-4 sm:mb-6 flex items-center gap-2">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                  Información de Pádel
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="group flex items-center space-x-3 p-2 sm:p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors">
                    <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Nivel</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm sm:text-base text-white font-medium">{user.profile?.nivel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="group flex items-center space-x-3 p-2 sm:p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors">
                    <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Miembro desde</p>
                      <p className="text-sm sm:text-base text-white font-medium">
                        {new Date(user.profile?.created_at || user.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="group p-2 sm:p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors text-center">
                      <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors inline-block mb-1 sm:mb-2">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-white">{stats.jugados}</p>
                      <p className="text-xs sm:text-sm text-gray-400">Torneos Jugados</p>
                    </div>
                    <div className="group p-2 sm:p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors text-center">
                      <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors inline-block mb-1 sm:mb-2">
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-white">{stats.ganados}</p>
                      <p className="text-xs sm:text-sm text-gray-400">Torneos Ganados</p>
                    </div>
                    <div className="group p-2 sm:p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors text-center">
                      <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors inline-block mb-1 sm:mb-2">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-white">{stats.activos}</p>
                      <p className="text-xs sm:text-sm text-gray-400">Torneos Activos</p>
                    </div>
                    <div className="group p-2 sm:p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors text-center">
                      <div className="p-1.5 sm:p-2 bg-[#E2FF1B]/10 rounded-lg group-hover:bg-[#E2FF1B]/20 transition-colors inline-block mb-1 sm:mb-2">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-white">{stats.victorias}</p>
                      <p className="text-xs sm:text-sm text-gray-400">Tasa de Victoria</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Torneos Activos */}
            <div className="mt-6 sm:mt-8">
              <h2 className="text-lg sm:text-xl font-semibold text-[#E2FF1B] mb-3 sm:mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                Torneos Activos
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {activeTournaments.length === 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
                    <p className="text-center text-sm sm:text-base text-gray-400">
                      No estás registrado en ningún torneo.
                    </p>
                  </div>
                )}
                {activeTournaments.map((registro) => (
                  <Link 
                    href={`/torneos/${registro.torneo.id}`}
                    key={registro.id} 
                    className="block bg-gray-800/50 rounded-lg p-4 sm:p-6 hover:bg-gray-800/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#E2FF1B]/5"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-medium text-white">{registro.torneo.nombre}</h3>
                          <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${
                            registro.estado === 'pendiente' ? 'text-yellow-400 bg-yellow-400/10' :
                            registro.estado === 'confirmado' ? 'text-green-400 bg-green-400/10' :
                            'text-red-400 bg-red-400/10'
                          }`}>
                            {registro.estado.charAt(0).toUpperCase() + registro.estado.slice(1)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>
                              {format(new Date(registro.torneo.fecha_inicio), "d 'de' MMMM", { locale: es })} -&nbsp;
                              {format(new Date(registro.torneo.fecha_fin), "d 'de' MMMM", { locale: es })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{registro.torneo.ubicacion}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Categoría: {registro.torneo.categoria}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[#E2FF1B] text-sm">
                        Ver detalles
                        <svg 
                          className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 5l7 7-7 7" 
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Torneos Pasados */}
            <div className="mt-6 sm:mt-8">
              <h2 className="text-lg sm:text-xl font-semibold text-[#E2FF1B] mb-3 sm:mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                Torneos Pasados
              </h2>
              <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
                <p className="text-center text-sm sm:text-base text-gray-400">
                  No has participado en ningún torneo anteriormente.
                </p>
              </div>
            </div>

            {registrosSinTorneo.length > 0 && (
              <div className="mt-8 bg-red-900/30 border border-red-700 rounded-lg p-4">
                <h3 className="text-red-400 font-bold mb-2">Registros sin torneo (debug):</h3>
                <ul className="text-red-200 text-xs space-y-2">
                  {registrosSinTorneo.map((registro) => (
                    <li key={registro.id}>
                      <span className="font-semibold">ID registro:</span> {registro.id} — 
                      <span className="ml-2 font-semibold">Email:</span> {registro.email} — 
                      <span className="ml-2 font-semibold">Torneo ID:</span> {registro.torneo_id}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Edición */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Perfil</DialogTitle>
              <DialogDescription className="text-gray-400">
                Actualiza tu información personal
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="nombre" className="text-sm font-medium text-gray-400">
                  Nombre
                </label>
                <Input
                  id="nombre"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="telefono" className="text-sm font-medium text-gray-400">
                  Teléfono
                </label>
                <Input
                  id="telefono"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="nivel" className="text-sm font-medium text-gray-400">
                  Nivel
                </label>
                <Select
                  value={editForm.nivel}
                  onValueChange={(value) => setEditForm({...editForm, nivel: value})}
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
              <div className="grid gap-2">
                <label htmlFor="bio" className="text-sm font-medium text-gray-400">
                  Biografía
                </label>
                <textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white rounded-md p-2 min-h-[100px]"
                  placeholder="Cuéntanos sobre ti..."
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="ubicacion" className="text-sm font-medium text-gray-400">
                  Ubicación
                </label>
                <Input
                  id="ubicacion"
                  value={editForm.ubicacion}
                  onChange={(e) => setEditForm({...editForm, ubicacion: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Ciudad, País"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="fecha_nacimiento" className="text-sm font-medium text-gray-400">
                  Fecha de Nacimiento
                </label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={editForm.fecha_nacimiento}
                  onChange={(e) => setEditForm({...editForm, fecha_nacimiento: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="border-gray-700 text-gray-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-all duration-300"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </div>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 