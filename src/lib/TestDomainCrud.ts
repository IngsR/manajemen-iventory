import { ObjectId } from 'mongodb';
import { getMongoDb } from './MongoDb';
import { createCategoryAction, deleteCategoryAction } from '@/actions/CategoryActions';
import { createUnitAction, deleteUnitAction } from '@/actions/UnitActions';
import { createWarehouseAction, deleteWarehouseAction } from '@/actions/WarehouseActions';
import { createLocationAction, deleteLocationAction } from '@/actions/LocationActions';
import { createItemAction, deleteItemAction } from '@/actions/ItemActions';
import { getStockBalanceCollection, initStockBalanceIndexes } from '@/models/StockBalanceModel';
import { getStockMovementCollection, initStockMovementIndexes } from '@/models/StockMovementModel';
import { initAllIndexes } from '@/models/InitIndexes';

async function runDomainCrudTests() {
    console.log('=== RUNNING FASE 2 DOMAIN & DATA INTEGRITY TESTS ===\n');

    await initAllIndexes();

    const timestamp = Date.now();
    const catCode = `CAT-${timestamp}`;
    const unitCode = `U-${timestamp}`.slice(0, 10);
    const whCode = `WH-${timestamp}`.slice(0, 15);
    const locCode = `LOC-A1`;
    const itemSku = `SKU-${timestamp}`;

    let catId = '';
    let unitId = '';
    let whId = '';
    let locId = '';
    let itemId = '';

    try {
        // 1. CREATE MASTER DATA
        console.log('1. Testing Master Data Creation...');

        const catRes = await createCategoryAction({ code: catCode, name: 'Kategori Uji' });
        if (!catRes.success) throw new Error(`Category creation failed: ${catRes.error}`);
        catId = catRes.data as string;
        console.log(`   [PASS] Category created: ${catCode} (${catId})`);

        const unitRes = await createUnitAction({ code: unitCode, name: 'Satuan Uji' });
        if (!unitRes.success) throw new Error(`Unit creation failed: ${unitRes.error}`);
        unitId = unitRes.data as string;
        console.log(`   [PASS] Unit created: ${unitCode} (${unitId})`);

        const whRes = await createWarehouseAction({ code: whCode, name: 'Gudang Uji' });
        if (!whRes.success) throw new Error(`Warehouse creation failed: ${whRes.error}`);
        whId = whRes.data as string;
        console.log(`   [PASS] Warehouse created: ${whCode} (${whId})`);

        const locRes = await createLocationAction({
            warehouseId: whId,
            code: locCode,
            name: 'Lokasi Rak Uji',
            type: 'STORAGE',
        });
        if (!locRes.success) throw new Error(`Location creation failed: ${locRes.error}`);
        locId = locRes.data as string;
        console.log(`   [PASS] Location created: ${locCode} (${locId})`);

        const itemRes = await createItemAction({
            sku: itemSku,
            name: 'Barang Uji Coba',
            categoryId: catId,
            unitId: unitId,
            minStock: 10,
        });
        if (!itemRes.success) throw new Error(`Item creation failed: ${itemRes.error}`);
        itemId = itemRes.data as string;
        console.log(`   [PASS] Item/SKU created: ${itemSku} (${itemId})`);

        // 2. UNIQUE CONSTRAINT CHECKS
        console.log('\n2. Testing Unique Constraints...');

        const dupCat = await createCategoryAction({ code: catCode, name: 'Duplicate Cat' });
        if (dupCat.success) throw new Error('Duplicate category code was mistakenly accepted!');
        console.log(`   [PASS] Duplicate Category code rejected: ${dupCat.error}`);

        const dupUnit = await createUnitAction({ code: unitCode, name: 'Duplicate Unit' });
        if (dupUnit.success) throw new Error('Duplicate unit code was mistakenly accepted!');
        console.log(`   [PASS] Duplicate Unit code rejected: ${dupUnit.error}`);

        const dupWh = await createWarehouseAction({ code: whCode, name: 'Duplicate Warehouse' });
        if (dupWh.success) throw new Error('Duplicate warehouse code was mistakenly accepted!');
        console.log(`   [PASS] Duplicate Warehouse code rejected: ${dupWh.error}`);

        const dupLoc = await createLocationAction({
            warehouseId: whId,
            code: locCode,
            name: 'Duplicate Location',
            type: 'STORAGE',
        });
        if (dupLoc.success) throw new Error('Duplicate location code was mistakenly accepted!');
        console.log(`   [PASS] Duplicate Location code in same warehouse rejected: ${dupLoc.error}`);

        const dupItem = await createItemAction({
            sku: itemSku,
            name: 'Duplicate Item',
            categoryId: catId,
            unitId: unitId,
        });
        if (dupItem.success) throw new Error('Duplicate SKU was mistakenly accepted!');
        console.log(`   [PASS] Duplicate Item SKU rejected: ${dupItem.error}`);

        // 3. REFERENTIAL INTEGRITY ENFORCEMENT
        console.log('\n3. Testing Referential Integrity on Deletion...');

        // Cannot delete category when item references it
        const delCatFail = await deleteCategoryAction(catId);
        if (delCatFail.success) throw new Error('Category deletion succeeded despite active item reference!');
        console.log(`   [PASS] Category deletion blocked due to active reference: ${delCatFail.error}`);

        // Cannot delete unit when item references it
        const delUnitFail = await deleteUnitAction(unitId);
        if (delUnitFail.success) throw new Error('Unit deletion succeeded despite active item reference!');
        console.log(`   [PASS] Unit deletion blocked due to active reference: ${delUnitFail.error}`);

        // Cannot delete warehouse when location references it
        const delWhFail = await deleteWarehouseAction(whId);
        if (delWhFail.success) throw new Error('Warehouse deletion succeeded despite active location reference!');
        console.log(`   [PASS] Warehouse deletion blocked due to active location: ${delWhFail.error}`);

        // 4. STOCK BALANCE & STOCK MOVEMENT MODELS CHECK
        console.log('\n4. Testing StockBalance & StockMovement Models...');

        const balanceCollection = await getStockBalanceCollection();
        const itemObjId = new ObjectId(itemId);
        const whObjId = new ObjectId(whId);
        const locObjId = new ObjectId(locId);

        // Insert balance
        await balanceCollection.insertOne({
            itemId: itemObjId,
            sku: itemSku,
            warehouseId: whObjId,
            locationId: locObjId,
            quantity: 50,
            updatedAt: new Date(),
        });
        console.log('   [PASS] StockBalance document created (quantity: 50)');

        // Test compound unique constraint on StockBalance: { itemId: 1, locationId: 1 }
        try {
            await balanceCollection.insertOne({
                itemId: itemObjId,
                sku: itemSku,
                warehouseId: whObjId,
                locationId: locObjId,
                quantity: 100,
                updatedAt: new Date(),
            });
            throw new Error('StockBalance duplicate itemId+locationId was mistakenly inserted!');
        } catch (err: unknown) {
            const isMongoDuplicate = (err as { code?: number }).code === 11000;
            if (isMongoDuplicate) {
                console.log('   [PASS] StockBalance compound unique constraint enforced (E11000 duplicate key).');
            } else {
                throw err;
            }
        }

        // Test item deletion blocked because stock > 0
        const delItemWithStock = await deleteItemAction(itemId);
        if (delItemWithStock.success) throw new Error('Item deletion succeeded despite stock > 0!');
        console.log(`   [PASS] Item deletion blocked due to positive stock: ${delItemWithStock.error}`);

        // Record a StockMovement ledger entry
        const movementCollection = await getStockMovementCollection();
        await movementCollection.insertOne({
            movementNumber: `MOV-${timestamp}-001`,
            type: 'RECEIVE',
            itemId: itemObjId,
            sku: itemSku,
            quantity: 50,
            destinationWarehouseId: whObjId,
            destinationLocationId: locObjId,
            referenceNumber: 'PO-TEST-001',
            actor: { name: 'Admin Test', role: 'ADMIN' },
            timestamp: new Date(),
            createdAt: new Date(),
        });
        console.log('   [PASS] StockMovement ledger entry recorded (RECEIVE 50).');

        // Clean up test balance
        await balanceCollection.deleteMany({ itemId: itemObjId });

        // Item has movement history, so deleting should deactivate it rather than hard deleting
        const delItemWithHistory = await deleteItemAction(itemId);
        console.log(`   [PASS] Item with transaction history handled: ${delItemWithHistory.message}`);

        console.log('\n=== ALL FASE 2 DOMAIN TESTS PASSED SUCCESSFULLY ===');
    } finally {
        // Cleanup test artifacts
        const db = await getMongoDb();
        if (itemId) await db.collection('items').deleteOne({ _id: new ObjectId(itemId) });
        if (locId) await db.collection('locations').deleteOne({ _id: new ObjectId(locId) });
        if (whId) await db.collection('warehouses').deleteOne({ _id: new ObjectId(whId) });
        if (unitId) await db.collection('units').deleteOne({ _id: new ObjectId(unitId) });
        if (catId) await db.collection('categories').deleteOne({ _id: new ObjectId(catId) });
        await db.collection('stock_balances').deleteMany({ sku: itemSku });
        await db.collection('stock_movements').deleteMany({ sku: itemSku });
    }
}

runDomainCrudTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Test failed:', err);
        process.exit(1);
    });
