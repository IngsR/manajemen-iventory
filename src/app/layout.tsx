import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Manajemen Inventory',
    description: 'Sistem Manajemen Persediaan Gudang',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body>{children}</body>
        </html>
    );
}
