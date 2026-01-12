'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, ArrowRight } from 'lucide-react'

export default function Circuito3GenPopup() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Solo mostrar si el usuario está autenticado y no está cargando
    if (!loading && user) {
      // Pequeño delay para que la página cargue completamente
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [user, loading])

  const handleGoToCircuito = () => {
    setIsOpen(false)
    router.push('/circuito3gen')
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  // No renderizar nada si no hay usuario o está cargando
  if (loading || !user) {
    return null
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        [data-radix-dialog-content] > button[data-state],
        [data-radix-dialog-content] > button[data-state]:hover,
        [data-radix-dialog-content] > button[data-state]:focus,
        [data-radix-dialog-content] > button[data-state]:focus-visible,
        [data-radix-dialog-content] > button[data-state]:active {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          --tw-ring-width: 0 !important;
          --tw-ring-offset-width: 0 !important;
          --tw-ring-color: transparent !important;
          --tw-ring-offset-color: transparent !important;
          ring: none !important;
          ring-width: 0 !important;
          ring-offset: 0 !important;
          ring-offset-width: 0 !important;
        }
        [data-radix-dialog-content] > button[data-state] svg {
          color: #E2FF1B !important;
        }
      `}} />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] mx-4 sm:mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-[#E2FF1B]/30 p-4 sm:p-6 max-h-[90vh] overflow-y-auto !grid !grid-cols-1 [&>button]:absolute [&>button]:right-3 [&>button]:top-3 [&>button]:sm:right-4 [&>button]:sm:top-4 [&>button]:w-8 [&>button]:h-8 [&>button]:sm:w-10 [&>button]:sm:h-10 [&>button]:!text-[#E2FF1B] [&>button]:!opacity-100 [&>button]:!bg-transparent [&>button]:hover:!bg-transparent [&>button]:!border-none [&>button]:!outline-none [&>button]:!ring-0 [&>button]:!ring-offset-0 [&>button]:!shadow-none [&>button]:focus:!outline-none [&>button]:focus:!ring-0 [&>button]:focus:!ring-offset-0 [&>button]:focus-visible:!outline-none [&>button]:focus-visible:!ring-0 [&>button]:active:!outline-none [&>button]:active:!ring-0 [&>button>svg]:!text-[#E2FF1B] [&>button>svg]:w-4 [&>button>svg]:h-4 [&>button>svg]:sm:w-5 [&>button>svg]:sm:h-5">
        <div className="flex flex-col items-center justify-center text-center w-full">
          <DialogHeader className="text-center w-full px-2 sm:px-0 !items-center">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="p-2.5 sm:p-3 bg-[#E2FF1B]/20 rounded-full">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-[#E2FF1B]" />
              </div>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-white mx-auto px-2">
              ¡Bienvenido al Circuito 3GEN!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300 mt-3 sm:mt-4 space-y-2 sm:space-y-3 mx-auto px-2">
              <p className="text-sm sm:text-base leading-relaxed">
                Competí en el circuito de pádel más competitivo de la región. 
                Mejorá tu juego, ascendé de división y demostrá tu nivel.
              </p>
              <div className="flex flex-col gap-2 sm:gap-2.5 pt-2 sm:pt-3 items-center">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#E2FF1B]">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#E2FF1B] rounded-full flex-shrink-0"></div>
                  <span className="text-left">Sistema de rankings y ascensos</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#E2FF1B]">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#E2FF1B] rounded-full flex-shrink-0"></div>
                  <span className="text-left">Partidos organizados regularmente</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#E2FF1B]">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#E2FF1B] rounded-full flex-shrink-0"></div>
                  <span className="text-left">División inicial según tu nivel</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 sm:gap-4 mt-4 sm:mt-6 w-full max-w-md px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full">
              <Button
                onClick={handleGoToCircuito}
                className="flex-1 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 font-semibold text-sm sm:text-base py-2.5 sm:py-3 touch-manipulation"
              >
                Ver Circuito 3GEN
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-[#E2FF1B]/30 text-[#E2FF1B] hover:bg-[#E2FF1B]/10 text-sm sm:text-base py-2.5 sm:py-3 touch-manipulation"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
