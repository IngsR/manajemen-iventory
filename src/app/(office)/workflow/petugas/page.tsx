import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/Auth";
import { hasPermission } from "@/lib/Permissions";
import {
  getDashboardCounts,
  getRecentMovements,
  getOpnameSummary,
} from "@/services/reporting/DashboardService";
import { MetricCard } from "@/components/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  RotateCcw,
  SlidersHorizontal,
  ClipboardPen,
  Send,
  ArrowRight,
  Boxes,
  Package,
  Activity,
  ShieldCheck,
  ShieldX,
  Inbox,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alur Kerja Petugas Gudang - StockFlow ERP",
  description:
    "Siklus kerja operasional petugas gudang: Penerimaan, Penataan Rak, Pengeluaran, Retur, dan Stock Opname",
};

export default async function OfficerWorkflowPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.role, "INVENTORY_VIEW")) {
    redirect("/");
  }

  const [counts, recentMovements, opnameSummary] = await Promise.all([
    getDashboardCounts(),
    getRecentMovements(5),
    getOpnameSummary(),
  ]);

  const submittedCount =
    opnameSummary.find((s) => s.status === "SUBMITTED")?.count ?? 0;
  const draftCount =
    opnameSummary.find((s) => s.status === "DRAFT")?.count ?? 0;

  const steps = [
    {
      step: "01",
      title: "Penerimaan Barang",
      desc: "Periksa fisik barang dari supplier, cocokkan surat jalan, dan catat stok masuk ke lokasi inbound.",
      href: "/inventory/receive",
      cta: "Catat Penerimaan",
      icon: ArrowDownToLine,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      step: "02",
      title: "Penataan / Transfer Rak",
      desc: "Pindahkan barang dari area penerimaan ke rak penyimpanan permanen agar posisi stok rapi dan terlacak.",
      href: "/inventory/transfer",
      cta: "Catat Transfer",
      icon: ArrowLeftRight,
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      step: "03",
      title: "Pengeluaran & Retur",
      desc: "Catat barang yang keluar untuk kebutuhan operasional atau input barang kembali bila ada pengembalian.",
      href: "/inventory/issue",
      cta: "Catat Pengeluaran",
      icon: ArrowUpFromLine,
      color: "text-orange-700 bg-orange-50 border-orange-200",
    },
    {
      step: "04",
      title: "Hitung Fisik (Opname)",
      desc: "Lakukan audit fisik rutin per item di rak, masukkan kuantitas aktual ke draft formulir opname.",
      href: "/inventory/stock-opname",
      cta: "Input Opname",
      icon: ClipboardPen,
      color: "text-teal-700 bg-teal-50 border-teal-200",
    },
    {
      step: "05",
      title: "Pengajuan ke Supervisor",
      desc: "Kunci dokumen opname setelah selesai hitung dan klik SUBMIT untuk diteruskan ke antrean Supervisor.",
      href: "/inventory/stock-opname",
      cta: "Buka Dokumen",
      icon: Send,
      color: "text-amber-700 bg-amber-50 border-amber-200",
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <Boxes className="h-3.5 w-3.5 text-emerald-600" />
          OFFICER / PETUGAS • PELAKSANA LAPANGAN
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
            Alur Kerja Operasional Gudang
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
            Anda adalah <strong className="text-slate-900 font-semibold">pelaksana lapangan</strong>. Setiap pergerakan barang fisik Anda catat sebagai transaksi resmi, mulai dari barang masuk sampai penghitungan fisik yang diajukan ke Supervisor.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/80">
            Peran saya: Eksekutor transaksi fisik
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80">
            Setelah SUBMIT → berpindah ke Supervisor
          </span>
        </div>
      </div>

      {/* ── 2. Tanggung Jawab & Batasan (Executive Overview) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Tanggung Jawab Utama
            </h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
            <li>Menerima dan memeriksa fisik barang masuk dari supplier (Receive).</li>
            <li>Menata dan memindahkan barang ke rak penyimpanan (Transfer/Putaway).</li>
            <li>Mencatat pengeluaran barang (Issue) dan pengembalian barang (Return).</li>
            <li>Melakukan penghitungan fisik gudang dan memasukkan data Stock Opname.</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldX className="h-5 w-5 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Bukan Wewenang Petugas
            </h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
            <li>Menyetujui (Approve) atau menolak (Reject) Stock Opname — wewenang Supervisor.</li>
            <li>Mengubah data master barang, gudang, dan satuan — wewenang Admin.</li>
            <li>Mengubah saldo stok langsung secara manual di luar transaksi resmi.</li>
          </ul>
        </div>
      </div>

      {/* ── 3. Alur Tahapan Ringkas (Sequential Step Cards) ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Tahapan Siklus Harian
          </h2>
          <p className="text-xs text-slate-500">
            Ringkasan alur kerja dari fisik di lapangan hingga tersimpan di sistem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
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

      {/* ── 4. Ringkasan Kondisi Saat Ini (Live Data) ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Status Operasional
          </h2>
          <p className="text-xs text-slate-500">
            Kondisi persediaan dan aktivitas terkini yang tercatat di sistem.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Katalog Barang"
            value={counts.activeItems}
            description="Item yang dapat ditransaksikan"
            icon={Package}
            variant="default"
          />
          <MetricCard
            title="Total Stok Fisik"
            value={counts.totalInventoryQty.toLocaleString()}
            description="Unit tercatat di seluruh lokasi"
            icon={Boxes}
            variant="default"
          />
          <MetricCard
            title="Opname Draft"
            value={draftCount}
            description="Perlu diselesaikan & disubmit"
            icon={ClipboardPen}
            variant="default"
          />
          <MetricCard
            title="Menunggu Supervisor"
            value={submittedCount}
            description="Dokumen dalam antrean review"
            icon={Send}
            variant={submittedCount > 0 ? "warning" : "default"}
            badge={submittedCount > 0 ? "In Review" : "Nihil"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Quick Access Menu */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Inbox className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Menu Transaksi Cepat</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: "Penerimaan", href: "/inventory/receive", icon: ArrowDownToLine },
                { label: "Transfer Rak", href: "/inventory/transfer", icon: ArrowLeftRight },
                { label: "Pengeluaran", href: "/inventory/issue", icon: ArrowUpFromLine },
                { label: "Retur Barang", href: "/inventory/return", icon: RotateCcw },
                { label: "Adjustment", href: "/inventory/adjustment", icon: SlidersHorizontal },
                { label: "Stock Opname", href: "/inventory/stock-opname", icon: ClipboardPen },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <ItemIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Transaksi Terakhir</h3>
              </div>
              <Link href="/reports/movements">
                <span className="text-xs font-semibold text-emerald-700 hover:underline">
                  Semua Riwayat →
                </span>
              </Link>
            </div>
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada transaksi barang yang tercatat.
              </p>
            ) : (
              <div className="space-y-2">
                {recentMovements.map((m) => (
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
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900">
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {new Date(m.timestamp).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
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
