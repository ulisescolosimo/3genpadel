'use client'

import { MapPin, Phone, Clock, MessageCircle } from 'lucide-react'

export default function Contacto() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E2FF1B]/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Contactanos
            </h1>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              Estamos acá para ayudarte. Visitá nuestras sedes o contactanos por WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* WhatsApp Contact - Featured Section */}
          <div className="mb-6 sm:mb-8">
            <div className="max-w-xl mx-auto">
              <div className="relative bg-gradient-to-br from-green-500/10 via-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden group hover:border-green-500/50 transition-all duration-300">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative text-center space-y-4">
                  {/* Icon */}
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-2xl flex items-center justify-center border-2 border-green-500/40 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    Contactanos por WhatsApp
                  </h2>
                  
                  {/* Description */}
                  <p className="text-gray-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                    Te respondemos rápido y te ayudamos con lo que necesites
                  </p>
                  
                  {/* WhatsApp Button */}
                  <div className="pt-2">
                    <a 
                      href="https://wa.me/5491157516215" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-green-500/30 text-base sm:text-lg w-full sm:w-auto min-w-[240px] group/btn"
                    >
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:rotate-12 transition-transform duration-300" />
                      <span>+54 9 11 5751-6215</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sedes Grid */}
          <div className="mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-5 sm:mb-6 text-center">
              Conocé Nuestras Sedes
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Sede La Normanda */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-5 sm:p-6 hover:border-[#E2FF1B]/30 transition-all duration-300 shadow-xl">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#E2FF1B]/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#E2FF1B]/30">
                    <MapPin className="w-5 h-5 text-[#E2FF1B]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Sede La Normanda</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-0">
                      Sede principal en Colegiales
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#E2FF1B] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium mb-0.5 text-sm">Dirección</p>
                      <a 
                        href="https://maps.app.goo.gl/MYzTca8WNtTzGYv68" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[#E2FF1B] transition-colors text-sm block"
                      >
                        Delgado 864, Colegiales, CABA
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#E2FF1B] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium mb-0.5 text-sm">Horarios</p>
                      <p className="text-gray-400 text-sm">
                        Lunes a Viernes: 8:00 - 22:00
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sede Olleros */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-white/10 rounded-xl p-5 sm:p-6 hover:border-[#E2FF1B]/30 transition-all duration-300 shadow-xl">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#E2FF1B]/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#E2FF1B]/30">
                    <MapPin className="w-5 h-5 text-[#E2FF1B]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Sede Olleros</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-0">
                      En Palermo
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#E2FF1B] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium mb-0.5 text-sm">Dirección</p>
                      <a 
                        href="https://maps.app.goo.gl/mPNFhNtvzvppkdCh6" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[#E2FF1B] transition-colors text-sm block"
                      >
                        Olleros 1515, Buenos Aires
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#E2FF1B] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium mb-0.5 text-sm">Horarios</p>
                      <p className="text-gray-400 text-sm">
                        Martes, Miércoles, Viernes: 12:00 - 16:00
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}