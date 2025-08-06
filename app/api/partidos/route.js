import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Obtener información de un partido específico
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const partidoId = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno no configuradas')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    if (partidoId) {
      // Obtener información específica de un partido
      const { data, error } = await supabase.rpc('get_partido_info', {
        partido_id: parseInt(partidoId)
      })

      if (error) {
        console.error('Error fetching partido info:', error)
        return NextResponse.json(
          { error: 'Error al obtener información del partido' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: data
      })
    } else {
      // Obtener lista de partidos recientes
      const { data, error } = await supabase
        .from('liga_partidos')
        .select(`
          *,
          liga_categorias (
            id,
            categoria,
            ligas (
              id,
              nombre,
              fecha_inicio
            )
          ),
          equipo_a:ligainscripciones!liga_partidos_equipo_a_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido,
              email
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido,
              email
            )
          ),
          equipo_b:ligainscripciones!liga_partidos_equipo_b_id_fkey (
            id,
            titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
              id,
              nombre,
              apellido,
              email
            ),
            titular_2:usuarios!ligainscripciones_titular_2_id_fkey (
              id,
              nombre,
              apellido,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching partidos:', error)
        return NextResponse.json(
          { error: 'Error al obtener partidos' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: data || []
      })
    }

  } catch (error) {
    console.error('Error in partidos API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo partido (con notificaciones automáticas)
export async function POST(request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno no configuradas')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Verificar autorización básica
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verificar el token y obtener el usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token de autorización inválido' },
        { status: 401 }
      )
    }

    const partidoData = await request.json()

    // Validar campos requeridos
    if (!partidoData.liga_categoria_id || !partidoData.equipo_a_id || !partidoData.equipo_b_id) {
      return NextResponse.json(
        { error: 'liga_categoria_id, equipo_a_id y equipo_b_id son requeridos' },
        { status: 400 }
      )
    }

    // Crear la fecha si se proporciona
    let fechaISO = null
    if (partidoData.fecha) {
      const fechaLocal = new Date(partidoData.fecha)
      const offset = fechaLocal.getTimezoneOffset() * 60000
      fechaISO = new Date(fechaLocal.getTime() - offset).toISOString()
    }

    const partidoToInsert = {
      liga_categoria_id: parseInt(partidoData.liga_categoria_id),
      equipo_a_id: parseInt(partidoData.equipo_a_id),
      equipo_b_id: parseInt(partidoData.equipo_b_id),
      equipo_ganador_id: partidoData.equipo_ganador_id ? parseInt(partidoData.equipo_ganador_id) : null,
      puntos_por_jugador: parseInt(partidoData.puntos_por_jugador || '3'),
      fecha: fechaISO,
      ronda: partidoData.ronda || 'Grupos',
      estado: partidoData.estado || 'pendiente'
    }

    // Insertar el partido (el trigger automáticamente creará las notificaciones)
    const { data: newPartido, error } = await supabase
      .from('liga_partidos')
      .insert([partidoToInsert])
      .select()
      .single()

    if (error) {
      console.error('Error creating partido:', error)
      return NextResponse.json(
        { error: 'Error al crear el partido' },
        { status: 500 }
      )
    }

    // Obtener información completa del partido creado
    const { data: partidoInfo } = await supabase.rpc('get_partido_info', {
      partido_id: newPartido.id
    })

    return NextResponse.json({
      success: true,
      message: 'Partido creado exitosamente con notificaciones automáticas',
      data: {
        partido: newPartido,
        info_completa: partidoInfo
      }
    })

  } catch (error) {
    console.error('Error in partidos API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


