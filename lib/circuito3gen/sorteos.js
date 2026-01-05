import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase para operaciones del servidor (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Forma parejas disponibles para una fecha
 * Nota: La disponibilidad se gestiona externamente por WhatsApp, 
 * el admin ingresará manualmente los jugadores disponibles
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @param {string} fechaPartido - Fecha del partido (YYYY-MM-DD)
 * @param {Array<string>} jugadoresDisponibles - Array de IDs de jugadores disponibles (ingresados manualmente por admin)
 * @returns {Promise<Array>} Array de parejas formadas
 */
export async function formarParejasDisponibles(etapaId, divisionId, fechaPartido, jugadoresDisponibles = []) {
  try {
    if (!jugadoresDisponibles || jugadoresDisponibles.length === 0) {
      return []
    }

    // Verificar que los jugadores estén inscriptos en la división
    const { data: inscripciones, error: errorInscripciones } = await supabase
      .from('circuito3gen_inscripciones')
      .select('usuario_id')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('estado', 'activa')
      .in('usuario_id', jugadoresDisponibles)

    if (errorInscripciones) throw errorInscripciones

    const jugadoresValidos = inscripciones?.map(i => i.usuario_id) || []

    // Obtener parejas ya formadas para esta fecha
    const { data: parejasExistentes, error: errorParejas } = await supabase
      .from('circuito3gen_parejas')
      .select('jugador_1_id, jugador_2_id')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('fecha_partido', fechaPartido)
      .eq('estado', 'confirmada')

    if (errorParejas) throw errorParejas

    const parejasFormadas = []
    const jugadoresUsados = new Set()

    // Primero, agregar parejas ya formadas
    parejasExistentes?.forEach(pareja => {
      if (jugadoresValidos.includes(pareja.jugador_1_id) && 
          jugadoresValidos.includes(pareja.jugador_2_id)) {
        parejasFormadas.push({
          jugador_1_id: pareja.jugador_1_id,
          jugador_2_id: pareja.jugador_2_id,
          tipo_formacion: 'elegida_por_jugadores'
        })
        jugadoresUsados.add(pareja.jugador_1_id)
        jugadoresUsados.add(pareja.jugador_2_id)
      }
    })

    // Luego, formar parejas con jugadores disponibles que no tienen pareja
    const jugadoresSinPareja = jugadoresValidos.filter(id => !jugadoresUsados.has(id))

    // Formar parejas aleatorias
    for (let i = 0; i < jugadoresSinPareja.length - 1; i += 2) {
      parejasFormadas.push({
        jugador_1_id: jugadoresSinPareja[i],
        jugador_2_id: jugadoresSinPareja[i + 1],
        tipo_formacion: 'asignada_organizacion'
      })
    }

    return parejasFormadas
  } catch (error) {
    console.error('Error al formar parejas disponibles:', error)
    throw error
  }
}

/**
 * Asigna parejas a jugadores que no tienen compañero
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @param {string} fechaPartido - Fecha del partido
 * @param {Array<string>} jugadoresDisponibles - Array de IDs de jugadores disponibles
 * @returns {Promise<Array>} Array de parejas asignadas
 */
export async function asignarParejasSinCompanero(etapaId, divisionId, fechaPartido, jugadoresDisponibles = []) {
  try {
    // Obtener jugadores que no tienen pareja formada
    const { data: parejasExistentes } = await supabase
      .from('circuito3gen_parejas')
      .select('jugador_1_id, jugador_2_id')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('fecha_partido', fechaPartido)
      .eq('estado', 'confirmada')

    const jugadoresConPareja = new Set()
    parejasExistentes?.forEach(pareja => {
      jugadoresConPareja.add(pareja.jugador_1_id)
      jugadoresConPareja.add(pareja.jugador_2_id)
    })

    const jugadoresSinPareja = jugadoresDisponibles.filter(
      id => !jugadoresConPareja.has(id)
    )

    // Formar parejas aleatorias
    const parejasAsignadas = []
    for (let i = 0; i < jugadoresSinPareja.length - 1; i += 2) {
      parejasAsignadas.push({
        jugador_1_id: jugadoresSinPareja[i],
        jugador_2_id: jugadoresSinPareja[i + 1],
        tipo_formacion: 'asignada_organizacion'
      })
    }

    return parejasAsignadas
  } catch (error) {
    console.error('Error al asignar parejas sin compañero:', error)
    throw error
  }
}

/**
 * Sortea partidos entre las parejas formadas
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @param {string} fechaPartido - Fecha del partido
 * @param {Array} parejas - Array de parejas formadas
 * @returns {Promise<Array>} Array de partidos sorteados
 */
export async function sortearPartidos(etapaId, divisionId, fechaPartido, parejas) {
  try {
    if (!parejas || parejas.length < 2) {
      return []
    }

    // Manejar caso de número impar de parejas
    const parejasParaSorteo = manejarParejaImpar(parejas)

    // Obtener historial de partidos para evitar repeticiones excesivas
    const { data: historialPartidos, error: errorHistorial } = await supabase
      .from('circuito3gen_partidos')
      .select('jugador_a1_id, jugador_a2_id, jugador_b1_id, jugador_b2_id')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('estado', 'jugado')

    if (errorHistorial) throw errorHistorial

    // Mezclar parejas aleatoriamente
    const parejasMezcladas = [...parejasParaSorteo].sort(() => Math.random() - 0.5)

    // Formar partidos
    const partidos = []
    for (let i = 0; i < parejasMezcladas.length - 1; i += 2) {
      const parejaA = parejasMezcladas[i]
      const parejaB = parejasMezcladas[i + 1]

      // Validar que no se repita excesivamente
      if (!validarParejasRepetidas(parejaA, parejaB, historialPartidos || [])) {
        partidos.push({
          etapa_id: etapaId,
          division_id: divisionId,
          fecha_partido: fechaPartido,
          jugador_a1_id: parejaA.jugador_1_id,
          jugador_a2_id: parejaA.jugador_2_id,
          jugador_b1_id: parejaB.jugador_1_id,
          jugador_b2_id: parejaB.jugador_2_id,
          estado: 'pendiente'
        })
      }
    }

    return partidos
  } catch (error) {
    console.error('Error al sortear partidos:', error)
    throw error
  }
}

/**
 * Maneja el caso de número impar de parejas
 * La última pareja queda sin partido o se puede asignar a un partido especial
 * @param {Array} parejas - Array de parejas
 * @returns {Array} Array de parejas (la última puede quedar fuera si es impar)
 */
export function manejarParejaImpar(parejas) {
  if (parejas.length % 2 === 0) {
    return parejas
  }

  // Si hay número impar, la última pareja queda sin partido
  // Se puede implementar lógica adicional aquí (ej: partido especial, bye, etc.)
  return parejas.slice(0, -1)
}

/**
 * Valida si dos parejas se han enfrentado recientemente
 * @param {Object} pareja1 - Primera pareja
 * @param {Object} pareja2 - Segunda pareja
 * @param {Array} historial - Historial de partidos
 * @returns {boolean} true si es válido (no se repite excesivamente), false en caso contrario
 */
export function validarParejasRepetidas(pareja1, pareja2, historial) {
  // Contar cuántas veces se han enfrentado estas parejas
  let repeticiones = 0

  historial.forEach(partido => {
    const jugadoresPartido = [
      partido.jugador_a1_id,
      partido.jugador_a2_id,
      partido.jugador_b1_id,
      partido.jugador_b2_id
    ]

    const jugadoresPareja1 = [pareja1.jugador_1_id, pareja1.jugador_2_id]
    const jugadoresPareja2 = [pareja2.jugador_1_id, pareja2.jugador_2_id]

    // Verificar si ambas parejas participaron en este partido
    const pareja1EnPartido = jugadoresPareja1.every(j => jugadoresPartido.includes(j))
    const pareja2EnPartido = jugadoresPareja2.every(j => jugadoresPartido.includes(j))

    if (pareja1EnPartido && pareja2EnPartido) {
      repeticiones++
    }
  })

  // Permitir máximo 2 repeticiones (puede ajustarse)
  return repeticiones < 2
}

/**
 * Ejecuta un sorteo de un solo partido
 * Selecciona aleatoriamente 4 jugadores disponibles y crea un partido
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @param {string} fechaPartido - Fecha del partido
 * @param {Array<string>} jugadoresDisponibles - Array de IDs de jugadores disponibles
 * @returns {Promise<Object>} Resultado del sorteo con parejas y partido generado
 */
export async function ejecutarSorteoUnPartido(etapaId, divisionId, fechaPartido, jugadoresDisponibles = []) {
  try {
    if (!jugadoresDisponibles || jugadoresDisponibles.length < 4) {
      throw new Error('Se necesitan al menos 4 jugadores disponibles para sortear un partido')
    }

    // Obtener jugadores que ya tienen partido asignado para esta fecha
    const { data: partidosExistentes, error: errorPartidos } = await supabase
      .from('circuito3gen_partidos')
      .select('jugador_a1_id, jugador_a2_id, jugador_b1_id, jugador_b2_id')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('fecha_partido', fechaPartido)
      .eq('estado', 'pendiente')

    if (errorPartidos) throw errorPartidos

    // Crear un Set con los IDs de jugadores que ya tienen partido
    const jugadoresConPartido = new Set()
    partidosExistentes?.forEach(partido => {
      if (partido.jugador_a1_id) jugadoresConPartido.add(partido.jugador_a1_id)
      if (partido.jugador_a2_id) jugadoresConPartido.add(partido.jugador_a2_id)
      if (partido.jugador_b1_id) jugadoresConPartido.add(partido.jugador_b1_id)
      if (partido.jugador_b2_id) jugadoresConPartido.add(partido.jugador_b2_id)
    })

    // Filtrar jugadores disponibles que aún no tienen partido
    const jugadoresDisponiblesSinPartido = jugadoresDisponibles.filter(
      id => !jugadoresConPartido.has(id)
    )

    if (jugadoresDisponiblesSinPartido.length < 4) {
      throw new Error(`Solo quedan ${jugadoresDisponiblesSinPartido.length} jugadores disponibles sin partido. Se necesitan al menos 4.`)
    }

    // Mezclar aleatoriamente y seleccionar 4 jugadores
    const jugadoresMezclados = [...jugadoresDisponiblesSinPartido].sort(() => Math.random() - 0.5)
    const jugadoresSeleccionados = jugadoresMezclados.slice(0, 4)

    // Formar 2 parejas aleatorias
    const parejaA = {
      jugador_1_id: jugadoresSeleccionados[0],
      jugador_2_id: jugadoresSeleccionados[1],
      tipo_formacion: 'asignada_organizacion'
    }

    const parejaB = {
      jugador_1_id: jugadoresSeleccionados[2],
      jugador_2_id: jugadoresSeleccionados[3],
      tipo_formacion: 'asignada_organizacion'
    }

    // Crear un solo partido
    const partido = {
      etapa_id: etapaId,
      division_id: divisionId,
      fecha_partido: fechaPartido,
      jugador_a1_id: parejaA.jugador_1_id,
      jugador_a2_id: parejaA.jugador_2_id,
      jugador_b1_id: parejaB.jugador_1_id,
      jugador_b2_id: parejaB.jugador_2_id,
      estado: 'pendiente'
    }

    return {
      parejas: [parejaA, parejaB],
      partidos: [partido],
      totalParejas: 2,
      totalPartidos: 1,
      jugadoresUsados: jugadoresSeleccionados
    }
  } catch (error) {
    console.error('Error al ejecutar sorteo de un partido:', error)
    throw error
  }
}

/**
 * Ejecuta un sorteo completo para una fecha
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @param {string} fechaPartido - Fecha del partido
 * @param {Array<string>} jugadoresDisponibles - Array de IDs de jugadores disponibles
 * @returns {Promise<Object>} Resultado del sorteo con parejas y partidos
 */
export async function ejecutarSorteoCompleto(etapaId, divisionId, fechaPartido, jugadoresDisponibles = []) {
  try {
    // Formar parejas
    const parejas = await formarParejasDisponibles(
      etapaId,
      divisionId,
      fechaPartido,
      jugadoresDisponibles
    )

    // Asignar parejas a jugadores sin compañero
    const parejasAsignadas = await asignarParejasSinCompanero(
      etapaId,
      divisionId,
      fechaPartido,
      jugadoresDisponibles
    )

    // Combinar todas las parejas
    const todasLasParejas = [...parejas, ...parejasAsignadas]

    // Sortear partidos
    const partidos = await sortearPartidos(
      etapaId,
      divisionId,
      fechaPartido,
      todasLasParejas
    )

    return {
      parejas: todasLasParejas,
      partidos,
      totalParejas: todasLasParejas.length,
      totalPartidos: partidos.length
    }
  } catch (error) {
    console.error('Error al ejecutar sorteo completo:', error)
    throw error
  }
}

