import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verificarAdmin, obtenerUsuarioAutenticado } from '@/lib/circuitooka/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Listar todas las etapas o obtener etapa específica
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const etapaId = searchParams.get('id')
    const estado = searchParams.get('estado')

    if (etapaId) {
      // Obtener etapa específica
      const { data, error } = await supabase
        .from('circuitooka_etapas')
        .select('*')
        .eq('id', etapaId)
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, data })
    }

    // Listar todas las etapas
    let query = supabase
      .from('circuitooka_etapas')
      .select('*')
      .order('año', { ascending: false })
      .order('fecha_inicio', { ascending: false })

    if (estado) {
      query = query.eq('estado', estado)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error en GET etapas:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Crear nueva etapa (solo admin)
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
    const { nombre, fecha_inicio, fecha_fin, año, estado = 'activa' } = body

    // Validaciones
    if (!nombre || !fecha_inicio || !fecha_fin || !año) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('circuitooka_etapas')
      .insert({
        nombre,
        fecha_inicio,
        fecha_fin,
        año,
        estado
      })
      .select()
      .single()

    if (error) throw error

    // Crear configuración por defecto para la etapa
    await supabase
      .from('circuitooka_configuracion')
      .insert({
        etapa_id: data.id,
        cupos_ascenso_porcentaje: 20,
        cupos_ascenso_minimo: 2,
        cupos_ascenso_maximo: 10,
        jugadores_playoff_por_division: 4,
        horario_turno_noche_inicio: '20:00',
        horario_turno_noche_fin: '23:00'
      })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en POST etapas:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Actualizar etapa (solo admin)
export async function PUT(request) {
  try {
    const esAdminUser = await verificarAdmin(request)
    if (!esAdminUser) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de etapa requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('circuitooka_etapas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en PUT etapas:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}








