import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                navy: {
                    50:  '#F0F4FF',
                    100: '#E0E9FE',
                    200: '#C1D3FD',
                    300: '#92AFF9',
                    400: '#5C81F4',
                    500: '#3359ED',
                    600: '#1D38D3',
                    700: '#1A2FAB',
                    800: '#1B2B8A',
                    900: '#0F172A',
                    950: '#080D1A',
                },
                ink: {
                    DEFAULT: '#0F172A',
                    soft: '#1E293B',
                    muted: '#334155',
                    faint: '#64748B',
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl:  "0.875rem",
                "2xl": "1rem",
                "3xl": "1.25rem",
            },
            boxShadow: {
                'card': '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)',
                'card-hover': '0 2px 4px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.10)',
                'btn': '0 2px 8px rgba(37,99,235,0.35)',
                'btn-hover': '0 6px 20px rgba(37,99,235,0.45)',
                'dialog': '0 24px 64px rgba(15,23,42,0.20)',
                'dropdown': '0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
            },
            animation: {
                'fade-up':    'fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
                'fade-in':    'fadeIn 0.25s ease both',
                'scale-in':   'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
                'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
                'slide-left': 'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1) both',
                'pulse-dot':  'pulseDot 2s ease-in-out infinite',
                'shimmer':    'shimmer 1.5s infinite',
            },
            keyframes: {
                fadeUp: {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to:   { opacity: '1' },
                },
                scaleIn: {
                    from: { opacity: '0', transform: 'scale(0.96)' },
                    to:   { opacity: '1', transform: 'scale(1)' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' },
                },
                slideInLeft: {
                    from: { opacity: '0', transform: 'translateX(-16px)' },
                    to:   { opacity: '1', transform: 'translateX(0)' },
                },
                pulseDot: {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%':      { opacity: '0.5', transform: 'scale(0.85)' },
                },
                shimmer: {
                    '0%':   { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            transitionTimingFunction: {
                'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
        },
    },
    plugins: [],
} satisfies Config;
