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
import { StatusDot } from "@/components/shared/StatusDot";
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
  MoveRight,
  Inbox,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alur Kerja Petugas Gudang - StockFlow ERP",
  description:
    "Siklus kerja operasional petugas gudang: Receive, Putaway, Issue, Return, Stock Opname, dan Submit",
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

  // Officer operational cycle — physical work that ends in a system record.
  const cycle = [
    {
      step: "01",
      stage: "RECEIVE",
      title: "Penerimaan Barang",
      icon: ArrowDownToLine,
      accent: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
      ring: "hover:border-emerald-300",
      when: "Barang datang dari supplier / vendor ke gudang.",
      does: "Verifikasi fisik, jumlah, dan kondisi barang, lalu catat dokumen penerimaan.",
      effect: "Stok (+) bertambah di lokasi inbound.",
      after:
        "Barang masuk area inbound dan siap di-putaway ke rak penyimpanan.",
      href: "/inventory/receive",
      cta: "Catat Penerimaan",
    },
    {
      step: "02",
      stage: "PUTAWAY",
      title: "Transfer / Penataan Rak",
      icon: ArrowLeftRight,
      accent: "bg-blue-50 text-blue-700 border-blue-200/70",
      ring: "hover:border-blue-300",
      when: "Barang inbound perlu dipindahkan ke rak penyimpanan tetap.",
      does: "Pindahkan stok antar lokasi/rak dengan dokumen transfer.",
      effect: "Stok (-) di asal dan (+) di tujuan, tercatat atomik.",
      after:
        "Barang tersimpan di storage location dan siap dikeluarkan atau dihitung.",
      href: "/inventory/transfer",
      cta: "Catat Transfer",
    },
    {
      step: "03",
      stage: "ISSUE / RETURN",
      title: "Pengeluaran & Retur",
      icon: ArrowUpFromLine,
      accent: "bg-orange-50 text-orange-700 border-orange-200/70",
      ring: "hover:border-orange-300",
      when: "Barang diminta keluar (order/produksi) atau dikembalikan.",
      does: "Catat pengeluaran resmi (Issue) atau pengembalian barang (Return).",
      effect: "Issue: stok (-). Return: stok (+) kembali ke persediaan.",
      after:
        "Mutasi tercatat pada ledger dan memengaruhi saldo lokasi terkait.",
      href: "/inventory/issue",
      cta: "Catat Pengeluaran",
      alt: [
        { label: "Retur Barang", href: "/inventory/return", icon: RotateCcw },
        {
          label: "Adjustment",
          href: "/inventory/adjustment",
          icon: SlidersHorizontal,
        },
      ],
    },
    {
      step: "04",
      stage: "STOCK OPNAME",
      title: "Penghitungan Fisik",
      icon: ClipboardPen,
      accent: "bg-teal-50 text-teal-700 border-teal-200/70",
      ring: "hover:border-teal-300",
      when: "Jadwal opname berkala atau instruksi Supervisor.",
      does: "Hitung kuantitas fisik riil per item di rak dan input ke dokumen opname.",
      effect: "Belum mengubah saldo — hanya mencatat angka fisik.",
      after: "Sistem menghitung variance (selisih) fisik vs sistem.",
      href: "/inventory/stock-opname",
      cta: "Input Hitung Opname",
    },
    {
      step: "05",
      stage: "SUBMIT",
      title: "Pengajuan ke Supervisor",
      icon: Send,
      accent: "bg-amber-50 text-amber-700 border-amber-200/70",
      ring: "hover:border-amber-300",
      when: "Seluruh item pada dokumen opname selesai dihitung.",
      does: "Kunci dokumen dan ajukan hasil hitung untuk direview.",
      effect: "Saldo belum berubah; dokumen berstatus SUBMITTED.",
      after: "Pekerjaan berpindah ke Supervisor untuk review & keputusan.",
      href: "/inventory/stock-opname",
      cta: "Buka Dokumen Opname",
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
      {/* Hero: role identity + main job */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 text-white p-5 sm:p-8 md:p-10 shadow-2xl border-emerald-900/60">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border-emerald-700/70 text-xs font-semibold text-emerald-200">
            <Boxes className="h-3.5 w-3.5" />
            OFFICER / PETUGAS • PELAKSANA LAPANGAN
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Alur Kerja Operasional Gudang
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Anda adalah{" "}
            <strong className="text-white">pelaksana lapangan</strong>. Setiap
            pergerakan barang fisik Anda catat sebagai transaksi resmi, mulai
            dari barang masuk sampai penghitungan fisik yang diajukan ke
            Supervisor.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border-white/15">
              Peran saya: Eksekutor transaksi fisik
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border-white/15">
              Setelah SUBMIT → berpindah ke Supervisor
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
            <li>Menerima dan memverifikasi barang masuk (Receive).</li>
            <li>Menata barang ke rak penyimpanan (Transfer / Putaway).</li>
            <li>Mencatat pengeluaran (Issue) dan pengembalian (Return).</li>
            <li>Menghitung fisik gudang dan menginput hasil Stock Opname.</li>
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
            <li>Approve / Reject Stock Opname — itu wewenang Supervisor.</li>
            <li>
              Mengelola master data (Barang, Gudang, Lokasi, Kategori, Satuan).
            </li>
            <li>Mengubah saldo stok langsung di luar transaksi resmi.</li>
          </ul>
        </div>
      </div>

      {/* Main cycle: horizontal stage flow */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-emerald-600 rounded-full" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Siklus Kerja Harian
            </h2>
            <p className="text-xs text-slate-500">
              Dari pekerjaan fisik di lantai sampai pencatatan sistem yang bisa
              diaudit.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
          <span className="font-mono">RECEIVE</span>
          <MoveRight className="h-3.5 w-3.5" />
          <span className="font-mono">PUTAWAY</span>
          <MoveRight className="h-3.5 w-3.5" />
          <span className="font-mono">ISSUE / RETURN</span>
          <MoveRight className="h-3.5 w-3.5" />
          <span className="font-mono">STOCK OPNAME</span>
          <MoveRight className="h-3.5 w-3.5" />
          <span className="font-mono text-amber-600">SUBMIT</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {cycle.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className={`glass-card rounded-2xl p-5 flex-col gap-3 border-slate-200/80 transition-all duration-200 ${s.ring}`}
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
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <p className="text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Kapan:{" "}
                    </span>
                    {s.when}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-700">
                      Yang saya lakukan:{" "}
                    </span>
                    {s.does}
                  </p>
                  <p
                    className={`px-2 py-1 rounded-lg border ${s.accent} font-medium`}
                  >
                    {s.effect}
                  </p>
                  <p className="flex items-start gap-1.5 text-slate-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {s.after}
                  </p>
                </div>
                <div className="mt-auto pt-1 space-y-1.5">
                  <Link href={s.href}>
                    <Button
                      size="sm"
                      className="w-full h-8 text-[11px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      {s.cta}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                  {s.alt?.map((a) => {
                    const AltIcon = a.icon;
                    return (
                      <Link key={a.href} href={a.href}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-[11px] rounded-xl border-slate-200/80"
                        >
                          <AltIcon className="h-3 w-3 mr-1.5 text-slate-500" />
                          {a.label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Handoff to Supervisor */}
        <div className="rounded-2xl border-amber-200/80 bg-gradient-to-r from-amber-50/60 to-white p-5 flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Setelah SUBMIT, alur berpindah ke Supervisor
              </h3>
              <p className="text-xs text-amber-800">
                Hasil hitung fisik Anda masuk antrean review. Supervisor yang
                memutuskan APPROVE atau REJECT, dan hanya setelah APPROVE saldo
                sistem disesuaikan.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-600 text-white uppercase tracking-wider shrink-0">
            Supervisor Review
          </span>
        </div>
      </div>

      {/* Tugas Saya / Ringkasan operasional dari data yang tersedia */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-slate-800 rounded-full" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Ringkasan Operasional Saya
            </h2>
            <p className="text-xs text-slate-500">
              Kondisi terkini dari data sistem yang sudah tersedia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Katalog Barang Aktif"
            value={counts.activeItems}
            description="Item yang dapat saya transaksikan"
            icon={Package}
            variant="success"
          />
          <MetricCard
            title="Total Stok Fisik"
            value={counts.totalInventoryQty.toLocaleString()}
            description="Unit tercatat di seluruh lokasi"
            icon={Boxes}
            variant="default"
          />
          <MetricCard
            title="Opname Saya (Draft)"
            value={draftCount}
            description="Belum disubmit ke Supervisor"
            icon={ClipboardPen}
            variant="indigo"
          />
          <MetricCard
            title="Menunggu Supervisor"
            value={submittedCount}
            description="Dokumen opname sudah disubmit"
            icon={Send}
            variant={submittedCount > 0 ? "warning" : "default"}
            badge={submittedCount > 0 ? "In Review" : "Selesai"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Antrean kerja saya */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Aksi Cepat</h3>
              </div>
              <span className="text-[10px] text-slate-400">
                Pekerjaan yang boleh saya jalankan
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Receive",
                  href: "/inventory/receive",
                  icon: ArrowDownToLine,
                },
                {
                  label: "Transfer",
                  href: "/inventory/transfer",
                  icon: ArrowLeftRight,
                },
                {
                  label: "Issue",
                  href: "/inventory/issue",
                  icon: ArrowUpFromLine,
                },
                { label: "Return", href: "/inventory/return", icon: RotateCcw },
                {
                  label: "Adjustment",
                  href: "/inventory/adjustment",
                  icon: SlidersHorizontal,
                },
                {
                  label: "Stock Opname",
                  href: "/inventory/stock-opname",
                  icon: ClipboardPen,
                },
              ].map((q) => {
                const QIcon = q.icon;
                return (
                  <Link
                    key={q.href}
                    href={q.href}
                    className="flex items-center gap-2 p-2.5 rounded-xl border-slate-100 bg-white/70 hover:bg-slate-50 hover:border-emerald-200 transition-colors text-xs font-medium text-slate-700"
                  >
                    <QIcon className="h-3.5 w-3.5 text-emerald-600" />
                    {q.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Aktivitas fisik terakhir */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Catatan Transaksi Terakhir
                </h3>
              </div>
              <Link href="/reports/movements">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-emerald-700 hover:bg-emerald-50 rounded-lg"
                >
                  Riwayat <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Belum ada pergerakan barang yang saya catat.
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
