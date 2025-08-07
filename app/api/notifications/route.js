import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    // Verificar que las variables de entorno estén configuradas
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

    console.log('Usuario autenticado:', user.email)

    const { titulo, mensaje, tipo, usuario_id, es_masiva, solo_ligas_activas } = await request.json()

    // Validar campos requeridos
    if (!titulo || !mensaje || !tipo) {
      return NextResponse.json(
        { error: 'Título, mensaje y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Validar tipo de notificación
    const tiposValidos = ['liga', 'ranking', 'academia', 'sistema', 'general']
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de notificación inválido' },
        { status: 400 }
      )
    }

    let result

    if (es_masiva) {
      if (solo_ligas_activas) {
        // Crear notificación masiva solo para usuarios inscritos en ligas activas
        const { data, error } = await supabase.rpc('crear_notificacion_masiva_ligas_activas', {
          p_titulo: titulo,
          p_mensaje: mensaje,
          p_tipo: tipo
        })

        if (error) {
          console.error('Error creating mass notification for active leagues:', error)
          return NextResponse.json(
            { error: 'Error al crear notificación masiva para ligas activas' },
            { status: 500 }
          )
        }

        result = { count: data }
      } else {
        // Crear notificación masiva para todos los usuarios
        const { data, error } = await supabase.rpc('crear_notificacion_masiva', {
          p_titulo: titulo,
          p_mensaje: mensaje,
          p_tipo: tipo
        })

        if (error) {
          console.error('Error creating mass notification:', error)
          return NextResponse.json(
            { error: 'Error al crear notificación masiva' },
            { status: 500 }
          )
        }

        result = { count: data }
      }
    } else {
      // Crear notificación para un usuario específico
      if (!usuario_id) {
        return NextResponse.json(
          { error: 'ID de usuario requerido para notificación individual' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase.rpc('crear_notificacion', {
        p_usuario_id: usuario_id,
        p_titulo: titulo,
        p_mensaje: mensaje,
        p_tipo: tipo
      })

      if (error) {
        console.error('Error creating notification:', error)
        return NextResponse.json(
          { error: 'Error al crear notificación' },
          { status: 500 }
        )
      }

      result = { id: data }
    }

    return NextResponse.json({
      success: true,
      message: es_masiva 
        ? solo_ligas_activas
          ? `Notificación enviada a ${result.count} usuarios inscritos en ligas activas`
          : `Notificación masiva creada para ${result.count} usuarios`
        : 'Notificación creada exitosamente',
      data: result
    })

  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuario_id = searchParams.get('usuario_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!usuario_id) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuario_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Error al obtener notificaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 