import { createClient } from '@supabase/supabase-js'

// Asegurarse de que las variables de entorno estén disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Función para verificar si estamos en el navegador
const isBrowser = () => typeof window !== 'undefined'

// Configuración del cliente de Supabase
const createSupabaseClient = () => {
  const options = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: isBrowser() ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce'
    }
  }

  return createClient(supabaseUrl, supabaseAnonKey, options)
}

// Crear una única instancia del cliente
export const supabase = createSupabaseClient()

// Cliente para el servidor
export const createServerClient = (cookies) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    cookies: {
      get(name) {
        return cookies.get(name)?.value
      },
      set(name, value, options) {
        cookies.set(name, value, options)
      },
      remove(name, options) {
        cookies.delete(name, options)
      },
    },
  })
}

// Función para manejar errores de autenticación
export const handleAuthError = (error) => {
  console.error('Error de autenticación:', error)

  if (error.message === 'JWT expired') {
    // En lugar de limpiar el localStorage, intentamos refrescar la sesión
    if (isBrowser()) {
      supabase.auth.refreshSession()
    }
  }

  return error
}

// Función para obtener la sesión actual
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error al obtener la sesión:', error)
    return null
  }
}

// Función para verificar si el usuario está autenticado
export const isAuthenticated = async () => {
  const session = await getCurrentSession()
  return !!session
}

// Función helper para obtener el usuario actual
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Función helper para manejar el refresh token
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error refreshing session:', error)
    return null
  }
} 