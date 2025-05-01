'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentCancel() {
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
        <h1 className="text-2xl font-bold text-red-600 mb-4">Pago Cancelado</h1>
        <p className="text-gray-600 mb-4">El proceso de pago ha sido cancelado.</p>
        <p className="text-gray-500">Serás redirigido a la página principal en unos segundos...</p>
      </div>
    </div>
  )
} 