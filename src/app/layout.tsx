import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { ConditionalHeader } from '@/components/layout/ConditionalHeader';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
    variable: '--font-roboto-mono',
    subsets: ['latin'],
    weight: ['400', '700'],
});

export const metadata: Metadata = {
    title: 'Ikhwan - Kelola Barang',
    description:
        'Modern inventory management with AI-powered restock suggestions.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full">
            <body
                className={`${inter.variable} ${robotoMono.variable} antialiased bg-background text-foreground flex flex-col min-h-screen`}
            >
                <ConditionalHeader>
                    <Header />
                </ConditionalHeader>
                <main className="flex-grow flex flex-col">{children}</main>
                <Toaster />
            </body>
        </html>
    );
}
