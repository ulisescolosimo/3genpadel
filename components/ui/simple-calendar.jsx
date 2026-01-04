'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns'
import { es } from 'date-fns/locale'

export function SimpleCalendar({
  selected,
  onSelect,
  disabled,
  fromDate,
  className,
}) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

  // Obtener el primer día del mes y el último día
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  
  // Obtener el primer día de la semana (lunes) del mes y el último día de la semana (domingo)
  // Usamos 1 para lunes como primer día de la semana
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1, locale: es })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1, locale: es })
  
  // Generar todos los días del calendario
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Nombres de los días de la semana (empezando en lunes)
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDayClick = (day) => {
    if (disabled && disabled(day)) return
    if (fromDate && day < fromDate) return
    onSelect?.(day)
  }

  const isDayDisabled = (day) => {
    if (disabled && disabled(day)) return true
    if (fromDate && day < fromDate) return true
    return false
  }

  const isSelected = (day) => {
    return selected && isSameDay(day, selected)
  }

  const isToday = (day) => {
    return isSameDay(day, new Date())
  }

  return (
    <div className={cn("w-full p-2 sm:p-3", className)}>
      {/* Header con mes/año y controles */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-8 w-8 sm:h-7 sm:w-7 text-white active:bg-white/10 touch-manipulation"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-white font-medium text-sm sm:text-base">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8 sm:h-7 sm:w-7 text-white active:bg-white/10 touch-manipulation"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-gray-400 text-[10px] sm:text-xs font-medium text-center py-1.5 sm:py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isDisabled = isDayDisabled(day)
          const isSelectedDay = isSelected(day)
          const isTodayDay = isToday(day)

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={isDisabled}
              className={cn(
                "h-10 w-10 sm:h-9 sm:w-9 text-xs sm:text-sm rounded-md transition-colors touch-manipulation",
                isCurrentMonth ? "text-white" : "text-gray-500 opacity-50",
                isDisabled && "opacity-30 cursor-not-allowed active:bg-transparent",
                !isDisabled && "active:bg-white/10",
                isTodayDay && !isSelectedDay && "bg-white/20 border border-white/40",
                isSelectedDay && "!bg-[#E2FF1B] !text-black active:!bg-[#E2FF1B] font-semibold"
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

