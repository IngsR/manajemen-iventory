import Link from 'next/link';
import { getCurrentUser } from '@/lib/Auth';
import { hasPermission } from '@/lib/Permissions';

const masterDataModules = [
    {
        title: 'Kategori',
        description: 'Klasifikasi barang inventaris gudang',
        href: '/categories',
    },
    {
        title: 'Satuan',
        description: 'Standar satuan kuantitas barang (PCS, BOX, KG, dll)',
        href: '/units',
    },
    {
        title: 'Gudang',
        description: 'Fasilitas penyimpanan persediaan',
        href: '/warehouses',
    },
    {
        title: 'Lokasi',
        description: 'Rak, bin, staging, dan zona fisik dalam gudang',
        href: '/locations',
    },
    {
        title: 'Barang & SKU',
        description: 'Master data barang dan identitas SKU terdaftar',
        href: '/items',
    },
];

const transactionModules = [
    {
        title: 'Receive',
        description: 'Penerimaan barang masuk ke gudang',
        href: '/inventory/receive',
        color: 'text-green-700',
    },
    {
        title: 'Issue',
        description: 'Pengeluaran barang dari gudang',
        href: '/inventory/issue',
        color: 'text-orange-700',
    },
    {
        title: 'Transfer',
        description: 'Pemindahan barang antar lokasi dalam gudang',
        href: '/inventory/transfer',
        color: 'text-blue-700',
    },
    {
        title: 'Return',
        description: 'Pengembalian barang ke gudang',
        href: '/inventory/return',
        color: 'text-purple-700',
    },
    {
        title: 'Adjustment',
        description: 'Koreksi stok berdasarkan hasil opname atau audit',
        href: '/inventory/adjustment',
        color: 'text-amber-700',
    },
];

export default async function HomePage() {
    const user = await getCurrentUser();

    return (
        <main className="max-w-4xl mx-auto p-6">
            <header className="border-b pb-4 mb-8">
                <h1 className="text-2xl font-bold">Manajemen Persediaan Gudang</h1>
                <p className="text-gray-500 mt-1 text-sm">Sistem inventory berbasis transaksi & immutable ledger</p>
            </header>

            <section className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Master Data
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {masterDataModules.map((m) => (
                        <Link
                            key={m.href}
                            href={m.href}
                            className="block p-4 border rounded-lg hover:border-blue-400 hover:shadow-sm transition bg-white"
                        >
                            <h3 className="font-semibold text-blue-700">{m.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{m.description}</p>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Transaksi Inventory
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {transactionModules.map((m) => (
                        <Link
                            key={m.href}
                            href={m.href}
                            className="block p-4 border rounded-lg hover:border-gray-400 hover:shadow-sm transition bg-white"
                        >
                            <h3 className={`font-semibold ${m.color}`}>{m.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{m.description}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {(!user || hasPermission(user.role, 'AUDIT_VIEW')) && (
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Audit & Pengawasan
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Link
                            href="/audit"
                            className="block p-4 border rounded-lg hover:border-purple-400 hover:shadow-sm transition bg-white"
                        >
                            <h3 className="font-semibold text-purple-700">Audit Trail (Log Aktivitas)</h3>
                            <p className="text-sm text-gray-500 mt-1">Jejak rekaman aktivitas pengguna dan mutasi data (append-only)</p>
                        </Link>
                    </div>
                </section>
            )}
        </main>
    );
}
