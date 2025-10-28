import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Obtener turnos disponibles
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const fecha = searchParams.get('fecha')
    const incluirInscripciones = searchParams.get('incluir_inscripciones') === 'true'
    const usuario_id = searchParams.get('usuario_id')

    let query = supabase
      .from('reservas_turnos')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    if (fecha) {
      query = query.eq('fecha', fecha)
    }

    const { data: turnos, error } = await query

    if (error) {
      console.error('Error fetching turnos:', error)
      return NextResponse.json(
        { error: 'Error al obtener turnos' },
        { status: 500 }
      )
    }

    // Contar inscripciones CONFIRMADAS para cada turno (pendientes no ocupan lugar)
    const turnosConContador = await Promise.all(
      turnos.map(async (turno) => {
        const { count: inscripcionesCount, error: countError } = await supabase
          .from('reservas_inscripciones')
          .select('*', { count: 'exact', head: true })
          .eq('turno_id', turno.id)
          .eq('estado', 'confirmada')

        if (countError) {
          console.error('Error counting inscripciones:', countError)
          return { ...turno, inscripciones_count: 0 }
        }

        return { ...turno, inscripciones_count: inscripcionesCount || 0 }
      })
    )

    // Si se solicita incluir inscripciones detalladas (para admin)
    if (incluirInscripciones) {
      const turnosConInscripciones = await Promise.all(
        turnosConContador.map(async (turno) => {
          const { data: inscripciones, error: inscError } = await supabase
            .from('reservas_inscripciones')
            .select(`
              id,
              created_at,
              estado,
              usuarios!inner(
                id,
                nombre,
                apellido,
                email
              )
            `)
            .eq('turno_id', turno.id)

          if (inscError) {
            console.error('Error fetching inscripciones:', inscError)
            return { ...turno, inscripciones: [] }
          }

          return { ...turno, inscripciones: inscripciones || [] }
        })
      )

      return NextResponse.json({
        success: true,
        data: turnosConInscripciones
      })
    }

    // Si se proporciona usuario_id, verificar si está inscrito en cada turno
    if (usuario_id) {
      const turnosConEstado = await Promise.all(
        turnosConContador.map(async (turno) => {
          const { data: inscripcion } = await supabase
            .from('reservas_inscripciones')
            .select('id, created_at, estado')
            .eq('turno_id', turno.id)
            .eq('usuario_id', usuario_id)
            .single()

          return {
            ...turno,
            mi_inscripcion: inscripcion || null
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: turnosConEstado
      })
    }

    return NextResponse.json({
      success: true,
      data: turnosConContador
    })
  } catch (error) {
    console.error('Error in GET /api/reservas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Crear nuevo turno (solo admin)
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

    const { fecha, hora_inicio, hora_fin, categoria, capacidad } = await request.json()

    // Validar campos requeridos
    if (!fecha || !hora_inicio || !hora_fin || !categoria) {
      return NextResponse.json(
        { error: 'Fecha, hora_inicio, hora_fin y categoría son requeridos' },
        { status: 400 }
      )
    }

    // Validar categoría
    if (!['C4', 'C6', 'C7', 'C8'].includes(categoria)) {
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      )
    }

    // Validar que hora_inicio sea menor que hora_fin
    if (hora_inicio >= hora_fin) {
      return NextResponse.json(
        { error: 'La hora de inicio debe ser menor que la hora de fin' },
        { status: 400 }
      )
    }

    // Validar fecha no sea del pasado
    const fechaTurno = new Date(fecha)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    if (fechaTurno < hoy) {
      return NextResponse.json(
        { error: 'No se pueden crear turnos para fechas pasadas' },
        { status: 400 }
      )
    }

    // Obtener día de la semana
    const fechaObj = new Date(fecha)
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const dia_semana = dias[fechaObj.getDay()]

    const { data: nuevoTurno, error: createError } = await supabase
      .from('reservas_turnos')
      .insert({
        fecha,
        hora_inicio,
        hora_fin,
        categoria,
        dia_semana,
        capacidad: capacidad || 4,
        estado: 'disponible'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating turno:', createError)
      return NextResponse.json(
        { error: 'Error al crear turno. Puede que ya exista un turno con esa fecha, hora y categoría.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Turno creado exitosamente',
      data: nuevoTurno
    })

  } catch (error) {
    console.error('Error in POST /api/reservas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Eliminar turno (solo admin)
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

    const { searchParams } = new URL(request.url)
    const turnoId = searchParams.get('id')

    if (!turnoId) {
      return NextResponse.json(
        { error: 'ID del turno requerido' },
        { status: 400 }
      )
    }

    // Verificar si el turno tiene inscripciones confirmadas
    const { count: inscripcionesCount, error: countError } = await supabase
      .from('reservas_inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('turno_id', turnoId)
      .eq('estado', 'confirmada')

    if (countError) {
      console.error('Error counting inscripciones:', countError)
      return NextResponse.json(
        { error: 'Error al verificar inscripciones' },
        { status: 500 }
      )
    }

    if (inscripcionesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un turno con inscripciones confirmadas. Primero cancela las inscripciones.' },
        { status: 400 }
      )
    }

    // Eliminar inscripciones pendientes primero
    await supabase
      .from('reservas_inscripciones')
      .delete()
      .eq('turno_id', turnoId)

    // Eliminar el turno
    const { error: deleteError } = await supabase
      .from('reservas_turnos')
      .delete()
      .eq('id', turnoId)

    if (deleteError) {
      console.error('Error deleting turno:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar turno' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Turno eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error in DELETE /api/reservas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

