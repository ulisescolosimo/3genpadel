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

    const { email, nombre, apellido, dni } = await request.json()

    if (!email || !nombre || !apellido || !dni) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: email, nombre, apellido, dni' },
        { status: 400 }
      )
    }

    console.log('Creando usuario para inscripción:', { 
      email: email.toLowerCase(), 
      nombre: nombre.trim(), 
      apellido: apellido.trim(), 
      dni: dni.toString().trim() 
    })

    // Validar formato de DNI (7-8 dígitos)
    const dniRegex = /^\d{7,8}$/
    if (!dniRegex.test(dni.toString().trim())) {
      return NextResponse.json(
        { error: 'El DNI debe tener 7 u 8 dígitos numéricos' },
        { status: 400 }
      )
    }

    const dniNumber = parseInt(dni.toString().trim())

    // Verificar si ya existe un usuario con ese DNI
    const { data: usuarioExistenteDNI, error: checkDNIError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido')
      .eq('dni', dniNumber)
      .single()

    if (checkDNIError && checkDNIError.code !== 'PGRST116') {
      console.error('Error verificando DNI:', checkDNIError)
      return NextResponse.json(
        { error: 'Error verificando DNI: ' + checkDNIError.message },
        { status: 500 }
      )
    }

    if (usuarioExistenteDNI) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese DNI' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un usuario con ese email en la tabla usuarios
    const { data: usuarioExistenteEmail, error: checkEmailError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, dni, cuenta_activada')
      .eq('email', email.toLowerCase())
      .single()

    if (checkEmailError && checkEmailError.code !== 'PGRST116') {
      console.error('Error verificando email:', checkEmailError)
      return NextResponse.json(
        { error: 'Error verificando email: ' + checkEmailError.message },
        { status: 500 }
      )
    }

    // Si existe un usuario con perfil completo y cuenta activada, no permitir crear otro
    if (usuarioExistenteEmail && usuarioExistenteEmail.cuenta_activada) {
      return NextResponse.json(
        { error: 'Ya existe un usuario activado con ese email' },
        { status: 400 }
      )
    }

    // Si existe un usuario con perfil pero cuenta no activada, permitir actualizar
    if (usuarioExistenteEmail && !usuarioExistenteEmail.cuenta_activada) {
      console.log('Usuario existe pero no está activado, se actualizará el perfil')
    }

    // Generar una contraseña temporal (el usuario deberá cambiarla después)
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    // Crear usuario en Supabase Auth
    console.log('Creando usuario en Auth...')
    
    let authData = null
    let authError = null
    let usuarioExistenteEnAuth = false

    // Si ya existe un usuario con perfil pero no activado, intentar obtener su ID de Auth
    if (usuarioExistenteEmail && !usuarioExistenteEmail.cuenta_activada) {
      console.log('Usuario existe en tabla usuarios pero no activado, usando ID existente')
      authData = { user: { id: usuarioExistenteEmail.id } }
      usuarioExistenteEnAuth = true
    } else {
      // Intentar crear nuevo usuario en Auth
      const createResult = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: tempPassword,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: {
          full_name: `${nombre} ${apellido}`.trim()
        }
      })

      authData = createResult.data
      authError = createResult.error

      if (authError) {
        console.error('Error creando usuario en Auth:', authError)
        
        // Si el usuario ya existe, intentar obtenerlo
        if (authError.code === 'email_exists' || authError.status === 422 || 
            authError.message.includes('already registered') || 
            authError.message.includes('already exists')) {
          
          console.log('Usuario ya existe en Auth, obteniendo usuario existente...')
          
          // Obtener usuario existente por email usando Admin API
          const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
          
          if (listError) {
            console.error('Error listando usuarios:', listError)
            return NextResponse.json(
              { error: 'Error verificando usuario existente: ' + listError.message },
              { status: 500 }
            )
          }
          
          const existingUser = existingUsers.users.find(u => u.email === email.toLowerCase())
          
          if (existingUser) {
            authData = { user: existingUser }
            usuarioExistenteEnAuth = true
            console.log('Usuario existente encontrado en Auth:', existingUser.id)
          } else {
            return NextResponse.json(
              { error: 'Usuario existe en Auth pero no se pudo obtener información' },
              { status: 500 }
            )
          }
        } else {
          return NextResponse.json(
            { error: 'Error al crear la cuenta de usuario: ' + authError.message },
            { status: 500 }
          )
        }
      }
    }

    console.log('Usuario creado/encontrado en Auth:', authData.user.id)

    // Verificar si ya existe un perfil en tabla usuarios
    const { data: existingProfiles, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)

    if (checkError) {
      console.error('Error verificando perfil existente:', checkError)
      return NextResponse.json(
        { error: 'Error verificando perfil de usuario: ' + checkError.message },
        { status: 500 }
      )
    }

    const existingProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null
    let userError = null

    if (existingProfile) {
      console.log('Perfil de usuario ya existe, actualizando...')
      // Actualizar el perfil existente
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          email: email.toLowerCase(),
          nombre: nombre,
          apellido: apellido,
          dni: dniNumber,
          cuenta_activada: usuarioExistenteEnAuth ? false : true, // Solo marcar como no activada si es usuario existente
          rol: existingProfile.rol || 'user',
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
          nombre: nombre,
          apellido: apellido,
          dni: dniNumber,
          cuenta_activada: usuarioExistenteEnAuth ? false : true, // Solo marcar como no activada si es usuario existente
          rol: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      userError = insertError
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

    console.log('Perfil de usuario creado/actualizado exitosamente')

    // Obtener el usuario creado/actualizado
    const { data: usuariosFinales, error: finalError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)

    if (finalError) {
      console.error('Error obteniendo usuario final:', finalError)
      return NextResponse.json(
        { error: 'Error obteniendo datos del usuario: ' + finalError.message },
        { status: 500 }
      )
    }

    const usuarioFinal = usuariosFinales && usuariosFinales.length > 0 ? usuariosFinales[0] : null

    if (!usuarioFinal) {
      console.error('No se pudo obtener el usuario final después de crear/actualizar')
      return NextResponse.json(
        { error: 'Error: No se pudo obtener el usuario creado' },
        { status: 500 }
      )
    }

    console.log('Usuario creado/actualizado exitosamente:', usuarioFinal)

    const mensaje = usuarioExistenteEnAuth || existingProfile 
      ? 'Usuario actualizado exitosamente' 
      : 'Usuario creado exitosamente'

    return NextResponse.json({
      success: true,
      message: mensaje,
      user: {
        id: usuarioFinal.id,
        email: usuarioFinal.email,
        nombre: usuarioFinal.nombre,
        apellido: usuarioFinal.apellido,
        dni: usuarioFinal.dni,
        cuenta_activada: usuarioFinal.cuenta_activada
      },
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined, // Solo en desarrollo
      updated: usuarioExistenteEnAuth || existingProfile // Indicar si fue una actualización
    })

  } catch (error) {
    console.error('Error en create-user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    )
  }
} 