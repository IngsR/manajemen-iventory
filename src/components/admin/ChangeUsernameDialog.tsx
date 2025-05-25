'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    ChangeUsernameFormData,
    ChangeUsernameFormSchema,
    User,
} from '@/lib/types';
import { UserCog, Loader2 } from 'lucide-react';

interface ChangeUsernameDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChangeUsername: (
        userId: number,
        data: ChangeUsernameFormData,
    ) => Promise<void>;
}

export function ChangeUsernameDialog({
    user,
    open,
    onOpenChange,
    onChangeUsername,
}: ChangeUsernameDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ChangeUsernameFormData>({
        resolver: zodResolver(ChangeUsernameFormSchema),
        defaultValues: {
            username: '',
        },
    });

    useEffect(() => {
        if (user && open) {
            form.reset({ username: user.username });
        }
    }, [user, open, form]);

    if (!user) {
        return null;
    }

    async function onSubmit(values: ChangeUsernameFormData) {
        setIsSubmitting(true);
        await onChangeUsername(user!.id, values);
        setIsSubmitting(false);
        // Dialog closing and form reset might be handled by parent based on success/failure
        // Or, we can close it here if it's always the desired behavior
        // onOpenChange(false);
        // form.reset();
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                onOpenChange(isOpen);
                if (!isOpen) {
                    form.reset({ username: user.username }); // Reset to current username if dialog is cancelled
                    setIsSubmitting(false);
                }
            }}
        >
            <DialogContent className="sm:max-w-md bg-card shadow-xl rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                        <UserCog className="mr-2 h-5 w-5 text-primary" /> Ganti
                        Username untuk {user.username}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Masukkan username baru untuk pengguna{' '}
                        <span className="font-semibold">{user.username}</span>.
                        Username saat ini:{' '}
                        <span className="font-medium">{user.username}</span>.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5 p-1"
                    >
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username Baru</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Minimal 3 karakter"
                                            {...field}
                                            className="bg-background border-border focus:ring-primary"
                                            autoComplete="username"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false);
                                    form.reset({ username: user.username });
                                }}
                                className="mr-2"
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <UserCog className="mr-2 h-4 w-4" />
                                )}
                                {isSubmitting
                                    ? 'Menyimpan...'
                                    : 'Ganti Username'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
