"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatArgentineDateLong } from "@/lib/date-utils";
import { useTournamentData } from "@/hooks/useTournamentData";

export default function LiveMatchTicker() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tournaments } = useTournamentData();

  // Contenido de fallback (academia)
  const academyInfo = [
    {
      id: 1,
      name: "Clases de Pádel",
      location: "3gen Padel Academy",
      level: "Todos los niveles",
      status: "Inscripciones abiertas",
    },
    {
      id: 2,
      name: "Entrenamiento Personalizado",
      location: "3gen Padel Academy",
      level: "Avanzado",
      status: "Disponible",
    },
    {
      id: 3,
      name: "Clases Grupales",
      location: "3gen Padel Academy",
      level: "Principiante e Intermedio",
      status: "Lunes a Viernes",
    },
    {
      id: 4,
      name: "Evaluación de Nivel",
      location: "3gen Padel Academy",
      level: "Gratuita",
      status: "Con cita previa",
    },
  ];

  useEffect(() => {
    fetchProximosPartidos();
  }, []);

  const fetchProximosPartidos = async () => {
    try {
      setLoading(true);
      
      // Obtener partidos pendientes (sin filtro de fecha para mostrar todos los pendientes)
      const { data: partidosData, error } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            ligas (
              id,
              nombre
            )
          ),
          equipo_a:ligainscripciones!liga_partidos_equipo_a_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            )
          ),
          equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido
            )
          )
        `)
        .eq('estado', 'pendiente')
        .order('fecha', { ascending: true })
        .limit(8);

      if (error) throw error;
      setPartidos(partidosData || []);
    } catch (error) {
      console.error('Error fetching próximos partidos:', error);
      setPartidos([]);
    } finally {
      setLoading(false);
    }
  };

  const getEquipoNombre = (equipo) => {
    if (!equipo) return 'N/A';
    const jugador1 = equipo.titular_1 ? `${equipo.titular_1.nombre} ${equipo.titular_1.apellido}` : 'N/A';
    const jugador2 = equipo.titular_2 ? `${equipo.titular_2.nombre} ${equipo.titular_2.apellido}` : 'N/A';
    return `${jugador1} / ${jugador2}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Pendiente';
    } else if (diffDays === 0) {
      return `Hoy ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Mañana ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${formatArgentineDateLong(dateString)} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const getCategoriaNombre = (partido) => {
    if (!partido.liga_categorias) return 'N/A';
    const liga = partido.liga_categorias.ligas;
    const categoria = partido.liga_categorias.categoria;
    return `${liga?.nombre || 'N/A'} - ${categoria}`;
  };

  // Función para formatear fecha de torneos
  const formatTournamentDate = (dateString) => {
    if (!dateString) return null
    try {
      // Si viene en formato DD/MM o DD/MM/YYYY, parsearlo correctamente
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/')
        const currentYear = new Date().getFullYear()
        const fullYear = year || currentYear
        const date = new Date(fullYear, parseInt(month) - 1, parseInt(day))
        
        if (isNaN(date.getTime())) {
          return dateString
        }
        
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short'
        })
      }
      
      // Si viene en formato ISO, parsearlo normalmente pero considerando zona horaria
      const date = new Date(dateString + 'T00:00:00')
      if (isNaN(date.getTime())) {
        return dateString
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
      })
    } catch {
      return dateString
    }
  }

  // Función para obtener información de jugadores del torneo
  const getTournamentPlayers = (tournament) => {
    const players = []
    if (tournament.jugador1_nombre) {
      players.push(`${tournament.jugador1_nombre} ${tournament.jugador1_apellido || ''}`.trim())
    }
    if (tournament.jugador2_nombre) {
      players.push(`${tournament.jugador2_nombre} ${tournament.jugador2_apellido || ''}`.trim())
    }
    return players.join(' & ')
  }

  // Prioridad de datos: torneos > partidos > academia
  let displayData, dataType
  if (tournaments.length > 0) {
    displayData = tournaments
    dataType = 'tournaments'
  } else if (partidos.length > 0) {
    displayData = partidos
    dataType = 'partidos'
  } else {
    displayData = academyInfo
    dataType = 'academy'
  }

  return (
    <div className="w-full bg-[#E2FF1B] text-black overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center py-2">
          <div className="flex items-center gap-2 mr-4">
            <div className="flex items-center gap-1 px-2 py-1 bg-black text-[#E2FF1B] rounded-full">
              <Trophy className="w-4 h-4" />
              <Link href="/circuito3gen/partidos-todos">
                <span className="text-sm font-bold">
                  PARTIDOS
                </span>
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-8 animate-marquee-slow whitespace-nowrap">
              {displayData.map((item, index) => (
                <div key={item.id || index} className="flex items-center gap-4">
                  {dataType === 'tournaments' ? (
                    // Renderizar torneos en vivo
                    <>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
                        </div>
                        <span className="font-bold text-red-600 uppercase text-sm">EN VIVO</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        <span className="font-medium">{item.nombre_torneo || 'Torneo en Vivo'}</span>
                        {item.categoria && (
                          <span className="text-sm opacity-75">• {item.categoria}</span>
                        )}
                      </div>

                      {getTournamentPlayers(item) && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{getTournamentPlayers(item)}</span>
                        </div>
                      )}

                      {(item.fecha || item.hora) && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {item.fecha && formatTournamentDate(item.fecha)}
                            {item.fecha && item.hora && ' '}
                            {item.hora}
                          </span>
                        </div>
                      )}

                      {item.ubicacion_torneo && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{item.ubicacion_torneo}</span>
                        </div>
                      )}
                    </>
                  ) : dataType === 'partidos' ? (
                    // Renderizar partidos
                    <>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        <span className="font-medium">
                          {getEquipoNombre(item.equipo_a)} vs {getEquipoNombre(item.equipo_b)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{getCategoriaNombre(item)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase">{item.ronda}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(item.fecha)}</span>
                      </div>
                    </>
                  ) : (
                    // Renderizar contenido de academia (fallback)
                    <>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        <span className="font-medium">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{item.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase">{item.level}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{item.status}</span>
                      </div>
                    </>
                  )}
                  
                  {index < displayData.length - 1 && (
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
  );
}
