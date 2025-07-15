'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { query } from '@/lib/db';
import type {
    LoginFormSchemaType,
    SessionPayload,
    User,
    UserRole,
    UserStatus,
} from '@/lib/types';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import bcryptjs from 'bcryptjs';
import { JWT_SECRET } from '@/lib/jwt-secret';
import { COOKIE_NAME } from '@/lib/constants'; // 👈 jika kamu pisahkan konstan cookie
import { logActivity } from './log-act'; // 👈 pastikan ini jalan, atau sesuaikan path

interface LoginResult {
    success: boolean;
    message: string;
    user?: Pick<User, 'id' | 'username' | 'role'>;
}

export async function loginAction(
    formData: LoginFormSchemaType,
): Promise<LoginResult> {
    noStore();

    console.log('[LoginAttempt] Received login data:', {
        username: formData.username,
        passwordProvided: formData.password ? 'Yes' : 'No',
    });

    try {
        const userResult = await query<{
            id: number;
            username: string;
            password_hash: string;
            role: UserRole;
            status: string;
        }>(
            'SELECT id, username, password_hash, role, status FROM users WHERE username = $1',
            [formData.username],
        );

        if (userResult.rows.length === 0) {
            console.log('[LoginAttempt] User not found:', formData.username);
            return { success: false, message: 'Username atau password salah.' };
        }

        const userFromDb = userResult.rows[0];

        const isValidPassword = await bcryptjs.compare(
            formData.password,
            userFromDb.password_hash,
        );

        if (!isValidPassword) {
            console.warn(
                `[LoginAttempt] Password mismatch for ${userFromDb.username}`,
            );
            return { success: false, message: 'Username atau password salah.' };
        }

        if (userFromDb.status !== 'active') {
            console.warn(
                '[LoginAttempt] User is not active:',
                userFromDb.status,
            );
            return {
                success: false,
                message: 'Akun Anda tidak aktif. Hubungi administrator.',
            };
        }

        const user: User = {
            id: userFromDb.id,
            username: userFromDb.username,
            role: userFromDb.role,
            status: userFromDb.status as UserStatus,
            created_at: '',
            updated_at: '',
        };

        const sessionPayload: SessionPayload = {
            userId: user.id,
            role: user.role,
        };

        const token = await new SignJWT(sessionPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            path: '/',
        });

        await logActivity(user, 'User logged in');

        return {
            success: true,
            message: 'Login berhasil!',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        };
    } catch (error) {
        console.error('[LoginAttempt] Unexpected error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan saat mencoba login.',
        };
    }
}
