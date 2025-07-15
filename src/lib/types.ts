import { z } from 'zod';
import type { JWTPayload } from 'jose';

/* =========================
   USER MANAGEMENT TYPES
========================= */
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

interface LoginResult {
    success: boolean;
    message: string;
    user?: Pick<User, 'id' | 'username' | 'role'>;
}

export const LoginFormSchema = z.object({
    username: z.string().min(1, 'Username harus diisi'),
    password: z.string().min(1, 'Password harus diisi'),
});
export type LoginFormSchemaType = z.infer<typeof LoginFormSchema>;

export const CreateUserFormSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100),
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
    password: z.string().min(6).max(100),
});
export type ChangePasswordFormData = z.infer<typeof ChangePasswordFormSchema>;

export const ChangeUsernameFormSchema = z.object({
    username: z.string().min(3).max(50),
});
export type ChangeUsernameFormData = z.infer<typeof ChangeUsernameFormSchema>;

/* =========================
   INVENTORY ITEM TYPES
========================= */
export interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    category: string;
    location?: string | null;
}

export const ItemFormSchema = z.object({
    name: z.string().min(1).max(100),
    quantity: z.coerce.number().int().min(0),
    category: z.string().min(1).max(50),
    location: z.string().max(100).optional(),
});
export type ItemFormData = z.infer<typeof ItemFormSchema>;

export const AdjustQuantityFormSchema = z.object({
    quantity: z.coerce.number().int().min(0),
});
export type AdjustQuantityFormData = z.infer<typeof AdjustQuantityFormSchema>;

/* =========================
   DEFECTIVE ITEM TYPES
========================= */
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
    inventory_item_id: z.coerce.number().positive(),
    item_name_at_log_time: z.string(),
    quantity_defective: z.coerce.number().int().min(1),
    reason: z.string().min(1).max(255),
    status: DefectiveItemStatusEnum.default('Pending Review'),
    notes: z.string().max(500).optional(),
});
export type LogDefectiveItemFormData = z.infer<
    typeof LogDefectiveItemFormSchema
>;

export const UpdateDefectiveItemStatusFormSchema = z.object({
    status: DefectiveItemStatusEnum,
    notes: z.string().max(500).optional(),
});
export type UpdateDefectiveItemStatusFormData = z.infer<
    typeof UpdateDefectiveItemStatusFormSchema
>;

/* =========================
   SESSION / AUTH TYPES
========================= */
export interface SessionPayload extends JWTPayload {
    userId: number;
    role: UserRole;
}

/* =========================
   ACTIVITY LOG TYPES
========================= */
export interface ActivityLog {
    id: number;
    user_id: number | null;
    username_at_log_time: string;
    action: string;
    details?: string | null;
    logged_at: string;
}
