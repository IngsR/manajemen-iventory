'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Header } from './Header';

interface ConditionalHeaderProps {
    children: ReactNode;
}

export function ConditionalHeader({ children }: ConditionalHeaderProps) {
    const pathname = usePathname();

    if (pathname === '/login') {
        return null;
    }
    return <>{children}</>;
}
