import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verificarAdmin, obtenerUsuarioAutenticado } from '@/lib/circuitooka/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Listar parejas formadas para una fecha
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const etapaId = searchParams.get('etapa_id')
    const divisionId = searchParams.get('division_id')
    const fechaPartido = searchParams.get('fecha_partido')
    const usuarioId = searchParams.get('usuario_id')

    let query = supabase
      .from('circuitooka_parejas')
      .select(`
        *,
        etapa:circuitooka_etapas (
          id,
          nombre
        ),
        division:circuitooka_divisiones (
          id,
          numero_division,
          nombre
        ),
        jugador_1:usuarios!circuitooka_parejas_jugador_1_id_fkey (
          id,
          nombre,
          apellido,
          email
        ),
        jugador_2:usuarios!circuitooka_parejas_jugador_2_id_fkey (
          id,
          nombre,
          apellido,
          email
        )
      `)
      .order('fecha_partido', { ascending: true })

    if (etapaId) query = query.eq('etapa_id', etapaId)
    if (divisionId) query = query.eq('division_id', divisionId)
    if (fechaPartido) query = query.eq('fecha_partido', fechaPartido)
    if (usuarioId) {
      query = query.or(`jugador_1_id.eq.${usuarioId},jugador_2_id.eq.${usuarioId}`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error en GET parejas:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Formar pareja (jugador selecciona compañero)
export async function POST(request) {
  try {
    const user = await obtenerUsuarioAutenticado(request)
    const body = await request.json()
    const {
      etapa_id,
      division_id,
      fecha_partido,
      jugador_1_id,
      jugador_2_id,
      tipo_formacion = 'elegida_por_jugadores'
    } = body

    // Validaciones
    if (!etapa_id || !division_id || !fecha_partido || !jugador_1_id || !jugador_2_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que al menos uno de los jugadores sea el usuario autenticado (o admin)
    const esAdminUser = await verificarAdmin(request)
    if (!esAdminUser && user?.id !== jugador_1_id && user?.id !== jugador_2_id) {
      return NextResponse.json(
        { success: false, error: 'Solo puedes formar pareja contigo mismo' },
        { status: 403 }
      )
    }

    // Verificar que ambos jugadores estén inscriptos en la división
    const { data: inscripciones, error: errorInscripciones } = await supabase
      .from('circuitooka_inscripciones')
      .select('usuario_id')
      .eq('etapa_id', etapa_id)
      .eq('division_id', division_id)
      .eq('estado', 'activa')
      .in('usuario_id', [jugador_1_id, jugador_2_id])

    if (errorInscripciones) throw errorInscripciones

    if (!inscripciones || inscripciones.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Ambos jugadores deben estar inscriptos en la división' },
        { status: 400 }
      )
    }

    // Verificar que no exista ya una pareja para esta fecha
    const { data: parejaExistente } = await supabase
      .from('circuitooka_parejas')
      .select('id')
      .eq('etapa_id', etapa_id)
      .eq('division_id', division_id)
      .eq('fecha_partido', fecha_partido)
      .or(`jugador_1_id.eq.${jugador_1_id},jugador_1_id.eq.${jugador_2_id},jugador_2_id.eq.${jugador_1_id},jugador_2_id.eq.${jugador_2_id}`)
      .eq('estado', 'confirmada')

    if (parejaExistente && parejaExistente.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Uno de los jugadores ya tiene pareja para esta fecha' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('circuitooka_parejas')
      .insert({
        etapa_id,
        division_id,
        fecha_partido,
        jugador_1_id,
        jugador_2_id,
        tipo_formacion,
        estado: 'confirmada'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en POST parejas:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Actualizar pareja
export async function PUT(request) {
  try {
    const user = await obtenerUsuarioAutenticado(request)
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de pareja requerido' },
        { status: 400 }
      )
    }

    // Verificar permisos
    const { data: pareja } = await supabase
      .from('circuitooka_parejas')
      .select('jugador_1_id, jugador_2_id')
      .eq('id', id)
      .single()

    if (!pareja) {
      return NextResponse.json(
        { success: false, error: 'Pareja no encontrada' },
        { status: 404 }
      )
    }

    const esAdminUser = await verificarAdmin(request)
    if (!esAdminUser && user?.id !== pareja.jugador_1_id && user?.id !== pareja.jugador_2_id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('circuitooka_parejas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en PUT parejas:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Cancelar pareja
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de pareja requerido' },
        { status: 400 }
      )
    }

    const user = await obtenerUsuarioAutenticado(request)
    const esAdminUser = await verificarAdmin(request)

    // Verificar permisos
    const { data: pareja } = await supabase
      .from('circuitooka_parejas')
      .select('jugador_1_id, jugador_2_id')
      .eq('id', id)
      .single()

    if (!pareja) {
      return NextResponse.json(
        { success: false, error: 'Pareja no encontrada' },
        { status: 404 }
      )
    }

    if (!esAdminUser && user?.id !== pareja.jugador_1_id && user?.id !== pareja.jugador_2_id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('circuitooka_parejas')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Pareja cancelada' })
  } catch (error) {
    console.error('Error en DELETE parejas:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}










