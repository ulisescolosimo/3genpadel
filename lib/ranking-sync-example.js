/**
 * Ejemplos de uso del sistema de ranking con perfiles fantasma
 * 
 * Este archivo muestra cómo usar las funciones de sincronización
 * para vincular perfiles fantasma a usuarios registrados.
 */

import { 
  syncGhostProfilesForNewUser, 
  linkGhostProfileToUser, 
  searchProfilesByName,
  getGhostProfiles 
} from './ranking-utils'
import { supabase } from './supabase'

/**
 * EJEMPLO 1: Sincronización automática cuando un usuario se registra
 * 
 * Esta función se puede llamar automáticamente después de que un usuario
 * se registre en el sistema, para vincular todos sus perfiles fantasma.
 */
export const handleUserRegistration = async (userId, nombre, apellido) => {
  try {
    console.log(`🎉 Usuario registrado: ${nombre} ${apellido}`)
    
    // Sincronizar automáticamente todos los perfiles fantasma
    const syncResult = await syncGhostProfilesForNewUser(userId, nombre, apellido)
    
    if (syncResult.success) {
      console.log(`✅ Sincronización completada: ${syncResult.syncedProfiles} perfiles vinculados`)
      
      // Mostrar resultados detallados
      syncResult.results.forEach(result => {
        if (result.error) {
          console.warn(`⚠️ Error en categoría ${result.categoria}: ${result.error}`)
        } else {
          console.log(`✅ Categoría ${result.categoria}: ${result.puntos} puntos sincronizados`)
        }
      })
      
      return syncResult
    }
  } catch (error) {
    console.error('❌ Error en sincronización automática:', error)
    throw error
  }
}

/**
 * EJEMPLO 2: Vinculación manual de un perfil fantasma específico
 * 
 * Útil para casos donde el admin quiere vincular manualmente
 * un perfil fantasma a un usuario.
 */
export const manuallyLinkGhostProfile = async (ghostProfileId, userId) => {
  try {
    console.log(`🔗 Vinculando manualmente perfil fantasma ${ghostProfileId} a usuario ${userId}`)
    
    const result = await linkGhostProfileToUser(ghostProfileId, userId)
    
    if (result.success) {
      console.log(`✅ Perfil vinculado exitosamente`)
      if (result.mergedPoints) {
        console.log(`📊 Puntos fusionados: ${result.mergedPoints} totales`)
      }
    }
    
    return result
  } catch (error) {
    console.error('❌ Error en vinculación manual:', error)
    throw error
  }
}

/**
 * EJEMPLO 3: Búsqueda y vinculación de perfiles por nombre
 * 
 * Útil para casos donde el admin quiere buscar perfiles fantasma
 * por nombre y vincularlos a usuarios.
 */
export const searchAndLinkProfiles = async (nombre, apellido, userId) => {
  try {
    console.log(`🔍 Buscando perfiles para: ${nombre} ${apellido}`)
    
    // Buscar perfiles por nombre
    const profiles = await searchProfilesByName(nombre, apellido)
    
    if (profiles.length === 0) {
      console.log(`ℹ️ No se encontraron perfiles para ${nombre} ${apellido}`)
      return { success: false, message: 'No se encontraron perfiles' }
    }
    
    console.log(`📊 Encontrados ${profiles.length} perfiles`)
    
    // Filtrar solo perfiles fantasma (sin usuario_id)
    const ghostProfiles = profiles.filter(p => !p.usuario_id)
    
    if (ghostProfiles.length === 0) {
      console.log(`ℹ️ No hay perfiles fantasma para vincular`)
      return { success: false, message: 'No hay perfiles fantasma para vincular' }
    }
    
    console.log(`👻 Encontrados ${ghostProfiles.length} perfiles fantasma para vincular`)
    
    // Vincular cada perfil fantasma
    const results = []
    for (const ghostProfile of ghostProfiles) {
      try {
        const result = await linkGhostProfileToUser(ghostProfile.id, userId)
        results.push({
          categoria: ghostProfile.categoria,
          puntos: ghostProfile.puntos,
          result: result
        })
      } catch (profileError) {
        results.push({
          categoria: ghostProfile.categoria,
          puntos: ghostProfile.puntos,
          error: profileError.message
        })
      }
    }
    
    const successCount = results.filter(r => !r.error).length
    
    return {
      success: true,
      message: `Vinculación completada: ${successCount}/${ghostProfiles.length} perfiles vinculados`,
      results: results,
      totalProfiles: ghostProfiles.length,
      successCount: successCount
    }
    
  } catch (error) {
    console.error('❌ Error en búsqueda y vinculación:', error)
    throw error
  }
}

/**
 * EJEMPLO 4: Limpieza y mantenimiento de perfiles fantasma
 * 
 * Función para revisar y limpiar perfiles fantasma obsoletos.
 */
export const cleanupGhostProfiles = async () => {
  try {
    console.log(`🧹 Iniciando limpieza de perfiles fantasma`)
    
    // Obtener todos los perfiles fantasma
    const ghostProfiles = await getGhostProfiles()
    
    if (ghostProfiles.length === 0) {
      console.log(`ℹ️ No hay perfiles fantasma para limpiar`)
      return { success: true, message: 'No hay perfiles fantasma para limpiar' }
    }
    
    console.log(`📊 Encontrados ${ghostProfiles.length} perfiles fantasma`)
    
    // Agrupar por nombre + apellido
    const groupedProfiles = ghostProfiles.reduce((acc, profile) => {
      const key = `${profile.nombre}-${profile.apellido}`
      if (!acc[key]) acc[key] = []
      acc[key].push(profile)
      return acc
    }, {})
    
    // Mostrar grupos de perfiles fantasma
    Object.entries(groupedProfiles).forEach(([key, profiles]) => {
      console.log(`👤 ${key}: ${profiles.length} perfiles fantasma`)
      profiles.forEach(p => {
        console.log(`   - ${p.categoria}: ${p.puntos} puntos`)
      })
    })
    
    return {
      success: true,
      message: `Limpieza completada: ${ghostProfiles.length} perfiles fantasma revisados`,
      totalProfiles: ghostProfiles.length,
      groupedProfiles: groupedProfiles
    }
    
  } catch (error) {
    console.error('❌ Error en limpieza de perfiles fantasma:', error)
    throw error
  }
}

/**
 * EJEMPLO 5: Sincronización masiva para todos los usuarios
 * 
 * Función para sincronizar todos los usuarios registrados
 * con sus perfiles fantasma correspondientes.
 */
export const syncAllUsersWithGhostProfiles = async () => {
  try {
    console.log(`🔄 Iniciando sincronización masiva de usuarios`)
    
    // Obtener todos los usuarios registrados
    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido')
      .order('nombre')
    
    if (usersError) throw usersError
    
    if (users.length === 0) {
      console.log(`ℹ️ No hay usuarios registrados para sincronizar`)
      return { success: true, message: 'No hay usuarios para sincronizar' }
    }
    
    console.log(`📊 Sincronizando ${users.length} usuarios`)
    
    const results = []
    let successCount = 0
    
    for (const user of users) {
      try {
        const syncResult = await syncGhostProfilesForNewUser(user.id, user.nombre, user.apellido)
        
        if (syncResult.success && syncResult.syncedProfiles > 0) {
          successCount++
          console.log(`✅ ${user.nombre} ${user.apellido}: ${syncResult.syncedProfiles} perfiles sincronizados`)
        }
        
        results.push({
          user: user,
          syncResult: syncResult
        })
        
      } catch (userError) {
        console.error(`❌ Error sincronizando ${user.nombre} ${user.apellido}:`, userError)
        results.push({
          user: user,
          error: userError.message
        })
      }
    }
    
    console.log(`✅ Sincronización masiva completada: ${successCount}/${users.length} usuarios sincronizados`)
    
    return {
      success: true,
      message: `Sincronización masiva completada: ${successCount} usuarios sincronizados`,
      totalUsers: users.length,
      successCount: successCount,
      results: results
    }
    
  } catch (error) {
    console.error('❌ Error en sincronización masiva:', error)
    throw error
  }
}

// Exportar todas las funciones de ejemplo
export {
  handleUserRegistration,
  manuallyLinkGhostProfile,
  searchAndLinkProfiles,
  cleanupGhostProfiles,
  syncAllUsersWithGhostProfiles
}
