import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Obtener horarios disponibles para una fecha/categoría o inscripciones agrupadas para admin
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const fecha = searchParams.get('fecha')
    const usuario_id = searchParams.get('usuario_id')
    const horarios_disponibles = searchParams.get('horarios_disponibles') === 'true'
    const incluirInscripciones = searchParams.get('incluir_inscripciones') === 'true'
    const admin = searchParams.get('admin') === 'true'

    // Endpoint para admin: obtener inscripciones agrupadas por fecha/hora/categoria
    if (admin && incluirInscripciones) {
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

      // Obtener todas las inscripciones con datos de usuario
      let query = supabase
        .from('reservas_inscripciones')
        .select(`
          id,
          fecha,
          hora_inicio,
          hora_fin,
          categoria,
          estado,
          created_at,
          usuarios:usuario_id(
            id,
            nombre,
            apellido,
            email
          )
        `)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })

      if (categoria && categoria !== 'all') {
        query = query.eq('categoria', categoria)
      }

      const { data: inscripciones, error: inscError } = await query

      if (inscError) {
        console.error('Error fetching inscripciones:', inscError)
        return NextResponse.json(
          { error: 'Error al obtener inscripciones' },
          { status: 500 }
        )
      }

      // Agrupar inscripciones por fecha/hora/categoria
      const grupos = new Map()
      
      inscripciones?.forEach(ins => {
        const key = `${ins.fecha}_${ins.hora_inicio}_${ins.hora_fin}_${ins.categoria}`
        if (!grupos.has(key)) {
          grupos.set(key, {
            fecha: ins.fecha,
            hora_inicio: ins.hora_inicio,
            hora_fin: ins.hora_fin,
            categoria: ins.categoria,
            inscripciones: []
          })
        }
        grupos.get(key).inscripciones.push(ins)
      })

      // Convertir a array y contar inscripciones
      const turnosAgrupados = Array.from(grupos.values()).map(grupo => ({
        fecha: grupo.fecha,
        hora_inicio: grupo.hora_inicio,
        hora_fin: grupo.hora_fin,
        categoria: grupo.categoria,
        inscripciones_count: grupo.inscripciones.filter(i => i.estado !== 'cancelada').length,
        capacidad: 4,
        inscripciones: grupo.inscripciones
      }))

      return NextResponse.json({
        success: true,
        data: turnosAgrupados
      })
    }

    // Si se solicita horarios disponibles para una fecha/categoría específica
    if (horarios_disponibles && fecha && categoria) {
      // Definir horarios posibles
      const horarios = [
        { hora_inicio: '12:00:00', hora_fin: '13:00:00' },
        { hora_inicio: '13:00:00', hora_fin: '14:00:00' },
        { hora_inicio: '14:00:00', hora_fin: '15:00:00' },
        { hora_inicio: '15:00:00', hora_fin: '16:00:00' }
      ]

      // Para cada horario, verificar disponibilidad consultando reservas_inscripciones
      const horariosConDisponibilidad = await Promise.all(
        horarios.map(async (horario) => {
          // Contar inscripciones confirmadas y pendientes para este horario
          const { count: inscripcionesCount } = await supabase
            .from('reservas_inscripciones')
            .select('*', { count: 'exact', head: true })
            .eq('fecha', fecha)
            .eq('hora_inicio', horario.hora_inicio)
            .eq('hora_fin', horario.hora_fin)
            .eq('categoria', categoria)
            .in('estado', ['confirmada', 'pendiente'])

          const capacidadMaxima = 4
          const disponible = (inscripcionesCount || 0) < capacidadMaxima

          // Si se proporciona usuario_id, verificar si está inscrito
          let mi_inscripcion = null
          if (usuario_id) {
            const { data: inscripcion } = await supabase
              .from('reservas_inscripciones')
              .select('id, created_at, estado')
              .eq('fecha', fecha)
              .eq('hora_inicio', horario.hora_inicio)
              .eq('hora_fin', horario.hora_fin)
              .eq('categoria', categoria)
              .eq('usuario_id', usuario_id)
              .in('estado', ['pendiente', 'confirmada'])
              .single()

            mi_inscripcion = inscripcion || null
          }

          return {
            hora_inicio: horario.hora_inicio,
            hora_fin: horario.hora_fin,
            inscripciones_count: inscripcionesCount || 0,
            capacidad: capacidadMaxima,
            disponible,
            mi_inscripcion
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: horariosConDisponibilidad
      })
    }

    // Si no se solicita horarios_disponibles, devolver error o respuesta vacía
    // (ya no hay turnos predefinidos)
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Use horarios_disponibles=true con fecha y categoria para obtener horarios disponibles'
    })

  } catch (error) {
    console.error('Error in GET /api/reservas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Los endpoints POST y DELETE para crear/eliminar turnos ya no son necesarios
// ya que no usamos la tabla reservas_turnos
