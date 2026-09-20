"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loginAction } from "@/actions/AuthActions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Boxes,
  Eye,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Warehouse,
} from "lucide-react";

// Dev-only shortcuts. Each one fills the form, then submits it.
const DEV_ACCOUNTS = [
  {
    email: "admin@inventory.local",
    password: "admin123",
    label: "Admin",
    scope: "Tata Kelola",
    Icon: ShieldCheck,
    iconClass: "text-indigo-600",
  },
  {
    email: "supervisor@inventory.local",
    password: "supervisor123",
    label: "Supervisor",
    scope: "Approval",
    Icon: Eye,
    iconClass: "text-amber-600",
  },
  {
    email: "petugas@inventory.local",
    password: "petugas123",
    label: "Petugas",
    scope: "Operasional",
    Icon: Warehouse,
    iconClass: "text-emerald-600",
  },
];

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Controlled fields: the preset buttons must change the REAL input values,
  // and React only serialises FormData from its own state — writing straight
  // to input.value via ref would leave the submitted payload empty.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // A pending preset is applied from an effect so the values are committed to
  // the DOM before requestSubmit() reads the form.
  const [pendingPreset, setPendingPreset] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (pendingPreset === null) return;

    const account = DEV_ACCOUNTS[pendingPreset];
    setEmail(account.email);
    setPassword(account.password);

    if (emailRef.current) emailRef.current.value = account.email;
    if (passwordRef.current) passwordRef.current.value = account.password;

    setPendingPreset(null);
    formRef.current?.requestSubmit();
  }, [pendingPreset]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/10 mb-3">
          <Boxes className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          StockFlow ERP
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Sistem Manajemen Inventaris &amp; Logistik Terpadu
        </p>
      </div>

      <Card className="glass-card shadow-xl border-slate-200/80 overflow-hidden">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-800">
            Otorisasi Pengguna
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Silakan masukkan kredensial akun terdaftar untuk mengakses terminal.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {state?.error && (
            <div className="flex items-center gap-2.5 p-3 text-xs font-medium text-rose-700 bg-rose-50 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{state.error}</span>
            </div>
          )}

          {/* action={formAction} posts to the server action itself, so the
              browser never falls back to a GET of this URL. */}
          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Alamat Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@inventory.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs h-10 rounded-xl bg-white/90 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Kata Sandi (Password)
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-xs h-10 rounded-xl bg-white/90 border-slate-200"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memverifikasi Akses...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Masuk
                </>
              )}
            </Button>

            <div className="border-t border-slate-100 pt-3 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">
                Akses Cepat Mode Uji Coba (Dev Preset)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEV_ACCOUNTS.map((account, index) => (
                  <button
                    key={account.label}
                    type="button"
                    disabled={isPending}
                    onClick={() => setPendingPreset(index)}
                    title={`${account.email} / ${account.password}`}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-slate-50 transition-all text-center shadow-sm disabled:opacity-50"
                  >
                    <account.Icon className={`h-4 w-4 mb-1 ${account.iconClass}`} />
                    <span className="text-[11px] font-semibold text-slate-800 leading-tight">
                      {account.label}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      {account.scope}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
