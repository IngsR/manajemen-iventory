'use client';

import { useState } from 'react';
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
import type { User } from '@/lib/types';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteUserDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirmDelete: (userId: number) => Promise<void>;
}

export function DeleteUserDialog({
    user,
    open,
    onOpenChange,
    onConfirmDelete,
}: DeleteUserDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user) {
        return null;
    }

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        await onConfirmDelete(user.id);
        setIsSubmitting(false);
        // Parent component is responsible for closing the dialog
    };

    return (
        <AlertDialog
            open={open}
            onOpenChange={(isOpen) => {
                if (isSubmitting && !isOpen) return; // Prevent closing while submitting
                onOpenChange(isOpen);
                if (!isOpen) setIsSubmitting(false);
            }}
        >
            <AlertDialogContent className="bg-card">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center text-destructive">
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        Hapus Pengguna "{user.username}"?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Semua data terkait
                        pengguna{' '}
                        <span className="font-semibold">{user.username}</span>{' '}
                        akan dihapus secara permanen. Pengguna ini tidak akan
                        dapat login lagi. Pastikan Anda yakin.
                        <br />
                        <span className="text-xs text-muted-foreground">
                            (Catatan: Beberapa log aktivitas yang merujuk
                            pengguna ini mungkin tetap ada dengan ID pengguna
                            yang sudah dihapus, tergantung konfigurasi
                            database.)
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleSubmit}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
