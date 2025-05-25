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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    CreateUserFormData,
    CreateUserFormSchema,
    UserStatusEnum,
} from '@/lib/types';
import { PlusCircle, UserPlus, Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
    onCreateUser: (
        data: CreateUserFormData,
    ) => Promise<{ success: boolean; error?: string }>;
    children: React.ReactNode;
}

export function CreateUserDialog({
    onCreateUser,
    children,
}: CreateUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CreateUserFormData>({
        resolver: zodResolver(CreateUserFormSchema),
        defaultValues: {
            username: '',
            password: '',

            status: 'active',
        },
    });

    async function onSubmit(values: CreateUserFormData) {
        setIsSubmitting(true);
        const result = await onCreateUser(values);
        setIsSubmitting(false);
        if (result.success) {
            setOpen(false);
            form.reset();
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
            <DialogContent className="sm:max-w-md bg-card shadow-xl rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                        <UserPlus className="mr-2 h-5 w-5 text-primary" /> Buat
                        Akun Karyawan Baru
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Isi detail di bawah untuk membuat akun karyawan baru.
                        Peran akan otomatis diatur sebagai 'Karyawan'.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5 p-1 max-h-[70vh] overflow-y-auto"
                    >
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="mis., budi.s"
                                            {...field}
                                            className="bg-background border-border focus:ring-primary"
                                            autoComplete="off"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Minimal 6 karakter"
                                            {...field}
                                            className="bg-background border-border focus:ring-primary"
                                            autoComplete="new-password"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Role selection is removed. Admin can only create employees. */}
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status Akun</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-background border-border focus:ring-primary">
                                                <SelectValue placeholder="Pilih status akun" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {UserStatusEnum.options.map(
                                                (statusValue) => (
                                                    <SelectItem
                                                        key={statusValue}
                                                        value={statusValue}
                                                    >
                                                        {statusValue
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            statusValue.slice(
                                                                1,
                                                            )}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
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
                                {isSubmitting ? 'Membuat...' : 'Buat Karyawan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
