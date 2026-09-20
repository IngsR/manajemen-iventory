import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/Auth";
import { hasPermission } from "@/lib/Permissions";
import {
  getDashboardCounts,
  getRecentMovements,
} from "@/services/reporting/DashboardService";
import { MetricCard } from "@/components/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Tags,
  Ruler,
  Package,
  Warehouse,
  MapPin,
  SlidersHorizontal,
  Users,
  ShieldAlert,
  ScrollText,
  FileSpreadsheet,
  ShieldCheck,
  ShieldX,
  ArrowRight,
  ArrowDown,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alur Kerja Administrator - StockFlow ERP",
  description:
    "Alur tata kelola sistem: master data, konfigurasi, audit, dan pengecualian oleh Administrator",
};

export default async function AdminWorkflowPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.role, "ITEM_CREATE")) {
    redirect("/");
  }

  const [counts, recentMovements] = await Promise.all([
    getDashboardCounts(),
    getRecentMovements(5),
  ]);

  // Admin governance flow — build & maintain the foundation of the system.
  const stages = [
    {
      step: "01",
      stage: "MASTER DATA",
      title: "Siapkan Kategori & Satuan",
      icon: Tags,
      accent: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
      desc: "Definisikan klasifikasi produk dan satuan ukuran sebagai dasar seluruh katalog barang.",
      href: "/categories",
      cta: "Kategori Produk",
      secondary: { label: "Satuan Ukuran", href: "/units" },
    },
    {
      step: "02",
      stage: "ITEM & SKU",
      title: "Daftarkan Barang & Minimum Stock",
      icon: Package,
      accent: "bg-blue-50 text-blue-700 border-blue-200/70",
      desc: "Buat katalog barang/SKU aktif dan tetapkan batas minimum stock untuk pemicu peringatan stok kritis.",
      href: "/items",
      cta: "Katalog Barang & SKU",
    },
    {
      step: "03",
      stage: "WAREHOUSE & LOCATION",
      title: "Bangun Fasilitas & Rak",
      icon: Warehouse,
      accent: "bg-teal-50 text-teal-700 border-teal-200/70",
      desc: "Siapkan gudang, zona, dan rak lokasi tempat Petugas melakukan putaway serta opname.",
      href: "/warehouses",
      cta: "Fasilitas Gudang",
      secondary: { label: "Zona & Rak Lokasi", href: "/locations" },
    },
    {
      step: "04",
      stage: "SYSTEM CONTROL",
      title: "Konfigurasi Akun & Otorisasi",
      icon: Users,
      accent: "bg-purple-50 text-purple-700 border-purple-200/70",
      desc: "Kelola user dan hak akses (RBAC) agar Petugas dan Supervisor bekerja sesuai perannya.",
      href: "/audit",
      cta: "Tinjau Otorisasi",
    },
    {
      step: "05",
      stage: "AUDIT & HISTORY",
      title: "Pantau Histori & Audit Trail",
      icon: ShieldAlert,
      accent: "bg-slate-100 text-slate-700 border-slate-200/70",
      desc: "Periksa audit trail keamanan, riwayat mutasi, dan rekapitulasi opname sebagai bentuk tata kelola.",
      href: "/audit",
      cta: "Audit Trail",
      secondary: { label: "Log Mutasi", href: "/reports/movements" },
    },
    {
      step: "06",
      stage: "EXCEPTION / ADJUSTMENT",
      title: "Koreksi Darurat Terotorisasi",
      icon: SlidersHorizontal,
      accent: "bg-amber-50 text-amber-700 border-amber-200/70",
      desc: "Jalankan Adjustment pengecualian (barang rusak/susut) hanya dengan alasan tertulis, sesuai otorisasi.",
      href: "/inventory/adjustment",
      cta: "Koreksi Persediaan",
    },
  ];

  const movementBadgeClass: Record<string, string> = {
    RECEIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ISSUE: "bg-orange-50 text-orange-700 border-orange-200",
    TRANSFER: "bg-blue-50 text-blue-700 border-blue-200",
    RETURN: "bg-purple-50 text-purple-700 border-purple-200",
    ADJUSTMENT: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* Hero: governance identity */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white p-5 sm:p-8 md:p-10 shadow-2xl border-indigo-900/60">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/60 border-indigo-700/70 text-xs font-semibold text-indigo-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            ADMINISTRATOR • TATA KELOLA SISTEM
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Alur Tata Kelola & Konfigurasi Sistem
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Anda{" "}
            <strong className="text-white">
              menyiapkan dan menjaga fondasi sistem
            </strong>{" "}
            agar Petugas dan Supervisor dapat bekerja. Anda bukan operator
            gudang — pekerjaan rutin Receive/Issue/Transfer dilakukan oleh
            Petugas.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border-white/15">
              Peran saya: Penjaga fondasi & kebijakan sistem
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border-white/15">
              Output saya dipakai Petugas & Supervisor
            </span>
          </div>
        </div>
      </div>

      {/* Responsibility & limitation summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-5 border-emerald-200/70">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Tanggung Jawab Saya
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5">
            <li>
              Mengelola master data: Kategori, Satuan, Barang/SKU, Gudang, dan
              Lokasi.
            </li>
            <li>
              Menetapkan batas minimum stock sebagai kebijakan peringatan.
            </li>
            <li>Menjaga konfigurasi akun dan otorisasi peran pengguna.</li>
            <li>Menjaga integritas audit trail dan histori transaksi.</li>
          </ul>
        </div>
        <div className="glass-card rounded-2xl p-5 border-rose-200/70">
          <div className="flex items-center gap-2 mb-3">
            <ShieldX className="h-4 w-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Bukan Tugas Saya
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5">
            <li>
              Melakukan alur operasional rutin Receive / Issue / Transfer /
              Return.
            </li>
            <li>Menyetujui Stock Opname — itu wewenang Supervisor.</li>
            <li>
              Mengubah saldo stok langsung di luar dokumen transaksi resmi.
            </li>
            <li>Mengedit atau menghapus log audit (bersifat immutable).</li>
          </ul>
        </div>
      </div>

      {/* Main flow: vertical governance pipeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-indigo-600 rounded-full" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Alur Tata Kelola Saya
            </h2>
            <p className="text-xs text-slate-500">
              Dari menyiapkan master data sampai menjaga audit dan pengecualian.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
          <span className="font-mono">MASTER DATA</span>
          <ArrowDown className="h-3.5 w-3.5" />
          <span className="font-mono">ITEM &amp; SKU</span>
          <ArrowDown className="h-3.5 w-3.5" />
          <span className="font-mono">WAREHOUSE &amp; LOCATION</span>
          <ArrowDown className="h-3.5 w-3.5" />
          <span className="font-mono">SYSTEM CONTROL</span>
          <ArrowDown className="h-3.5 w-3.5" />
          <span className="font-mono">AUDIT &amp; HISTORY</span>
          <ArrowDown className="h-3.5 w-3.5" />
          <span className="font-mono text-amber-600">EXCEPTION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="glass-card rounded-2xl p-5 flex-col gap-3 border-slate-200/80"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {s.step}
                  </span>
                  <div
                    className={`p-2 rounded-xl border shadow-sm ${s.accent}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">
                    {s.stage}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">
                    {s.title}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
                <div className="mt-auto pt-1 space-y-1.5">
                  <Link href={s.href}>
                    <Button
                      size="sm"
                      className="w-full h-8 text-[11px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {s.cta}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                  {s.secondary && (
                    <Link href={s.secondary.href}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-[11px] rounded-xl border-slate-200/80"
                      >
                        {s.secondary.label}
                      </Button>
                    </Link>
                  )}
                </div>
                {idx === stages.length - 1 && (
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-amber-700 font-semibold">
                    <ShieldAlert className="h-3 w-3" />
                    Hanya dengan otorisasi & alasan tertulis
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Foundation relationship: how admin output enables the other roles */}
        <div className="rounded-2xl border-indigo-200/80 bg-gradient-to-r from-indigo-50/60 to-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-indigo-950">
              Fondasi yang Saya Bangun untuk Role Lain
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border-indigo-200/70">
              Master data siap
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border-emerald-200/70">
              Petugas menjalankan operasi gudang
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border-amber-200/70">
              Supervisor mengawasi & menyetujui
            </span>
          </div>
          <p className="text-xs text-indigo-900 mt-3 leading-relaxed">
            Barang hanya dapat ditransaksikan bila master datanya sudah{" "}
            <strong>ACTIVE</strong>. Karena itu akurasi master data Anda
            langsung menentukan kelancaran kerja Petugas dan ketepatan
            pengawasan Supervisor.
          </p>
        </div>
      </div>

      {/* Governance summary from existing data */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-slate-800 rounded-full" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Ringkasan Tata Kelola
            </h2>
            <p className="text-xs text-slate-500">
              Kondisi fondasi sistem dari data yang tersedia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Master Barang Aktif"
            value={counts.activeItems}
            description="Katalog SKU siap ditransaksikan"
            icon={Package}
            variant="indigo"
          />
          <MetricCard
            title="Infrastruktur Gudang"
            value={counts.activeWarehouses}
            description={`${counts.activeLocations} zona rak terdaftar`}
            icon={Warehouse}
            variant="default"
          />
          <MetricCard
            title="Kebijakan Min. Stock"
            value={counts.lowStockCount}
            description="Item di bawah batas minimum"
            icon={SlidersHorizontal}
            variant={counts.lowStockCount > 0 ? "warning" : "default"}
          />
          <MetricCard
            title="Volume Persediaan"
            value={counts.totalInventoryQty.toLocaleString()}
            description="Total unit stok di sistem"
            icon={Layers}
            variant="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Master data quick access */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Pusat Master Data
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                Entitas yang saya kelola
              </span>
            </div>
            <div className="space-y-1.5">
              {[
                {
                  label: "Katalog Barang & SKU",
                  href: "/items",
                  icon: Package,
                },
                {
                  label: "Fasilitas Gudang",
                  href: "/warehouses",
                  icon: Warehouse,
                },
                {
                  label: "Zona & Rak Lokasi",
                  href: "/locations",
                  icon: MapPin,
                },
                { label: "Kategori Produk", href: "/categories", icon: Tags },
                { label: "Satuan Ukuran", href: "/units", icon: Ruler },
              ].map((m) => {
                const MIcon = m.icon;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="flex items-center justify-between p-2.5 rounded-xl border-slate-100 bg-white/70 hover:bg-slate-50 hover:border-indigo-200 transition-colors text-xs font-medium text-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <MIcon className="h-3.5 w-3.5 text-indigo-600" />
                      {m.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Audit & history */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Audit & Histori Sistem
                </h3>
              </div>
              <Link href="/audit">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  Audit Trail <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                {
                  label: "Log Mutasi",
                  href: "/reports/movements",
                  icon: ScrollText,
                },
                {
                  label: "Rekap Opname",
                  href: "/reports/opnames",
                  icon: FileSpreadsheet,
                },
                {
                  label: "Stok Rendah",
                  href: "/reports/low-stock",
                  icon: SlidersHorizontal,
                },
                { label: "Audit Keamanan", href: "/audit", icon: ShieldAlert },
              ].map((r) => {
                const RIcon = r.icon;
                return (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="flex items-center gap-2 p-2.5 rounded-xl border-slate-100 bg-white/70 hover:bg-slate-50 hover:border-indigo-200 transition-colors text-xs font-medium text-slate-700"
                  >
                    <RIcon className="h-3.5 w-3.5 text-slate-500" />
                    {r.label}
                  </Link>
                );
              })}
            </div>

            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada pergerakan stok tercatat untuk diaudit.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 pb-1">
                  <Activity className="h-3.5 w-3.5" />
                  Aktivitas Ledger Terakhir
                </div>
                {recentMovements.slice(0, 3).map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center justify-between p-2.5 rounded-xl border-slate-100 bg-white/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold font-mono ${movementBadgeClass[m.type] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                      >
                        {m.type}
                      </Badge>
                      <span className="font-mono font-bold text-slate-800">
                        {m.sku}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        • {m.actorName}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
