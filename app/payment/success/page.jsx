'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la página principal después de 5 segundos
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">¡Pago Exitoso!</h1>
        <p className="text-gray-600 mb-4">Tu pago ha sido procesado correctamente.</p>
        <p className="text-gray-500">Serás redirigido a la página principal en unos segundos...</p>
      </div>
    </div>
  )
} 