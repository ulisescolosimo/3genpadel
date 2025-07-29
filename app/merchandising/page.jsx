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
  const [selectedTalles, setSelectedTalles] = useState({})

  // Función para verificar si un producto tiene talles válidos
  const hasValidTalles = (talle) => {
    if (!talle || talle.trim() === '') return false
    const talleLower = talle.toLowerCase()
    return talleLower !== 'na' && talleLower !== 'n/a' && talleLower !== 'no aplica'
  }

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
            // Función para limpiar y convertir precios argentinos
            const cleanPrice = (priceStr) => {
              if (!priceStr) return 0
              
              console.log('Precio original:', priceStr)
              
              // Convertir a string y remover símbolos de moneda
              let cleanStr = priceStr.toString()
                .replace(/[$%\s]/g, '') // Remover $, %, espacios
                .trim()
              
              console.log('Después de limpiar símbolos:', cleanStr)
              
              // Si no hay caracteres válidos, retornar 0
              if (!cleanStr) return 0
              
              // Si hay coma, es formato argentino (300.000,00)
              if (cleanStr.includes(',')) {
                // Remover puntos de miles y cambiar coma por punto
                cleanStr = cleanStr.replace(/\./g, '').replace(',', '.')
                console.log('Después de procesar coma:', cleanStr)
              }
              // Si no hay coma pero hay punto, verificar si es decimal
              else if (cleanStr.includes('.')) {
                // Contar cuántos puntos hay
                const dotCount = (cleanStr.match(/\./g) || []).length
                
                if (dotCount > 1) {
                  // Hay múltiples puntos, son separadores de miles
                  cleanStr = cleanStr.replace(/\./g, '')
                  console.log('Múltiples puntos detectados, removiendo:', cleanStr)
                } else {
                  // Un solo punto, verificar si es decimal
                  const parts = cleanStr.split('.')
                  if (parts.length === 2 && parts[1].length <= 2) {
                    // Es decimal, mantener como está
                    console.log('Es decimal, manteniendo:', cleanStr)
                  } else {
                    // Es separador de miles, remover
                    cleanStr = cleanStr.replace(/\./g, '')
                    console.log('Es separador de miles, removiendo puntos:', cleanStr)
                  }
                }
              }
              
              const result = parseFloat(cleanStr)
              console.log('Resultado final:', result)
              return isNaN(result) ? 0 : result
            }
            
            return {
              nombre: row[0]?.trim() || '',
              talle: row[1]?.trim() || '',
              precioRegular: cleanPrice(row[2]),
              precio3GEN: cleanPrice(row[3]),
              stock: parseInt(row[4]) || 0,
              imagen: row[5]?.trim() || '', // Columna F
              categoria: row[6]?.trim()?.toLowerCase() || 'indumentaria' // Columna G
            }
          })
        
        console.log('Headers del Excel:', headers)
        console.log('Datos filtrados:', filteredData)
        console.log('Total de productos:', filteredData.length)
        
        // Convertir datos del Excel a productos agrupados por nombre
        const productMap = new Map()
        
        filteredData.forEach((item, index) => {
          const productName = item.nombre.trim()
          const productTalle = item.talle?.trim() || ''
          const stockValue = parseInt(item.stock) || 0
          const category = item.categoria
          const hasTalles = hasValidTalles(productTalle)
          
          if (productMap.has(productName)) {
            // Si ya existe el producto, agregar o actualizar el talle
            const existingProduct = productMap.get(productName)
            
            if (hasTalles) {
              // Buscar si ya existe este talle
              const existingTalle = existingProduct.talles.find(t => t.talle === productTalle)
              
              if (existingTalle) {
                // Si ya existe el talle, sumar el stock
                existingTalle.stock += stockValue
              } else {
                // Si no existe el talle, agregarlo
                existingProduct.talles.push({
                  talle: productTalle,
                  stock: stockValue
                })
              }
            } else {
              // Para productos sin talles, sumar al stock general
              existingProduct.stock += stockValue
            }
            
            // Mantener el precio más bajo
            if (item.precio3GEN < existingProduct.price) {
              existingProduct.price = item.precio3GEN
              existingProduct.originalPrice = item.precioRegular
            }
          } else {
            // Crear nuevo producto
            const newProduct = {
              id: index + 1,
              name: productName,
              description: productName,
              price: item.precio3GEN,
              originalPrice: item.precioRegular,
              stock: stockValue,
              image: item.imagen,
              category: category
            }
            
            if (hasTalles) {
              // Producto con talles
              newProduct.talles = [{
                talle: productTalle,
                stock: stockValue
              }]
            } else {
              // Producto sin talles (como paletas, accesorios)
              newProduct.talles = []
            }
            
            productMap.set(productName, newProduct)
          }
        })
        
        // Convertir el Map a array
        const excelProducts = Array.from(productMap.values())
        
        console.log('Productos combinados:', excelProducts)
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

  const handleTalleClick = (productId, talle) => {
    setSelectedTalles(prev => ({
      ...prev,
      [productId]: talle
    }))
  }

  const getSelectedTalleStock = (product) => {
    // Si el producto no tiene talles, devolver el stock general
    if (!product.talles || product.talles.length === 0) {
      return product.stock || 0
    }
    
    const selectedTalle = selectedTalles[product.id]
    if (selectedTalle) {
      const talleInfo = product.talles.find(t => t.talle === selectedTalle)
      return talleInfo ? talleInfo.stock : 0
    }
    return product.talles.reduce((total, t) => total + (parseInt(t.stock) || 0), 0)
  }

  const getTotalStock = (product) => {
    // Si el producto no tiene talles, devolver el stock general
    if (!product.talles || product.talles.length === 0) {
      return product.stock || 0
    }
    // Si tiene talles, sumar todos los talles
    return product.talles.reduce((total, t) => total + (parseInt(t.stock) || 0), 0)
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
                
                {/* Talles disponibles */}
                {product.talles && product.talles.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {product.talles.map((talleInfo, index) => {
                        const isSelected = selectedTalles[product.id] === talleInfo.talle
                        return (
                          <span 
                            key={index}
                            onClick={() => handleTalleClick(product.id, talleInfo.talle)}
                            className={`inline-block px-3 py-1 text-sm font-bold rounded-full cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-white text-black' 
                                : 'bg-[#E2FF1B] text-black hover:bg-[#C7E61A]'
                            }`}
                          >
                            {talleInfo.talle}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-[#E2FF1B]">{formatPrice(product.price)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-green-400">
                      {selectedTalles[product.id] ? `Stock: ${getSelectedTalleStock(product)}` : `Total: ${getTotalStock(product)}`}
                    </span>
                  </div>
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