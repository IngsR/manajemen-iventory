import { initCategoryIndexes } from './CategoryModel';
import { initUnitIndexes } from './UnitModel';
import { initWarehouseIndexes } from './WarehouseModel';
import { initLocationIndexes } from './LocationModel';
import { initItemIndexes } from './ItemModel';
import { initStockBalanceIndexes } from './StockBalanceModel';
import { initStockMovementIndexes } from './StockMovementModel';
import { initUserIndexes } from './UserModel';
import { initAuditLogIndexes } from './AuditLogModel';
import { initStockOpnameIndexes } from './StockOpnameModel';

export async function initAllIndexes(): Promise<void> {
    console.log('Initializing MongoDB collections and indexes...');
    await initCategoryIndexes();
    await initUnitIndexes();
    await initWarehouseIndexes();
    await initLocationIndexes();
    await initItemIndexes();
    await initStockBalanceIndexes();
    await initStockMovementIndexes();
    await initUserIndexes();
    await initAuditLogIndexes();
    await initStockOpnameIndexes();
    console.log('All indexes initialized successfully.');
}

// Allow direct execution via npx tsx src/models/InitIndexes.ts
if (require.main === module) {
    initAllIndexes()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Failed to initialize indexes:', err);
            process.exit(1);
        });
}
