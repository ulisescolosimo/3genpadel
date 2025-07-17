'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  LogOut,
  Menu
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useState } from 'react'

export default function AdminHeader() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Inscripciones Ligas',
      href: '/admin/inscripciones-ligas',
      icon: Users
    },
    {
      title: 'Configuración',
      href: '/admin/configuracion',
      icon: Settings
    }
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título */}
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <img src="/images/logo/logo.png" alt="3gen Padel" className="h-8" />
            <span className="text-white font-semibold text-lg">Panel Admin</span>
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-[#E2FF1B] text-black' 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={signOut}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>

            {/* Botón móvil */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white focus:outline-none p-2"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm">
            <nav className="py-4">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-[#E2FF1B] text-black' 
                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
                <li>
                  <button
                    onClick={() => {
                      signOut()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar sesión</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
} 