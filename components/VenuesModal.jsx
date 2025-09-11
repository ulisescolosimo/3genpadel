'use client'

import { useState } from 'react'
import { MapPin, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function VenuesModal({ isOpen, onClose }) {
  const router = useRouter()
  
  const venues = [
    {
      name: "La Normanda",
      address: "Delgado 864, Colegiales, CABA",
      link: "https://atcsports.io/venues/normanda-caba",
      isExternal: true
    },
    {
      name: "Sede Olleros",
      address: "Olleros 1515, Palermo, CABA",
      link: "/sede-olleros",
      isExternal: false
    }
  ]

  const handleVenueClick = (venue) => {
    if (venue.isExternal) {
      window.open(venue.link, '_blank', 'noopener,noreferrer')
    } else {
      router.push(venue.link)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-sm mx-auto bg-black border-gray-800 rounded-lg">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-white text-base font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#E2FF1B]" />
              <span>Nuestras Sedes</span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {venues.map((venue, index) => (
            <div 
              key={index}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-800/50 transition-colors cursor-pointer group active:bg-gray-700/50"
              onClick={() => handleVenueClick(venue)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-[#E2FF1B] transition-colors">
                    {venue.name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-300 text-xs">
                    <MapPin className="h-3 w-3 text-[#E2FF1B] flex-shrink-0" />
                    <span className="break-words">{venue.address}</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#E2FF1B] transition-colors flex-shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
