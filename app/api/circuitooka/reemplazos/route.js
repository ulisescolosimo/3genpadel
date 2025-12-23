import { NextResponse } from 'next/server'
import { verificarAdmin, obtenerUsuarioAutenticado } from '@/lib/circuitooka/auth'
import {
  solicitarReemplazo,
  validarReemplazo,
  procesarReemplazoNuevoJugador,
  actualizarPartidoConReemplazo,
  obtenerReemplazosPendientes
} from '@/lib/circuitooka/reemplazos'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET: Listar reemplazos pendientes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const partidoId = searchParams.get('partido_id')

    const reemplazos = await obtenerReemplazosPendientes(partidoId || null)

    return NextResponse.json({ success: true, data: reemplazos })
  } catch (error) {
    console.error('Error en GET reemplazos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Solicitar reemplazo
export async function POST(request) {
  try {
    const user = await obtenerUsuarioAutenticado(request)
    const body = await request.json()
    const { partido_id, jugador_original_id, jugador_reemplazo_id } = body

    if (!partido_id || !jugador_original_id || !jugador_reemplazo_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario autenticado sea el jugador original o admin
    const esAdminUser = await verificarAdmin(request)
    if (!esAdminUser && user?.id !== jugador_original_id) {
      return NextResponse.json(
        { success: false, error: 'Solo puedes solicitar reemplazo para ti mismo' },
        { status: 403 }
      )
    }

    const reemplazo = await solicitarReemplazo(partido_id, jugador_original_id, jugador_reemplazo_id)

    return NextResponse.json({ success: true, data: reemplazo })
  } catch (error) {
    console.error('Error en POST reemplazos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Aprobar/rechazar reemplazo
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
    const { reemplazo_id, accion, jugador_reemplazo_id } = body

    if (!reemplazo_id || !accion) {
      return NextResponse.json(
        { success: false, error: 'reemplazo_id y accion son requeridos' },
        { status: 400 }
      )
    }

    if (accion !== 'aprobar' && accion !== 'rechazar') {
      return NextResponse.json(
        { success: false, error: 'accion debe ser "aprobar" o "rechazar"' },
        { status: 400 }
      )
    }

    if (accion === 'aprobar') {
      // Obtener el reemplazo
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data: reemplazo, error: errorReemplazo } = await supabase
        .from('circuitooka_reemplazos')
        .select('*')
        .eq('id', reemplazo_id)
        .single()

      if (errorReemplazo) throw errorReemplazo

      // Verificar si es un nuevo jugador
      const esValido = await validarReemplazo(reemplazo.jugador_reemplazo_id, reemplazo.partido_id)
      
      if (!esValido) {
        // Procesar como nuevo jugador
        const { data: partido } = await supabase
          .from('circuitooka_partidos')
          .select('etapa_id, division_id')
          .eq('id', reemplazo.partido_id)
          .single()

        await procesarReemplazoNuevoJugador(
          reemplazo.jugador_reemplazo_id,
          partido.etapa_id,
          partido.division_id
        )

        // Actualizar tipo de reemplazo
        await supabase
          .from('circuitooka_reemplazos')
          .update({ tipo_reemplazo: 'nuevo_inscripto' })
          .eq('id', reemplazo_id)
      }

      // Actualizar el partido con el reemplazo
      await actualizarPartidoConReemplazo(reemplazo.partido_id, reemplazo)

      return NextResponse.json({
        success: true,
        message: 'Reemplazo aprobado y aplicado',
        data: reemplazo
      })
    } else {
      // Rechazar: eliminar el reemplazo
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { error } = await supabase
        .from('circuitooka_reemplazos')
        .delete()
        .eq('id', reemplazo_id)

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Reemplazo rechazado'
      })
    }
  } catch (error) {
    console.error('Error en PUT reemplazos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}








