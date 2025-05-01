"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function RegisterPage({ params }) {
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    level: "",
    partner: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const { data, error } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", params.id)
          .single()

        if (error) throw error
        setTournament(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTournament()
  }, [params.id, supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase.from("registrations").insert([
        {
          tournament_id: params.id,
          ...formData,
        },
      ])

      if (error) throw error

      router.push(`/tournament/${params.id}/payment`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#1A1A1A] border-[#333]">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
              <p className="text-red-500 mb-6">{error}</p>
              <Button
                onClick={() => router.push("/")}
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
              >
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#1A1A1A] border-[#333]">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Torneo no encontrado</h2>
              <p className="text-gray-400 mb-6">El torneo que buscas no existe o ha sido eliminado.</p>
              <Button
                onClick={() => router.push("/")}
                className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
              >
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-[#1A1A1A] border-[#333]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white text-center">
              Registro para {tournament.name}
            </CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Completa el formulario para participar en el torneo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-white">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#333] border border-[#444] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#E2FF1B] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-white">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[#333] border border-[#444] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#E2FF1B] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-white">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-[#333] border border-[#444] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#E2FF1B] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="level" className="block text-sm font-medium text-white">
                    Nivel de juego
                  </label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger className="w-full bg-[#333] border-[#444] text-white">
                      <SelectValue placeholder="Selecciona tu nivel" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#333] border-[#444]">
                      <SelectItem value="beginner">Principiante</SelectItem>
                      <SelectItem value="intermediate">Intermedio</SelectItem>
                      <SelectItem value="advanced">Avanzado</SelectItem>
                      <SelectItem value="professional">Profesional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="partner" className="block text-sm font-medium text-white">
                    Pareja (opcional)
                  </label>
                  <input
                    type="text"
                    id="partner"
                    value={formData.partner}
                    onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                    className="w-full px-4 py-2 bg-[#333] border border-[#444] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#E2FF1B] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 px-8 py-6 text-lg font-semibold"
                >
                  {submitting ? <Spinner /> : "Continuar al pago"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 