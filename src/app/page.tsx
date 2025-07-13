'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { AdjustQuantityDialog } from '@/components/inventory/AdjustQuantityDialog';
import type { InventoryItem, ItemFormData } from '@/lib/types';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    fetchInventoryItemsAction,
    addItemToDbAction,
    updateItemQuantityInDbAction,
    deleteItemFromDbAction,
} from './actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const dynamic = 'force-dynamic';

export default function HomePage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [selectedItemForEdit, setSelectedItemForEdit] =
        useState<InventoryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(
        null,
    );
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState<number | null>(null);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    const { toast } = useToast();

    const loadInventory = useCallback(async () => {
        setIsLoading(true);
        try {
            const items = await fetchInventoryItemsAction();
            setInventory(items);
        } catch (error) {
            let errorMessage = 'Tidak dapat mengambil item dari database.';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (
                error &&
                typeof error === 'object' &&
                'message' in error &&
                typeof (error as any).message === 'string'
            ) {
                errorMessage = (error as any).message;
            }
            toast({
                title: 'Kesalahan Memuat Inventaris',
                description: errorMessage,
                variant: 'destructive',
            });
            setInventory([]);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const handleAddItem = async (newItemData: ItemFormData) => {
        const result = await addItemToDbAction(newItemData);
        if ('error' in result) {
            toast({
                title: 'Kesalahan Menambah Item',
                description: result.error,
                variant: 'destructive',
            });
        } else {
            await loadInventory();
            toast({
                title: 'Item Ditambahkan',
                description: `${result.name} berhasil ditambahkan.`,
                variant: 'default',
            });
        }
    };

    const handleOpenEditDialog = (item: InventoryItem) => {
        setSelectedItemForEdit(item);
        setIsEditDialogOpen(true);
    };

    const handleAdjustQuantity = async (
        itemId: number,
        newQuantity: number,
    ) => {
        const originalItem = inventory.find((item) => item.id === itemId);
        if (!originalItem) return;

        const result = await updateItemQuantityInDbAction(itemId, newQuantity);
        if ('error' in result) {
            toast({
                title: 'Kesalahan Memperbarui Kuantitas',
                description: result.error,
                variant: 'destructive',
            });
        } else {
            await loadInventory();
            const changeType =
                newQuantity > originalItem.quantity
                    ? 'Ditingkatkan'
                    : newQuantity < originalItem.quantity
                    ? 'Diturunkan'
                    : 'Tidak Berubah';
            toast({
                title: `Kuantitas ${changeType}`,
                description: `Kuantitas ${result.name} diperbarui menjadi ${newQuantity}.`,
                className:
                    newQuantity > originalItem.quantity
                        ? 'bg-accent text-accent-foreground border-green-600'
                        : undefined,
            });
        }
    };

    const handleOpenDeleteDialog = (item: InventoryItem) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        const result = await deleteItemFromDbAction(itemToDelete.id);
        if (result.success) {
            await loadInventory();
            toast({
                title: 'Item Dihapus',
                description: `${itemToDelete.name} berhasil dihapus.`,
            });
        } else {
            toast({
                title: 'Kesalahan Menghapus Item',
                description: result.error || 'Tidak dapat menghapus item.',
                variant: 'destructive',
            });
        }
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    if (isLoading && inventory.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="ml-4 text-muted-foreground">
                    Memuat inventaris...
                </p>
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col">
            <div className="container mx-auto px-4 py-8 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                        Gambaran Inventaris
                    </h2>
                    <AddItemDialog onAddItem={handleAddItem}>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all duration-150 ease-in-out hover:shadow-lg transform hover:-translate-y-0.5">
                            <PlusCircle className="mr-2 h-5 w-5" /> Tambah Item
                            Baru
                        </Button>
                    </AddItemDialog>
                </div>

                <div className="flex-grow">
                    <InventoryTable
                        items={inventory}
                        onEditItem={handleOpenEditDialog}
                        onDeleteItem={handleOpenDeleteDialog}
                    />
                </div>

                {selectedItemForEdit && (
                    <AdjustQuantityDialog
                        item={selectedItemForEdit}
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                        onAdjustQuantity={handleAdjustQuantity}
                    />
                )}

                {itemToDelete && (
                    <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Apakah Anda yakin ingin menghapus "
                                    {itemToDelete.name}"?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tindakan ini tidak dapat dibatalkan. Ini
                                    akan menghapus item secara permanen dari
                                    inventaris Anda.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                >
                                    Batal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteItem}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <footer className="bg-white text-black py-6 text-center text-sm w-full border-t border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                © {currentYear || ''}{' '}
                <a
                    href="https://github.com/IngsR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline transition-colors"
                >
                    IngsR
                </a>{' '}
                · Ikhwan Ramadhan · MIT License
            </footer>
        </div>
    );
}
