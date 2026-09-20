import React from 'react';
import Link from 'next/link';
import {
    ShieldCheck,
    Boxes,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    RotateCcw,
    SlidersHorizontal,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    FileCheck2,
    Users,
    ShieldAlert,
    ScrollText,
    TrendingDown,
    ArrowRight,
    AlertTriangle,
    Layers,
    Warehouse,
    Lock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'SOP & Alur Kerja Sistem - StockFlow ERP',
    description: 'Panduan operasional dan tata kelola alur kerja sistem inventaris berbasis transaksi & ledger',
};

export default function WorkflowGuidePage() {
    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-16 animate-fade-in">
            {/* Header / Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-2xl border border-slate-800">
                <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-teal-500/10 blur-3xl" />
                <div className="relative z-10 max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-indigo-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Standar Operasional Prosedur (SOP) & Arsitektur
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                        Alur Kerja & Tata Kelola Sistem StockFlow
                    </h1>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                        Sistem manajemen persediaan dirancang dengan prinsip integritas saldo berbasis transaksi
                        (Double-Entry Ledger). Tidak ada fitur pengeditan saldo manual demi menjamin akurasi,
                        keamanan data audit, dan pemisahan tugas (Segregation of Duties).
                    </p>
                </div>
            </div>

            {/* Section 1: Konsep Inti Sistem */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">1. Konsep Inti & Invariant Sistem</h2>
                        <p className="text-xs text-slate-500">Prinsip dasar yang mengunci kestabilan stok dan mencegah inkonsistensi data</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Card className="glass-card hover:border-indigo-300 transition-all">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                                <ScrollText className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-sm font-bold text-slate-900">Ledger-Based Transaction</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-600 leading-relaxed space-y-2">
                            <p>
                                Saldo stok <strong>tidak pernah diubah secara langsung</strong> lewat input bebas. Setiap penambahan atau pengurangan terjadi karena dokumen mutasi resmi (Receive, Issue, Transfer, Return, Adjustment).
                            </p>
                            <div className="p-2 rounded-lg bg-slate-50 font-mono text-[11px] text-slate-700">
                                Invariant: Balance = ∑ (Movements In - Movements Out)
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card hover:border-emerald-300 transition-all">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-sm font-bold text-slate-900">Atomic & Non-Negative</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-600 leading-relaxed space-y-2">
                            <p>
                                Semua mutasi berjalan dalam <strong>MongoDB Session Transaction</strong> ACID. Jika stok tidak mencukupi, transaksi dibatalkan seketika. Saldo stok digaransi tidak pernah bernilai negatif (&lt; 0).
                            </p>
                            <div className="p-2 rounded-lg bg-emerald-50 font-mono text-[11px] text-emerald-800">
                                Constraint: Stock Balance ≥ 0 (Enforced)
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card hover:border-amber-300 transition-all">
                        <CardHeader className="pb-2">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                                <Lock className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-sm font-bold text-slate-900">Immutable Audit Trail</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-600 leading-relaxed space-y-2">
                            <p>
                                Setiap aktivitas sistem (login, logout, mutasi stok, pembuatan master data, persetujuan opname) dicatat ke koleksi audit log yang <strong>bersifat append-only</strong> tanpa fungsi edit maupun hapus.
                            </p>
                            <div className="p-2 rounded-lg bg-amber-50 font-mono text-[11px] text-amber-800">
                                Security: Append-Only Immutable Logs
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Section 2: Alur Mutasi Barang Fisik */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-emerald-600 rounded-full" />
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">2. Siklus Alur Mutasi Fisik Barang</h2>
                        <p className="text-xs text-slate-500">Alur perpindahan fisik barang dari masuk gudang hingga dikeluarkan</p>
                    </div>
                </div>

                <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Step 1 */}
                        <div className="relative p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Langkah 1</span>
                                <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">Receive (Penerimaan)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Barang datang dari supplier/vendor. Petugas memverifikasi fisik dan mencatat penerimaan ke zona inbound/rak.
                            </p>
                            <div className="text-[11px] text-emerald-700 font-medium">
                                Efek: Stok (+) di lokasi tujuan
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Langkah 2</span>
                                <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">Transfer (Putaway)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pemindahan barang antar rak atau dari area inbound ke rak penyimpanan (Storage Rack).
                            </p>
                            <div className="text-[11px] text-blue-700 font-medium">
                                Efek: (-) Asal &amp; (+) Tujuan (Atomik)
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Langkah 3</span>
                                <ArrowUpFromLine className="h-4 w-4 text-purple-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">Issue (Pengeluaran)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pengeluaran barang untuk kebutuhan pelanggan, produksi, atau proyek. Validasi saldo otomatis mencegah defisit.
                            </p>
                            <div className="text-[11px] text-purple-700 font-medium">
                                Efek: Stok (-) di lokasi pengeluaran
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Langkah 4</span>
                                <RotateCcw className="h-4 w-4 text-amber-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">Return (Retur)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pengembalian barang sisa atau barang klaim retur masuk kembali ke dalam persediaan gudang.
                            </p>
                            <div className="text-[11px] text-amber-700 font-medium">
                                Efek: Stok (+) di lokasi tujuan retur
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="relative p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">Langkah 5</span>
                                <SlidersHorizontal className="h-4 w-4 text-rose-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">Adjustment (Koreksi)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Koreksi selisih saldo darurat karena barang rusak, susut, atau expired dengan alasan tertulis resmi.
                            </p>
                            <div className="text-[11px] text-rose-700 font-medium">
                                Efek: (+) Surplus atau (-) Defisit
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Siklus Hidup Stock Opname */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-amber-600 rounded-full" />
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">3. Siklus Hidup & Approval Stock Opname</h2>
                        <p className="text-xs text-slate-500">Mekanisme perhitungan fisik berkala dengan prinsip Segregation of Duties</p>
                    </div>
                </div>

                <Card className="glass-card overflow-hidden">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                        {/* Phase A */}
                        <div className="space-y-3 relative border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
                            <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold">A</span>
                                <Badge variant="outline" className="text-[11px] font-bold">DRAFT</Badge>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900">Inisiasi & Snapshot Sistem</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Dokumen opname dibuat untuk gudang terkait. Sistem mengunci snapshot jumlah saldo sistem saat inisiasi.
                            </p>
                            <div className="text-[11px] text-slate-500">Aktor: Petugas / Supervisor</div>
                        </div>

                        {/* Phase B */}
                        <div className="space-y-3 relative border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
                            <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">B</span>
                                <Badge className="text-[11px] font-bold bg-blue-500 text-white">IN_PROGRESS</Badge>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900">Penghitungan Fisik Lapangan</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Petugas gudang melakukan penghitungan fisik di rak dan menginput angka riil ke sistem item per item.
                            </p>
                            <div className="text-[11px] text-slate-500">Aktor: Petugas Lapangan</div>
                        </div>

                        {/* Phase C */}
                        <div className="space-y-3 relative border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
                            <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">C</span>
                                <Badge className="text-[11px] font-bold bg-amber-500 text-white">SUBMITTED</Badge>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900">Penguncian & Pengajuan Verifikasi</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Dokumen dikunci dari pengeditan lebih lanjut. Sistem menghitung variance (selisih) dan menunggu review Supervisor.
                            </p>
                            <div className="text-[11px] text-slate-500">Aktor: Petugas Lapangan</div>
                        </div>

                        {/* Phase D */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">D</span>
                                <div className="flex gap-1.5">
                                    <Badge className="text-[10px] font-bold bg-emerald-600 text-white">APPROVED</Badge>
                                    <Badge className="text-[10px] font-bold bg-rose-600 text-white">REJECTED</Badge>
                                </div>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900">Keputusan & Auto-Adjustment</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Jika <strong>Approved</strong>: Sistem secara otomatis menyeimbangkan saldo di ledger via transaksi adjustment. Jika <strong>Rejected</strong>: Saldo tetap utuh.
                            </p>
                            <div className="text-[11px] text-indigo-700 font-semibold">Aktor: Supervisor (Wajib)</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Section 4: Matriks Peran & Tanggung Jawab */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">4. Peran, Hak Akses & Batasan (RBAC)</h2>
                        <p className="text-xs text-slate-500">Tanggung jawab masing-masing role serta larangan eksplisit untuk menjaga integritas</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Role ADMIN */}
                    <Card className="glass-card border-indigo-200/80 shadow-md flex flex-col justify-between">
                        <div>
                            <CardHeader className="pb-3 border-b border-indigo-100/80 bg-indigo-50/40">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-indigo-600 text-white font-bold text-xs">ADMINISTRATOR</Badge>
                                    <Users className="h-4 w-4 text-indigo-600" />
                                </div>
                                <CardTitle className="text-base font-bold text-slate-900 mt-2">Tata Kelola & Master Data</CardTitle>
                                <CardDescription className="text-xs text-slate-500">Otoritas konfigurasi sistem dan manajemen entitas master</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4 text-xs">
                                <div className="space-y-2">
                                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Hak Akses / Yang Boleh:
                                    </span>
                                    <ul className="space-y-1.5 pl-5 list-disc text-slate-600">
                                        <li>Membuat &amp; mengedit master entitas (Barang, SKU, Gudang, Lokasi, Kategori, Satuan).</li>
                                        <li>Mengatur akun pengguna dan hak akses operasional.</li>
                                        <li>Memeriksa seluruh riwayat audit trail dan histori mutasi.</li>
                                        <li>Menjalankan koreksi Adjustment persediaan darurat.</li>
                                    </ul>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <span className="font-bold text-rose-700 flex items-center gap-1.5">
                                        <XCircle className="h-3.5 w-3.5 text-rose-600" /> Batasan / Yang TIDAK Boleh:
                                    </span>
                                    <ul className="space-y-1.5 pl-5 list-disc text-slate-600">
                                        <li>Mengubah saldo stok langsung tanpa melalui dokumen transaksi valid.</li>
                                        <li>Menghapus atau memodifikasi log audit (Immutable).</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </div>
                    </Card>

                    {/* Role SUPERVISOR */}
                    <Card className="glass-card border-amber-200/80 shadow-md flex flex-col justify-between">
                        <div>
                            <CardHeader className="pb-3 border-b border-amber-100/80 bg-amber-50/40">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-amber-600 text-white font-bold text-xs">SUPERVISOR</Badge>
                                    <ClipboardCheck className="h-4 w-4 text-amber-600" />
                                </div>
                                <CardTitle className="text-base font-bold text-slate-900 mt-2">Pengawasan & Approval</CardTitle>
                                <CardDescription className="text-xs text-slate-500">Otoritas verifikasi dan kepatuhan standar persediaan</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4 text-xs">
                                <div className="space-y-2">
                                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Hak Akses / Yang Boleh:
                                    </span>
                                    <ul className="space-y-1.5 pl-5 list-disc text-slate-600">
                                        <li>Menyetujui (Approve) atau menolak (Reject) hasil Stock Opname dari petugas.</li>
                                        <li>Memantau peringatan stok kritis &amp; stok menipis (Low Stock Alert).</li>
                                        <li>Melakukan audit menyeluruh terhadap log transaksi dan log user.</li>
                                        <li>Menginisiasi dokumen pelaksanaan Stock Opname baru.</li>
                                    </ul>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <span className="font-bold text-rose-700 flex items-center gap-1.5">
                                        <XCircle className="h-3.5 w-3.5 text-rose-600" /> Batasan / Yang TIDAK Boleh:
                                    </span>
                                    <ul className="space-y-1.5 pl-5 list-disc text-slate-600">
                                        <li>Membuat atau menghapus master entitas (Barang, SKU, Gudang).</li>
                                        <li>Mengubah angka hasil hitung fisik yang diinput oleh Petugas tanpa verifikasi.</li>
                                        <li>Menjalankan transaksi Receive/Issue rutin di lantai operasi.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </div>
                    </Card>

                    {/* Role PETUGAS */}
                    <Card className="glass-card border-emerald-200/80 shadow-md flex flex-col justify-between">
                        <div>
                            <CardHeader className="pb-3 border-b border-emerald-100/80 bg-emerald-50/40">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-emerald-600 text-white font-bold text-xs">OFFICER / PETUGAS</Badge>
                                    <Boxes className="h-4 w-4 text-emerald-600" />
                                </div>
                                <CardTitle className="text-base font-bold text-slate-900 mt-2">Operasional Lapangan</CardTitle>
                                <CardDescription className="text-xs text-slate-500">Pelaksana harian transaksi fisik persediaan di gudang</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4 text-xs">
                                <div className="space-y-2">
                                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Hak Akses / Yang Boleh:
                                    </span>
                                    <ul className="space-y-1.5 pl-5 list-disc text-slate-600">
                                        <li>Melakukan penerimaan barang masuk dari supplier (Receive).</li>
                                        <li>Melakukan pengeluaran barang resmi (Issue).</li>
                                        <li>Melakukan transfer stok antar-rak/lokasi dalam gudang (Transfer).</li>
                                        <li>Mencatat barang retur masuk (Return).</li>
                                        <li>Menginput hasil hitung fisik Stock Opname di lapangan.</li>
                                    </ul>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <span className="font-bold text-rose-700 flex items-center gap-1.5">
                                        <XCircle className="h-3.5 w-3.5 text-rose-600" /> Batasan / Yang TIDAK Boleh:
                                    </span>
                                    <ul className="space-y-1.5 pl-5 list-disc text-slate-600">
                                        <li>Menyetujui (Approve/Reject) Stock Opname buatannya sendiri.</li>
                                        <li>Membuat, mengedit, atau menghapus Master Barang &amp; Gudang.</li>
                                        <li>Mengakses laporan audit keamanan sistem atau log pengguna lain.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Section 5: Relasi Kolaboratif & Handshake Antar-Role */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-purple-600 rounded-full" />
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">5. Relasi & Sinergi Antar-Peran</h2>
                        <p className="text-xs text-slate-500">Bagaimana ketiga role berkolaborasi tanpa saling melanggar batas otorisasi</p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                            <span className="font-bold text-indigo-900 text-sm">1. Setup Master & Otorisasi</span>
                            <p className="text-slate-600 leading-relaxed">
                                <strong>Admin</strong> mendaftarkan SKU barang baru, menetapkan batas <em>minimum stock</em>, dan memetakan lokasi rak. Petugas hanya dapat mentransaksikan barang yang sudah berstatus <em>ACTIVE</em>.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                            <span className="font-bold text-emerald-900 text-sm">2. Eksekusi Lapangan</span>
                            <p className="text-slate-600 leading-relaxed">
                                <strong>Petugas</strong> menerima barang di inbound, melakukan putaway ke rak, dan mengeluarkan barang saat ada order. Setiap mutasi fisik menghasilkan nomor referensi transaksi unik (MOV-xxxx).
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                            <span className="font-bold text-amber-900 text-sm">3. Kontrol & Akuntabilitas</span>
                            <p className="text-slate-600 leading-relaxed">
                                <strong>Supervisor</strong> secara berkala menginspeksi mutasi, memverifikasi selisih fisik saat opname, dan memberikan persetujuan formal sebelum saldo sistem disesuaikan.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                            <span className="text-xs font-bold text-indigo-950">Siap Menjalankan Operasional?</span>
                            <p className="text-xs text-indigo-800">
                                Kunjungi dashboard sesuai peran Anda untuk mulai mengelola atau mengawasi persediaan gudang.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/">
                                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs">
                                    Buka Dashboard Saya
                                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
