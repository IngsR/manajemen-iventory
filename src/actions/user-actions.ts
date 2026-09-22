'use server';

import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';
import { getUserCollection, UserDoc, UserRole, UserStatus } from '@/models/UserModel';
import { requirePermission, isAuthError, hashPassword } from '@/lib/Auth';
import { createAuditLog } from '@/services/AuditLogService';

export interface SafeUser {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}

export interface UserActionResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export async function getUsersAction(): Promise<UserActionResponse<SafeUser[]>> {
    try {
        await requirePermission('USER_VIEW');
        const col = await getUserCollection();
        const users = await col.find({}).sort({ createdAt: -1 }).toArray();

        const data: SafeUser[] = users.map((u) => ({
            _id: u._id.toHexString(),
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: u.updatedAt ? u.updatedAt.toISOString() : new Date().toISOString(),
        }));

        return { success: true, data };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        console.error('[getUsersAction]', err);
        return { success: false, error: 'Gagal mengambil data pengguna.' };
    }
}

export async function createUserAction(formData: FormData): Promise<UserActionResponse<{ userId: string }>> {
    try {
        const actor = await requirePermission('USER_CREATE');

        const name = (formData.get('name') as string)?.trim();
        const email = (formData.get('email') as string)?.trim().toLowerCase();
        const plainPassword = (formData.get('password') as string)?.trim();
        const role = (formData.get('role') as UserRole) || 'PETUGAS';

        if (!name || !email || !plainPassword) {
            return { success: false, error: 'Nama, email, dan password wajib diisi.' };
        }

        if (plainPassword.length < 6) {
            return { success: false, error: 'Password minimal 6 karakter.' };
        }

        const validRoles: UserRole[] = ['ADMIN', 'SUPERVISOR', 'PETUGAS'];
        if (!validRoles.includes(role)) {
            return { success: false, error: 'Peran tidak valid.' };
        }

        const col = await getUserCollection();
        const existing = await col.findOne({ email });
        if (existing) {
            return { success: false, error: 'Email sudah terdaftar.' };
        }

        const passwordHash = await hashPassword(plainPassword);
        const now = new Date();
        const newId = new ObjectId();

        const doc: UserDoc = {
            _id: newId,
            name,
            email,
            passwordHash,
            role,
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
        };

        await col.insertOne(doc);

        await createAuditLog({
            actorId: actor._id,
            actorName: actor.name,
            actorRole: actor.role,
            action: 'CREATE',
            resource: 'USER',
            resourceId: newId.toHexString(),
            details: { name, email, role, status: 'ACTIVE' },
            timestamp: now,
        });

        try {
            revalidatePath('/users');
            revalidatePath('/audit');
        } catch {}

        return { success: true, message: `Pengguna ${name} berhasil didaftarkan.`, data: { userId: newId.toHexString() } };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        console.error('[createUserAction]', err);
        return { success: false, error: 'Gagal mendaftarkan pengguna baru.' };
    }
}

export async function updateUserRoleAction(
    userId: string,
    newRole: UserRole
): Promise<UserActionResponse> {
    try {
        const actor = await requirePermission('USER_UPDATE');

        if (!ObjectId.isValid(userId)) {
            return { success: false, error: 'ID Pengguna tidak valid.' };
        }

        const validRoles: UserRole[] = ['ADMIN', 'SUPERVISOR', 'PETUGAS'];
        if (!validRoles.includes(newRole)) {
            return { success: false, error: 'Peran tidak valid.' };
        }

        const col = await getUserCollection();
        const userOid = new ObjectId(userId);
        const user = await col.findOne({ _id: userOid });
        if (!user) {
            return { success: false, error: 'Pengguna tidak ditemukan.' };
        }

        const oldRole = user.role;
        const now = new Date();

        await col.updateOne(
            { _id: userOid },
            {
                $set: {
                    role: newRole,
                    updatedAt: now,
                },
            }
        );

        await createAuditLog({
            actorId: actor._id,
            actorName: actor.name,
            actorRole: actor.role,
            action: 'UPDATE',
            resource: 'USER',
            resourceId: userId,
            details: { field: 'role', oldRole, newRole, email: user.email },
            timestamp: now,
        });

        try {
            revalidatePath('/users');
            revalidatePath('/audit');
        } catch {}

        return { success: true, message: `Peran berhasil diubah menjadi ${newRole}.` };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        console.error('[updateUserRoleAction]', err);
        return { success: false, error: 'Gagal memperbarui peran pengguna.' };
    }
}

export async function toggleUserStatusAction(
    userId: string,
    newStatus: UserStatus
): Promise<UserActionResponse> {
    try {
        const actor = await requirePermission('USER_UPDATE');

        if (!ObjectId.isValid(userId)) {
            return { success: false, error: 'ID Pengguna tidak valid.' };
        }

        const col = await getUserCollection();
        const userOid = new ObjectId(userId);
        const user = await col.findOne({ _id: userOid });
        if (!user) {
            return { success: false, error: 'Pengguna tidak ditemukan.' };
        }

        const now = new Date();

        await col.updateOne(
            { _id: userOid },
            {
                $set: {
                    status: newStatus,
                    updatedAt: now,
                },
            }
        );

        await createAuditLog({
            actorId: actor._id,
            actorName: actor.name,
            actorRole: actor.role,
            action: 'UPDATE',
            resource: 'USER',
            resourceId: userId,
            details: { field: 'status', oldStatus: user.status, newStatus, email: user.email },
            timestamp: now,
        });

        try {
            revalidatePath('/users');
            revalidatePath('/audit');
        } catch {}

        return { success: true, message: `Status pengguna berhasil diubah menjadi ${newStatus}.` };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        console.error('[toggleUserStatusAction]', err);
        return { success: false, error: 'Gagal memperbarui status pengguna.' };
    }
}
