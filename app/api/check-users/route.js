import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    console.log('Verificando usuario:', email)

    // Verificar si existe en tabla usuarios
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())

    if (usuariosError) {
      console.error('Error consultando usuarios:', usuariosError)
    }



    // Intentar hacer login para verificar si existe en Auth
    let authUser = null
    let authError = null
    
    try {
      // Intentar con una password cualquiera para ver si el usuario existe
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: 'test_password_123'
      })
      
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          // El usuario existe pero la password es incorrecta
          authUser = { exists: true, message: 'Usuario existe en Auth pero password incorrecta' }
        } else {
          authError = signInError
        }
      } else {
        authUser = { exists: true, user: signInData.user }
      }
    } catch (error) {
      authError = error
    }

    return NextResponse.json({
      email: email,
      auth: authUser,
      authError: authError?.message,
      usuarios: usuarios || [],
      usuariosError: usuariosError?.message
    })

  } catch (error) {
    console.error('Error en check-users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    )
  }
} 