import { Collection, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export type StockOpnameStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface OpnameUserRef {
    userId: ObjectId;
    name: string;
    role: string;
}

export interface StockOpnameDoc {
    _id: ObjectId;
    opnameNumber: string;
    warehouseId: ObjectId;
    status: StockOpnameStatus;
    createdBy: OpnameUserRef;
    createdAt: Date;
    submittedAt?: Date;
    reviewedBy?: OpnameUserRef;
    reviewedAt?: Date;
    rejectionReason?: string;
    notes?: string;
}

export interface StockOpnameItemDoc {
    _id: ObjectId;
    stockOpnameId: ObjectId;
    itemId: ObjectId;
    sku: string;
    locationId: ObjectId;
    systemQuantity: number;
    countedQuantity: number;
    difference: number;
    createdAt: Date;
    updatedAt: Date;
}

const OPNAME_COLLECTION = 'stock_opnames';
const OPNAME_ITEM_COLLECTION = 'stock_opname_items';

export async function getStockOpnameCollection(): Promise<Collection<StockOpnameDoc>> {
    const db = await getMongoDb();
    return db.collection<StockOpnameDoc>(OPNAME_COLLECTION);
}

export async function getStockOpnameItemCollection(): Promise<Collection<StockOpnameItemDoc>> {
    const db = await getMongoDb();
    return db.collection<StockOpnameItemDoc>(OPNAME_ITEM_COLLECTION);
}

export async function initStockOpnameIndexes(): Promise<void> {
    const opnameCol = await getStockOpnameCollection();
    await opnameCol.createIndex(
        { opnameNumber: 1 },
        { unique: true, name: 'uniq_opname_number' }
    );
    await opnameCol.createIndex(
        { warehouseId: 1, createdAt: -1 },
        { name: 'idx_opname_warehouse_created' }
    );
    await opnameCol.createIndex(
        { status: 1, createdAt: -1 },
        { name: 'idx_opname_status_created' }
    );

    const itemCol = await getStockOpnameItemCollection();
    await itemCol.createIndex(
        { stockOpnameId: 1, itemId: 1, locationId: 1 },
        { unique: true, name: 'uniq_opname_item_location' }
    );
    await itemCol.createIndex(
        { stockOpnameId: 1 },
        { name: 'idx_opname_item_opnameId' }
    );
}
