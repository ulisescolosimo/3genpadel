"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { MapPin, Calendar, Trophy, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import TournamentFilters from "@/components/TournamentFilters";
import { handleAuthError } from "@/lib/supabase";

export default function Torneos() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchTournaments = async () => {
      try {
        const { data, error } = await supabase
          .from("torneo")
          .select("*")
          .order("fecha_inicio", { ascending: true });

        if (error) {
          throw handleAuthError(error);
        }

        if (mounted) {
          setTournaments(data || []);
          setFilteredTournaments(data || []);
        }
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTournaments();

    return () => {
      mounted = false;
    };
  }, []);

  const handleFilterChange = (filters) => {
    let filtered = [...tournaments];

    // Filtro por búsqueda (nombre o descripción)
    if (filters.search) {
      filtered = filtered.filter(
        (tournament) =>
          tournament.nombre?.toLowerCase().includes(filters.search.toLowerCase()) ||
          tournament.descripcion?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filtro por estado
    if (filters.estado && filters.estado !== 'todos') {
      filtered = filtered.filter(
        (tournament) => tournament.estado === filters.estado
      );
    }

    // Filtro por categoría
    if (filters.categoria && filters.categoria !== 'todos') {
      filtered = filtered.filter(
        (tournament) => tournament.categoria === filters.categoria
      );
    }

    // Filtro por ubicación
    if (filters.ubicacion && filters.ubicacion !== 'todos') {
      filtered = filtered.filter(
        (tournament) => tournament.ubicacion === filters.ubicacion
      );
    }

    // Filtro por disponibilidad
    if (filters.disponibilidad === 'disponibles') {
      filtered = filtered.filter(
        (tournament) => tournament.plazas_disponibles > 0
      );
    }

    // Ordenar por fecha de inicio
    filtered.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

    setFilteredTournaments(filtered);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Error al cargar los torneos</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
        >
          Intentar nuevamente
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-6xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-1.5">
            Torneos de Pádel
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Encuentra y participa en los mejores torneos de pádel
          </p>
        </div>

        <TournamentFilters onFilterChange={handleFilterChange} tournaments={tournaments} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="bg-gray-900/50 border-gray-800 hover:border-[#E2FF1B]/40 transition-all duration-300 rounded-xl backdrop-blur-sm group cursor-pointer overflow-hidden flex flex-col h-full"
              onClick={() => router.push(`/torneos/${tournament.id}`)}
            >
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        tournament.estado === "abierto"
                          ? "default"
                          : tournament.estado === "en_curso"
                          ? "secondary"
                          : tournament.estado === "finalizado"
                          ? "success"
                          : tournament.estado === "cancelado"
                          ? "destructive"
                          : "outline"
                      }
                      className="group-hover:scale-105 transition-transform"
                    >
                      {tournament.estado.charAt(0).toUpperCase() +
                        tournament.estado.slice(1)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Trophy className="w-3.5 h-3.5 text-[#E2FF1B]" />
                      <span>{tournament.categoria}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-white group-hover:text-[#E2FF1B] transition-colors line-clamp-2">
                    {tournament.nombre}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 flex-grow">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-800/30 p-3 rounded-lg group-hover:bg-gray-800/50 transition-colors">
                    <div className="p-2 bg-gray-800/50 rounded-lg">
                      <Calendar className="w-4 h-4 text-[#E2FF1B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Fecha</span>
                      <span className="text-sm">
                        {format(
                          new Date(tournament.fecha_inicio),
                          "d 'de' MMMM",
                          { locale: es }
                        )}{" "}
                        -{" "}
                        {format(new Date(tournament.fecha_fin), "d 'de' MMMM", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-800/30 p-3 rounded-lg group-hover:bg-gray-800/50 transition-colors">
                    <div className="p-2 bg-gray-800/50 rounded-lg">
                      <MapPin className="w-4 h-4 text-[#E2FF1B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Ubicación</span>
                      <span className="text-sm">{tournament.ubicacion}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 sm:p-6 pt-0 mt-auto">
                <Button
                  className="w-full rounded-lg bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 h-10 text-sm font-medium group-hover:scale-[1.02] transition-transform flex items-center justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/torneos/${tournament.id}`);
                  }}
                >
                  <span>Ver detalles</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-gray-400">
              No se encontraron torneos con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
