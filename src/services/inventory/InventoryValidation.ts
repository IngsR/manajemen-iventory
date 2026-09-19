import { ObjectId, ClientSession } from 'mongodb';
import { getItemCollection, ItemDoc } from '@/models/ItemModel';
import { getLocationCollection, LocationDoc } from '@/models/LocationModel';
import { InventoryError } from './InventoryErrors';

export interface ValidatedItem {
    _id: ObjectId;
    sku: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface ValidatedLocation {
    _id: ObjectId;
    warehouseId: ObjectId;
    code: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export async function validateItem(
    itemId: string,
    session?: ClientSession
): Promise<ValidatedItem> {
    if (!ObjectId.isValid(itemId)) {
        throw new InventoryError('INVALID_INPUT', `Invalid item ID: ${itemId}`);
    }

    const col = await getItemCollection();
    const item = (await col.findOne(
        { _id: new ObjectId(itemId), isDeleted: false },
        { session }
    )) as ItemDoc | null;

    if (!item) {
        throw new InventoryError('ITEM_NOT_FOUND', `Item not found: ${itemId}`);
    }
    if (item.status === 'INACTIVE') {
        throw new InventoryError('ITEM_INACTIVE', `Item is inactive: ${item.name}`);
    }

    return {
        _id: item._id as ObjectId,
        sku: item.sku,
        name: item.name,
        status: item.status,
    };
}

export async function validateLocation(
    locationId: string,
    session?: ClientSession
): Promise<ValidatedLocation> {
    if (!ObjectId.isValid(locationId)) {
        throw new InventoryError('INVALID_INPUT', `Invalid location ID: ${locationId}`);
    }

    const col = await getLocationCollection();
    const loc = (await col.findOne(
        { _id: new ObjectId(locationId), isDeleted: false },
        { session }
    )) as LocationDoc | null;

    if (!loc) {
        throw new InventoryError('LOCATION_NOT_FOUND', `Location not found: ${locationId}`);
    }
    if (loc.status === 'INACTIVE') {
        throw new InventoryError('LOCATION_INACTIVE', `Location is inactive: ${loc.name}`);
    }

    return {
        _id: loc._id as ObjectId,
        warehouseId: loc.warehouseId,
        code: loc.code,
        name: loc.name,
        status: loc.status,
    };
}

export function validateQuantity(quantity: number, allowNegative = false): void {
    if (!Number.isFinite(quantity)) {
        throw new InventoryError('INVALID_INPUT', 'Quantity must be a finite number');
    }
    if (!allowNegative && quantity <= 0) {
        throw new InventoryError('INVALID_INPUT', 'Quantity must be greater than zero');
    }
    if (allowNegative && quantity === 0) {
        throw new InventoryError('INVALID_INPUT', 'Quantity delta must not be zero');
    }
    if (!Number.isInteger(quantity)) {
        throw new InventoryError('INVALID_INPUT', 'Quantity must be a whole number (no decimals)');
    }
}
