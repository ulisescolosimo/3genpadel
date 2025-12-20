import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Calcula los cupos de ascenso y descenso para una división
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<Object>} Objeto con cupos_ascenso y cupos_descenso
 */
export async function calcularCuposAscensoDescenso(etapaId, divisionId) {
  try {
    // Obtener configuración de la etapa
    const { data: configuracion, error: errorConfig } = await supabase
      .from('circuitooka_configuracion')
      .select('*')
      .eq('etapa_id', etapaId)
      .single()

    if (errorConfig && errorConfig.code !== 'PGRST116') throw errorConfig

    const porcentaje = configuracion?.cupos_ascenso_porcentaje || 20
    const minimo = configuracion?.cupos_ascenso_minimo || 2
    const maximo = configuracion?.cupos_ascenso_maximo || 10

    // Contar jugadores inscriptos en la división
    const { count: jugadoresInscriptos, error: errorInscripciones } = await supabase
      .from('circuitooka_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('estado', 'activa')

    if (errorInscripciones) throw errorInscripciones

    // Calcular cupos: porcentaje de jugadores (min 2, max 10)
    const cuposCalculados = Math.round((jugadoresInscriptos || 0) * porcentaje / 100)
    const cuposFinales = Math.max(minimo, Math.min(maximo, cuposCalculados))

    return {
      cupos_ascenso: cuposFinales,
      cupos_descenso: cuposFinales,
      jugadores_inscriptos: jugadoresInscriptos || 0
    }
  } catch (error) {
    console.error('Error al calcular cupos de ascenso/descenso:', error)
    throw error
  }
}

/**
 * Identifica los jugadores que ascienden de una división
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @param {number} cupos - Cantidad de cupos de ascenso
 * @returns {Promise<Array>} Array de jugadores que ascienden
 */
export async function identificarJugadoresAscenso(etapaId, divisionId, cupos) {
  try {
    // Obtener rankings ordenados (mejores primero)
    const { data: rankings, error } = await supabase
      .from('circuitooka_rankings')
      .select(`
        *,
        usuario:usuarios (
          id,
          nombre,
          apellido
        )
      `)
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('cumple_minimo', true) // Solo jugadores que cumplen mínimo
      .order('promedio_final', { ascending: false })
      .order('diferencia_sets', { ascending: false })
      .order('diferencia_games', { ascending: false })
      .order('victorias_mejores_parejas', { ascending: false })
      .limit(cupos)

    if (error) throw error

    return rankings || []
  } catch (error) {
    console.error('Error al identificar jugadores de ascenso:', error)
    throw error
  }
}

/**
 * Identifica los jugadores que descienden de una división
 * Los descensos son los últimos N jugadores de la tabla (peores posiciones)
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @param {number} cupos - Cantidad de cupos de descenso
 * @returns {Promise<Array>} Array de jugadores que descienden
 */
export async function identificarJugadoresDescenso(etapaId, divisionId, cupos) {
  try {
    // Obtener IDs de jugadores que ascienden para excluirlos del descenso
    const { cupos_ascenso } = await calcularCuposAscensoDescenso(etapaId, divisionId)
    const jugadoresQueAscienden = await identificarJugadoresAscenso(etapaId, divisionId, cupos_ascenso)
    const idsQueAscienden = new Set(jugadoresQueAscienden.map(j => j.usuario_id))

    // Obtener TODOS los rankings ordenados de mejor a peor (descendente)
    // Esto nos da la tabla completa desde arriba (mejores) hasta abajo (peores)
    const { data: rankings, error } = await supabase
      .from('circuitooka_rankings')
      .select(`
        *,
        usuario:usuarios (
          id,
          nombre,
          apellido
        )
      `)
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .order('promedio_final', { ascending: false })
      .order('diferencia_sets', { ascending: false })
      .order('diferencia_games', { ascending: false })
      .order('victorias_mejores_parejas', { ascending: false })

    if (error) throw error

    // Filtrar jugadores que ascienden (estos no pueden descender)
    const rankingsFiltrados = (rankings || []).filter(r => !idsQueAscienden.has(r.usuario_id))
    
    // Los descensos son los últimos 'cupos' jugadores de la tabla (los peores)
    // Tomar desde el final hacia atrás
    return rankingsFiltrados.slice(-cupos)
  } catch (error) {
    console.error('Error al identificar jugadores de descenso:', error)
    throw error
  }
}

/**
 * Identifica los jugadores que van a playoff
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<Object>} Objeto con jugadores para playoff de ascenso y descenso
 */
export async function identificarJugadoresPlayoff(etapaId, divisionId) {
  try {
    // Primero intentar obtener configuración específica de la división
    let configuracion = null
    
    // Buscar configuración específica por división
    const { data: configDivision, error: errorConfigDivision } = await supabase
      .from('circuitooka_configuracion')
      .select('jugadores_playoff_por_division')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .maybeSingle()

    if (errorConfigDivision && errorConfigDivision.code !== 'PGRST116') {
      console.warn('Error buscando configuración por división:', errorConfigDivision)
    } else if (configDivision) {
      configuracion = configDivision
    }

    // Si no hay configuración específica por división, buscar configuración general de la etapa
    if (!configuracion) {
      const { data: configEtapa, error: errorConfigEtapa } = await supabase
        .from('circuitooka_configuracion')
        .select('jugadores_playoff_por_division')
        .eq('etapa_id', etapaId)
        .is('division_id', null)
        .maybeSingle()

      if (errorConfigEtapa && errorConfigEtapa.code !== 'PGRST116') {
        console.warn('Error buscando configuración por etapa:', errorConfigEtapa)
      } else if (configEtapa) {
        configuracion = configEtapa
      }
    }

    const jugadoresPlayoff = configuracion?.jugadores_playoff_por_division || 4

    // Obtener cupos
    const { cupos_ascenso, cupos_descenso } = await calcularCuposAscensoDescenso(etapaId, divisionId)

    // Contar total de jugadores que cumplen mínimo
    const { count: totalJugadoresCumplenMinimo, error: errorCountMinimo } = await supabase
      .from('circuitooka_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('cumple_minimo', true)

    if (errorCountMinimo) throw errorCountMinimo

    // Obtener IDs de jugadores que ascienden para excluirlos del playoff
    const jugadoresQueAscienden = await identificarJugadoresAscenso(etapaId, divisionId, cupos_ascenso)
    const idsQueAscienden = new Set(jugadoresQueAscienden.map(j => j.usuario_id))

    // Obtener IDs de jugadores que descienden para excluirlos del playoff
    const jugadoresQueDescienden = await identificarJugadoresDescenso(etapaId, divisionId, cupos_descenso)
    const idsQueDescienden = new Set(jugadoresQueDescienden.map(j => j.usuario_id))

    // Combinar ambos sets para excluir del playoff
    const idsExcluidosPlayoff = new Set([...idsQueAscienden, ...idsQueDescienden])

    // Jugadores para playoff de ascenso: los que están justo después de los que ascienden
    // Solo si hay suficientes jugadores después de los que ascienden
    let rankingsAscenso = []
    if (totalJugadoresCumplenMinimo > cupos_ascenso) {
      const jugadoresDisponiblesParaPlayoff = totalJugadoresCumplenMinimo - cupos_ascenso
      const jugadoresParaPlayoff = Math.min(jugadoresPlayoff, jugadoresDisponiblesParaPlayoff)
      
      if (jugadoresParaPlayoff > 0) {
        const { data: rankings, error: errorAscenso } = await supabase
          .from('circuitooka_rankings')
          .select(`
            *,
            usuario:usuarios (
              id,
              nombre,
              apellido
            )
          `)
          .eq('etapa_id', etapaId)
          .eq('division_id', divisionId)
          .eq('cumple_minimo', true)
          .order('promedio_final', { ascending: false })
          .order('diferencia_sets', { ascending: false })
          .order('diferencia_games', { ascending: false })
          .order('victorias_mejores_parejas', { ascending: false })
          .range(cupos_ascenso, cupos_ascenso + jugadoresParaPlayoff - 1)

        if (errorAscenso) throw errorAscenso
        
        // Filtrar jugadores que ascienden o descienden
        rankingsAscenso = (rankings || []).filter(r => !idsExcluidosPlayoff.has(r.usuario_id))
      }
    }

    // Jugadores para playoff de descenso: los que están justo antes de los que descienden
    // Obtener todos los rankings ordenados de mejor a peor (igual que para descensos)
    const { data: todosRankings, error: errorTodosRankings } = await supabase
      .from('circuitooka_rankings')
      .select(`
        *,
        usuario:usuarios (
          id,
          nombre,
          apellido
        )
      `)
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .order('promedio_final', { ascending: false })
      .order('diferencia_sets', { ascending: false })
      .order('diferencia_games', { ascending: false })
      .order('victorias_mejores_parejas', { ascending: false })

    if (errorTodosRankings) throw errorTodosRankings

    // Filtrar jugadores que ascienden (estos no pueden estar en playoff de descenso)
    const rankingsSinAscensos = (todosRankings || []).filter(r => !idsQueAscienden.has(r.usuario_id))
    
    // Los que descienden son los últimos cupos_descenso jugadores
    // Los de playoff de descenso son los jugadores_playoff justo ANTES de los que descienden
    // Ejemplo: 20 jugadores (sin contar los que ascienden), 4 descienden, 4 en playoff
    // Descienden: últimos 4 (posiciones 17-20 desde abajo)
    // Playoff descenso: los 4 antes de esos (posiciones 13-16 desde abajo, pero contando desde arriba sería length-8 a length-5)
    let rankingsDescenso = []
    if (rankingsSinAscensos.length > cupos_descenso) {
      const totalSinAscensos = rankingsSinAscensos.length
      const inicioPlayoffDescenso = totalSinAscensos - cupos_descenso - jugadoresPlayoff
      const finPlayoffDescenso = totalSinAscensos - cupos_descenso - 1
      
      // Solo si hay espacio para playoff (inicio >= 0)
      if (inicioPlayoffDescenso >= 0 && finPlayoffDescenso >= inicioPlayoffDescenso) {
        // Tomar los jugadores que están justo antes de los que descienden
        rankingsDescenso = rankingsSinAscensos.slice(inicioPlayoffDescenso, finPlayoffDescenso + 1)
        
        // Filtrar jugadores que descienden (por si acaso)
        const idsQueDescienden = new Set(jugadoresQueDescienden.map(j => j.usuario_id))
        rankingsDescenso = rankingsDescenso.filter(r => !idsQueDescienden.has(r.usuario_id))
      }
    }

    return {
      playoff_ascenso: rankingsAscenso,
      playoff_descenso: rankingsDescenso
    }
  } catch (error) {
    console.error('Error al identificar jugadores para playoff:', error)
    throw error
  }
}

/**
 * Procesa los ascensos y descensos al finalizar una etapa
 * @param {string} etapaId - ID de la etapa
 * @returns {Promise<Object>} Resumen de cambios aplicados
 */
export async function procesarAscensosDescensos(etapaId) {
  try {
    // Obtener todas las divisiones
    const { data: divisiones, error: errorDivisiones } = await supabase
      .from('circuitooka_divisiones')
      .select('*')
      .order('numero_division', { ascending: true })

    if (errorDivisiones) throw errorDivisiones

    const cambios = {
      ascensos: [],
      descensos: [],
      playoffs: []
    }

    // Procesar cada división (excepto la última que no tiene descensos)
    for (let i = 0; i < divisiones.length; i++) {
      const divisionActual = divisiones[i]
      const { cupos_ascenso, cupos_descenso } = await calcularCuposAscensoDescenso(
        etapaId,
        divisionActual.id
      )

      // Identificar jugadores que ascienden (excepto división 1)
      if (divisionActual.numero_division > 1) {
        const jugadoresAscenso = await identificarJugadoresAscenso(
          etapaId,
          divisionActual.id,
          cupos_ascenso
        )

        // Identificar jugadores que descienden de la división superior
        const divisionSuperior = divisiones[i - 1]
        const jugadoresDescenso = await identificarJugadoresDescenso(
          etapaId,
          divisionSuperior.id,
          cupos_descenso
        )

        // Aplicar cambios
        for (const jugador of jugadoresAscenso) {
          await aplicarCambioDivision(
            jugador.usuario_id,
            divisionActual.id,
            divisionSuperior.id,
            'ascenso',
            etapaId,
            jugador.promedio_final,
            jugador.posicion_ranking
          )
          cambios.ascensos.push({
            jugador: jugador.usuario,
            division_origen: divisionActual.numero_division,
            division_destino: divisionSuperior.numero_division
          })
        }

        for (const jugador of jugadoresDescenso) {
          await aplicarCambioDivision(
            jugador.usuario_id,
            divisionSuperior.id,
            divisionActual.id,
            'descenso',
            etapaId,
            jugador.promedio_final,
            jugador.posicion_ranking
          )
          cambios.descensos.push({
            jugador: jugador.usuario,
            division_origen: divisionSuperior.numero_division,
            division_destino: divisionActual.numero_division
          })
        }

        // Identificar jugadores para playoff
        const jugadoresPlayoff = await identificarJugadoresPlayoff(
          etapaId,
          divisionActual.id
        )
        cambios.playoffs.push({
          division: divisionActual.numero_division,
          ...jugadoresPlayoff
        })
      }
    }

    return cambios
  } catch (error) {
    console.error('Error al procesar ascensos y descensos:', error)
    throw error
  }
}

/**
 * Aplica un cambio de división a un jugador
 * @param {string} usuarioId - ID del usuario
 * @param {string} divisionOrigenId - ID de la división origen
 * @param {string} divisionDestinoId - ID de la división destino
 * @param {string} tipo - 'ascenso' o 'descenso'
 * @param {string} etapaId - ID de la etapa
 * @param {number} promedioFinal - Promedio final del jugador
 * @param {number} posicionOrigen - Posición en la división origen
 * @returns {Promise<Object>} Registro de cambio creado
 */
export async function aplicarCambioDivision(
  usuarioId,
  divisionOrigenId,
  divisionDestinoId,
  tipo,
  etapaId,
  promedioFinal,
  posicionOrigen
) {
  try {
    // Registrar el cambio en la tabla de ascensos/descensos
    const { data: cambio, error: errorCambio } = await supabase
      .from('circuitooka_ascensos_descensos')
      .insert({
        etapa_id: etapaId,
        usuario_id: usuarioId,
        division_origen_id: divisionOrigenId,
        division_destino_id: divisionDestinoId,
        tipo_movimiento: tipo,
        promedio_final: promedioFinal,
        posicion_origen: posicionOrigen,
        motivo: 'automatico'
      })
      .select()
      .single()

    if (errorCambio) throw errorCambio

    // Actualizar la inscripción del jugador para la próxima etapa
    // Nota: Esto se hará cuando se cree la nueva etapa
    // Por ahora solo registramos el cambio

    return cambio
  } catch (error) {
    console.error('Error al aplicar cambio de división:', error)
    throw error
  }
}


