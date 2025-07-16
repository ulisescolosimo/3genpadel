'use client'

import { Trophy, Users, Clock, MapPin } from 'lucide-react'

export default function LiveMatchTicker() {
  const academyInfo = [
    {
      id: 1,
      name: "Clases de Pádel",
      location: "3gen Padel Academy",
      level: "Todos los niveles",
      status: "Inscripciones abiertas"
    },
    {
      id: 2,
      name: "Entrenamiento Personalizado",
      location: "3gen Padel Academy",
      level: "Avanzado",
      status: "Disponible"
    },
    {
      id: 3,
      name: "Clases Grupales",
      location: "3gen Padel Academy",
      level: "Principiante e Intermedio",
      status: "Lunes a Viernes"
    },
    {
      id: 4,
      name: "Evaluación de Nivel",
      location: "3gen Padel Academy",
      level: "Gratuita",
      status: "Con cita previa"
    }
  ]

  return (
    <div className="w-full bg-[#E2FF1B] text-black overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center py-2">
          <div className="flex items-center gap-2 mr-4">
            <div className="flex items-center gap-1 px-2 py-1 bg-black text-[#E2FF1B] rounded-full">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-bold">ACADEMIA</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-8 animate-marquee-slow whitespace-nowrap">
              {academyInfo.map((info, index) => (
                <div key={info.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span className="font-medium">{info.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{info.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase">{info.level}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{info.status}</span>
                  </div>
                  {index < academyInfo.length - 1 && (
                    <div className="flex items-center">
                      <span className="text-black/40 font-light">|</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 