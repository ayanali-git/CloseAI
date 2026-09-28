import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { authCookieOptions } from '@/lib/auth-cookie';

export async function middleware(request: NextRequest) {
  // Skip middleware overhead for prefetch requests to prevent race conditions
  if (request.headers.get('x-middleware-prefetch') === '1' || request.headers.get('purpose') === 'prefetch') {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect /chat to /c for authenticated users or /gc for guests
  if (request.nextUrl.pathname === '/chat') {
    return NextResponse.redirect(new URL(user ? '/c' : '/gc', request.url));
  }

  // Redirect guest accessing /c to /gc (preserving query params)
  if (request.nextUrl.pathname.startsWith('/c') && !user) {
    const gcUrl = new URL('/gc', request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      gcUrl.searchParams.set(key, value);
    });
    const redirectRes = NextResponse.redirect(gcUrl);
    response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value));
    return redirectRes;
  }

  // Redirect authenticated user accessing /gc to /c
  if (request.nextUrl.pathname.startsWith('/gc') && user) {
    const redirectRes = NextResponse.redirect(new URL('/c', request.url));
    response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value));
    return redirectRes;
  }

  // If root page receives an OAuth `code` param, forward to /auth/callback so
  // the exchange happens properly and the raw code isn't exposed in the URL.
  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const callbackUrl = new URL('/auth/callback', request.url);
    // Carry over all query params (code, next, etc.)
    request.nextUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }

  // Purge any corrupted or bloated base64 data:image cookies
  const allCookies = request.cookies.getAll();
  allCookies.forEach(c => {
    if (c.value.length > 3000 && (c.value.includes('data%3Aimage') || c.value.includes('data:image'))) {
      response.cookies.delete(c.name);
    }
  });

  // If already logged in, redirect away from auth paths to /c (unless error param is present)
  const authPaths = ['/auth/login', '/auth/signup'];
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname === path);
  const hasAuthError = request.nextUrl.searchParams.has('error') || request.nextUrl.searchParams.has('error_code');
  if (isAuthPath && user && !hasAuthError) {
    const redirectRes = NextResponse.redirect(new URL('/c', request.url));
    response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value));
    return redirectRes;
  }

  // Eliminate standalone auth pages: redirect /auth/login and /auth/signup to root with modal triggers
  if (request.nextUrl.pathname === '/auth/login') {
    const targetUrl = new URL('/', request.url);
    targetUrl.searchParams.set('auth', 'login');
    request.nextUrl.searchParams.forEach((val, key) => {
      if (key !== 'auth') targetUrl.searchParams.set(key, val);
    });
    const redirectRes = NextResponse.redirect(targetUrl);
    response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value));
    return redirectRes;
  }

  if (request.nextUrl.pathname === '/auth/signup') {
    const targetUrl = new URL('/', request.url);
    targetUrl.searchParams.set('auth', 'signup');
    request.nextUrl.searchParams.forEach((val, key) => {
      if (key !== 'auth') targetUrl.searchParams.set(key, val);
    });
    const redirectRes = NextResponse.redirect(targetUrl);
    response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value));
    return redirectRes;
  }

  // Protected routes:
  // /c is accessible to guest users. Only saved chats (/c/:id) and private sections require auth.
  const isSavedChat = request.nextUrl.pathname.startsWith('/c/') && request.nextUrl.pathname !== '/c';
  const otherProtectedPaths = ['/upgrade'];
  const isOtherProtected = otherProtectedPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );
  const isProtected = isSavedChat || isOtherProtected;

  if (isProtected && !user) {
    const redirectRes = NextResponse.redirect(new URL('/?auth=login', request.url));
    return redirectRes;
  }

  return response;
}

export const config = {
  matcher: ['/', '/c', '/c/:path*', '/gc', '/gc/:path*', '/chat', '/settings', '/settings/:path*', '/upgrade', '/upgrade/:path*', '/auth/login', '/auth/signup'],
};

