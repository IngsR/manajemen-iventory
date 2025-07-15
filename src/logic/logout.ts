'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUserAction } from './user'; // Pastikan fungsi ini ada
import { logActivity } from './log-act'; // Modular log
import { COOKIE_NAME } from '@/lib/constants'; // Kalau kamu pisahkan konstanta

export async function logoutAction(): Promise<never> {
    noStore();

    try {
        const currentUser = await getCurrentUserAction();
        const cookieStore = await cookies(); // jangan lupa `await`

        cookieStore.delete(COOKIE_NAME);

        if (currentUser) {
            await logActivity(currentUser, 'User logged out');
        }

        console.log('[Logout] Logout berhasil, redirecting...');
    } catch (error) {
        console.error('[LogoutError] Gagal logout:', error);
    }

    redirect('/login');
}
