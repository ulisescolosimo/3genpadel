import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verificarAdmin, obtenerUsuarioAutenticado } from '@/lib/circuito3gen/auth'
import { actualizarRankingJugador, actualizarPromedioGlobalJugador } from '@/lib/circuito3gen/rankings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Listar partidos (con filtros)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const etapaId = searchParams.get('etapa_id')
    const divisionId = searchParams.get('division_id')
    const fechaPartido = searchParams.get('fecha_partido')
    const estado = searchParams.get('estado')
    const usuarioId = searchParams.get('usuario_id')

    let query = supabase
      .from('circuito3gen_partidos')
      .select(`
        *,
        etapa:circuito3gen_etapas (
          id,
          nombre
        ),
        division:circuito3gen_divisiones (
          id,
          numero_division,
          nombre
        ),
        jugador_a1:usuarios!jugador_a1_id (
          id,
          nombre,
          apellido
        ),
        jugador_a2:usuarios!jugador_a2_id (
          id,
          nombre,
          apellido
        ),
        jugador_b1:usuarios!jugador_b1_id (
          id,
          nombre,
          apellido
        ),
        jugador_b2:usuarios!jugador_b2_id (
          id,
          nombre,
          apellido
        )
      `)
      .order('fecha_partido', { ascending: false })
      .order('horario', { ascending: true })

    if (etapaId) query = query.eq('etapa_id', etapaId)
    if (divisionId) query = query.eq('division_id', divisionId)
    if (fechaPartido) query = query.eq('fecha_partido', fechaPartido)
    if (estado) query = query.eq('estado', estado)
    if (usuarioId) {
      query = query.or(
        `jugador_a1_id.eq.${usuarioId},jugador_a2_id.eq.${usuarioId},jugador_b1_id.eq.${usuarioId},jugador_b2_id.eq.${usuarioId}`
      )
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error en GET partidos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Crear partido manualmente (solo admin) o automáticamente (sistema)
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      etapa_id,
      division_id,
      fecha_partido,
      jugador_a1_id,
      jugador_a2_id,
      jugador_b1_id,
      jugador_b2_id,
      jugador_a1_nombre,
      jugador_a2_nombre,
      jugador_b1_nombre,
      jugador_b2_nombre,
      cancha,
      lugar,
      horario,
      estado = 'pendiente',
      es_sistema = false, // Si es true, no requiere admin
      wo_jugador_ids = []
    } = body

    // Validaciones
    if (!etapa_id || !division_id || !fecha_partido) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar que cada jugador tenga ID o nombre (no ambos, al menos uno)
    const validarJugador = (id, nombre, campo) => {
      if (!id && !nombre) {
        return `El ${campo} debe tener un ID o un nombre`
      }
      if (id && nombre) {
        return `El ${campo} no puede tener ID y nombre al mismo tiempo`
      }
      return null
    }

    const errores = [
      validarJugador(jugador_a1_id, jugador_a1_nombre, 'jugador A1'),
      validarJugador(jugador_a2_id, jugador_a2_nombre, 'jugador A2'),
      validarJugador(jugador_b1_id, jugador_b1_nombre, 'jugador B1'),
      validarJugador(jugador_b2_id, jugador_b2_nombre, 'jugador B2')
    ].filter(Boolean)

    if (errores.length > 0) {
      return NextResponse.json(
        { success: false, error: errores.join('. ') },
        { status: 400 }
      )
    }

    // Validar wo_jugador_ids: solo IDs de jugadores del partido
    const jugadoresPartido = [jugador_a1_id, jugador_a2_id, jugador_b1_id, jugador_b2_id].filter(Boolean)
    const woIdsArray = Array.isArray(wo_jugador_ids) ? wo_jugador_ids : []
    const woIdsInvalidos = woIdsArray.filter(id => !jugadoresPartido.includes(id))
    if (woIdsInvalidos.length > 0) {
      return NextResponse.json(
        { success: false, error: 'wo_jugador_ids solo puede contener IDs de jugadores del partido' },
        { status: 400 }
      )
    }

    // Verificar permisos (solo admin puede crear manualmente, sistema puede crear automáticamente)
    if (!es_sistema) {
      const esAdminUser = await verificarAdmin(request)
      if (!esAdminUser) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 403 }
        )
      }
    }

    const { data, error } = await supabase
      .from('circuito3gen_partidos')
      .insert({
        etapa_id,
        division_id,
        fecha_partido,
        jugador_a1_id: jugador_a1_id || null,
        jugador_a2_id: jugador_a2_id || null,
        jugador_b1_id: jugador_b1_id || null,
        jugador_b2_id: jugador_b2_id || null,
        jugador_a1_nombre: jugador_a1_nombre || null,
        jugador_a2_nombre: jugador_a2_nombre || null,
        jugador_b1_nombre: jugador_b1_nombre || null,
        jugador_b2_nombre: jugador_b2_nombre || null,
        cancha: cancha || null,
        lugar: lugar || null,
        horario: horario || null,
        estado,
        wo_jugador_ids: woIdsArray
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en POST partidos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Actualizar resultado de partido
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de partido requerido' },
        { status: 400 }
      )
    }

    // Solo admin puede actualizar partidos
    const esAdminUser = await verificarAdmin(request)
    if (!esAdminUser) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Limpiar datos: convertir cadenas vacías a null para campos que pueden ser null
    const cleanedData = { ...updateData }
    
    // equipo_ganador solo puede ser 'A', 'B' o null (no cadena vacía)
    if (cleanedData.equipo_ganador === '' || cleanedData.equipo_ganador === undefined) {
      cleanedData.equipo_ganador = null
    }
    
    // Otros campos opcionales
    if (cleanedData.cancha === '') cleanedData.cancha = null
    if (cleanedData.lugar === '') cleanedData.lugar = null
    if (cleanedData.horario === '') cleanedData.horario = null
    if (cleanedData.resultado_detallado === '') cleanedData.resultado_detallado = null
    
    // Validar jugadores: cada uno debe tener ID o nombre (no ambos, al menos uno)
    const validarJugador = (id, nombre, campo) => {
      if (id === '' || id === undefined) id = null
      if (nombre === '' || nombre === undefined) nombre = null
      if (!id && !nombre) {
        return `El ${campo} debe tener un ID o un nombre`
      }
      if (id && nombre) {
        return `El ${campo} no puede tener ID y nombre al mismo tiempo`
      }
      return null
    }

    const errores = [
      validarJugador(cleanedData.jugador_a1_id, cleanedData.jugador_a1_nombre, 'jugador A1'),
      validarJugador(cleanedData.jugador_a2_id, cleanedData.jugador_a2_nombre, 'jugador A2'),
      validarJugador(cleanedData.jugador_b1_id, cleanedData.jugador_b1_nombre, 'jugador B1'),
      validarJugador(cleanedData.jugador_b2_id, cleanedData.jugador_b2_nombre, 'jugador B2')
    ].filter(Boolean)

    if (errores.length > 0) {
      return NextResponse.json(
        { success: false, error: errores.join('. ') },
        { status: 400 }
      )
    }
    
    // Limpiar campos de jugadores: convertir cadenas vacías a null
    if (cleanedData.jugador_a1_id === '') cleanedData.jugador_a1_id = null
    if (cleanedData.jugador_a2_id === '') cleanedData.jugador_a2_id = null
    if (cleanedData.jugador_b1_id === '') cleanedData.jugador_b1_id = null
    if (cleanedData.jugador_b2_id === '') cleanedData.jugador_b2_id = null
    if (cleanedData.jugador_a1_nombre === '') cleanedData.jugador_a1_nombre = null
    if (cleanedData.jugador_a2_nombre === '') cleanedData.jugador_a2_nombre = null
    if (cleanedData.jugador_b1_nombre === '') cleanedData.jugador_b1_nombre = null
    if (cleanedData.jugador_b2_nombre === '') cleanedData.jugador_b2_nombre = null

    // Validar y normalizar wo_jugador_ids (solo jugadores con ID del partido)
    if (cleanedData.wo_jugador_ids !== undefined) {
      const jugadoresPartido = [
        cleanedData.jugador_a1_id,
        cleanedData.jugador_a2_id,
        cleanedData.jugador_b1_id,
        cleanedData.jugador_b2_id
      ].filter(Boolean)
      const woIdsArray = Array.isArray(cleanedData.wo_jugador_ids) ? cleanedData.wo_jugador_ids : []
      const woIdsInvalidos = woIdsArray.filter(id => !jugadoresPartido.includes(id))
      if (woIdsInvalidos.length > 0) {
        return NextResponse.json(
          { success: false, error: 'wo_jugador_ids solo puede contener IDs de jugadores del partido' },
          { status: 400 }
        )
      }
      cleanedData.wo_jugador_ids = woIdsArray
    }

    // Obtener partido actual para verificar cambios que afecten el ranking
    const { data: partidoActual } = await supabase
      .from('circuito3gen_partidos')
      .select('estado, etapa_id, division_id, jugador_a1_id, jugador_a2_id, jugador_b1_id, jugador_b2_id, jugador_a1_nombre, jugador_a2_nombre, jugador_b1_nombre, jugador_b2_nombre, equipo_ganador, games_equipo_a, games_equipo_b, sets_equipo_a, sets_equipo_b, wo_jugador_ids')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('circuito3gen_partidos')
      .update(cleanedData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Detectar si hay cambios que afecten el ranking
    const estadoCambioAJugado = updateData.estado === 'jugado' && partidoActual?.estado !== 'jugado'
    const partidoYaEstabaJugado = partidoActual?.estado === 'jugado'
    
    // Campos que afectan el ranking
    const camposAfectanRanking = [
      'equipo_ganador',
      'games_equipo_a',
      'games_equipo_b',
      'sets_equipo_a',
      'sets_equipo_b',
      'wo_jugador_ids'
    ]
    
    // Verificar si hay cambios en campos que afectan el ranking
    const hayCambiosEnPuntajes = partidoYaEstabaJugado && camposAfectanRanking.some(campo => {
      if (updateData[campo] !== undefined) {
        const valorAnterior = partidoActual?.[campo] ?? null
        const valorNuevo = updateData[campo] ?? null
        // Comparación especial para arrays (wo_jugador_ids)
        if (campo === 'wo_jugador_ids') {
          const arrA = Array.isArray(valorAnterior) ? valorAnterior : []
          const arrB = Array.isArray(valorNuevo) ? valorNuevo : []
          return JSON.stringify([...arrA].sort()) !== JSON.stringify([...arrB].sort())
        }
        return valorAnterior !== valorNuevo
      }
      return false
    })

    // Recalcular rankings si:
    // 1. El estado cambió a "jugado", O
    // 2. El partido ya estaba jugado y hay cambios en los puntajes
    // IMPORTANTE: Solo actualizar rankings para jugadores registrados (que tienen ID)
    if (estadoCambioAJugado || hayCambiosEnPuntajes) {
      try {
        // Actualizar rankings por división solo para jugadores registrados
        // La función actualizarRankingJugador recalcula todo desde cero basándose en TODOS los partidos,
        // por lo que automáticamente resta los puntos incorrectos y suma los correctos
        if (data.jugador_a1_id) {
          await actualizarRankingJugador(data.jugador_a1_id, data.etapa_id, data.division_id)
          await actualizarPromedioGlobalJugador(data.jugador_a1_id)
        }
        if (data.jugador_a2_id) {
          await actualizarRankingJugador(data.jugador_a2_id, data.etapa_id, data.division_id)
          await actualizarPromedioGlobalJugador(data.jugador_a2_id)
        }
        if (data.jugador_b1_id) {
          await actualizarRankingJugador(data.jugador_b1_id, data.etapa_id, data.division_id)
          await actualizarPromedioGlobalJugador(data.jugador_b1_id)
        }
        if (data.jugador_b2_id) {
          await actualizarRankingJugador(data.jugador_b2_id, data.etapa_id, data.division_id)
          await actualizarPromedioGlobalJugador(data.jugador_b2_id)
        }
      } catch (error) {
        console.error('Error al recalcular rankings:', error)
        // No fallar la actualización del partido si falla el ranking
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en PUT partidos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Cancelar partido
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de partido requerido' },
        { status: 400 }
      )
    }

    // Solo admin puede eliminar partidos
    const esAdminUser = await verificarAdmin(request)
    if (!esAdminUser) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('circuito3gen_partidos')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Partido cancelado' })
  } catch (error) {
    console.error('Error en DELETE partidos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

