import React from 'react';
import Link from 'next/link';
import { requirePagePermission } from '@/lib/Auth';
import { getLowStockItems, LowStockItem } from '@/services/reporting/DashboardService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowDownToLine, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export default async function LowStockReportPage() {
    // Server-side authorization boundary (all roles hold INVENTORY_VIEW).
    const user = await requirePagePermission('INVENTORY_VIEW');

    const items = await getLowStockItems(200);

    const getStatusBadge = (item: LowStockItem) => {
        if (item.totalStock <= 0) {
            return (
                <Badge variant="destructive" className="font-bold text-[10px] tracking-wider uppercase">
                    Habis Total (0)
                </Badge>
            );
        }
        if (item.totalStock < item.minStock) {
            return (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] tracking-wider uppercase">
                    Stok Kritis
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="font-bold text-[10px] tracking-wider uppercase border-amber-300 text-amber-800">
                Di Batas Minimum
            </Badge>
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-rose-500" />
                        Laporan Stok Kritis (Low Stock Alert)
                    </h1>
                    <p className="text-sm text-slate-500">
                        Daftar barang dengan total stok fisik di bawah atau sama dengan batas kuantitas minimum
                    </p>
                </div>
                {user.role === 'PETUGAS' || user.role === 'ADMIN' ? (
                    <Link href="/inventory/receive">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                            <ArrowDownToLine className="h-4 w-4" />
                            Buat Penerimaan (Restock)
                        </Button>
                    </Link>
                ) : null}
            </div>

            {/* Table */}
            <Card className="border-slate-200">
                <CardContent className="p-0">
                    {items.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                title="Seluruh stok dalam kondisi aman"
                                description="Tidak ada barang dengan stok di bawah atau mendekati batas minimum."
                                icon={CheckCircle2}
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                                        <th className="py-3 px-4">SKU</th>
                                        <th className="py-3 px-4">Nama Barang</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-right">Stok Fisik Saat Ini</th>
                                        <th className="py-3 px-4 text-right">Batas Minimum</th>
                                        <th className="py-3 px-4 text-right">Kekurangan (Defisit)</th>
                                        <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <tr key={item.itemId} className="hover:bg-slate-50/80 transition">
                                            <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                                                {item.sku}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-slate-800">
                                                {item.name}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {getStatusBadge(item)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                                                {item.totalStock}
                                            </td>
                                            <td className="py-3 px-4 text-right text-slate-600">
                                                {item.minStock}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-rose-600">
                                                -{item.deficit}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Link href={`/inventory/receive?sku=${encodeURIComponent(item.sku)}`}>
                                                    <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700">
                                                        Restock
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
