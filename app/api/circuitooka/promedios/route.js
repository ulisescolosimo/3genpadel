import { NextResponse } from 'next/server'
import { verificarAdmin } from '@/lib/circuitooka/auth'
import { obtenerMinimoRequerido, calcularTodosLosPromedios } from '@/lib/circuitooka/promedios'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Obtener promedio de un jugador o mínimo requerido
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const etapaId = searchParams.get('etapa_id')
    const divisionId = searchParams.get('division_id')
    const usuarioId = searchParams.get('usuario_id')
    const tipo = searchParams.get('tipo') // 'jugador' o 'minimo'

    if (!etapaId || !divisionId) {
      return NextResponse.json(
        { success: false, error: 'etapa_id y division_id son requeridos' },
        { status: 400 }
      )
    }

    if (tipo === 'minimo' || searchParams.get('minimo') === 'true') {
      // Obtener mínimo requerido
      const minimo = await obtenerMinimoRequerido(etapaId, divisionId)
      return NextResponse.json({ success: true, data: { minimo_requerido: minimo } })
    }

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'usuario_id es requerido para obtener promedio de jugador' },
        { status: 400 }
      )
    }

    // Obtener ranking del jugador
    const { data: ranking, error } = await supabase
      .from('circuitooka_rankings')
      .select('*')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('usuario_id', usuarioId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!ranking) {
      return NextResponse.json({
        success: true,
        data: {
          promedio_individual: 0,
          promedio_general: 0,
          bonus_por_jugar: 0,
          promedio_final: 0,
          minimo_requerido: 0,
          cumple_minimo: false,
          partidos_ganados: 0,
          partidos_jugados: 0
        }
      })
    }

    return NextResponse.json({ success: true, data: ranking })
  } catch (error) {
    console.error('Error en GET promedios:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Recalcular promedios de una división (solo admin)
export async function POST(request) {
  try {
    const esAdminUser = await verificarAdmin(request)
    if (!esAdminUser) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { etapa_id, division_id } = body

    if (!etapa_id || !division_id) {
      return NextResponse.json(
        { success: false, error: 'etapa_id y division_id son requeridos' },
        { status: 400 }
      )
    }

    // Obtener todos los jugadores inscriptos
    const { data: inscripciones, error: errorInscripciones } = await supabase
      .from('circuitooka_inscripciones')
      .select('usuario_id')
      .eq('etapa_id', etapa_id)
      .eq('division_id', division_id)
      .eq('estado', 'activa')

    if (errorInscripciones) throw errorInscripciones

    // Obtener totales de la división
    const { count: partidosDivision } = await supabase
      .from('circuitooka_partidos')
      .select('*', { count: 'exact', head: true })
      .eq('etapa_id', etapa_id)
      .eq('division_id', division_id)
      .eq('estado', 'jugado')

    const jugadoresInscriptos = inscripciones?.length || 0

    // Recalcular promedios para cada jugador
    const resultados = []
    for (const inscripcion of inscripciones || []) {
      try {
        // Obtener partidos del jugador
        const { data: partidosJugador } = await supabase
          .from('circuitooka_partidos')
          .select('*')
          .eq('etapa_id', etapa_id)
          .eq('division_id', division_id)
          .eq('estado', 'jugado')
          .or(`jugador_a1_id.eq.${inscripcion.usuario_id},jugador_a2_id.eq.${inscripcion.usuario_id},jugador_b1_id.eq.${inscripcion.usuario_id},jugador_b2_id.eq.${inscripcion.usuario_id}`)

        let partidosGanados = 0
        const partidosJugados = partidosJugador?.length || 0

        partidosJugador?.forEach(partido => {
          const esEquipoA = partido.jugador_a1_id === inscripcion.usuario_id || 
                           partido.jugador_a2_id === inscripcion.usuario_id
          const equipoGanador = partido.equipo_ganador

          if ((equipoGanador === 'A' && esEquipoA) || (equipoGanador === 'B' && !esEquipoA)) {
            partidosGanados++
          }
        })

        const promedios = calcularTodosLosPromedios({
          partidosGanados,
          partidosJugados,
          partidosDivision: partidosDivision || 0,
          jugadoresInscriptos
        })

        resultados.push({
          usuario_id: inscripcion.usuario_id,
          ...promedios
        })
      } catch (error) {
        console.error(`Error al recalcular promedio de ${inscripcion.usuario_id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Promedios recalculados para ${resultados.length} jugadores`,
      data: resultados
    })
  } catch (error) {
    console.error('Error en POST promedios:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


