"use client"

import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import { Loader2 } from "lucide-react"


const categories = [
  { id: "todos", name: "Todos los productos" },
  { id: "paletas", name: "Paletas" },
  { id: "grips", name: "Grips" },
  { id: "indumentaria", name: "Indumentaria" },
  { id: "calzado", name: "Calzado" },
  { id: "accesorios", name: "Accesorios" }
]

export default function Merchandising() {
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [excelData, setExcelData] = useState(null)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchExcelData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRJlPwCH1_F1wzoxo5Ss37zJXLaozte-5FHUlFIpLcHFoI4Lf6D4oaLRteb-2NdP9ktJMkXwoG3OJWG/pub?gid=0&single=true&output=csv')
        const csvText = await response.text()
        
        // Convertir CSV a workbook
        const workbook = XLSX.read(csvText, { type: 'string' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // Extraer las columnas que nos interesan
        const headers = jsonData[0]
        const filteredData = jsonData.slice(1)
          .filter(row => row[0] && row[0].trim() !== '') // Filtrar filas vacías
          .map(row => {
            // Limpiar y convertir precios
            const precioRegularStr = (row[2] || '').toString().replace(/[^\d,]/g, '').replace(',', '.')
            const precio3GENStr = (row[3] || '').toString().replace(/[^\d,]/g, '').replace(',', '.')
            
            return {
              nombre: row[0]?.trim() || '',
              talle: row[1]?.trim() || '',
              precioRegular: parseFloat(precioRegularStr) || 0,
              precio3GEN: parseFloat(precio3GENStr) || 0,
              stock: parseInt(row[4]) || 0,
              imagen: row[5]?.trim() || '' // Nueva columna de imagen
            }
          })
        
        console.log('Headers del Excel:', headers)
        console.log('Datos filtrados (columnas 0-4):', filteredData)
        console.log('Total de productos:', filteredData.length)
        
        // Convertir datos del Excel a productos
        const excelProducts = filteredData.map((item, index) => ({
          id: index + 1,
          name: item.nombre,
          description: `${item.nombre} - Talle: ${item.talle}`,
          price: item.precio3GEN, // Usar precio 3GEN como precio principal
          originalPrice: item.precioRegular,
          talle: item.talle,
          stock: item.stock,
          image: item.imagen, // Usar imagen del Excel o placeholder
          category: "indumentaria" // Categoría por defecto
        }))
        
        console.log('Productos convertidos:', excelProducts)
        setProducts(excelProducts)
        setExcelData(filteredData)
      } catch (error) {
        console.error('Error al obtener datos del Excel:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExcelData()
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const filteredProducts = selectedCategory === "todos" 
    ? products 
    : products.filter(product => product.category === selectedCategory)

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Merchandising 3gen</h1>
          <p className="text-gray-400">Productos oficiales de 3gen Padel Academy</p>
        </div>

        {/* Filtro de categorías */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "bg-[#E2FF1B] text-black"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Contador de productos */}
        <div className="mb-6">
          <p className="text-gray-400">
              <>
                Mostrando {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
                {selectedCategory !== "todos" && ` en ${categories.find(c => c.id === selectedCategory)?.name}`}
              </>
          </p>
        </div>

        {/* Loader */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#E2FF1B] animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Cargando productos</p>
          </div>
        )}

        {/* Grid de productos */}
        {!isLoading && (
          <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300"
            >
                              <div className="aspect-square relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Badge de categoría */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-[#E2FF1B] text-black text-xs font-medium rounded-full">
                      {categories.find(c => c.id === product.category)?.name}
                    </span>
                  </div>
                </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-[#E2FF1B]">{formatPrice(product.price)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                  {product.stock > 0 && (
                    <span className="text-xs text-green-400">Stock: {product.stock}</span>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No se encontraron productos en esta categoría.</p>
          </div>
        )}
      </div>
    </div>
  )
} 