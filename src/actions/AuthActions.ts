'use server';

import { getUserCollection } from '@/models/UserModel';
import {
    verifyPassword,
    signToken,
    setSessionCookie,
    clearSessionCookie,
    getCurrentUser,
    SessionPayload,
} from '@/lib/Auth';
import { createAuditLog } from '@/services/AuditLogService';

export interface AuthUserSummary {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface AuthResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function loginAction(formData: FormData): Promise<AuthResponse<AuthUserSummary>> {
    try {
        const email = (formData.get('email') as string)?.trim().toLowerCase();
        const password = formData.get('password') as string;

        if (!email || !password) {
            return { success: false, error: 'Email dan password wajib diisi.' };
        }

        const users = await getUserCollection();
        const user = await users.findOne({ email });

        // Generic error message to prevent account enumeration
        const GENERIC_ERROR = 'Email atau password salah.';

        if (!user) {
            return { success: false, error: GENERIC_ERROR };
        }

        if (user.status !== 'ACTIVE') {
            return { success: false, error: GENERIC_ERROR };
        }

        const isMatch = await verifyPassword(password, user.passwordHash);
        if (!isMatch) {
            return { success: false, error: GENERIC_ERROR };
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        const exp = nowSeconds + 60 * 60 * 24 * 7; // 7 days

        const payload: SessionPayload = {
            userId: user._id.toHexString(),
            email: user.email,
            role: user.role,
            name: user.name,
            exp,
        };

        const token = signToken(payload);
        await setSessionCookie(token);

        // Audit login
        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'LOGIN',
            resource: 'AUTH',
            resourceId: user._id.toHexString(),
            details: { email: user.email },
        });

        return {
            success: true,
            data: {
                id: user._id.toHexString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    } catch (err) {
        console.error('[loginAction error]', err);
        return { success: false, error: 'Terjadi kesalahan sistem saat proses login.' };
    }
}

export async function logoutAction(): Promise<AuthResponse<null>> {
    try {
        const user = await getCurrentUser();
        if (user) {
            await createAuditLog({
                actorId: user._id,
                actorName: user.name,
                actorRole: user.role,
                action: 'LOGOUT',
                resource: 'AUTH',
                resourceId: user._id.toHexString(),
            });
        }
        await clearSessionCookie();
        return { success: true, data: null };
    } catch (err) {
        console.error('[logoutAction error]', err);
        return { success: false, error: 'Gagal logout.' };
    }
}

export async function getCurrentUserAction(): Promise<AuthResponse<AuthUserSummary | null>> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: true, data: null };
        }
        return {
            success: true,
            data: {
                id: user._id.toHexString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    } catch {
        return { success: true, data: null };
    }
}
