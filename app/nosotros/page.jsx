'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Trophy, Heart, Star, Award, Instagram, Linkedin, Twitter } from 'lucide-react'

export default function Nosotros() {
  const owners = [
    {
      name: "Carlos Martínez",
      role: "Fundador & Head Coach",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      bio: "Ex jugador profesional con más de 15 años de experiencia en el pádel. Campeón de varios torneos nacionales e internacionales. Especialista en técnica y táctica avanzada.",
      achievements: [
        "Top 50 WPT 2018-2020",
        "Campeón Open de España 2019",
        "Entrenador certificado por la FEP"
      ],
      social: {
        instagram: "carlosmartinezpadel",
        linkedin: "carlosmartinezpadel",
        twitter: "carlosmpadel"
      }
    },
    {
      name: "Laura Sánchez",
      role: "Directora Técnica",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      bio: "Jugadora profesional con una carrera destacada en el circuito femenino. Especialista en preparación física y mental para jugadores de alto rendimiento.",
      achievements: [
        "Top 30 WPT Femenino 2017-2021",
        "Campeona Master Final 2020",
        "Licenciada en Ciencias del Deporte"
      ],
      social: {
        instagram: "laurasanchezpadel",
        linkedin: "laurasanchezpadel",
        twitter: "lauraspadel"
      }
    },
    {
      name: "Miguel Rodríguez",
      role: "Director de Operaciones",
      image: "https://randomuser.me/api/portraits/men/67.jpg",
      bio: "Experto en gestión deportiva y organización de eventos. Jugador amateur con amplia experiencia en torneos locales y regionales.",
      achievements: [
        "MBA en Gestión Deportiva",
        "Organizador de más de 50 torneos",
        "Nivel 4.0 FEP"
      ],
      social: {
        instagram: "miguelrodriguezpadel",
        linkedin: "miguelrodriguezpadel",
        twitter: "miguelrpadel"
      }
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E2FF1B]/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Sobre Nosotros</h1>
            <p className="text-xl text-gray-400">
              Conoce al equipo detrás de 3gen Academy y nuestra pasión por el pádel
            </p>
          </div>
        </div>
      </div>

      {/* Nuestro Equipo Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24 md:gap-6 lg:gap-6 mt-16 md:mt-6 lg:mt-10">
            {owners.map((owner, index) => (
              <Card 
                key={index}
                className="bg-gray-900/50 border-gray-800 hover:border-[#E2FF1B] transition-all duration-300 rounded-2xl backdrop-blur-sm group"
              >
                <CardHeader className="relative pb-4">
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#E2FF1B] group-hover:scale-105 transition-transform">
                      <img 
                        src={owner.image} 
                        alt={owner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-8 text-center">
                    <CardTitle className="text-xl font-bold text-white group-hover:text-[#E2FF1B] transition-colors">
                      {owner.name}
                    </CardTitle>
                    <CardDescription className="text-[#E2FF1B] mt-1">
                      {owner.role}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400 text-center">
                      {owner.bio}
                    </p>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white">Logros Destacados:</h3>
                      <ul className="space-y-1">
                        {owner.achievements.map((achievement, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                            <Star className="w-4 h-4 text-[#E2FF1B]" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                  <a 
                    href={`https://instagram.com/${owner.social.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-gray-800 hover:bg-[#E2FF1B] hover:text-black transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a 
                    href={`https://linkedin.com/in/${owner.social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-gray-800 hover:bg-[#E2FF1B] hover:text-black transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a 
                    href={`https://twitter.com/${owner.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-gray-800 hover:bg-[#E2FF1B] hover:text-black transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Nuestra Misión */}
          <Card className="bg-gray-900/50 border-gray-800 rounded-2xl backdrop-blur-sm hover:bg-gray-900/70 transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Heart className="h-6 w-6 text-[#E2FF1B]" />
                Nuestra Misión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Nuestra misión es crear una comunidad vibrante de jugadores de pádel, facilitando la organización de torneos y promoviendo la pasión por este deporte. Buscamos conectar a jugadores de todos los niveles y crear experiencias memorables en la cancha.
              </p>
            </CardContent>
          </Card>

          {/* Lo que nos hace diferentes */}
          <Card className="bg-gray-900/50 border-gray-800 rounded-2xl backdrop-blur-sm hover:bg-gray-900/70 transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Star className="h-6 w-6 text-[#E2FF1B]" />
                Lo que nos hace diferentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#E2FF1B]/10 rounded-lg">
                      <Users className="w-5 h-5 text-[#E2FF1B]" />
                    </div>
                    <h3 className="font-semibold text-white">Comunidad Activa</h3>
                  </div>
                  <p className="text-gray-400">
                    Conectamos a jugadores de todos los niveles, creando una red de apoyo y amistad.
                  </p>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#E2FF1B]/10 rounded-lg">
                      <Trophy className="w-5 h-5 text-[#E2FF1B]" />
                    </div>
                    <h3 className="font-semibold text-white">Torneos Profesionales</h3>
                  </div>
                  <p className="text-gray-400">
                    Organizamos torneos con estándares profesionales y premios atractivos.
                  </p>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#E2FF1B]/10 rounded-lg">
                      <Award className="w-5 h-5 text-[#E2FF1B]" />
                    </div>
                    <h3 className="font-semibold text-white">Experiencia Premium</h3>
                  </div>
                  <p className="text-gray-400">
                    Ofrecemos una experiencia de usuario premium con tecnología de última generación.
                  </p>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#E2FF1B]/10 rounded-lg">
                      <Heart className="w-5 h-5 text-[#E2FF1B]" />
                    </div>
                    <h3 className="font-semibold text-white">Pasión por el Pádel</h3>
                  </div>
                  <p className="text-gray-400">
                    Compartimos la misma pasión por el pádel que nuestros usuarios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nuestros Valores */}
          <Card className="bg-gray-900/50 border-gray-800 rounded-2xl backdrop-blur-sm hover:bg-gray-900/70 transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Star className="h-6 w-6 text-[#E2FF1B]" />
                Nuestros Valores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
                  <h3 className="font-semibold text-white mb-2">Excelencia</h3>
                  <p className="text-gray-400">
                    Buscamos la excelencia en todo lo que hacemos, desde la organización de torneos hasta la atención al usuario.
                  </p>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
                  <h3 className="font-semibold text-white mb-2">Comunidad</h3>
                  <p className="text-gray-400">
                    Fomentamos un ambiente de comunidad y camaradería entre todos los amantes del pádel.
                  </p>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
                  <h3 className="font-semibold text-white mb-2">Innovación</h3>
                  <p className="text-gray-400">
                    Estamos constantemente innovando para mejorar la experiencia de nuestros usuarios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 