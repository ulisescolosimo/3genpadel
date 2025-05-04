'use client'

import Link from 'next/link'
import { Trophy } from 'lucide-react'

export default function FloatingRankingsButton() {
  return (
    <Link
      href="/rankings"
      className="fixed bottom-6 left-6 z-50 group hidden md:block"
    >
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E2FF1B] to-[#E2FF1B]/50 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center gap-2 px-4 py-2.5 bg-black rounded-full border border-gray-800 group-hover:border-[#E2FF1B]/40 transition-all duration-300">
          <Trophy className="w-5 h-5 text-[#E2FF1B] group-hover:scale-110 transition-transform duration-300" />
          <span className="text-sm font-medium text-white">Rankings</span>
        </div>
      </div>
    </Link>
  )
} 