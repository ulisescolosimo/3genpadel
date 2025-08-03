'use client'

import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { AlertCircle, User, Shield } from 'lucide-react'

export default function ImpersonationBanner() {
  const { impersonatedUser, stopImpersonating } = useAuth()

  if (!impersonatedUser) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600/90 backdrop-blur-sm border-b border-yellow-500/30">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-200" />
              <span className="text-yellow-100 text-sm font-medium">
                Modo Administrador
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-yellow-200" />
              <span className="text-yellow-100 text-sm">
                Accediendo como: <strong>{impersonatedUser.nombre} {impersonatedUser.apellido}</strong>
              </span>
            </div>
          </div>
          
          <Button
            onClick={stopImpersonating}
            variant="outline"
            size="sm"
            className="border-yellow-400/30 text-yellow-100 hover:bg-yellow-500/20 hover:border-yellow-400/50"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Salir
          </Button>
        </div>
      </div>
    </div>
  )
} 