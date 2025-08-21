'use client'

import { Button } from '@/components/ui/button'
import { Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function BracketsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-10">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
            <span className="text-[#E2FF1B]">Brackets</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Visualiza todos los brackets de las ligas
          </p>
        </div>

        {/* League Cards */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* C6 League Card */}
            <div className="bg-gradient-to-r from-[#E2FF1B]/10 to-[#E2FF1B]/5 backdrop-blur-sm rounded-2xl border border-[#E2FF1B]/30 p-6 hover:border-[#E2FF1B]/50 transition-all duration-300">
              <div className="text-center">
                <Trophy className="h-12 w-12 text-[#E2FF1B] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-[#E2FF1B] mb-4">
                  Liga Agosto 2025 - C6
                </h2>
                <Link href="/partidos/brackets/c6">
                  <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/20">
                    Ver Bracket
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* C7 League Card */}
            <div className="bg-gradient-to-r from-[#E2FF1B]/10 to-[#E2FF1B]/5 backdrop-blur-sm rounded-2xl border border-[#E2FF1B]/30 p-6 hover:border-[#E2FF1B]/50 transition-all duration-300">
              <div className="text-center">
                <Trophy className="h-12 w-12 text-[#E2FF1B] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-[#E2FF1B] mb-4">
                  Liga Agosto 2025 - C7
                </h2>
                <Link href="/partidos/brackets/c7">
                  <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/20">
                    Ver Bracket
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* C8 League Card */}
            <div className="bg-gradient-to-r from-[#E2FF1B]/10 to-[#E2FF1B]/5 backdrop-blur-sm rounded-2xl border border-[#E2FF1B]/30 p-6 hover:border-[#E2FF1B]/50 transition-all duration-300">
              <div className="text-center">
                <Trophy className="h-12 w-12 text-[#E2FF1B] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-[#E2FF1B] mb-4">
                  Liga Agosto 2025 - C8
                </h2>
                <Link href="/partidos/brackets/c8">
                  <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#E2FF1B]/20">
                    Ver Bracket
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
