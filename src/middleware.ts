import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || 'attendiq_session';

/** Pages that should only be shown to unauthenticated users */
const GUEST_ONLY = ['/login', '/signup', '/verify-email'];

/** Paths that should be excluded from auth checks entirely */
const PUBLIC_PREFIXES = ['/api/', '/_next/', '/favicon', '/logo'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public/static/API paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(AUTH_COOKIE);
  const isGuestPage = GUEST_ONLY.some((p) => pathname === p);

  // Unauthenticated user trying to access a protected page → redirect to login
  if (!hasSession && !isGuestPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login/signup → redirect to dashboard
  if (hasSession && isGuestPage) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/';
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
