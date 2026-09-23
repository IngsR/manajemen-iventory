import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'StockFlow — Manajemen Inventory ERP',
    description: 'Sistem Manajemen Persediaan Gudang Terpadu Berbasis Transaksi & Ledger',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased font-sans">
                {children}
            </body>
        </html>
    );
}
