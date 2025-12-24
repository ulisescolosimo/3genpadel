import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Verifica si el usuario que hace la petición es un administrador
 * @param {Request} request - El objeto Request de Next.js
 * @returns {Promise<boolean>} - true si es admin, false en caso contrario
 */
export async function verificarAdmin(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return false
    }

    // Verificar que el usuario sea admin
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (usuarioError || !usuario || usuario.rol !== 'admin') {
      return false
    }

    return true
  } catch (error) {
    console.error('Error al verificar admin:', error)
    return false
  }
}
