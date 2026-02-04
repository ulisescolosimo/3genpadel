// Utilidades para manejar fechas argentinas correctamente
// Evita problemas de zona horaria al parsear fechas de Supabase

/**
 * Formatea una fecha en formato YYYY-MM-DD a formato argentino
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha formateada en español argentino
 */
export const formatArgentineDate = (dateString) => {
  if (!dateString) return ''
  
  // Para fechas en formato YYYY-MM-DD, crear la fecha directamente
  const [year, month, day] = dateString.split('-')
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  return `${day} de ${monthNames[parseInt(month) - 1]} de ${year}`
}

/**
 * Formatea una fecha con hora en formato argentino
 * @param {string} dateString - Fecha en formato ISO o YYYY-MM-DD
 * @returns {object} - Objeto con fecha y hora formateadas
 */
export const formatArgentineDateTime = (dateString) => {
  if (!dateString) return null
  
  try {
    // Si es un string, asegurar que se interprete como fecha local
    let fechaObj
    if (typeof dateString === 'string') {
      // Si es solo fecha (YYYY-MM-DD), agregar hora
      if (dateString.includes('T')) {
        fechaObj = new Date(dateString)
      } else {
        const [year, month, day] = dateString.split('-')
        fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
    } else {
      fechaObj = new Date(dateString)
    }
    
    return {
      fecha: fechaObj.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      }),
      hora: fechaObj.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  } catch (error) {
    console.error('Error formateando fecha:', error)
    return null
  }
}

/**
 * Formatea una fecha para mostrar en formato corto argentino
 * @param {string} dateString - Fecha en formato ISO o YYYY-MM-DD
 * @returns {string} - Fecha formateada en formato corto
 */
export const formatArgentineDateShort = (dateString) => {
  if (!dateString) return ''
  
  try {
    let fechaObj
    if (typeof dateString === 'string') {
      if (dateString.includes('T')) {
        fechaObj = new Date(dateString)
      } else {
        const [year, month, day] = dateString.split('-')
        fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
    } else {
      fechaObj = new Date(dateString)
    }
    
    return fechaObj.toLocaleDateString('es-AR')
  } catch (error) {
    console.error('Error formateando fecha corta:', error)
    return ''
  }
}

/**
 * Formatea una fecha para mostrar en formato largo argentino
 * @param {string} dateString - Fecha en formato ISO o YYYY-MM-DD
 * @returns {string} - Fecha formateada en formato largo
 */
export const formatArgentineDateLong = (dateString) => {
  if (!dateString) return ''
  
  try {
    let fechaObj
    if (typeof dateString === 'string') {
      if (dateString.includes('T')) {
        fechaObj = new Date(dateString)
      } else {
        const [year, month, day] = dateString.split('-')
        fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
    } else {
      fechaObj = new Date(dateString)
    }
    
    return fechaObj.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formateando fecha larga:', error)
    return ''
  }
}

/**
 * Formatea fecha y hora de un partido en zona horaria Argentina
 * Los datos (fecha_partido, horario) se interpretan como hora local de Argentina
 * @param {string} fechaPartido - Fecha en formato YYYY-MM-DD
 * @param {string} horario - Hora en formato HH:MM:SS o HH:MM
 * @returns {string} - Fecha y hora formateadas en español argentino
 */
export const formatPartidoDateTimeArgentina = (fechaPartido, horario) => {
  if (!fechaPartido) return ''
  
  const fechaStr = formatArgentineDate(fechaPartido)
  
  if (!horario) return fechaStr
  
  try {
    // Crear ISO string interpretando fecha+hora como Argentina (UTC-3)
    const horarioNormalizado = horario.length >= 5 ? horario.substring(0, 5) : horario
    const isoArgentina = `${fechaPartido}T${horarioNormalizado}:00-03:00`
    const date = new Date(isoArgentina)
    
    const horaFormateada = date.toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${fechaStr} a las ${horaFormateada}`
  } catch {
    return `${fechaStr} a las ${horario.substring(0, 5)}`
  }
}

/**
 * Convierte una fecha a zona horaria argentina
 * @param {string} dateString - Fecha en formato ISO
 * @returns {Date} - Fecha en zona horaria argentina
 */
export const toArgentineTime = (dateString) => {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    // Argentina está en UTC-3
    const argentineOffset = -3 * 60 * 60 * 1000
    return new Date(date.getTime() + argentineOffset)
  } catch (error) {
    console.error('Error convirtiendo a hora argentina:', error)
    return null
  }
} 