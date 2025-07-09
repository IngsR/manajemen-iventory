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
import type { User, UserStatus } from '@/lib/types';
import { UserX, UserCheck, Loader2 } from 'lucide-react';

interface UpdateUserStatusDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateStatus: (userId: string, newStatus: UserStatus) => Promise<void>;
}

export function UpdateUserStatusDialog({
    user,
    open,
    onOpenChange,
    onUpdateStatus,
}: UpdateUserStatusDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user) {
        return null;
    }

    const newStatus: UserStatus =
        user.status === 'active' ? 'suspended' : 'active';
    const actionText = user.status === 'active' ? 'Tangguhkan' : 'Aktifkan';
    const ActionIcon = user.status === 'active' ? UserX : UserCheck;

    const handleSubmit = async () => {
        if (!user) {
            console.error(
                'UpdateUserStatusDialog: handleSubmit called but user prop is null. This should not happen.',
            );
            setIsSubmitting(false);
            onOpenChange(false);
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdateStatus(String(user.id), newStatus); // ✅ FIXED
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog
            open={open}
            onOpenChange={(isOpen) => {
                if (isSubmitting && !isOpen) return;
                onOpenChange(isOpen);
                if (!isOpen) setIsSubmitting(false);
            }}
        >
            <AlertDialogContent className="bg-card">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                        <ActionIcon
                            className={`mr-2 h-5 w-5 ${
                                user.status === 'active'
                                    ? 'text-destructive'
                                    : 'text-green-600'
                            }`}
                        />
                        {actionText} Pengguna "{user.username}"?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Anda akan mengubah status pengguna{' '}
                        <span className="font-semibold">{user.username}</span>{' '}
                        menjadi{' '}
                        <span className="font-semibold capitalize">
                            {newStatus}
                        </span>
                        .
                        {newStatus === 'suspended' &&
                            ' Pengguna yang ditangguhkan tidak akan dapat login.'}
                        {newStatus === 'active' &&
                            ' Pengguna akan dapat login kembali.'}
                        <br />
                        Apakah Anda yakin ingin melanjutkan?
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
                        className={
                            user.status === 'active'
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ActionIcon className="mr-2 h-4 w-4" />
                        )}
                        {isSubmitting ? 'Memproses...' : actionText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
