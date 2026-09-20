import { ObjectId } from 'mongodb';
import {
    getStockOpnameCollection,
    getStockOpnameItemCollection,
    StockOpnameDoc,
    StockOpnameItemDoc,
    StockOpnameStatus,
} from '@/models/StockOpnameModel';
import { getStockMovementCollection } from '@/models/StockMovementModel';
import { getWarehouseCollection } from '@/models/WarehouseModel';
import { getLocationCollection } from '@/models/LocationModel';
import { getItemCollection } from '@/models/ItemModel';
import { generateMovementNumber, generateOpnameNumber } from '@/lib/AtomicCounter';
import {
    incrementBalance,
    decrementBalance,
    getCurrentBalance,
    withInventoryTransaction,
} from './InventoryStockHelper';
import { InventoryError } from './InventoryErrors';
import { createAuditLog } from '@/services/AuditLogService';

export interface OpnameActor {
    userId: string;
    name: string;
    role: string;
}

export interface PopulatedOpnameItem extends StockOpnameItemDoc {
    itemName?: string;
    locationName?: string;
    locationCode?: string;
}

export interface PopulatedOpnameDetail extends StockOpnameDoc {
    warehouseName?: string;
    items: PopulatedOpnameItem[];
}

// ── 1. Create Stock Opname (DRAFT) ──────────────────────────────────────────

export async function createStockOpname(input: {
    warehouseId: string;
    notes?: string;
    actor: OpnameActor;
}): Promise<{ stockOpnameId: string; opnameNumber: string }> {
    const { warehouseId, notes, actor } = input;

    if (!ObjectId.isValid(warehouseId)) {
        throw new InventoryError('INVALID_INPUT', 'ID Gudang tidak valid.');
    }

    const warehouseCol = await getWarehouseCollection();
    const warehouse = await warehouseCol.findOne({
        _id: new ObjectId(warehouseId),
        isDeleted: false,
    });
    if (!warehouse) {
        throw new InventoryError('NOT_FOUND', 'Gudang tidak ditemukan atau sudah nonaktif.');
    }

    const opnameNumber = await generateOpnameNumber();
    const now = new Date();
    const actorOid = new ObjectId(actor.userId);
    const opnameCol = await getStockOpnameCollection();

    const doc: StockOpnameDoc = {
        _id: new ObjectId(),
        opnameNumber,
        warehouseId: new ObjectId(warehouseId),
        status: 'DRAFT',
        createdBy: {
            userId: actorOid,
            name: actor.name,
            role: actor.role,
        },
        createdAt: now,
        notes: notes?.trim() || undefined,
    };

    await opnameCol.insertOne(doc);

    await createAuditLog({
        actorId: actorOid,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'CREATE',
        resource: 'STOCK_OPNAME',
        resourceId: opnameNumber,
        details: {
            warehouseId,
            warehouseName: warehouse.name,
            notes: doc.notes,
        },
        timestamp: now,
    });

    return {
        stockOpnameId: doc._id.toHexString(),
        opnameNumber,
    };
}

// ── 2. Add or Update Detail Item in Opname (DRAFT only) ──────────────────────

export async function addOrUpdateStockOpnameItem(input: {
    stockOpnameId: string;
    itemId: string;
    locationId: string;
    countedQuantity: number;
    actor: OpnameActor;
}): Promise<StockOpnameItemDoc> {
    const { stockOpnameId, itemId, locationId, countedQuantity } = input;

    if (!ObjectId.isValid(stockOpnameId) || !ObjectId.isValid(itemId) || !ObjectId.isValid(locationId)) {
        throw new InventoryError('INVALID_INPUT', 'Parameter ID tidak valid.');
    }

    if (isNaN(countedQuantity) || countedQuantity < 0 || !Number.isInteger(countedQuantity)) {
        throw new InventoryError('INVALID_INPUT', 'Jumlah fisik (countedQuantity) harus bilangan bulat >= 0.');
    }

    const opnameCol = await getStockOpnameCollection();
    const opnameOid = new ObjectId(stockOpnameId);
    const opname = await opnameCol.findOne({ _id: opnameOid });

    if (!opname) {
        throw new InventoryError('NOT_FOUND', 'Dokumen stock opname tidak ditemukan.');
    }

    if (opname.status !== 'DRAFT') {
        throw new InventoryError('INVALID_STATE', `Hanya opname berstatus DRAFT yang dapat diubah. Status saat ini: ${opname.status}`);
    }

    const itemCol = await getItemCollection();
    const itemOid = new ObjectId(itemId);
    const item = await itemCol.findOne({ _id: itemOid, isDeleted: false });
    if (!item) {
        throw new InventoryError('NOT_FOUND', 'Barang tidak ditemukan atau sudah nonaktif.');
    }

    const locCol = await getLocationCollection();
    const locOid = new ObjectId(locationId);
    const location = await locCol.findOne({ _id: locOid, isDeleted: false });
    if (!location) {
        throw new InventoryError('NOT_FOUND', 'Lokasi tidak ditemukan atau sudah nonaktif.');
    }

    if (!location.warehouseId.equals(opname.warehouseId)) {
        throw new InventoryError('INVALID_INPUT', 'Lokasi tidak berada dalam gudang opname ini.');
    }

    // Take snapshot of current stock balance
    const systemQuantity = await getCurrentBalance(itemOid, locOid);
    const difference = countedQuantity - systemQuantity;
    const now = new Date();

    const itemColOpname = await getStockOpnameItemCollection();

    const existing = await itemColOpname.findOne({
        stockOpnameId: opnameOid,
        itemId: itemOid,
        locationId: locOid,
    });

    if (existing) {
        await itemColOpname.updateOne(
            { _id: existing._id },
            {
                $set: {
                    countedQuantity,
                    difference,
                    updatedAt: now,
                },
            }
        );
        return {
            ...existing,
            countedQuantity,
            difference,
            updatedAt: now,
        };
    } else {
        const newDoc: StockOpnameItemDoc = {
            _id: new ObjectId(),
            stockOpnameId: opnameOid,
            itemId: itemOid,
            sku: item.sku,
            locationId: locOid,
            systemQuantity,
            countedQuantity,
            difference,
            createdAt: now,
            updatedAt: now,
        };
        await itemColOpname.insertOne(newDoc);
        return newDoc;
    }
}

// ── 3. Remove Detail Item (DRAFT only) ───────────────────────────────────────

export async function removeStockOpnameItem(
    stockOpnameId: string,
    stockOpnameItemId: string
): Promise<void> {
    if (!ObjectId.isValid(stockOpnameId) || !ObjectId.isValid(stockOpnameItemId)) {
        throw new InventoryError('INVALID_INPUT', 'ID tidak valid.');
    }

    const opnameCol = await getStockOpnameCollection();
    const opname = await opnameCol.findOne({ _id: new ObjectId(stockOpnameId) });
    if (!opname) {
        throw new InventoryError('NOT_FOUND', 'Dokumen opname tidak ditemukan.');
    }
    if (opname.status !== 'DRAFT') {
        throw new InventoryError('INVALID_STATE', 'Item hanya dapat dihapus saat opname berstatus DRAFT.');
    }

    const itemCol = await getStockOpnameItemCollection();
    await itemCol.deleteOne({
        _id: new ObjectId(stockOpnameItemId),
        stockOpnameId: opname._id,
    });
}

// ── 4. Submit Stock Opname for Review ────────────────────────────────────────

export async function submitStockOpname(
    stockOpnameId: string,
    actor: OpnameActor
): Promise<{ success: true; opnameNumber: string }> {
    if (!ObjectId.isValid(stockOpnameId)) {
        throw new InventoryError('INVALID_INPUT', 'ID Opname tidak valid.');
    }

    const opnameCol = await getStockOpnameCollection();
    const opnameOid = new ObjectId(stockOpnameId);
    const opname = await opnameCol.findOne({ _id: opnameOid });

    if (!opname) {
        throw new InventoryError('NOT_FOUND', 'Dokumen opname tidak ditemukan.');
    }

    if (opname.status !== 'DRAFT') {
        throw new InventoryError('INVALID_STATE', `Hanya opname berstatus DRAFT yang dapat diajukan. Status saat ini: ${opname.status}`);
    }

    const itemCol = await getStockOpnameItemCollection();
    const itemsCount = await itemCol.countDocuments({ stockOpnameId: opnameOid });
    if (itemsCount === 0) {
        throw new InventoryError('EMPTY_OPNAME', 'Opname harus memiliki minimal satu detail barang sebelum dapat diajukan.');
    }

    const now = new Date();
    await opnameCol.updateOne(
        { _id: opnameOid },
        {
            $set: {
                status: 'SUBMITTED',
                submittedAt: now,
            },
        }
    );

    await createAuditLog({
        actorId: new ObjectId(actor.userId),
        actorName: actor.name,
        actorRole: actor.role,
        action: 'UPDATE',
        resource: 'STOCK_OPNAME',
        resourceId: opname.opnameNumber,
        details: {
            statusChange: { before: 'DRAFT', after: 'SUBMITTED' },
            itemsCount,
        },
        timestamp: now,
    });

    return { success: true, opnameNumber: opname.opnameNumber };
}

// ── 5. Approve Stock Opname (Atomic Adjustment) ──────────────────────────────

export async function approveStockOpname(
    stockOpnameId: string,
    actor: OpnameActor
): Promise<{ success: true; opnameNumber: string; adjustmentsCount: number }> {
    if (!ObjectId.isValid(stockOpnameId)) {
        throw new InventoryError('INVALID_INPUT', 'ID Opname tidak valid.');
    }

    const opnameCol = await getStockOpnameCollection();
    const opnameOid = new ObjectId(stockOpnameId);
    const opname = await opnameCol.findOne({ _id: opnameOid });

    if (!opname) {
        throw new InventoryError('NOT_FOUND', 'Dokumen opname tidak ditemukan.');
    }

    if (opname.status !== 'SUBMITTED') {
        throw new InventoryError('INVALID_STATE', `Hanya opname berstatus SUBMITTED yang dapat disetujui. Status saat ini: ${opname.status}`);
    }

    const itemCol = await getStockOpnameItemCollection();
    const items = await itemCol.find({ stockOpnameId: opnameOid }).toArray();

    if (items.length === 0) {
        throw new InventoryError('EMPTY_OPNAME', 'Opname tidak memiliki detail barang.');
    }

    // ── STALE STOCK SNAPSHOT GUARD ──
    // Verify that current StockBalance matches systemQuantity snapshot for ALL items
    for (const item of items) {
        const currentBal = await getCurrentBalance(item.itemId, item.locationId);
        if (currentBal !== item.systemQuantity) {
            throw new InventoryError(
                'STALE_STOCK_SNAPSHOT',
                `Stok barang (SKU: ${item.sku}) telah berubah sejak opname dibuat (saat opname: ${item.systemQuantity}, saat ini: ${currentBal}). Approval dibatalkan demi integritas stok.`
            );
        }
    }

    const reviewerOid = new ObjectId(actor.userId);
    const now = new Date();
    let adjustmentsCount = 0;

    await withInventoryTransaction(async (session) => {
        const movementsCol = await getStockMovementCollection();

        for (const item of items) {
            if (item.difference === 0) {
                // Difference is zero: no adjustment or movement needed
                continue;
            }

            adjustmentsCount++;
            const movNum = await generateMovementNumber();

            if (item.difference > 0) {
                // Positive difference: physical count > system count → increment stock
                await incrementBalance(
                    session,
                    item.itemId,
                    item.sku,
                    opname.warehouseId,
                    item.locationId,
                    item.difference
                );

                await movementsCol.insertOne(
                    {
                        movementNumber: movNum,
                        type: 'ADJUSTMENT',
                        itemId: item.itemId,
                        sku: item.sku,
                        quantity: item.difference,
                        destinationWarehouseId: opname.warehouseId,
                        destinationLocationId: item.locationId,
                        referenceNumber: opname.opnameNumber,
                        reason: `Penyesuaian stok opname (${opname.opnameNumber}): selisih +${item.difference}`,
                        actor: { userId: reviewerOid, name: actor.name, role: actor.role },
                        timestamp: now,
                        createdAt: now,
                    },
                    session ? { session } : {}
                );
            } else {
                // Negative difference: physical count < system count → decrement stock
                const absQty = Math.abs(item.difference);
                const success = await decrementBalance(session, item.itemId, item.locationId, absQty);
                if (!success) {
                    throw new InventoryError(
                        'INSUFFICIENT_STOCK',
                        `Stok tidak mencukupi untuk penyesuaian minus pada barang SKU ${item.sku}.`
                    );
                }

                await movementsCol.insertOne(
                    {
                        movementNumber: movNum,
                        type: 'ADJUSTMENT',
                        itemId: item.itemId,
                        sku: item.sku,
                        quantity: item.difference, // negative
                        sourceWarehouseId: opname.warehouseId,
                        sourceLocationId: item.locationId,
                        referenceNumber: opname.opnameNumber,
                        reason: `Penyesuaian stok opname (${opname.opnameNumber}): selisih ${item.difference}`,
                        actor: { userId: reviewerOid, name: actor.name, role: actor.role },
                        timestamp: now,
                        createdAt: now,
                    },
                    session ? { session } : {}
                );
            }
        }

        // Update Opname status to APPROVED
        await opnameCol.updateOne(
            { _id: opnameOid },
            {
                $set: {
                    status: 'APPROVED',
                    reviewedBy: {
                        userId: reviewerOid,
                        name: actor.name,
                        role: actor.role,
                    },
                    reviewedAt: now,
                },
            },
            session ? { session } : {}
        );

        // Atomic audit log
        await createAuditLog(
            {
                actorId: reviewerOid,
                actorName: actor.name,
                actorRole: actor.role,
                action: 'UPDATE',
                resource: 'STOCK_OPNAME',
                resourceId: opname.opnameNumber,
                details: {
                    statusChange: { before: 'SUBMITTED', after: 'APPROVED' },
                    adjustmentsCount,
                    totalItemsCount: items.length,
                },
                timestamp: now,
            },
            session
        );
    });

    return {
        success: true,
        opnameNumber: opname.opnameNumber,
        adjustmentsCount,
    };
}

// ── 6. Reject Stock Opname ──────────────────────────────────────────────────

export async function rejectStockOpname(
    stockOpnameId: string,
    rejectionReason: string,
    actor: OpnameActor
): Promise<{ success: true; opnameNumber: string }> {
    if (!ObjectId.isValid(stockOpnameId)) {
        throw new InventoryError('INVALID_INPUT', 'ID Opname tidak valid.');
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new InventoryError('INVALID_INPUT', 'Alasan penolakan (rejectionReason) wajib diisi.');
    }

    const opnameCol = await getStockOpnameCollection();
    const opnameOid = new ObjectId(stockOpnameId);
    const opname = await opnameCol.findOne({ _id: opnameOid });

    if (!opname) {
        throw new InventoryError('NOT_FOUND', 'Dokumen opname tidak ditemukan.');
    }

    if (opname.status !== 'SUBMITTED') {
        throw new InventoryError('INVALID_STATE', `Hanya opname berstatus SUBMITTED yang dapat ditolak. Status saat ini: ${opname.status}`);
    }

    const reviewerOid = new ObjectId(actor.userId);
    const now = new Date();
    const cleanReason = rejectionReason.trim();

    await opnameCol.updateOne(
        { _id: opnameOid },
        {
            $set: {
                status: 'REJECTED',
                rejectionReason: cleanReason,
                reviewedBy: {
                    userId: reviewerOid,
                    name: actor.name,
                    role: actor.role,
                },
                reviewedAt: now,
            },
        }
    );

    // Audit log (reject does NOT touch StockBalance or StockMovement)
    await createAuditLog({
        actorId: reviewerOid,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'UPDATE',
        resource: 'STOCK_OPNAME',
        resourceId: opname.opnameNumber,
        details: {
            statusChange: { before: 'SUBMITTED', after: 'REJECTED' },
            rejectionReason: cleanReason,
        },
        timestamp: now,
    });

    return { success: true, opnameNumber: opname.opnameNumber };
}

// ── 7. Queries ──────────────────────────────────────────────────────────────

export async function getStockOpnames(statusFilter?: StockOpnameStatus): Promise<StockOpnameDoc[]> {
    const opnameCol = await getStockOpnameCollection();
    const filter = statusFilter ? { status: statusFilter } : {};
    return opnameCol.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function getStockOpnameDetail(
    stockOpnameId: string
): Promise<PopulatedOpnameDetail | null> {
    if (!ObjectId.isValid(stockOpnameId)) return null;

    const opnameCol = await getStockOpnameCollection();
    const opnameOid = new ObjectId(stockOpnameId);
    const opname = await opnameCol.findOne({ _id: opnameOid });
    if (!opname) return null;

    const warehouseCol = await getWarehouseCollection();
    const warehouse = await warehouseCol.findOne({ _id: opname.warehouseId });

    const itemCol = await getStockOpnameItemCollection();
    const rawItems = await itemCol.find({ stockOpnameId: opnameOid }).toArray();

    const itemsCol = await getItemCollection();
    const locsCol = await getLocationCollection();

    const populatedItems: PopulatedOpnameItem[] = await Promise.all(
        rawItems.map(async (item) => {
            const itemDoc = await itemsCol.findOne({ _id: item.itemId });
            const locDoc = await locsCol.findOne({ _id: item.locationId });
            return {
                ...item,
                itemName: itemDoc?.name,
                locationName: locDoc?.name,
                locationCode: locDoc?.code,
            };
        })
    );

    return {
        ...opname,
        warehouseName: warehouse?.name,
        items: populatedItems,
    };
}
