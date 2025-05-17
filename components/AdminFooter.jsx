'use client'

import { useAuth } from '@/components/AuthProvider'

export default function AdminFooter() {
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-800 bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            © {currentYear} 3gen Padel. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Panel de Administración</span>
            {user && (
              <span className="text-[#E2FF1B]">
                • {user.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
} 