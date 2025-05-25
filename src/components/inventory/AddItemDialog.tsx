'use client';

import { useState } from 'react';
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
    DialogTrigger,
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
import { ItemFormData, ItemFormSchema } from '@/lib/types';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddItemDialogProps {
    onAddItem: (item: ItemFormData) => Promise<void>;
    children: React.ReactNode;
}

export function AddItemDialog({ onAddItem, children }: AddItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<ItemFormData>({
        resolver: zodResolver(ItemFormSchema),
        defaultValues: {
            name: '',
            quantity: 0,
            category: '',
            location: '',
        },
    });

    async function onSubmit(values: ItemFormData) {
        setIsSubmitting(true);
        try {
            await onAddItem(values);
            setOpen(false);
            form.reset();
        } catch (error) {
            toast({
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Gagal menambahkan item. Silakan coba lagi.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    form.reset();
                    setIsSubmitting(false);
                }
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card shadow-xl rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        Tambah Item Baru
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Isi detail di bawah ini untuk menambahkan item baru ke
                        inventaris Anda.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 p-2"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Item</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="mis., Keyboard Nirkabel"
                                            {...field}
                                            className="bg-background border-border focus:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kuantitas</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="mis., 25"
                                            {...field}
                                            className="bg-background border-border focus:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kategori</FormLabel>
                                    <FormControl>
                                        {/* Reverted to simple Input for category */}
                                        <Input
                                            placeholder="mis., Elektronik"
                                            {...field}
                                            className="bg-background border-border focus:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lokasi (Opsional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="mis., Rak A1, Gudang Belakang"
                                            {...field}
                                            className="bg-background border-border focus:ring-primary"
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
                                onClick={() => setOpen(false)}
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
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                )}
                                {isSubmitting ? 'Menyimpan...' : 'Tambah Item'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
