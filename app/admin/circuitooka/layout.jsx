'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Trophy, 
  Calendar, 
  Users, 
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Shuffle,
  PlayCircle,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/admin/circuitooka', label: 'Dashboard', icon: Trophy },
  { href: '/admin/circuitooka/etapas', label: 'Etapas', icon: Calendar },
  { href: '/admin/circuitooka/divisiones', label: 'Divisiones', icon: Target },
  { href: '/admin/circuitooka/configuracion', label: 'Configuración', icon: Settings },
  { href: '/admin/circuitooka/inscripciones', label: 'Inscripciones', icon: Users },
  { href: '/admin/circuitooka/partidos', label: 'Partidos', icon: PlayCircle },
  { href: '/admin/circuitooka/rankings', label: 'Rankings', icon: BarChart3 },
  { href: '/admin/circuitooka/ascensos-descensos', label: 'Ascensos/Descensos', icon: TrendingUp },
  { href: '/admin/circuitooka/sorteos', label: 'Sorteos', icon: Shuffle },
  { href: '/admin/circuitooka/playoffs', label: 'Playoffs', icon: TrendingDown },
  { href: '/admin/circuitooka/reemplazos', label: 'Reemplazos', icon: UserCheck },
]

export default function CircuitookaLayout({ children }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "bg-gray-900 border-r border-gray-800 min-h-screen transition-all duration-300 relative",
          isCollapsed ? "w-20" : "w-64"
        )}>
          <div className="p-4">
            <div className={cn(
              "flex items-center mb-6",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              <h2 className={cn(
                "font-bold text-white flex items-center gap-2 transition-opacity duration-300",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                <span className="text-xl">Circuitooka</span>
              </h2>
              {isCollapsed && (
                <div className="flex align-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                </div>
              )}
            </div>
            
            {/* Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute top-4 right-0 translate-x-1/2 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors z-10"
              aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-300" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-300" />
              )}
            </button>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/admin/circuitooka' && pathname?.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center py-3 rounded-lg transition-colors relative group',
                      isActive
                        ? 'bg-yellow-500 text-black font-semibold'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                      isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={cn(
                      "transition-opacity duration-300 whitespace-nowrap",
                      isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                    )}>
                      {item.label}
                    </span>
                    {/* Tooltip para cuando está colapsada */}
                    {isCollapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

