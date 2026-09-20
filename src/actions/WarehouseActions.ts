'use server';

import { ObjectId } from 'mongodb';
import { getWarehouseCollection, WarehouseDoc } from '@/models/WarehouseModel';
import { getLocationCollection } from '@/models/LocationModel';
import { getStockBalanceCollection } from '@/models/StockBalanceModel';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './CategoryActions';
import { requirePermission, requireAuth, isAuthError } from '@/lib/Auth';
import { createAuditLog } from '@/services/AuditLogService';

export async function getWarehousesAction(): Promise<ActionResponse<WarehouseDoc[]>> {
    try {
        await requireAuth();
        const collection = await getWarehouseCollection();
        const warehouses = await collection
            .find({ isDeleted: false })
            .sort({ name: 1 })
            .toArray();

        const serialized = JSON.parse(JSON.stringify(warehouses));
        return { success: true, data: serialized };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        console.error('[getWarehousesAction error]', err);
        return { success: false, error: 'Gagal memuat daftar gudang.' };
    }
}

export async function createWarehouseAction(input: {
    code: string;
    name: string;
    address?: string;
}): Promise<ActionResponse<string>> {
    try {
        const user = await requirePermission('WAREHOUSE_CREATE');

        const code = input.code.trim().toUpperCase();
        const name = input.name.trim();

        if (!code || !name) {
            return { success: false, error: 'Kode dan Nama Gudang wajib diisi.' };
        }

        const collection = await getWarehouseCollection();
        const existing = await collection.findOne({ code, isDeleted: false });
        if (existing) {
            return { success: false, error: `Gudang dengan kode "${code}" sudah terdaftar.` };
        }

        const now = new Date();
        const doc: WarehouseDoc = {
            code,
            name,
            address: input.address?.trim(),
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
            resource: 'WAREHOUSE',
            resourceId: result.insertedId.toHexString(),
            details: { code, name },
        });

        try { revalidatePath('/warehouses'); } catch {}
        return {
            success: true,
            data: result.insertedId.toHexString(),
            message: 'Gudang berhasil dibuat.',
        };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function updateWarehouseAction(
    id: string,
    input: {
        name: string;
        address?: string;
        status: 'ACTIVE' | 'INACTIVE';
    }
): Promise<ActionResponse> {
    try {
        const user = await requirePermission('WAREHOUSE_UPDATE');

        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Gudang tidak valid.' };
        }

        const name = input.name.trim();
        if (!name) {
            return { success: false, error: 'Nama Gudang tidak boleh kosong.' };
        }

        const collection = await getWarehouseCollection();
        const objId = new ObjectId(id);

        const oldWarehouse = await collection.findOne({ _id: objId, isDeleted: false });
        if (!oldWarehouse) {
            return { success: false, error: 'Gudang tidak ditemukan.' };
        }

        const before: Record<string, unknown> = {};
        const after: Record<string, unknown> = {};

        if (oldWarehouse.name !== name) {
            before.name = oldWarehouse.name;
            after.name = name;
        }
        if ((oldWarehouse.address || '') !== (input.address?.trim() || '')) {
            before.address = oldWarehouse.address;
            after.address = input.address?.trim();
        }
        if (oldWarehouse.status !== input.status) {
            before.status = oldWarehouse.status;
            after.status = input.status;
        }

        await collection.updateOne(
            { _id: objId, isDeleted: false },
            {
                $set: {
                    name,
                    address: input.address?.trim(),
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
            resource: 'WAREHOUSE',
            resourceId: id,
            details: { before, after },
        });

        try { revalidatePath('/warehouses'); } catch {}
        return { success: true, message: 'Gudang berhasil diperbarui.' };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteWarehouseAction(id: string): Promise<ActionResponse> {
    try {
        const user = await requirePermission('WAREHOUSE_UPDATE');

        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Gudang tidak valid.' };
        }

        const objId = new ObjectId(id);
        const locationCollection = await getLocationCollection();
        const stockBalanceCollection = await getStockBalanceCollection();

        // 1. Check if warehouse has active locations
        const activeLocation = await locationCollection.findOne({
            warehouseId: objId,
            isDeleted: false,
        });

        if (activeLocation) {
            return {
                success: false,
                error: `Tidak dapat menghapus gudang: masih terdapat lokasi aktif "${activeLocation.name}" (${activeLocation.code}).`,
            };
        }

        // 2. Check if warehouse has stock balances > 0
        const activeStock = await stockBalanceCollection.findOne({
            warehouseId: objId,
            quantity: { $gt: 0 },
        });

        if (activeStock) {
            return {
                success: false,
                error: `Tidak dapat menghapus gudang: masih terdapat stok fisik barang di gudang ini.`,
            };
        }

        const collection = await getWarehouseCollection();
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
            return { success: false, error: 'Gudang tidak ditemukan.' };
        }

        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'DELETE',
            resource: 'WAREHOUSE',
            resourceId: id,
        });

        try { revalidatePath('/warehouses'); } catch {}
        return { success: true, message: 'Gudang berhasil dinonaktifkan / dihapus.' };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        console.error('[deleteWarehouseAction error]', err);
        return { success: false, error: 'Gagal menghapus gudang.' };
    }
}
