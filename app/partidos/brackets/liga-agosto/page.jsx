'use client'

import { Button } from '@/components/ui/button'
import { Trophy, ArrowRight, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function LigaAgostoPage() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-10">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/partidos/brackets">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Brackets
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center bg-[#E2FF1B]/10 px-4 py-2 rounded-full mb-4">
            <Calendar className="h-4 w-4 text-[#E2FF1B] mr-2" />
            <span className="text-[#E2FF1B] text-sm font-medium">Agosto 2025</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-[#E2FF1B]">Liga Agosto</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Brackets de la liga de Agosto 2025
          </p>
        </div>

        {/* League Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* C6 League Card */}
            <Link href="/partidos/brackets/liga-agosto/c6">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-[#E2FF1B]/50 transition-all duration-300 cursor-pointer group">
                <div className="text-center">
                  <Trophy className="h-8 w-8 text-[#E2FF1B] mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Liga C6
                  </h2>
                  <div className="flex items-center justify-center text-[#E2FF1B] text-sm font-medium">
                    Ver Bracket
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* C7 League Card */}
            <Link href="/partidos/brackets/liga-agosto/c7">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-[#E2FF1B]/50 transition-all duration-300 cursor-pointer group">
                <div className="text-center">
                  <Trophy className="h-8 w-8 text-[#E2FF1B] mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Liga C7
                  </h2>
                  <div className="flex items-center justify-center text-[#E2FF1B] text-sm font-medium">
                    Ver Bracket
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* C8 League Card */}
            <Link href="/partidos/brackets/liga-agosto/c8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-[#E2FF1B]/50 transition-all duration-300 cursor-pointer group">
                <div className="text-center">
                  <Trophy className="h-8 w-8 text-[#E2FF1B] mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Liga C8
                  </h2>
                  <div className="flex items-center justify-center text-[#E2FF1B] text-sm font-medium">
                    Ver Bracket
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

