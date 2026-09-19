'use server';

import { ObjectId } from 'mongodb';
import { getCategoryCollection, CategoryDoc } from '@/models/CategoryModel';
import { getItemCollection } from '@/models/ItemModel';
import { revalidatePath } from 'next/cache';
import { requirePermission, isAuthError } from '@/lib/Auth';
import { createAuditLog } from '@/services/AuditLogService';

export interface ActionResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export async function getCategoriesAction(): Promise<ActionResponse<CategoryDoc[]>> {
    try {
        const collection = await getCategoryCollection();
        const categories = await collection
            .find({ isDeleted: false })
            .sort({ name: 1 })
            .toArray();

        // Convert ObjectId to string for client serialization
        const serialized = JSON.parse(JSON.stringify(categories));
        return { success: true, data: serialized };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function createCategoryAction(input: {
    code: string;
    name: string;
    description?: string;
}): Promise<ActionResponse<string>> {
    try {
        const user = await requirePermission('CATEGORY_CREATE');

        const code = input.code.trim().toUpperCase();
        const name = input.name.trim();

        if (!code || !name) {
            return { success: false, error: 'Kode dan Nama Kategori wajib diisi.' };
        }

        const collection = await getCategoryCollection();
        const existing = await collection.findOne({ code, isDeleted: false });
        if (existing) {
            return { success: false, error: `Kategori dengan kode "${code}" sudah terdaftar.` };
        }

        const now = new Date();
        const doc: CategoryDoc = {
            code,
            name,
            description: input.description?.trim(),
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(doc);

        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'CREATE',
            resource: 'CATEGORY',
            resourceId: result.insertedId.toHexString(),
            details: { code, name },
        });

        try { revalidatePath('/categories'); } catch {}
        return {
            success: true,
            data: result.insertedId.toHexString(),
            message: 'Kategori berhasil dibuat.',
        };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function updateCategoryAction(
    id: string,
    input: {
        name: string;
        description?: string;
        status: 'ACTIVE' | 'INACTIVE';
    }
): Promise<ActionResponse> {
    try {
        const user = await requirePermission('CATEGORY_UPDATE');

        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Kategori tidak valid.' };
        }

        const name = input.name.trim();
        if (!name) {
            return { success: false, error: 'Nama Kategori tidak boleh kosong.' };
        }

        const collection = await getCategoryCollection();
        const objId = new ObjectId(id);

        const oldCategory = await collection.findOne({ _id: objId, isDeleted: false });
        if (!oldCategory) {
            return { success: false, error: 'Kategori tidak ditemukan atau sudah dihapus.' };
        }

        const before: Record<string, unknown> = {};
        const after: Record<string, unknown> = {};

        if (oldCategory.name !== name) {
            before.name = oldCategory.name;
            after.name = name;
        }
        if ((oldCategory.description || '') !== (input.description?.trim() || '')) {
            before.description = oldCategory.description;
            after.description = input.description?.trim();
        }
        if (oldCategory.status !== input.status) {
            before.status = oldCategory.status;
            after.status = input.status;
        }

        await collection.updateOne(
            { _id: objId, isDeleted: false },
            {
                $set: {
                    name,
                    description: input.description?.trim(),
                    status: input.status,
                    updatedAt: new Date(),
                },
            }
        );

        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'UPDATE',
            resource: 'CATEGORY',
            resourceId: id,
            details: { before, after },
        });

        try { revalidatePath('/categories'); } catch {}
        return { success: true, message: 'Kategori berhasil diperbarui.' };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteCategoryAction(id: string): Promise<ActionResponse> {
    try {
        const user = await requirePermission('CATEGORY_UPDATE');

        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Kategori tidak valid.' };
        }

        const objId = new ObjectId(id);
        const itemCollection = await getItemCollection();

        // Referential integrity: Cannot delete if referenced by any item
        const referencedItem = await itemCollection.findOne({
            categoryId: objId,
            isDeleted: false,
        });

        if (referencedItem) {
            return {
                success: false,
                error: `Tidak dapat menghapus kategori: masih digunakan oleh barang "${referencedItem.name}" (${referencedItem.sku}).`,
            };
        }

        const collection = await getCategoryCollection();
        const result = await collection.updateOne(
            { _id: objId, isDeleted: false },
            {
                $set: {
                    isDeleted: true,
                    status: 'INACTIVE',
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return { success: false, error: 'Kategori tidak ditemukan.' };
        }

        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'DELETE',
            resource: 'CATEGORY',
            resourceId: id,
        });

        try { revalidatePath('/categories'); } catch {}
        return { success: true, message: 'Kategori berhasil dinonaktifkan / dihapus.' };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
