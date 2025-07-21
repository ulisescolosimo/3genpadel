const fs = require('fs')
const path = require('path')

// Archivos que necesitan actualización
const filesToUpdate = [
  'app/perfil/page.jsx',
  'app/inscripciones/ligas/[id]/page.jsx',
  'app/admin/inscripciones-ligas/page.jsx',
  'app/admin/inscripciones-ligas/detalle/[id]/page.jsx',
  'app/admin/inscripciones-ligas/categorias/page.jsx',
  'app/admin/inscripciones-ligas/categoria/[id]/page.jsx',
  'app/admin/dashboard/page.jsx',
  'app/admin/activaciones-cuentas/page.jsx',
  'app/auth/callback/page.jsx',
  'app/api/activar-cuenta/route.js',
  'app/api/check-users/route.js',
  'app/activar-cuenta/page.jsx'
]

// Reglas de reemplazo
const replacements = [
  // Cambiar referencias de tabla jugador a usuarios
  {
    from: /\.from\('jugador'\)/g,
    to: ".from('usuarios')"
  },
  {
    from: /\.from\("jugador"\)/g,
    to: '.from("usuarios")'
  },
  {
    from: /\.from\(`jugador`\)/g,
    to: '.from(`usuarios`)'
  },
  
  // Cambiar joins de jugador a usuarios
  {
    from: /titular_1:jugador!ligainscripciones_titular_1_id_fkey/g,
    to: 'titular_1:usuarios!ligainscripciones_titular_1_id_fkey'
  },
  {
    from: /titular_2:jugador!ligainscripciones_titular_2_id_fkey/g,
    to: 'titular_2:usuarios!ligainscripciones_titular_2_id_fkey'
  },
  {
    from: /suplente_1:jugador!ligainscripciones_suplente_1_id_fkey/g,
    to: 'suplente_1:usuarios!ligainscripciones_suplente_1_id_fkey'
  },
  {
    from: /suplente_2:jugador!ligainscripciones_suplente_2_id_fkey/g,
    to: 'suplente_2:usuarios!ligainscripciones_suplente_2_id_fkey'
  },
  
  // Cambiar referencias de jugador a usuario en variables
  {
    from: /const \[jugador,/g,
    to: 'const [usuario,'
  },
  {
    from: /setJugador\(/g,
    to: 'setUsuario('
  },
  {
    from: /jugador\?\./g,
    to: 'usuario?.'
  },
  {
    from: /jugador\./g,
    to: 'usuario.'
  },
  
  // Cambiar nombres de variables
  {
    from: /jugadorData/g,
    to: 'usuarioData'
  },
  {
    from: /jugadorError/g,
    to: 'usuarioError'
  },
  {
    from: /jugadorCreado/g,
    to: 'usuarioCreado'
  },
  {
    from: /jugadorUsuario/g,
    to: 'usuarioActual'
  },
  
  // Cambiar comentarios
  {
    from: /\/\/ Buscar jugador por email/g,
    to: '// Buscar usuario por email'
  },
  {
    from: /\/\/ Verificar si el usuario tiene DNI configurado en la tabla jugador/g,
    to: '// Verificar si el usuario tiene DNI configurado'
  },
  {
    from: /\/\/ Si no existe el jugador o no tiene DNI/g,
    to: '// Si no existe el usuario o no tiene DNI'
  },
  {
    from: /\/\/ DNI configurado correctamente/g,
    to: '// DNI configurado correctamente'
  },
  
  // Cambiar mensajes de error
  {
    from: /Error verificando jugador:/g,
    to: 'Error verificando usuario:'
  },
  {
    from: /Error obteniendo jugador:/g,
    to: 'Error obteniendo usuario:'
  },
  {
    from: /Error creando jugador:/g,
    to: 'Error creando usuario:'
  },
  {
    from: /Error actualizando jugador:/g,
    to: 'Error actualizando usuario:'
  },
  {
    from: /Error buscando jugador:/g,
    to: 'Error buscando usuario:'
  },
  
  // Cambiar referencias específicas
  {
    from: /jugador\.id/g,
    to: 'usuario.id'
  },
  {
    from: /jugador\.email/g,
    to: 'usuario.email'
  },
  {
    from: /jugador\.nombre/g,
    to: 'usuario.nombre'
  },
  {
    from: /jugador\.apellido/g,
    to: 'usuario.apellido'
  },
  {
    from: /jugador\.dni/g,
    to: 'usuario.dni'
  },
  {
    from: /jugador\.ranking_puntos/g,
    to: 'usuario.ranking_puntos'
  },
  {
    from: /jugador\.cuenta_activada/g,
    to: 'usuario.cuenta_activada'
  },
  {
    from: /jugador\.telefono/g,
    to: 'usuario.telefono'
  },
  {
    from: /jugador\.nivel/g,
    to: 'usuario.nivel'
  },
  {
    from: /jugador\.fecha_nacimiento/g,
    to: 'usuario.fecha_nacimiento'
  }
]

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`)
      return false
    }
    
    let content = fs.readFileSync(filePath, 'utf8')
    let originalContent = content
    let changes = 0
    
    // Aplicar todas las reglas de reemplazo
    replacements.forEach((replacement, index) => {
      const matches = content.match(replacement.from)
      if (matches) {
        content = content.replace(replacement.from, replacement.to)
        changes += matches.length
      }
    })
    
    // Solo escribir si hubo cambios
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ ${filePath} - ${changes} cambios aplicados`)
      return true
    } else {
      console.log(`ℹ️  ${filePath} - Sin cambios necesarios`)
      return false
    }
    
  } catch (error) {
    console.error(`❌ Error actualizando ${filePath}:`, error.message)
    return false
  }
}

function updateAllFiles() {
  console.log('🔄 Actualizando código después de la migración...')
  console.log('')
  
  let totalFiles = 0
  let updatedFiles = 0
  
  filesToUpdate.forEach(filePath => {
    totalFiles++
    if (updateFile(filePath)) {
      updatedFiles++
    }
  })
  
  console.log('')
  console.log(`📊 Resumen: ${updatedFiles}/${totalFiles} archivos actualizados`)
  console.log('')
  console.log('⚠️  IMPORTANTE: Revisa manualmente los cambios antes de hacer commit')
  console.log('   Algunos cambios pueden requerir ajustes adicionales')
  console.log('')
  console.log('🔍 Archivos que necesitan revisión manual:')
  console.log('- Verificar que las consultas SQL funcionan correctamente')
  console.log('- Verificar que las referencias a campos específicos son correctas')
  console.log('- Verificar que los nombres de variables son consistentes')
  console.log('- Verificar que los mensajes de error son apropiados')
}

function showUsage() {
  console.log('📖 Uso del script:')
  console.log('  node scripts/update-code-after-migration.js')
  console.log('')
  console.log('⚠️  IMPORTANTE:')
  console.log('1. Ejecuta este script DESPUÉS de la migración de la base de datos')
  console.log('2. Revisa manualmente todos los cambios antes de hacer commit')
  console.log('3. Prueba la aplicación para asegurar que funciona correctamente')
  console.log('')
  console.log('📋 Archivos que se actualizarán:')
  filesToUpdate.forEach(file => console.log(`  - ${file}`))
}

// Función principal
function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'update':
      updateAllFiles()
      break
    case 'list':
      console.log('📋 Archivos que se actualizarán:')
      filesToUpdate.forEach(file => console.log(`  - ${file}`))
      break
    default:
      showUsage()
      break
  }
}

main() 