'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Settings,
  LogOut,
  Menu
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useState } from 'react'

export default function AdminSidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Torneos',
      href: '/admin/torneos',
      icon: Trophy
    },
    {
      title: 'Inscripciones',
      href: '/admin/inscripciones',
      icon: Users
    },
    {
      title: 'Configuración',
      href: '/admin/configuracion',
      icon: Settings
    }
  ]

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gray-900/50 border-r border-gray-800 transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Botón de colapsar/expandir */}
        <div className={`flex items-center justify-between p-4 ${isCollapsed ? 'justify-center' : ''}`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white focus:outline-none"
            aria-label="Colapsar barra lateral"
          >
            <Menu className="w-6 h-6" />
          </button>
          {!isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2 ml-2">
              <img src="/images/logo/logo.png" alt="3gen Padel" className="h-8" />
              <span className="text-white font-semibold">Admin</span>
            </Link>
          )}
        </div>

        {/* Menú */}
        <nav className="flex-1 px-2">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-[#E2FF1B] text-black' 
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-gray-800">
          <button
            onClick={signOut}
            className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-lg transition-colors`}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  )
} 