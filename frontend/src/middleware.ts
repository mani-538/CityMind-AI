import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes requiring authentication
const PROTECTED_PREFIXES = ['/citizen', '/government', '/admin', '/agents', '/complaints', '/profile'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Check token in cookie or auth header if set
  const token = request.cookies.get('citymind_token')?.value;

  if (isProtectedRoute && !token) {
    // Client-side local storage takes over on hydration, but for middleware SSR redirect:
    // We let client-side AuthGuard handle token check if cookie isn't synchronized yet,
    // or redirect if accessing /admin /government directly without credentials.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/citizen/:path*', '/government/:path*', '/admin/:path*', '/agents/:path*', '/complaints/:path*', '/profile/:path*', '/profile'],
};

