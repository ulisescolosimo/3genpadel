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
    console.log('Buscando usuario con email:', emailLower)

    // Primero buscar en la tabla usuarios para obtener el ID
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('email', emailLower)
      .single()

    console.log('Usuario en tabla usuarios:', usuario ? { id: usuario.id, email: usuario.email } : 'No encontrado')
    console.log('Error al buscar en usuarios:', usuarioError)

    let userInAuth = null

    if (usuario && usuario.id) {
      // Si encontramos el usuario en la tabla, verificar en Auth usando el ID
      console.log('Buscando en Auth por ID:', usuario.id)
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(usuario.id)
      
      console.log('Resultado getUserById:', authUser ? 'Usuario encontrado' : 'No encontrado')
      console.log('Error getUserById:', authError)
      
      if (!authError && authUser && authUser.user) {
        userInAuth = authUser.user
        console.log('Usuario encontrado en Auth por ID:', authUser.user.email)
      }
    }

    // Si no encontramos por ID, intentar buscar en Auth directamente usando listUsers
    // (útil para usuarios que pueden existir en Auth pero no en la tabla usuarios)
    if (!userInAuth) {
      console.log('Buscando en Auth usando listUsers...')
      const { data, error: listError } = await supabase.auth.admin.listUsers()
      
      console.log('listUsers error:', listError)
      console.log('listUsers data structure:', data ? Object.keys(data) : 'No data')
      
      if (!listError && data && data.users && Array.isArray(data.users)) {
        console.log('Total usuarios en Auth:', data.users.length)
        userInAuth = data.users.find(user => {
          const userEmail = user.email?.toLowerCase().trim()
          const matches = userEmail === emailLower
          if (matches) {
            console.log('Usuario encontrado en listUsers:', user.email)
          }
          return matches
        })
      }
    }

    // Verificar si el usuario tiene email como proveedor
    let hasEmailProvider = false
    let isOAuthOnly = false
    
    if (userInAuth) {
      const providers = userInAuth.app_metadata?.providers || []
      hasEmailProvider = providers.includes('email') || userInAuth.email
      isOAuthOnly = providers.length > 0 && !providers.includes('email')
    }

    return NextResponse.json({
      exists: !!userInAuth,
      inAuth: !!userInAuth,
      hasEmailProvider,
      isOAuthOnly,
      providers: userInAuth?.app_metadata?.providers || [],
      message: userInAuth 
        ? (isOAuthOnly 
          ? 'Usuario encontrado pero solo tiene cuenta con Google. Debes iniciar sesión con Google.'
          : 'Usuario encontrado. Puede recuperar su contraseña.')
        : 'No se encontró una cuenta con este email en nuestro sistema.'
    })

  } catch (error) {
    console.error('Error en check-user-auth:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

