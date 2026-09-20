import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'StockFlow - Manajemen Inventory ERP',
    description: 'Sistem Manajemen Persediaan Gudang Terpadu Berbasis Transaksi & Ledger',
};

// Root layout only provides the HTML shell.
// Role-based workspace chrome (navbar/shell) now lives in each Route Group
// layout: src/app/(admin)/layout.tsx, (supv), (office) and (auth).
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body className="antialiased selection:bg-slate-900 selection:text-white">
                {children}
            </body>
        </html>
    );
}
