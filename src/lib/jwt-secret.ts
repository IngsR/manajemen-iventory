// lib/jwt-secret.ts

const rawSecret =
    process.env.JWT_SECRET ||
    'fallback-super-secret-key-must-be-32-characters-minimum';

if (rawSecret.length < 32) {
    throw new Error(
        'JWT_SECRET must be at least 32 characters long for HS256 algorithm. Please check your .env config.',
    );
}

export const JWT_SECRET = new TextEncoder().encode(rawSecret);
