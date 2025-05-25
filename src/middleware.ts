import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import type { SessionPayload } from '@/lib/types';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-fallback-super-secret-key-32-chars',
);
const COOKIE_NAME = 'session';

async function verifySession(
    token: string | undefined,
): Promise<SessionPayload | null> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as SessionPayload;
    } catch (err) {
        console.warn('Middleware: JWT verification failed', err);
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

    if (isAdminPath) {
        if (userRole !== 'admin') {
            console.warn(
                `Unauthorized access attempt to ${pathname} by user ${session.userId} with role ${userRole}`,
            );
            return NextResponse.redirect(new URL('/', request.url));
        }
    } else if (isAppPath) {
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
