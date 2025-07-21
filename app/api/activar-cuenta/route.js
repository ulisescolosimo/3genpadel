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

    // Verificar que el usuario existe y no está activado
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', jugadorId)
      .eq('email', email.toLowerCase())
      .single()

    if (usuarioError || !usuario) {
      console.error('Error buscando usuario:', usuarioError)
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    console.log('Usuario encontrado:', usuario)
    console.log('Campos del usuario:', Object.keys(usuario))

    // Verificar si ya tiene cuenta completamente activa
    if (usuario.cuenta_activada) {
      return NextResponse.json(
        { error: 'Este usuario ya tiene una cuenta activa' },
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
        full_name: `${usuario.nombre} ${usuario.apellido || ''}`.trim()
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
        console.log('Usuario ya existe, actualizando contraseña...')
        
        // Buscar el usuario existente en Auth usando listUsers
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
          console.error('Error listando usuarios:', listError)
          return NextResponse.json(
            { error: 'Error al obtener usuarios: ' + listError.message },
            { status: 500 }
          )
        }
        
        const existingUser = users.users.find(user => user.email.toLowerCase() === email.toLowerCase())
        
        if (!existingUser) {
          console.error('Usuario no encontrado en Auth')
          return NextResponse.json(
            { error: 'Usuario no encontrado en el sistema de autenticación' },
            { status: 404 }
          )
        }
        
        // Actualizar la contraseña del usuario existente
        const { data: updateUserData, error: updateUserError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            password: password,
            email_confirm: true
          }
        )
        
        if (updateUserError) {
          console.error('Error actualizando contraseña:', updateUserError)
          return NextResponse.json(
            { error: 'Error al actualizar la contraseña: ' + updateUserError.message },
            { status: 500 }
          )
        }
        
        console.log('Contraseña actualizada exitosamente:', updateUserData.user.id)
        authData = { user: updateUserData.user }
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
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          telefono: usuario.telefono || null,
          nivel: usuario.nivel || 'Principiante',
          updated_at: new Date().toISOString()
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
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          telefono: usuario.telefono || null,
          nivel: usuario.nivel || 'Principiante',
          updated_at: new Date().toISOString()
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

    // Actualizar usuario y marcar como activado
    const updateData = {
      password: password, // Guardar la contraseña también en usuario
      cuenta_activada: true,
      updated_at: new Date().toISOString()
    }
    
    // Si el campo created_at existe, no lo actualizamos (debe mantener su valor original)
    // El trigger se encargará de actualizar updated_at automáticamente
    
    console.log('Datos a actualizar en usuario:', updateData)
    
    const { data: updatedUsuario, error: updateError } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', usuario.id)
      .select()

    if (updateError) {
      console.error('Error actualizando usuario:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el usuario: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('Usuario actualizado exitosamente:', updatedUsuario)

    // Determinar el mensaje según el estado previo del usuario
    const wasAlreadyActivated = usuario.cuenta_activada
    const wasNewUser = !usuario.cuenta_activada
    
    let message = 'Cuenta activada exitosamente. Ya puedes hacer login.'
    if (wasAlreadyActivated) {
      message = 'Contraseña configurada exitosamente. Ya puedes hacer login.'
    } else if (wasNewUser) {
      message = 'Cuenta activada exitosamente. Ya puedes hacer login.'
    }

    return NextResponse.json({
      success: true,
      message: message,
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre
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