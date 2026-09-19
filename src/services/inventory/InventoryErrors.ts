export type InventoryErrorCode =
    | 'INVALID_INPUT'
    | 'ITEM_NOT_FOUND'
    | 'ITEM_INACTIVE'
    | 'LOCATION_NOT_FOUND'
    | 'LOCATION_INACTIVE'
    | 'WAREHOUSE_NOT_FOUND'
    | 'INSUFFICIENT_STOCK'
    | 'SAME_LOCATION_TRANSFER'
    | 'TRANSACTION_FAILED';

export class InventoryError extends Error {
    readonly code: InventoryErrorCode;

    constructor(code: InventoryErrorCode, message: string) {
        super(message);
        this.name = 'InventoryError';
        this.code = code;
    }
}

export function isInventoryError(err: unknown): err is InventoryError {
    return err instanceof InventoryError;
}
