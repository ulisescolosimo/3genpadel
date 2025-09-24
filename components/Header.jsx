"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, LogOut, ShoppingBag, User, Home, Trophy, X, Bell, Users, Mail, Settings, MapPin, Medal, BookOpen, ChevronDown, LogIn, Handshake, Gamepad2, Building2, Store, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import LiveMatchTicker from './LiveMatchTicker'
import NotificationDropdown from './NotificationDropdown'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/components/AuthProvider'

export default function Header() {
  const { user, loading } = useAuth()
  const [userData, setUserData] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  useEffect(() => {
    const getUserData = async () => {
      // Si hay usuario autenticado, obtener datos de la tabla usuarios
      if (user) {
        try {
          const { data: userDataFromDB, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('Error fetching user data:', error)
            // Si no encuentra por ID, intentar por email como fallback
            const { data: userDataByEmail, error: emailError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('email', user.email.toLowerCase())
              .single()
            
            if (emailError) {
              console.error('Error fetching user data by email:', emailError)
              // Si no encuentra el usuario, no mostrar error, solo no establecer userData
              // El usuario será creado cuando acceda al perfil
            } else {
              setUserData(userDataByEmail)
            }
          } else {
            setUserData(userDataFromDB)
          }
        } catch (error) {
          console.error('Error getting user data:', error)
          // No mostrar error al usuario, solo log
        }
      } else {
        setUserData(null)
      }
    }

    getUserData()
  }, [user])

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al iniciar sesión"
      })
      console.error('Error:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUserData(null)
      router.push('/')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cerrar sesión"
      })
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

  const getUserDisplayName = () => {
    if (userData?.nombre) {
      return userData.nombre
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    return user?.email || 'Usuario'
  }

  const getUserEmail = () => {
    return user?.email || ''
  }

  const getUserAvatar = () => {
    if (userData?.avatar_url) {
      return userData.avatar_url
    }
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    return null
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
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <img src="/images/logo/logo.png" alt="3gen Padel" className="h-8" />
            <span className="text-2xl font-bold text-white">
              <span className="text-[#E2FF1B]">3gen</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between gap-8 w-full">
            {/* Logo Section */}
            <div>
              <Link href="/" className="flex items-center gap-2">
                <img src="/images/logo/logo.png" alt="3gen Padel" className="h-8" />
                <span className="text-2xl font-bold text-white">
                  <span className="text-[#E2FF1B]">3gen</span>
                </span>
              </Link>
            </div>
            
            {/* Navigation Section */}
            <div className="flex items-center gap-6">
              {/* Torneos Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/inscripciones') || isActive('/rankings') || isActive('/partidos') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                  >
                    <Trophy className="w-4 h-4" />
                    Torneos
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/inscripciones" className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Ligas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rankings" className="flex items-center gap-2">
                      <Medal className="w-4 h-4" />
                      Rankings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/partidos" className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Partidos
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Actividades Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/academia') || isActive('/sede-olleros') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Actividades
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/academia" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Academia
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sede-olleros/entrenamientos-grupales" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Entrenamientos Grupales
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sede-olleros/clases-privadas" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Clases Privadas
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quiénes somos */}
              <Link 
                href="/quienes-somos" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/quienes-somos') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
              >
                <Users className="w-4 h-4" />
                Quiénes somos
              </Link>

              {/* Sponsors */}
              <Link 
                href="/sponsors" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/sponsors') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
              >
                <Handshake className="w-4 h-4" />
                Sponsors
              </Link>

              {/* Merchandising */}
              <Link 
                href="/merchandising" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/merchandising') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
              >
                <ShoppingBag className="w-4 h-4" />
                Merchandising
              </Link>

              {/* Sedes Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] text-white/70"
                  >
                    <MapPin className="w-4 h-4" />
                    Sedes
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/sede-olleros" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Sede Olleros</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a 
                      href="https://atcsports.io/venues/normanda-caba" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>La Normanda</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Contacto */}
              <Link 
                href="/contacto" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/contacto') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
              >
                <Mail className="w-4 h-4" />
                Contacto
              </Link>
            </div>

            {/* User Section */}
            <div>
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <NotificationDropdown isMobile={false} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="relative h-8 w-8 rounded-full focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-transparent"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={getUserAvatar()}
                              alt={getUserDisplayName()}
                            />
                            <AvatarFallback>
                              {getInitials(getUserDisplayName())}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-xs leading-none text-gray-400">
                              {getUserEmail()}
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
                  </>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="group relative px-4 py-1.5 text-xs font-medium bg-white/5 text-white hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <LogIn className="w-4 h-4" />
                          Iniciar sesión
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuItem onClick={handleSignIn}>
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
                        <span>Google</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        router.push("/login")
                        closeMenu()
                      }}>
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Login</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-3">
            {user && <NotificationDropdown isMobile={true} />}
            <button 
              className="text-white/70 hover:text-[#E2FF1B] transition-colors"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm border-t border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              {/* Torneos Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E2FF1B] uppercase tracking-wider">
                  <Trophy className="w-3 h-3" />
                  Torneos
                </div>
                <div className="ml-4 space-y-1">
                  <Link 
                    href="/inscripciones" 
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/inscripciones') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                    onClick={closeMenu}
                  >
                    <Trophy className="w-4 h-4" />
                    Ligas
                  </Link>
                  <Link 
                    href="/rankings" 
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/rankings') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                    onClick={closeMenu}
                  >
                    <Medal className="w-4 h-4" />
                    Rankings
                  </Link>
                  <Link 
                    href="/partidos" 
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/partidos') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                    onClick={closeMenu}
                  >
                    <Trophy className="w-4 h-4" />
                    Partidos
                  </Link>
                </div>
              </div>

              {/* Actividades Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E2FF1B] uppercase tracking-wider">
                  <BookOpen className="w-3 h-3" />
                  Actividades
                </div>
                <div className="ml-4 space-y-1">
                  <Link 
                    href="/academia" 
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/academia') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                    onClick={closeMenu}
                  >
                    <BookOpen className="w-4 h-4" />
                    Academia
                  </Link>
                  <Link 
                    href="/sede-olleros/entrenamientos-grupales" 
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/sede-olleros/entrenamientos-grupales') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                    onClick={closeMenu}
                  >
                    <Users className="w-4 h-4" />
                    Entrenamientos Grupales
                  </Link>
                  <Link 
                    href="/sede-olleros/clases-privadas" 
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/sede-olleros/clases-privadas') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                    onClick={closeMenu}
                  >
                    <User className="w-4 h-4" />
                    Clases Privadas
                  </Link>
                </div>
              </div>

              {/* Quiénes somos */}
              <Link 
                href="/quienes-somos" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/quienes-somos') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                onClick={closeMenu}
              >
                <Users className="w-4 h-4" />
                Quiénes somos
              </Link>

              {/* Sponsors */}
              <Link 
                href="/sponsors" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/sponsors') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                onClick={closeMenu}
              >
                <Handshake className="w-4 h-4" />
                Sponsors
              </Link>

              {/* Merchandising */}
              <Link 
                href="/merchandising" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/merchandising') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                onClick={closeMenu}
              >
                <ShoppingBag className="w-4 h-4" />
                Merchandising
              </Link>

              {/* Sedes Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E2FF1B] uppercase tracking-wider">
                  <MapPin className="w-3 h-3" />
                  Sedes
                </div>
                <div className="ml-4 space-y-1">
                  <Link 
                    href="/sede-olleros" 
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/sede-olleros') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                    onClick={closeMenu}
                  >
                    <MapPin className="w-4 h-4" />
                    Sede Olleros
                  </Link>
                  <a 
                    href="https://atcsports.io/venues/normanda-caba" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-[#E2FF1B] transition-colors"
                    onClick={closeMenu}
                  >
                    <MapPin className="w-4 h-4" />
                    La Normanda
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Contacto */}
              <Link 
                href="/contacto" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#E2FF1B] ${isActive('/contacto') ? 'text-[#E2FF1B]' : 'text-white/70'}`}
                onClick={closeMenu}
              >
                <Mail className="w-4 h-4" />
                Contacto
              </Link>
              
              {/* User Section - Mobile */}
              {user ? (
                <>
                  <div className="border-t border-white/10 pt-4 mt-2">
                    <Link 
                      href="/perfil" 
                      className="flex items-center gap-3 mb-3 hover:bg-white/5 p-2 rounded-lg transition-colors"
                      onClick={closeMenu}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getUserAvatar()}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback>
                          {getInitials(getUserDisplayName())}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {getUserEmail()}
                        </p>
                      </div>
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
                      Cerrar sesión
                    </Button>
                  </div>
                </>
              ) : (
                <div className="border-t border-white/10 pt-4 mt-2">
                  <div className="space-y-2">
                    <Button 
                      onClick={() => {
                        handleSignIn()
                        closeMenu()
                      }}
                      className="w-full group relative px-4 py-2 text-sm font-medium bg-white/5 text-white hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
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
                        Iniciar sesión con Google
                      </span>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        router.push("/login")
                        closeMenu()
                      }}
                      className="w-full px-4 py-2 text-sm font-medium border-white/20 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
} 