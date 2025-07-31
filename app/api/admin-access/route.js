import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Contraseña maestra - en producción debería estar en variables de entorno
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'admin_master_2024'

export async function POST(request) {
  try {
    const { email, masterPassword } = await request.json()

    if (!email || !masterPassword) {
      return NextResponse.json(
        { error: 'Email y contraseña maestra son requeridos' },
        { status: 400 }
      )
    }

    // Verificar contraseña maestra
    if (masterPassword !== MASTER_PASSWORD) {
      return NextResponse.json(
        { error: 'Contraseña maestra incorrecta' },
        { status: 401 }
      )
    }

    console.log('Acceso maestra solicitado para:', email)

    // Buscar el usuario en la tabla usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el usuario existe en Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(usuario.id)

    if (authError) {
      return NextResponse.json(
        { error: 'Error al verificar usuario en Auth: ' + authError.message },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en Auth' },
        { status: 404 }
      )
    }

    // Generar un token de sesión temporal para el usuario
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/impersonate?user_id=${usuario.id}`
      }
    })

    if (sessionError) {
      return NextResponse.json(
        { error: 'Error al generar sesión: ' + sessionError.message },
        { status: 500 }
      )
    }

    // Crear un token de acceso temporal (en producción usar JWT más seguro)
    const accessToken = Buffer.from(JSON.stringify({
      user_id: usuario.id,
      email: usuario.email,
      timestamp: Date.now(),
      expires: Date.now() + (5 * 60 * 1000) // 5 minutos
    })).toString('base64')

    return NextResponse.json({
      success: true,
      message: 'Acceso concedido',
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol
      },
      accessToken,
      expires: Date.now() + (5 * 60 * 1000)
    })

  } catch (error) {
    console.error('Error en admin-access:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    )
  }
} 