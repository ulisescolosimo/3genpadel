"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, MapPin, ArrowLeft, Star, Clock, Calendar, Target } from 'lucide-react'

export default function EntrenamientosPage() {
  const [selectedType, setSelectedType] = useState('all')

  const entrenamientos = [
    {
      id: 1,
      name: "Clases Grupales",
      description: "Entrenamientos en grupo para mejorar técnica y táctica",
      type: "Grupales",
      location: "Deportes Racionales",
      schedule: "Lunes, Miércoles, Viernes",
      time: "19:00 - 20:30",
      price: "$12.000/mes",
      instructor: "Prof. Carlos Rodríguez",
      level: "Todos los niveles",
      maxStudents: 8,
      status: "Disponible",
      features: ["Técnica básica", "Táctica de juego", "Ejercicios físicos", "Material incluido"]
    },
    {
      id: 2,
      name: "Academia Especializada",
      description: "Programa completo de formación en padel profesional",
      type: "Academia",
      location: "La Normanda",
      schedule: "Martes, Jueves, Sábados",
      time: "18:00 - 20:00",
      price: "$18.000/mes",
      instructor: "Prof. María González",
      level: "Intermedio-Avanzado",
      maxStudents: 6,
      status: "Disponible",
      features: ["Técnica avanzada", "Análisis de video", "Preparación física", "Torneos internos"]
    },
    {
      id: 3,
      name: "Clases Intensivas",
      description: "Entrenamientos intensivos para mejorar rápidamente",
      type: "Grupales",
      location: "Deportes Racionales",
      schedule: "Sábados",
      time: "10:00 - 12:00",
      price: "$8.000/mes",
      instructor: "Prof. Juan Pérez",
      level: "Principiantes",
      maxStudents: 10,
      status: "Próximamente",
      features: ["Fundamentos básicos", "Juegos recreativos", "Evaluación mensual", "Certificado"]
    }
  ]

  const filteredEntrenamientos = selectedType === 'all' 
    ? entrenamientos 
    : entrenamientos.filter(entrenamiento => entrenamiento.type.toLowerCase() === selectedType.toLowerCase())

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="pt-32 pb-8 px-4">
        <div className="container mx-auto">
          <Link href="/inscripciones" className="inline-flex items-center gap-2 text-[#E2FF1B] hover:text-[#E2FF1B]/80 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver a Inscripciones
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="text-[#E2FF1B]">Entrenamientos</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Mejora tu técnica y táctica con nuestros entrenamientos especializados en ambas sedes
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedType('all')}
              className={selectedType === 'all' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Todos los Entrenamientos
            </Button>
            <Button
              variant={selectedType === 'grupales' ? 'default' : 'outline'}
              onClick={() => setSelectedType('grupales')}
              className={selectedType === 'grupales' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Clases Grupales
            </Button>
            <Button
              variant={selectedType === 'academia' ? 'default' : 'outline'}
              onClick={() => setSelectedType('academia')}
              className={selectedType === 'academia' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Academia
            </Button>
          </div>
        </div>
      </div>

      {/* Entrenamientos Grid */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {filteredEntrenamientos.map((entrenamiento) => (
            <Card key={entrenamiento.id} className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#E2FF1B]/20 transition-colors">
                    <BookOpen className="w-6 h-6 text-[#E2FF1B]" />
                  </div>
                  <Badge 
                    variant={entrenamiento.status === 'Disponible' ? 'default' : 'secondary'}
                    className={entrenamiento.status === 'Disponible' ? 'bg-green-500' : 'bg-yellow-500'}
                  >
                    {entrenamiento.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-white mb-2">{entrenamiento.name}</CardTitle>
                <CardDescription className="text-gray-400">{entrenamiento.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{entrenamiento.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>{entrenamiento.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>{entrenamiento.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>Máx. {entrenamiento.maxStudents} estudiantes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Target className="w-4 h-4" />
                    <span>Nivel: {entrenamiento.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Star className="w-4 h-4" />
                    <span className="font-semibold text-[#E2FF1B]">{entrenamiento.price}</span>
                  </div>
                  
                  <div className="pt-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Incluye:</h4>
                    <ul className="space-y-1">
                      {entrenamiento.features.map((feature, index) => (
                        <li key={index} className="text-xs text-gray-400 flex items-center gap-2">
                          <div className="w-1 h-1 bg-[#E2FF1B] rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors mt-6"
                    disabled={entrenamiento.status === 'Próximamente'}
                  >
                    {entrenamiento.status === 'Disponible' ? 'Inscribirse' : 'Próximamente'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sedes Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Nuestras Sedes</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Ofrecemos entrenamientos en dos ubicaciones estratégicas para tu comodidad
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Deportes Racionales</CardTitle>
              <CardDescription className="text-gray-400">
                Sede principal para clases grupales e intensivas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>Av. Corrientes 1234, CABA</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>Lun-Vie: 8:00-23:00 | Sáb: 8:00-22:00</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Users className="w-4 h-4" />
                  <span>4 canchas de padel</span>
                </div>
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-[#E2FF1B] mb-2">Entrenamientos disponibles:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Clases Grupales (Lun, Mié, Vie)</li>
                    <li>• Clases Intensivas (Sábados)</li>
                    <li>• Entrenamientos personalizados</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">La Normanda</CardTitle>
              <CardDescription className="text-gray-400">
                Sede especializada para academia y entrenamientos avanzados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>Av. Libertador 5678, CABA</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>Mar-Jue: 9:00-22:00 | Sáb: 9:00-21:00</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Users className="w-4 h-4" />
                  <span>6 canchas de padel</span>
                </div>
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-[#E2FF1B] mb-2">Entrenamientos disponibles:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Academia Especializada (Mar, Jue, Sáb)</li>
                    <li>• Entrenamientos de alto rendimiento</li>
                    <li>• Análisis técnico avanzado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Información Importante</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#E2FF1B] mb-4">¿Qué incluyen los entrenamientos?</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Profesores certificados y con experiencia</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Material de entrenamiento incluido</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Evaluación personalizada del progreso</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Acceso a instalaciones premium</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#E2FF1B] mb-4">Requisitos</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Ropa deportiva cómoda</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Zapatillas de padel (se pueden alquilar)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Pago mensual por adelantado</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Compromiso de asistencia regular</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 