import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Verifica si un usuario es administrador
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} true si es admin, false en caso contrario
 */
export async function esAdmin(userId) {
  try {
    if (!userId) return false

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', userId)
      .single()

    if (error || !usuario) return false

    return usuario.rol === 'admin'
  } catch (error) {
    console.error('Error al verificar admin:', error)
    return false
  }
}

/**
 * Obtiene el usuario autenticado desde el token
 * @param {Request} request - Request object
 * @returns {Promise<Object|null>} Usuario autenticado o null
 */
export async function obtenerUsuarioAutenticado(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) return null

    return user
  } catch (error) {
    console.error('Error al obtener usuario autenticado:', error)
    return null
  }
}

/**
 * Verifica si el usuario autenticado es admin
 * @param {Request} request - Request object
 * @returns {Promise<boolean>} true si es admin, false en caso contrario
 */
export async function verificarAdmin(request) {
  try {
    const user = await obtenerUsuarioAutenticado(request)
    if (!user) return false

    return await esAdmin(user.id)
  } catch (error) {
    console.error('Error al verificar admin:', error)
    return false
  }
}








