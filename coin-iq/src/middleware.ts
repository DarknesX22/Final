import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/session';
import { verifyAdminToken, getCurrentAdminFromCookie } from './lib/adminSession';

export function middleware(request: NextRequest) {
  // Define protected routes
  const protectedPaths = ['/dashboard', '/profile', '/settings', '/learn'];
  const adminPaths = ['/admin'];
  const adminLoginPath = '/admin/login';
  const isAuthenticatedPath = request.nextUrl.pathname.startsWith('/auth');
  
  // Check if the current path is protected
  const isProtected = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // Check if the current path is an admin path (excluding admin login page)
  const isAdminPath = adminPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  ) && !request.nextUrl.pathname.startsWith(adminLoginPath);

  // Get the auth token from cookies
  const token = request.cookies.get('auth_token')?.value;
  const adminToken = request.cookies.get('admin_auth_token')?.value;

  // Handle admin routes (excluding admin login page)
  if (isAdminPath) {
    if (!adminToken) {
      // No admin token, redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Verify the admin token (using sync version for middleware)
    const admin = getCurrentAdminFromCookie(request.headers.get('cookie'));
    if (!admin || !admin.isAdmin) {
      // Invalid admin token, redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Admin is authenticated, allow access
    return NextResponse.next();
  }

  // If accessing a protected route without a valid token, redirect to login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access login/signup while already authenticated, redirect to dashboard
  if (isAuthenticatedPath && token) {
    // Verify the token
    const user = verifyToken(token);
    if (user) {
      // User is authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Continue to the requested page
  return NextResponse.next();
}

// Define which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};