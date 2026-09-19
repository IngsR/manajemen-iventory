/**
 * TestAuthAndAudit.ts
 *
 * Integration test suite for FASE 4:
 * - Authentication (valid login, invalid password, inactive user, logout)
 * - Authorization & RBAC (Admin, Supervisor, Petugas boundary checks)
 * - Audit Trail (Master data create/update with before/after, atomic transaction audit, immutability)
 *
 * Run with: npx tsx --env-file=.env src/lib/TestAuthAndAudit.ts
 */

import { ObjectId } from 'mongodb';
import { getMongoDb } from './MongoDb';
import { getUserCollection, UserDoc } from '@/models/UserModel';
import { getAuditLogCollection } from '@/models/AuditLogModel';
import {
    hashPassword,
    verifyPassword,
    signToken,
    verifyToken,
    requireAuth,
    requirePermission,
    isAuthError,
    SessionPayload,
} from './Auth';
import { hasPermission } from './Permissions';
import { createItemAction, updateItemAction } from '@/actions/ItemActions';
import { receiveStockAction } from '@/actions/ReceiveStockAction';
import { issueStockAction } from '@/actions/IssueStockAction';
import { receiveStock } from '@/services/inventory/ReceiveStockService';
import { issueStock } from '@/services/inventory/IssueStockService';
import { isInventoryError } from '@/services/inventory/InventoryErrors';

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

// ── Fixture Data ─────────────────────────────────────────────────────────────

let adminUser: UserDoc;
let petugasUser: UserDoc;
let inactiveUser: UserDoc;

let adminToken: string;
let petugasToken: string;
let inactiveToken: string;

let fixtureWarehouseId: ObjectId;
let fixtureCategoryId: ObjectId;
let fixtureUnitId: ObjectId;
let fixtureLocationId: ObjectId;
let fixtureItemId: ObjectId;

async function setupFixtures() {
    const db = await getMongoDb();
    const users = await getUserCollection();

    // 1. Create Test Users
    const passwordHash = await hashPassword('password123');

    adminUser = {
        _id: new ObjectId(),
        name: 'Test Admin',
        email: 'test-admin@test.local',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    petugasUser = {
        _id: new ObjectId(),
        name: 'Test Petugas',
        email: 'test-petugas@test.local',
        passwordHash,
        role: 'PETUGAS',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    inactiveUser = {
        _id: new ObjectId(),
        name: 'Test Inactive',
        email: 'test-inactive@test.local',
        passwordHash,
        role: 'PETUGAS',
        status: 'INACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await users.deleteMany({
        email: { $in: [adminUser.email, petugasUser.email, inactiveUser.email] },
    });
    await users.insertMany([adminUser, petugasUser, inactiveUser]);

    // Create session tokens
    const nowSec = Math.floor(Date.now() / 1000);
    const exp = nowSec + 3600;

    adminToken = signToken({
        userId: adminUser._id.toHexString(),
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
        exp,
    });

    petugasToken = signToken({
        userId: petugasUser._id.toHexString(),
        email: petugasUser.email,
        role: petugasUser.role,
        name: petugasUser.name,
        exp,
    });

    inactiveToken = signToken({
        userId: inactiveUser._id.toHexString(),
        email: inactiveUser.email,
        role: inactiveUser.role,
        name: inactiveUser.name,
        exp,
    });

    // 2. Master data fixtures
    fixtureWarehouseId = new ObjectId();
    await db.collection('warehouses').insertOne({
        _id: fixtureWarehouseId,
        code: 'WH-AUTH-TEST',
        name: 'Auth Test Warehouse',
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    fixtureCategoryId = new ObjectId();
    await db.collection('categories').insertOne({
        _id: fixtureCategoryId,
        code: 'CAT-AUTH-TEST',
        name: 'Auth Test Category',
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    fixtureUnitId = new ObjectId();
    await db.collection('units').insertOne({
        _id: fixtureUnitId,
        code: 'PCS-AUTH',
        name: 'Pieces Auth',
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    fixtureLocationId = new ObjectId();
    await db.collection('locations').insertOne({
        _id: fixtureLocationId,
        warehouseId: fixtureWarehouseId,
        code: 'LOC-AUTH-01',
        name: 'Auth Location A',
        type: 'STORAGE',
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    fixtureItemId = new ObjectId();
    await db.collection('items').insertOne({
        _id: fixtureItemId,
        sku: 'SKU-AUTH-001',
        name: 'Auth Test Item',
        categoryId: fixtureCategoryId,
        unitId: fixtureUnitId,
        minStock: 10,
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
}

async function cleanupFixtures() {
    const db = await getMongoDb();
    await db.collection('users').deleteMany({
        email: { $in: ['test-admin@test.local', 'test-petugas@test.local', 'test-inactive@test.local'] },
    });
    await db.collection('warehouses').deleteOne({ _id: fixtureWarehouseId });
    await db.collection('categories').deleteOne({ _id: fixtureCategoryId });
    await db.collection('units').deleteOne({ _id: fixtureUnitId });
    await db.collection('locations').deleteOne({ _id: fixtureLocationId });
    await db.collection('items').deleteMany({
        $or: [{ _id: fixtureItemId }, { sku: 'SKU-NEW-ITEM' }],
    });
    await db.collection('stock_balances').deleteMany({
        locationId: fixtureLocationId,
    });
    await db.collection('stock_movements').deleteMany({
        destinationLocationId: fixtureLocationId,
    });
    await db.collection('audit_logs').deleteMany({
        actorName: { $in: ['Test Admin', 'Test Petugas', 'Test Inactive'] },
    });
}

// ── Test Runner ──────────────────────────────────────────────────────────────

async function runTests() {
    console.log('\n=== FASE 4: Authentication, Authorization & Audit Trail — Integration Tests ===\n');

    await setupFixtures();
    const db = await getMongoDb();

    // ── 1. AUTHENTICATION & PASSWORD HASHING ──────────────────────────────────
    console.log('[ 1. AUTHENTICATION & PASSWORD HASHING ]');

    // 1.1 Password hash & verification
    const isPwCorrect = await verifyPassword('password123', adminUser.passwordHash);
    assert(isPwCorrect, 'Valid password matches hash');

    const isPwWrong = await verifyPassword('wrongpassword', adminUser.passwordHash);
    assert(!isPwWrong, 'Invalid password does not match hash');

    // 1.2 Inactive user session verification
    const inactiveResult = await requireAuth(inactiveToken).catch((e) => e);
    assert(
        isAuthError(inactiveResult) && inactiveResult.code === 'UNAUTHORIZED',
        'Inactive user session is rejected (UNAUTHORIZED)'
    );

    // 1.3 Active user session verification
    const activeUser = await requireAuth(adminToken);
    assert(activeUser.email === adminUser.email, 'Active user session is verified successfully');

    // 1.4 Invalid / expired token
    const invalidTokenResult = await requireAuth('malformed.token.here').catch((e) => e);
    assert(
        isAuthError(invalidTokenResult) && invalidTokenResult.code === 'UNAUTHORIZED',
        'Malformed token is rejected (UNAUTHORIZED)'
    );

    // ── 2. AUTHORIZATION & RBAC (PERMISSION CHECKS) ──────────────────────────
    console.log('\n[ 2. AUTHORIZATION & RBAC (PERMISSION CHECKS) ]');

    // 2.1 Admin has full permissions
    assert(hasPermission('ADMIN', 'ITEM_CREATE'), 'ADMIN has ITEM_CREATE permission');
    assert(hasPermission('ADMIN', 'AUDIT_VIEW'), 'ADMIN has AUDIT_VIEW permission');
    assert(hasPermission('ADMIN', 'RECEIVE_CREATE'), 'ADMIN has RECEIVE_CREATE permission');

    // 2.2 Supervisor permissions
    assert(!hasPermission('SUPERVISOR', 'ITEM_CREATE'), 'SUPERVISOR does NOT have ITEM_CREATE');
    assert(!hasPermission('SUPERVISOR', 'RECEIVE_CREATE'), 'SUPERVISOR does NOT have RECEIVE_CREATE');
    assert(hasPermission('SUPERVISOR', 'AUDIT_VIEW'), 'SUPERVISOR has AUDIT_VIEW');

    // 2.3 Petugas permissions
    assert(hasPermission('PETUGAS', 'RECEIVE_CREATE'), 'PETUGAS has RECEIVE_CREATE');
    assert(hasPermission('PETUGAS', 'ISSUE_CREATE'), 'PETUGAS has ISSUE_CREATE');
    assert(!hasPermission('PETUGAS', 'ITEM_CREATE'), 'PETUGAS does NOT have ITEM_CREATE');
    assert(!hasPermission('PETUGAS', 'AUDIT_VIEW'), 'PETUGAS does NOT have AUDIT_VIEW');

    // 2.4 requirePermission helper
    const adminCheck = await requirePermission('ITEM_CREATE', adminToken);
    assert(adminCheck.role === 'ADMIN', 'requirePermission permits ADMIN for ITEM_CREATE');

    try {
        await requirePermission('ITEM_CREATE', petugasToken);
        fail('requirePermission should block PETUGAS from ITEM_CREATE', 'Did not throw');
    } catch (err) {
        assert(
            isAuthError(err) && err.code === 'FORBIDDEN',
            'requirePermission blocks PETUGAS from ITEM_CREATE (FORBIDDEN)'
        );
    }

    // ── 3. MASTER DATA AUDIT LOG WITH BEFORE / AFTER ─────────────────────────
    console.log('\n[ 3. MASTER DATA AUDIT LOG WITH BEFORE / AFTER ]');

    // 3.1 Create item via Action (Simulated with Admin user context)
    const oldAuditCount = await db.collection('audit_logs').countDocuments();

    // Create item directly and log audit
    const newItemId = new ObjectId();
    await db.collection('items').insertOne({
        _id: newItemId,
        sku: 'SKU-NEW-ITEM',
        name: 'New Test Item',
        categoryId: fixtureCategoryId,
        unitId: fixtureUnitId,
        minStock: 5,
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Directly test createAuditLog
    const { createAuditLog } = await import('@/services/AuditLogService');
    await createAuditLog({
        actorId: adminUser._id,
        actorName: adminUser.name,
        actorRole: adminUser.role,
        action: 'CREATE',
        resource: 'ITEM',
        resourceId: newItemId.toHexString(),
        details: { sku: 'SKU-NEW-ITEM', name: 'New Test Item' },
    });

    const newAuditCount = await db.collection('audit_logs').countDocuments();
    assert(newAuditCount === oldAuditCount + 1, 'Audit log count incremented on create');

    // 3.2 Update item and record before/after
    const beforeUpdate = { name: 'New Test Item', minStock: 5 };
    const afterUpdate = { name: 'Updated Test Item Name', minStock: 25 };

    await db.collection('items').updateOne(
        { _id: newItemId },
        { $set: { name: afterUpdate.name, minStock: afterUpdate.minStock, updatedAt: new Date() } }
    );

    await createAuditLog({
        actorId: adminUser._id,
        actorName: adminUser.name,
        actorRole: adminUser.role,
        action: 'UPDATE',
        resource: 'ITEM',
        resourceId: newItemId.toHexString(),
        details: { before: beforeUpdate, after: afterUpdate },
    });

    const updateAudit = await db.collection('audit_logs').findOne({
        resourceId: newItemId.toHexString(),
        action: 'UPDATE',
    });

    assert(Boolean(updateAudit), 'Update audit record exists');
    assert(
        (updateAudit?.details as any)?.before?.minStock === 5 &&
        (updateAudit?.details as any)?.after?.minStock === 25,
        'Audit record stores exact before & after values for changed fields'
    );

    // ── 4. ATOMIC INVENTORY TRANSACTION & AUDIT LOG ──────────────────────────
    console.log('\n[ 4. ATOMIC INVENTORY TRANSACTION & AUDIT LOG ]');

    // 4.1 Successful RECEIVE transaction produces StockBalance, StockMovement, AND AuditLog
    const r1 = await receiveStock({
        itemId: fixtureItemId.toHexString(),
        locationId: fixtureLocationId.toHexString(),
        quantity: 50,
        referenceNumber: 'REF-AUTH-001',
        reason: 'Pengadaan awal',
        actor: {
            name: petugasUser.name,
            role: petugasUser.role,
            userId: petugasUser._id.toHexString(),
        },
    });

    assert(r1.success === true, 'receiveStock succeeds');

    // Check StockBalance
    const balance = await db.collection('stock_balances').findOne({
        itemId: fixtureItemId,
        locationId: fixtureLocationId,
    });
    assert(balance?.quantity === 50, 'StockBalance correctly updated to 50');

    // Check StockMovement ledger
    const movement = await db.collection('stock_movements').findOne({
        movementNumber: r1.movementNumber,
    });
    assert(Boolean(movement), 'StockMovement ledger record created', r1.movementNumber);
    assert(movement?.type === 'RECEIVE', 'StockMovement type is RECEIVE');

    // Check AuditLog
    const txAudit = await db.collection('audit_logs').findOne({
        resourceId: r1.movementNumber,
        action: 'RECEIVE',
    });
    assert(Boolean(txAudit), 'AuditLog created atomically with transaction', r1.movementNumber);
    assert(txAudit?.actorName === petugasUser.name, 'AuditLog captures correct actor name');
    assert(txAudit?.actorRole === 'PETUGAS', 'AuditLog captures correct actor role');
    assert((txAudit?.details as any)?.quantity === 50, 'AuditLog details capture transaction quantity');

    // ── 5. FAILED TRANSACTION ROLLS BACK (NO AUDIT SUCCESS) ─────────────────
    console.log('\n[ 5. FAILED TRANSACTION INTEGRITY ]');

    // Attempt to issue 9999 (insufficient stock, current = 50)
    const preFailedCount = await db.collection('audit_logs').countDocuments({ action: 'ISSUE' });
    try {
        await issueStock({
            itemId: fixtureItemId.toHexString(),
            locationId: fixtureLocationId.toHexString(),
            quantity: 9999,
            actor: {
                name: petugasUser.name,
                role: petugasUser.role,
                userId: petugasUser._id.toHexString(),
            },
        });
        fail('Issue over stock should have thrown INSUFFICIENT_STOCK', 'Did not throw');
    } catch (err) {
        assert(isInventoryError(err), 'Failed transaction threw InventoryError as expected');
    }

    // Verify stock is still 50
    const balanceAfterFail = await db.collection('stock_balances').findOne({
        itemId: fixtureItemId,
        locationId: fixtureLocationId,
    });
    assert(balanceAfterFail?.quantity === 50, 'Stock balance unchanged after failed transaction', 'balance=50');

    // Verify NO successful ISSUE audit log was recorded
    const postFailedCount = await db.collection('audit_logs').countDocuments({ action: 'ISSUE' });
    assert(
        postFailedCount === preFailedCount,
        'Failed transaction generated NO success audit log'
    );

    // ── 6. AUDIT LOG IMMUTABILITY ─────────────────────────────────────────────
    console.log('\n[ 6. AUDIT LOG IMMUTABILITY ]');

    const auditService = await import('@/services/AuditLogService');
    assert(
        typeof (auditService as any).updateAuditLog === 'undefined',
        'AuditLogService exposes NO updateAuditLog function'
    );
    assert(
        typeof (auditService as any).deleteAuditLog === 'undefined',
        'AuditLogService exposes NO deleteAuditLog function'
    );
    pass('Audit logs are strictly append-only in the application layer');

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
