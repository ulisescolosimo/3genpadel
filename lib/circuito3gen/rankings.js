import { createClient } from '@supabase/supabase-js'
import {
  calcularTodosLosPromedios,
  obtenerMinimoRequerido
} from './promedios'

// Cliente con service role key para operaciones de servidor (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Actualiza el ranking de un jugador específico
 * @param {string} usuarioId - ID del usuario
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<Object>} Ranking actualizado
 */
export async function actualizarRankingJugador(usuarioId, etapaId, divisionId) {
  try {
    // Obtener partidos del jugador en esta etapa y división
    const { data: partidosJugador, error: errorPartidos } = await supabase
      .from('circuito3gen_partidos')
      .select('*')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('estado', 'jugado')
      .or(`jugador_a1_id.eq.${usuarioId},jugador_a2_id.eq.${usuarioId},jugador_b1_id.eq.${usuarioId},jugador_b2_id.eq.${usuarioId}`)

    if (errorPartidos) throw errorPartidos

    // Excluir partidos donde el jugador tuvo WO individual (no se presentó)
    const woIds = (partido) => Array.isArray(partido?.wo_jugador_ids) ? partido.wo_jugador_ids : []
    const partidosParaEstadisticas = (partidosJugador || []).filter(
      p => !woIds(p).includes(usuarioId)
    )

    // Contar partidos ganados y jugados
    let partidosGanados = 0
    let partidosJugados = partidosParaEstadisticas.length
    let diferenciaSets = 0
    let diferenciaGames = 0

    partidosParaEstadisticas.forEach(partido => {
      const esEquipoA = partido.jugador_a1_id === usuarioId || partido.jugador_a2_id === usuarioId
      const equipoGanador = partido.equipo_ganador

      if (equipoGanador === 'A' && esEquipoA) {
        partidosGanados++
      } else if (equipoGanador === 'B' && !esEquipoA) {
        partidosGanados++
      }

      // Calcular diferencia de sets y games
      if (esEquipoA) {
        diferenciaSets += (partido.sets_equipo_a || 0) - (partido.sets_equipo_b || 0)
        diferenciaGames += (partido.games_equipo_a || 0) - (partido.games_equipo_b || 0)
      } else {
        diferenciaSets += (partido.sets_equipo_b || 0) - (partido.sets_equipo_a || 0)
        diferenciaGames += (partido.games_equipo_b || 0) - (partido.games_equipo_a || 0)
      }
    })

    // Obtener totales de la división
    const { count: partidosDivision, error: errorPartidosDivision } = await supabase
      .from('circuito3gen_partidos')
      .select('*', { count: 'exact', head: true })
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('estado', 'jugado')

    if (errorPartidosDivision) throw errorPartidosDivision

    const { count: jugadoresInscriptos, error: errorInscripciones } = await supabase
      .from('circuito3gen_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('estado', 'activa')

    if (errorInscripciones) throw errorInscripciones

    // Calcular promedios
    const promedios = calcularTodosLosPromedios({
      partidosGanados,
      partidosJugados,
      partidosDivision: partidosDivision || 0,
      jugadoresInscriptos: jugadoresInscriptos || 0
    })

    // Obtener victorias contra mejores parejas (top 3 del ranking)
    const victoriasMejoresParejas = await calcularVictoriasMejoresParejas(
      usuarioId,
      etapaId,
      divisionId,
      partidosParaEstadisticas
    )

    // Actualizar o insertar ranking
    const rankingData = {
      etapa_id: etapaId,
      division_id: divisionId,
      usuario_id: usuarioId,
      partidos_ganados: partidosGanados,
      partidos_jugados: partidosJugados,
      promedio_individual: promedios.promedioIndividual,
      promedio_general: promedios.promedioGeneral,
      bonus_por_jugar: promedios.bonusPorJugar,
      promedio_final: promedios.promedioFinal,
      diferencia_sets: diferenciaSets,
      diferencia_games: diferenciaGames,
      victorias_mejores_parejas: victoriasMejoresParejas,
      minimo_requerido: promedios.minimoRequerido,
      cumple_minimo: promedios.cumpleMinimo
    }

    const { data: rankingExistente } = await supabase
      .from('circuito3gen_rankings')
      .select('id')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('usuario_id', usuarioId)
      .single()

    let resultado
    if (rankingExistente) {
      const { data, error } = await supabase
        .from('circuito3gen_rankings')
        .update(rankingData)
        .eq('id', rankingExistente.id)
        .select()
        .single()

      if (error) throw error
      resultado = data
    } else {
      const { data, error } = await supabase
        .from('circuito3gen_rankings')
        .insert(rankingData)
        .select()
        .single()

      if (error) throw error
      resultado = data
    }

    // Recalcular posiciones de todos los jugadores de la división
    await recalcularPosicionesRanking(etapaId, divisionId)

    // Actualizar promedio global del jugador (a partir de TODOS sus partidos)
    await actualizarPromedioGlobalJugador(usuarioId)

    return resultado
  } catch (error) {
    console.error('Error al actualizar ranking del jugador:', error)
    throw error
  }
}

/**
 * Actualiza el promedio global del jugador basado en TODOS sus partidos en TODAS las divisiones
 * Usa la fórmula: promedio_individual + promedio_general + bonus_por_jugar
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<Object>} Datos actualizados del usuario
 */
export async function actualizarPromedioGlobalJugador(usuarioId) {
  try {
    // Obtener TODOS los partidos jugados del jugador en TODAS las etapas y divisiones
    const { data: todosPartidos, error: errorPartidos } = await supabase
      .from('circuito3gen_partidos')
      .select('*')
      .eq('estado', 'jugado')
      .or(`jugador_a1_id.eq.${usuarioId},jugador_a2_id.eq.${usuarioId},jugador_b1_id.eq.${usuarioId},jugador_b2_id.eq.${usuarioId}`)

    if (errorPartidos) throw errorPartidos

    // Excluir partidos donde el jugador tuvo WO individual (no se presentó)
    const woIds = (partido) => Array.isArray(partido?.wo_jugador_ids) ? partido.wo_jugador_ids : []
    const partidosParaEstadisticas = (todosPartidos || []).filter(
      p => !woIds(p).includes(usuarioId)
    )

    // Contar partidos ganados y jugados del jugador
    let partidosGanados = 0
    let partidosJugados = partidosParaEstadisticas.length

    partidosParaEstadisticas.forEach(partido => {
      const esEquipoA = partido.jugador_a1_id === usuarioId || partido.jugador_a2_id === usuarioId
      const equipoGanador = partido.equipo_ganador

      if (equipoGanador === 'A' && esEquipoA) {
        partidosGanados++
      } else if (equipoGanador === 'B' && !esEquipoA) {
        partidosGanados++
      }
    })

    // Obtener total de partidos jugados en TODO el circuito (todas las divisiones y etapas)
    const { count: totalPartidosCircuito, error: errorTotalPartidos } = await supabase
      .from('circuito3gen_partidos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'jugado')

    if (errorTotalPartidos) throw errorTotalPartidos

    // Importar funciones de cálculo de promedios
    const {
      calcularPromedioIndividual,
      calcularPromedioGeneral,
      calcularBonusPorJugar,
      calcularPromedioFinal
    } = await import('./promedios')

    // Calcular promedio individual: partidos_ganados / partidos_jugados
    const promedioIndividual = calcularPromedioIndividual(partidosGanados, partidosJugados)

    // Calcular promedio general: partidos_ganados / total_partidos_circuito
    // Esto considera todos los partidos del circuito, no solo de una división
    const promedioGeneral = calcularPromedioGeneral(
      partidosGanados,
      partidosJugados,
      totalPartidosCircuito || 0
    )

    // Calcular bonus por jugar: partidos_jugados / total_partidos_circuito
    const bonus = calcularBonusPorJugar(partidosJugados, totalPartidosCircuito || 0, 0)
      
    // Calcular promedio final según la fórmula:
    // promedio_final = promedio_individual + promedio_general + bonus_por_jugar
      const promedioFinal = calcularPromedioFinal(promedioIndividual, promedioGeneral, bonus)
      
      // Guardar como decimal (0-1) para consistencia con circuito3gen_rankings.promedio_final
      // Cuando se muestre en la UI, se multiplicará por 100 para mostrarlo como porcentaje (0-100%)
      const promedioGlobal = promedioFinal
      
      // Actualizar el perfil del jugador
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          promedio_global: Math.round(promedioGlobal * 100) / 100, // Redondear a 2 decimales (ej: 0.40)
        partidos_totales_jugados: partidosJugados,
        partidos_totales_ganados: partidosGanados,
        promedio_actualizado_at: new Date().toISOString()
      })
      .eq('id', usuarioId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error al actualizar promedio global del jugador:', error)
    throw error
  }
}

/**
 * Calcula las victorias contra las mejores parejas (top 3 del ranking)
 * @param {string} usuarioId - ID del usuario
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @param {Array} partidosJugador - Partidos del jugador
 * @returns {Promise<number>} Cantidad de victorias contra mejores parejas
 */
async function calcularVictoriasMejoresParejas(usuarioId, etapaId, divisionId, partidosJugador) {
  try {
    // Obtener top 3 del ranking
    const { data: topRanking, error } = await supabase
      .from('circuito3gen_rankings')
      .select('usuario_id')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .order('promedio_final', { ascending: false })
      .order('diferencia_sets', { ascending: false })
      .order('diferencia_games', { ascending: false })
      .limit(3)

    if (error) throw error

    const topJugadoresIds = topRanking?.map(r => r.usuario_id) || []

    // Contar victorias contra estos jugadores
    let victorias = 0
    partidosJugador.forEach(partido => {
      const esEquipoA = partido.jugador_a1_id === usuarioId || partido.jugador_a2_id === usuarioId
      const equipoGanador = partido.equipo_ganador
      const gano = (equipoGanador === 'A' && esEquipoA) || (equipoGanador === 'B' && !esEquipoA)

      if (gano) {
        // Verificar si alguno de los oponentes está en el top 3
        const oponentes = esEquipoA
          ? [partido.jugador_b1_id, partido.jugador_b2_id]
          : [partido.jugador_a1_id, partido.jugador_a2_id]

        const tieneOponenteTop = oponentes.some(id => topJugadoresIds.includes(id))
        if (tieneOponenteTop) {
          victorias++
        }
      }
    })

    return victorias
  } catch (error) {
    console.error('Error al calcular victorias contra mejores parejas:', error)
    return 0
  }
}

/**
 * Recalcula las posiciones de todos los jugadores en una división
 * IMPORTANTE: Solo asigna posiciones oficiales a jugadores que cumplen el mínimo requerido
 * Los jugadores que no cumplen el mínimo no tienen posición oficial (null) pero SÍ participan en descensos y playoffs
 * para evitar que dejen de jugar intencionalmente para evitar descender
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<void>}
 */
export async function recalcularPosicionesRanking(etapaId, divisionId) {
  try {
    // Obtener todos los rankings ordenados
    const { data: rankings, error } = await supabase
      .from('circuito3gen_rankings')
      .select('*')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .order('promedio_final', { ascending: false })
      .order('diferencia_sets', { ascending: false })
      .order('diferencia_games', { ascending: false })
      .order('victorias_mejores_parejas', { ascending: false })

    if (error) throw error

    // Separar jugadores que cumplen mínimo de los que no
    const rankingsCumplenMinimo = rankings.filter(r => r.cumple_minimo)
    const rankingsNoCumplenMinimo = rankings.filter(r => !r.cumple_minimo)

    // Actualizar posiciones solo para los que cumplen mínimo
    const updatesCumplen = rankingsCumplenMinimo.map((ranking, index) => ({
      id: ranking.id,
      posicion_ranking: index + 1
    }))

    // Los que no cumplen mínimo tienen posición null
    const updatesNoCumplen = rankingsNoCumplenMinimo.map(ranking => ({
      id: ranking.id,
      posicion_ranking: null
    }))

    // Aplicar actualizaciones
    for (const update of updatesCumplen) {
      await supabase
        .from('circuito3gen_rankings')
        .update({ posicion_ranking: update.posicion_ranking })
        .eq('id', update.id)
    }

    for (const update of updatesNoCumplen) {
      await supabase
        .from('circuito3gen_rankings')
        .update({ posicion_ranking: null })
        .eq('id', update.id)
    }
  } catch (error) {
    console.error('Error al recalcular posiciones:', error)
    throw error
  }
}

/**
 * Obtiene el ranking completo de una división
 * Incluye TODOS los jugadores inscriptos, incluso si no tienen partidos jugados
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<Array>} Array de rankings ordenados (incluye jugadores sin partidos)
 */
export async function obtenerRankingCompleto(etapaId, divisionId) {
  try {
    // Primero obtener todas las inscripciones activas
    const { data: inscripciones, error: errorInscripciones } = await supabase
      .from('circuito3gen_inscripciones')
      .select(`
        usuario_id,
        usuario:usuarios (
          id,
          nombre,
          apellido,
          email
        )
      `)
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('estado', 'activa')

    if (errorInscripciones) throw errorInscripciones

    // Obtener todos los rankings existentes
    const { data: rankings, error: errorRankings } = await supabase
      .from('circuito3gen_rankings')
      .select('*')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)

    if (errorRankings) throw errorRankings

    // Calcular mínimo requerido para la división (es el mismo para todos los jugadores de la división)
    const minimoRequerido = await obtenerMinimoRequerido(etapaId, divisionId)

    // Crear un mapa de rankings por usuario_id
    const rankingsMap = new Map()
    rankings?.forEach(ranking => {
      rankingsMap.set(ranking.usuario_id, ranking)
    })

    // Combinar inscripciones con rankings
    // Si un jugador no tiene ranking, crear uno con valores por defecto
    const rankingsCompletos = (inscripciones || []).map(inscripcion => {
      const ranking = rankingsMap.get(inscripcion.usuario_id)
      
      if (ranking) {
        // Tiene ranking, asegurar que tenga el mínimo requerido actualizado de la división
        // y recalcular si cumple mínimo
        const partidosJugados = ranking.partidos_jugados || 0
        const cumpleMinimo = partidosJugados >= minimoRequerido
        
        return {
          ...ranking,
          minimo_requerido: minimoRequerido, // Actualizar con el mínimo de la división
          cumple_minimo: cumpleMinimo, // Recalcular si cumple
          usuario: inscripcion.usuario
        }
      } else {
        // No tiene ranking, crear uno con valores por defecto
        // Calcular si cumple mínimo (si tiene 0 partidos, no cumple)
        const partidosJugados = 0
        const cumpleMinimo = partidosJugados >= minimoRequerido
        
        return {
          id: null,
          etapa_id: etapaId,
          division_id: divisionId,
          usuario_id: inscripcion.usuario_id,
          partidos_ganados: 0,
          partidos_jugados: 0,
          promedio_individual: 0,
          promedio_general: 0,
          bonus_por_jugar: 0,
          promedio_final: 0,
          diferencia_sets: 0,
          diferencia_games: 0,
          victorias_mejores_parejas: 0,
          posicion_ranking: null,
          minimo_requerido: minimoRequerido,
          cumple_minimo: cumpleMinimo,
          created_at: null,
          updated_at: null,
          usuario: inscripcion.usuario
        }
      }
    })

    // Ordenar: primero los que cumplen mínimo (por posición), luego los que no cumplen (sin posición)
    rankingsCompletos.sort((a, b) => {
      // Si ambos cumplen mínimo, ordenar por posición
      if (a.cumple_minimo && b.cumple_minimo) {
        if (a.posicion_ranking && b.posicion_ranking) {
          return a.posicion_ranking - b.posicion_ranking
        }
        if (a.posicion_ranking) return -1
        if (b.posicion_ranking) return 1
        // Si ambos tienen posición null pero cumplen mínimo, ordenar por promedio_final
        return (b.promedio_final || 0) - (a.promedio_final || 0)
      }
      // Si solo uno cumple mínimo, el que cumple va primero
      if (a.cumple_minimo && !b.cumple_minimo) return -1
      if (!a.cumple_minimo && b.cumple_minimo) return 1
      // Si ninguno cumple mínimo, ordenar por promedio_final descendente
      return (b.promedio_final || 0) - (a.promedio_final || 0)
    })

    return rankingsCompletos
  } catch (error) {
    console.error('Error al obtener ranking completo:', error)
    throw error
  }
}

/**
 * Calcula la posición de un jugador en el ranking
 * @param {string} usuarioId - ID del usuario
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<number|null>} Posición en el ranking o null si no existe
 */
export async function calcularPosicionRanking(usuarioId, etapaId, divisionId) {
  try {
    const { data: ranking, error } = await supabase
      .from('circuito3gen_rankings')
      .select('posicion_ranking')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('usuario_id', usuarioId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No existe ranking para este jugador
        return null
      }
      throw error
    }

    return ranking?.posicion_ranking || null
  } catch (error) {
    console.error('Error al calcular posición de ranking:', error)
    throw error
  }
}

/**
 * Obtiene estadísticas completas de un jugador
 * @param {string} usuarioId - ID del usuario
 * @param {string} etapaId - ID de la etapa
 * @returns {Promise<Object>} Estadísticas del jugador
 */
export async function obtenerEstadisticasJugador(usuarioId, etapaId) {
  try {
    // Obtener todos los rankings del jugador en esta etapa
    const { data: rankings, error } = await supabase
      .from('circuito3gen_rankings')
      .select(`
        *,
        division:circuito3gen_divisiones (
          id,
          numero_division,
          nombre
        )
      `)
      .eq('etapa_id', etapaId)
      .eq('usuario_id', usuarioId)

    if (error) throw error

    // Obtener partidos del jugador
    const { data: partidos, error: errorPartidos } = await supabase
      .from('circuito3gen_partidos')
      .select('*')
      .eq('etapa_id', etapaId)
      .eq('estado', 'jugado')
      .or(`jugador_a1_id.eq.${usuarioId},jugador_a2_id.eq.${usuarioId},jugador_b1_id.eq.${usuarioId},jugador_b2_id.eq.${usuarioId}`)

    if (errorPartidos) throw errorPartidos

    return {
      rankings: rankings || [],
      partidos: partidos || [],
      totalPartidos: partidos?.length || 0
    }
  } catch (error) {
    console.error('Error al obtener estadísticas del jugador:', error)
    throw error
  }
}

/**
 * Calcula desempates entre dos jugadores
 * @param {Object} usuario1 - Datos del primer usuario
 * @param {Object} usuario2 - Datos del segundo usuario
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<number>} -1 si usuario1 va primero, 1 si usuario2 va primero, 0 si iguales
 */
export async function calcularDesempates(usuario1, usuario2, etapaId, divisionId) {
  try {
    // 1. Comparar promedio_final
    if (usuario1.promedio_final !== usuario2.promedio_final) {
      return usuario2.promedio_final - usuario1.promedio_final
    }

    // 2. Comparar diferencia_sets
    if (usuario1.diferencia_sets !== usuario2.diferencia_sets) {
      return usuario2.diferencia_sets - usuario1.diferencia_sets
    }

    // 3. Comparar diferencia_games
    if (usuario1.diferencia_games !== usuario2.diferencia_games) {
      return usuario2.diferencia_games - usuario1.diferencia_games
    }

    // 4. Comparar victorias_mejores_parejas
    if (usuario1.victorias_mejores_parejas !== usuario2.victorias_mejores_parejas) {
      return usuario2.victorias_mejores_parejas - usuario1.victorias_mejores_parejas
    }

    // Si todo es igual, retornar 0
    return 0
  } catch (error) {
    console.error('Error al calcular desempates:', error)
    throw error
  }
}

