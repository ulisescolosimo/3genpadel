'use client'

import { useState } from 'react'
import { FaWhatsapp, FaTimes } from 'react-icons/fa'
import { useWhatsAppVisibility } from '@/hooks/useWhatsAppVisibility'

export default function FloatingWhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { isWhatsAppVisible } = useWhatsAppVisibility()
  
  const phoneNumbers = [
    { number: '+5491135921988', label: '+54 9 11 3592-1988' },
    { number: '+5491149285316', label: '+54 9 11 4928-5316' },
    { number: '+5491132673029', label: '+54 9 11 3267-3029' }
  ]

  const openWhatsApp = (phoneNumber) => {
    const message = encodeURIComponent('Hola! Me gustaría obtener más información.')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
    setIsOpen(false)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  // No renderizar si no está visible
  if (!isWhatsAppVisible) {
    return null
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 group block"
        aria-label="Contactar por WhatsApp"
      >
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-green-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center justify-center w-14 h-14 bg-black rounded-full border border-gray-800 group-hover:border-green-400/40 transition-all duration-300 hover:scale-105">
            <FaWhatsapp className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
      </button>

      {/* Modal/Dialog mejorado */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl p-6 text-white">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                aria-label="Cerrar"
              >
                <FaTimes className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <FaWhatsapp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Contactar por WhatsApp</h3>
                  <p className="text-green-100 text-sm">Elige un número para iniciar una conversación</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-3">
                {phoneNumbers.map((phone, index) => (
                  <button
                    key={index}
                    onClick={() => openWhatsApp(phone.number)}
                    className="w-full group flex items-center gap-4 p-4 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                  >
                    <div className="bg-green-500 p-3 rounded-full group-hover:bg-green-600 transition-colors duration-300">
                      <FaWhatsapp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-300">
                        {phone.label}
                      </div>
                      <div className="text-sm text-gray-500 group-hover:text-green-600 transition-colors duration-300">
                        Hacer clic para abrir WhatsApp
                      </div>
                    </div>
                    <div className="text-green-500 group-hover:text-green-600 transition-colors duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500">
                  Responderemos en breve
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 