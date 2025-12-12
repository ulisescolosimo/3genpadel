'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Trophy, Heart, Star, Award, Target, Dumbbell, BookOpen, GraduationCap, Zap, Shield } from 'lucide-react'

export default function Nosotros() {
  const headCoaches = [
    {
      name: "Stefano Lorenzo",
      role: "Head Coach",
      image: "/images/profesores/stf.jpg",
      bio: "Profesor de pádel con más de 10 años de experiencia. Jugador AJPP desde 2012.",
      achievements: [
        "Ranking actual: Nº 99 de Argentina",
        "Profesor de pádel con más de 10 años de experiencia",
        "Jugador AJPP desde 2012"
      ],
      category: "head-coach",
      specialty: "Técnica Avanzada"
    },
    {
      name: "Ignacio Begher",
      role: "Head Coach",
      image: "/images/profesores/nacho2.jpg",
      bio: "Profesor de pádel con más de 15 años de experiencia. Jugador AJPP desde 2007.",
      achievements: [
        "Ranking actual: Nº 97 de Argentina",
        "Profesor de pádel con más de 15 años de experiencia",
        "Jugador AJPP desde 2007"
      ],
      category: "head-coach",
      specialty: "Táctica Profesional"
    }
  ]

  const coaches = [
    {
      name: "Guido Lorenzo",
      role: "Coach",
      image: "/images/profesores/guido.jpg",
      bio: "3+ años de experiencia entrenando categorías intermedias y avanzadas. Sesiones individuales y grupales.",
      achievements: [
        "3+ años de experiencia entrenando categorías intermedias y avanzadas",
        "Sesiones individuales y grupales",
        "Enfoque en técnica, táctica y preparación física",
        "Entrenamientos en español e inglés"
      ],
      category: "coach",
      specialty: "Desarrollo Integral"
    },
    {
      name: "Ezequiel Rodríguez",
      role: "Coach",
      image: "/images/profesores/ezq.jpg",
      bio: "4+ años de experiencia como entrenador de pádel. Main Coach en Babolat Padel Center.",
      achievements: [
        "4+ años de experiencia como entrenador de pádel",
        "Main Coach en Babolat Padel Center",
        "Enfoque en el desarrollo físico y mental de los jugadores",
        "Profesor de educación física con énfasis en la preparación integral"
      ],
      category: "coach",
      specialty: "Preparación Mental"
    },
    {
      name: "Alec Baltaián",
      role: "Coach",
      image: "/images/profesores/alec.jpg",
      bio: "Más de 5 años de experiencia como entrenador de pádel con enfoque en el desarrollo técnico y táctico de los jugadores.",
      achievements: [
        "Más de 5 años de experiencia como entrenador de pádel",
        "Enfoque en el desarrollo técnico y táctico de los jugadores",
        "Jugador AJPP (Asociación de Jugadores de Padel Profesional)",
        "Especialista en técnicas avanzadas y estrategias de juego"
      ],
      category: "coach",
      specialty: "Técnica y Táctica"
    },
    {
      name: "Martín Barrena",
      role: "Coach",
      image: "/images/profesores/barrena.jpg",
      bio: "Más de 1 año de experiencia como entrenador de pádel con enfoque en el desarrollo técnico y estratégico de los jugadores.",
      achievements: [
        "Más de 1 año de experiencia como entrenador de pádel",
        "Enfoque en el desarrollo técnico y estratégico de los jugadores",
        "Jugador AJPP (Asociación de Jugadores de Padel Profesional)",
        "Especialista en estrategias avanzadas y preparación competitiva"
      ],
      category: "coach",
      specialty: "Desarrollo Técnico"
    },
    {
      name: "Juan Gallego",
      role: "Coach",
      image: "/images/profesores/placeholder.png",
      bio: "Especialista en introducción al pádel y preparación para niveles medios. Enfoque en el desarrollo inicial y primeros pasos de los jugadores.",
      achievements: [
        "Más de 1 año de experiencia como entrenador de pádel",
        "Enfoque en el desarrollo inicial y primeros pasos de los jugadores",
        "Especialista en introducción al pádel y preparación para niveles medios",
        "Título oficial de profesorado de APA (Asociación de Pádel Argentino)",
        "Clases en Inglés"
      ],
      category: "coach",
      specialty: "Desarrollo Inicial/Medio"
    }
  ]

  const physicalTrainer = [
    {
      name: "Juan Cruz Cabello",
      role: "Preparador Físico",
      image: "/images/profesores/juan1.jpg",
      bio: "Más de 7 años diseñando entrenamientos físicos para jugadores amateur y profesionales.",
      achievements: [
        "Más de 7 años diseñando entrenamientos físicos para jugadores amateur y profesionales",
        "Rutinas personalizadas para mejorar fuerza, resistencia y agilidad",
        "Foco en prevención de lesiones y optimización del rendimiento físico",
        "Entrenamientos individuales y grupales adaptados a cada jugador"
      ],
      category: "physical-trainer",
      specialty: "Optimización Física"
    },
    {
      name: "Pablo Martín",
      role: "Entrenador de GYM",
      image: "/images/profesores/pablo.jpeg",
      bio: "Antropometrista y preparador físico con más de 5 años de experiencia diseñando entrenamientos físicos para distintas disciplinas.",
      achievements: [
        "Más de 5 años de experiencia diseñando entrenamientos físicos para distintas disciplinas",
        "Antropometrista y preparador físico",
        "Rutinas aplicadas al pádel enfocadas en fuerza y resistencia"
      ],
      category: "physical-trainer",
      specialty: "Entrenamiento Físico"
    },
    {
      name: "Marcelo Maciñeiras",
      role: "Entrenador de GYM",
      image: "/images/profesores/placeholder.png",
      bio: "",
      achievements: [],
      category: "physical-trainer",
      specialty: "Entrenamiento Físico"
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E2FF1B]/10 via-[#E2FF1B]/5 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E2FF1B]/10 rounded-full border border-[#E2FF1B]/20 mb-6">
              <Trophy className="w-5 h-5 text-[#E2FF1B]" />
              <span className="text-[#E2FF1B] font-medium">Equipo Profesional</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Nuestro <span className="text-[#E2FF1B]">Equipo</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Conoce a los expertos que forman parte de 3gen Academy. 
              Un equipo multidisciplinario comprometido con tu desarrollo en el pádel.
            </p>
          </div>
        </div>
      </div>

      {/* Team Categories */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Head Coaches Section */}
          <div className="relative">
            <div className="relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/10 rounded-full border border-green-500/20 mb-4">
                  <Trophy className="w-6 h-6 text-green-400" />
                  <span className="text-green-400 font-semibold text-lg">Head Coaches</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Líderes de Excelencia
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Nuestros Head Coaches combinan experiencia profesional con metodologías avanzadas 
                  para llevar tu juego al siguiente nivel.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {headCoaches.map((coach, index) => (
                  <Card 
                    key={index}
                    className="group relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-green-500/20 hover:border-green-400/40 transition-all duration-500 rounded-3xl backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="relative pb-6">
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-green-500/50 group-hover:border-green-400 transition-colors">
                            <img 
                              src={coach.image} 
                              alt={coach.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                              {coach.specialty}
                            </span>
                          </div>
                          <CardTitle className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
                            {coach.name}
                          </CardTitle>
                          <CardDescription className="text-green-400 font-medium">
                            {coach.role}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {coach.bio && (
                      <CardContent className="relative">
                        <p className="text-gray-300 mb-6 leading-relaxed">
                          {coach.bio}
                        </p>
                        {coach.achievements && coach.achievements.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                              <Star className="w-4 h-4 text-green-400" />
                              Logros Destacados
                            </h4>
                            <ul className="space-y-2">
                              {coach.achievements.map((achievement, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                                  <span>{achievement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Coaches Section */}
          <div className="relative">
            <div className="relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-yellow-500/10 rounded-full border border-yellow-500/20 mb-4">
                  <BookOpen className="w-6 h-6 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold text-lg">Coaches</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Especialistas en Desarrollo
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Nuestros coaches se especializan en diferentes aspectos del juego, 
                  ofreciendo un entrenamiento personalizado y efectivo.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {coaches.map((coach, index) => (
                  <Card 
                    key={index}
                    className="group relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-500 rounded-3xl backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="relative pb-6">
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-yellow-500/50 group-hover:border-yellow-400 transition-colors">
                            <img 
                              src={coach.image} 
                              alt={coach.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
                              {coach.specialty}
                            </span>
                          </div>
                          <CardTitle className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                            {coach.name}
                          </CardTitle>
                          <CardDescription className="text-yellow-400 font-medium">
                            {coach.role}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {coach.bio && (
                      <CardContent className="relative">
                        <p className="text-gray-300 mb-6 leading-relaxed">
                          {coach.bio}
                        </p>
                        {coach.achievements && coach.achievements.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400" />
                              Logros Destacados
                            </h4>
                            <ul className="space-y-2">
                              {coach.achievements.map((achievement, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                                  <span>{achievement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Physical Trainer Section */}
          <div className="relative">
            <div className="relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4">
                  <Dumbbell className="w-6 h-6 text-blue-400" />
                  <span className="text-blue-400 font-semibold text-lg">Preparador Físico</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Optimización del Rendimiento
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Nuestro equipo de preparadores físicos se encarga de maximizar tu potencial 
                  físico y prevenir lesiones para un rendimiento óptimo.
                </p>
              </div>
              
              <div className="space-y-8">
                {/* Juan Cruz Cabello - Fila completa */}
                {physicalTrainer[0] && (
                  <div className="max-w-4xl mx-auto">
                    <Card 
                      className="group relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-500 rounded-3xl backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="p-8">
                        <div className="flex flex-col lg:flex-row items-start gap-8">
                          <div className="relative">
                            <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-blue-500/50 group-hover:border-blue-400 transition-colors">
                              <img 
                                src={physicalTrainer[0].image} 
                                alt={physicalTrainer[0].name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <Dumbbell className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-4 py-2 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
                                {physicalTrainer[0].specialty}
                              </span>
                            </div>
                            <CardTitle className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                              {physicalTrainer[0].name}
                            </CardTitle>
                            <CardDescription className="text-blue-400 font-medium mb-6">
                              {physicalTrainer[0].role}
                            </CardDescription>
                            {physicalTrainer[0].bio && (
                              <p className="text-gray-300 mb-6 leading-relaxed">
                                {physicalTrainer[0].bio}
                              </p>
                            )}
                            {physicalTrainer[0].achievements && physicalTrainer[0].achievements.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                  <Star className="w-4 h-4 text-blue-400" />
                                  Logros Destacados
                                </h4>
                                <ul className="space-y-2">
                                  {physicalTrainer[0].achievements.map((achievement, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                      <span>{achievement}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Pablo Martín y Marcelo Maciñeiras - Grid de 2 columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {physicalTrainer.slice(1).map((trainer, index) => (
                    <Card 
                      key={index + 1}
                      className="group relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-500 rounded-3xl backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardHeader className="relative pb-6">
                        <div className="flex items-start gap-6">
                          <div className="relative">
                            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-blue-500/50 group-hover:border-blue-400 transition-colors">
                              <img 
                                src={trainer.image} 
                                alt={trainer.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <Dumbbell className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                                {trainer.specialty}
                              </span>
                            </div>
                            <CardTitle className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                              {trainer.name}
                            </CardTitle>
                            <CardDescription className="text-blue-400 font-medium">
                              {trainer.role}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      {trainer.bio && (
                        <CardContent className="relative">
                          <p className="text-gray-300 mb-6 leading-relaxed">
                            {trainer.bio}
                          </p>
                          {trainer.achievements && trainer.achievements.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Star className="w-4 h-4 text-blue-400" />
                                Logros Destacados
                              </h4>
                              <ul className="space-y-2">
                                {trainer.achievements.map((achievement, i) => (
                                  <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                    <span>{achievement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Nuestros <span className="text-[#E2FF1B]">Valores</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Los principios que guían nuestro trabajo y compromiso con la excelencia
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-[#E2FF1B]/20 hover:border-[#E2FF1B]/40 transition-all duration-300 rounded-2xl backdrop-blur-sm group hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-[#E2FF1B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="w-8 h-8 text-[#E2FF1B]" />
                </div>
                <CardTitle className="text-xl font-bold text-white mb-3">Excelencia</CardTitle>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Buscamos la excelencia en todo lo que hacemos, desde la enseñanza hasta la atención al usuario.
                </p>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-[#E2FF1B]/20 hover:border-[#E2FF1B]/40 transition-all duration-300 rounded-2xl backdrop-blur-sm group hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-[#E2FF1B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-[#E2FF1B]" />
                </div>
                <CardTitle className="text-xl font-bold text-white mb-3">Comunidad</CardTitle>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Fomentamos un ambiente de comunidad y camaradería entre todos los amantes del pádel.
                </p>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-[#E2FF1B]/20 hover:border-[#E2FF1B]/40 transition-all duration-300 rounded-2xl backdrop-blur-sm group hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-[#E2FF1B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-[#E2FF1B]" />
                </div>
                <CardTitle className="text-xl font-bold text-white mb-3">Innovación</CardTitle>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Estamos constantemente innovando para mejorar la experiencia de nuestros usuarios.
                </p>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 