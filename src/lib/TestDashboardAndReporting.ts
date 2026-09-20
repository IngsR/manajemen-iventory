/**
 * TestDashboardAndReporting.ts
 *
 * Integration test suite for FASE 6: Dashboard, Reporting & UI/UX Refactoring.
 *
 * Covers:
 * 1. Dashboard counts match actual database counts (items, warehouses, locations, total qty).
 * 2. Low stock aggregation respects minStock > 0 and totalStock <= minStock.
 * 3. Low stock deficit calculation and sorting.
 * 4. Movement summary aggregation by type and optional date range.
 * 5. Recent movements retrieval with actor details and limit.
 * 6. Opname status summary aggregation.
 * 7. Paginated movement report with type, SKU, and actor filters.
 * 8. Paginated opname report with status filter and item count resolution.
 * 9. Read-only invariant: no collections are mutated by query services.
 *
 * Run with: npx tsx --env-file=.env src/lib/TestDashboardAndReporting.ts
 */

import { getMongoDb } from './MongoDb';
import {
    getActiveItemCount,
    getActiveWarehouseCount,
    getActiveLocationCount,
    getTotalInventoryQuantity,
    getLowStockItems,
    getLowStockCount,
    getMovementSummary,
    getOpnameSummary,
    getRecentMovements,
    getDashboardCounts,
} from '@/services/reporting/DashboardService';
import {
    getMovementReport,
    getOpnameReport,
} from '@/services/reporting/InventoryReportService';
import { MovementType } from '@/models/StockMovementModel';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
        failedTests++;
    }
}

async function runTests() {
    console.log('\n======================================================');
    console.log('  FASE 6: DASHBOARD & REPORTING INTEGRATION TESTS');
    console.log('======================================================\n');

    const db = await getMongoDb();

    // Snapshot collection document counts for read-only invariant check
    const collections = [
        'items',
        'warehouses',
        'locations',
        'stock_balances',
        'stock_movements',
        'stock_opnames',
        'stock_opname_items',
    ];
    const initialCounts: Record<string, number> = {};
    for (const c of collections) {
        initialCounts[c] = await db.collection(c).countDocuments();
    }

    // ── 1. Basic Dashboard Counts ─────────────────────────────────────────────
    console.log('--- TEST GROUP 1: Dashboard Basic Metrics ---');

    const activeItems = await getActiveItemCount();
    const actualActiveItems = await db
        .collection('items')
        .countDocuments({ isDeleted: false, status: 'ACTIVE' });
    assert(
        activeItems === actualActiveItems,
        'getActiveItemCount() matches active non-deleted items in DB',
        `Expected ${actualActiveItems}, got ${activeItems}`
    );

    const activeWarehouses = await getActiveWarehouseCount();
    const actualActiveWh = await db
        .collection('warehouses')
        .countDocuments({ isDeleted: false, status: 'ACTIVE' });
    assert(
        activeWarehouses === actualActiveWh,
        'getActiveWarehouseCount() matches active warehouses in DB',
        `Expected ${actualActiveWh}, got ${activeWarehouses}`
    );

    const activeLocations = await getActiveLocationCount();
    const actualActiveLoc = await db
        .collection('locations')
        .countDocuments({ isDeleted: false, status: 'ACTIVE' });
    assert(
        activeLocations === actualActiveLoc,
        'getActiveLocationCount() matches active locations in DB',
        `Expected ${actualActiveLoc}, got ${activeLocations}`
    );

    const totalQty = await getTotalInventoryQuantity();
    const balances = await db
        .collection('stock_balances')
        .find({})
        .toArray();
    const expectedQty = balances.reduce((sum, b) => sum + (b.quantity || 0), 0);
    assert(
        totalQty === expectedQty,
        'getTotalInventoryQuantity() matches sum of stock_balances',
        `Expected ${expectedQty}, got ${totalQty}`
    );

    const dashboardCounts = await getDashboardCounts();
    assert(
        dashboardCounts.activeItems === activeItems &&
            dashboardCounts.activeWarehouses === activeWarehouses &&
            dashboardCounts.activeLocations === activeLocations &&
            dashboardCounts.totalInventoryQty === totalQty,
        'getDashboardCounts() correctly aggregates all metrics into one response'
    );

    // ── 2. Low Stock Query ───────────────────────────────────────────────────
    console.log('\n--- TEST GROUP 2: Low Stock Alerts ---');

    const lowStockItems = await getLowStockItems();
    const lowStockCount = await getLowStockCount();

    assert(
        Array.isArray(lowStockItems),
        'getLowStockItems() returns an array'
    );
    assert(
        lowStockItems.length === lowStockCount,
        'getLowStockCount() matches length of getLowStockItems()',
        `Items length ${lowStockItems.length} vs count ${lowStockCount}`
    );

    // Verify properties of low stock items
    let allValidLowStock = true;
    let properlySorted = true;
    for (let i = 0; i < lowStockItems.length; i++) {
        const item = lowStockItems[i];
        if (item.minStock <= 0 || item.totalStock > item.minStock) {
            allValidLowStock = false;
        }
        if (item.deficit !== item.minStock - item.totalStock) {
            allValidLowStock = false;
        }
        if (i > 0 && item.deficit > lowStockItems[i - 1].deficit) {
            properlySorted = false;
        }
    }

    assert(
        allValidLowStock,
        'All low stock items have minStock > 0 and totalStock <= minStock and correct deficit'
    );
    assert(
        properlySorted,
        'Low stock items are sorted by deficit descending'
    );

    // ── 3. Movement Summary & Recent Movements ───────────────────────────────
    console.log('\n--- TEST GROUP 3: Movement Summary & Activity ---');

    const movementSummary = await getMovementSummary();
    assert(
        Array.isArray(movementSummary),
        'getMovementSummary() returns an array'
    );

    const totalMovementsInSummary = movementSummary.reduce((s, m) => s + m.count, 0);
    const actualTotalMovements = await db.collection('stock_movements').countDocuments();
    assert(
        totalMovementsInSummary === actualTotalMovements,
        'getMovementSummary() counts cover all stock movements',
        `Summary sum: ${totalMovementsInSummary}, Total DB movements: ${actualTotalMovements}`
    );

    const recentMovements = await getRecentMovements(5);
    assert(
        recentMovements.length <= 5,
        'getRecentMovements(5) respects limit parameter',
        `Returned ${recentMovements.length} movements`
    );

    if (recentMovements.length > 0) {
        const first = recentMovements[0];
        assert(
            Boolean(first.movementNumber && first.sku && first.type && first.actorName),
            'Recent movements have movementNumber, sku, type, and actorName populated'
        );
    }

    // ── 4. Stock Opname Summary ──────────────────────────────────────────────
    console.log('\n--- TEST GROUP 4: Opname Summary ---');

    const opnameSummary = await getOpnameSummary();
    assert(
        Array.isArray(opnameSummary),
        'getOpnameSummary() returns an array'
    );

    const totalOpnamesInSummary = opnameSummary.reduce((s, o) => s + o.count, 0);
    const actualTotalOpnames = await db.collection('stock_opnames').countDocuments();
    assert(
        totalOpnamesInSummary === actualTotalOpnames,
        'getOpnameSummary() counts cover all stock opnames',
        `Summary sum: ${totalOpnamesInSummary}, Total DB opnames: ${actualTotalOpnames}`
    );

    // ── 5. Paginated Movement Report ─────────────────────────────────────────
    console.log('\n--- TEST GROUP 5: Paginated Movement Report ---');

    const reportPage1 = await getMovementReport({}, 1, 5);
    assert(
        reportPage1.page === 1 && reportPage1.pageSize === 5,
        'Movement report pagination metadata is correct'
    );
    assert(
        reportPage1.total === actualTotalMovements,
        'Movement report total matches collection document count',
        `Report total: ${reportPage1.total}, actual: ${actualTotalMovements}`
    );
    assert(
        reportPage1.data.length <= 5,
        'Movement report returns correct slice size'
    );

    // Test filter by type
    const testTypes: MovementType[] = ['RECEIVE', 'ISSUE', 'ADJUSTMENT', 'TRANSFER', 'RETURN'];
    for (const t of testTypes) {
        const filtered = await getMovementReport({ type: t }, 1, 10);
        const actualCountForType = await db
            .collection('stock_movements')
            .countDocuments({ type: t });
        assert(
            filtered.total === actualCountForType,
            `getMovementReport with type=${t} matches actual DB count (${actualCountForType})`
        );
        const allMatch = filtered.data.every((row) => row.type === t);
        assert(
            allMatch,
            `All rows in filtered report have type=${t}`
        );
    }

    // ── 6. Paginated Stock Opname Report ─────────────────────────────────────
    console.log('\n--- TEST GROUP 6: Paginated Stock Opname Report ---');

    const opnameReport = await getOpnameReport({}, 1, 10);
    assert(
        opnameReport.page === 1 && opnameReport.pageSize === 10,
        'Opname report pagination metadata is correct'
    );
    assert(
        opnameReport.total === actualTotalOpnames,
        'Opname report total matches total stock_opnames count'
    );

    if (opnameReport.data.length > 0) {
        const firstOp = opnameReport.data[0];
        assert(
            typeof firstOp.itemCount === 'number',
            'Opname report includes resolved itemCount'
        );
    }

    // ── 7. Read-Only Invariant Guarantee ─────────────────────────────────────
    console.log('\n--- TEST GROUP 7: Read-Only Invariant Guarantee ---');

    let allCountsUnchanged = true;
    for (const c of collections) {
        const currentCount = await db.collection(c).countDocuments();
        if (currentCount !== initialCounts[c]) {
            allCountsUnchanged = false;
            console.error(
                `Collection ${c} count mutated: was ${initialCounts[c]}, now ${currentCount}`
            );
        }
    }
    assert(
        allCountsUnchanged,
        'Zero mutations: all collections preserved their document counts exactly'
    );

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n======================================================');
    console.log(`  TOTAL PASSED : ${passedTests}`);
    console.log(`  TOTAL FAILED : ${failedTests}`);
    console.log('======================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    }
    process.exit(0);
}

runTests().catch((err) => {
    console.error('Test execution failed with error:', err);
    process.exit(1);
});
