import type { SVGProps } from 'react';

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {/* Kotak besar sebagai gudang */}
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <rect x="10" y="5" width="4" height="4" />
        </svg>
    );
}
