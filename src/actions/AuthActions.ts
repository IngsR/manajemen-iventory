'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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

// Result shape consumed by the login form's useActionState. On success the
// action redirects, so "error" is the only field the UI ever renders.
export interface LoginState {
    error?: string;
}

// Landing page per role. Keeps the redirect decision in one place.
const ROLE_HOME: Record<string, string> = {
    ADMIN: '/dashboard/admin',
    SUPERVISOR: '/dashboard/supervisor',
    PETUGAS: '/dashboard/petugas',
};

export async function loginAction(
    _prevState: LoginState | null,
    formData: FormData
): Promise<LoginState> {
    let destination: string;

    try {
        const email = (formData.get('email') as string)?.trim().toLowerCase();
        const password = formData.get('password') as string;

        if (!email || !password) {
            return { error: 'Email dan password wajib diisi.' };
        }

        const users = await getUserCollection();
        const user = await users.findOne({ email });

        // Generic error message to prevent account enumeration
        const GENERIC_ERROR = 'Email atau password salah.';

        if (!user) {
            return { error: GENERIC_ERROR };
        }

        if (user.status !== 'ACTIVE') {
            return { error: GENERIC_ERROR };
        }

        const isMatch = await verifyPassword(password, user.passwordHash);
        if (!isMatch) {
            return { error: GENERIC_ERROR };
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

        destination = ROLE_HOME[user.role] ?? '/';
    } catch (err) {
        console.error('[loginAction error]', err);
        return { error: 'Terjadi kesalahan sistem saat proses login.' };
    }

    // redirect() throws internally, so it must sit OUTSIDE the try block —
    // inside it, the catch would swallow the redirect and report a fake error.
    redirect(destination);
}

export async function logoutAction(): Promise<void> {
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
    } catch (err) {
        console.error('[logoutAction audit error]', err);
    }

    try {
        await clearSessionCookie();
    } catch (err) {
        console.error('[logoutAction clearSessionCookie error]', err);
    }

    revalidatePath('/', 'layout');
    redirect('/login');
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
