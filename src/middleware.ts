import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/** Routes that are always public — no auth redirect in either direction */
const ALWAYS_PUBLIC = ['/verify-email'];

/** Routes that redirect to dashboard if already authenticated */
const GUEST_ONLY = ['/login', '/signup', '/forgot-password', '/reset-password'];

/** Routes that don't need any auth check */
const PUBLIC_PREFIXES = ['/api/auth/callback'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Supabase auth callback and static assets through
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // We need to create a response first so we can mutate cookies
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired — required for Server Components to stay in sync
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Always-public routes — let through regardless of auth state
  if (ALWAYS_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return response;
  }

  const isGuestOnly = GUEST_ONLY.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isGuestOnly) {
    // Already signed in → redirect to dashboard
    if (user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // Protected route — no session → redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
