"use client";

import { useActionState, useRef, useState } from "react";
import { loginAction } from "@/actions/AuthActions";
import {
    AlertCircle,
    Boxes,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
    Shield,
    UserCheck,
    Warehouse,
} from "lucide-react";

interface RoleOption {
    id: "ADMIN" | "SUPERVISOR" | "PETUGAS";
    name: string;
    email: string;
    pass: string;
    description: string;
    icon: typeof Shield;
}

const ROLES: RoleOption[] = [
    {
        id: "ADMIN",
        name: "Administrator",
        email: "admin@inventory.local",
        pass: "admin123",
        description: "Akses penuh manajemen data, pengguna, dan laporan sistem.",
        icon: Shield,
    },
    {
        id: "SUPERVISOR",
        name: "Supervisor",
        email: "supervisor@inventory.local",
        pass: "supervisor123",
        description: "Akses verifikasi stok fisik dan persetujuan stock opname.",
        icon: UserCheck,
    },
    {
        id: "PETUGAS",
        name: "Petugas",
        email: "petugas@inventory.local",
        pass: "petugas123",
        description: "Akses pencatatan barang masuk, keluar, transfer, dan retur.",
        icon: Warehouse,
    },
];

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(loginAction, null);

    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const [selectedRole, setSelectedRole] = useState<RoleOption>(ROLES[0]);
    const [email, setEmail] = useState(ROLES[0].email);
    const [password, setPassword] = useState(ROLES[0].pass);
    const [showPassword, setShowPassword] = useState(false);

    const handleSelectRole = (role: RoleOption) => {
        setSelectedRole(role);
        setEmail(role.email);
        setPassword(role.pass);
        if (emailRef.current) emailRef.current.value = role.email;
        if (passwordRef.current) passwordRef.current.value = role.pass;
    };

    return (
        <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between items-center px-4 py-8 sm:py-12 text-slate-800">
            {/* ── Brand Header ── */}
            <div className="flex flex-col items-center gap-2">
                <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30">
                    <Boxes className="h-6 w-6" />
                </div>
                <div className="text-center">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                        StockFlow
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                        Sistem Manajemen Inventaris
                    </p>
                </div>
            </div>

            {/* ── Login Form Card ── */}
            <div className="w-full max-w-[420px] my-6">
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
                    {/* Header Text */}
                    <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Masuk ke Akun
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Silakan masukkan email dan kata sandi Anda untuk melanjutkan.
                        </p>
                    </div>

                    {/* Role Preset Selector (Formal & Light) */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                            Pilih Akses Peran:
                        </label>
                        <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-3 gap-1 border border-slate-200/70">
                            {ROLES.map((role) => {
                                const isSelected = selectedRole.id === role.id;
                                const Icon = role.icon;
                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => handleSelectRole(role)}
                                        className={[
                                            "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                            isSelected
                                                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50",
                                        ].join(" ")}
                                    >
                                        <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                                        <span>{role.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 px-1 leading-normal">
                            {selectedRole.description}
                        </p>
                    </div>

                    {/* Error Message */}
                    {state?.error && (
                        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                            <span>{state.error}</span>
                        </div>
                    )}

                    {/* Form Fields */}
                    <form action={formAction} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-slate-700 mb-1.5"
                            >
                                Alamat Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <input
                                    ref={emailRef}
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama@inventory.local"
                                    className="w-full h-11 bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-normal"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label
                                    htmlFor="password"
                                    className="text-xs font-semibold text-slate-700"
                                >
                                    Kata Sandi
                                </label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <input
                                    ref={passwordRef}
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full h-11 bg-white border border-slate-300 rounded-xl pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-normal"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-11 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-150 shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <span>Masuk ke Sistem</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* ── Footer ── */}
            <footer className="text-center text-xs text-slate-400">
                <p>© 2026 StockFlow • Sistem Informasi Manajemen Inventaris</p>
            </footer>
        </main>
    );
}
