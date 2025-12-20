import { supabase } from '../supabase'
import { createClient } from '@supabase/supabase-js'

// Cliente con service role key para operaciones de servidor (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseServiceRole = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

/**
 * Calcula el promedio individual de un jugador
 * Fórmula: partidos_ganados / partidos_jugados
 * @param {number} partidosGanados - Cantidad de partidos ganados
 * @param {number} partidosJugados - Cantidad de partidos jugados
 * @returns {number} Promedio individual (0-1)
 */
export function calcularPromedioIndividual(partidosGanados, partidosJugados) {
  if (!partidosJugados || partidosJugados === 0) {
    return 0
  }
  
  const promedio = partidosGanados / partidosJugados
  // Redondear a 2 decimales
  return Math.round(promedio * 100) / 100
}

/**
 * Calcula el promedio general considerando todos los partidos de la división
 * Fórmula: partidos_ganados / partidos_division
 * @param {number} partidosGanados - Cantidad de partidos ganados por el jugador
 * @param {number} partidosJugados - Cantidad de partidos jugados por el jugador
 * @param {number} partidosDivision - Total de partidos jugados en la división
 * @returns {number} Promedio general (0-1)
 */
export function calcularPromedioGeneral(partidosGanados, partidosJugados, partidosDivision) {
  if (!partidosDivision || partidosDivision === 0) {
    return 0
  }
  
  const promedio = partidosGanados / partidosDivision
  // Redondear a 2 decimales
  return Math.round(promedio * 100) / 100
}

/**
 * Calcula el bonus por jugar (incentivo por cumplir mínimo de partidos)
 * Fórmula: Si partidos_jugados >= minimo_requerido, bonus = 0.1, sino 0
 * @param {number} partidosJugados - Cantidad de partidos jugados por el jugador
 * @param {number} partidosDivision - Total de partidos jugados en la división
 * @param {number} jugadoresInscriptos - Cantidad de jugadores inscriptos en la división
 * @returns {number} Bonus por jugar (0 o 0.1)
 */
export function calcularBonusPorJugar(partidosJugados, partidosDivision, jugadoresInscriptos) {
  const minimoRequerido = calcularMinimoRequerido(partidosDivision, jugadoresInscriptos)
  
  if (partidosJugados >= minimoRequerido) {
    return 0.1
  }
  
  return 0
}

/**
 * Calcula el promedio final usado para el ranking
 * Fórmula: (promedio_individual * 0.7) + (promedio_general * 0.2) + bonus_por_jugar
 * @param {number} promedioIndividual - Promedio individual del jugador
 * @param {number} promedioGeneral - Promedio general del jugador
 * @param {number} bonus - Bonus por jugar (0 o 0.1)
 * @returns {number} Promedio final (0-1)
 */
export function calcularPromedioFinal(promedioIndividual, promedioGeneral, bonus) {
  const promedio = (promedioIndividual * 0.7) + (promedioGeneral * 0.2) + bonus
  // Asegurar que no exceda 1
  const promedioFinal = Math.min(promedio, 1)
  // Redondear a 2 decimales
  return Math.round(promedioFinal * 100) / 100
}

/**
 * Calcula el mínimo requerido de partidos para una división
 * Fórmula: PARTIDOS_JUGADOS_DIVISION / (CANTIDAD_JUGADORES_INSCRIPTOS / 2)
 * @param {number} partidosDivision - Total de partidos jugados en la división
 * @param {number} jugadoresInscriptos - Cantidad de jugadores inscriptos en la división
 * @returns {number} Mínimo requerido de partidos
 */
export function calcularMinimoRequerido(partidosDivision, jugadoresInscriptos) {
  if (!jugadoresInscriptos || jugadoresInscriptos === 0) {
    return 0
  }
  
  const minimo = partidosDivision / (jugadoresInscriptos / 2)
  // Redondear hacia arriba
  return Math.ceil(minimo)
}

/**
 * Valida si un jugador cumple con el mínimo requerido de partidos
 * @param {number} partidosJugados - Cantidad de partidos jugados por el jugador
 * @param {number} minimoRequerido - Mínimo requerido de partidos
 * @returns {boolean} true si cumple el mínimo, false en caso contrario
 */
export function validarMinimoRequerido(partidosJugados, minimoRequerido) {
  return partidosJugados >= minimoRequerido
}

/**
 * Obtiene el mínimo requerido de una división desde la base de datos
 * @param {string} etapaId - ID de la etapa
 * @param {string} divisionId - ID de la división
 * @returns {Promise<number>} Mínimo requerido
 */
export async function obtenerMinimoRequerido(etapaId, divisionId) {
  try {
    // Usar service role para bypass RLS si está disponible, sino usar cliente normal
    const client = supabaseServiceRole || supabase
    
    // Contar partidos jugados en la división
    const { count: partidosDivision, error: errorPartidos } = await client
      .from('circuitooka_partidos')
      .select('*', { count: 'exact', head: true })
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('estado', 'jugado')

    if (errorPartidos) throw errorPartidos

    // Contar jugadores inscriptos en la división
    const { count: jugadoresInscriptos, error: errorInscripciones } = await client
      .from('circuitooka_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('estado', 'activa')

    if (errorInscripciones) throw errorInscripciones

    return calcularMinimoRequerido(partidosDivision || 0, jugadoresInscriptos || 0)
  } catch (error) {
    console.error('Error al obtener mínimo requerido:', error)
    return 0
  }
}

/**
 * Calcula todos los promedios de un jugador
 * @param {Object} datosJugador - Datos del jugador
 * @param {number} datosJugador.partidosGanados - Partidos ganados
 * @param {number} datosJugador.partidosJugados - Partidos jugados
 * @param {number} datosJugador.partidosDivision - Total de partidos en la división
 * @param {number} datosJugador.jugadoresInscriptos - Jugadores inscriptos en la división
 * @returns {Object} Objeto con todos los promedios calculados
 */
export function calcularTodosLosPromedios(datosJugador) {
  const {
    partidosGanados = 0,
    partidosJugados = 0,
    partidosDivision = 0,
    jugadoresInscriptos = 0
  } = datosJugador

  const promedioIndividual = calcularPromedioIndividual(partidosGanados, partidosJugados)
  const promedioGeneral = calcularPromedioGeneral(partidosGanados, partidosJugados, partidosDivision)
  const minimoRequerido = calcularMinimoRequerido(partidosDivision, jugadoresInscriptos)
  const bonus = calcularBonusPorJugar(partidosJugados, partidosDivision, jugadoresInscriptos)
  const promedioFinal = calcularPromedioFinal(promedioIndividual, promedioGeneral, bonus)
  const cumpleMinimo = validarMinimoRequerido(partidosJugados, minimoRequerido)

  return {
    promedioIndividual,
    promedioGeneral,
    bonusPorJugar: bonus,
    promedioFinal,
    minimoRequerido,
    cumpleMinimo,
    partidosGanados,
    partidosJugados
  }
}


