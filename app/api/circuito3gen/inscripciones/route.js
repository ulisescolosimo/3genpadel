import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verificarAdmin, obtenerUsuarioAutenticado } from '@/lib/circuito3gen/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Listar inscripciones (con filtros)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const etapaId = searchParams.get('etapa_id')
    const divisionId = searchParams.get('division_id')
    const usuarioId = searchParams.get('usuario_id')
    const estado = searchParams.get('estado')

    let query = supabase
      .from('circuito3gen_inscripciones')
      .select(`
        *,
        etapa:circuito3gen_etapas (
          id,
          nombre,
          estado
        ),
        division:circuito3gen_divisiones (
          id,
          numero_division,
          nombre
        ),
        usuario:usuarios (
          id,
          nombre,
          apellido,
          email
        )
      `)
      .order('fecha_inscripcion', { ascending: false })

    if (etapaId) query = query.eq('etapa_id', etapaId)
    if (divisionId) query = query.eq('division_id', divisionId)
    if (usuarioId) query = query.eq('usuario_id', usuarioId)
    if (estado) query = query.eq('estado', estado)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error en GET inscripciones:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Crear inscripción individual
export async function POST(request) {
  try {
    const user = await obtenerUsuarioAutenticado(request)
    const body = await request.json()
    const { etapa_id, division_id, usuario_id, division_solicitada, evaluacion_organizador, fecha_inscripcion, estado, comprobante_url, comprobante_filename, imagen_jugador_url, imagen_jugador_filename } = body

    // Validaciones
    if (!etapa_id || !division_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: etapa_id, division_id' },
        { status: 400 }
      )
    }

    // Validar comprobante de pago
    if (!comprobante_url || !comprobante_filename) {
      return NextResponse.json(
        { success: false, error: 'Debes adjuntar el comprobante de pago de $50.000' },
        { status: 400 }
      )
    }

    // Validar imagen del jugador
    if (!imagen_jugador_url || !imagen_jugador_filename) {
      return NextResponse.json(
        { success: false, error: 'Debes adjuntar una imagen del jugador' },
        { status: 400 }
      )
    }

    // Determinar el usuario_id a usar:
    // - Si viene usuario_id en el body, usarlo (admin inscribiendo a otro usuario)
    // - Si no viene, usar el usuario autenticado (auto-inscripción)
    const usuarioId = usuario_id || user?.id
    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Usuario requerido' },
        { status: 400 }
      )
    }

    // Verificar que no esté ya inscripto en esta etapa (en cualquier división)
    const { data: inscripcionesExistentes, error: errorVerificacion } = await supabase
      .from('circuito3gen_inscripciones')
      .select('id, division_id, estado')
      .eq('etapa_id', etapa_id)
      .eq('usuario_id', usuarioId)
      .eq('estado', 'activa')

    if (errorVerificacion) throw errorVerificacion

    if (inscripcionesExistentes && inscripcionesExistentes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya estás inscripto en una división de esta etapa. No puedes inscribirte en múltiples divisiones de la misma etapa.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('circuito3gen_inscripciones')
      .insert({
        etapa_id,
        usuario_id: usuarioId,
        division_id,
        division_solicitada: division_solicitada || null,
        evaluacion_organizador: evaluacion_organizador || false,
        estado: estado || 'activa',
        fecha_inscripcion: fecha_inscripcion || new Date().toISOString().split('T')[0],
        comprobante_url: comprobante_url || null,
        comprobante_filename: comprobante_filename || null,
        imagen_jugador_url: imagen_jugador_url || null,
        imagen_jugador_filename: imagen_jugador_filename || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en POST inscripciones:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Actualizar inscripción
export async function PUT(request) {
  try {
    const user = await obtenerUsuarioAutenticado(request)
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de inscripción requerido' },
        { status: 400 }
      )
    }

    // Verificar permisos: el usuario solo puede actualizar su propia inscripción, admin puede actualizar cualquiera
    const { data: inscripcion } = await supabase
      .from('circuito3gen_inscripciones')
      .select('usuario_id')
      .eq('id', id)
      .single()

    if (!inscripcion) {
      return NextResponse.json(
        { success: false, error: 'Inscripción no encontrada' },
        { status: 404 }
      )
    }

    const esAdminUser = await verificarAdmin(request)
    if (!esAdminUser && user?.id !== inscripcion.usuario_id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('circuito3gen_inscripciones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en PUT inscripciones:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Cancelar inscripción
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de inscripción requerido' },
        { status: 400 }
      )
    }

    const user = await obtenerUsuarioAutenticado(request)
    const esAdminUser = await verificarAdmin(request)

    // Verificar permisos
    const { data: inscripcion } = await supabase
      .from('circuito3gen_inscripciones')
      .select('usuario_id')
      .eq('id', id)
      .single()

    if (!inscripcion) {
      return NextResponse.json(
        { success: false, error: 'Inscripción no encontrada' },
        { status: 404 }
      )
    }

    if (!esAdminUser && user?.id !== inscripcion.usuario_id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('circuito3gen_inscripciones')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Inscripción cancelada' })
  } catch (error) {
    console.error('Error en DELETE inscripciones:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

