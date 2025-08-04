import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a response early so we can modify cookies
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    const pathname = request.nextUrl.pathname

    // Always allow static files and API routes
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/static/') ||
      pathname === '/favicon.ico'
    ) {
      return res
    }

    // Get session without refresh
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Middleware session:', session, 'Pathname:', pathname)

    // Define public routes
    const publicRoutes = [
      '/',
      '/pricing',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
    ]
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')
    if (isPublicRoute) {
      if (session && pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/discover', request.url))
      }
      return res
    }
    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url)
      if (!pathname.startsWith('/auth/')) {
        redirectUrl.searchParams.set('redirectTo', pathname)
      }
      return NextResponse.redirect(redirectUrl)
    }
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 