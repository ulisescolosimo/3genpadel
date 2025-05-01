'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Script from 'next/script'

export default function PaymentForm({ tournament, onPaymentSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)
      
      // Crear la preferencia de pago usando la API de MercadoPago
      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournament: {
            id: tournament.id,
            name: tournament.name,
            price: tournament.price
          }
        })
      })

      if (!response.ok) {
        throw new Error('Error al crear la preferencia')
      }

      const data = await response.json()
      
      // Redirigir a la pasarela de pago de MercadoPago
      window.location.href = data.init_point
    } catch (error) {
      console.error('Error al crear la preferencia:', error)
      alert('Hubo un error al procesar el pago. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Script
        src={`https://sdk.mercadopago.com/js/v2?public_key=${process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY}`}
        strategy="afterInteractive"
      />
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Detalles del Pago</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Torneo:</span> {tournament.name}</p>
          <p><span className="font-medium">Precio:</span> ${tournament.price} ARS</p>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Continuar al Pago'}
        </button>
      </div>
    </div>
  )
} 