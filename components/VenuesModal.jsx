'use client'

import { useState } from 'react'
import { MapPin, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function VenuesModal({ isOpen, onClose }) {
  const venues = [
    {
      name: "La Normanda",
      address: "Delgado 864, Colegiales, CABA",
      link: "https://atcsports.io/venues/normanda-caba",
    },
    {
      name: "Sede Olleros",
      address: "Olleros 1515, Palermo, CABA",
      link: "https://share.google/bIoLG5BvQUmeSieEd",
    }
  ]

  const handleVenueClick = (link) => {
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-4 bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white text-lg sm:text-xl font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#E2FF1B]" />
              <span className="text-sm sm:text-base">Nuestras Sedes</span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {venues.map((venue, index) => (
            <div 
              key={index}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 sm:p-4 hover:bg-gray-800/50 transition-colors cursor-pointer group"
              onClick={() => handleVenueClick(venue.link)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base sm:text-lg mb-1 group-hover:text-[#E2FF1B] transition-colors">
                    {venue.name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-[#E2FF1B] flex-shrink-0" />
                    <span className="break-words">{venue.address}</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-[#E2FF1B] transition-colors flex-shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
