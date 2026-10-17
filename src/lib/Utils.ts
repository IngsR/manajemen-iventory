import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Konversi dokumen MongoDB (ObjectId, Date, dsb) menjadi plain JSON-serializable object.
 * Wajib dipakai sebelum data dari Server Action dikirim ke Client Component.
 */
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
