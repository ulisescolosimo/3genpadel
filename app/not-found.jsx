'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-[#E2FF1B]/10 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-9xl font-bold text-[#E2FF1B] relative z-10">404</h1>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">¡Ups! Página no encontrada</h2>
        <p className="text-gray-400 mb-8">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#E2FF1B] text-black font-medium rounded-lg hover:bg-[#E2FF1B]/90 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
} 