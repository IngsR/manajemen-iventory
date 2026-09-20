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
import { StatusDot } from "@/components/shared/StatusDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Activity,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Boxes,
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  ShieldX,
  ScrollText,
  FileCheck2,
  Gavel,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alur Kerja Supervisor - StockFlow ERP",
  description:
    "Alur pengawasan, review variance, dan keputusan approval Stock Opname oleh Supervisor",
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

  // Supervisor flow — oversight, review, decision. No warehouse execution.
  const flow = [
    {
      step: "01",
      stage: "MONITOR",
      title: "Pantau Kondisi Stok",
      icon: Eye,
      accent: "bg-amber-50 text-amber-700 border-amber-200/70",
      desc: "Amati stok kritis, low stock, dan aktivitas mutasi gudang sebagai bahan pengawasan.",
      outputs: "Mengetahui item yang perlu restock atau investigasi.",
      href: "/reports/low-stock",
      cta: "Lihat Stok Kritis",
      secondary: { label: "Buku Besar Mutasi", href: "/reports/movements" },
    },
    {
      step: "02",
      stage: "OPNAME MASUK",
      title: "Terima Pengajuan Opname",
      icon: ClipboardCheck,
      accent: "bg-blue-50 text-blue-700 border-blue-200/70",
      desc: "Dokumen Stock Opname yang sudah di-submit Petugas masuk ke antrean review Anda.",
      outputs: "Daftar dokumen berstatus SUBMITTED siap diperiksa.",
      href: "/inventory/stock-opname",
      cta: "Buka Antrean Review",
    },
    {
      step: "03",
      stage: "REVIEW VARIANCE",
      title: "Periksa Selisih Fisik",
      icon: Activity,
      accent: "bg-purple-50 text-purple-700 border-purple-200/70",
      desc: "Bandingkan hasil hitung fisik dengan saldo sistem, telusuri penyebab variance.",
      outputs: "Menilai apakah selisih wajar dan dapat disetujui.",
      href: "/inventory/stock-opname",
      cta: "Periksa Detail",
    },
    {
      step: "04",
      stage: "APPROVE / REJECT",
      title: "Ambil Keputusan",
      icon: Gavel,
      accent: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
      desc: "Setujui atau tolak hasil opname. Ini keputusan formal yang mengikat saldo.",
      outputs: "Dokumen dikunci dengan keputusan final beserta jejak audit.",
      href: "/inventory/stock-opname",
      cta: "Putuskan Sekarang",
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
      {/* Hero: oversight identity */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900 text-white p-5 sm:p-8 md:p-10 shadow-2xl border-amber-900/60">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-800/60 border-amber-700/70 text-xs font-semibold text-amber-100">
            <Eye className="h-3.5 w-3.5" />
            SUPERVISOR • PENGAWASAN & APPROVAL
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Alur Kerja Pengawasan & Persetujuan
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Anda adalah <strong className="text-white">pengawas</strong>, bukan
            operator gudang. Pekerjaan utama Anda: memantau kondisi stok,
            menerima hasil opname Petugas, menilai variance, lalu memberikan
            keputusan <strong className="text-white">Approve</strong> atau{" "}
            <strong className="text-white">Reject</strong>.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border-white/15">
              Peran saya: Verifikator & pemberi keputusan
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border-white/15">
              Menerima pekerjaan dari Petugas
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
            <li>Memantau kondisi stok kritis dan aktivitas mutasi gudang.</li>
            <li>Mereview hasil hitung fisik Stock Opname dari Petugas.</li>
            <li>Menilai variance dan menelusuri penyebab selisih.</li>
            <li>Memberikan keputusan Approve / Reject secara formal.</li>
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
              Menjalankan Receive, Issue, Transfer, Return rutin di lantai
              gudang.
            </li>
            <li>
              Mengelola master data (Barang, Gudang, Lokasi, Kategori, Satuan).
            </li>
            <li>Mengubah angka hitung fisik Petugas tanpa verifikasi.</li>
          </ul>
        </div>
      </div>

      {/* Main flow: vertical oversight pipeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-amber-600 rounded-full" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Alur Pengawasan Saya
            </h2>
            <p className="text-xs text-slate-500">
              Dari memantau kondisi sampai memberi keputusan atas hasil opname
              Petugas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
          <span className="font-mono">MONITOR</span>
          <ArrowDown className="h-3.5 w-3.5" />
          <span className="font-mono">OPNAME MENUNGGU REVIEW</span>
          <ArrowDown className="h-3.5 w-3.5" />
          <span className="font-mono">REVIEW VARIANCE</span>
          <ArrowDown className="h-3.5 w-3.5" />
          <span className="font-mono text-indigo-600">APPROVE / REJECT</span>
        </div>

        <div className="space-y-3">
          {flow.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="glass-card rounded-2xl p-5 flex-col md:flex-row md:items-center gap-4 border-slate-200/80"
              >
                <div className="flex items-center gap-3 md:w-64 shrink-0">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {s.step}
                  </span>
                  <div
                    className={`p-2.5 rounded-xl border shadow-sm ${s.accent}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 block">
                      {s.stage}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {s.title}
                    </h3>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Hasil:{" "}
                    </span>
                    {s.outputs}
                  </p>
                </div>
                <div className="flex md:flex-col gap-2 shrink-0 md:w-40">
                  <Link href={s.href}>
                    <Button
                      size="sm"
                      className="w-full h-8 text-[11px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
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
              </div>
            );
          })}
        </div>

        {/* Decision outcome: Approve vs Reject */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-950">
                Jika APPROVE
              </h3>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Sistem menjalankan penyesuaian saldo melalui mekanisme adjustment
              yang sudah ada, sehingga stok sistem kembali sesuai hasil hitung
              fisik. Keputusan tercatat pada audit trail.
            </p>
          </div>
          <div className="rounded-2xl border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-rose-600" />
              <h3 className="text-sm font-bold text-rose-950">Jika REJECT</h3>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              Saldo sistem tetap tidak berubah. Dokumen opname perlu
              ditindaklanjuti — hitung ulang atau perbaikan data oleh Petugas
              sebelum diajukan kembali.
            </p>
          </div>
        </div>
      </div>

      {/* Oversight summary from existing data */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-slate-800 rounded-full" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Ringkasan Pengawasan
            </h2>
            <p className="text-xs text-slate-500">
              Kondisi terkini sebagai bahan keputusan Anda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Menunggu Review Saya"
            value={submittedCount}
            description="Dokumen opname berstatus SUBMITTED"
            icon={Clock}
            variant={submittedCount > 0 ? "warning" : "default"}
            badge={submittedCount > 0 ? "Perlu Keputusan" : "Bersih"}
          />
          <MetricCard
            title="Stok Kritis"
            value={counts.lowStockCount}
            description="Item di bawah batas minimum"
            icon={AlertTriangle}
            variant={counts.lowStockCount > 0 ? "danger" : "default"}
          />
          <MetricCard
            title="Total Stok Fisik"
            value={counts.totalInventoryQty.toLocaleString()}
            description="Unit tercatat di sistem"
            icon={Boxes}
            variant="default"
          />
          <MetricCard
            title="Opname Disetujui"
            value={approvedCount}
            description="Dokumen opname telah di-approve"
            icon={FileCheck2}
            variant="success"
          />
        </div>

        {/* Priority approval queue */}
        <div className="glass-card rounded-2xl p-6 border-amber-200/70 bg-gradient-to-r from-amber-50/40 to-white">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900">
                Antrean Opname Menunggu Keputusan Saya
              </h3>
            </div>
            <Link href="/inventory/stock-opname">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-amber-700 hover:bg-amber-100/60 rounded-xl"
              >
                Semua Dokumen <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {pendingApprovals.data.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Tidak ada dokumen opname yang menunggu keputusan Anda saat ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-200/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5">No. Opname</th>
                    <th className="pb-2.5">Diajukan Oleh</th>
                    <th className="pb-2.5">Waktu Submit</th>
                    <th className="pb-2.5 text-center">Item</th>
                    <th className="pb-2.5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/80">
                  {pendingApprovals.data.map((op) => (
                    <tr
                      key={op._id}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="py-3 font-mono font-bold text-slate-800">
                        {op.opnameNumber}
                      </td>
                      <td className="py-3 text-slate-700 font-medium">
                        {op.createdByName}
                      </td>
                      <td className="py-3 text-slate-500">
                        {op.submittedAt
                          ? new Date(op.submittedAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "-"}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">
                        {op.itemCount}
                      </td>
                      <td className="py-3 text-right">
                        <Link href="/inventory/stock-opname">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
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

        {/* Monitoring data: transactions are read-only observation, not actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Bahan Pengawasan: Stok Kritis
                </h3>
              </div>
              <Link href="/reports/low-stock">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-amber-700 hover:bg-amber-50 rounded-lg"
                >
                  Selengkapnya <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Seluruh barang berada pada tingkat persediaan aman.
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between p-2.5 rounded-xl border-slate-100 bg-white/60 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800">
                        {item.sku}
                      </span>
                      <p className="text-slate-600 mt-0.5">{item.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600 block">
                        {item.totalStock} / Min {item.minStock}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Defisit {item.deficit} unit
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Bahan Pengawasan: Aktivitas Mutasi
                </h3>
              </div>
              <Link href="/reports/movements">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-amber-700 hover:bg-amber-50 rounded-lg"
                >
                  Buku Besar <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Data observasi aktivitas Petugas — bukan aksi yang Anda eksekusi.
            </p>
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada pergerakan stok tercatat.
              </p>
            ) : (
              <div className="space-y-2">
                {recentMovements.map((m) => (
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
                    <div className="flex items-center gap-2">
                      <StatusDot variant="info" size="sm" />
                      <span className="font-bold text-slate-900">
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/audit">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs border-slate-200/80"
            >
              <ScrollText className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
              Buka Histori Log Audit
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
