import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Inscribirse a un turno (sin usar reservas_turnos)
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

    const { fecha, hora_inicio, hora_fin, categoria } = await request.json()

    // Validar campos requeridos
    if (!fecha || !hora_inicio || !hora_fin || !categoria) {
      return NextResponse.json(
        { error: 'Fecha, hora_inicio, hora_fin y categoría son requeridos' },
        { status: 400 }
      )
    }

    // Validar categoría
    const categoriasValidas = ['Iniciante de cero', 'Principiante', 'Intermedio', 'Avanzado', 'Profesional']
    if (!categoriasValidas.includes(categoria)) {
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      )
    }

    // Validar que la fecha no sea del pasado
    // Parsear fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = fecha.split('-')
    const fechaTurno = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    fechaTurno.setHours(0, 0, 0, 0)
    
    if (fechaTurno < hoy) {
      return NextResponse.json(
        { error: 'No se pueden reservar turnos para fechas pasadas' },
        { status: 400 }
      )
    }

    // Validar día de la semana (martes=2, miércoles=3, viernes=5)
    const diaSemana = fechaTurno.getDay()
    if (diaSemana !== 2 && diaSemana !== 3 && diaSemana !== 5) {
      return NextResponse.json(
        { error: 'Solo se pueden reservar turnos para martes, miércoles o viernes' },
        { status: 400 }
      )
    }

    // Validar horarios permitidos
    const horariosValidos = {
      '12:00:00': '13:00:00',
      '13:00:00': '14:00:00',
      '14:00:00': '15:00:00',
      '15:00:00': '16:00:00'
    }
    
    if (!horariosValidos[hora_inicio] || horariosValidos[hora_inicio] !== hora_fin) {
      return NextResponse.json(
        { error: 'Horario no válido. Los horarios permitidos son: 12-13, 13-14, 14-15, 15-16' },
        { status: 400 }
      )
    }

    // Verificar si ya está inscrito (cualquier estado) para este turno
    const { data: inscripcionExistente } = await supabase
      .from('reservas_inscripciones')
      .select('*')
      .eq('fecha', fecha)
      .eq('hora_inicio', hora_inicio)
      .eq('hora_fin', hora_fin)
      .eq('categoria', categoria)
      .eq('usuario_id', user.id)
      .in('estado', ['pendiente', 'confirmada'])
      .single()

    if (inscripcionExistente) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud para este turno' },
        { status: 400 }
      )
    }

    // Contar inscripciones confirmadas y pendientes para verificar capacidad (máximo 4)
    const { count: inscripcionesCount } = await supabase
      .from('reservas_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', fecha)
      .eq('hora_inicio', hora_inicio)
      .eq('hora_fin', hora_fin)
      .eq('categoria', categoria)
      .in('estado', ['confirmada', 'pendiente'])

    const capacidadMaxima = 4
    if (inscripcionesCount >= capacidadMaxima) {
      return NextResponse.json(
        { error: 'El turno está completo' },
        { status: 400 }
      )
    }

    // Crear inscripción con estado pendiente
    const { data: nuevaInscripcion, error: inscError } = await supabase
      .from('reservas_inscripciones')
      .insert({
        fecha,
        hora_inicio,
        hora_fin,
        categoria,
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
      .select('*')
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
      p_mensaje: `Has cancelado tu inscripción al turno de ${inscripcion.categoria} del ${new Date(inscripcion.fecha).toLocaleDateString('es-AR')} de ${inscripcion.hora_inicio} a ${inscripcion.hora_fin}.`,
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
