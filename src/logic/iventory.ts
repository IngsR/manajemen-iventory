'use server';

import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import type { ItemFormData, InventoryItem } from '@/lib/types';
import { getCurrentUserAction } from '@/logic/user';
import { logActivity as _logActivity } from '@/logic/log-act';

export async function fetchInventoryItemsAction(): Promise<InventoryItem[]> {
    noStore();
    try {
        const result = await query<InventoryItem>(
            'SELECT id, name, quantity, category, location FROM inventory_items ORDER BY name ASC',
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        const dbError =
            error instanceof Error ? error.message : 'Unknown database error';
        throw new Error(
            `Gagal mengambil item inventaris dari database. Penyebab: ${dbError}. Pastikan tabel 'inventory_items' ada dan memiliki skema yang benar, terutama kolom 'id' yang seharusnya SERIAL PRIMARY KEY.`,
        );
    }
}

export async function addItemToDbAction(
    itemData: ItemFormData,
): Promise<InventoryItem | { error: string }> {
    noStore();

    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return { error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.' };

    const newItemData = {
        name: itemData.name,
        quantity: itemData.quantity,
        category: itemData.category,
        location: itemData.location || null,
    };

    try {
        const result = await query<InventoryItem>(
            'INSERT INTO inventory_items (name, quantity, category, location) VALUES ($1, $2, $3, $4) RETURNING *',
            [
                newItemData.name,
                newItemData.quantity,
                newItemData.category,
                newItemData.location,
            ],
        );

        if (result.rows.length > 0) {
            const addedItem = result.rows[0];
            await _logActivity(
                currentUser,
                'Created inventory item',
                `ID: ${addedItem.id}, Name: '${addedItem.name}', Qty: ${addedItem.quantity}, Category: '${addedItem.category}'`,
            );

            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');

            return addedItem;
        }

        return {
            error: 'Gagal menambahkan item ke database: Tidak ada baris yang dikembalikan.',
        };
    } catch (error: any) {
        console.error('Error adding item to database:', error);
        let errorMessage = 'Gagal menambahkan item karena kesalahan database.';
        if (error.code === '23502' && error.column === 'id') {
            errorMessage =
                'Gagal menambahkan item: Kolom ID di database inventory_items tidak diatur untuk auto-increment (SERIAL PRIMARY KEY).';
        } else if (error instanceof Error) {
            errorMessage = `Gagal menambahkan item: ${error.message}`;
        }
        return { error: errorMessage };
    }
}

export async function deleteItemFromDbAction(
    itemId: number,
): Promise<{ success: boolean; error?: string }> {
    noStore();

    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
        return {
            success: false,
            error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.',
        };
    }

    let itemNameForLog = `ID: ${itemId}`;
    try {
        const itemResult = await query<{ name: string }>(
            'SELECT name FROM inventory_items WHERE id = $1',
            [itemId],
        );
        if (itemResult.rows.length > 0) {
            itemNameForLog = `'${itemResult.rows[0].name}' (ID: ${itemId})`;
        }
    } catch (e) {
        console.warn('[DeleteItem] Gagal mendapatkan nama item untuk log:', e);
    }

    try {
        const result = await query(
            'DELETE FROM inventory_items WHERE id = $1',
            [itemId],
        );

        if (result.rowCount && result.rowCount > 0) {
            await _logActivity(
                currentUser,
                'Deleted inventory item',
                `Item: ${itemNameForLog}`,
            );

            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');

            return { success: true };
        }

        return {
            success: false,
            error: 'Gagal menghapus item: Item tidak ditemukan.',
        };
    } catch (error: any) {
        console.error('Error deleting item from database:', error);

        if (error.code === '23503') {
            return {
                success: false,
                error: 'Gagal menghapus item: Item ini memiliki catatan terkait (mis., log barang cacat).',
            };
        }

        return {
            success: false,
            error: `Gagal menghapus item: ${
                error instanceof Error
                    ? error.message
                    : 'Kesalahan tidak diketahui.'
            }`,
        };
    }
}

export async function updateItemQuantityInDbAction(
    itemId: number,
    newQuantity: number,
): Promise<InventoryItem | { error: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return { error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.' };

    try {
        const currentItemResult = await query<InventoryItem>(
            'SELECT name, quantity FROM inventory_items WHERE id = $1',
            [itemId],
        );
        if (currentItemResult.rows.length === 0) {
            return { error: 'Item tidak ditemukan untuk diperbarui.' };
        }
        const currentItem = currentItemResult.rows[0];

        const result = await query<InventoryItem>(
            'UPDATE inventory_items SET quantity = $1 WHERE id = $2 RETURNING *',
            [newQuantity, itemId],
        );
        if (result.rows.length > 0) {
            const updatedItem = result.rows[0];
            await _logActivity(
                currentUser,
                'Updated inventory item quantity',
                `Item: '${updatedItem.name}' (ID: ${updatedItem.id}), Qty changed from ${currentItem.quantity} to ${updatedItem.quantity}`,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            return updatedItem;
        }
        return {
            error: 'Gagal memperbarui kuantitas item: Item tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error updating item quantity in database:', error);
        let errorMessage =
            'Gagal memperbarui kuantitas item karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal memperbarui kuantitas item: ${error.message}`;
        }
        return { error: errorMessage };
    }
}
