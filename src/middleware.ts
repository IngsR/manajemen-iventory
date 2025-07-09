import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import type { SessionPayload } from '@/lib/types';

const COOKIE_NAME = 'session';

const JWT_SECRET_KEY = process.env.JWT_SECRET;

if (!JWT_SECRET_KEY || JWT_SECRET_KEY.length < 32) {
    throw new Error(
        '[Middleware] JWT_SECRET is missing or too short (min 32 chars). Please set it in .env.local',
    );
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);

async function verifySession(
    token: string | undefined,
): Promise<SessionPayload | null> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as SessionPayload;
    } catch (err) {
        console.warn('[Middleware] JWT verification failed', err);
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = await verifySession(sessionToken);
    const userRole = session?.role;

    const isPublicPath = pathname === '/login';
    const isAdminPath = pathname.startsWith('/admin');
    const isAppPath =
        ['/', '/defective-items', '/statistics'].includes(pathname) ||
        pathname.startsWith('/api/');

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
            `Unauthorized access attempt to ${pathname} by user ${session.userId} with role ${userRole}`,
        );
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
