'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    getUsersAction,
    createUserAction,
    updateUserRoleAction,
    toggleUserStatusAction,
    SafeUser,
} from '@/actions/user-actions';
import { UserRole, UserStatus } from '@/models/UserModel';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { FormCard } from '@/components/shared/FormCard';
import { MetricCard } from '@/components/MetricCard';
import { StatusDot } from '@/components/shared/StatusDot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    UserCheck,
    ShieldCheck,
    Eye,
    Boxes,
    Plus,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Power,
} from 'lucide-react';

export default function UsersManagementPage() {
    const [users, setUsers] = useState<SafeUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Form create states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('PETUGAS');
    const [submitting, setSubmitting] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await getUsersAction();
        if (res.success && res.data) {
            setUsers(res.data);
        } else {
            setError(res.error || 'Gagal memuat daftar pengguna.');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setSubmitting(true);

        const fd = new FormData();
        fd.append('name', name);
        fd.append('email', email);
        fd.append('password', password);
        fd.append('role', role);

        const res = await createUserAction(fd);
        setSubmitting(false);

        if (res.success) {
            setMessage(res.message || 'Pengguna berhasil dibuat.');
            setName('');
            setEmail('');
            setPassword('');
            setRole('PETUGAS');
            loadUsers();
        } else {
            setError(res.error || 'Gagal membuat pengguna.');
        }
    }

    async function handleRoleChange(userId: string, newRole: UserRole) {
        setUpdatingId(userId);
        setError(null);
        setMessage(null);

        const res = await updateUserRoleAction(userId, newRole);
        setUpdatingId(null);

        if (res.success) {
            setMessage(res.message || `Peran pengguna berhasil diperbarui ke ${newRole}.`);
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
            );
        } else {
            setError(res.error || 'Gagal mengubah peran.');
        }
    }

    async function handleStatusToggle(userId: string, currentStatus: UserStatus) {
        setUpdatingId(userId);
        setError(null);
        setMessage(null);

        const newStatus: UserStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const res = await toggleUserStatusAction(userId, newStatus);
        setUpdatingId(null);

        if (res.success) {
            setMessage(res.message || `Status pengguna berhasil diubah ke ${newStatus}.`);
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
            );
        } else {
            setError(res.error || 'Gagal mengubah status.');
        }
    }

    const adminCount = users.filter((u) => u.role === 'ADMIN').length;
    const supvCount = users.filter((u) => u.role === 'SUPERVISOR').length;
    const petugasCount = users.filter((u) => u.role === 'PETUGAS').length;

    const getRoleBadgeStyle = (userRole: UserRole) => {
        switch (userRole) {
            case 'ADMIN':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'SUPERVISOR':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'PETUGAS':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
            <PageHeader
                title="Manajemen Pengguna & Otorisasi RBAC"
                subtitle="Tata kelola kredensial akun, hak otorisasi peran (Admin, Supervisor, Petugas), dan status aktifasi."
                icon={Users}
                badge={{ label: 'GOVERNANCE & SECURITY', variant: 'admin' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Tata Kelola', href: '/dashboard/admin' },
                    { label: 'Manajemen Pengguna' },
                ]}
            />

            {/* Notifications */}
            {error && (
                <div className="flex items-center gap-2.5 p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {message && (
                <div className="flex items-center gap-2.5 p-3.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl animate-fade-in">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{message}</span>
                </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Pengguna"
                    value={users.length}
                    description="Seluruh akun terdaftar di sistem"
                    icon={Users}
                    variant="default"
                />
                <MetricCard
                    title="Administrator"
                    value={adminCount}
                    description="Otoritas tata kelola & konfigurasi"
                    icon={ShieldCheck}
                    variant="indigo"
                />
                <MetricCard
                    title="Supervisor"
                    value={supvCount}
                    description="Otoritas verifikasi & approval opname"
                    icon={Eye}
                    variant="warning"
                />
                <MetricCard
                    title="Officer / Petugas"
                    value={petugasCount}
                    description="Pelaksana transaksi operasional fisik"
                    icon={Boxes}
                    variant="success"
                />
            </div>

            {/* Form Add User */}
            <FormCard
                title="Tambah Pengguna Baru"
                description="Daftarkan akun staf baru dan tentukan peran akses sesuai tanggung jawab korporat."
                icon={Plus}
                footer={
                    <Button
                        type="submit"
                        form="create-user-form"
                        disabled={submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 rounded-xl shadow-sm px-5"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Mendaftarkan...
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                Simpan Akun Pengguna
                            </>
                        )}
                    </Button>
                }
            >
                <form id="create-user-form" onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="usr-name" className="text-xs font-semibold text-slate-700">
                            Nama Lengkap *
                        </Label>
                        <Input
                            id="usr-name"
                            required
                            placeholder="Contoh: Budi Santoso"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="usr-email" className="text-xs font-semibold text-slate-700">
                            Alamat Email *
                        </Label>
                        <Input
                            id="usr-email"
                            type="email"
                            required
                            placeholder="budi@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="text-xs h-9 rounded-xl font-mono"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="usr-pwd" className="text-xs font-semibold text-slate-700">
                            Password Awal (Min. 6) *
                        </Label>
                        <Input
                            id="usr-pwd"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="usr-role" className="text-xs font-semibold text-slate-700">
                            Penugasan Peran (RBAC) *
                        </Label>
                        <select
                            id="usr-role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3 font-semibold"
                        >
                            <option value="PETUGAS">PETUGAS (Lantai Operasional)</option>
                            <option value="SUPERVISOR">SUPERVISOR (Pengawasan & Approval)</option>
                            <option value="ADMIN">ADMIN (Tata Kelola Penuh)</option>
                        </select>
                    </div>
                </form>
            </FormCard>

            {/* Users Table */}
            <DataTable
                title="Daftar Pengguna Sistem & Hak Akses"
                description="Kelola hak akses dan status operasional staf. Perubahan peran langsung berlaku efektif pada sesi berikutnya."
                badgeCount={users.length}
                dataLength={users.length}
                emptyTitle="Belum Ada Pengguna"
                emptyDescription="Daftarkan pengguna pertama menggunakan form di atas."
                emptyIcon={Users}
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                        <span>Memuat data pengguna...</span>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50/75">
                            <TableRow>
                                <TableHead className="text-xs font-bold text-slate-700">PENGGUNA</TableHead>
                                <TableHead className="w-[180px] text-xs font-bold text-slate-700">PERAN (RBAC)</TableHead>
                                <TableHead className="w-[140px] text-xs font-bold text-slate-700">STATUS AKUN</TableHead>
                                <TableHead className="w-[150px] text-xs font-bold text-slate-700">TERDAFTAR</TableHead>
                                <TableHead className="w-[120px] text-right text-xs font-bold text-slate-700">AKSI 1-KLIK</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => {
                                const isUpdating = updatingId === u._id;
                                return (
                                    <TableRow key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs text-slate-900">{u.name}</span>
                                                <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                                            </div>
                                        </TableCell>

                                        {/* 1-Click Role Switcher */}
                                        <TableCell>
                                            <select
                                                value={u.role}
                                                disabled={isUpdating}
                                                onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                                                className={`text-xs font-bold rounded-lg border px-2 py-1 cursor-pointer transition-colors ${getRoleBadgeStyle(
                                                    u.role
                                                )}`}
                                                title="Klik untuk mengubah peran pengguna langsung"
                                            >
                                                <option value="PETUGAS">PETUGAS</option>
                                                <option value="SUPERVISOR">SUPERVISOR</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`text-[11px] font-bold ${
                                                    u.status === 'ACTIVE'
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-200 bg-slate-50 text-slate-500'
                                                }`}
                                            >
                                                <StatusDot
                                                    variant={u.status === 'ACTIVE' ? 'success' : 'neutral'}
                                                    size="sm"
                                                    className="mr-1.5"
                                                />
                                                {u.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-xs text-slate-500 font-mono">
                                            {new Date(u.createdAt).toLocaleDateString('id-ID')}
                                        </TableCell>

                                        {/* 1-Click Status Toggle */}
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={isUpdating}
                                                onClick={() => handleStatusToggle(u._id, u.status)}
                                                className={`h-7 px-2.5 text-xs rounded-lg font-medium transition-colors ${
                                                    u.status === 'ACTIVE'
                                                        ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                                                        : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                                }`}
                                                title={u.status === 'ACTIVE' ? 'Nonaktifkan akun ini' : 'Aktifkan kembali akun ini'}
                                            >
                                                {isUpdating ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <Power className="h-3 w-3 mr-1" />
                                                )}
                                                {u.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </DataTable>
        </div>
    );
}
