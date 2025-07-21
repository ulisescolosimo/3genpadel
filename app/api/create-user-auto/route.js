import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Verificar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno de Supabase no configuradas')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Configurada' : 'Falta')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Configurada' : 'Falta')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    // Verificar variables de entorno
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno no configuradas')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    const { userId, email, fullName, avatarUrl } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: userId, email' },
        { status: 400 }
      )
    }

    console.log('Creando usuario automáticamente para Google OAuth:', { 
      userId,
      email: email.toLowerCase(), 
      fullName,
      avatarUrl
    })

    // Extraer nombre y apellido del full_name
    const nameParts = (fullName || "").split(" ")
    const nombre = nameParts[0] || email?.split("@")[0] || ""
    const apellido = nameParts.slice(1).join(" ") || ""

    // Verificar si ya existe un usuario con ese ID o email
    const { data: usuarioExistente, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .or(`id.eq.${userId},email.eq.${email.toLowerCase()}`)
      .limit(1)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error verificando usuario existente:', checkError)
      return NextResponse.json(
        { error: 'Error verificando usuario: ' + checkError.message },
        { status: 500 }
      )
    }

    let userError = null
    let usuarioFinal = null

    if (usuarioExistente) {
      console.log('Usuario ya existe, actualizando...')
      
      // Si el usuario existe pero con email diferente, actualizar el email
      const updateData = {
        email: email.toLowerCase(),
        nombre: nombre,
        apellido: apellido,
        avatar_url: avatarUrl || usuarioExistente.avatar_url,
        cuenta_activada: true,
        rol: 'user',
        updated_at: new Date().toISOString()
      }
      
      // Si el ID es diferente, actualizar también el ID
      if (usuarioExistente.id !== userId) {
        updateData.id = userId
      }
      
      // Actualizar el perfil existente
      const { data: updatedUser, error: updateError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', usuarioExistente.id)
        .select()
        .single()
      
      userError = updateError
      usuarioFinal = updatedUser
    } else {
      console.log('Creando nuevo perfil de usuario...')
      // Crear nuevo perfil en tabla usuarios
      const { data: newUser, error: insertError } = await supabase
        .from('usuarios')
        .insert({
          id: userId,
          email: email.toLowerCase(),
          nombre: nombre,
          apellido: apellido,
          dni: null, // DNI como null inicialmente
          ranking_puntos: 0,
          cuenta_activada: true, // Cuenta activada para usuarios de Google
          rol: 'user',
          avatar_url: avatarUrl,
          nivel: "Principiante",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      userError = insertError
      usuarioFinal = newUser
    }

    if (userError) {
      console.error('Error con perfil de usuario:', userError)
      console.error('Detalles del error:', {
        code: userError.code,
        details: userError.details,
        hint: userError.hint,
        message: userError.message
      })
      return NextResponse.json(
        { error: 'Error al manejar el perfil de usuario: ' + userError.message },
        { status: 500 }
      )
    }

    console.log('Perfil de usuario creado/actualizado exitosamente:', usuarioFinal)

    return NextResponse.json({
      success: true,
      message: 'Usuario creado/actualizado exitosamente',
      user: usuarioFinal
    })

  } catch (error) {
    console.error('Error en create-user-auto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    )
  }
} 