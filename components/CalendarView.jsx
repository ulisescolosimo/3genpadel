"use client"

import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Users, Clock } from 'lucide-react'

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function CalendarView({ partidos, onEventClick }) {
  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'N/A'
    const jugador1 = equipo.titular_1 ? `${equipo.titular_1.nombre} ${equipo.titular_1.apellido}` : 'N/A'
    const jugador2 = equipo.titular_2 ? `${equipo.titular_2.nombre} ${equipo.titular_2.apellido}` : 'N/A'
    return `${jugador1} / ${jugador2}`
  }

  // Convertir partidos a eventos del calendario
  const events = partidos.map(partido => ({
    id: partido.id,
    title: `${getEquipoNombre(partido.equipo_a)} vs ${getEquipoNombre(partido.equipo_b)}`,
    start: partido.fecha ? new Date(partido.fecha) : new Date(),
    end: partido.fecha ? new Date(new Date(partido.fecha).getTime() + 2 * 60 * 60 * 1000) : new Date(), // 2 horas de duración
    partido: partido,
    ronda: partido.ronda,
    estado: partido.estado,
    categoria: partido.liga_categorias?.categoria,
    liga: partido.liga_categorias?.ligas?.nombre
  }))

  const getRondaColor = (ronda) => {
    const colors = {
      'Grupos': '#3B82F6',
      'Octavos': '#8B5CF6',
      'Cuartos': '#F97316',
      'Semifinal': '#EF4444',
      'Final': '#EAB308'
    }
    return colors[ronda] || '#6B7280'
  }

  const getEstadoColor = (estado) => {
    const colors = {
      'pendiente': '#10B981',
      'jugado': '#6B7280',
      'cancelado': '#EF4444'
    }
    return colors[estado] || '#6B7280'
  }

  // Componente personalizado para eventos
  const EventComponent = ({ event }) => {
    return (
      <div 
        className="p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
        style={{ 
          backgroundColor: getRondaColor(event.ronda),
          borderLeft: `4px solid ${getEstadoColor(event.estado)}`
        }}
        onClick={() => onEventClick && onEventClick(event.partido)}
      >
        <div className="font-semibold text-white mb-1">
          {event.title}
        </div>
        <div className="text-white/80">
          {format(event.start, 'HH:mm')} - {event.ronda}
        </div>
        <div className="text-white/70">
          {event.liga} - {event.categoria}
        </div>
      </div>
    )
  }

  // Componente personalizado para eventos en vista de mes
  const EventComponentMonth = ({ event }) => {
    return (
      <div 
        className="p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
        style={{ 
          backgroundColor: getRondaColor(event.ronda),
          borderLeft: `3px solid ${getEstadoColor(event.estado)}`
        }}
        onClick={() => onEventClick && onEventClick(event.partido)}
      >
        <div className="font-semibold text-white truncate">
          {event.title}
        </div>
        <div className="text-white/80 text-xs">
          {format(event.start, 'HH:mm')} - {event.ronda}
        </div>
      </div>
    )
  }

  // Configuración de vistas
  const views = {
    month: true,
    week: true,
    day: true,
    agenda: true
  }

  // Configuración de mensajes en español
  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango.',
    showMore: total => `+ Ver más (${total})`
  }

  // Estilos personalizados para el calendario
  const calendarStyles = {
    height: '600px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px'
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={calendarStyles}
        views={views}
        defaultView="month"
        messages={messages}
        components={{
          event: EventComponent,
          month: {
            event: EventComponentMonth
          }
        }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: getRondaColor(event.ronda),
            borderLeft: `4px solid ${getEstadoColor(event.estado)}`,
            borderRadius: '6px',
            color: 'white',
            border: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }
        })}
        dayPropGetter={(date) => ({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        })}
        slotPropGetter={(date) => ({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }
        })}
        className="text-white"
      />
    </div>
  )
} 