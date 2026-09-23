import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/Auth";
import { hasPermission } from "@/lib/Permissions";
import {
  getDashboardCounts,
  getLowStockItems,
  getRecentMovements,
  getOpnameSummary,
} from "@/services/reporting/DashboardService";
import { getOpnameReport } from "@/services/reporting/InventoryReportService";
import { MetricCard } from "@/components/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Activity,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Boxes,
  ArrowRight,
  ShieldCheck,
  ShieldX,
  FileCheck2,
  Gavel,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alur Kerja Supervisor - StockFlow ERP",
  description:
    "Alur pengawasan stok, evaluasi selisih variance, dan keputusan approval Stock Opname oleh Supervisor",
};

export default async function SupervisorWorkflowPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.role, "STOCK_OPNAME_VIEW")) {
    redirect("/");
  }

  const [
    counts,
    lowStockItems,
    recentMovements,
    opnameSummary,
    pendingApprovals,
  ] = await Promise.all([
    getDashboardCounts(),
    getLowStockItems(4),
    getRecentMovements(5),
    getOpnameSummary(),
    getOpnameReport({ status: "SUBMITTED" }, 1, 5),
  ]);

  const submittedCount =
    opnameSummary.find((s) => s.status === "SUBMITTED")?.count ?? 0;
  const approvedCount =
    opnameSummary.find((s) => s.status === "APPROVED")?.count ?? 0;

  const steps = [
    {
      step: "01",
      title: "Pantau Kondisi Stok",
      desc: "Amati pergerakan barang dan pantau item dengan status stok kritis atau mendekati batas minimum.",
      href: "/reports/low-stock",
      cta: "Lihat Stok Kritis",
      icon: Eye,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      step: "02",
      title: "Terima Pengajuan Opname",
      desc: "Buka dokumen hitung fisik yang telah disubmit Petugas dan masuk ke daftar antrean peninjauan.",
      href: "/inventory/stock-opname",
      cta: "Buka Antrean",
      icon: ClipboardCheck,
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      step: "03",
      title: "Periksa Selisih (Variance)",
      desc: "Bandingkan jumlah fisik riil dengan catatan sistem untuk mengidentifikasi apakah selisih wajar.",
      href: "/inventory/stock-opname",
      cta: "Evaluasi Selisih",
      icon: Activity,
      color: "text-purple-700 bg-purple-50 border-purple-200",
    },
    {
      step: "04",
      title: "Keputusan Approve / Reject",
      desc: "Berikan keputusan resmi. Setelah Approve, sistem akan otomatis menyesuaikan saldo buku persediaan.",
      href: "/inventory/stock-opname",
      cta: "Beri Keputusan",
      icon: Gavel,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
          <Eye className="h-3.5 w-3.5 text-amber-600" />
          SUPERVISOR • PENGAWASAN & OTORISASI
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
            Alur Kerja Pengawasan & Persetujuan
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
            Anda adalah <strong className="text-slate-900 font-semibold">pengawas dan verifikator</strong> akurasi persediaan. Tugas utama Anda memantau stok kritis, memeriksa selisih (variance) dari penghitungan Petugas, dan memutuskan persetujuan (Approve/Reject) Stock Opname.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/80">
            Peran saya: Verifikator & pengambil keputusan
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            Setelah APPROVE → saldo sistem disesuaikan resmi
          </span>
        </div>
      </div>

      {/* ── 2. Tanggung Jawab & Batasan (Executive Overview) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-amber-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-800">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Tanggung Jawab Utama
            </h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
            <li>Memantau barang menipis (low stock) dan histori mutasi barang.</li>
            <li>Memeriksa hasil hitung fisik yang diajukan oleh Petugas.</li>
            <li>Menganalisis selisih kuantitas fisik vs sistem (variance analysis).</li>
            <li>Memberikan keputusan resmi persetujuan (Approve) atau penolakan (Reject).</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldX className="h-5 w-5 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Bukan Wewenang Supervisor
            </h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
            <li>Bukan eksekutor fisik rutin di gudang (Receive/Issue dilakukan Petugas).</li>
            <li>Tidak mengelola master konfigurasi sistem atau akun pengguna (Wewenang Admin).</li>
            <li>Tidak mengubah saldo barang secara langsung tanpa dokumen opname resmi.</li>
          </ul>
        </div>
      </div>

      {/* ── 3. Alur Tahapan Ringkas (Sequential Step Cards) ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Tahapan Pengawasan & Persetujuan
          </h2>
          <p className="text-xs text-slate-500">
            Alur terstruktur dari pemantauan stok hingga keputusan formal.
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

      {/* ── 4. Ringkasan Kondisi Saat Ini (Live Data) ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Status Pengawasan & Antrean
          </h2>
          <p className="text-xs text-slate-500">
            Data kondisi persediaan kritis dan dokumen opname yang memerlukan tindakan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Stok Menipis (Kritis)"
            value={counts.lowStockCount}
            description="Item di bawah batas minimum"
            icon={AlertTriangle}
            variant={counts.lowStockCount > 0 ? "warning" : "default"}
          />
          <MetricCard
            title="Total Persediaan"
            value={counts.totalInventoryQty.toLocaleString()}
            description="Total unit tercatat di sistem"
            icon={Boxes}
            variant="default"
          />
          <MetricCard
            title="Menunggu Keputusan"
            value={submittedCount}
            description="Dokumen opname siap direview"
            icon={Clock}
            variant={submittedCount > 0 ? "warning" : "default"}
            badge={submittedCount > 0 ? "Perlu Review" : "Nihil"}
          />
          <MetricCard
            title="Opname Disetujui"
            value={approvedCount}
            description="Telah selesai & saldo disesuaikan"
            icon={FileCheck2}
            variant="success"
          />
        </div>

        {/* Antrean Approval Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Antrean Dokumen Opname Menunggu Review
              </h3>
            </div>
            <Link href="/inventory/stock-opname">
              <span className="text-xs font-semibold text-amber-700 hover:underline">
                Buka Semua Dokumen →
              </span>
            </Link>
          </div>

          {pendingApprovals.data.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Tidak ada dokumen opname yang menunggu keputusan saat ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="pb-2.5">No. Dokumen</th>
                    <th className="pb-2.5">Diajukan Oleh</th>
                    <th className="pb-2.5">Waktu Submit</th>
                    <th className="pb-2.5 text-center">Jumlah Item</th>
                    <th className="pb-2.5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingApprovals.data.map((op) => (
                    <tr key={op._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-800">
                        {op.opnameNumber}
                      </td>
                      <td className="py-3 text-slate-700 font-medium">
                        {op.createdByName}
                      </td>
                      <td className="py-3 text-slate-500">
                        {op.submittedAt
                          ? new Date(op.submittedAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">
                        {op.itemCount}
                      </td>
                      <td className="py-3 text-right">
                        <Link href="/inventory/stock-opname">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
                          >
                            Review & Putuskan
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monitoring Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Low Stock Watchlist */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Barang Perlu Restock Segera
                </h3>
              </div>
              <Link href="/reports/low-stock">
                <span className="text-xs font-semibold text-amber-700 hover:underline">
                  Semua Laporan →
                </span>
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Semua item persediaan berada di atas batas minimum.
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="block font-mono text-[10px] text-slate-400">
                        {item.sku}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-rose-600">
                        {item.totalStock}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Min: {item.minStock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Movement Observation */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Pengawasan Mutasi Terakhir
                </h3>
              </div>
              <Link href="/reports/movements">
                <span className="text-xs font-semibold text-amber-700 hover:underline">
                  Buku Besar →
                </span>
              </Link>
            </div>
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada pergerakan barang yang tercatat.
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
