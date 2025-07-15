'use server';

import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import bcryptjs from 'bcryptjs';

import { query } from '@/lib/db';
import { JWT_SECRET } from '@/lib/jwt-secret';
import { COOKIE_NAME, BCRYPT_SALT_ROUNDS } from '@/lib/constants';
import { logActivity as _logActivity } from '@/logic/log-act';

import {
    type User,
    type UserRole,
    type UserStatus,
    type SessionPayload,
    type CreateUserFormData,
    type ChangeUsernameFormData,
    type ChangePasswordFormData,
} from '@/lib/types';

export async function getCurrentUserAction(): Promise<User | null> {
    noStore();

    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    console.log(
        '[CurrentUserAction] Token from cookie:',
        token ? '✅ Token found' : '❌ No token',
    );

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const session = payload as unknown as SessionPayload;

        console.log('[CurrentUserAction] Decoded session payload:', session);

        const userId = Number(session.userId);
        if (isNaN(userId)) {
            console.warn(
                '[CurrentUserAction] Invalid userId in JWT payload:',
                session.userId,
            );
            return null;
        }

        const result = await query<User>(
            'SELECT id, username, role, status, created_at, updated_at FROM users WHERE id = $1 AND status = $2',
            [userId, 'active'],
        );

        if (result.rows.length === 0) {
            console.warn(
                '[CurrentUserAction] No active user found in DB for ID:',
                userId,
            );
            return null;
        }

        const user = result.rows[0];
        console.log('[CurrentUserAction] Authenticated user:', user.username);
        return user;
    } catch (error) {
        console.warn(
            '[CurrentUserAction] Failed to verify token or fetch user:',
            error,
        );
        return null;
    }
}

export async function fetchUsersAction(): Promise<User[]> {
    noStore();
    try {
        const result = await query<User>(
            'SELECT id, username, role, status, created_at, updated_at FROM users ORDER BY username ASC',
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        const dbError =
            error instanceof Error ? error.message : 'Unknown database error';
        throw new Error(
            `Gagal mengambil data pengguna dari database. Penyebab: ${dbError}. Pastikan tabel 'users' ada dan memiliki skema yang benar.`,
        );
    }
}

export async function createUserAction(
    formData: CreateUserFormData,
): Promise<User | { error: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser || currentUser.role !== 'admin') {
        return { error: 'Hanya admin yang dapat membuat pengguna baru.' };
    }

    try {
        const existingUser = await query(
            'SELECT id FROM users WHERE username = $1',
            [formData.username],
        );
        if (existingUser.rows.length > 0) {
            return {
                error: 'Username sudah digunakan. Silakan pilih username lain.',
            };
        }

        const hashedPassword = bcryptjs.hashSync(
            formData.password,
            BCRYPT_SALT_ROUNDS,
        );
        const role: UserRole = 'employee';

        const result = await query<User>(
            'INSERT INTO users (username, password_hash, role, status) VALUES ($1, $2, $3, $4) RETURNING id, username, role, status, created_at, updated_at',
            [formData.username, hashedPassword, role, formData.status],
        );

        if (result.rows.length > 0) {
            const createdUser = result.rows[0];
            await _logActivity(
                currentUser,
                'Created user account',
                `User: '${createdUser.username}' (ID: ${createdUser.id}), Role: '${createdUser.role}', Status: '${createdUser.status}'`,
            );
            revalidatePath('/admin/dashboard');
            revalidatePath('/admin/user-management');
            return createdUser;
        }
        return {
            error: 'Gagal membuat pengguna: Tidak ada baris yang dikembalikan.',
        };
    } catch (error) {
        console.error('Error creating user:', error);
        let errorMessage = 'Gagal membuat pengguna karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal membuat pengguna: ${error.message}`;
        }
        return { error: errorMessage };
    }
}

export async function updateUserStatusAction(
    userId: number,
    newStatus: UserStatus,
): Promise<User | { error: string }> {
    noStore();
    const performingAdmin = await getCurrentUserAction();
    if (!performingAdmin || performingAdmin.role !== 'admin') {
        return { error: 'Hanya admin yang dapat memperbarui status pengguna.' };
    }

    try {
        const targetUserResult = await query<User>(
            'SELECT username, role, status FROM users WHERE id = $1',
            [userId],
        );
        if (targetUserResult.rows.length === 0) {
            return { error: 'Pengguna target tidak ditemukan.' };
        }
        const targetUserCurrent = targetUserResult.rows[0];

        if (
            targetUserCurrent.role === 'admin' &&
            performingAdmin.id === userId &&
            targetUserCurrent.status === 'active' &&
            newStatus === 'suspended'
        ) {
            const activeAdminCountResult = await query<{ count: string }>(
                'SELECT COUNT(*) FROM users WHERE role = $1 AND status = $2',
                ['admin', 'active'],
            );
            if (parseInt(activeAdminCountResult.rows[0].count, 10) <= 1) {
                return {
                    error: 'Tidak dapat menangguhkan akun admin terakhir yang aktif.',
                };
            }
        }

        const result = await query<User>(
            'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, role, status, created_at, updated_at',
            [newStatus, userId],
        );
        if (result.rows.length > 0) {
            const updatedUser = result.rows[0];
            await _logActivity(
                performingAdmin,
                'Updated user account status',
                `User: '${updatedUser.username}' (ID: ${updatedUser.id}), Status changed from '${targetUserCurrent.status}' to '${updatedUser.status}'`,
            );
            revalidatePath('/admin/dashboard');
            revalidatePath('/admin/user-management');
            return updatedUser;
        }
        return {
            error: 'Gagal memperbarui status pengguna: Pengguna tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error updating user status:', error);
        let errorMessage =
            'Gagal memperbarui status pengguna karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal memperbarui status: ${error.message}`;
        }
        return { error: errorMessage };
    }
}

export async function changeUsernameAction(
    userId: number,
    formData: ChangeUsernameFormData,
): Promise<{ success: boolean; error?: string; user?: User }> {
    noStore();
    const performingAdmin = await getCurrentUserAction();
    if (!performingAdmin || performingAdmin.role !== 'admin') {
        return {
            success: false,
            error: 'Hanya admin yang dapat mengubah username pengguna.',
        };
    }

    try {
        const targetUserResult = await query<User>(
            'SELECT username FROM users WHERE id = $1',
            [userId],
        );
        if (targetUserResult.rows.length === 0) {
            return {
                success: false,
                error: 'Pengguna target tidak ditemukan.',
            };
        }
        const oldUsername = targetUserResult.rows[0].username;

        if (oldUsername === formData.username) {
            const updatedUserResult = await query<User>(
                'SELECT id, username, role, status, created_at, updated_at FROM users WHERE id = $1',
                [userId],
            );
            revalidatePath('/admin/user-management');
            return { success: true, user: updatedUserResult.rows[0] };
        }

        const existingUserWithNewName = await query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [formData.username, userId],
        );
        if (existingUserWithNewName.rows.length > 0) {
            return {
                success: false,
                error: 'Username baru sudah digunakan oleh pengguna lain.',
            };
        }

        const result = await query<User>(
            'UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, role, status, created_at, updated_at',
            [formData.username, userId],
        );

        if (result.rows.length > 0) {
            const updatedUser = result.rows[0];
            await _logActivity(
                performingAdmin,
                'Changed user username',
                `Username changed for user ID: ${userId} from '${oldUsername}' to '${updatedUser.username}'`,
            );
            revalidatePath('/admin/user-management');
            return { success: true, user: updatedUser };
        }
        return {
            success: false,
            error: 'Gagal mengubah username: Pengguna tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error changing user username:', error);
        let errorMessage = 'Gagal mengubah username karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal mengubah username: ${error.message}`;
        }
        return { success: false, error: errorMessage };
    }
}

export async function changeUserPasswordAction(
    userId: number,
    formData: ChangePasswordFormData,
): Promise<{ success: boolean; error?: string; username?: string }> {
    noStore();

    const performingAdmin = await getCurrentUserAction();
    if (!performingAdmin || performingAdmin.role !== 'admin') {
        return {
            success: false,
            error: 'Hanya admin yang dapat mengubah kata sandi pengguna.',
        };
    }

    if (!formData.password || formData.password.trim() === '') {
        return {
            success: false,
            error: 'Kata sandi tidak boleh kosong.',
        };
    }

    try {
        const targetUserResult = await query<{ username: string }>(
            'SELECT username FROM users WHERE id = $1',
            [userId],
        );

        if (targetUserResult.rows.length === 0) {
            return {
                success: false,
                error: 'Pengguna target tidak ditemukan.',
            };
        }

        const targetUsername = targetUserResult.rows[0].username;

        const newHashedPassword = await bcryptjs.hash(
            formData.password,
            BCRYPT_SALT_ROUNDS,
        );

        const result = await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newHashedPassword, userId],
        );

        const updatedRows = result?.rowCount ?? 0;
        if (updatedRows > 0) {
            await _logActivity(
                performingAdmin,
                'Changed user password',
                `Password changed for user: '${targetUsername}' (ID: ${userId})`,
            );

            revalidatePath('/admin/user-management');

            return { success: true, username: targetUsername };
        }

        return {
            success: false,
            error: 'Gagal mengubah kata sandi: Pengguna tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error changing user password:', error);

        return {
            success: false,
            error:
                error instanceof Error
                    ? `Gagal mengubah kata sandi: ${error.message}`
                    : 'Gagal mengubah kata sandi karena kesalahan tidak dikenal.',
        };
    }
}

export async function deleteUserAction(
    userId: number,
): Promise<{ success: boolean; error?: string; username?: string }> {
    noStore();

    const performingAdmin = await getCurrentUserAction();
    if (!performingAdmin || performingAdmin.role !== 'admin') {
        return {
            success: false,
            error: 'Hanya admin yang dapat menghapus pengguna.',
        };
    }

    if (performingAdmin.id === userId) {
        return {
            success: false,
            error: 'Admin tidak dapat menghapus akunnya sendiri.',
        };
    }

    try {
        const targetUserResult = await query<User>(
            'SELECT id, username, role, status FROM users WHERE id = $1',
            [userId],
        );

        if (targetUserResult.rows.length === 0) {
            return {
                success: false,
                error: 'Pengguna target tidak ditemukan.',
            };
        }

        const targetUser = targetUserResult.rows[0];

        if (targetUser.role === 'admin' && targetUser.status === 'active') {
            const adminCountResult = await query<{ count: string }>(
                'SELECT COUNT(*) FROM users WHERE role = $1 AND status = $2',
                ['admin', 'active'],
            );
            const adminCount = parseInt(
                adminCountResult.rows[0].count || '0',
                10,
            );
            if (adminCount <= 1) {
                return {
                    success: false,
                    error: 'Tidak dapat menghapus akun admin terakhir yang aktif.',
                };
            }
        }

        const result = await query('DELETE FROM users WHERE id = $1', [userId]);

        if (result.rowCount && result.rowCount > 0) {
            await _logActivity(
                performingAdmin,
                'Deleted user account',
                `Deleted user: '${targetUser.username}' (ID: ${targetUser.id}), Role: '${targetUser.role}'`,
            );

            revalidatePath('/admin/dashboard');
            revalidatePath('/admin/user-management');

            return { success: true, username: targetUser.username };
        }

        return {
            success: false,
            error: 'Gagal menghapus pengguna: Tidak ada baris yang terpengaruh.',
        };
    } catch (error) {
        console.error('Error deleting user:', error);

        const pgError = error as any;
        if (pgError?.code === '23503') {
            return {
                success: false,
                error: 'Pengguna memiliki data terkait seperti log aktivitas. Hapus atau ubah data tersebut terlebih dahulu, atau ubah foreign key ke ON DELETE CASCADE.',
            };
        }

        return {
            success: false,
            error:
                error instanceof Error
                    ? `Gagal menghapus pengguna: ${error.message}`
                    : 'Gagal menghapus pengguna karena kesalahan tak dikenal.',
        };
    }
}
