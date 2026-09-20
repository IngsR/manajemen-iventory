import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';

export default async function HomePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (user.role === 'ADMIN') {
        redirect('/dashboard/admin');
    } else if (user.role === 'SUPERVISOR') {
        redirect('/dashboard/supervisor');
    } else if (user.role === 'PETUGAS') {
        redirect('/dashboard/petugas');
    }

    redirect('/login');
}
