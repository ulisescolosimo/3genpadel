import { NextResponse } from 'next/server'
import { verificarAdmin } from '@/lib/circuito3gen/auth'
import { ejecutarSorteoCompleto, ejecutarSorteoUnPartido, sortearPartidos, formarParejasDisponibles } from '@/lib/circuito3gen/sorteos'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Obtener resultados de sorteo
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const etapaId = searchParams.get('etapa_id')
    const divisionId = searchParams.get('division_id')
    const fechaPartido = searchParams.get('fecha_partido')

    if (!etapaId || !divisionId || !fechaPartido) {
      return NextResponse.json(
        { success: false, error: 'etapa_id, division_id y fecha_partido son requeridos' },
        { status: 400 }
      )
    }

    // Obtener parejas y partidos para esta fecha
    const { data: parejas, error: errorParejas } = await supabase
      .from('circuito3gen_parejas')
      .select(`
        *,
        jugador_1:usuarios!circuito3gen_parejas_jugador_1_id_fkey (
          id,
          nombre,
          apellido
        ),
        jugador_2:usuarios!circuito3gen_parejas_jugador_2_id_fkey (
          id,
          nombre,
          apellido
        )
      `)
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('fecha_partido', fechaPartido)

    if (errorParejas) throw errorParejas

    const { data: partidos, error: errorPartidos } = await supabase
      .from('circuito3gen_partidos')
      .select('*')
      .eq('etapa_id', etapaId)
      .eq('division_id', divisionId)
      .eq('fecha_partido', fechaPartido)

    if (errorPartidos) throw errorPartidos

    return NextResponse.json({
      success: true,
      data: {
        parejas: parejas || [],
        partidos: partidos || [],
        totalParejas: parejas?.length || 0,
        totalPartidos: partidos?.length || 0
      }
    })
  } catch (error) {
    console.error('Error en GET sorteos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Ejecutar sorteo de partidos para una fecha (opcional, solo admin)
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
    const { etapa_id, division_id, fecha_partido, jugadores_disponibles = [], un_partido = false } = body

    if (!etapa_id || !division_id || !fecha_partido) {
      return NextResponse.json(
        { success: false, error: 'etapa_id, division_id y fecha_partido son requeridos' },
        { status: 400 }
      )
    }

    if (!jugadores_disponibles || jugadores_disponibles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe proporcionar al menos un jugador disponible' },
        { status: 400 }
      )
    }

    // Ejecutar sorteo: un partido a la vez o sorteo completo
    const resultado = un_partido
      ? await ejecutarSorteoUnPartido(
          etapa_id,
          division_id,
          fecha_partido,
          jugadores_disponibles
        )
      : await ejecutarSorteoCompleto(
          etapa_id,
          division_id,
          fecha_partido,
          jugadores_disponibles
        )

    // Guardar parejas en la base de datos
    if (resultado.parejas && resultado.parejas.length > 0) {
      const parejasParaInsertar = resultado.parejas.map(pareja => ({
        etapa_id,
        division_id,
        fecha_partido,
        jugador_1_id: pareja.jugador_1_id,
        jugador_2_id: pareja.jugador_2_id,
        tipo_formacion: pareja.tipo_formacion,
        estado: 'confirmada'
      }))

      const { error: errorParejas } = await supabase
        .from('circuito3gen_parejas')
        .upsert(parejasParaInsertar, {
          onConflict: 'etapa_id,division_id,fecha_partido,jugador_1_id,jugador_2_id'
        })

      if (errorParejas) {
        console.error('Error al guardar parejas:', errorParejas)
      }
    }

    // Guardar partidos en la base de datos
    if (resultado.partidos && resultado.partidos.length > 0) {
      const { error: errorPartidos } = await supabase
        .from('circuito3gen_partidos')
        .insert(resultado.partidos)

      if (errorPartidos) {
        console.error('Error al guardar partidos:', errorPartidos)
        throw errorPartidos
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sorteo ejecutado correctamente',
      data: resultado
    })
  } catch (error) {
    console.error('Error en POST sorteos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

