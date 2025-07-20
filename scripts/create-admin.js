const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Necesitas la service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  console.log('Asegúrate de tener configuradas:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser(email, password, nombre) {
  try {
    console.log('🔄 Creando usuario administrador...')
    
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        full_name: nombre
      }
    })

    if (authError) {
      throw new Error(`Error creando usuario en Auth: ${authError.message}`)
    }

    console.log('✅ Usuario creado en Supabase Auth')

    // 2. Insertar en tabla usuarios con rol admin
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .insert([
        {
          id: authData.user.id,
          email: email,
          nombre: nombre,
          rol: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (userError) {
      throw new Error(`Error creando registro en tabla usuarios: ${userError.message}`)
    }

    console.log('✅ Registro creado en tabla usuarios con rol admin')
    console.log('🎉 ¡Administrador creado exitosamente!')
    console.log('')
    console.log('📋 Información del administrador:')
    console.log(`   Email: ${email}`)
    console.log(`   Nombre: ${nombre}`)
    console.log(`   ID: ${authData.user.id}`)
    console.log('')
    console.log('🔗 Puedes acceder al panel de administración en: /admin/login')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Función para verificar si ya existe un admin
async function checkExistingAdmin(email) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre')
      .eq('email', email)
      .eq('rol', 'admin')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error verificando admin existente:', error)
    return null
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.log('📝 Uso: node scripts/create-admin.js <email> <password> <nombre>')
    console.log('')
    console.log('Ejemplo:')
    console.log('node scripts/create-admin.js admin@ejemplo.com "MiContraseña123" "Juan Pérez"')
    console.log('')
    console.log('⚠️  Nota: La contraseña debe tener al menos 6 caracteres')
    process.exit(1)
  }

  const [email, password, nombre] = args

  // Validaciones básicas
  if (password.length < 6) {
    console.error('❌ Error: La contraseña debe tener al menos 6 caracteres')
    process.exit(1)
  }

  if (!email.includes('@')) {
    console.error('❌ Error: El email no es válido')
    process.exit(1)
  }

  // Verificar si ya existe un admin con ese email
  const existingAdmin = await checkExistingAdmin(email)
  if (existingAdmin) {
    console.log('⚠️  Ya existe un administrador con ese email:')
    console.log(`   Email: ${existingAdmin.email}`)
    console.log(`   Nombre: ${existingAdmin.nombre}`)
    console.log(`   ID: ${existingAdmin.id}`)
    console.log('')
    console.log('¿Deseas continuar de todas formas? (y/N)')
    
    // En un script simple, asumimos que no queremos continuar
    console.log('❌ Operación cancelada')
    process.exit(1)
  }

  // Crear el administrador
  await createAdminUser(email, password, nombre)
}

// Ejecutar el script
if (require.main === module) {
  main()
}

module.exports = { createAdminUser } 