import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import type { SessionPayload } from '@/lib/types';

const COOKIE_NAME = 'session';

const JWT_SECRET_KEY = process.env.JWT_SECRET;

let JWT_SECRET: Uint8Array | null = null;
if (JWT_SECRET_KEY && JWT_SECRET_KEY.length >= 32) {
    JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);
} else {
    console.warn(
        '[Middleware] JWT_SECRET is missing or too short (< 32 chars). Skipping auth middleware.',
    );
}

async function verifySession(
    token: string | undefined,
): Promise<SessionPayload | null> {
    if (!token || !JWT_SECRET) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as SessionPayload;
    } catch (err) {
        console.warn('[Middleware] JWT verification failed:', err);
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/assets')
    ) {
        return NextResponse.next();
    }

    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = await verifySession(sessionToken);
    const userRole = session?.role;

    const isPublicPath = pathname === '/login';
    const isAdminPath = pathname.startsWith('/admin');

    if (isPublicPath) {
        if (session) {
            const redirectUrl = userRole === 'admin' ? '/admin/dashboard' : '/';
            return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
        return NextResponse.next();
    }

    if (!session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectedFrom', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAdminPath && userRole !== 'admin') {
        console.warn(
            `Unauthorized access to ${pathname} by user ${session.userId} (${userRole})`,
        );
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
