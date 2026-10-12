import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';

/**
 * Root entry point.
 *
 * Hybrid rendering: this page is intentionally a static shell. All request-time
 * work (reading the session cookie + the user record) lives in `RoleRedirector`,
 * which is wrapped in `<Suspense>` and therefore streams in after the
 * prerendered shell. Nothing at this level touches a runtime API, so the entry
 * route is served from the static payload instead of being rendered per request.
 */
export default function HomePage() {
    return (
        <Suspense fallback={<RouteFallback />}>
            <RoleRedirector />
        </Suspense>
    );
}

/**
 * Reads the session only to hand the user to their role's dashboard.
 * Renders nothing: `redirect()` throws (Next.js) / the fallback stays on screen
 * for the instant the streamed chunk resolves.
 */
async function RoleRedirector() {
    const user = await getCurrentUser();

    if (user) {
        if (user.role === 'ADMIN') {
            redirect('/dashboard/admin');
        } else if (user.role === 'SUPERVISOR') {
            redirect('/dashboard/supervisor');
        } else if (user.role === 'PETUGAS') {
            redirect('/dashboard/petugas');
        }
    }

    redirect('/login');

    return <RouteFallback />;
}

/** Neutral placeholder — visible only for the instant the redirect resolves. */
function RouteFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200 animate-pulse" />
                <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
            </div>
        </div>
    );
}
