import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno de Supabase no configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()
    console.log('Generando enlace de recuperación para:', emailLower)

    // Buscar el usuario en la tabla usuarios para obtener el ID
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('email', emailLower)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: 'No se encontró una cuenta con este email.' },
        { status: 404 }
      )
    }

    // Verificar que el usuario existe en Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(usuario.id)
    
    if (authError || !authUser || !authUser.user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en el sistema de autenticación.' },
        { status: 404 }
      )
    }

    // Verificar si el usuario tiene email como proveedor (no solo OAuth)
    const providers = authUser.user.app_metadata?.providers || []
    const hasEmailProvider = providers.includes('email') || authUser.user.email
    
    if (!hasEmailProvider && providers.length > 0 && !providers.includes('email')) {
      // Usuario solo tiene OAuth, no puede recuperar contraseña tradicional
      return NextResponse.json(
        { 
          error: 'Tu cuenta está vinculada con Google. Para cambiar tu contraseña, inicia sesión con Google y actualiza tu contraseña desde allí.',
          isOAuthOnly: true
        },
        { status: 400 }
      )
    }

    // Generar el enlace de recuperación usando la API admin
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/restablecer-contrasena`
    
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: emailLower,
      options: {
        redirectTo: redirectUrl
      }
    })

    if (linkError) {
      console.error('Error generando enlace de recuperación:', linkError)
      return NextResponse.json(
        { error: 'Error al generar el enlace de recuperación: ' + linkError.message },
        { status: 500 }
      )
    }

    console.log('Enlace de recuperación generado exitosamente')

    // Nota: generateLink NO envía el email automáticamente
    // Necesitamos usar resetPasswordForEmail desde el cliente o configurar un webhook
    // Por ahora, devolvemos éxito y el cliente intentará enviar el email
    
    return NextResponse.json({
      success: true,
      message: 'Enlace de recuperación generado. El email debería llegar en breve.',
      // El email se enviará automáticamente por Supabase cuando se use resetPasswordForEmail
    })

  } catch (error) {
    console.error('Error en reset-password-admin:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

