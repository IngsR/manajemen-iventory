'use server';

import { ObjectId } from 'mongodb';
import { getItemCollection, ItemDoc } from '@/models/ItemModel';
import { getCategoryCollection } from '@/models/CategoryModel';
import { getUnitCollection } from '@/models/UnitModel';
import { getStockBalanceCollection } from '@/models/StockBalanceModel';
import { getStockMovementCollection } from '@/models/StockMovementModel';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './CategoryActions';
import { requirePermission, isAuthError } from '@/lib/Auth';
import { createAuditLog } from '@/services/AuditLogService';

export interface PopulatedItem extends ItemDoc {
    categoryName?: string;
    unitName?: string;
    unitCode?: string;
}

export async function getItemsAction(): Promise<ActionResponse<PopulatedItem[]>> {
    try {
        const itemCollection = await getItemCollection();
        const items = await itemCollection
            .aggregate<PopulatedItem>([
                { $match: { isDeleted: false } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                {
                    $lookup: {
                        from: 'units',
                        localField: 'unitId',
                        foreignField: '_id',
                        as: 'unit',
                    },
                },
                {
                    $addFields: {
                        categoryName: { $arrayElemAt: ['$category.name', 0] },
                        unitName: { $arrayElemAt: ['$unit.name', 0] },
                        unitCode: { $arrayElemAt: ['$unit.code', 0] },
                    },
                },
                {
                    $project: {
                        category: 0,
                        unit: 0,
                    },
                },
                { $sort: { name: 1 } },
            ])
            .toArray();

        const serialized = JSON.parse(JSON.stringify(items));
        return { success: true, data: serialized };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function createItemAction(input: {
    sku: string;
    name: string;
    description?: string;
    categoryId: string;
    unitId: string;
    minStock?: number;
}): Promise<ActionResponse<string>> {
    try {
        const user = await requirePermission('ITEM_CREATE');

        const sku = input.sku.trim().toUpperCase();
        const name = input.name.trim();

        if (!sku || !name) {
            return { success: false, error: 'SKU dan Nama Barang wajib diisi.' };
        }

        if (!ObjectId.isValid(input.categoryId) || !ObjectId.isValid(input.unitId)) {
            return { success: false, error: 'Kategori atau Satuan tidak valid.' };
        }

        const categoryObjId = new ObjectId(input.categoryId);
        const unitObjId = new ObjectId(input.unitId);

        const categoryCollection = await getCategoryCollection();
        const category = await categoryCollection.findOne({ _id: categoryObjId, isDeleted: false });
        if (!category) {
            return { success: false, error: 'Kategori tidak ditemukan atau sudah nonaktif.' };
        }

        const unitCollection = await getUnitCollection();
        const unit = await unitCollection.findOne({ _id: unitObjId, isDeleted: false });
        if (!unit) {
            return { success: false, error: 'Satuan tidak ditemukan atau sudah nonaktif.' };
        }

        const itemCollection = await getItemCollection();
        const existing = await itemCollection.findOne({ sku, isDeleted: false });
        if (existing) {
            return { success: false, error: `Barang dengan SKU "${sku}" sudah terdaftar.` };
        }

        const now = new Date();
        const doc: ItemDoc = {
            sku,
            name,
            description: input.description?.trim(),
            categoryId: categoryObjId,
            unitId: unitObjId,
            minStock: Math.max(0, Number(input.minStock) || 0),
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
        };

        const result = await itemCollection.insertOne(doc);

        // Audit log creation
        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'CREATE',
            resource: 'ITEM',
            resourceId: result.insertedId.toHexString(),
            details: {
                sku,
                name,
                categoryId: input.categoryId,
                unitId: input.unitId,
                minStock: doc.minStock,
            },
        });

        try { revalidatePath('/items'); } catch {}
        return {
            success: true,
            data: result.insertedId.toHexString(),
            message: 'Barang berhasil dibuat.',
        };
    } catch (err) {
        if (isAuthError(err)) {
            return { success: false, error: err.message };
        }
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function updateItemAction(
    id: string,
    input: {
        name: string;
        description?: string;
        categoryId: string;
        unitId: string;
        minStock?: number;
        status: 'ACTIVE' | 'INACTIVE';
    }
): Promise<ActionResponse> {
    try {
        const user = await requirePermission('ITEM_UPDATE');

        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Barang tidak valid.' };
        }

        const name = input.name.trim();
        if (!name) {
            return { success: false, error: 'Nama Barang tidak boleh kosong.' };
        }

        if (!ObjectId.isValid(input.categoryId) || !ObjectId.isValid(input.unitId)) {
            return { success: false, error: 'Kategori atau Satuan tidak valid.' };
        }

        const categoryObjId = new ObjectId(input.categoryId);
        const unitObjId = new ObjectId(input.unitId);

        const categoryCollection = await getCategoryCollection();
        const category = await categoryCollection.findOne({ _id: categoryObjId, isDeleted: false });
        if (!category) {
            return { success: false, error: 'Kategori tidak ditemukan atau sudah nonaktif.' };
        }

        const unitCollection = await getUnitCollection();
        const unit = await unitCollection.findOne({ _id: unitObjId, isDeleted: false });
        if (!unit) {
            return { success: false, error: 'Satuan tidak ditemukan atau sudah nonaktif.' };
        }

        const itemCollection = await getItemCollection();
        const objId = new ObjectId(id);

        const oldItem = await itemCollection.findOne({ _id: objId, isDeleted: false });
        if (!oldItem) {
            return { success: false, error: 'Barang tidak ditemukan.' };
        }

        // Calculate before/after only for changed fields
        const before: Record<string, unknown> = {};
        const after: Record<string, unknown> = {};

        if (oldItem.name !== name) {
            before.name = oldItem.name;
            after.name = name;
        }
        if ((oldItem.description || '') !== (input.description?.trim() || '')) {
            before.description = oldItem.description;
            after.description = input.description?.trim();
        }
        if (oldItem.categoryId.toHexString() !== input.categoryId) {
            before.categoryId = oldItem.categoryId.toHexString();
            after.categoryId = input.categoryId;
        }
        if (oldItem.unitId.toHexString() !== input.unitId) {
            before.unitId = oldItem.unitId.toHexString();
            after.unitId = input.unitId;
        }
        const newMinStock = Math.max(0, Number(input.minStock) || 0);
        if (oldItem.minStock !== newMinStock) {
            before.minStock = oldItem.minStock;
            after.minStock = newMinStock;
        }
        if (oldItem.status !== input.status) {
            before.status = oldItem.status;
            after.status = input.status;
        }

        await itemCollection.updateOne(
            { _id: objId, isDeleted: false },
            {
                $set: {
                    name,
                    description: input.description?.trim(),
                    categoryId: categoryObjId,
                    unitId: unitObjId,
                    minStock: newMinStock,
                    status: input.status,
                    updatedAt: new Date(),
                },
            }
        );

        // Audit update with before/after of changed fields
        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'UPDATE',
            resource: 'ITEM',
            resourceId: id,
            details: { before, after },
        });

        try { revalidatePath('/items'); } catch {}
        return { success: true, message: 'Barang berhasil diperbarui.' };
    } catch (err) {
        if (isAuthError(err)) {
            return { success: false, error: err.message };
        }
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteItemAction(id: string): Promise<ActionResponse> {
    try {
        const user = await requirePermission('ITEM_UPDATE');

        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Barang tidak valid.' };
        }

        const objId = new ObjectId(id);
        const stockBalanceCollection = await getStockBalanceCollection();
        const stockMovementCollection = await getStockMovementCollection();

        // 1. Check if item has remaining physical stock > 0
        const stock = await stockBalanceCollection.findOne({
            itemId: objId,
            quantity: { $gt: 0 },
        });

        if (stock) {
            return {
                success: false,
                error: `Tidak dapat menghapus barang: masih memiliki sisa stok (${stock.quantity} unit) di gudang.`,
            };
        }

        // 2. Check if item has historical stock movements
        const movement = await stockMovementCollection.findOne({ itemId: objId });
        if (movement) {
            // Master data with historical transaction ledger must not be erased; deactivate instead
            const itemCollection = await getItemCollection();
            await itemCollection.updateOne(
                { _id: objId },
                {
                    $set: {
                        status: 'INACTIVE',
                        updatedAt: new Date(),
                    },
                }
            );

            await createAuditLog({
                actorId: user._id,
                actorName: user.name,
                actorRole: user.role,
                action: 'UPDATE',
                resource: 'ITEM',
                resourceId: id,
                details: { statusChange: 'INACTIVE (historical transactions exist)' },
            });

            try { revalidatePath('/items'); } catch {}
            return {
                success: true,
                message: 'Barang memiliki riwayat transaksi mutasi. Barang berhasil dinonaktifkan (INACTIVE) demi integritas audit.',
            };
        }

        // 3. If no stock and no movements, safe soft delete
        const itemCollection = await getItemCollection();
        const result = await itemCollection.updateOne(
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
            return { success: false, error: 'Barang tidak ditemukan.' };
        }

        await createAuditLog({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'DELETE',
            resource: 'ITEM',
            resourceId: id,
        });

        try { revalidatePath('/items'); } catch {}
        return { success: true, message: 'Barang berhasil dihapus / dinonaktifkan.' };
    } catch (err) {
        if (isAuthError(err)) {
            return { success: false, error: err.message };
        }
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
