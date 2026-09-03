import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (
    pathname.startsWith('/write') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/profile')
  ) {
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === '/login') {
    if (sessionCookie) {
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
      return NextResponse.redirect(new URL(callbackUrl ?? '/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/write',
    '/write/:path*',
    '/admin/:path*',
    '/admin',
    '/profile',
    '/profile/:path*',
    '/login',
  ],
};
