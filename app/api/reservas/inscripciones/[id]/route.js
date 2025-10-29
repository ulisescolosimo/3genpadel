import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Aprobar o rechazar una inscripción (solo admin)
export async function PATCH(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token de autorización inválido' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea admin
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (usuarioError || !usuario || usuario.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const { id } = params
    const { estado } = await request.json()

    if (!['confirmada', 'cancelada', 'pendiente'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser "confirmada", "pendiente" o "cancelada"' },
        { status: 400 }
      )
    }

    // Obtener la inscripción con detalles del turno y usuario
    const { data: inscripcion, error: inscError } = await supabase
      .from('reservas_inscripciones')
      .select(`
        *,
        turno:turno_id(*),
        usuario:usuario_id(*)
      `)
      .eq('id', id)
      .single()

    if (inscError || !inscripcion) {
      return NextResponse.json(
        { error: 'Inscripción no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar estado
    const { data: inscripcionActualizada, error: updateError } = await supabase
      .from('reservas_inscripciones')
      .update({ estado })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating inscripcion:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar inscripción' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Inscripción ${estado} exitosamente`,
      data: inscripcionActualizada
    })

  } catch (error) {
    console.error('Error in PATCH /api/reservas/inscripciones/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


