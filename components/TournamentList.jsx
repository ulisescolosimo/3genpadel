'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PaymentForm from './PaymentForm'

export default function TournamentList() {
  const [torneos, settorneos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    partner_name: '',
    partner_email: '',
    partner_phone: ''
  })
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    fetchtorneos()
  }, [])

  const fetchtorneos = async () => {
    try {
      const { data, error } = await supabase
        .from('torneos')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true })

      if (error) throw error
      settorneos(data || [])
    } catch (error) {
      console.error('Error fetching torneos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Primero, verificar si el torneo aún tiene cupos disponibles
      const tournament = torneos.find(t => t.id === selectedTournament)
      if (tournament.current_participants >= tournament.max_participants) {
        alert('Lo sentimos, este torneo ya está lleno')
        return
      }

      // Mostrar el formulario de pago
      setShowPayment(true)
    } catch (error) {
      console.error('Error al procesar la inscripción:', error)
      alert('Hubo un error al procesar tu inscripción. Por favor intenta nuevamente.')
    }
  }

  const handlePaymentSuccess = async () => {
    try {
      const tournament = torneos.find(t => t.id === selectedTournament)
      
      // Insertar la inscripción
      const { error } = await supabase
        .from('registrations')
        .insert([
          {
            tournament_id: selectedTournament,
            ...formData,
            status: 'confirmed',
            payment_status: 'paid',
            created_at: new Date().toISOString()
          }
        ])

      if (error) throw error

      // Actualizar el contador de participantes
      const { error: updateError } = await supabase
        .from('torneos')
        .update({ current_participants: tournament.current_participants + 1 })
        .eq('id', selectedTournament)

      if (updateError) throw updateError

      alert('¡Inscripción exitosa! Te contactaremos pronto.')
      setSelectedTournament(null)
      setShowPayment(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        partner_name: '',
        partner_email: '',
        partner_phone: ''
      })
      fetchtorneos() // Actualizar la lista de torneos
    } catch (error) {
      console.error('Error al finalizar la inscripción:', error)
      alert('Hubo un error al finalizar tu inscripción. Por favor contacta al administrador.')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading torneos...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {torneos.map((tournament) => (
        <div
          key={tournament.id}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tournament.name}
            </h3>
            <p className="text-gray-600 mb-4">{tournament.description}</p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <p>
                <span className="font-medium">Fecha:</span>{' '}
                {new Date(tournament.start_date).toLocaleDateString()} -{' '}
                {new Date(tournament.end_date).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Precio:</span> ${tournament.price} ARS
              </p>
              <p>
                <span className="font-medium">Participantes:</span>{' '}
                {tournament.current_participants}/{tournament.max_participants}
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedTournament(tournament.id)}
                className="w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Inscribirse
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Modal de inscripción */}
      {selectedTournament && !showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Inscripción al Torneo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del compañero</label>
                <input
                  type="text"
                  name="partner_name"
                  value={formData.partner_name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email del compañero</label>
                <input
                  type="email"
                  name="partner_email"
                  value={formData.partner_email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono del compañero</label>
                <input
                  type="tel"
                  name="partner_phone"
                  value={formData.partner_phone}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setSelectedTournament(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Continuar al Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {selectedTournament && showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Pago de Inscripción</h2>
            <PaymentForm
              tournament={torneos.find(t => t.id === selectedTournament)}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={() => setShowPayment(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
} 