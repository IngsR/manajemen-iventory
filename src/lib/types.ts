import { z } from 'zod';

// User Management Types
export const UserRoleEnum = z.enum(['admin', 'employee']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserStatusEnum = z.enum(['active', 'suspended']);
export type UserStatus = z.infer<typeof UserStatusEnum>;

export interface User {
    id: number;
    username: string;
    role: UserRole;
    status: UserStatus;
    created_at: string;
    updated_at: string;
}

export const LoginFormSchema = z.object({
    username: z.string().min(1, 'Username harus diisi'),
    password: z.string().min(1, 'Password harus diisi'),
});
export type LoginFormSchemaType = z.infer<typeof LoginFormSchema>;

export const CreateUserFormSchema = z.object({
    username: z
        .string()
        .min(3, 'Username minimal 3 karakter')
        .max(50, 'Username maksimal 50 karakter'),
    password: z
        .string()
        .min(6, 'Password minimal 6 karakter')
        .max(100, 'Password maksimal 100 karakter'),
    status: UserStatusEnum.default('active'),
});
export type CreateUserFormData = z.infer<typeof CreateUserFormSchema>;

export const UpdateUserStatusFormSchema = z.object({
    status: UserStatusEnum,
});
export type UpdateUserStatusFormData = z.infer<
    typeof UpdateUserStatusFormSchema
>;

export const ChangePasswordFormSchema = z.object({
    password: z
        .string()
        .min(6, 'Password baru minimal 6 karakter')
        .max(100, 'Password maksimal 100 karakter'),
});
export type ChangePasswordFormData = z.infer<typeof ChangePasswordFormSchema>;

export const ChangeUsernameFormSchema = z.object({
    username: z
        .string()
        .min(3, 'Username minimal 3 karakter')
        .max(50, 'Username maksimal 50 karakter'),
});
export type ChangeUsernameFormData = z.infer<typeof ChangeUsernameFormSchema>;

// Inventory Item Types
export interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    category: string;
    location?: string | null;
}

export const ItemFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Nama item harus diisi')
        .max(100, 'Nama item maksimal 100 karakter'),
    quantity: z.coerce
        .number()
        .int('Kuantitas harus berupa angka bulat')
        .min(0, 'Kuantitas tidak boleh negatif'),
    category: z
        .string()
        .min(1, 'Kategori harus diisi')
        .max(50, 'Kategori maksimal 50 karakter'),
    location: z.string().max(100, 'Lokasi maksimal 100 karakter').optional(),
});
export type ItemFormData = z.infer<typeof ItemFormSchema>;

export const AdjustQuantityFormSchema = z.object({
    quantity: z.coerce
        .number()
        .int('Kuantitas harus berupa angka bulat')
        .min(0, 'Kuantitas tidak boleh negatif'),
});
export type AdjustQuantityFormData = z.infer<typeof AdjustQuantityFormSchema>;

// Defective Item Types
export const DefectiveItemStatusEnum = z.enum([
    'Pending Review',
    'Returned to Supplier',
    'Disposed',
    'Repaired',
    'Awaiting Parts',
]);
export type DefectiveItemStatus = z.infer<typeof DefectiveItemStatusEnum>;

export const DefectiveItemReasonSuggestions = [
    'Kerusakan Fisik (Pengiriman)',
    'Kerusakan Fisik (Penyimpanan)',
    'Kesalahan Produksi',
    'Kedaluwarsa',
    'Tidak Sesuai Spesifikasi',
    'Komponen Hilang',
    'Lainnya (jelaskan di catatan)',
];

export interface DefectiveItemLog {
    id: number;
    inventory_item_id: number;
    item_name_at_log_time: string;
    quantity_defective: number;
    reason: string;
    status: DefectiveItemStatus;
    notes?: string | null;
    logged_at: string;
    updated_at: string;
}

export interface DefectiveItemLogEntry extends DefectiveItemLog {
    inventory_item_name: string;
}

export const LogDefectiveItemFormSchema = z.object({
    inventory_item_id: z.coerce
        .number({ invalid_type_error: 'ID Item harus berupa angka' })
        .positive('Item inventaris harus dipilih'),
    item_name_at_log_time: z.string(),
    quantity_defective: z.coerce
        .number()
        .int('Kuantitas cacat harus berupa angka bulat')
        .min(1, 'Kuantitas cacat minimal 1'),
    reason: z
        .string()
        .min(1, 'Alasan harus diisi')
        .max(255, 'Alasan maksimal 255 karakter'),
    status: DefectiveItemStatusEnum.default('Pending Review'),
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});
export type LogDefectiveItemFormData = z.infer<
    typeof LogDefectiveItemFormSchema
>;

export const UpdateDefectiveItemStatusFormSchema = z.object({
    status: DefectiveItemStatusEnum,
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});
export type UpdateDefectiveItemStatusFormData = z.infer<
    typeof UpdateDefectiveItemStatusFormSchema
>;

// Session type for middleware and auth checks
export interface SessionPayload {
    userId: number;
    role: UserRole;
    iat?: number;
    exp?: number;
}

// Activity Log Types
export interface ActivityLog {
    id: number;
    user_id: number | null;
    username_at_log_time: string;
    action: string;
    details?: string | null;
    logged_at: string;
}
