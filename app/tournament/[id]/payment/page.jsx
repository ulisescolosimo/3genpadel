'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Trophy, ArrowRight, Shield, CreditCard, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default function TournamentPayment() {
  const { id } = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentUrl, setPaymentUrl] = useState(null)
  const [step, setStep] = useState(1)

  useEffect(() => {
    fetchTournament()
  }, [id])

  const fetchTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('torneo')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTournament(data)
    } catch (error) {
      console.error('Error fetching tournament:', error)
      setError('Error al cargar los detalles del torneo')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: id,
          successUrl: `${window.location.origin}/tournament/${id}/payment/success`,
          failureUrl: `${window.location.origin}/tournament/${id}/payment/failure`,
          pendingUrl: `${window.location.origin}/tournament/${id}/payment/pending`,
        }),
      })

      if (!response.ok) throw new Error('Error al crear la preferencia de pago')

      const data = await response.json()
      setPaymentUrl(data.init_point)
    } catch (error) {
      console.error('Error creating payment:', error)
      setError('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (paymentUrl) {
      window.location.href = paymentUrl
    }
  }, [paymentUrl])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E2FF1B] mx-auto"></div>
          <p className="mt-4 text-white">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href={`/tournament/${id}`}>Volver al torneo</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Torneo no encontrado</CardTitle>
            <CardDescription>El torneo que buscas no existe o ha sido eliminado.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative flex w-full py-12 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#E2FF1B]/10 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E2FF1B] to-white animate-gradient-x">
                Pago del Torneo
              </h1>
              <p className="max-w-[700px] text-gray-200 md:text-xl lg:text-2xl mx-auto">
                Completa tu inscripción al torneo <span className="text-[#E2FF1B] font-semibold">{tournament.nombre}</span> realizando el pago de manera segura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Process */}
      <section className="w-full py-12 bg-black">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          {/* Progress Steps */}
          <div className="flex justify-between mb-12">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-[#E2FF1B]' : 'text-gray-600'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                step >= 1 ? 'bg-[#E2FF1B]/20 border-2 border-[#E2FF1B]' : 'bg-gray-800 border-2 border-gray-700'
              }`}>
                <span className="text-lg font-bold">1</span>
              </div>
              <span className="text-sm font-medium">Detalles</span>
            </div>
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-[#E2FF1B]' : 'text-gray-600'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                step >= 2 ? 'bg-[#E2FF1B]/20 border-2 border-[#E2FF1B]' : 'bg-gray-800 border-2 border-gray-700'
              }`}>
                <span className="text-lg font-bold">2</span>
              </div>
              <span className="text-sm font-medium">Pago</span>
            </div>
            <div className={`flex flex-col items-center ${step >= 3 ? 'text-[#E2FF1B]' : 'text-gray-600'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                step >= 3 ? 'bg-[#E2FF1B]/20 border-2 border-[#E2FF1B]' : 'bg-gray-800 border-2 border-gray-700'
              }`}>
                <span className="text-lg font-bold">3</span>
              </div>
              <span className="text-sm font-medium">Confirmación</span>
            </div>
          </div>

          <Progress value={step * 33.33} className="mb-12" />

          <div className="grid gap-8 md:grid-cols-2">
            {/* Tournament Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Detalles del Torneo</CardTitle>
                  <div className="p-3 bg-[#E2FF1B]/10 rounded-xl">
                    <Trophy className="h-6 w-6 text-[#E2FF1B]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-[#E2FF1B]/10 rounded-xl">
                    <Calendar className="h-6 w-6 text-[#E2FF1B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Fecha</h3>
                    <p className="text-gray-400">{new Date(tournament.fecha_inicio).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-[#E2FF1B]/10 rounded-xl">
                    <MapPin className="h-6 w-6 text-[#E2FF1B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Ubicación</h3>
                    <p className="text-gray-400">{tournament.ubicacion}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-[#E2FF1B]/10 rounded-xl">
                    <Trophy className="h-6 w-6 text-[#E2FF1B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Categoría</h3>
                    <p className="text-gray-400">{tournament.categoria}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Instrucciones de Pago</CardTitle>
                  <div className="p-3 bg-[#E2FF1B]/10 rounded-xl">
                    <CreditCard className="h-6 w-6 text-[#E2FF1B]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-[#E2FF1B]/10 rounded-xl">
                    <Shield className="h-6 w-6 text-[#E2FF1B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Pago Seguro</h3>
                    <p className="text-gray-400">Tu información está protegida con encriptación de nivel bancario</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-[#E2FF1B]/10 rounded-xl">
                    <CheckCircle2 className="h-6 w-6 text-[#E2FF1B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Proceso Rápido</h3>
                    <p className="text-gray-400">Completa tu pago en minutos y recibe confirmación inmediata</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="secondary" asChild>
                  <Link href={`/tournament/${id}`}>Cancelar</Link>
                </Button>
                <Button onClick={handlePayment}>
                  Continuar al Pago
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
} 