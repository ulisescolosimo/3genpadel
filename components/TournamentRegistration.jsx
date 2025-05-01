'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { mercadopago } from '@/lib/mercadopago'

export default function TournamentRegistration({ tournamentId }) {
  const router = useRouter()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')

  useEffect(() => {
    fetchTournament()
  }, [tournamentId])

  const fetchTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('torneos')
        .select('*')
        .eq('id', tournamentId)
        .single()

      if (error) throw error
      setTournament(data)
    } catch (error) {
      console.error('Error fetching tournament:', error)
      setError('Error al cargar el torneo')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = async () => {
    if (!tournament) return

    try {
      // Crear preferencia de pago en MercadoPago
      const preference = {
        items: [
          {
            title: tournament.name,
            unit_price: tournament.price,
            quantity: 1,
          },
        ],
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`,
        },
        auto_return: 'approved',
      }

      const response = await mercadopago.preferences.create(preference)
      setPaymentUrl(response.body.init_point)

      // Crear registro en la base de datos
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      const { error: registrationError } = await supabase
        .from('registrations')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          payment_status: 'pending',
          payment_id: response.body.id,
        })

      if (registrationError) throw registrationError

      // Redirigir al usuario a la página de pago de MercadoPago
      window.location.href = response.body.init_point
    } catch (error) {
      console.error('Error during registration:', error)
      setError('Error al procesar la inscripción')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>
  }

  if (!tournament) {
    return <div className="text-center py-8">Torneo no encontrado</div>
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Inscripción al Torneo</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">{tournament.name}</h3>
          <p className="text-gray-600">{tournament.description}</p>
        </div>

        <div className="space-y-2 text-sm text-gray-500">
          <p>
            <span className="font-medium">Fecha:</span>{' '}
            {new Date(tournament.start_date).toLocaleDateString()} -{' '}
            {new Date(tournament.end_date).toLocaleDateString()}
          </p>
          <p>
            <span className="font-medium">Precio:</span> ${tournament.price}
          </p>
          <p>
            <span className="font-medium">Participantes:</span>{' '}
            {tournament.current_participants}/{tournament.max_participants}
          </p>
        </div>

        <button
          onClick={handleRegistration}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Proceder al Pago
        </button>
      </div>
    </div>
  )
} 