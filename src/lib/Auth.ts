import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import { getUserCollection, UserDoc } from '@/models/UserModel';
import { Permission, hasPermission } from './Permissions';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_SECRET = process.env.SESSION_SECRET || 'inventory-secret-key-development-minimum-32-chars-long';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export class AuthError extends Error {
    constructor(
        public code: 'UNAUTHORIZED' | 'FORBIDDEN',
        message: string
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

export function isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
}

export interface SessionPayload {
    userId: string;
    email: string;
    role: string;
    name: string;
    exp: number;
}

// ── Password Hashing ─────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}

// ── Token Signing & Verification (Node crypto HMAC-SHA256) ───────────────────

function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
}

export function signToken(payload: SessionPayload): string {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64UrlEncode(JSON.stringify(payload));
    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(`${header}.${body}`);
    const signature = hmac.digest('base64url');
    return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [header, body, signature] = parts;
        const hmac = crypto.createHmac('sha256', SESSION_SECRET);
        hmac.update(`${header}.${body}`);
        const expectedSignature = hmac.digest('base64url');

        if (signature !== expectedSignature) return null;

        const payload: SessionPayload = JSON.parse(base64UrlDecode(body));
        if (Date.now() >= payload.exp * 1000) return null;

        return payload;
    } catch {
        return null;
    }
}

// ── Cookie Helpers ───────────────────────────────────────────────────────────

export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE_SECONDS,
    });
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
}

// ── Session & User Verification ──────────────────────────────────────────────

export async function getCurrentUser(explicitToken?: string): Promise<UserDoc | null> {
    let token = explicitToken;

    if (!token) {
        try {
            const cookieStore = await cookies();
            token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        } catch {
            // Not in Next.js request context (e.g. standalone test script)
            return null;
        }
    }

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || !ObjectId.isValid(payload.userId)) return null;

    const users = await getUserCollection();
    const user = await users.findOne({ _id: new ObjectId(payload.userId) });

    if (!user || user.status !== 'ACTIVE') {
        return null;
    }

    return user;
}

export async function requireAuth(explicitToken?: string): Promise<UserDoc> {
    const user = await getCurrentUser(explicitToken);
    if (!user) {
        throw new AuthError('UNAUTHORIZED', 'Silakan login terlebih dahulu untuk mengakses fitur ini.');
    }
    return user;
}

export async function requirePermission(
    permission: Permission,
    explicitToken?: string
): Promise<UserDoc> {
    const user = await requireAuth(explicitToken);
    if (!hasPermission(user.role, permission)) {
        throw new AuthError(
            'FORBIDDEN',
            `Akses ditolak: Peran '${user.role}' tidak memiliki izin '${permission}'.`
        );
    }
    return user;
}
