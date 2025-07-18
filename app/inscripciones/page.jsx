"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Users, BookOpen, MapPin, ArrowRight } from 'lucide-react'

export default function InscripcionesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="text-[#E2FF1B]">Inscripciones</span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Únete a nuestras ligas competitivas y mejora tu juego con nuestros entrenamientos especializados
          </p>
        </div>
      </div>

      {/* Options Grid */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Ligas */}
          <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-[#E2FF1B]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#E2FF1B]/20 transition-colors">
                <Trophy className="w-8 h-8 text-[#E2FF1B]" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Ligas</CardTitle>
              <CardDescription className="text-gray-400">
                Compite en nuestras ligas organizadas y mejora tu ranking
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-6">
                Participa en ligas competitivas con diferentes niveles y categorías. 
                Gana puntos, mejora tu ranking y compite contra los mejores jugadores.
              </p>
              <Link href="/inscripciones/ligas">
                <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors group">
                  Ver Ligas Disponibles
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Entrenamientos */}
          <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-[#E2FF1B]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#E2FF1B]/20 transition-colors">
                <Users className="w-8 h-8 text-[#E2FF1B]" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Entrenamientos</CardTitle>
              <CardDescription className="text-gray-400">
                Mejora tu técnica con nuestros entrenamientos especializados
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-6">
                Accede a entrenamientos grupales y clases especializadas en nuestras sedes. 
                Aprende de profesores expertos y perfecciona tu juego.
              </p>
              <Link href="/inscripciones/entrenamientos">
                <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors group">
                  Ver Entrenamientos
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">¿Por qué elegirnos?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Ofrecemos la mejor experiencia de padel con instalaciones de primer nivel y profesionales certificados
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-[#E2FF1B]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ligas Competitivas</h3>
            <p className="text-gray-400">
              Sistema de ligas organizado con diferentes niveles y categorías
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-[#E2FF1B]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Entrenamientos Especializados</h3>
            <p className="text-gray-400">
              Clases grupales y personalizadas con metodología avanzada
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#E2FF1B]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-[#E2FF1B]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Múltiples Sedes</h3>
            <p className="text-gray-400">
              Instalaciones en Deportes Racionales y La Normanda
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 