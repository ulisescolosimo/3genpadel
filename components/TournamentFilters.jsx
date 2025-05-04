"use client"

import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function TournamentFilters({ onFilterChange, tournaments = [] }) {
  const [filters, setFilters] = useState({
    search: '',
    estado: 'todos',
    categoria: 'todos',
    ubicacion: 'todos'
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      estado: 'todos',
      categoria: 'todos',
      ubicacion: 'todos'
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return value !== ''
      return value !== 'todos'
    })
  }

  // Obtener ubicaciones únicas de los torneos
  const ubicaciones = [...new Set(tournaments.map(t => t.ubicacion))].filter(Boolean)
  // Obtener categorías únicas de los torneos
  const categorias = [...new Set(tournaments.map(t => t.categoria))].filter(Boolean)

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4">
        {/* Barra de búsqueda */}
        <div className="sm:w-[300px]">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Buscar torneos
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nombre o descripción..."
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#E2FF1B]/40 transition-colors"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          </div>
        </div>

        {/* Botón de filtros para móvil */}
        <div className="sm:hidden">
          <Button
            variant="outline"
            className="bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800 w-full"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros {hasActiveFilters() && <span className="ml-2 text-[#E2FF1B]">•</span>}
          </Button>
        </div>

        {/* Contenedor de filtros */}
        <div className={`${isFiltersOpen ? 'block' : 'hidden'} sm:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Filtro de Estado */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Estado del torneo
              </label>
              <Select
                value={filters.estado}
                onValueChange={(value) => handleFilterChange('estado', value)}
              >
                <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="abierto">Abierto</SelectItem>
                  <SelectItem value="en_curso">En curso</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Categoría */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Categoría
              </label>
              <Select
                value={filters.categoria}
                onValueChange={(value) => handleFilterChange('categoria', value)}
              >
                <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Ubicación */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Ubicación
              </label>
              <Select
                value={filters.ubicacion}
                onValueChange={(value) => handleFilterChange('ubicacion', value)}
              >
                <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="todos">Todas las ubicaciones</SelectItem>
                  {ubicaciones.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botón de limpiar filtros */}
          {hasActiveFilters() && (
            <div className="mt-4">
              <Button
                variant="outline"
                className="bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800 hover:text-[#E2FF1B] transition-colors w-full sm:w-auto"
                onClick={clearFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar todos los filtros
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 