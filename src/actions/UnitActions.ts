'use server';

import { ObjectId } from 'mongodb';
import { getUnitCollection, UnitDoc } from '@/models/UnitModel';
import { getItemCollection } from '@/models/ItemModel';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './CategoryActions';

export async function getUnitsAction(): Promise<ActionResponse<UnitDoc[]>> {
    try {
        const collection = await getUnitCollection();
        const units = await collection
            .find({ isDeleted: false })
            .sort({ name: 1 })
            .toArray();

        const serialized = JSON.parse(JSON.stringify(units));
        return { success: true, data: serialized };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function createUnitAction(input: {
    code: string;
    name: string;
}): Promise<ActionResponse<string>> {
    try {
        const code = input.code.trim().toUpperCase();
        const name = input.name.trim();

        if (!code || !name) {
            return { success: false, error: 'Kode dan Nama Satuan wajib diisi.' };
        }

        const collection = await getUnitCollection();
        const existing = await collection.findOne({ code, isDeleted: false });
        if (existing) {
            return { success: false, error: `Satuan dengan kode "${code}" sudah terdaftar.` };
        }

        const now = new Date();
        const doc: UnitDoc = {
            code,
            name,
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
        };

        const result = await collection.insertOne(doc);
        try { revalidatePath('/units'); } catch {}
        return {
            success: true,
            data: result.insertedId.toHexString(),
            message: 'Satuan berhasil dibuat.',
        };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function updateUnitAction(
    id: string,
    input: {
        name: string;
        status: 'ACTIVE' | 'INACTIVE';
    }
): Promise<ActionResponse> {
    try {
        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Satuan tidak valid.' };
        }

        const name = input.name.trim();
        if (!name) {
            return { success: false, error: 'Nama Satuan tidak boleh kosong.' };
        }

        const collection = await getUnitCollection();
        const objId = new ObjectId(id);

        const result = await collection.updateOne(
            { _id: objId, isDeleted: false },
            {
                $set: {
                    name,
                    status: input.status,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return { success: false, error: 'Satuan tidak ditemukan.' };
        }

        try { revalidatePath('/units'); } catch {}
        return { success: true, message: 'Satuan berhasil diperbarui.' };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteUnitAction(id: string): Promise<ActionResponse> {
    try {
        if (!ObjectId.isValid(id)) {
            return { success: false, error: 'ID Satuan tidak valid.' };
        }

        const objId = new ObjectId(id);
        const itemCollection = await getItemCollection();

        // Referential integrity check
        const referencedItem = await itemCollection.findOne({
            unitId: objId,
            isDeleted: false,
        });

        if (referencedItem) {
            return {
                success: false,
                error: `Tidak dapat menghapus satuan: masih digunakan oleh barang "${referencedItem.name}" (${referencedItem.sku}).`,
            };
        }

        const collection = await getUnitCollection();
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
            return { success: false, error: 'Satuan tidak ditemukan.' };
        }

        try { revalidatePath('/units'); } catch {}
        return { success: true, message: 'Satuan berhasil dinonaktifkan / dihapus.' };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
