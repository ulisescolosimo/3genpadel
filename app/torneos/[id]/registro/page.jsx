'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, User } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function RegistroTorneo({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    nivel: '',
    pareja: '',
    comentarios: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Primero, verificar si el usuario ya está registrado
      const { data: existingRegistration } = await supabase
        .from('registros_torneo')
        .select('*')
        .eq('torneo_id', params.id)
        .eq('email', formData.email)
        .single()

      if (existingRegistration) {
        toast({
          title: "Error",
          description: "Ya estás registrado en este torneo",
          variant: "destructive"
        })
        return
      }

      // Registrar al usuario en el torneo
      const { error } = await supabase
        .from('registros_torneo')
        .insert([
          {
            torneo_id: params.id,
            ...formData,
            fecha_registro: new Date().toISOString()
          }
        ])

      if (error) throw error

      toast({
        title: "¡Registro exitoso!",
        description: "Te has registrado correctamente en el torneo",
      })

      router.push(`/torneos/${params.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al registrar tu participación",
        variant: "destructive"
      })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href={`/torneos/${params.id}`} className="flex items-center text-gray-400 hover:text-[#E2FF1B] transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al torneo
            </Link>
          </div>

          <Card className="bg-gray-900/50 border-gray-800 rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Registro al Torneo</CardTitle>
              <CardDescription className="text-gray-400">
                Completa el formulario para participar en el torneo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-white">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido" className="text-white">Apellido</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      required
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-white">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nivel" className="text-white">Nivel de Juego</Label>
                  <Select
                    value={formData.nivel}
                    onValueChange={(value) => setFormData({ ...formData, nivel: value })}
                    required
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Selecciona tu nivel" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="principiante">Principiante</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                      <SelectItem value="profesional">Profesional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pareja" className="text-white">Nombre de tu Pareja (opcional)</Label>
                  <Input
                    id="pareja"
                    value={formData.pareja}
                    onChange={(e) => setFormData({ ...formData, pareja: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comentarios" className="text-white">Comentarios (opcional)</Label>
                  <Input
                    id="comentarios"
                    value={formData.comentarios}
                    onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl bg-[#E2FF1B] text-black hover:bg-black hover:text-[#E2FF1B] h-12 text-base font-medium border border-[#E2FF1B] transition-all duration-300 group"
                  disabled={loading}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-black group-hover:border-[#E2FF1B] border-t-transparent rounded-full animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5 text-black group-hover:text-[#E2FF1B] transition-colors" />
                        Registrarse
                        <ArrowRight className="h-5 w-5 text-black group-hover:text-[#E2FF1B] group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 