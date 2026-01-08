import { supabase } from '../supabase'

/**
 * Solicita un reemplazo para un partido
 * @param {string} partidoId - ID del partido
 * @param {string} jugadorOriginalId - ID del jugador original
 * @param {string} jugadorReemplazoId - ID del jugador reemplazo
 * @returns {Promise<Object>} Registro de reemplazo creado
 */
export async function solicitarReemplazo(partidoId, jugadorOriginalId, jugadorReemplazoId) {
  try {
    // Obtener información del partido
    const { data: partido, error: errorPartido } = await supabase
      .from('circuito3gen_partidos')
      .select('etapa_id, division_id')
      .eq('id', partidoId)
      .single()

    if (errorPartido) throw errorPartido

    // Validar el reemplazo
    const esValido = await validarReemplazo(jugadorReemplazoId, partido.division_id)
    if (!esValido) {
      throw new Error('El jugador de reemplazo no es válido para esta división')
    }

    // Crear registro de reemplazo
    const { data: reemplazo, error: errorReemplazo } = await supabase
      .from('circuito3gen_reemplazos')
      .insert({
        partido_id: partidoId,
        jugador_original_id: jugadorOriginalId,
        jugador_reemplazo_id: jugadorReemplazoId,
        tipo_reemplazo: 'inscripto_circuito' // Se actualizará si es necesario
      })
      .select()
      .single()

    if (errorReemplazo) throw errorReemplazo

    return reemplazo
  } catch (error) {
    console.error('Error al solicitar reemplazo:', error)
    throw error
  }
}

/**
 * Valida si un jugador puede ser reemplazo
 * @param {string} jugadorReemplazoId - ID del jugador reemplazo
 * @param {string} divisionId - ID de la división
 * @returns {Promise<boolean>} true si es válido, false en caso contrario
 */
export async function validarReemplazo(jugadorReemplazoId, divisionId) {
  try {
    // Verificar si el jugador está inscripto en alguna etapa activa
    const { data: inscripcion, error } = await supabase
      .from('circuito3gen_inscripciones')
      .select('*')
      .eq('usuario_id', jugadorReemplazoId)
      .eq('division_id', divisionId)
      .eq('estado', 'activa')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    // Si tiene inscripción activa, es válido
    if (inscripcion) {
      return true
    }

    // Si no tiene inscripción, puede ser un nuevo jugador (requiere procesamiento especial)
    return true // Permitir, pero se procesará como nuevo_inscripto
  } catch (error) {
    console.error('Error al validar reemplazo:', error)
    return false
  }
}

/**
 * Procesa el reemplazo de un nuevo jugador (no inscripto en el circuito)
 * @param {string} jugadorReemplazoId - ID del jugador reemplazo
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<Object>} Inscripción creada para el nuevo jugador
 */
export async function procesarReemplazoNuevoJugador(jugadorReemplazoId, etapaId, divisionId) {
  try {
    // Verificar si ya está inscripto
    const { data: inscripcionExistente, error: errorExistente } = await supabase
      .from('circuito3gen_inscripciones')
      .select('*')
      .eq('etapa_id', etapaId)
      .eq('usuario_id', jugadorReemplazoId)
      .single()

    if (errorExistente && errorExistente.code !== 'PGRST116') throw errorExistente

    if (inscripcionExistente) {
      return inscripcionExistente
    }

    // Crear inscripción para el nuevo jugador
    const { data: nuevaInscripcion, error: errorInscripcion } = await supabase
      .from('circuito3gen_inscripciones')
      .insert({
        etapa_id: etapaId,
        usuario_id: jugadorReemplazoId,
        division_id: divisionId,
        estado: 'activa',
        fecha_inscripcion: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (errorInscripcion) throw errorInscripcion

    return nuevaInscripcion
  } catch (error) {
    console.error('Error al procesar reemplazo de nuevo jugador:', error)
    throw error
  }
}

/**
 * Actualiza un partido con un reemplazo
 * @param {string} partidoId - ID del partido
 * @param {Object} reemplazo - Objeto de reemplazo
 * @returns {Promise<Object>} Partido actualizado
 */
export async function actualizarPartidoConReemplazo(partidoId, reemplazo) {
  try {
    // Obtener el partido actual
    const { data: partido, error: errorPartido } = await supabase
      .from('circuito3gen_partidos')
      .select('*')
      .eq('id', partidoId)
      .single()

    if (errorPartido) throw errorPartido

    // Determinar qué jugador reemplazar
    let updateData = {}
    if (partido.jugador_a1_id === reemplazo.jugador_original_id) {
      updateData.jugador_a1_id = reemplazo.jugador_reemplazo_id
    } else if (partido.jugador_a2_id === reemplazo.jugador_original_id) {
      updateData.jugador_a2_id = reemplazo.jugador_reemplazo_id
    } else if (partido.jugador_b1_id === reemplazo.jugador_original_id) {
      updateData.jugador_b1_id = reemplazo.jugador_reemplazo_id
    } else if (partido.jugador_b2_id === reemplazo.jugador_original_id) {
      updateData.jugador_b2_id = reemplazo.jugador_reemplazo_id
    } else {
      throw new Error('El jugador original no está en este partido')
    }

    // Actualizar el partido
    const { data: partidoActualizado, error: errorUpdate } = await supabase
      .from('circuito3gen_partidos')
      .update(updateData)
      .eq('id', partidoId)
      .select()
      .single()

    if (errorUpdate) throw errorUpdate

    // Si el reemplazo es de un nuevo jugador, procesarlo
    if (reemplazo.tipo_reemplazo === 'nuevo_inscripto') {
      await procesarReemplazoNuevoJugador(
        reemplazo.jugador_reemplazo_id,
        partido.etapa_id,
        partido.division_id
      )
    }

    return partidoActualizado
  } catch (error) {
    console.error('Error al actualizar partido con reemplazo:', error)
    throw error
  }
}

/**
 * Obtiene los reemplazos pendientes de un partido
 * @param {string} partidoId - ID del partido
 * @returns {Promise<Array>} Array de reemplazos pendientes
 */
export async function obtenerReemplazosPendientes(partidoId = null) {
  try {
    let query = supabase
      .from('circuito3gen_reemplazos')
      .select(`
        *,
        partido:circuito3gen_partidos (
          id,
          fecha_partido,
          estado
        ),
        jugador_original:usuarios!circuito3gen_reemplazos_jugador_original_id_fkey (
          id,
          nombre,
          apellido
        ),
        jugador_reemplazo:usuarios!circuito3gen_reemplazos_jugador_reemplazo_id_fkey (
          id,
          nombre,
          apellido
        )
      `)

    if (partidoId) {
      query = query.eq('partido_id', partidoId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error al obtener reemplazos pendientes:', error)
    throw error
  }
}




















