import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verificarAdmin } from '@/lib/circuitooka/auth'
import { actualizarRankingJugador, obtenerRankingCompleto, recalcularPosicionesRanking } from '@/lib/circuitooka/rankings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Obtener ranking completo de una división o ranking de un jugador específico
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const etapaId = searchParams.get('etapa_id')
    const divisionId = searchParams.get('division_id')
    const usuarioId = searchParams.get('usuario_id')

    if (!etapaId || !divisionId) {
      return NextResponse.json(
        { success: false, error: 'etapa_id y division_id son requeridos' },
        { status: 400 }
      )
    }

    if (usuarioId) {
      // Obtener ranking de un jugador específico
      const { data, error } = await supabase
        .from('circuitooka_rankings')
        .select(`
          *,
          usuario:usuarios (
            id,
            nombre,
            apellido,
            email
          ),
          division:circuitooka_divisiones (
            id,
            numero_division,
            nombre
          )
        `)
        .eq('etapa_id', etapaId)
        .eq('division_id', divisionId)
        .eq('usuario_id', usuarioId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return NextResponse.json({ success: true, data: data || null })
    }

    // Obtener ranking completo de la división
    const ranking = await obtenerRankingCompleto(etapaId, divisionId)

    return NextResponse.json({ success: true, data: ranking })
  } catch (error) {
    console.error('Error en GET rankings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Recalcular ranking (solo admin)
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
    const { etapa_id, division_id, usuario_id } = body

    if (!etapa_id || !division_id) {
      return NextResponse.json(
        { success: false, error: 'etapa_id y division_id son requeridos' },
        { status: 400 }
      )
    }

    if (usuario_id) {
      // Recalcular ranking de un jugador específico
      const ranking = await actualizarRankingJugador(usuario_id, etapa_id, division_id)
      return NextResponse.json({ success: true, data: ranking })
    }

    // Recalcular todos los rankings de la división
    const { data: inscripciones, error: errorInscripciones } = await supabase
      .from('circuitooka_inscripciones')
      .select('usuario_id')
      .eq('etapa_id', etapa_id)
      .eq('division_id', division_id)
      .eq('estado', 'activa')

    if (errorInscripciones) throw errorInscripciones

    const rankings = []
    for (const inscripcion of inscripciones || []) {
      try {
        const ranking = await actualizarRankingJugador(
          inscripcion.usuario_id,
          etapa_id,
          division_id
        )
        rankings.push(ranking)
      } catch (error) {
        console.error(`Error al recalcular ranking de ${inscripcion.usuario_id}:`, error)
      }
    }

    // Recalcular posiciones
    await recalcularPosicionesRanking(etapa_id, division_id)

    return NextResponse.json({
      success: true,
      message: `Rankings recalculados: ${rankings.length} jugadores`,
      data: rankings
    })
  } catch (error) {
    console.error('Error en POST rankings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}




















