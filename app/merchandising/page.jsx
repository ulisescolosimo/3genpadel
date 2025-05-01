"use client"

import { useState } from "react"

const products = [
  {
    id: 1,
    name: "Camiseta 3gen",
    description: "Camiseta oficial de 3gen Padel Academy",
    price: 29990,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000"
  },
  {
    id: 2,
    name: "Gorra 3gen",
    description: "Gorra ajustable con logo bordado",
    price: 15990,
    image: "https://images.unsplash.com/photo-1521364693569-6c8f5a0e3a0a?q=80&w=1000"
  },
  {
    id: 3,
    name: "Bolsa de Pádel",
    description: "Bolsa térmica para 2 palas",
    price: 49990,
    image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1000"
  },
  {
    id: 4,
    name: "Toalla 3gen",
    description: "Toalla de microfibra absorbente",
    price: 12990,
    image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=1000"
  },
  {
    id: 5,
    name: "Pala 3gen Pro",
    description: "Pala profesional de carbono",
    price: 89990,
    image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1000"
  },
  {
    id: 6,
    name: "Pantalón 3gen",
    description: "Pantalón deportivo de alta calidad",
    price: 24990,
    image: "https://images.unsplash.com/photo-1591047129829-df7d89a1b7c5?q=80&w=1000"
  },
  {
    id: 7,
    name: "Muñequera 3gen",
    description: "Muñequera absorbente con logo",
    price: 7990,
    image: "https://images.unsplash.com/photo-1591047129829-df7d89a1b7c5?q=80&w=1000"
  },
  {
    id: 8,
    name: "Zapatillas 3gen",
    description: "Zapatillas profesionales para pádel",
    price: 69990,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000"
  }
]

export default function Merchandising() {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Merchandising 3gen</h1>
          <p className="text-gray-400">Productos oficiales de 3gen Padel Academy</p>
        </div>

        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300"
            >
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#E2FF1B]">{formatPrice(product.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 