'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [impersonatedUser, setImpersonatedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar sesión actual de forma más segura
    const checkUser = async () => {
      try {
        // Verificar si hay un usuario impersonado en localStorage
        const impersonatedUserData = localStorage.getItem('impersonated_user')
        if (impersonatedUserData) {
          try {
            const parsedUser = JSON.parse(impersonatedUserData)
            console.log('Impersonated user found:', parsedUser)
            // Verificar si el token no ha expirado
            if (parsedUser.expires && parsedUser.expires > Date.now()) {
              setImpersonatedUser(parsedUser)
              setUser(null) // No mostrar el usuario real cuando está impersonado
              console.log('Setting impersonated user:', parsedUser)
            } else {
              // Token expirado, limpiar
              console.log('Token expired, cleaning up')
              localStorage.removeItem('impersonated_user')
            }
          } catch (error) {
            console.error('Error parsing impersonated user:', error)
            localStorage.removeItem('impersonated_user')
          }
        }

        // Si no hay usuario impersonado, verificar sesión normal
        if (!impersonatedUserData) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Error getting session:', sessionError)
            setUser(null)
          } else if (session?.user) {
            setUser(session.user)
          } else {
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Solo actualizar si no hay usuario impersonado
      if (!impersonatedUser) {
        setUser(session?.user ?? null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Removemos impersonatedUser de las dependencias

  const value = {
    user: impersonatedUser || user,
    loading,
    impersonatedUser,
    signIn: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        return { data: null, error }
      }
    },
    signOut: async () => {
      try {
        // Si hay usuario impersonado, solo limpiar la impersonación
        if (impersonatedUser) {
          localStorage.removeItem('impersonated_user')
          setImpersonatedUser(null)
          router.push('/admin/dashboard')
          return
        }

        const { error } = await supabase.auth.signOut()
        if (error) throw error
        router.push('/admin/login')
      } catch (error) {
        console.error('Error signing out:', error)
      }
    },
    stopImpersonating: () => {
      localStorage.removeItem('impersonated_user')
      setImpersonatedUser(null)
      router.push('/admin/dashboard')
    },
    updateImpersonatedUser: (userData) => {
      // Solo actualizar si el usuario es diferente
      if (!impersonatedUser || impersonatedUser.id !== userData.id) {
        setImpersonatedUser(userData)
        setUser(null)
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 