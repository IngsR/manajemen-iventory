import type { Metadata } from 'next';
import './globals.css';
import { UserHeader } from './UserHeader';

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
            <body>
                <UserHeader />
                {children}
            </body>
        </html>
    );
}
