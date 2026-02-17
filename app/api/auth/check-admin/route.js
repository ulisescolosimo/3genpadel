import { NextResponse } from 'next/server'
import { verificarAdmin, obtenerUsuarioAutenticado } from '@/lib/circuito3gen/auth'

/**
 * GET: Verifica si el usuario autenticado tiene rol admin
 * Requiere Authorization: Bearer <token>
 */
export async function GET(request) {
  try {
    const user = await obtenerUsuarioAutenticado(request)
    if (!user) {
      return NextResponse.json({ isAdmin: false, error: 'No autenticado' }, { status: 401 })
    }

    const isAdmin = await verificarAdmin(request)
    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Error en check-admin:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
