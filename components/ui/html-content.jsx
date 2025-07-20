'use client'

import { cn } from '@/lib/utils'

const HtmlContent = ({ 
  content = '', 
  className = '',
  maxLength = null,
  showFullContent = false 
}) => {
  if (!content) {
    return null
  }

  // Si hay un maxLength y no se debe mostrar el contenido completo, truncar
  let displayContent = content
  if (maxLength && !showFullContent && content.length > maxLength) {
    // Remover HTML tags para contar caracteres reales
    const textContent = content.replace(/<[^>]*>/g, '')
    if (textContent.length > maxLength) {
      displayContent = textContent.substring(0, maxLength) + '...'
      // No aplicar HTML si está truncado
      return (
        <span className={cn("text-gray-300", className)}>
          {displayContent}
        </span>
      )
    }
  }

  return (
    <div 
      className={cn("html-content", className)}
      dangerouslySetInnerHTML={{ __html: displayContent }}
    />
  )
}

export default HtmlContent 