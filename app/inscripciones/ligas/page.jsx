"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Calendar, MapPin, ArrowLeft, Star, Clock } from 'lucide-react'

export default function LigasPage() {
  const [selectedLevel, setSelectedLevel] = useState('all')

  const ligas = [
    {
      id: 1,
      name: "Ligas Agosto 2025",
      description: "Ligas competitivas de agosto 2025 con formato de clasificación y eliminatorias",
      level: "Todas las categorías",
      players: "C6, C7, C8",
      duration: "Agosto - Septiembre",
      location: "Por definir",
      price: "$20.000",
      status: "Abierta",
      features: ["2 partidos de clasificación", "Llave eliminatoria", "3 partidos garantizados", "Premios"],
      link: "/inscripciones/ligas/agosto-2025"
    },
    {
      id: 2,
      name: "Liga Principiantes",
      description: "Liga para jugadores que están comenzando en el padel",
      level: "Principiantes",
      players: "8-12",
      duration: "3 meses",
      location: "Deportes Racionales",
      price: "$15.000",
      status: "Próximamente",
      features: ["Nivel básico", "Entrenamiento incluido", "Torneo final"]
    },
    {
      id: 3,
      name: "Liga Intermedia",
      description: "Liga para jugadores con experiencia intermedia",
      level: "Intermedio",
      players: "12-16",
      duration: "4 meses",
      location: "La Normanda",
      price: "$20.000",
      status: "Próximamente",
      features: ["Nivel intermedio", "Ranking oficial", "Premios"]
    },
  ]

  const filteredLigas = selectedLevel === 'all' 
    ? ligas 
    : ligas.filter(liga => liga.level.toLowerCase() === selectedLevel.toLowerCase())

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
              <span className="text-[#E2FF1B]">Ligas</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Únete a nuestras ligas competitivas y mejora tu ranking jugando contra los mejores
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button
              variant={selectedLevel === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('all')}
              className={selectedLevel === 'all' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Todas las Ligas
            </Button>
            <Button
              variant={selectedLevel === 'principiantes' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('principiantes')}
              className={selectedLevel === 'principiantes' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Principiantes
            </Button>
            <Button
              variant={selectedLevel === 'intermedio' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('intermedio')}
              className={selectedLevel === 'intermedio' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Intermedio
            </Button>
            <Button
              variant={selectedLevel === 'avanzado' ? 'default' : 'outline'}
              onClick={() => setSelectedLevel('avanzado')}
              className={selectedLevel === 'avanzado' ? 'bg-[#E2FF1B] text-black' : 'border-white/20 text-white hover:bg-white/10'}
            >
              Avanzado
            </Button>
          </div>
        </div>
      </div>

      {/* Ligas Grid */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {filteredLigas.map((liga) => (
            <Card key={liga.id} className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#E2FF1B]/20 transition-colors">
                    <Trophy className="w-6 h-6 text-[#E2FF1B]" />
                  </div>
                  <Badge 
                    variant={liga.status === 'Abierta' ? 'default' : liga.status === 'Próximamente' ? 'secondary' : 'destructive'}
                    className={liga.status === 'Abierta' ? 'bg-green-500' : liga.status === 'Próximamente' ? 'bg-yellow-500' : 'bg-red-500'}
                  >
                    {liga.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-white mb-2">{liga.name}</CardTitle>
                <CardDescription className="text-gray-400">{liga.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>{liga.players} jugadores</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>Duración: {liga.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{liga.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Star className="w-4 h-4" />
                    <span className="font-semibold text-[#E2FF1B]">{liga.price}</span>
                  </div>
                  
                  <div className="pt-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Incluye:</h4>
                    <ul className="space-y-1">
                      {liga.features.map((feature, index) => (
                        <li key={index} className="text-xs text-gray-400 flex items-center gap-2">
                          <div className="w-1 h-1 bg-[#E2FF1B] rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {liga.link ? (
                    <Link href={liga.link}>
                      <Button 
                        className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors mt-6"
                      >
                        Inscribirse
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors mt-6"
                      disabled={liga.status === 'Cerrada'}
                    >
                      {liga.status === 'Abierta' ? 'Inscribirse' : liga.status === 'Próximamente' ? 'Próximamente' : 'Cerrada'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Información Importante</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#E2FF1B] mb-4">¿Cómo funcionan las ligas?</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Juegas partidos semanales contra otros jugadores</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Ganas puntos según tus resultados</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Mejoras tu ranking en la tabla de posiciones</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Participas en torneos especiales</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#E2FF1B] mb-4">Requisitos</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Ser mayor de 18 años</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Pago de inscripción al inicio</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Compromiso de asistencia semanal</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E2FF1B] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Equipamiento básico de padel</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 