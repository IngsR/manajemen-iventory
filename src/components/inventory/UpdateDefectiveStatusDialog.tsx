'use client';

import { useEffect } from 'react';
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
    UpdateDefectiveItemStatusFormData,
    UpdateDefectiveItemStatusFormSchema,
    DefectiveItemLogEntry,
    DefectiveItemStatusEnum,
} from '@/lib/types';
import { Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UpdateDefectiveStatusDialogProps {
    logEntry: DefectiveItemLogEntry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateStatus: (
        logId: number,
        data: UpdateDefectiveItemStatusFormData,
    ) => void;
}

export function UpdateDefectiveStatusDialog({
    logEntry,
    open,
    onOpenChange,
    onUpdateStatus,
}: UpdateDefectiveStatusDialogProps) {
    const { toast } = useToast();

    const form = useForm<UpdateDefectiveItemStatusFormData>({
        resolver: zodResolver(UpdateDefectiveItemStatusFormSchema),
        defaultValues: {
            status: 'Pending Review',
            notes: '',
        },
    });

    useEffect(() => {
        if (logEntry && open) {
            form.reset({
                status: logEntry.status,
                notes: logEntry.notes || '',
            });
        }
    }, [logEntry, open, form]);

    if (!logEntry) return null;

    async function onSubmit(values: UpdateDefectiveItemStatusFormData) {
        try {
            onUpdateStatus(logEntry!.id, values);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal memperbarui status. Silakan coba lagi.',
                variant: 'destructive',
            });
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                onOpenChange(isOpen);
                if (!isOpen) {
                    form.reset();
                }
            }}
        >
            <DialogContent className="sm:max-w-md bg-card shadow-xl rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        Perbarui Status: {logEntry.item_name_at_log_time}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Item: {logEntry.inventory_item_name} (
                        {logEntry.quantity_defective} unit). Dicatat pada:{' '}
                        {new Date(logEntry.logged_at).toLocaleString()}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5 p-1"
                    >
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status Baru</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-background border-border focus:ring-primary">
                                                <SelectValue placeholder="Pilih status baru" />
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
                                    <FormLabel>
                                        Catatan Tambahan/Pembaruan (Opsional)
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tambahkan atau perbarui catatan mengenai status ini..."
                                            {...field}
                                            value={field.value ?? ''}
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
                                onClick={() => onOpenChange(false)}
                                className="mr-2"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <Edit3 className="mr-2 h-4 w-4" /> Simpan
                                Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
