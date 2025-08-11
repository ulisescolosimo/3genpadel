import { supabase } from './supabase'

/**
 * Función helper para manejar perfiles de ranking (incluyendo perfiles "fantasma")
 * @param {Object} jugador - Objeto con datos del jugador
 * @param {number} puntos - Puntos a sumar
 * @param {string} categoria - Categoría del ranking
 * @returns {Object} Resultado de la operación
 */
export const handleRankingProfile = async (jugador, puntos, categoria) => {
  try {
    console.log(`🔄 handleRankingProfile llamado para ${jugador.nombre} ${jugador.apellido}`)
    console.log(`📊 Puntos a sumar: ${puntos}, Categoría: ${categoria}`)
    
    // PRIMERO: Verificar si ya existe un perfil vinculado para este usuario en la misma categoría
    if (jugador.usuario_id) {
      console.log(`👤 Jugador con cuenta vinculada: ${jugador.usuario_id}`)
      
      // Buscar si ya existe un perfil vinculado en la misma categoría
      const { data: existingLinkedProfile, error: linkedSearchError } = await supabase
        .from('ranking_jugadores')
        .select('id, puntos')
        .eq('usuario_id', jugador.usuario_id)
        .eq('categoria', categoria)
        .single()

      if (!linkedSearchError && existingLinkedProfile) {
        console.log(`📈 Perfil vinculado encontrado - actualizando puntos: ${existingLinkedProfile.puntos} + ${puntos} = ${existingLinkedProfile.puntos + puntos}`)
        
        // Existe perfil vinculado, actualizar puntos
        const { error: updateError } = await supabase
          .from('ranking_jugadores')
          .update({ 
            puntos: (existingLinkedProfile.puntos || 0) + puntos,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLinkedProfile.id)
        
        if (updateError) throw updateError
        console.log(`✅ Puntos actualizados en perfil vinculado: ${existingLinkedProfile.puntos + puntos}`)
        return { updated: true, points: existingLinkedProfile.puntos + puntos, wasLinked: true }
      }
    }

    // SEGUNDO: Si no hay perfil vinculado, buscar si existe un perfil fantasma con el mismo nombre en la misma categoría
    console.log(`🔍 Buscando perfil fantasma existente para ${jugador.nombre} ${jugador.apellido} en categoría ${categoria}`)
    
    const { data: existingGhostProfile, error: ghostSearchError } = await supabase
      .from('ranking_jugadores')
      .select('id, puntos, usuario_id')
      .eq('nombre', jugador.nombre)
      .eq('apellido', jugador.apellido)
      .eq('categoria', categoria)
      .is('usuario_id', null)
      .single()

    if (!ghostSearchError && existingGhostProfile) {
      console.log(`📈 Perfil fantasma encontrado - actualizando puntos: ${existingGhostProfile.puntos} + ${puntos} = ${existingGhostProfile.puntos + puntos}`)
      
      // Existe perfil fantasma, actualizar puntos
      const { error: updateError } = await supabase
        .from('ranking_jugadores')
        .update({ 
          puntos: (existingGhostProfile.puntos || 0) + puntos,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGhostProfile.id)
      
      if (updateError) throw updateError
      console.log(`✅ Puntos del perfil fantasma actualizados: ${existingGhostProfile.puntos + puntos}`)
      return { updated: true, points: existingGhostProfile.puntos + puntos, isGhost: true }
    }

    // TERCERO: Si no existe ningún perfil, crear uno nuevo
    console.log(`✨ No se encontró perfil existente - creando nuevo perfil para ${jugador.nombre}`)
    
    const newProfileData = {
      nombre: jugador.nombre,
      apellido: jugador.apellido,
      categoria: categoria,
      puntos: puntos,
      activo: true,
      usuario_id: jugador.usuario_id || null // null si es fantasma
    }

    const { error: insertError } = await supabase
      .from('ranking_jugadores')
      .insert(newProfileData)
    
    if (insertError) throw insertError
    
    if (jugador.usuario_id) {
      console.log(`✅ Nuevo perfil vinculado creado con ${puntos} puntos`)
      return { created: true, points: puntos, wasLinked: true }
    } else {
      console.log(`✅ Nuevo perfil fantasma creado con ${puntos} puntos`)
      return { created: true, points: puntos, isGhost: true }
    }
    
  } catch (error) {
    console.error('Error en handleRankingProfile:', error)
    throw error
  }
}

/**
 * Función para vincular un perfil fantasma a un usuario cuando se registre
 * @param {string} ghostProfileId - ID del perfil fantasma
 * @param {string} userId - ID del usuario a vincular
 * @returns {Object} Resultado de la operación
 */
export const linkGhostProfileToUser = async (ghostProfileId, userId) => {
  try {
    console.log(`🔗 Vinculando perfil fantasma ${ghostProfileId} con usuario ${userId}`)
    
    // Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('nombre, apellido')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Obtener la categoría del perfil fantasma
    const { data: ghostProfileData, error: ghostError } = await supabase
      .from('ranking_jugadores')
      .select('categoria, puntos')
      .eq('id', ghostProfileId)
      .single()

    if (ghostError) throw ghostError

    console.log(`📊 Perfil fantasma: ${ghostProfileData.categoria}, ${ghostProfileData.puntos} puntos`)

    // Verificar si ya existe un perfil vinculado para este usuario en la misma categoría
    const { data: existingLinkedProfile, error: existingError } = await supabase
      .from('ranking_jugadores')
      .select('id, puntos')
      .eq('usuario_id', userId)
      .eq('categoria', ghostProfileData.categoria)
      .single()

    if (!existingError && existingLinkedProfile) {
      console.log(`🔄 Perfil vinculado existente encontrado - fusionando puntos`)
      
      // Existe perfil vinculado, hacer merge de puntos
      const totalPoints = existingLinkedProfile.puntos + ghostProfileData.puntos

      // Sumar puntos del perfil fantasma al perfil vinculado
      const { error: updateError } = await supabase
        .from('ranking_jugadores')
        .update({ 
          puntos: totalPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLinkedProfile.id)

      if (updateError) throw updateError

      // Eliminar el perfil fantasma
      const { error: deleteError } = await supabase
        .from('ranking_jugadores')
        .delete()
        .eq('id', ghostProfileId)

      if (deleteError) throw deleteError

      console.log(`✅ Perfil fantasma vinculado y puntos fusionados: ${totalPoints} puntos totales`)
      return { 
        success: true, 
        message: 'Perfil fantasma vinculado y puntos fusionados',
        mergedPoints: totalPoints
      }
    } else {
      console.log(`✨ No hay perfil vinculado existente - vinculando perfil fantasma`)
      
      // No existe perfil vinculado, simplemente vincular el fantasma
      const { error: linkError } = await supabase
        .from('ranking_jugadores')
        .update({ 
          usuario_id: userId,
          nombre: userData.nombre,
          apellido: userData.apellido,
          updated_at: new Date().toISOString()
        })
        .eq('id', ghostProfileId)

      if (linkError) throw linkError

      console.log(`✅ Perfil fantasma vinculado exitosamente`)
      return { 
        success: true, 
        message: 'Perfil fantasma vinculado exitosamente'
      }
    }
  } catch (error) {
    console.error('Error vinculando perfil fantasma:', error)
    throw error
  }
}

/**
 * Función para detectar perfiles duplicados por nombre
 * @returns {Array} Array de grupos de perfiles duplicados
 */
export const findDuplicateProfiles = async () => {
  try {
    const { data: duplicates, error } = await supabase
      .from('ranking_jugadores')
      .select('id, nombre, apellido, categoria, puntos, usuario_id, created_at')
      .order('nombre')
      .order('apellido')

    if (error) throw error

    // Agrupar por nombre + apellido + categoría
    const grouped = duplicates.reduce((acc, profile) => {
      const key = `${profile.nombre}-${profile.apellido}-${profile.categoria}`
      if (!acc[key]) acc[key] = []
      acc[key].push(profile)
      return acc
    }, {})

    // Filtrar solo los que tienen duplicados
    const duplicatesOnly = Object.values(grouped).filter(group => group.length > 1)

    return duplicatesOnly
  } catch (error) {
    console.error('Error buscando duplicados:', error)
    throw error
  }
}

/**
 * Función para fusionar perfiles duplicados
 * @param {Array} profilesToMerge - Array de perfiles a fusionar
 * @returns {Object} Resultado de la operación
 */
export const mergeDuplicateProfiles = async (profilesToMerge) => {
  try {
    if (profilesToMerge.length < 2) {
      return { success: false, message: 'Se necesitan al menos 2 perfiles para fusionar' }
    }

    // Ordenar por fecha de creación (más antiguo primero)
    const sortedProfiles = profilesToMerge.sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    )

    const primaryProfile = sortedProfiles[0]
    const duplicateProfiles = sortedProfiles.slice(1)

    // Calcular puntos totales
    const totalPoints = sortedProfiles.reduce((sum, profile) => sum + (profile.puntos || 0), 0)

    // Actualizar el perfil principal con los puntos totales
    const { error: updateError } = await supabase
      .from('ranking_jugadores')
      .update({ 
        puntos: totalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', primaryProfile.id)

    if (updateError) throw updateError

    // Eliminar los perfiles duplicados
    const deletePromises = duplicateProfiles.map(profile =>
      supabase
        .from('ranking_jugadores')
        .delete()
        .eq('id', profile.id)
    )

    await Promise.all(deletePromises)

    return { 
      success: true, 
      message: `Perfiles fusionados. Total de puntos: ${totalPoints}`,
      primaryProfileId: primaryProfile.id
    }
  } catch (error) {
    console.error('Error fusionando perfiles:', error)
    throw error
  }
}

/**
 * Función para obtener todos los perfiles fantasma (sin usuario_id)
 * @returns {Array} Array de perfiles fantasma
 */
export const getGhostProfiles = async () => {
  try {
    const { data: ghostProfiles, error } = await supabase
      .from('ranking_jugadores')
      .select('id, nombre, apellido, categoria, puntos, created_at')
      .is('usuario_id', null)
      .order('nombre')
      .order('apellido')

    if (error) throw error
    return ghostProfiles
  } catch (error) {
    console.error('Error obteniendo perfiles fantasma:', error)
    throw error
  }
}

/**
 * Función para buscar perfiles por nombre y apellido
 * @param {string} nombre - Nombre del jugador
 * @param {string} apellido - Apellido del jugador
 * @returns {Array} Array de perfiles encontrados
 */
export const searchProfilesByName = async (nombre, apellido) => {
  try {
    console.log(`🔍 Buscando perfiles para: ${nombre} ${apellido}`)
    
    const { data: profiles, error } = await supabase
      .from('ranking_jugadores')
      .select('*')
      .ilike('nombre', `%${nombre}%`)
      .ilike('apellido', `%${apellido}%`)
      .order('categoria')
      .order('puntos', { ascending: false })

    if (error) throw error
    
    console.log(`📊 Encontrados ${profiles.length} perfiles`)
    return profiles
  } catch (error) {
    console.error('Error buscando perfiles por nombre:', error)
    throw error
  }
}

/**
 * Función para sincronizar automáticamente perfiles fantasma cuando un usuario se registra
 * @param {string} userId - ID del usuario registrado
 * @param {string} nombre - Nombre del usuario
 * @param {string} apellido - Apellido del usuario
 * @returns {Object} Resultado de la sincronización
 */
export const syncGhostProfilesForNewUser = async (userId, nombre, apellido) => {
  try {
    console.log(`🔄 Sincronizando perfiles fantasma para nuevo usuario: ${nombre} ${apellido}`)
    
    // Buscar todos los perfiles fantasma con el mismo nombre
    const { data: ghostProfiles, error: searchError } = await supabase
      .from('ranking_jugadores')
      .select('id, categoria, puntos')
      .eq('nombre', nombre)
      .eq('apellido', apellido)
      .is('usuario_id', null)

    if (searchError) throw searchError

    if (ghostProfiles.length === 0) {
      console.log(`ℹ️ No se encontraron perfiles fantasma para sincronizar`)
      return { success: true, message: 'No hay perfiles fantasma para sincronizar', syncedProfiles: 0 }
    }

    console.log(`📊 Encontrados ${ghostProfiles.length} perfiles fantasma para sincronizar`)

    let syncedCount = 0
    const results = []

    for (const ghostProfile of ghostProfiles) {
      try {
        const result = await linkGhostProfileToUser(ghostProfile.id, userId)
        if (result.success) {
          syncedCount++
          results.push({
            categoria: ghostProfile.categoria,
            puntos: ghostProfile.puntos,
            result: result
          })
        }
      } catch (profileError) {
        console.error(`❌ Error sincronizando perfil ${ghostProfile.id}:`, profileError)
        results.push({
          categoria: ghostProfile.categoria,
          puntos: ghostProfile.puntos,
          error: profileError.message
        })
      }
    }

    console.log(`✅ Sincronización completada: ${syncedCount}/${ghostProfiles.length} perfiles sincronizados`)
    
    return {
      success: true,
      message: `Sincronización completada: ${syncedCount} perfiles sincronizados`,
      syncedProfiles: syncedCount,
      totalProfiles: ghostProfiles.length,
      results: results
    }

  } catch (error) {
    console.error('Error en sincronización automática:', error)
    throw error
  }
}
