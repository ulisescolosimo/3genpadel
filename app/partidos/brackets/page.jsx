'use client'

import { Button } from '@/components/ui/button'
import { Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function BracketsPage() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-[#E2FF1B]">Brackets</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Visualiza los brackets de las diferentes ligas
          </p>
        </div>

        {/* League Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Liga Octubre/Noviembre Card - Current */}
            <Link href="/partidos/brackets/liga-octubre-noviembre">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border-2 border-[#E2FF1B]/30 p-8 hover:border-[#E2FF1B]/70 transition-all duration-300 cursor-pointer group relative">
                <div className="absolute top-4 right-4">
                  <span className="bg-[#E2FF1B] text-black text-xs font-bold px-2 py-1 rounded-full">
                    ACTUAL
                  </span>
                </div>
                <div className="text-center">
                  <Trophy className="h-12 w-12 text-[#E2FF1B] mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Liga Octubre/Noviembre
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">
                    Temporada 2025
                  </p>
                  <div className="flex items-center justify-center text-[#E2FF1B] text-sm font-medium">
                    Ver Brackets
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Liga Agosto Card - Historical */}
            <Link href="/partidos/brackets/liga-agosto">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-8 hover:border-[#E2FF1B]/50 transition-all duration-300 cursor-pointer group">
                <div className="text-center">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Liga Agosto
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">
                    Temporada 2025
                  </p>
                  <div className="flex items-center justify-center text-[#E2FF1B] text-sm font-medium">
                    Ver Brackets
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
