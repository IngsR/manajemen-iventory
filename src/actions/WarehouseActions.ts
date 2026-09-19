'use server';

import { ObjectId } from 'mongodb';
import { getWarehouseCollection, WarehouseDoc } from '@/models/WarehouseModel';
import { getLocationCollection } from '@/models/LocationModel';
import { getStockBalanceCollection } from '@/models/StockBalanceModel';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './CategoryActions';

export async function getWarehousesAction(): Promise<ActionResponse<WarehouseDoc[]>> {
    try {
        const collection = await getWarehouseCollection();
        const warehouses = await collection
            .find({ isDeleted: false })
            .sort({ name: 1 })
            .toArray();

        const serialized = JSON.parse(JSON.stringify(warehouses));
        return { success: true, data: serialized };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function createWarehouseAction(input: {
    code: string;
    name: string;
    address?: string;
}): Promise<ActionResponse<string>> {
    try {
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
        try { revalidatePath('/warehouses'); } catch {}
        return {
            success: true,
            data: result.insertedId.toHexString(),
            message: 'Gudang berhasil dibuat.',
        };
    } catch (err) {
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
        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Gudang tidak valid.' };
        }

        const name = input.name.trim();
        if (!name) {
            return { success: false, error: 'Nama Gudang tidak boleh kosong.' };
        }

        const collection = await getWarehouseCollection();
        const objId = new ObjectId(id);

        const result = await collection.updateOne(
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

        if (result.matchedCount === 0) {
            return { success: false, error: 'Gudang tidak ditemukan.' };
        }

        try { revalidatePath('/warehouses'); } catch {}
        return { success: true, message: 'Gudang berhasil diperbarui.' };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteWarehouseAction(id: string): Promise<ActionResponse> {
    try {
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

        try { revalidatePath('/warehouses'); } catch {}
        return { success: true, message: 'Gudang berhasil dinonaktifkan / dihapus.' };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
