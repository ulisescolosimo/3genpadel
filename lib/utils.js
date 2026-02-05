import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un nombre a título: primera letra de cada palabra mayúscula, resto minúscula.
 * Útil para nombres en mayúsculas (GERMAN SCHVAB) o minúsculas (german schvab).
 * @param {string} nombre - Nombre a formatear
 * @returns {string} - Nombre formateado (ej: "German Enrique Schvab")
 */
export function formatNombreJugador(nombre) {
  if (!nombre || typeof nombre !== 'string') return ''
  const trimmed = nombre.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\s+/)
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ')
}
