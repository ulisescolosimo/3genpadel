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
      <div className="pt-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="text-[#E2FF1B]">Inscripciones</span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Unitea nuestras ligas competitivas y mejora tu juego
          </p>
        </div>
      </div>

      {/* Options Grid */}
      <div className="container mx-auto px-4 pb-16">
        <div className="flex justify-center max-w-6xl mx-auto">
          {/* Ligas */}
          <Card className="bg-white/5 border-white/10 hover:border-[#E2FF1B]/30 transition-all duration-300 group max-w-md">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-[#E2FF1B]/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#E2FF1B]/20 transition-colors">
                <Trophy className="w-8 h-8 text-[#E2FF1B]" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">Ligas</CardTitle>
              <CardDescription className="text-gray-400">
                Compite en nuestras ligas organizadas y mejora tu ranking
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0 pb-6 px-6">
              <p className="text-gray-300 mb-6">
                Participa en ligas competitivas con diferentes niveles y categorías. 
                Gana puntos, mejora tu ranking y compite contra los mejores jugadores.
              </p>
              <Link href="/inscripciones/ligas">
                <Button className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 transition-colors group">
                  Ver más
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Champions Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Últimos Campeones</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Conoce a los ganadores de nuestras últimas ligas y torneos
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center group">
            <div className="relative overflow-hidden rounded-lg mb-4">
              <img 
                src="/images/campeones/campeon1.jpg" 
                alt="Campeón 1" 
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
          
          <div className="text-center group">
            <div className="relative overflow-hidden rounded-lg mb-4">
              <img 
                src="/images/campeones/campeon2.jpg" 
                alt="Campeón 2" 
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
          
          <div className="text-center group">
            <div className="relative overflow-hidden rounded-lg mb-4">
              <img 
                src="/images/campeones/campeon3.jpg" 
                alt="Campeón 3" 
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
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
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
              <MapPin className="w-6 h-6 text-[#E2FF1B]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Múltiples Sedes</h3>
            <p className="text-gray-400">
              Instalaciones en Sede Olleros
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 