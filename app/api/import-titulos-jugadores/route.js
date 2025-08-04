import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { jugadores, categoria } = await request.json()

    if (!jugadores || !Array.isArray(jugadores)) {
      return NextResponse.json(
        { error: 'Se requiere un array de jugadores' },
        { status: 400 }
      )
    }

    if (!categoria) {
      return NextResponse.json(
        { error: 'Se requiere especificar la categoría' },
        { status: 400 }
      )
    }

    // Validar estructura de datos
    const jugadoresValidados = jugadores.map((jugador, index) => {
      if (!jugador.nombre || !jugador.apellido) {
        throw new Error(`Jugador ${index + 1}: nombre y apellido son requeridos`)
      }
      
      if (typeof jugador.titulos !== 'number' || jugador.titulos < 0) {
        throw new Error(`Jugador ${index + 1}: títulos debe ser un número mayor o igual a 0`)
      }

      return {
        nombre: jugador.nombre.trim(),
        apellido: jugador.apellido.trim(),
        titulos: jugador.titulos,
        categoria: categoria.trim()
      }
    })

    // Verificar si ya existen jugadores con la misma categoría
    const { data: existingJugadores, error: checkError } = await supabase
      .from('titulos_jugadores')
      .select('id, nombre, apellido')
      .eq('categoria', categoria)

    if (checkError) throw checkError

    if (existingJugadores && existingJugadores.length > 0) {
      return NextResponse.json(
        { 
          error: `Ya existen ${existingJugadores.length} jugadores en la categoría ${categoria}. Elimina los existentes primero o usa una categoría diferente.`,
          existingJugadores: existingJugadores
        },
        { status: 409 }
      )
    }

    // Insertar jugadores
    const { data: insertedJugadores, error: insertError } = await supabase
      .from('titulos_jugadores')
      .insert(jugadoresValidados)
      .select()

    if (insertError) throw insertError

    return NextResponse.json({
      message: `Se importaron ${insertedJugadores.length} jugadores correctamente`,
      jugadores: insertedJugadores
    })

  } catch (error) {
    console.error('Error importing titulos jugadores:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')

    if (!categoria) {
      return NextResponse.json(
        { error: 'Se requiere especificar la categoría' },
        { status: 400 }
      )
    }

    // Eliminar todos los jugadores de la categoría especificada
    const { error } = await supabase
      .from('titulos_jugadores')
      .delete()
      .eq('categoria', categoria)

    if (error) throw error

    return NextResponse.json({
      message: `Se eliminaron todos los jugadores de la categoría ${categoria}`
    })

  } catch (error) {
    console.error('Error deleting titulos jugadores:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 