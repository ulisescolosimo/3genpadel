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

    const { email, password, jugadorId } = await request.json()

    if (!email || !password || !jugadorId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    console.log('Activando cuenta para:', { email, jugadorId })

    // Verificar que el jugador existe y no está activado
    const { data: jugador, error: jugadorError } = await supabase
      .from('jugador')
      .select('*')
      .eq('id', jugadorId)
      .eq('email', email.toLowerCase())
      .single()

    if (jugadorError || !jugador) {
      console.error('Error buscando jugador:', jugadorError)
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      )
    }

    console.log('Jugador encontrado:', jugador)
    console.log('Campos del jugador:', Object.keys(jugador))

    if (jugador.cuenta_activada) {
      return NextResponse.json(
        { error: 'Este jugador ya tiene una cuenta activa' },
        { status: 400 }
      )
    }

    // Si ya tiene auth_id, verificar si el usuario existe en Auth
    if (jugador.auth_id) {
      console.log('Jugador ya tiene auth_id:', jugador.auth_id)
      return NextResponse.json(
        { error: 'Este jugador ya está vinculado a una cuenta de usuario' },
        { status: 400 }
      )
    }

    // Intentar crear usuario en Supabase Auth
    console.log('Intentando crear usuario en Auth...')

    let authData = null
    let authError = null

    const createResult = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        full_name: `${jugador.nombre} ${jugador.apellido || ''}`.trim()
      }
    })

    authData = createResult.data
    authError = createResult.error

    if (authError) {
      console.error('Error creando usuario en Auth:', authError)
      console.error('Error code:', authError.code)
      console.error('Error message:', authError.message)
      
      // Si el usuario ya existe (código 422 o email_exists)
      if (authError.code === 'email_exists' || authError.status === 422 || 
          authError.message.includes('already registered') || 
          authError.message.includes('already exists')) {
        console.log('Usuario ya existe, verificando password...')
        
        // Intentar hacer login para verificar que la password es correcta
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password: password
        })
        
        if (signInError) {
          console.error('Error en login:', signInError)
          return NextResponse.json(
            { error: 'Ya existe un usuario con este email pero la contraseña no coincide' },
            { status: 400 }
          )
        }
        
        // Si el login es exitoso, usar ese usuario
        console.log('Login exitoso, usando usuario existente:', signInData.user.id)
        authData = { user: signInData.user }
      } else {
        return NextResponse.json(
          { error: 'Error al crear la cuenta de usuario: ' + authError.message },
          { status: 500 }
        )
      }
    }

    console.log('Usuario creado/encontrado en Auth:', authData.user.id)

    // Verificar si ya existe un perfil en tabla usuarios
    const { data: existingProfile, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (checkError && !checkError.message.includes('No rows found')) {
      console.error('Error verificando perfil existente:', checkError)
      return NextResponse.json(
        { error: 'Error verificando perfil de usuario: ' + checkError.message },
        { status: 500 }
      )
    }

    let userError = null

    if (existingProfile) {
      console.log('Perfil de usuario ya existe, actualizando...')
      // Actualizar el perfil existente
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          email: email.toLowerCase(),
          nombre: jugador.nombre,
          apellido: jugador.apellido,
          telefono: jugador.telefono || null,
          nivel: jugador.nivel || 'Principiante',
          updated_at: new Date().toISOString(),
          jugador_id: jugador.id
        })
        .eq('id', authData.user.id)
      
      userError = updateError
    } else {
      console.log('Creando nuevo perfil de usuario...')
      // Crear nuevo perfil en tabla usuarios
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: email.toLowerCase(),
          nombre: jugador.nombre,
          apellido: jugador.apellido,
          telefono: jugador.telefono || null,
          nivel: jugador.nivel || 'Principiante',
          updated_at: new Date().toISOString(),
          jugador_id: jugador.id
        })
      
      userError = insertError
    }

    if (userError) {
      console.error('Error con perfil de usuario:', userError)
      return NextResponse.json(
        { error: 'Error al manejar el perfil de usuario: ' + userError.message },
        { status: 500 }
      )
    }

    // Actualizar jugador con el ID de auth y marcar como activado
    const updateData = {
      auth_id: authData.user.id,
      password: password, // Guardar la contraseña también en jugador
      cuenta_activada: true,
      updated_at: new Date().toISOString()
    }
    
    // Si el campo created_at existe, no lo actualizamos (debe mantener su valor original)
    // El trigger se encargará de actualizar updated_at automáticamente
    
    console.log('Datos a actualizar en jugador:', updateData)
    
    const { data: updatedJugador, error: updateError } = await supabase
      .from('jugador')
      .update(updateData)
      .eq('id', jugador.id)
      .select()

    if (updateError) {
      console.error('Error actualizando jugador:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el jugador: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('Jugador actualizado exitosamente:', updatedJugador)

    return NextResponse.json({
      success: true,
      message: 'Cuenta activada exitosamente. Ya puedes hacer login.',
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      jugador: {
        id: jugador.id,
        email: jugador.email,
        nombre: jugador.nombre
      }
    })

  } catch (error) {
    console.error('Error en activación de cuenta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    )
  }
} 