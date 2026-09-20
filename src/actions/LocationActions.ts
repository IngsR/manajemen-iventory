'use server';

import { ObjectId, Filter } from 'mongodb';
import { getLocationCollection, LocationDoc, LocationType } from '@/models/LocationModel';
import { getWarehouseCollection } from '@/models/WarehouseModel';
import { getStockBalanceCollection } from '@/models/StockBalanceModel';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './CategoryActions';
import { requirePermission, requireAuth, isAuthError } from '@/lib/Auth';
import { createAuditLog } from '@/services/AuditLogService';

export async function getLocationsAction(
    warehouseId?: string
): Promise<ActionResponse<LocationDoc[]>> {
    try {
        await requireAuth();
        const collection = await getLocationCollection();
        const filter: Filter<LocationDoc> = { isDeleted: false };

        if (warehouseId && ObjectId.isValid(warehouseId)) {
            filter.warehouseId = new ObjectId(warehouseId);
        }

        const locations = await collection
            .find(filter)
            .sort({ code: 1 })
            .toArray();

        const serialized = JSON.parse(JSON.stringify(locations));
        return { success: true, data: serialized };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        console.error('[getLocationsAction error]', err);
        return { success: false, error: 'Gagal memuat daftar lokasi.' };
    }
}

export async function createLocationAction(input: {
    warehouseId: string;
    code: string;
    name: string;
    type: LocationType;
}): Promise<ActionResponse<string>> {
    try {
        const user = await requirePermission('LOCATION_CREATE');

        if (!ObjectId.isValid(input.warehouseId)) {
            return { success: false, error: 'Gudang tidak valid.' };
        }

        const code = input.code.trim().toUpperCase();
        const name = input.name.trim();

        if (!code || !name) {
            return { success: false, error: 'Kode dan Nama Lokasi wajib diisi.' };
        }

        const warehouseCollection = await getWarehouseCollection();
        const warehouseObjId = new ObjectId(input.warehouseId);
        const warehouse = await warehouseCollection.findOne({
            _id: warehouseObjId,
            isDeleted: false,
        });

        if (!warehouse) {
            return { success: false, error: 'Gudang tidak ditemukan atau sudah nonaktif.' };
        }

        const locationCollection = await getLocationCollection();
        const existing = await locationCollection.findOne({
            warehouseId: warehouseObjId,
            code,
            isDeleted: false,
        });

        if (existing) {
            return {
                success: false,
                error: `Lokasi dengan kode "${code}" sudah ada di gudang "${warehouse.name}".`,
            };
        }

        const now = new Date();
        const doc: LocationDoc = {
            warehouseId: warehouseObjId,
            code,
            name,
            type: input.type,
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
        };

        const result = await locationCollection.insertOne(doc);

        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'CREATE',
            resource: 'LOCATION',
            resourceId: result.insertedId.toHexString(),
            details: { warehouseId: input.warehouseId, code, name, type: input.type },
        });

        try { revalidatePath('/locations'); } catch {}
        return {
            success: true,
            data: result.insertedId.toHexString(),
            message: 'Lokasi berhasil dibuat.',
        };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function updateLocationAction(
    id: string,
    input: {
        name: string;
        type: LocationType;
        status: 'ACTIVE' | 'INACTIVE';
    }
): Promise<ActionResponse> {
    try {
        const user = await requirePermission('LOCATION_UPDATE');

        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Lokasi tidak valid.' };
        }

        const name = input.name.trim();
        if (!name) {
            return { success: false, error: 'Nama Lokasi tidak boleh kosong.' };
        }

        const collection = await getLocationCollection();
        const objId = new ObjectId(id);

        const oldLocation = await collection.findOne({ _id: objId, isDeleted: false });
        if (!oldLocation) {
            return { success: false, error: 'Lokasi tidak ditemukan.' };
        }

        const before: Record<string, unknown> = {};
        const after: Record<string, unknown> = {};

        if (oldLocation.name !== name) {
            before.name = oldLocation.name;
            after.name = name;
        }
        if (oldLocation.type !== input.type) {
            before.type = oldLocation.type;
            after.type = input.type;
        }
        if (oldLocation.status !== input.status) {
            before.status = oldLocation.status;
            after.status = input.status;
        }

        await collection.updateOne(
            { _id: objId, isDeleted: false },
            {
                $set: {
                    name,
                    type: input.type,
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
            resource: 'LOCATION',
            resourceId: id,
            details: { before, after },
        });

        try { revalidatePath('/locations'); } catch {}
        return { success: true, message: 'Lokasi berhasil diperbarui.' };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteLocationAction(id: string): Promise<ActionResponse> {
    try {
        const user = await requirePermission('LOCATION_UPDATE');

        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Lokasi tidak valid.' };
        }

        const objId = new ObjectId(id);
        const stockBalanceCollection = await getStockBalanceCollection();

        // Check if location has active stock > 0
        const stock = await stockBalanceCollection.findOne({
            locationId: objId,
            quantity: { $gt: 0 },
        });

        if (stock) {
            return {
                success: false,
                error: `Tidak dapat menghapus lokasi: masih terdapat stok barang (${stock.quantity} unit) di lokasi ini.`,
            };
        }

        const collection = await getLocationCollection();
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
            return { success: false, error: 'Lokasi tidak ditemukan.' };
        }

        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'DELETE',
            resource: 'LOCATION',
            resourceId: id,
        });

        try { revalidatePath('/locations'); } catch {}
        return { success: true, message: 'Lokasi berhasil dinonaktifkan / dihapus.' };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message };
        console.error('[deleteLocationAction error]', err);
        return { success: false, error: 'Gagal menghapus lokasi.' };
    }
}
