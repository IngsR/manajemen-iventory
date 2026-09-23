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
  ShieldCheck,
  ShieldX,
  Package,
  Warehouse,
  MapPin,
  Tags,
  Ruler,
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  Layers,
  Activity,
  ScrollText,
  FileSpreadsheet,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alur Tata Kelola Admin - StockFlow ERP",
  description:
    "Alur tata kelola sistem, manajemen master data, konfigurasi gudang, dan audit trail oleh Administrator",
};

export default async function AdminWorkflowPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  const [counts, recentMovements] = await Promise.all([
    getDashboardCounts(),
    getRecentMovements(5),
  ]);

  const steps = [
    {
      step: "01",
      title: "Klasifikasi Produk & Satuan",
      desc: "Tentukan kategori barang dan satuan ukuran resmi (PCS, BOX, UNIT) sebagai standar katalog.",
      href: "/categories",
      cta: "Kelola Kategori",
      icon: Tags,
      color: "text-indigo-700 bg-indigo-50 border-indigo-200",
    },
    {
      step: "02",
      title: "Katalog SKU & Batas Minimum",
      desc: "Daftarkan kode SKU barang baru dan tetapkan batas minimum stock sebagai acuan peringatan dini.",
      href: "/items",
      cta: "Katalog Barang",
      icon: Package,
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      step: "03",
      title: "Fasilitas Gudang & Lokasi Rak",
      desc: "Bangun struktur gudang fisik dan kodefikasi rak lokasi tempat penataan stok barang.",
      href: "/warehouses",
      cta: "Kelola Gudang",
      icon: Warehouse,
      color: "text-teal-700 bg-teal-50 border-teal-200",
    },
    {
      step: "04",
      title: "Audit Trail & Pengawasan",
      desc: "Pantau riwayat audit log seluruh aktivitas user dan buku besar mutasi untuk kepatuhan sistem.",
      href: "/audit",
      cta: "Buka Audit Log",
      icon: ShieldAlert,
      color: "text-slate-700 bg-slate-100 border-slate-200",
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
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* ── 1. Hero Summary (High Contrast & Clear Typography) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          ADMINISTRATOR • TATA KELOLA & KONFIGURASI
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
            Alur Tata Kelola & Konfigurasi Sistem
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
            Anda adalah <strong className="text-slate-900 font-semibold">pengelola fondasi sistem</strong>. Anda memastikan seluruh master data gudang, kategori, satuan, barang (SKU), dan audit trail terkonfigurasi dengan tepat agar Petugas dan Supervisor dapat beroperasi secara akurat.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/80">
            Peran saya: Penjaga fondasi & tata kelola master data
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80">
            Master data siap → dipakai Petugas & Supervisor
          </span>
        </div>
      </div>

      {/* ── 2. Tanggung Jawab & Batasan (Executive Overview) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-blue-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-blue-800">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Tanggung Jawab Utama
            </h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
            <li>Mengelola data master: Kategori, Satuan, Barang (SKU), Gudang, dan Rak Lokasi.</li>
            <li>Menetapkan ambang batas minimum persediaan sebagai pemicu peringatan dini.</li>
            <li>Mengatur akun pengguna dan hak akses operasional (Role-Based Access Control).</li>
            <li>Memantau audit trail untuk memastikan kepatuhan dan integritas sistem.</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldX className="h-5 w-5 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Bukan Tugas Admin
            </h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
            <li>Bukan operator fisik harian di lantai gudang (tugas Petugas).</li>
            <li>Tidak melakukan verifikasi dan approval Stock Opname fisik (tugas Supervisor).</li>
            <li>Tidak mengubah saldo barang tanpa catatan mutasi atau dokumen resmi.</li>
          </ul>
        </div>
      </div>

      {/* ── 3. Alur Tahapan Ringkas (Sequential Step Cards) ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Tahapan Tata Kelola
          </h2>
          <p className="text-xs text-slate-500">
            Urutan penyiapan struktur sistem untuk mendukung operasional gudang.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                      {s.step}
                    </span>
                    <div className={`p-2 rounded-xl border ${s.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {s.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>

                <Link href={s.href} className="pt-2">
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {s.cta}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Ringkasan Fondasi Sistem (Live Data) ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Status Master Data & Fondasi
          </h2>
          <p className="text-xs text-slate-500">
            Ringkasan entitas data master dan kepatuhan sistem terkini.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Katalog SKU Aktif"
            value={counts.activeItems}
            description="Item barang siap transaksi"
            icon={Package}
            variant="default"
          />
          <MetricCard
            title="Gudang & Lokasi"
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
            description="Total unit stok tercatat"
            icon={Layers}
            variant="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Master Data Menu */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Kelola Master Data</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "Katalog Barang & SKU", href: "/items", icon: Package },
                { label: "Fasilitas Gudang", href: "/warehouses", icon: Warehouse },
                { label: "Zona & Rak Lokasi", href: "/locations", icon: MapPin },
                { label: "Kategori Produk", href: "/categories", icon: Tags },
                { label: "Satuan Ukuran", href: "/units", icon: Ruler },
                { label: "Koreksi Stok (Adj)", href: "/inventory/adjustment", icon: SlidersHorizontal },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ItemIcon className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Audit & Compliance */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Audit & Log Aktivitas</h3>
              </div>
              <Link href="/audit">
                <span className="text-xs font-semibold text-blue-700 hover:underline">
                  Semua Log →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                { label: "Buku Besar Mutasi", href: "/reports/movements", icon: ScrollText },
                { label: "Rekapitulasi Opname", href: "/reports/opnames", icon: FileSpreadsheet },
                { label: "Peringatan Stok", href: "/reports/low-stock", icon: SlidersHorizontal },
                { label: "Audit Keamanan", href: "/audit", icon: ShieldAlert },
              ].map((r) => {
                const RIcon = r.icon;
                return (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-200 text-xs font-medium text-slate-700 transition-colors"
                  >
                    <RIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span>{r.label}</span>
                  </Link>
                );
              })}
            </div>

            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Belum ada aktivitas mutasi tercatat.
              </p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {recentMovements.slice(0, 3).map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold font-mono px-1.5 py-0.2 ${movementBadgeClass[m.type] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                      >
                        {m.type}
                      </Badge>
                      <span className="font-mono font-bold text-slate-800">
                        {m.sku}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900">
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
