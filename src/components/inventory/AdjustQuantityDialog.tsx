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
    AdjustQuantityFormData,
    AdjustQuantityFormSchema,
    InventoryItem,
} from '@/lib/types';
import { Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdjustQuantityDialogProps {
    item: InventoryItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdjustQuantity: (itemId: number, newQuantity: number) => void;
}

export function AdjustQuantityDialog({
    item,
    open,
    onOpenChange,
    onAdjustQuantity,
}: AdjustQuantityDialogProps) {
    const { toast } = useToast();
    const form = useForm<AdjustQuantityFormData>({
        resolver: zodResolver(AdjustQuantityFormSchema),
        defaultValues: {
            quantity: 0,
        },
    });

    useEffect(() => {
        if (item) {
            form.reset({ quantity: item.quantity });
        }
    }, [item, form, open]);

    if (!item) return null;

    async function onSubmit(values: AdjustQuantityFormData) {
        try {
            const oldQuantity = item!.quantity;
            onAdjustQuantity(item!.id, values.quantity);

            let toastDescription = `${item!.name}'s quantity updated to ${
                values.quantity
            }.`;

            if (values.quantity > oldQuantity) {
                toast({
                    title: 'Quantity Increased',
                    description: toastDescription,
                    className:
                        'bg-accent text-accent-foreground border-green-600',
                });
            } else if (values.quantity < oldQuantity) {
                toast({
                    title: 'Quantity Decreased',
                    description: toastDescription,
                    variant: 'default',
                });
            } else {
                toast({
                    title: 'Quantity Unchanged',
                    description: toastDescription,
                });
            }

            onOpenChange(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to adjust quantity. Please try again.',
                variant: 'destructive',
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card shadow-xl rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        Adjust Quantity for {item.name}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Current quantity: {item.quantity}. Category:{' '}
                        {item.category}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 p-2"
                    >
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Quantity</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Enter new quantity"
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
                                onClick={() => onOpenChange(false)}
                                className="mr-2"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <Edit3 className="mr-2 h-4 w-4" /> Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
