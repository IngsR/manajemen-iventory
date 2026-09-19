import Link from 'next/link';

export default function HomePage() {
    const modules = [
        {
            title: 'Kategori (Category)',
            description: 'Klasifikasi barang inventaris gudang',
            href: '/categories',
        },
        {
            title: 'Satuan (Unit)',
            description: 'Standar satuan kuantitas barang (PCS, BOX, KG, dll)',
            href: '/units',
        },
        {
            title: 'Gudang (Warehouse)',
            description: 'Fasilitas penyimpanan persediaan',
            href: '/warehouses',
        },
        {
            title: 'Lokasi (Location)',
            description: 'Rak, bin, staging, dan zona fisik dalam gudang',
            href: '/locations',
        },
        {
            title: 'Barang & SKU (Item)',
            description: 'Master data barang dan identitas SKU terdaftar',
            href: '/items',
        },
    ];

    return (
        <main className="max-w-4xl mx-auto p-6">
            <header className="border-b pb-4 mb-6">
                <h1 className="text-2xl font-bold">Manajemen Persediaan Gudang</h1>
                <p className="text-gray-600 mt-1">
                    Fase 2: Domain Foundation &amp; Master Data Management
                </p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((m) => (
                    <Link
                        key={m.href}
                        href={m.href}
                        className="block p-5 border rounded-lg hover:border-blue-500 hover:shadow-sm transition bg-white"
                    >
                        <h2 className="text-lg font-semibold text-blue-700">{m.title}</h2>
                        <p className="text-sm text-gray-600 mt-2">{m.description}</p>
                    </Link>
                ))}
            </section>
        </main>
    );
}
