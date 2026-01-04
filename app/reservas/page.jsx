'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Users, Check, X, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SimpleCalendar } from "@/components/ui/simple-calendar"
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"


export default function ReservasPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [reservando, setReservando] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Cuando se selecciona una fecha, cargar horarios disponibles
  useEffect(() => {
    if (selectedDate && selectedCategoria && user) {
      fetchHorariosDisponibles()
    } else {
      setHorarios([])
    }
  }, [selectedDate, selectedCategoria, user])

  // Auto-avanzar al siguiente paso cuando se complete uno
  useEffect(() => {
    if (selectedCategoria && currentStep === 1) {
      setCurrentStep(2)
    }
  }, [selectedCategoria])

  useEffect(() => {
    if (selectedDate && currentStep === 2) {
      setCurrentStep(3)
    }
  }, [selectedDate])

  const fetchHorariosDisponibles = async () => {
    if (!selectedDate || !selectedCategoria) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const fechaStr = format(selectedDate, 'yyyy-MM-dd')
      
      const response = await fetch(`/api/reservas?horarios_disponibles=true&fecha=${fechaStr}&categoria=${selectedCategoria}&usuario_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        setHorarios(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al cargar horarios disponibles"
        })
      }
    } catch (error) {
      console.error('Error fetching horarios:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar horarios disponibles"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReservar = async (hora_inicio, hora_fin) => {
    if (!selectedDate || !selectedCategoria) return

    setReservando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const fechaStr = format(selectedDate, 'yyyy-MM-dd')

      const response = await fetch('/api/reservas/inscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          fecha: fechaStr,
          hora_inicio,
          hora_fin,
          categoria: selectedCategoria
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "¡Reserva solicitada!",
          description: result.message || "Tu solicitud está pendiente de confirmación",
          variant: "default",
        })
        // Refrescar horarios
        fetchHorariosDisponibles()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al reservar turno"
        })
      }
    } catch (error) {
      console.error('Error reserving turno:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al reservar turno"
      })
    } finally {
      setReservando(false)
    }
  }

  const handleCancelar = async (inscripcionId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`/api/reservas/inscripciones?inscripcion_id=${inscripcionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Reserva cancelada",
          description: result.message || "Has cancelado tu inscripción",
          variant: "default",
        })
        // Refrescar horarios
        fetchHorariosDisponibles()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al cancelar reserva"
        })
      }
    } catch (error) {
      console.error('Error canceling inscripcion:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cancelar reserva"
      })
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const parts = String(timeStr).split(':')
    return parts.slice(0, 2).join(':')
  }

  // Las categorías ya vienen con su nombre completo, no necesitamos conversión
  const getCategoriaNombre = (categoria) => categoria

  // Filtrar fechas: solo permitir martes (2), miércoles (3) y viernes (5), y no fechas pasadas
  const isDateDisabled = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateToCheck = new Date(date)
    dateToCheck.setHours(0, 0, 0, 0)
    
    // Deshabilitar fechas pasadas
    if (dateToCheck < today) {
      return true
    }
    
    // Solo permitir martes (2), miércoles (3) y viernes (5)
    const day = date.getDay()
    return day !== 2 && day !== 3 && day !== 5
  }

  // Cuando se cambia la categoría, limpiar fecha y horarios
  const handleCategoriaChange = (categoria) => {
    setSelectedCategoria(categoria)
    setSelectedDate(null)
    setHorarios([])
    setCurrentStep(2)
  }

  const handleStepClick = (step) => {
    // Solo permitir ir a pasos anteriores o al siguiente paso si el anterior está completo
    if (step === 1 || (step === 2 && selectedCategoria) || (step === 3 && selectedCategoria && selectedDate)) {
      setCurrentStep(step)
    }
  }

  const steps = [
    { number: 1, title: 'Categoría', description: 'Elige tu nivel', completed: !!selectedCategoria },
    { number: 2, title: 'Fecha', description: 'Selecciona el día', completed: !!selectedDate },
    { number: 3, title: 'Horario', description: 'Elige tu turno', completed: false },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/sede-olleros/clases-grupales')}
              className="text-white hover:text-[#E2FF1B] hover:bg-white/10 -ml-2 sm:ml-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white">
                Sistema de <span className="text-[#E2FF1B]">Reservas</span>
              </h1>
              <p className="text-gray-300 text-xs sm:text-base">Reserva tu turno para entrenamientos grupales</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Stepper Navigation */}
          <Card className="mb-4 sm:mb-8 bg-black/40 border-white/10">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex flex-row items-center justify-between gap-1 sm:gap-2">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1 min-w-0">
                    <button
                      onClick={() => handleStepClick(step.number)}
                      disabled={!step.completed && step.number !== currentStep && step.number > currentStep}
                      className={cn(
                        "flex flex-row items-center gap-2 sm:gap-3 flex-1 transition-all py-2 sm:py-0 min-w-0",
                        step.number === currentStep && "scale-105",
                        (!step.completed && step.number !== currentStep && step.number > currentStep) && "opacity-50 cursor-not-allowed",
                        step.number !== currentStep && step.completed && "cursor-pointer active:opacity-80"
                      )}
                    >
                      {/* Circle */}
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 transition-all font-semibold flex-shrink-0",
                        step.number === currentStep 
                          ? "bg-[#E2FF1B] text-black border-[#E2FF1B]"
                          : step.completed
                          ? "bg-green-600/20 text-green-400 border-green-600/50"
                          : "bg-gray-800 text-gray-500 border-gray-700"
                      )}>
                        {step.completed ? (
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-6 md:h-6" />
                        ) : (
                          <span className="text-xs sm:text-sm md:text-base">{step.number}</span>
                        )}
                      </div>
                      
                      {/* Text */}
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className={cn(
                          "text-[10px] sm:text-xs md:text-sm lg:text-base font-medium truncate w-full",
                          step.number === currentStep ? "text-[#E2FF1B]" : step.completed ? "text-green-400" : "text-gray-400"
                        )}>
                          {step.title}
                        </span>
                        <span className="text-[9px] sm:text-xs text-gray-500 hidden sm:block truncate w-full">{step.description}</span>
                      </div>
                    </button>
                    
                    {/* Connector */}
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600 mx-1 sm:mx-2 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card className="bg-black/40 border-white/10 min-h-[300px] sm:min-h-[400px]">
            {/* Paso 1: Selector de Categoría */}
            {currentStep === 1 && (
              <>
                <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <CardTitle className="text-white text-lg sm:text-2xl">Paso 1: Selecciona una categoría</CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Elige tu nivel de pádel
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 py-4 sm:py-6">
                    {[
                      { value: "Iniciante de cero", label: "Iniciante de cero", description: "Empieza desde cero" },
                      { value: "Principiante", label: "Principiante", description: "Nivel básico" },
                      { value: "Intermedio", label: "Intermedio", description: "Nivel medio" },
                      { value: "Avanzado", label: "Avanzado", description: "Nivel alto" },
                      { value: "Profesional", label: "Profesional", description: "Nivel experto" },
                    ].map((categoria) => (
                      <button
                        key={categoria.value}
                        onClick={() => handleCategoriaChange(categoria.value)}
                        className={cn(
                          "relative p-4 sm:p-6 rounded-lg border-2 transition-all text-left group active:scale-[0.98]",
                          selectedCategoria === categoria.value
                            ? "border-[#E2FF1B] bg-[#E2FF1B]/10"
                            : "border-white/10 bg-black/40 active:border-[#E2FF1B]/50 active:bg-black/60"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={cn(
                              "text-base sm:text-lg font-semibold mb-1",
                              selectedCategoria === categoria.value ? "text-[#E2FF1B]" : "text-white"
                            )}>
                              {categoria.label}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400">
                              {categoria.description}
                            </p>
                          </div>
                          {selectedCategoria === categoria.value && (
                            <div className="ml-3 sm:ml-4 flex-shrink-0">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E2FF1B] flex items-center justify-center">
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </>
            )}

            {/* Paso 2: Selección de Fecha */}
            {currentStep === 2 && (
              <>
                <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <CardTitle className="text-white text-lg sm:text-2xl">Paso 2: Selecciona una fecha</CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Las clases se realizan los martes, miércoles y viernes
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="flex flex-col items-center justify-center py-4 sm:py-6">
                    {selectedDate && (
                      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[#E2FF1B]/10 border border-[#E2FF1B]/30 rounded-lg w-full max-w-md">
                        <p className="text-xs sm:text-sm text-gray-300 mb-1">Fecha seleccionada:</p>
                        <p className="text-base sm:text-lg font-semibold text-[#E2FF1B] break-words">
                          {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    )}
                    <div className="w-full max-w-md">
                      <SimpleCalendar
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={isDateDisabled}
                        fromDate={new Date()}
                        className="bg-gray-800 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {/* Paso 3: Horarios Disponibles */}
            {currentStep === 3 && (
              <>
                <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <CardTitle className="text-white text-lg sm:text-2xl">Paso 3: Selecciona un horario</CardTitle>
                  <CardDescription className="text-gray-300 text-xs sm:text-sm">
                    Horarios disponibles para {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {loading ? (
                    <div className="flex justify-center items-center py-8 sm:py-12">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#E2FF1B]" />
                    </div>
                  ) : horarios.length === 0 ? (
                    <div className="text-center text-gray-400 py-6 sm:py-8 text-sm sm:text-base">
                      No hay horarios disponibles para esta fecha
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {horarios.map((horario, index) => (
                        <Card key={index} className="bg-black/40 border-white/10 active:border-[#E2FF1B]/30 transition-all duration-300 active:bg-black/60 group">
                          <CardContent className="p-3 sm:p-4">
                            {/* Header: Capacidad */}
                            <div className="flex items-center justify-end mb-2 sm:mb-3">
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>{horario.inscripciones_count}/{horario.capacidad}</span>
                              </div>
                            </div>

                            {/* Hora */}
                            <div className="mb-3 sm:mb-4">
                              <div className="flex items-center gap-2 text-white">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E2FF1B] flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-medium">{formatTime(horario.hora_inicio)} - {formatTime(horario.hora_fin)}</span>
                              </div>
                            </div>

                            {/* Estado y Botón de Acción */}
                            <div className="space-y-2">
                              {horario.mi_inscripcion && (
                                <div 
                                  className={cn(
                                    "w-full rounded-lg border px-2.5 sm:px-3 py-2 sm:py-2.5 text-[10px] sm:text-xs font-medium",
                                    horario.mi_inscripcion.estado === 'confirmada' 
                                      ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                                      : horario.mi_inscripcion.estado === 'pendiente'
                                      ? 'bg-[#E2FF1B]/10 text-[#E2FF1B] border-[#E2FF1B]/30'
                                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                                  )}
                                >
                                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                    {horario.mi_inscripcion.estado === 'confirmada' && (
                                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                    )}
                                    {horario.mi_inscripcion.estado === 'pendiente' && (
                                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin flex-shrink-0" />
                                    )}
                                    {horario.mi_inscripcion.estado === 'cancelada' && (
                                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                    )}
                                    <span className="text-center leading-tight">
                                      {horario.mi_inscripcion.estado === 'confirmada' 
                                        ? 'Confirmada' 
                                        : horario.mi_inscripcion.estado === 'pendiente'
                                        ? 'Pendiente'
                                        : 'Cancelada'}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {horario.mi_inscripcion ? (
                                horario.mi_inscripcion.estado === 'confirmada' ? (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleCancelar(horario.mi_inscripcion.id)}
                                    className="w-full border-red-600/30 text-red-400 active:bg-red-600/10 active:border-red-600/50 text-xs sm:text-sm h-9 sm:h-10"
                                    size="sm"
                                  >
                                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-2" />
                                    Cancelar
                                  </Button>
                                ) : null
                              ) : horario.disponible ? (
                                <Button
                                  onClick={() => handleReservar(horario.hora_inicio, horario.hora_fin)}
                                  disabled={reservando}
                                  className="w-full bg-[#E2FF1B] text-black active:bg-[#E2FF1B]/90 font-semibold active:scale-[0.98] transition-transform text-xs sm:text-sm h-9 sm:h-10"
                                  size="sm"
                                >
                                  {reservando ? (
                                    <>
                                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-2 animate-spin" />
                                      Reservando...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-2" />
                                      Reservar
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button 
                                  disabled 
                                  variant="outline" 
                                  className="w-full opacity-50 text-xs sm:text-sm h-9 sm:h-10"
                                  size="sm"
                                >
                                  Completo
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
