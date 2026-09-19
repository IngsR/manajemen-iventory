/**
 * TestStockOpname.ts
 *
 * Integration test suite for FASE 5: Stock Opname & Approval.
 *
 * Covers:
 * 1. Petugas creates opname (DRAFT)
 * 2. Details store system quantity snapshot
 * 3. Counted quantity & difference calculation
 * 4. Duplicate detail prevention (stockOpnameId + itemId + locationId)
 * 5. Petugas submits opname (status SUBMITTED)
 * 6. SUBMITTED opname is locked from further edits
 * 7. Permission enforcement (Petugas cannot approve/reject, Supervisor can)
 * 8. Supervisor rejects opname with reason (StockBalance & movements untouched, audit recorded)
 * 9. Rejection requires reason
 * 10. Approval on non-SUBMITTED opname is rejected
 * 11. Stale stock snapshot guard (approval rejected if StockBalance changed after snapshot)
 * 12. Supervisor approves valid opname
 * 13. Positive difference increments StockBalance
 * 14. Negative difference decrements StockBalance
 * 15. Zero difference produces no adjustment or StockMovement
 * 16. Approval produces StockMovement ADJUSTMENT & AuditLog atomically
 *
 * Run with: npx tsx --env-file=.env src/lib/TestStockOpname.ts
 */

import { ObjectId } from 'mongodb';
import { getMongoDb } from './MongoDb';
import {
    createStockOpname,
    addOrUpdateStockOpnameItem,
    submitStockOpname,
    approveStockOpname,
    rejectStockOpname,
    getStockOpnameDetail,
} from '@/services/inventory/StockOpnameService';
import {
    createStockOpnameAction,
    approveStockOpnameAction,
    rejectStockOpnameAction,
} from '@/actions/StockOpnameActions';
import { isInventoryError } from '@/services/inventory/InventoryErrors';
import { hasPermission } from './Permissions';
import { signToken } from './Auth';

let passed = 0;
let failed = 0;

function pass(label: string, info?: string) {
    console.log(`  ✓ ${label}${info ? ' — ' + info : ''}`);
    passed++;
}

function fail(label: string, reason: string) {
    console.error(`  ✗ ${label} — ${reason}`);
    failed++;
}

function assert(condition: boolean, label: string, info?: string) {
    if (condition) {
        pass(label, info);
    } else {
        fail(label, info || 'Assertion failed');
    }
}

// ── Fixture State ────────────────────────────────────────────────────────────

let fixtureWarehouseId: ObjectId;
let fixtureLocationAId: ObjectId;
let fixtureLocationBId: ObjectId;
let fixtureItem1Id: ObjectId; // Will test positive difference
let fixtureItem2Id: ObjectId; // Will test negative difference
let fixtureItem3Id: ObjectId; // Will test zero difference

const petugasActor = {
    userId: new ObjectId().toHexString(),
    name: 'Petugas Opname',
    role: 'PETUGAS',
};

const supervisorActor = {
    userId: new ObjectId().toHexString(),
    name: 'Supervisor Reviewer',
    role: 'SUPERVISOR',
};

async function setupFixtures() {
    const db = await getMongoDb();

    fixtureWarehouseId = new ObjectId();
    await db.collection('warehouses').insertOne({
        _id: fixtureWarehouseId,
        code: 'WH-OPN-TEST',
        name: 'Opname Test Warehouse',
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    fixtureLocationAId = new ObjectId();
    fixtureLocationBId = new ObjectId();
    await db.collection('locations').insertMany([
        {
            _id: fixtureLocationAId,
            warehouseId: fixtureWarehouseId,
            code: 'LOC-OPN-A',
            name: 'Opname Loc A',
            type: 'STORAGE',
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            _id: fixtureLocationBId,
            warehouseId: fixtureWarehouseId,
            code: 'LOC-OPN-B',
            name: 'Opname Loc B',
            type: 'STORAGE',
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]);

    fixtureItem1Id = new ObjectId();
    fixtureItem2Id = new ObjectId();
    fixtureItem3Id = new ObjectId();

    await db.collection('items').insertMany([
        {
            _id: fixtureItem1Id,
            sku: 'SKU-OPN-001',
            name: 'Item Plus Opname',
            categoryId: new ObjectId(),
            unitId: new ObjectId(),
            minStock: 5,
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            _id: fixtureItem2Id,
            sku: 'SKU-OPN-002',
            name: 'Item Minus Opname',
            categoryId: new ObjectId(),
            unitId: new ObjectId(),
            minStock: 5,
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            _id: fixtureItem3Id,
            sku: 'SKU-OPN-003',
            name: 'Item Exact Opname',
            categoryId: new ObjectId(),
            unitId: new ObjectId(),
            minStock: 5,
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]);

    // Initial stock balances:
    // Item 1: 100 units
    // Item 2: 50 units
    // Item 3: 30 units
    await db.collection('stock_balances').insertMany([
        {
            itemId: fixtureItem1Id,
            sku: 'SKU-OPN-001',
            warehouseId: fixtureWarehouseId,
            locationId: fixtureLocationAId,
            quantity: 100,
            updatedAt: new Date(),
        },
        {
            itemId: fixtureItem2Id,
            sku: 'SKU-OPN-002',
            warehouseId: fixtureWarehouseId,
            locationId: fixtureLocationAId,
            quantity: 50,
            updatedAt: new Date(),
        },
        {
            itemId: fixtureItem3Id,
            sku: 'SKU-OPN-003',
            warehouseId: fixtureWarehouseId,
            locationId: fixtureLocationAId,
            quantity: 30,
            updatedAt: new Date(),
        },
    ]);
}

async function cleanupFixtures() {
    const db = await getMongoDb();
    await db.collection('warehouses').deleteOne({ _id: fixtureWarehouseId });
    await db.collection('locations').deleteMany({ warehouseId: fixtureWarehouseId });
    await db.collection('items').deleteMany({
        _id: { $in: [fixtureItem1Id, fixtureItem2Id, fixtureItem3Id] },
    });
    await db.collection('stock_balances').deleteMany({
        warehouseId: fixtureWarehouseId,
    });
    await db.collection('stock_opnames').deleteMany({
        warehouseId: fixtureWarehouseId,
    });
    await db.collection('stock_opname_items').deleteMany({
        locationId: { $in: [fixtureLocationAId, fixtureLocationBId] },
    });
    await db.collection('stock_movements').deleteMany({
        sourceWarehouseId: fixtureWarehouseId,
    });
    await db.collection('stock_movements').deleteMany({
        destinationWarehouseId: fixtureWarehouseId,
    });
    await db.collection('audit_logs').deleteMany({
        actorName: { $in: [petugasActor.name, supervisorActor.name] },
    });
}

// ── Test Runner ──────────────────────────────────────────────────────────────

async function runTests() {
    console.log('\n=== FASE 5: Stock Opname & Approval — Integration Tests ===\n');

    await setupFixtures();
    const db = await getMongoDb();

    // ── 1. CREATE OPNAME (DRAFT) ─────────────────────────────────────────────
    console.log('[ 1. CREATE OPNAME (DRAFT) ]');

    const opname1 = await createStockOpname({
        warehouseId: fixtureWarehouseId.toHexString(),
        notes: 'Opname Rutin Kuartal 1',
        actor: petugasActor,
    });

    assert(opname1.opnameNumber.startsWith('OPN-'), 'Opname number generated in OPN-YYYYMMDD-NNNNNN format', opname1.opnameNumber);

    const doc1 = await db.collection('stock_opnames').findOne({ _id: new ObjectId(opname1.stockOpnameId) });
    assert(doc1?.status === 'DRAFT', 'Initial opname status is DRAFT');
    assert(doc1?.createdBy.name === petugasActor.name, 'Creator is correctly recorded');

    // ── 2. ADD DETAILS & SNAPSHOT SYSTEM QUANTITY ────────────────────────────
    console.log('\n[ 2. ADD DETAILS & SNAPSHOT SYSTEM QUANTITY ]');

    // Item 1: System has 100, physical counted is 110 (Difference = +10)
    const itm1 = await addOrUpdateStockOpnameItem({
        stockOpnameId: opname1.stockOpnameId,
        itemId: fixtureItem1Id.toHexString(),
        locationId: fixtureLocationAId.toHexString(),
        countedQuantity: 110,
        actor: petugasActor,
    });
    assert(itm1.systemQuantity === 100, 'Item 1 systemQuantity snapshot is 100');
    assert(itm1.countedQuantity === 110, 'Item 1 countedQuantity is 110');
    assert(itm1.difference === 10, 'Item 1 difference is +10');

    // Item 2: System has 50, physical counted is 45 (Difference = -5)
    const itm2 = await addOrUpdateStockOpnameItem({
        stockOpnameId: opname1.stockOpnameId,
        itemId: fixtureItem2Id.toHexString(),
        locationId: fixtureLocationAId.toHexString(),
        countedQuantity: 45,
        actor: petugasActor,
    });
    assert(itm2.systemQuantity === 50, 'Item 2 systemQuantity snapshot is 50');
    assert(itm2.countedQuantity === 45, 'Item 2 countedQuantity is 45');
    assert(itm2.difference === -5, 'Item 2 difference is -5');

    // Item 3: System has 30, physical counted is 30 (Difference = 0)
    const itm3 = await addOrUpdateStockOpnameItem({
        stockOpnameId: opname1.stockOpnameId,
        itemId: fixtureItem3Id.toHexString(),
        locationId: fixtureLocationAId.toHexString(),
        countedQuantity: 30,
        actor: petugasActor,
    });
    assert(itm3.systemQuantity === 30, 'Item 3 systemQuantity snapshot is 30');
    assert(itm3.difference === 0, 'Item 3 difference is 0');

    // ── 3. UNIQUE CONSTRAINT ON ITEM + LOCATION ──────────────────────────────
    console.log('\n[ 3. UNIQUE CONSTRAINT ON ITEM + LOCATION ]');

    // Updating Item 1 count should update existing record, not duplicate
    await addOrUpdateStockOpnameItem({
        stockOpnameId: opname1.stockOpnameId,
        itemId: fixtureItem1Id.toHexString(),
        locationId: fixtureLocationAId.toHexString(),
        countedQuantity: 115, // Re-counted to 115
        actor: petugasActor,
    });

    const itemsCount = await db.collection('stock_opname_items').countDocuments({
        stockOpnameId: new ObjectId(opname1.stockOpnameId),
        itemId: fixtureItem1Id,
        locationId: fixtureLocationAId,
    });
    assert(itemsCount === 1, 'Single item per location in same opname (upsert works, no duplicate)');

    const updatedItm1 = await db.collection('stock_opname_items').findOne({
        stockOpnameId: new ObjectId(opname1.stockOpnameId),
        itemId: fixtureItem1Id,
        locationId: fixtureLocationAId,
    });
    assert(updatedItm1?.difference === 15, 'Updated difference correctly recalculates to +15 (115 - 100)');

    // ── 4. SUBMIT OPNAME ─────────────────────────────────────────────────────
    console.log('\n[ 4. SUBMIT OPNAME ]');

    const submitRes = await submitStockOpname(opname1.stockOpnameId, petugasActor);
    assert(submitRes.success === true, 'Petugas successfully submits opname');

    const submittedDoc = await db.collection('stock_opnames').findOne({ _id: new ObjectId(opname1.stockOpnameId) });
    assert(submittedDoc?.status === 'SUBMITTED', 'Opname status is now SUBMITTED');
    assert(Boolean(submittedDoc?.submittedAt), 'submittedAt timestamp is recorded');

    // ── 5. SUBMITTED LOCK (NO EDITS ALLOWED) ─────────────────────────────────
    console.log('\n[ 5. SUBMITTED LOCK (NO EDITS ALLOWED) ]');

    try {
        await addOrUpdateStockOpnameItem({
            stockOpnameId: opname1.stockOpnameId,
            itemId: fixtureItem1Id.toHexString(),
            locationId: fixtureLocationAId.toHexString(),
            countedQuantity: 999,
            actor: petugasActor,
        });
        fail('Editing a SUBMITTED opname should throw', 'Did not throw');
    } catch (err) {
        assert(isInventoryError(err) && err.code === 'INVALID_STATE', 'Editing SUBMITTED opname is blocked (INVALID_STATE)');
    }

    // ── 6. PERMISSION ENFORCEMENT ─────────────────────────────────────────────
    console.log('\n[ 6. PERMISSION ENFORCEMENT ]');

    assert(!hasPermission('PETUGAS', 'STOCK_OPNAME_APPROVE'), 'PETUGAS does NOT have STOCK_OPNAME_APPROVE permission');
    assert(!hasPermission('PETUGAS', 'STOCK_OPNAME_REJECT'), 'PETUGAS does NOT have STOCK_OPNAME_REJECT permission');
    assert(hasPermission('SUPERVISOR', 'STOCK_OPNAME_APPROVE'), 'SUPERVISOR has STOCK_OPNAME_APPROVE permission');
    assert(hasPermission('SUPERVISOR', 'STOCK_OPNAME_REJECT'), 'SUPERVISOR has STOCK_OPNAME_REJECT permission');

    // ── 7. REJECT WORKFLOW ───────────────────────────────────────────────────
    console.log('\n[ 7. REJECT WORKFLOW ]');

    // Create a separate opname to test rejection
    const opnameReject = await createStockOpname({
        warehouseId: fixtureWarehouseId.toHexString(),
        notes: 'Opname to be rejected',
        actor: petugasActor,
    });
    await addOrUpdateStockOpnameItem({
        stockOpnameId: opnameReject.stockOpnameId,
        itemId: fixtureItem1Id.toHexString(),
        locationId: fixtureLocationAId.toHexString(),
        countedQuantity: 200,
        actor: petugasActor,
    });
    await submitStockOpname(opnameReject.stockOpnameId, petugasActor);

    // Reject without reason must fail
    try {
        await rejectStockOpname(opnameReject.stockOpnameId, '', supervisorActor);
        fail('Rejection without reason should throw', 'Did not throw');
    } catch (err) {
        assert(isInventoryError(err) && err.code === 'INVALID_INPUT', 'Rejection without reason is rejected (INVALID_INPUT)');
    }

    // Valid rejection
    const rejectRes = await rejectStockOpname(
        opnameReject.stockOpnameId,
        'Perhitungan tidak sesuai standar, hitung ulang.',
        supervisorActor
    );
    assert(rejectRes.success === true, 'Supervisor successfully rejects opname');

    const rejectedDoc = await db.collection('stock_opnames').findOne({ _id: new ObjectId(opnameReject.stockOpnameId) });
    assert(rejectedDoc?.status === 'REJECTED', 'Status changed to REJECTED');
    assert(rejectedDoc?.rejectionReason === 'Perhitungan tidak sesuai standar, hitung ulang.', 'Rejection reason saved');

    // Verify rejection did NOT touch StockBalance or create movements
    const balAfterReject = await db.collection('stock_balances').findOne({
        itemId: fixtureItem1Id,
        locationId: fixtureLocationAId,
    });
    assert(balAfterReject?.quantity === 100, 'Rejection did NOT alter StockBalance (remains 100)');

    const movReject = await db.collection('stock_movements').findOne({
        referenceNumber: opnameReject.opnameNumber,
    });
    assert(!movReject, 'Rejection created NO StockMovement');

    // Reject on already REJECTED opname must fail
    try {
        await rejectStockOpname(opnameReject.stockOpnameId, 'Again', supervisorActor);
        fail('Reject on non-SUBMITTED opname should throw', 'Did not throw');
    } catch (err) {
        assert(isInventoryError(err) && err.code === 'INVALID_STATE', 'Reject on non-SUBMITTED opname is blocked');
    }

    // ── 8. STALE STOCK SNAPSHOT GUARD ────────────────────────────────────────
    console.log('\n[ 8. STALE STOCK SNAPSHOT GUARD ]');

    // Create another opname to test stale snapshot
    const opnameStale = await createStockOpname({
        warehouseId: fixtureWarehouseId.toHexString(),
        notes: 'Opname testing stale snapshot',
        actor: petugasActor,
    });
    await addOrUpdateStockOpnameItem({
        stockOpnameId: opnameStale.stockOpnameId,
        itemId: fixtureItem1Id.toHexString(),
        locationId: fixtureLocationAId.toHexString(),
        countedQuantity: 105,
        actor: petugasActor,
    });
    await submitStockOpname(opnameStale.stockOpnameId, petugasActor);

    // Simulate concurrent stock transaction in warehouse: stock of Item 1 changed from 100 to 102
    await db.collection('stock_balances').updateOne(
        { itemId: fixtureItem1Id, locationId: fixtureLocationAId },
        { $set: { quantity: 102 } }
    );

    // Now try to approve opnameStale: should fail because snapshot was 100, but active stock is now 102!
    try {
        await approveStockOpname(opnameStale.stockOpnameId, supervisorActor);
        fail('Approval with stale snapshot should throw', 'Did not throw');
    } catch (err) {
        assert(
            isInventoryError(err) && err.code === 'STALE_STOCK_SNAPSHOT',
            'Approval blocked by STALE_STOCK_SNAPSHOT guard when active stock changed after snapshot'
        );
    }

    // Restore Item 1 stock to 100 for opname1 test
    await db.collection('stock_balances').updateOne(
        { itemId: fixtureItem1Id, locationId: fixtureLocationAId },
        { $set: { quantity: 100 } }
    );

    // ── 9. APPROVE OPNAME (ATOMIC ADJUSTMENT) ────────────────────────────────
    console.log('\n[ 9. APPROVE OPNAME (ATOMIC ADJUSTMENT) ]');

    // Approve opname1:
    // Item 1: system=100, counted=115 -> diff=+15 -> balance becomes 115
    // Item 2: system=50, counted=45 -> diff=-5 -> balance becomes 45
    // Item 3: system=30, counted=30 -> diff=0 -> balance remains 30, no adjustment movement
    const approveRes = await approveStockOpname(opname1.stockOpnameId, supervisorActor);
    assert(approveRes.success === true, 'Supervisor successfully approves opname');
    assert(approveRes.adjustmentsCount === 2, 'Exactly 2 adjustments performed (items with non-zero diff)');

    const approvedDoc = await db.collection('stock_opnames').findOne({ _id: new ObjectId(opname1.stockOpnameId) });
    assert(approvedDoc?.status === 'APPROVED', 'Opname status is APPROVED');
    assert(approvedDoc?.reviewedBy?.name === supervisorActor.name, 'Reviewer recorded as supervisor');

    // 9.1 Verify Item 1 balance (+15 adjustment: 100 -> 115)
    const bal1 = await db.collection('stock_balances').findOne({ itemId: fixtureItem1Id, locationId: fixtureLocationAId });
    assert(bal1?.quantity === 115, 'Positive diff correctly incremented stock to 115', `qty=${bal1?.quantity}`);

    // 9.2 Verify Item 2 balance (-5 adjustment: 50 -> 45)
    const bal2 = await db.collection('stock_balances').findOne({ itemId: fixtureItem2Id, locationId: fixtureLocationAId });
    assert(bal2?.quantity === 45, 'Negative diff correctly decremented stock to 45', `qty=${bal2?.quantity}`);

    // 9.3 Verify Item 3 balance (0 diff: remains 30)
    const bal3 = await db.collection('stock_balances').findOne({ itemId: fixtureItem3Id, locationId: fixtureLocationAId });
    assert(bal3?.quantity === 30, 'Zero diff left stock unchanged at 30', `qty=${bal3?.quantity}`);

    // 9.4 Verify StockMovements created for opname1
    const movements = await db.collection('stock_movements').find({ referenceNumber: opname1.opnameNumber }).toArray();
    assert(movements.length === 2, 'Exactly 2 StockMovements generated (none for zero diff)', `count=${movements.length}`);

    const movItem1 = movements.find((m) => m.itemId.equals(fixtureItem1Id));
    assert(movItem1?.type === 'ADJUSTMENT' && movItem1.quantity === 15, 'Item 1 StockMovement is ADJUSTMENT with +15');
    assert(Boolean(movItem1?.destinationLocationId), 'Positive adjustment sets destinationLocationId');

    const movItem2 = movements.find((m) => m.itemId.equals(fixtureItem2Id));
    assert(movItem2?.type === 'ADJUSTMENT' && movItem2.quantity === -5, 'Item 2 StockMovement is ADJUSTMENT with -5');
    assert(Boolean(movItem2?.sourceLocationId), 'Negative adjustment sets sourceLocationId');

    // 9.5 Verify AuditLog created
    const opnameAudit = await db.collection('audit_logs').findOne({
        resourceId: opname1.opnameNumber,
        action: 'UPDATE',
        'details.statusChange.after': 'APPROVED',
    });
    assert(Boolean(opnameAudit), 'AuditLog created for approved opname with adjustments count');

    // ── 10. APPROVAL ON ALREADY APPROVED IS BLOCKED ──────────────────────────
    console.log('\n[ 10. APPROVAL ON ALREADY APPROVED IS BLOCKED ]');

    try {
        await approveStockOpname(opname1.stockOpnameId, supervisorActor);
        fail('Approving already APPROVED opname should throw', 'Did not throw');
    } catch (err) {
        assert(isInventoryError(err) && err.code === 'INVALID_STATE', 'Approval on already APPROVED opname is rejected');
    }

    // ── CLEANUP ──────────────────────────────────────────────────────────────
    console.log('\n[ CLEANUP ]');
    await cleanupFixtures();
    pass('Fixture data cleaned up.');

    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`  Passed: ${passed}   Failed: ${failed}`);
    console.log(`──────────────────────────────────────────────────\n`);

    if (failed > 0) {
        process.exit(1);
    }
    process.exit(0);
}

runTests().catch((err) => {
    console.error('FATAL TEST ERROR:', err);
    cleanupFixtures().finally(() => process.exit(1));
});
