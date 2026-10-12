/**
 * Shared response type for all inventory transaction server actions.
 */
export interface TransactionResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}
