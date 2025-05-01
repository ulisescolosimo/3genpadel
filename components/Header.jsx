"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, LogOut, ShoppingBag, User, Home, Trophy, X, Bell, Users, Mail, Settings, MapPin } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import LiveMatchTicker from './LiveMatchTicker'
import { toast } from 'react-hot-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { handleAuthError } from "@/lib/supabase"

export default function Header() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${pathname}`
        }
      })
      if (error) throw error
    } catch (error) {
      toast.error('Error al iniciar sesión')
      console.error('Error:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      router.push('/')
    } catch (error) {
      toast.error('Error al cerrar sesión')
      console.error('Error:', error)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const isActive = (path) => {
    return pathname === path
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="h-8 w-32 bg-gray-800 animate-pulse rounded" />
            <div className="hidden md:flex items-center gap-6">
              <div className="h-4 w-20 bg-gray-800 animate-pulse rounded" />
              <div className="h-4 w-20 bg-gray-800 animate-pulse rounded" />
              <div className="h-4 w-20 bg-gray-800 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <LiveMatchTicker />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/logo/logo.png" alt="3gen Padel" className="h-8" />
            <span className="text-2xl font-bold text-white">
              <span className="text-[#E2FF1B]">3gen</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between flex-1">
            <div className="w-[200px]">
              {/* Espacio reservado para el logo */}
            </div>
            
            <div className="flex items-center gap-8">
              <Link 
                href="/" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
              >
                <Home className="w-4 h-4" />
                Inicio
              </Link>
              <Link 
                href="/torneos" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/torneos') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
              >
                <Trophy className="w-4 h-4" />
                Torneos
              </Link>
              <Link 
                href="/merchandising" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/merchandising') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
              >
                <ShoppingBag className="w-4 h-4" />
                Merchandising
              </Link>
              <Link 
                href="/nosotros" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/nosotros') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
              >
                <Users className="w-4 h-4" />
                Quiénes Somos
              </Link>
              <Link 
                href="/contacto" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/contacto') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
              >
                <Mail className="w-4 h-4" />
                Contacto
              </Link>
              <a 
                href="https://atcsports.io/venues/normanda-caba" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-[#E2FF1B] transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Sedes
              </a>
            </div>

            <div className="w-[200px] flex justify-end">
              {/* User Section */}
              <div className="flex items-center gap-4">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                            alt={user.user_metadata?.full_name || user.user_metadata?.name}
                          />
                          <AvatarFallback>
                            {getInitials(user.user_metadata?.full_name || user.user_metadata?.name)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.user_metadata?.full_name || user.user_metadata?.name}
                          </p>
                          <p className="text-xs leading-none text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        router.push("/perfil")
                        closeMenu()
                      }}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    onClick={handleSignIn}
                    className="group relative px-4 py-1.5 text-xs font-medium bg-white/5 text-white hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Iniciar Sesión
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white/70 hover:text-[#E2FF1B] transition-colors"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm border-t border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              <Link 
                href="/" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                onClick={closeMenu}
              >
                <Home className="w-4 h-4" />
                Inicio
              </Link>
              <Link 
                href="/torneos" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/torneos') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                onClick={closeMenu}
              >
                <Trophy className="w-4 h-4" />
                Torneos
              </Link>
              <Link 
                href="/merchandising" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/merchandising') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                onClick={closeMenu}
              >
                <ShoppingBag className="w-4 h-4" />
                Merchandising
              </Link>
              <Link 
                href="/nosotros" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/nosotros') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                onClick={closeMenu}
              >
                <Users className="w-4 h-4" />
                Quiénes Somos
              </Link>
              <Link 
                href="/contacto" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/contacto') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                onClick={closeMenu}
              >
                <Mail className="w-4 h-4" />
                Contacto
              </Link>
              <a 
                href="https://atcsports.io/venues/normanda-caba" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-[#E2FF1B] transition-colors"
                onClick={closeMenu}
              >
                <MapPin className="w-4 h-4" />
                Sedes
              </a>
              {user ? (
                <>
                  <Link 
                    href="/perfil" 
                    className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-[#E2FF1B] transition-colors"
                    onClick={closeMenu}
                  >
                    <User className="w-4 h-4" />
                    Mi Perfil
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      handleSignOut()
                      closeMenu()
                    }}
                    className="w-full text-red-400 hover:text-red-300 hover:bg-white/10 px-3 py-1 text-xs font-semibold rounded-full border border-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    handleSignIn()
                    closeMenu()
                  }}
                  className="w-full group relative px-4 py-1.5 text-xs font-medium bg-white/5 text-white hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Iniciar Sesión
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
} 