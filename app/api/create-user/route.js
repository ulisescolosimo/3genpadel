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

    const { email, nombre, apellido, dni, password } = await request.json()

    if (!email || !nombre || !apellido || !dni) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: email, nombre, apellido, dni' },
        { status: 400 }
      )
    }

    // Si se proporciona password, validar que tenga al menos 6 caracteres
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
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

    // Verificar si ya existe un usuario con ese email
    const { data: usuarioExistenteEmail, error: checkEmailError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, dni')
      .eq('email', email.toLowerCase())
      .single()

    if (checkEmailError && checkEmailError.code !== 'PGRST116') {
      console.error('Error verificando email:', checkEmailError)
      return NextResponse.json(
        { error: 'Error verificando email: ' + checkEmailError.message },
        { status: 500 }
      )
    }

    if (usuarioExistenteEmail) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      )
    }

    // Usar la contraseña proporcionada o generar una temporal
    const userPassword = password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    // Crear usuario en Supabase Auth
    console.log('Creando usuario en Auth...')
    
    let authData = null
    let authError = null

    const createResult = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: userPassword,
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
        
        console.log('Usuario ya existe en Auth, verificando...')
        
        // Intentar hacer login para obtener el usuario existente
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password: userPassword
        })
        
        if (signInError) {
          // Si no puede hacer login, el usuario existe pero con otra contraseña
          return NextResponse.json(
            { error: 'Ya existe un usuario con este email. Debe usar la opción de activación de cuenta.' },
            { status: 400 }
          )
        }
        
        // Usar el usuario existente
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
          cuenta_activada: password ? true : false, // Cuenta activada si se proporcionó contraseña
          rol: 'user',
          promedio_global: 0,
          partidos_totales_jugados: 0,
          partidos_totales_ganados: 0,
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
          cuenta_activada: password ? true : false, // Cuenta activada si se proporcionó contraseña
          rol: 'user',
          promedio_global: 0,
          partidos_totales_jugados: 0,
          partidos_totales_ganados: 0,
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

    console.log('Usuario creado exitosamente:', usuarioFinal)

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: usuarioFinal.id,
        email: usuarioFinal.email,
        nombre: usuarioFinal.nombre,
        apellido: usuarioFinal.apellido,
        dni: usuarioFinal.dni,
        cuenta_activada: usuarioFinal.cuenta_activada
      },
      tempPassword: (!password && process.env.NODE_ENV === 'development') ? userPassword : undefined // Solo en desarrollo si no se proporcionó password
    })

  } catch (error) {
    console.error('Error en create-user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    )
  }
} 