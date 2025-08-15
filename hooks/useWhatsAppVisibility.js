'use client'

import { createContext, useContext, useState } from 'react'

const WhatsAppVisibilityContext = createContext()

export function WhatsAppVisibilityProvider({ children }) {
  const [isWhatsAppVisible, setIsWhatsAppVisible] = useState(true)

  const hideWhatsApp = () => setIsWhatsAppVisible(false)
  const showWhatsApp = () => setIsWhatsAppVisible(true)

  return (
    <WhatsAppVisibilityContext.Provider value={{ 
      isWhatsAppVisible, 
      hideWhatsApp, 
      showWhatsApp 
    }}>
      {children}
    </WhatsAppVisibilityContext.Provider>
  )
}

export function useWhatsAppVisibility() {
  const context = useContext(WhatsAppVisibilityContext)
  if (!context) {
    throw new Error('useWhatsAppVisibility must be used within a WhatsAppVisibilityProvider')
  }
  return context
}
