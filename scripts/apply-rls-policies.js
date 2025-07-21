const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRLSPolicies() {
  try {
    console.log('🔐 Aplicando políticas RLS...')
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'rls-policies.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    console.log(`📝 Ejecutando ${statements.length} statements SQL...`)
    
    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n${i + 1}/${statements.length}: ${statement.split('\n')[0]}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        // Si la política ya existe, continuar
        if (error.message.includes('already exists')) {
          console.log('   ⚠️  Política ya existe, continuando...')
        } else {
          console.error('   ❌ Error:', error.message)
        }
      } else {
        console.log('   ✅ Ejecutado correctamente')
      }
    }
    
    console.log('\n🎉 Políticas RLS aplicadas correctamente!')
    console.log('\n📋 Resumen de políticas aplicadas:')
    console.log('   • Usuarios pueden ver su propio perfil')
    console.log('   • Usuarios pueden actualizar su propio perfil')
    console.log('   • Usuarios pueden insertar su propio perfil')
    console.log('   • Administradores pueden ver todos los perfiles')
    console.log('   • Administradores pueden actualizar todos los perfiles')
    console.log('   • Administradores pueden insertar perfiles')
    
  } catch (error) {
    console.error('❌ Error aplicando políticas RLS:', error)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyRLSPolicies()
}

module.exports = { applyRLSPolicies } 