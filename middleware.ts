import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public access to PWA files and static assets
  if (pathname.startsWith('/manifest.json') || 
      pathname.startsWith('/manifest.webmanifest') ||
      pathname.startsWith('/sw.js') ||
      pathname.startsWith('/workbox-') ||
      pathname.startsWith('/icons/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname === '/') {
    return NextResponse.next()
  }
  
  // Check if user is authenticated by looking for the token cookie
  const token = request.cookies.get('token')
  
  // If user is not authenticated and trying to access protected routes
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/contacts') || pathname.startsWith('/activities') || pathname.startsWith('/tags') || pathname.startsWith('/profile'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (token && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/contacts/:path*', 
    '/activities/:path*',
    '/tags/:path*',
    '/profile/:path*',
    '/auth/role-selection'
  ]
}
