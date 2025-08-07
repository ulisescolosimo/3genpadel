"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Users, Clock, Calendar, MapPin } from 'lucide-react'
import { formatArgentineDateLong, formatArgentineDateShort } from '@/lib/date-utils'

export default function MatchDetailModal({ partido, isOpen, onClose }) {
  if (!partido) return null

  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'N/A'
    
    const capitalizarApellido = (apellido) => {
      if (!apellido) return ''
      return apellido
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ')
    }
    
    const jugador1 = equipo.titular_1 ? `${equipo.titular_1.nombre} ${capitalizarApellido(equipo.titular_1.apellido)}` : 'N/A'
    const jugador2 = equipo.titular_2 ? `${equipo.titular_2.nombre} ${capitalizarApellido(equipo.titular_2.apellido)}` : 'N/A'
    return `${jugador1} / ${jugador2}`
  }

  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'default',
      jugado: 'secondary',
      cancelado: 'destructive'
    }
    const labels = {
      pendiente: 'Programado',
      jugado: 'Finalizado',
      cancelado: 'Cancelado'
    }
    return <Badge variant={variants[estado] || 'secondary'} className="text-xs sm:text-sm">{labels[estado] || estado}</Badge>
  }

  const getRondaBadge = (ronda) => {
    const colors = {
      'Grupos': 'bg-blue-500',
      'Octavos': 'bg-purple-500',
      'Cuartos': 'bg-orange-500',
      'Semifinal': 'bg-red-500',
      'Final': 'bg-yellow-500'
    }
    return (
      <Badge className={`${colors[ronda] || 'bg-gray-500'} text-white text-xs sm:text-sm`}>
        {ronda}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha por definir'
    return formatArgentineDateLong(dateString)
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Hora por definir'
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoriaNombre = () => {
    if (!partido.liga_categorias) return 'N/A'
    const liga = partido.liga_categorias.ligas
    const categoria = partido.liga_categorias.categoria
    return `${liga?.nombre || 'N/A'} - ${categoria}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 backdrop-blur-sm border-white/10 text-white w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-[#E2FF1B] text-lg sm:text-xl">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            Detalles del Partido
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Información del torneo */}
          <Card className="bg-black/20 border-white/10">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                {getRondaBadge(partido.ronda)}
                {getEstadoBadge(partido.estado)}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                {getCategoriaNombre()}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  {formatDate(partido.fecha)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {formatTime(partido.fecha)}
                </div>
                {partido.cancha && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-blue-400">Cancha {partido.cancha}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipos */}
          <div className="grid grid-cols-1 gap-4">
            {/* Equipo A */}
            <Card className="bg-black/20 border-white/10">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#E2FF1B]" />
                  <span className="text-xs sm:text-sm text-gray-400">Equipo A</span>
                </div>
                <div className="space-y-2">
                  <div className="text-center">
                    <p className="font-semibold text-white text-sm sm:text-base">
                      {getEquipoNombre(partido.equipo_a)}
                    </p>
                  </div>
                  {partido.equipo_a?.titular_1 && (
                    <div className="text-xs sm:text-sm text-gray-300">
                      <span className="text-gray-400">Titular 1:</span> {partido.equipo_a.titular_1.nombre} {partido.equipo_a.titular_1.apellido}
                    </div>
                  )}
                  {partido.equipo_a?.titular_2 && (
                    <div className="text-xs sm:text-sm text-gray-300">
                      <span className="text-gray-400">Titular 2:</span> {partido.equipo_a.titular_2.nombre} {partido.equipo_a.titular_2.apellido}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Equipo B */}
            <Card className="bg-black/20 border-white/10">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#E2FF1B]" />
                  <span className="text-xs sm:text-sm text-gray-400">Equipo B</span>
                </div>
                <div className="space-y-2">
                  <div className="text-center">
                    <p className="font-semibold text-white text-sm sm:text-base">
                      {getEquipoNombre(partido.equipo_b)}
                    </p>
                  </div>
                  {partido.equipo_b?.titular_1 && (
                    <div className="text-xs sm:text-sm text-gray-300">
                      <span className="text-gray-400">Titular 1:</span> {partido.equipo_b.titular_1.nombre} {partido.equipo_b.titular_1.apellido}
                    </div>
                  )}
                  {partido.equipo_b?.titular_2 && (
                    <div className="text-xs sm:text-sm text-gray-300">
                      <span className="text-gray-400">Titular 2:</span> {partido.equipo_b.titular_2.nombre} {partido.equipo_b.titular_2.apellido}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ganador */}
          {partido.equipo_ganador && (
            <Card className="bg-[#E2FF1B]/10 border-[#E2FF1B]/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#E2FF1B]" />
                  <span className="text-[#E2FF1B] font-semibold text-sm sm:text-base">Ganador</span>
                </div>
                <p className="text-white font-semibold text-sm sm:text-base">
                  {getEquipoNombre(partido.equipo_ganador)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Resultado */}
          {partido.resultado && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 font-semibold text-sm sm:text-base">Resultado</span>
                </div>
                <p className="text-white font-semibold text-sm sm:text-base">
                  {partido.resultado}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 