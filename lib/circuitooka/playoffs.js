import { supabase } from '../supabase'
import { identificarJugadoresPlayoff } from './ascensos-descensos'

/**
 * Identifica las zonas de repechaje para playoffs
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<Object>} Objeto con jugadores para playoff de ascenso y descenso
 */
export async function identificarZonasRepechaje(etapaId, divisionId) {
  try {
    return await identificarJugadoresPlayoff(etapaId, divisionId)
  } catch (error) {
    console.error('Error al identificar zonas de repechaje:', error)
    throw error
  }
}

/**
 * Forma parejas para los playoffs
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @param {string} tipoPlayoff - 'ascenso' o 'descenso'
 * @returns {Promise<Array>} Array de parejas formadas para playoff
 */
export async function formarParejasPlayoff(etapaId, divisionId, tipoPlayoff) {
  try {
    const zonas = await identificarZonasRepechaje(etapaId, divisionId)
    const jugadoresPlayoff = tipoPlayoff === 'ascenso' 
      ? zonas.playoff_ascenso 
      : zonas.playoff_descenso

    if (!jugadoresPlayoff || jugadoresPlayoff.length < 4) {
      throw new Error('No hay suficientes jugadores para formar parejas de playoff')
    }

    // Formar parejas: mejor vs peor, segundo mejor vs segundo peor
    const parejas = []
    const mitad = Math.floor(jugadoresPlayoff.length / 2)

    for (let i = 0; i < mitad; i++) {
      const jugadorSuperior = jugadoresPlayoff[i]
      const jugadorInferior = jugadoresPlayoff[jugadoresPlayoff.length - 1 - i]

      parejas.push({
        jugador_1_superior_id: jugadorSuperior.usuario_id,
        jugador_2_superior_id: null, // Se asignará después
        jugador_1_inferior_id: jugadorInferior.usuario_id,
        jugador_2_inferior_id: null // Se asignará después
      })
    }

    return parejas
  } catch (error) {
    console.error('Error al formar parejas de playoff:', error)
    throw error
  }
}

/**
 * Crea los partidos de playoff
 * @param {Array} playoffs - Array de objetos de playoff con parejas
 * @returns {Promise<Array>} Array de partidos de playoff creados
 */
export async function crearPartidosPlayoff(playoffs) {
  try {
    const partidosCreados = []

    for (const playoff of playoffs) {
      // Crear el partido de playoff
      const { data: partido, error: errorPartido } = await supabase
        .from('circuitooka_partidos')
        .insert({
          etapa_id: playoff.etapa_id,
          division_id: playoff.division_origen_id,
          fecha_partido: playoff.fecha_playoff,
          jugador_a1_id: playoff.jugador_1_superior_id,
          jugador_a2_id: playoff.jugador_2_superior_id || playoff.jugador_1_superior_id, // Temporal si no hay segundo
          jugador_b1_id: playoff.jugador_1_inferior_id,
          jugador_b2_id: playoff.jugador_2_inferior_id || playoff.jugador_1_inferior_id, // Temporal si no hay segundo
          estado: 'pendiente'
        })
        .select()
        .single()

      if (errorPartido) throw errorPartido

      // Actualizar el registro de playoff con el partido_id
      const { error: errorUpdate } = await supabase
        .from('circuitooka_playoffs')
        .update({ partido_id: partido.id })
        .eq('id', playoff.id)

      if (errorUpdate) throw errorUpdate

      partidosCreados.push(partido)
    }

    return partidosCreados
  } catch (error) {
    console.error('Error al crear partidos de playoff:', error)
    throw error
  }
}

/**
 * Procesa el resultado de un playoff
 * @param {string} playoffId - ID del playoff
 * @param {Object} resultado - Resultado del partido
 * @returns {Promise<Object>} Playoff actualizado
 */
export async function procesarResultadoPlayoff(playoffId, resultado) {
  try {
    // Obtener el playoff
    const { data: playoff, error: errorPlayoff } = await supabase
      .from('circuitooka_playoffs')
      .select('*')
      .eq('id', playoffId)
      .single()

    if (errorPlayoff) throw errorPlayoff

    // Actualizar el resultado del playoff
    const { data: playoffActualizado, error: errorUpdate } = await supabase
      .from('circuitooka_playoffs')
      .update({
        resultado: resultado,
        estado: 'jugado'
      })
      .eq('id', playoffId)
      .select()
      .single()

    if (errorUpdate) throw errorUpdate

    // Actualizar el partido asociado
    if (playoff.partido_id) {
      const { error: errorPartido } = await supabase
        .from('circuitooka_partidos')
        .update({
          estado: 'jugado',
          equipo_ganador: resultado.equipo_ganador,
          sets_equipo_a: resultado.sets_equipo_a,
          sets_equipo_b: resultado.sets_equipo_b,
          games_equipo_a: resultado.games_equipo_a,
          games_equipo_b: resultado.games_equipo_b,
          resultado_detallado: resultado
        })
        .eq('id', playoff.partido_id)

      if (errorPartido) throw errorPartido
    }

    return playoffActualizado
  } catch (error) {
    console.error('Error al procesar resultado de playoff:', error)
    throw error
  }
}

/**
 * Aplica los ascensos/descensos resultantes de un playoff
 * @param {string} playoffId - ID del playoff
 * @returns {Promise<Object>} Resultado de la aplicación de cambios
 */
export async function aplicarAscensosDescensosPlayoff(playoffId) {
  try {
    // Obtener el playoff
    const { data: playoff, error: errorPlayoff } = await supabase
      .from('circuitooka_playoffs')
      .select('*')
      .eq('id', playoffId)
      .single()

    if (errorPlayoff) throw errorPlayoff

    if (playoff.estado !== 'jugado') {
      throw new Error('El playoff debe estar jugado para aplicar cambios')
    }

    const resultado = playoff.resultado
    const equipoGanador = resultado.equipo_ganador

    // Determinar qué jugadores ascienden/descienden según el resultado
    let jugadoresQueAscienden = []
    let jugadoresQueDescienden = []

    if (equipoGanador === 'A') {
      // Equipo superior gana: ascienden
      if (playoff.jugador_1_superior_id) jugadoresQueAscienden.push(playoff.jugador_1_superior_id)
      if (playoff.jugador_2_superior_id) jugadoresQueAscienden.push(playoff.jugador_2_superior_id)
      // Equipo inferior desciende
      if (playoff.jugador_1_inferior_id) jugadoresQueDescienden.push(playoff.jugador_1_inferior_id)
      if (playoff.jugador_2_inferior_id) jugadoresQueDescienden.push(playoff.jugador_2_inferior_id)
    } else {
      // Equipo inferior gana: ascienden
      if (playoff.jugador_1_inferior_id) jugadoresQueAscienden.push(playoff.jugador_1_inferior_id)
      if (playoff.jugador_2_inferior_id) jugadoresQueAscienden.push(playoff.jugador_2_inferior_id)
      // Equipo superior desciende
      if (playoff.jugador_1_superior_id) jugadoresQueDescienden.push(playoff.jugador_1_superior_id)
      if (playoff.jugador_2_superior_id) jugadoresQueDescienden.push(playoff.jugador_2_superior_id)
    }

    // Aplicar cambios
    const cambios = {
      ascensos: [],
      descensos: []
    }

    for (const jugadorId of jugadoresQueAscienden) {
      const { data: cambio } = await supabase
        .from('circuitooka_ascensos_descensos')
        .insert({
          etapa_id: playoff.etapa_id,
          usuario_id: jugadorId,
          division_origen_id: playoff.division_origen_id,
          division_destino_id: playoff.division_destino_id,
          tipo_movimiento: 'ascenso',
          motivo: 'playoff',
          promedio_final: 0 // Se calculará después
        })
        .select()
        .single()

      cambios.ascensos.push(cambio)
    }

    for (const jugadorId of jugadoresQueDescienden) {
      const { data: cambio } = await supabase
        .from('circuitooka_ascensos_descensos')
        .insert({
          etapa_id: playoff.etapa_id,
          usuario_id: jugadorId,
          division_origen_id: playoff.division_origen_id,
          division_destino_id: playoff.division_destino_id,
          tipo_movimiento: 'descenso',
          motivo: 'playoff',
          promedio_final: 0 // Se calculará después
        })
        .select()
        .single()

      cambios.descensos.push(cambio)
    }

    return cambios
  } catch (error) {
    console.error('Error al aplicar ascensos/descensos de playoff:', error)
    throw error
  }
}









