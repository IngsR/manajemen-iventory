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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    LogDefectiveItemFormData,
    LogDefectiveItemFormSchema,
    InventoryItem,
    DefectiveItemStatusEnum,
    DefectiveItemReasonSuggestions,
} from '@/lib/types';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox';

interface LogDefectiveItemDialogProps {
    inventoryItems: InventoryItem[];
    onLogDefectiveItem: (
        data: LogDefectiveItemFormData,
    ) => Promise<{ success: boolean; error?: string; data?: any }>;
    children: React.ReactNode;
}

export function LogDefectiveItemDialog({
    inventoryItems,
    onLogDefectiveItem,
    children,
}: LogDefectiveItemDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const reasonOptions = DefectiveItemReasonSuggestions.map((reason) => ({
        label: reason,
        value: reason,
    }));

    const form = useForm<LogDefectiveItemFormData>({
        resolver: zodResolver(LogDefectiveItemFormSchema),
        defaultValues: {
            item_name_at_log_time: '',
            quantity_defective: 1,
            reason: '',
            status: 'Pending Review',
            notes: '',
            inventory_item_id: undefined,
        },
    });

    const selectedItemId = form.watch('inventory_item_id');

    useEffect(() => {
        if (selectedItemId !== undefined) {
            const selectedItem = inventoryItems.find(
                (item) => item.id === Number(selectedItemId),
            );
            if (selectedItem) {
                form.setValue('item_name_at_log_time', selectedItem.name);
            }
        } else {
            form.setValue('item_name_at_log_time', '');
        }
    }, [selectedItemId, inventoryItems, form]);

    async function onSubmit(values: LogDefectiveItemFormData) {
        const result = await onLogDefectiveItem(values);
        if (result.success) {
            toast({
                title: 'Barang Cacat Dicatat',
                description: `Item "${values.item_name_at_log_time}" (${values.quantity_defective} unit) telah dicatat sebagai cacat.`,
            });
            setOpen(false);
            form.reset({
                item_name_at_log_time: '',
                quantity_defective: 1,
                reason: '',
                status: 'Pending Review',
                notes: '',
                inventory_item_id: undefined,
            });
        } else {
            toast({
                title: 'Gagal Mencatat Barang Cacat',
                description: result.error || 'Terjadi kesalahan.',
                variant: 'destructive',
            });
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    form.reset({
                        item_name_at_log_time: '',
                        quantity_defective: 1,
                        reason: '',
                        status: 'Pending Review',
                        notes: '',
                        inventory_item_id: undefined,
                    });
                }
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card shadow-xl rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />{' '}
                        Catat Barang Cacat
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Isi detail di bawah untuk mencatat item yang ditemukan
                        cacat.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5 p-1 max-h-[70vh] overflow-y-auto"
                    >
                        <FormField
                            control={form.control}
                            name="inventory_item_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Item Inventaris</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={
                                            field.value !== undefined
                                                ? String(field.value)
                                                : undefined
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-background border-border focus:ring-primary">
                                                <SelectValue placeholder="Pilih item yang cacat" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {inventoryItems.map((item) => (
                                                <SelectItem
                                                    key={item.id}
                                                    value={String(item.id)}
                                                >
                                                    {' '}
                                                    {/* value must be string for SelectItem */}
                                                    {item.name} (Stok:{' '}
                                                    {item.quantity})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantity_defective"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kuantitas Cacat</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="mis., 1"
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
                            name="reason"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Alasan Cacat</FormLabel>
                                    <Combobox
                                        options={reasonOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Pilih atau ketik alasan..."
                                        inputPlaceholder="Cari atau tambah alasan baru..."
                                        className="bg-background border-border focus:ring-primary"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status Awal</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-background border-border focus:ring-primary">
                                                <SelectValue placeholder="Pilih status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {DefectiveItemStatusEnum.options.map(
                                                (statusValue) => (
                                                    <SelectItem
                                                        key={statusValue}
                                                        value={statusValue}
                                                    >
                                                        {statusValue}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detail tambahan mengenai kerusakan, nomor batch, dll."
                                            {...field}
                                            className="bg-background border-border focus:ring-primary resize-none"
                                            rows={3}
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
                                    setOpen(false);
                                    form.reset({
                                        item_name_at_log_time: '',
                                        quantity_defective: 1,
                                        reason: '',
                                        status: 'Pending Review',
                                        notes: '',
                                        inventory_item_id: undefined,
                                    });
                                }}
                                className="mr-2"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> Catat
                                Cacat
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
