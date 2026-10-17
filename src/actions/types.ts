/**
 * Shared response contracts for all Server Actions.
 * Import dari sini, bukan dari domain action tertentu.
 */

/** Response standar untuk CRUD master data (Category, Item, Unit, dll) */
export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Response untuk transaksi inventaris (receive, issue, transfer, dsb) */
export interface TransactionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/** Response untuk alur Stock Opname (dengan field code untuk error handling granular) */
export interface OpnameActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
