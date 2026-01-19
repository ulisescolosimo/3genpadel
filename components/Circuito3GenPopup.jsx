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
          cursor: pointer !important;
          -webkit-tap-highlight-color: rgba(226, 255, 27, 0.2) !important;
          tap-highlight-color: rgba(226, 255, 27, 0.2) !important;
        }
        [data-radix-dialog-content] > button[data-state] svg {
          color: #E2FF1B !important;
        }
        @media (max-width: 640px) {
          [data-radix-dialog-content] {
            margin: 0.5rem !important;
          }
        }
      `}} />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[92vw] sm:w-[95vw] max-w-[500px] mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-[#E2FF1B]/30 p-5 sm:p-6 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto !grid !grid-cols-1 gap-0 [&>button]:absolute [&>button]:right-2.5 [&>button]:top-2.5 [&>button]:sm:right-4 [&>button]:sm:top-4 [&>button]:w-9 [&>button]:h-9 [&>button]:sm:w-10 [&>button]:sm:h-10 [&>button]:min-w-[36px] [&>button]:min-h-[36px] [&>button]:!text-[#E2FF1B] [&>button]:!opacity-100 [&>button]:!bg-transparent [&>button]:hover:!bg-transparent [&>button]:!border-none [&>button]:!outline-none [&>button]:!ring-0 [&>button]:!ring-offset-0 [&>button]:!shadow-none [&>button]:focus:!outline-none [&>button]:focus:!ring-0 [&>button]:focus:!ring-offset-0 [&>button]:focus-visible:!outline-none [&>button]:focus-visible:!ring-0 [&>button]:active:!outline-none [&>button]:active:!ring-0 [&>button]:touch-manipulation [&>button>svg]:!text-[#E2FF1B] [&>button>svg]:w-5 [&>button>svg]:h-5 [&>button>svg]:sm:w-5 [&>button>svg]:sm:h-5">
        <div className="flex flex-col items-center justify-center text-center w-full -mt-1 sm:mt-0">
          <DialogHeader className="text-center w-full px-1 sm:px-0 !items-center space-y-0">
            <div className="flex items-center justify-center mb-4 sm:mb-5">
              <div className="p-3 sm:p-3.5 bg-[#E2FF1B]/20 rounded-full">
                <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-[#E2FF1B]" />
              </div>
            </div>
            <DialogTitle className="text-lg sm:text-2xl font-bold text-center text-white mx-auto px-1 leading-tight sm:leading-normal">
              ¡Bienvenido al Circuito 3GEN!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300 mt-4 sm:mt-5 space-y-3 sm:space-y-4 mx-auto px-1">
              <p className="text-sm sm:text-base leading-relaxed px-1">
                Competí en el circuito de pádel más competitivo de la región. 
                Mejorá tu juego, ascendé de división y demostrá tu nivel.
              </p>
              <div className="flex flex-col gap-2.5 sm:gap-3 pt-1 sm:pt-2 items-start w-full max-w-xs sm:max-w-sm mx-auto">
                <div className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-[#E2FF1B] w-full">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#E2FF1B] rounded-full flex-shrink-0 mt-0.5"></div>
                  <span className="text-left flex-1 leading-relaxed">Sistema de rankings y ascensos</span>
                </div>
                <div className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-[#E2FF1B] w-full">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#E2FF1B] rounded-full flex-shrink-0 mt-0.5"></div>
                  <span className="text-left flex-1 leading-relaxed">Partidos organizados regularmente</span>
                </div>
                <div className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-[#E2FF1B] w-full">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#E2FF1B] rounded-full flex-shrink-0 mt-0.5"></div>
                  <span className="text-left flex-1 leading-relaxed">División inicial según tu nivel</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 sm:gap-4 mt-5 sm:mt-6 w-full max-w-md px-1 sm:px-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 w-full">
              <Button
                onClick={handleGoToCircuito}
                className="flex-1 bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 active:bg-[#E2FF1B]/80 font-semibold text-sm sm:text-base py-3.5 sm:py-3 min-h-[48px] sm:min-h-[44px] touch-manipulation transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  Ver Circuito 3GEN
                  <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4" />
                </span>
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-[#E2FF1B]/30 text-[#E2FF1B] hover:bg-[#E2FF1B]/10 active:bg-[#E2FF1B]/5 text-sm sm:text-base py-3.5 sm:py-3 min-h-[48px] sm:min-h-[44px] touch-manipulation transition-colors"
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
