"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AuthButton() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) console.error('Error signing in:', error)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error)
    router.push('/')
  }

  if (loading) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {user.email}
          </span>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="border-[#E2FF1B]/20 text-white hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleSignIn}
          className="bg-[#E2FF1B] text-black hover:bg-yellow-400"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Iniciar Sesión con Google
        </Button>
      )}
    </div>
  )
} 