'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Bell, Send, Users, User, Loader2, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

export default function NotificacionesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [usuariosLigasActivas, setUsuariosLigasActivas] = useState([])
  const [selectedUsuario, setSelectedUsuario] = useState('')
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'general',
    es_masiva: false,
    solo_ligas_activas: false
  })

  useEffect(() => {
    fetchUsuarios()
    fetchUsuariosLigasActivas()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email')
        .neq('rol', 'admin')
        .order('nombre')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar usuarios"
      })
    }
  }

  const fetchUsuariosLigasActivas = async () => {
    try {
      // Obtener usuarios que están inscritos en ligas activas (estado = 'abierta')
      const { data, error } = await supabase
        .from('ligainscripciones')
        .select(`
          titular_1_id,
          titular_2_id,
          suplente_1_id,
          suplente_2_id,
          liga_categorias!inner(
            ligas!inner(
              estado
            )
          ),
          usuarios_titular_1:usuarios!ligainscripciones_titular_1_id_fkey(
            id,
            nombre,
            apellido,
            email
          ),
          usuarios_titular_2:usuarios!ligainscripciones_titular_2_id_fkey(
            id,
            nombre,
            apellido,
            email
          ),
          usuarios_suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey(
            id,
            nombre,
            apellido,
            email
          ),
          usuarios_suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey(
            id,
            nombre,
            apellido,
            email
          )
        `)
        .eq('liga_categorias.ligas.estado', 'abierta')
        .in('estado', ['aprobada', 'pendiente'])

      if (error) throw error

      // Crear un Set de usuarios únicos inscritos en ligas activas
      const usuariosUnicos = new Set()
      const usuariosConInfo = []

      data?.forEach(inscripcion => {
        const usuariosInscripcion = [
          inscripcion.usuarios_titular_1,
          inscripcion.usuarios_titular_2,
          inscripcion.usuarios_suplente_1,
          inscripcion.usuarios_suplente_2
        ].filter(u => u && u.id)

        usuariosInscripcion.forEach(usuario => {
          if (!usuariosUnicos.has(usuario.id)) {
            usuariosUnicos.add(usuario.id)
            usuariosConInfo.push({
              id: usuario.id,
              nombre: usuario.nombre,
              apellido: usuario.apellido,
              email: usuario.email
            })
          }
        })
      })

      setUsuariosLigasActivas(usuariosConInfo)
    } catch (error) {
      console.error('Error fetching users in active leagues:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar usuarios de ligas activas"
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titulo || !formData.mensaje) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Título y mensaje son requeridos"
      })
      return
    }

    if (!formData.es_masiva && !selectedUsuario) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar un usuario para notificación individual"
      })
      return
    }

    setLoading(true)

    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para enviar notificaciones"
      })
        return
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          usuario_id: formData.es_masiva ? null : selectedUsuario
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear notificación')
      }

      toast({
        title: "Éxito",
        description: result.message
      })
      
      // Limpiar formulario
      setFormData({
        titulo: '',
        mensaje: '',
        tipo: 'general',
        es_masiva: false,
        solo_ligas_activas: false
      })
      setSelectedUsuario('')
    } catch (error) {
      console.error('Error creating notification:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

     const getTipoColor = (tipo) => {
     switch (tipo) {
       case 'liga':
         return 'bg-blue-600 text-white'
       case 'ranking':
         return 'bg-yellow-600 text-white'
       case 'academia':
         return 'bg-green-600 text-white'
       case 'sistema':
         return 'bg-purple-600 text-white'
       default:
         return 'bg-gray-600 text-white'
     }
   }

     if (!user) {
     return (
       <div className="container mx-auto px-4 py-8">
         <div className="text-center">
           <p className="text-white">Debes iniciar sesión para acceder a esta página.</p>
         </div>
       </div>
     )
   }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
                 <div className="mb-8">
           <h1 className="text-3xl font-bold text-white mb-2">
             Gestión de Notificaciones
           </h1>
           <p className="text-gray-300">
             Envía notificaciones a usuarios individuales, masivas o solo a usuarios inscritos en ligas activas
           </p>
         </div>

        <Tabs defaultValue="individual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="masiva" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Masiva
            </TabsTrigger>
            <TabsTrigger value="ligas-activas" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Ligas Activas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <Card>
              <CardHeader>
                                 <CardTitle className="flex items-center gap-2 text-white">
                   <User className="w-5 h-5" />
                   Notificación Individual
                 </CardTitle>
                 <CardDescription className="text-gray-300">
                   Envía una notificación a un usuario específico
                 </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                                     <div className="space-y-2">
                     <Label htmlFor="usuario" className="text-white">Usuario</Label>
                     <Select value={selectedUsuario} onValueChange={setSelectedUsuario}>
                       <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                         <SelectValue placeholder="Selecciona un usuario" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                         {usuarios.map((usuario) => (
                           <SelectItem key={usuario.id} value={usuario.id} className="text-white hover:bg-gray-700">
                             {usuario.nombre} {usuario.apellido} ({usuario.email})
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="tipo" className="text-white">Tipo de Notificación</Label>
                     <Select 
                       value={formData.tipo} 
                       onValueChange={(value) => handleInputChange('tipo', value)}
                     >
                       <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                         <SelectItem value="general" className="text-white hover:bg-gray-700">General</SelectItem>
                         <SelectItem value="liga" className="text-white hover:bg-gray-700">Liga</SelectItem>
                         <SelectItem value="ranking" className="text-white hover:bg-gray-700">Ranking</SelectItem>
                         <SelectItem value="academia" className="text-white hover:bg-gray-700">Academia</SelectItem>
                         <SelectItem value="sistema" className="text-white hover:bg-gray-700">Sistema</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="titulo" className="text-white">Título</Label>
                     <Input
                       id="titulo"
                       value={formData.titulo}
                       onChange={(e) => handleInputChange('titulo', e.target.value)}
                       placeholder="Título de la notificación"
                       className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                       required
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="mensaje" className="text-white">Mensaje</Label>
                     <Textarea
                       id="mensaje"
                       value={formData.mensaje}
                       onChange={(e) => handleInputChange('mensaje', e.target.value)}
                       placeholder="Mensaje de la notificación"
                       className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                       rows={4}
                       required
                     />
                   </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !selectedUsuario}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Notificación
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="masiva">
            <Card>
              <CardHeader>
                                 <CardTitle className="flex items-center gap-2 text-white">
                   <Users className="w-5 h-5" />
                   Notificación Masiva
                 </CardTitle>
                 <CardDescription className="text-gray-300">
                   Envía una notificación a todos los usuarios (excepto administradores)
                 </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <Bell className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Esta notificación se enviará a {usuarios.length} usuarios
                      </span>
                    </div>
                  </div>

                                     <div className="space-y-2">
                     <Label htmlFor="tipo-masiva" className="text-white">Tipo de Notificación</Label>
                     <Select 
                       value={formData.tipo} 
                       onValueChange={(value) => handleInputChange('tipo', value)}
                     >
                       <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                         <SelectItem value="general" className="text-white hover:bg-gray-700">General</SelectItem>
                         <SelectItem value="liga" className="text-white hover:bg-gray-700">Liga</SelectItem>
                         <SelectItem value="ranking" className="text-white hover:bg-gray-700">Ranking</SelectItem>
                         <SelectItem value="academia" className="text-white hover:bg-gray-700">Academia</SelectItem>
                         <SelectItem value="sistema" className="text-white hover:bg-gray-700">Sistema</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="titulo-masiva" className="text-white">Título</Label>
                     <Input
                       id="titulo-masiva"
                       value={formData.titulo}
                       onChange={(e) => handleInputChange('titulo', e.target.value)}
                       placeholder="Título de la notificación"
                       className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                       required
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="mensaje-masiva" className="text-white">Mensaje</Label>
                     <Textarea
                       id="mensaje-masiva"
                       value={formData.mensaje}
                       onChange={(e) => handleInputChange('mensaje', e.target.value)}
                       placeholder="Mensaje de la notificación"
                       className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                       rows={4}
                       required
                     />
                   </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => handleInputChange('es_masiva', true)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Notificación Masiva
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ligas-activas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="w-5 h-5" />
                  Notificación a Usuarios de Ligas Activas
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Envía una notificación solo a usuarios inscritos en ligas activas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Esta notificación se enviará a {usuariosLigasActivas.length} usuarios inscritos en ligas activas
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo-ligas-activas" className="text-white">Tipo de Notificación</Label>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(value) => handleInputChange('tipo', value)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                        <SelectItem value="general" className="text-white hover:bg-gray-700">General</SelectItem>
                        <SelectItem value="liga" className="text-white hover:bg-gray-700">Liga</SelectItem>
                        <SelectItem value="ranking" className="text-white hover:bg-gray-700">Ranking</SelectItem>
                        <SelectItem value="academia" className="text-white hover:bg-gray-700">Academia</SelectItem>
                        <SelectItem value="sistema" className="text-white hover:bg-gray-700">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titulo-ligas-activas" className="text-white">Título</Label>
                    <Input
                      id="titulo-ligas-activas"
                      value={formData.titulo}
                      onChange={(e) => handleInputChange('titulo', e.target.value)}
                      placeholder="Título de la notificación"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensaje-ligas-activas" className="text-white">Mensaje</Label>
                    <Textarea
                      id="mensaje-ligas-activas"
                      value={formData.mensaje}
                      onChange={(e) => handleInputChange('mensaje', e.target.value)}
                      placeholder="Mensaje de la notificación"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      rows={4}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleInputChange('es_masiva', true)
                      handleInputChange('solo_ligas_activas', true)
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar a Usuarios de Ligas Activas
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

                 {/* Información sobre tipos de notificaciones */}
         <Card className="mt-8">
           <CardHeader>
             <CardTitle className="text-white">Tipos de Notificaciones</CardTitle>
             <CardDescription className="text-gray-300">
               Diferentes tipos de notificaciones con sus respectivos iconos
             </CardDescription>
           </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { tipo: 'general', nombre: 'General', icono: '📢' },
                { tipo: 'liga', nombre: 'Liga', icono: '🏆' },
                { tipo: 'ranking', nombre: 'Ranking', icono: '🥇' },
                { tipo: 'academia', nombre: 'Academia', icono: '📚' },
                { tipo: 'sistema', nombre: 'Sistema', icono: '🔔' }
                             ].map((item) => (
                 <div key={item.tipo} className="text-center p-3 border border-gray-700 rounded-lg bg-gray-800/50">
                   <div className="text-2xl mb-2">{item.icono}</div>
                   <Badge className={getTipoColor(item.tipo)}>
                     {item.nombre}
                   </Badge>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 