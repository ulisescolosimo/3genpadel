"use client"

import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import { Loader2, Search, ChevronDown, Check } from "lucide-react"


const categories = [
  { id: "todos", name: "Todos los productos" },
  { id: "paletas", name: "Paletas" },
  { id: "grips", name: "Grips" },
  { id: "indumentaria", name: "Indumentaria" },
  { id: "calzado", name: "Calzado" },
  { id: "accesorios", name: "Accesorios" },
  { id: "bolsos y mochilas", name: "Bolsos y Mochilas" },
  { id: "pelotas", name: "Pelotas" }
]

export default function Merchandising() {
  const [selectedCategories, setSelectedCategories] = useState(["todos"])
  const [searchTerm, setSearchTerm] = useState("")
  const [excelData, setExcelData] = useState(null)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTalles, setSelectedTalles] = useState({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Función para verificar si un producto tiene talles válidos
  const hasValidTalles = (talle) => {
    if (!talle || talle.trim() === '') return false
    const talleLower = talle.toLowerCase()
    return talleLower !== 'na' && talleLower !== 'n/a' && talleLower !== 'no aplica'
  }

  // Función para manejar la selección de categorías
  const handleCategoryToggle = (categoryId) => {
    if (categoryId === "todos") {
      // Si se selecciona "todos", deseleccionar todo lo demás
      setSelectedCategories(["todos"])
    } else {
      setSelectedCategories(prev => {
        // Remover "todos" si está seleccionado
        const withoutTodos = prev.filter(id => id !== "todos")
        
        if (prev.includes(categoryId)) {
          // Si la categoría ya está seleccionada, la removemos
          const newSelection = withoutTodos.filter(id => id !== categoryId)
          // Si no queda ninguna categoría seleccionada, seleccionar "todos"
          return newSelection.length === 0 ? ["todos"] : newSelection
        } else {
          // Si la categoría no está seleccionada, la agregamos
          return [...withoutTodos, categoryId]
        }
      })
    }
  }

  // Función para obtener el texto del botón del dropdown
  const getDropdownText = () => {
    if (selectedCategories.includes("todos")) {
      return "Todas las categorías"
    }
    
    if (selectedCategories.length === 0) {
      return "Seleccionar categorías"
    }
    
    if (selectedCategories.length === 1) {
      return categories.find(c => c.id === selectedCategories[0])?.name || "Categorías"
    }
    
    return `${selectedCategories.length} categorías seleccionadas`
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

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

  const handleProductClick = (product) => {
    let message = `Hola! Me interesa el producto: ${product.name}. ¿Podrían ayudarme con más información?`
    
    // Número de WhatsApp de 3gen
    const whatsappNumber = "5491157516215" // +54 9 11 5751-6215
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  const filteredProducts = products.filter(product => {
    // Filtro por categorías múltiples
    const categoryMatch = selectedCategories.includes("todos") || selectedCategories.includes(product.category)
    
    // Filtro por búsqueda (nombre del producto)
    const searchMatch = searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return categoryMatch && searchMatch
  })

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Merchandising 3gen</h1>
          <p className="text-gray-400">Productos oficiales de 3gen Padel Academy</p>
        </div>

        {/* Filtro de categorías y buscador */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filtro de categorías - Dropdown con checkboxes */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full lg:w-auto px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E2FF1B] focus:border-transparent transition-all duration-200 min-w-[250px]"
              >
                <span className="text-sm font-medium">
                  {getDropdownText()}
                </span>
                <ChevronDown 
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {/* Dropdown menu con checkboxes */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.id)
                    return (
                      <div
                        key={category.id}
                        onClick={() => handleCategoryToggle(category.id)}
                        className="flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-[#E2FF1B] border-[#E2FF1B]' 
                            : 'border-gray-500'
                        }`}>
                          {isSelected && (
                            <Check className="w-3 h-3 text-black" />
                          )}
                        </div>
                        <span className={`transition-colors ${
                          isSelected ? 'text-[#E2FF1B]' : 'text-gray-300'
                        }`}>
                          {category.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Buscador */}
            <div className="relative max-w-md w-full lg:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E2FF1B] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Contador de productos */}
        <div className="mb-6">
          <p className="text-gray-400">
            <>
              Mostrando {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
              {selectedCategories.includes("todos") 
                ? '' 
                : ` en ${selectedCategories.length === 1 
                  ? categories.find(c => c.id === selectedCategories[0])?.name 
                  : `${selectedCategories.length} categorías`}`
              }
              {searchTerm && ` que coinciden con "${searchTerm}"`}
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
              onClick={() => handleProductClick(product)}
              className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-[#E2FF1B] transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-[#E2FF1B]/20"
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
            <p className="text-gray-400 text-lg">
              {searchTerm 
                ? `No se encontraron productos que coincidan con "${searchTerm}"${!selectedCategories.includes("todos") ? ` en las categorías seleccionadas` : ''}.`
                : `No se encontraron productos en las categorías seleccionadas.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 