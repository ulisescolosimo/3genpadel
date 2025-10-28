import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Inscribirse a un turno
export async function POST(request) {
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

    const { turno_id } = await request.json()

    if (!turno_id) {
      return NextResponse.json(
        { error: 'ID de turno requerido' },
        { status: 400 }
      )
    }

    // Verificar que el turno exista y esté disponible
    const { data: turno, error: turnoError } = await supabase
      .from('reservas_turnos')
      .select('*')
      .eq('id', turno_id)
      .single()

    if (turnoError || !turno) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    if (turno.estado !== 'disponible' && turno.estado !== 'completo') {
      return NextResponse.json(
        { error: 'El turno no está disponible' },
        { status: 400 }
      )
    }

    // Verificar si ya está inscrito (cualquier estado)
    const { data: inscripcionExistente } = await supabase
      .from('reservas_inscripciones')
      .select('*')
      .eq('turno_id', turno_id)
      .eq('usuario_id', user.id)
      .single()

    if (inscripcionExistente) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud para este turno' },
        { status: 400 }
      )
    }

    // Contar inscripciones confirmadas
    const { count: inscripcionesCount } = await supabase
      .from('reservas_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('turno_id', turno_id)
      .eq('estado', 'confirmada')

    if (inscripcionesCount >= turno.capacidad) {
      return NextResponse.json(
        { error: 'El turno está completo' },
        { status: 400 }
      )
    }

    // Crear inscripción con estado pendiente
    const { data: nuevaInscripcion, error: inscError } = await supabase
      .from('reservas_inscripciones')
      .insert({
        turno_id,
        usuario_id: user.id,
        estado: 'pendiente'
      })
      .select()
      .single()

    if (inscError) {
      console.error('Error creating inscripcion:', inscError)
      return NextResponse.json(
        { error: 'Error al inscribirse' },
        { status: 500 }
      )
    }

    // Enviar notificación al usuario
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nombre, apellido')
      .eq('id', user.id)
      .single()

    // No enviar notificación aún, esperar aprobación del admin
    return NextResponse.json({
      success: true,
      message: 'Reserva solicitada. Esperando confirmación del administrador.',
      data: nuevaInscripcion
    })

  } catch (error) {
    console.error('Error in POST /api/reservas/inscripciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Cancelar inscripción
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url)
    const inscripcion_id = searchParams.get('inscripcion_id')

    if (!inscripcion_id) {
      return NextResponse.json(
        { error: 'ID de inscripción requerido' },
        { status: 400 }
      )
    }

    // Verificar que la inscripción exista y pertenezca al usuario
    const { data: inscripcion, error: inscError } = await supabase
      .from('reservas_inscripciones')
      .select('*, turno:turno_id(*)')
      .eq('id', inscripcion_id)
      .eq('usuario_id', user.id)
      .single()

    if (inscError || !inscripcion) {
      return NextResponse.json(
        { error: 'Inscripción no encontrada' },
        { status: 404 }
      )
    }


    // Eliminar la inscripción
    const { error: deleteError } = await supabase
      .from('reservas_inscripciones')
      .delete()
      .eq('id', inscripcion_id)

    if (deleteError) {
      console.error('Error deleting inscripcion:', deleteError)
      return NextResponse.json(
        { error: 'Error al cancelar inscripción' },
        { status: 500 }
      )
    }

    // Enviar notificación
    await supabase.rpc('crear_notificacion', {
      p_usuario_id: user.id,
      p_titulo: 'Inscripción Cancelada',
      p_mensaje: `Has cancelado tu inscripción al turno de ${inscripcion.turno.categoria} del ${new Date(inscripcion.turno.fecha).toLocaleDateString('es-AR')} de ${inscripcion.turno.hora_inicio} a ${inscripcion.turno.hora_fin}.`,
      p_tipo: 'academia'
    })

    return NextResponse.json({
      success: true,
      message: 'Inscripción cancelada exitosamente'
    })

  } catch (error) {
    console.error('Error in DELETE /api/reservas/inscripciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

