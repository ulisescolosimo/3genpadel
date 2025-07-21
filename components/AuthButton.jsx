"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

export default function AuthButton() {
  const { user, loading } = useAuth()
  const router = useRouter()

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