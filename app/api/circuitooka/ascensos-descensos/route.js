import { NextResponse } from 'next/server'
import { verificarAdmin } from '@/lib/circuitooka/auth'
import {
  calcularCuposAscensoDescenso,
  identificarJugadoresAscenso,
  identificarJugadoresDescenso,
  identificarJugadoresPlayoff,
  procesarAscensosDescensos
} from '@/lib/circuitooka/ascensos-descensos'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Obtener ascensos/descensos de una etapa
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const etapaId = searchParams.get('etapa_id')
    const divisionId = searchParams.get('division_id')
    const tipo = searchParams.get('tipo') // 'ascenso' o 'descenso'

    if (!etapaId) {
      return NextResponse.json(
        { success: false, error: 'etapa_id es requerido' },
        { status: 400 }
      )
    }

    if (divisionId) {
      // Obtener cupos y jugadores para una división específica
      const cupos = await calcularCuposAscensoDescenso(etapaId, divisionId)

      let jugadoresAscenso = []
      let jugadoresDescenso = []
      let jugadoresPlayoff = null

      if (tipo === 'ascenso' || !tipo) {
        jugadoresAscenso = await identificarJugadoresAscenso(
          etapaId,
          divisionId,
          cupos.cupos_ascenso
        )
      }

      if (tipo === 'descenso' || !tipo) {
        jugadoresDescenso = await identificarJugadoresDescenso(
          etapaId,
          divisionId,
          cupos.cupos_descenso
        )
      }

      // Validar que no haya jugadores duplicados entre ascenso y descenso
      // Un jugador no puede ascender y descender al mismo tiempo
      if (jugadoresAscenso.length > 0 && jugadoresDescenso.length > 0) {
        const idsAscenso = new Set(jugadoresAscenso.map(j => j.usuario_id))
        const idsDescenso = new Set(jugadoresDescenso.map(j => j.usuario_id))
        
        // Filtrar jugadores que aparecen en ambas listas (no debería pasar, pero por seguridad)
        jugadoresAscenso = jugadoresAscenso.filter(j => !idsDescenso.has(j.usuario_id))
        jugadoresDescenso = jugadoresDescenso.filter(j => !idsAscenso.has(j.usuario_id))
      }

      if (!tipo) {
        jugadoresPlayoff = await identificarJugadoresPlayoff(etapaId, divisionId)
      }

      return NextResponse.json({
        success: true,
        data: {
          cupos,
          jugadores_ascenso: jugadoresAscenso,
          jugadores_descenso: jugadoresDescenso,
          jugadores_playoff: jugadoresPlayoff
        }
      })
    }

    // Obtener todos los ascensos/descensos de la etapa
    const { data: ascensosDescensos, error } = await supabase
      .from('circuitooka_ascensos_descensos')
      .select(`
        *,
        usuario:usuarios (
          id,
          nombre,
          apellido
        ),
        division_origen:circuitooka_divisiones!circuitooka_ascensos_descensos_division_origen_id_fkey (
          id,
          numero_division,
          nombre
        ),
        division_destino:circuitooka_divisiones!circuitooka_ascensos_descensos_division_destino_id_fkey (
          id,
          numero_division,
          nombre
        )
      `)
      .eq('etapa_id', etapaId)
      .order('fecha_movimiento', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: ascensosDescensos || [] })
  } catch (error) {
    console.error('Error en GET ascensos-descensos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Procesar ascensos/descensos al finalizar etapa (solo admin)
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
    const { etapa_id } = body

    if (!etapa_id) {
      return NextResponse.json(
        { success: false, error: 'etapa_id es requerido' },
        { status: 400 }
      )
    }

    // Procesar ascensos y descensos
    const cambios = await procesarAscensosDescensos(etapa_id)

    return NextResponse.json({
      success: true,
      message: 'Ascensos y descensos procesados correctamente',
      data: cambios
    })
  } catch (error) {
    console.error('Error en POST ascensos-descensos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


