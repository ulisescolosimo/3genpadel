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
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Validar que la contraseña tenga al menos 6 caracteres
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()
    console.log('Cambiando contraseña para:', emailLower)

    // Buscar el usuario en la tabla usuarios para obtener el ID
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido')
      .eq('email', emailLower)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: 'No se encontró un usuario con ese email' },
        { status: 404 }
      )
    }

    // Verificar que el usuario existe en Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(usuario.id)
    
    if (authError || !authUser || !authUser.user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en el sistema de autenticación' },
        { status: 404 }
      )
    }

    // Actualizar la contraseña usando la API admin
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      usuario.id,
      {
        password: newPassword
      }
    )

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('Contraseña actualizada exitosamente para:', emailLower)

    // Actualizar también el campo password en la tabla usuarios si existe
    await supabase
      .from('usuarios')
      .update({ 
        password: newPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', usuario.id)

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido
      }
    })

  } catch (error) {
    console.error('Error en change-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    )
  }
}
