/**
 * Funciones de cálculo de rankings para usar en el cliente (frontend)
 * Estas funciones son puras y no dependen de la base de datos
 */

import {
  calcularPromedioIndividual,
  calcularPromedioGeneral,
  calcularBonusPorJugar,
  calcularPromedioFinal,
  calcularMinimoRequerido,
  validarMinimoRequerido,
  calcularTodosLosPromedios
} from './promedios'

/**
 * Calcula las estadísticas de un jugador basado en sus partidos
 * @param {string} usuarioId - ID del usuario
 * @param {Array} partidosJugador - Array de partidos del jugador
 * @returns {Object} Estadísticas del jugador
 */
export function calcularEstadisticasJugador(usuarioId, partidosJugador) {
  let partidosGanados = 0
  let partidosJugados = partidosJugador?.length || 0
  let diferenciaSets = 0
  let diferenciaGames = 0

  partidosJugador?.forEach(partido => {
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

  return {
    partidosGanados,
    partidosJugados,
    diferenciaSets,
    diferenciaGames
  }
}

/**
 * Calcula victorias contra las mejores parejas (top 3 del ranking)
 * @param {string} usuarioId - ID del usuario
 * @param {Array} partidosJugador - Array de partidos del jugador
 * @param {Array} top3Rankings - Array con los top 3 jugadores del ranking (con usuario_id)
 * @returns {number} Cantidad de victorias contra mejores parejas
 */
export function calcularVictoriasMejoresParejas(usuarioId, partidosJugador, top3Rankings) {
  if (!top3Rankings || top3Rankings.length === 0) {
    return 0
  }

  const top3Ids = new Set(top3Rankings.map(r => r.usuario_id))
  let victorias = 0

  partidosJugador?.forEach(partido => {
    const esEquipoA = partido.jugador_a1_id === usuarioId || partido.jugador_a2_id === usuarioId
    const equipoGanador = partido.equipo_ganador

    // Verificar si el jugador ganó
    const gano = (equipoGanador === 'A' && esEquipoA) || (equipoGanador === 'B' && !esEquipoA)

    if (gano) {
      // Verificar si alguno de los oponentes está en el top 3
      const oponente1 = esEquipoA ? partido.jugador_b1_id : partido.jugador_a1_id
      const oponente2 = esEquipoA ? partido.jugador_b2_id : partido.jugador_a2_id

      if (top3Ids.has(oponente1) || top3Ids.has(oponente2)) {
        victorias++
      }
    }
  })

  return victorias
}

/**
 * Calcula el ranking completo de una división en el frontend
 * @param {Array} inscripciones - Array de inscripciones activas
 * @param {Array} partidos - Array de todos los partidos de la división
 * @param {number} partidosDivision - Total de partidos jugados en la división
 * @param {number} jugadoresInscriptos - Cantidad de jugadores inscriptos
 * @returns {Array} Array de rankings calculados y ordenados
 */
export function calcularRankingCompleto(inscripciones, partidos, partidosDivision, jugadoresInscriptos) {
  const minimoRequerido = calcularMinimoRequerido(partidosDivision, jugadoresInscriptos)
  
  // Primera pasada: calcular estadísticas básicas y promedios
  const rankings = inscripciones.map(inscripcion => {
    const usuarioId = inscripcion.usuario_id
    
    // Filtrar partidos del jugador
    const partidosJugador = partidos.filter(p => 
      p.jugador_a1_id === usuarioId || 
      p.jugador_a2_id === usuarioId || 
      p.jugador_b1_id === usuarioId || 
      p.jugador_b2_id === usuarioId
    )

    // Calcular estadísticas
    const estadisticas = calcularEstadisticasJugador(usuarioId, partidosJugador)

    // Calcular promedios
    const promedios = calcularTodosLosPromedios({
      partidosGanados: estadisticas.partidosGanados,
      partidosJugados: estadisticas.partidosJugados,
      partidosDivision,
      jugadoresInscriptos
    })

    return {
      usuario_id: usuarioId,
      usuario: inscripcion.usuario,
      partidos_ganados: estadisticas.partidosGanados,
      partidos_jugados: estadisticas.partidosJugados,
      diferencia_sets: estadisticas.diferenciaSets,
      diferencia_games: estadisticas.diferenciaGames,
      promedio_individual: promedios.promedioIndividual,
      promedio_general: promedios.promedioGeneral,
      bonus_por_jugar: promedios.bonusPorJugar,
      promedio_final: promedios.promedioFinal,
      minimo_requerido: minimoRequerido,
      cumple_minimo: promedios.cumpleMinimo,
      victorias_mejores_parejas: 0 // Se calculará en la segunda pasada
    }
  })

  // Ordenar por promedio final para obtener el top 3
  const rankingsOrdenados = [...rankings].sort((a, b) => {
    if (b.promedio_final !== a.promedio_final) {
      return b.promedio_final - a.promedio_final
    }
    if (b.diferencia_sets !== a.diferencia_sets) {
      return b.diferencia_sets - a.diferencia_sets
    }
    if (b.diferencia_games !== a.diferencia_games) {
      return b.diferencia_games - a.diferencia_games
    }
    return 0
  })

  const top3 = rankingsOrdenados.filter(r => r.cumple_minimo).slice(0, 3)

  // Segunda pasada: calcular victorias contra mejores parejas
  const rankingsConVictorias = rankings.map(ranking => {
    const partidosJugador = partidos.filter(p => 
      p.jugador_a1_id === ranking.usuario_id || 
      p.jugador_a2_id === ranking.usuario_id || 
      p.jugador_b1_id === ranking.usuario_id || 
      p.jugador_b2_id === ranking.usuario_id
    )

    const victoriasMejoresParejas = calcularVictoriasMejoresParejas(
      ranking.usuario_id,
      partidosJugador,
      top3
    )

    return {
      ...ranking,
      victorias_mejores_parejas: victoriasMejoresParejas
    }
  })

  // Tercera pasada: reordenar con victorias contra mejores parejas
  const rankingsFinales = rankingsConVictorias.sort((a, b) => {
    // Primero por promedio final
    if (b.promedio_final !== a.promedio_final) {
      return b.promedio_final - a.promedio_final
    }
    // Luego por diferencia de sets
    if (b.diferencia_sets !== a.diferencia_sets) {
      return b.diferencia_sets - a.diferencia_sets
    }
    // Luego por diferencia de games
    if (b.diferencia_games !== a.diferencia_games) {
      return b.diferencia_games - a.diferencia_games
    }
    // Finalmente por victorias contra mejores parejas
    if (b.victorias_mejores_parejas !== a.victorias_mejores_parejas) {
      return b.victorias_mejores_parejas - a.victorias_mejores_parejas
    }
    return 0
  })

  // Asignar posiciones solo a los que cumplen mínimo
  const rankingsConPosiciones = rankingsFinales.map((ranking, index) => {
    const posicion = ranking.cumple_minimo ? index + 1 : null
    
    return {
      ...ranking,
      posicion_ranking: posicion
    }
  })

  return rankingsConPosiciones
}

/**
 * Calcula los cupos de ascenso y descenso basado en la configuración
 * @param {Object} configuracion - Configuración de la etapa/división
 * @param {number} jugadoresInscriptos - Cantidad de jugadores inscriptos
 * @returns {Object} Objeto con cupos_ascenso y cupos_descenso
 */
export function calcularCuposAscensoDescensoClient(configuracion, jugadoresInscriptos) {
  const porcentaje = configuracion?.cupos_ascenso_porcentaje || 20
  const minimo = configuracion?.cupos_ascenso_minimo || 2
  const maximo = configuracion?.cupos_ascenso_maximo || 10

  // Calcular cupos: porcentaje de jugadores (min 2, max 10)
  const cuposCalculados = Math.round(jugadoresInscriptos * porcentaje / 100)
  const cuposFinales = Math.max(minimo, Math.min(maximo, cuposCalculados))

  return {
    cupos_ascenso: cuposFinales,
    cupos_descenso: cuposFinales
  }
}

/**
 * Identifica los jugadores que ascienden (solo los que cumplen mínimo)
 * @param {Array} rankings - Array de rankings ordenados
 * @param {number} cupos - Cantidad de cupos de ascenso
 * @returns {Array} Array de jugadores que ascienden
 */
export function identificarJugadoresAscensoClient(rankings, cupos) {
  // Filtrar solo jugadores que cumplen mínimo y ordenar
  const rankingsCumplenMinimo = rankings
    .filter(r => r.cumple_minimo)
    .sort((a, b) => {
      if (b.promedio_final !== a.promedio_final) return b.promedio_final - a.promedio_final
      if (b.diferencia_sets !== a.diferencia_sets) return b.diferencia_sets - a.diferencia_sets
      if (b.diferencia_games !== a.diferencia_games) return b.diferencia_games - a.diferencia_games
      if (b.victorias_mejores_parejas !== a.victorias_mejores_parejas) return b.victorias_mejores_parejas - a.victorias_mejores_parejas
      return 0
    })

  return rankingsCumplenMinimo.slice(0, cupos)
}

/**
 * Identifica los jugadores que descienden
 * IMPORTANTE: Incluye TODOS los jugadores, incluso los que no cumplen el mínimo
 * @param {Array} rankings - Array de rankings ordenados
 * @param {Array} jugadoresAscenso - Array de jugadores que ascienden
 * @param {number} cupos - Cantidad de cupos de descenso
 * @returns {Array} Array de jugadores que descienden
 */
export function identificarJugadoresDescensoClient(rankings, jugadoresAscenso, cupos) {
  const idsQueAscienden = new Set(jugadoresAscenso.map(j => j.usuario_id))

  // Ordenar todos los rankings (incluyendo los que no cumplen mínimo)
  // Primero los que cumplen mínimo, luego los que no
  const rankingsOrdenados = [...rankings].sort((a, b) => {
    // Primero por si cumple mínimo (los que cumplen primero)
    if (a.cumple_minimo !== b.cumple_minimo) {
      return b.cumple_minimo ? 1 : -1
    }
    // Luego por promedio final
    if (b.promedio_final !== a.promedio_final) return b.promedio_final - a.promedio_final
    // Luego por diferencia de sets
    if (b.diferencia_sets !== a.diferencia_sets) return b.diferencia_sets - a.diferencia_sets
    // Luego por diferencia de games
    if (b.diferencia_games !== a.diferencia_games) return b.diferencia_games - a.diferencia_games
    // Finalmente por victorias contra mejores parejas
    if (b.victorias_mejores_parejas !== a.victorias_mejores_parejas) return b.victorias_mejores_parejas - a.victorias_mejores_parejas
    return 0
  })

  // Filtrar jugadores que ascienden (estos no pueden descender)
  const rankingsFiltrados = rankingsOrdenados.filter(r => !idsQueAscienden.has(r.usuario_id))
  
  // Los descensos son los últimos 'cupos' jugadores de la tabla (los peores)
  // Esto incluye tanto jugadores que cumplen mínimo como los que no
  return rankingsFiltrados.slice(-cupos)
}

/**
 * Identifica los jugadores que van a playoff
 * Los repechajes SIEMPRE son 2, no por porcentaje ni configuración
 * @param {Array} rankings - Array de rankings ordenados
 * @param {Array} jugadoresAscenso - Array de jugadores que ascienden
 * @param {Array} jugadoresDescenso - Array de jugadores que descienden
 * @param {number} cuposAscenso - Cantidad de cupos de ascenso
 * @param {number} jugadoresPlayoff - Cantidad de jugadores para playoff (siempre 2, ignorado si se pasa otro valor)
 * @returns {Object} Objeto con jugadores para playoff de ascenso y descenso
 */
export function identificarJugadoresPlayoffClient(rankings, jugadoresAscenso, jugadoresDescenso, cuposAscenso, jugadoresPlayoff = 2) {
  // Los repechajes SIEMPRE son 2, no por porcentaje ni configuración
  jugadoresPlayoff = 2
  const idsQueAscienden = new Set(jugadoresAscenso.map(j => j.usuario_id))
  const idsQueDescienden = new Set(jugadoresDescenso.map(j => j.usuario_id))
  const idsExcluidosPlayoff = new Set([...idsQueAscienden, ...idsQueDescienden])

  // Contar total de jugadores que cumplen mínimo
  const totalJugadoresCumplenMinimo = rankings.filter(r => r.cumple_minimo).length

  // Jugadores para playoff de ascenso: los que están justo después de los que ascienden
  // Solo jugadores que cumplen mínimo
  let rankingsAscenso = []
  if (totalJugadoresCumplenMinimo > cuposAscenso) {
    const jugadoresDisponiblesParaPlayoff = totalJugadoresCumplenMinimo - cuposAscenso
    const jugadoresParaPlayoff = Math.min(jugadoresPlayoff, jugadoresDisponiblesParaPlayoff)
    
    if (jugadoresParaPlayoff > 0) {
      const rankingsCumplenMinimo = rankings
        .filter(r => r.cumple_minimo)
        .sort((a, b) => {
          if (b.promedio_final !== a.promedio_final) return b.promedio_final - a.promedio_final
          if (b.diferencia_sets !== a.diferencia_sets) return b.diferencia_sets - a.diferencia_sets
          if (b.diferencia_games !== a.diferencia_games) return b.diferencia_games - a.diferencia_games
          if (b.victorias_mejores_parejas !== a.victorias_mejores_parejas) return b.victorias_mejores_parejas - a.victorias_mejores_parejas
          return 0
        })

      rankingsAscenso = rankingsCumplenMinimo
        .slice(cuposAscenso, cuposAscenso + jugadoresParaPlayoff)
        .filter(r => !idsExcluidosPlayoff.has(r.usuario_id))
    }
  }

  // Jugadores para playoff de descenso: los que están justo antes de los que descienden
  // IMPORTANTE: Incluye TODOS los jugadores, incluso los que no cumplen el mínimo
  const rankingsOrdenados = [...rankings].sort((a, b) => {
    // Primero por si cumple mínimo (los que cumplen primero)
    if (a.cumple_minimo !== b.cumple_minimo) {
      return b.cumple_minimo ? 1 : -1
    }
    // Luego por promedio final
    if (b.promedio_final !== a.promedio_final) return b.promedio_final - a.promedio_final
    if (b.diferencia_sets !== a.diferencia_sets) return b.diferencia_sets - a.diferencia_sets
    if (b.diferencia_games !== a.diferencia_games) return b.diferencia_games - a.diferencia_games
    if (b.victorias_mejores_parejas !== a.victorias_mejores_parejas) return b.victorias_mejores_parejas - a.victorias_mejores_parejas
    return 0
  })

  // Filtrar jugadores que ascienden (estos no pueden estar en playoff de descenso)
  const rankingsSinAscensos = rankingsOrdenados.filter(r => !idsQueAscienden.has(r.usuario_id))
  
  const cuposDescenso = jugadoresDescenso.length
  let rankingsDescenso = []
  
  if (rankingsSinAscensos.length > cuposDescenso) {
    const totalSinAscensos = rankingsSinAscensos.length
    const inicioPlayoffDescenso = totalSinAscensos - cuposDescenso - jugadoresPlayoff
    const finPlayoffDescenso = totalSinAscensos - cuposDescenso - 1
    
    // Solo si hay espacio para playoff (inicio >= 0)
    if (inicioPlayoffDescenso >= 0 && finPlayoffDescenso >= inicioPlayoffDescenso) {
      // Tomar los jugadores que están justo antes de los que descienden
      rankingsDescenso = rankingsSinAscensos.slice(inicioPlayoffDescenso, finPlayoffDescenso + 1)
      
      // Filtrar jugadores que descienden (por si acaso)
      rankingsDescenso = rankingsDescenso.filter(r => !idsQueDescienden.has(r.usuario_id))
    }
  }

  return {
    playoff_ascenso: rankingsAscenso,
    playoff_descenso: rankingsDescenso
  }
}

