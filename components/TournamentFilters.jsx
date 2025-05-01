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
    // Convertir 'todos' a string vacío para el filtrado
    const filterValue = value === 'todos' ? '' : value
    onFilterChange({ ...newFilters, [key]: filterValue })
  }

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      estado: 'todos',
      categoria: 'todos',
      ubicacion: 'todos'
    }
    setFilters(emptyFilters)
    onFilterChange({
      search: '',
      estado: '',
      categoria: '',
      ubicacion: ''
    })
  }

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return value !== ''
      return value !== 'todos'
    })
  }

  // Obtener ubicaciones únicas de los torneos
  const ubicaciones = [...new Set(tournaments.map(t => t.ubicacion))].filter(Boolean)

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-[300px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar torneos..."
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#E2FF1B]/40 transition-colors"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          </div>
        </div>
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
        <div className={`${isFiltersOpen ? 'block' : 'hidden'} sm:block flex-1`}>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={filters.estado}
              onValueChange={(value) => handleFilterChange('estado', value)}
            >
              <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="abierto">Abierto</SelectItem>
                <SelectItem value="en_curso">En curso</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.categoria}
              onValueChange={(value) => handleFilterChange('categoria', value)}
            >
              <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="principiante">Principiante</SelectItem>
                <SelectItem value="intermedio">Intermedio</SelectItem>
                <SelectItem value="avanzado">Avanzado</SelectItem>
                <SelectItem value="profesional">Profesional</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.ubicacion}
              onValueChange={(value) => handleFilterChange('ubicacion', value)}
            >
              <SelectTrigger className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50">
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="todos">Todos</SelectItem>
                {ubicaciones.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters() && (
              <Button
                variant="outline"
                className="bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800 hover:text-[#E2FF1B] transition-colors sm:w-auto w-full"
                onClick={clearFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 