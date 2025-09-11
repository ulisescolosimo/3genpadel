'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SedeOllerosPage() {
  const [selectedImage, setSelectedImage] = useState(0)
  
  const images = [
    '1f23bb38-696d-4a93-88f5-b15a870d9463.JPG',
    '305a8f1b-2a44-4ca8-a685-cbb3b8d2f8c0.JPG',
    '313f2b1d-55ca-4c7d-ab14-f0fb8c209f97.JPG',
    '5b30f465-a449-4849-8f01-2edc6f680395.JPG',
    '5d681fda-92a2-4e30-aeb2-5d218dda6b0a.JPG',
    '605d63a1-554b-4e2b-8d00-31c945dda5a9.JPG',
    '67bf875f-af56-4279-a994-61a2fa6fb3e9.JPG',
    '6a1e4c11-ef21-4f12-b2f1-f53aa1105848.JPG',
    '88bc2c70-c85c-48aa-8813-19c289146082.JPG',
    '8aedb0a6-9742-4135-a0cb-fe3f8f640217.jpg',
    '8ff124ca-dadc-4de3-95fb-3c1f6aedcca6.JPG',
    'a2bc5341-2e6e-4345-82be-ef6bb48936b0.JPG',
    'b75656ae-ba9d-4839-8be3-cdfec7684fd7.JPG',
    'd22c29d8-4262-4ed4-bdab-d1780cccd3dc.JPG',
    'e530bae5-e8d6-47ff-a98e-2aa46d51120c.JPG',
    'ebef0cdf-cfee-49af-bc78-d7a2f5078534.JPG',
    'f18dfe07-fc7f-4d38-bed4-a508b7c92b2b.JPG',
    'IMG_8842.jpg',
    'IMG_8843.jpg',
    'IMG_8844.jpg'
  ]

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-3 sm:gap-6 lg:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:text-[#E2FF1B] hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                <span className="text-[#E2FF1B]">Sede</span> Olleros
              </h1>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl font-medium">Olleros 1515, Palermo, CABA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Main Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Image Gallery */}
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Galería de Imágenes</h3>
            
            {/* Main Image */}
            <div className="relative mb-3 md:mb-4">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <Image
                  src={`/images/olleros/${images[selectedImage]}`}
                  alt={`Sede Olleros - Imagen ${selectedImage + 1}`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              
              {/* Navigation Buttons */}
              <button
                onClick={prevImage}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 md:p-2 rounded-full transition-colors"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 md:p-2 rounded-full transition-colors"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 rotate-180" />
              </button>
              
              {/* Image Counter */}
              <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
                {selectedImage + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Grid - Hidden */}
            <div className="hidden">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index 
                      ? 'border-[#E2FF1B]' 
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <Image
                    src={`/images/olleros/${image}`}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Map Section */}
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Ubicación en el Mapa</h3>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3623.6404302172423!2d-58.435393999999995!3d-34.5621083!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5b74694e459%3A0x400c1d4d3358a78a!2sAv.%20Olleros%201515%2C%20C1426CRA%20Cdad.%20Aut%C3%B3noma%20de%20Buenos%20Aires!5e1!3m2!1ses!2sar!4v1757616908186!5m2!1ses!2sar" 
                width="100%" 
                height="100%" 
                style={{border: 0}} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
