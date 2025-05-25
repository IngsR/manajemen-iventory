'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { LoginFormSchema, type LoginFormSchemaType } from '@/lib/types';
import { loginAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export function LoginForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormSchemaType>({
        resolver: zodResolver(LoginFormSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });

    async function onSubmit(values: LoginFormSchemaType) {
        setIsLoading(true);
        const result = await loginAction(values);
        setIsLoading(false);

        if (result.success && result.user) {
            toast({
                title: 'Login Berhasil',
                description: `Selamat datang kembali, ${result.user.username}!`,
            });
            if (result.user.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/');
            }
            router.refresh();
        } else {
            toast({
                title: 'Login Gagal',
                description: result.message || 'Username atau password salah.',
                variant: 'destructive',
            });
        }
    }

    return (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl">Masuk ke Akun Anda</CardTitle>
                <CardDescription>
                    Masukkan username dan password Anda di bawah ini.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Username"
                                            {...field}
                                            className="bg-background border-border focus:ring-primary"
                                            autoComplete="username"
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
                                            placeholder="********"
                                            {...field}
                                            className="bg-background border-border focus:ring-primary"
                                            autoComplete="current-password"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Masuk
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
