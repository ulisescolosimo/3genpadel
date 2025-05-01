import React from 'react'

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-800 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-[#E2FF1B] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner className="mb-4" />
        <p className="text-gray-300 animate-pulse">Cargando...</p>
      </div>
    </div>
  )
} 