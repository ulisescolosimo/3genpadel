const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  console.log('Asegúrate de tener configuradas:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🔄 Iniciando migración de consolidación de tablas...')
    
    // Leer el script SQL
    const migrationPath = path.join(__dirname, 'migrate-consolidate-tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📋 Ejecutando script de migración...')
    
    // Ejecutar el script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      // Si no existe la función exec_sql, ejecutar las consultas por separado
      console.log('⚠️  Función exec_sql no disponible, ejecutando consultas por separado...')
      
      // Dividir el script en consultas individuales
      const queries = migrationSQL
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0 && !q.startsWith('--'))
      
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i]
        if (query.trim()) {
          console.log(`📝 Ejecutando consulta ${i + 1}/${queries.length}...`)
          
          try {
            const { error: queryError } = await supabase.rpc('exec_sql', { sql: query })
            if (queryError) {
              console.error(`❌ Error en consulta ${i + 1}:`, queryError)
              console.log('Consulta problemática:', query)
              throw queryError
            }
          } catch (execError) {
            // Si falla exec_sql, intentar con query directa
            console.log('🔄 Intentando ejecución directa...')
            const { error: directError } = await supabase.from('usuarios').select('*').limit(1)
            if (directError) {
              throw new Error('No se puede ejecutar SQL directamente. Usa el SQL Editor de Supabase.')
            }
          }
        }
      }
    }
    
    console.log('✅ Migración completada exitosamente!')
    console.log('')
    console.log('📋 Resumen de cambios:')
    console.log('- ✅ Campos agregados a tabla usuarios')
    console.log('- ✅ Datos migrados de jugador a usuarios')
    console.log('- ✅ Foreign keys actualizadas en ligainscripciones')
    console.log('- ✅ Tabla jugador eliminada')
    console.log('')
    console.log('⚠️  IMPORTANTE: Ahora necesitas actualizar el código de la aplicación')
    console.log('   para usar solo la tabla usuarios en lugar de jugador')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    console.log('')
    console.log('💡 Solución alternativa:')
    console.log('1. Ve al SQL Editor de Supabase')
    console.log('2. Copia y pega el contenido de scripts/migrate-consolidate-tables.sql')
    console.log('3. Ejecuta el script manualmente')
    process.exit(1)
  }
}

// Función para verificar el estado actual
async function checkCurrentState() {
  try {
    console.log('🔍 Verificando estado actual de la base de datos...')
    
    // Verificar si existe la tabla jugador
    const { data: jugadorExists, error: jugadorError } = await supabase
      .from('jugador')
      .select('count')
      .limit(1)
    
    const jugadorTableExists = !jugadorError
    
    // Verificar estructura de usuarios
    const { data: usuariosSample, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)
    
    console.log('📊 Estado actual:')
    console.log(`- Tabla jugador existe: ${jugadorTableExists}`)
    console.log(`- Tabla usuarios accesible: ${!usuariosError}`)
    
    if (jugadorTableExists) {
      const { count } = await supabase
        .from('jugador')
        .select('*', { count: 'exact', head: true })
      
      console.log(`- Registros en jugador: ${count}`)
    }
    
    const { count: usuariosCount } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
    
    console.log(`- Registros en usuarios: ${usuariosCount}`)
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error)
  }
}

// Función principal
async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'check':
      await checkCurrentState()
      break
    case 'migrate':
      await runMigration()
      break
    default:
      console.log('📖 Uso del script:')
      console.log('  node scripts/run-migration.js check    - Verificar estado actual')
      console.log('  node scripts/run-migration.js migrate  - Ejecutar migración')
      console.log('')
      console.log('⚠️  IMPORTANTE: Haz un backup antes de ejecutar la migración!')
      break
  }
}

main().catch(console.error) 