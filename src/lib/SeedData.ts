/**
 * SeedData.ts
 *
 * Idempotent database seeder for FASE 7:
 * 1. Default Users: Admin, Supervisor, and 2 Petugas / Officer accounts
 * 2. Master Data: 3 Categories, 3 Units, 1 Warehouse, 4 Locations
 * 3. 8 Realistic Items with defined minStock
 * 4. Initial Stock Seed via transactional receiveStock engine (idempotent: checks balance before receive)
 *
 * Run with: npm run seed OR npx tsx --env-file=.env src/lib/SeedData.ts
 */

import { ObjectId } from 'mongodb';
import { getMongoDb } from './MongoDb';
import { getUserCollection } from '@/models/UserModel';
import { getCategoryCollection } from '@/models/CategoryModel';
import { getUnitCollection } from '@/models/UnitModel';
import { getWarehouseCollection } from '@/models/WarehouseModel';
import { getLocationCollection } from '@/models/LocationModel';
import { getItemCollection } from '@/models/ItemModel';
import { seedUsers } from './SeedUsers';
import { receiveStock } from '@/services/inventory/ReceiveStockService';
import { getCurrentBalance } from '@/services/inventory/InventoryStockHelper';

export async function seedAllData(): Promise<void> {
    console.log('==================================================');
    console.log('   StockFlow ERP — Master Data & Stock Seeder     ');
    console.log('==================================================\n');

    // 1. Seed Users
    console.log('[1/4] Seeding Users...');
    await seedUsers();
    console.log('');

    const usersCol = await getUserCollection();
    const adminUser = await usersCol.findOne({ role: 'ADMIN', status: 'ACTIVE' });
    const petugasUser = await usersCol.findOne({ role: 'PETUGAS', status: 'ACTIVE' });

    if (!adminUser || !petugasUser) {
        throw new Error('Default users must exist before proceeding with seed.');
    }

    // 2. Seed Master Data (Categories, Units, Warehouse, Locations)
    console.log('[2/4] Seeding Categories, Units, Warehouse & Locations...');
    const catCol = await getCategoryCollection();
    const unitCol = await getUnitCollection();
    const whCol = await getWarehouseCollection();
    const locCol = await getLocationCollection();
    const itemCol = await getItemCollection();

    // 2.1 Categories
    const categoriesData = [
        { code: 'CAT-ELK', name: 'Elektronik & Perangkat IT' },
        { code: 'CAT-ATK', name: 'Alat Tulis & Perlengkapan Kantor' },
        { code: 'CAT-KBR', name: 'Fasilitas & Perlengkapan Kebersihan' },
    ];
    const categoryMap: Record<string, ObjectId> = {};
    for (const c of categoriesData) {
        let existing = await catCol.findOne({ code: c.code });
        if (!existing) {
            const _id = new ObjectId();
            await catCol.insertOne({
                _id,
                code: c.code,
                name: c.name,
                status: 'ACTIVE',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            categoryMap[c.code] = _id;
            console.log(`  ✓ Kategori baru: [${c.code}] ${c.name}`);
        } else {
            categoryMap[c.code] = existing._id;
            console.log(`  • Kategori existing: [${c.code}] ${c.name}`);
        }
    }

    // 2.2 Units
    const unitsData = [
        { code: 'PCS', name: 'Pieces (Satuan)' },
        { code: 'BOX', name: 'Box / Kotak' },
        { code: 'UNIT', name: 'Unit / Perangkat' },
    ];
    const unitMap: Record<string, ObjectId> = {};
    for (const u of unitsData) {
        let existing = await unitCol.findOne({ code: u.code });
        if (!existing) {
            const _id = new ObjectId();
            await unitCol.insertOne({
                _id,
                code: u.code,
                name: u.name,
                status: 'ACTIVE',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            unitMap[u.code] = _id;
            console.log(`  ✓ Satuan baru: [${u.code}] ${u.name}`);
        } else {
            unitMap[u.code] = existing._id;
            console.log(`  • Satuan existing: [${u.code}] ${u.name}`);
        }
    }

    // 2.3 Warehouse
    let warehouse = await whCol.findOne({ code: 'WH-UTAMA' });
    if (!warehouse) {
        const whId = new ObjectId();
        await whCol.insertOne({
            _id: whId,
            code: 'WH-UTAMA',
            name: 'Gudang Pusat Distribusi Jakarta',
            status: 'ACTIVE',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        warehouse = await whCol.findOne({ _id: whId });
        console.log(`  ✓ Gudang baru: [WH-UTAMA] Gudang Pusat Distribusi Jakarta`);
    } else {
        console.log(`  • Gudang existing: [WH-UTAMA] ${warehouse.name}`);
    }
    const warehouseId = warehouse!._id;

    // 2.4 Locations
    const locationsData = [
        { code: 'LOC-INBOUND', name: 'Area Penerimaan Inbound', type: 'RECEIVING' as const },
        { code: 'LOC-RAK-A', name: 'Rak Penyimpanan Utama A', type: 'STORAGE' as const },
        { code: 'LOC-RAK-B', name: 'Rak Penyimpanan Cadangan B', type: 'STORAGE' as const },
        { code: 'LOC-OUTBOUND', name: 'Area Pengiriman Outbound', type: 'SHIPPING' as const },
    ];
    const locationMap: Record<string, ObjectId> = {};
    for (const l of locationsData) {
        let existing = await locCol.findOne({ warehouseId, code: l.code });
        if (!existing) {
            const _id = new ObjectId();
            await locCol.insertOne({
                _id,
                warehouseId,
                code: l.code,
                name: l.name,
                type: l.type,
                status: 'ACTIVE',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            locationMap[l.code] = _id;
            console.log(`  ✓ Lokasi baru: [${l.code}] (${l.type}) ${l.name}`);
        } else {
            locationMap[l.code] = existing._id;
            console.log(`  • Lokasi existing: [${l.code}] ${existing.name}`);
        }
    }

    // 3. Seed Items
    console.log('\n[3/4] Seeding 8 Realistic Inventory Items...');
    const itemsData = [
        {
            sku: 'SKU-LP-01',
            name: 'Laptop ThinkPad T14 Gen 4 Core i7',
            categoryCode: 'CAT-ELK',
            unitCode: 'UNIT',
            minStock: 5,
            targetLocation: 'LOC-RAK-A',
            initialStock: 15,
        },
        {
            sku: 'SKU-KB-02',
            name: 'Keyboard Wireless Logitech MX Keys',
            categoryCode: 'CAT-ELK',
            unitCode: 'PCS',
            minStock: 10,
            targetLocation: 'LOC-RAK-A',
            initialStock: 40,
        },
        {
            sku: 'SKU-MS-03',
            name: 'Mouse Wireless Silent Click Logitech',
            categoryCode: 'CAT-ELK',
            unitCode: 'PCS',
            minStock: 10,
            targetLocation: 'LOC-RAK-A',
            initialStock: 35,
        },
        {
            sku: 'SKU-PP-04',
            name: 'Kertas HVS A4 80gr PaperOne',
            categoryCode: 'CAT-ATK',
            unitCode: 'BOX',
            minStock: 25,
            targetLocation: 'LOC-RAK-B',
            initialStock: 50,
        },
        {
            sku: 'SKU-PL-05',
            name: 'Pulpen Gel Pilot G2 0.5 Hitam',
            categoryCode: 'CAT-ATK',
            unitCode: 'BOX',
            minStock: 15,
            targetLocation: 'LOC-RAK-B',
            initialStock: 30,
        },
        {
            sku: 'SKU-TN-06',
            name: 'Toner Printer HP LaserJet Original',
            categoryCode: 'CAT-ATK',
            unitCode: 'UNIT',
            minStock: 5,
            targetLocation: 'LOC-RAK-B',
            initialStock: 4, // Intentionally low stock (< minStock) for demo verification
        },
        {
            sku: 'SKU-SB-07',
            name: 'Sabun Cuci Tangan Antiseptik Jerigen 5L',
            categoryCode: 'CAT-KBR',
            unitCode: 'UNIT',
            minStock: 5,
            targetLocation: 'LOC-RAK-B',
            initialStock: 12,
        },
        {
            sku: 'SKU-HS-08',
            name: 'Hand Sanitizer Gel Pump 500ml',
            categoryCode: 'CAT-KBR',
            unitCode: 'PCS',
            minStock: 15,
            targetLocation: 'LOC-RAK-B',
            initialStock: 20,
        },
    ];

    const itemDocMap: Record<string, ObjectId> = {};
    for (const item of itemsData) {
        let existing = await itemCol.findOne({ sku: item.sku });
        if (!existing) {
            const _id = new ObjectId();
            await itemCol.insertOne({
                _id,
                sku: item.sku,
                name: item.name,
                categoryId: categoryMap[item.categoryCode],
                unitId: unitMap[item.unitCode],
                minStock: item.minStock,
                status: 'ACTIVE',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            itemDocMap[item.sku] = _id;
            console.log(`  ✓ Item baru: [${item.sku}] ${item.name} (min: ${item.minStock})`);
        } else {
            itemDocMap[item.sku] = existing._id;
            console.log(`  • Item existing: [${item.sku}] ${existing.name}`);
        }
    }

    // 4. Seed Initial Stock via Transactional Engine (receiveStock)
    console.log('\n[4/4] Seeding Initial Stock via Inventory Transaction Engine...');
    for (const item of itemsData) {
        const itemOid = itemDocMap[item.sku];
        const locationOid = locationMap[item.targetLocation];

        const currentBalance = await getCurrentBalance(itemOid, locationOid);

        if (currentBalance > 0) {
            console.log(
                `  • Stok sudah ada untuk [${item.sku}] di [${item.targetLocation}] (Balance: ${currentBalance}). Melewati receive.`
            );
            continue;
        }

        const res = await receiveStock({
            itemId: itemOid.toHexString(),
            locationId: locationOid.toHexString(),
            quantity: item.initialStock,
            referenceNumber: `INIT-PO-${item.sku}`,
            reason: `Stok Awal Sistem FASE 7 (${item.name})`,
            actor: {
                userId: petugasUser._id.toHexString(),
                name: petugasUser.name,
                role: petugasUser.role,
            },
        });

        console.log(
            `  ✓ Terima stok [${item.sku}]: +${item.initialStock} di [${item.targetLocation}] => Ref: ${res.movementNumber} (Total: ${res.stockAfter})`
        );
    }

    console.log('\n==================================================');
    console.log('   ✓ SEEDING COMPLETED SUCCESSFULLY!             ');
    console.log('==================================================\n');
}

if (require.main === module) {
    seedAllData()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('\nSeed failed with error:', err);
            process.exit(1);
        });
}
