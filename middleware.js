import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Rutas que requieren autenticación
  const protectedRoutes = [
    '/torneos/registro',
    '/torneos/mis-torneos',
    '/merchandising/carrito',
    '/merchandising/mis-pedidos'
  ]

  // Rutas que requieren ser administrador (verificación adicional en layout)
  const adminRoutes = [
    '/circuito3gen'
  ]

  // Si la ruta actual requiere autenticación y no hay sesión
  if (protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route)) && !session) {
    const redirectUrl = new URL('/auth/callback', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si la ruta actual requiere ser admin y no hay sesión, redirigir al home
  if (adminRoutes.some(route => req.nextUrl.pathname.startsWith(route)) && !session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Si hay una sesión y el usuario intenta acceder a login/registro
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/registro')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return response
}

export const config = {
  matcher: [
    '/torneos/registro/:path*',
    '/torneos/mis-torneos/:path*',
    '/merchandising/carrito/:path*',
    '/merchandising/mis-pedidos/:path*',
    '/circuito3gen/:path*',
    '/login',
    '/registro'
  ]
} 