import { NextResponse } from 'next/server'
import { verificarAdmin } from '@/lib/circuito3gen/auth'
import { actualizarPromedioGlobalJugador } from '@/lib/circuito3gen/rankings'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST: Recalcular promedio global de todos los jugadores o de uno específico
export async function POST(request) {
  try {
    // Verificar que sea admin
    const esAdminUser = await verificarAdmin(request)
    if (!esAdminUser) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { usuario_id } = body || {}

    // Si se especifica un usuario_id, recalcular solo ese
    if (usuario_id) {
      try {
        const resultado = await actualizarPromedioGlobalJugador(usuario_id)
        return NextResponse.json({
          success: true,
          message: 'Promedio global recalculado correctamente',
          data: {
            usuario_id,
            promedio_global: resultado.promedio_global,
            partidos_totales_jugados: resultado.partidos_totales_jugados,
            partidos_totales_ganados: resultado.partidos_totales_ganados,
            promedio_actualizado_at: resultado.promedio_actualizado_at
          }
        })
      } catch (error) {
        console.error('Error al recalcular promedio global:', error)
        return NextResponse.json(
          { success: false, error: error.message || 'Error al recalcular promedio global' },
          { status: 500 }
        )
      }
    }

    // Si no se especifica usuario_id, recalcular todos los jugadores que tienen partidos
    try {
      // Obtener todos los usuarios únicos que tienen partidos jugados
      const { data: partidos, error: errorPartidos } = await supabase
        .from('circuito3gen_partidos')
        .select('jugador_a1_id, jugador_a2_id, jugador_b1_id, jugador_b2_id')
        .eq('estado', 'jugado')

      if (errorPartidos) throw errorPartidos

      // Extraer todos los IDs únicos de jugadores
      const usuariosIds = new Set()
      partidos?.forEach(partido => {
        if (partido.jugador_a1_id) usuariosIds.add(partido.jugador_a1_id)
        if (partido.jugador_a2_id) usuariosIds.add(partido.jugador_a2_id)
        if (partido.jugador_b1_id) usuariosIds.add(partido.jugador_b1_id)
        if (partido.jugador_b2_id) usuariosIds.add(partido.jugador_b2_id)
      })

      const usuariosIdsArray = Array.from(usuariosIds)
      const totalJugadores = usuariosIdsArray.length

      if (totalJugadores === 0) {
        return NextResponse.json({
          success: true,
          message: 'No hay jugadores con partidos jugados para recalcular',
          data: {
            total_procesados: 0,
            total_exitosos: 0,
            total_errores: 0,
            resultados: []
          }
        })
      }

      // Recalcular promedio global para cada jugador
      const resultados = []
      let exitosos = 0
      let errores = 0

      for (const usuarioId of usuariosIdsArray) {
        try {
          const resultado = await actualizarPromedioGlobalJugador(usuarioId)
          resultados.push({
            usuario_id: usuarioId,
            exito: true,
            promedio_global: resultado.promedio_global,
            partidos_totales_jugados: resultado.partidos_totales_jugados,
            partidos_totales_ganados: resultado.partidos_totales_ganados
          })
          exitosos++
        } catch (error) {
          console.error(`Error al recalcular promedio global para ${usuarioId}:`, error)
          resultados.push({
            usuario_id: usuarioId,
            exito: false,
            error: error.message || 'Error desconocido'
          })
          errores++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Promedios globales recalculados: ${exitosos} exitosos, ${errores} errores de ${totalJugadores} jugadores`,
        data: {
          total_procesados: totalJugadores,
          total_exitosos: exitosos,
          total_errores: errores,
          resultados: resultados.slice(0, 100) // Limitar a los primeros 100 para no sobrecargar la respuesta
        }
      })
    } catch (error) {
      console.error('Error al recalcular promedios globales:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Error al recalcular promedios globales' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error en POST recalcular-promedios-globales:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
