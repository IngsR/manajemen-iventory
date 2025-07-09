import { Pool } from 'pg';
import type { QueryResult as PgQueryResult } from 'pg';
import bcryptjs from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 10;

let pool: Pool;

function getPool(): Pool {
    if (!pool) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set.');
        }
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.on('error', (err) => {
            console.error('[DB] Unexpected error on idle client', err);
        });
        console.log('[DB] PostgreSQL pool created.');
    }
    return pool;
}

export type QueryResult<T> = {
    rows: T[];
    rowCount: number;
};

export async function query<T extends Record<string, any>>(
    text: string,
    params?: unknown[],
): Promise<QueryResult<T>> {
    const client = await getPool().connect();
    const start = Date.now();

    try {
        const res = await client.query(text, params);
        const duration = Date.now() - start;
        console.log(`[DB] Query executed in ${duration}ms`);

        return {
            rows: res.rows as T[],
            rowCount: res.rowCount ?? 0,
        };
    } catch (err: any) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[DB] QUERY ERROR: ${message}`, {
            sql: text,
            params,
            code: (err as any)?.code,
        });
        throw err;
    } finally {
        client.release();
    }
}

// ────────────────────────────────────────────
// Utility: Updated_at Trigger Function
// ────────────────────────────────────────────

async function ensureUpdatedAtTriggerFunction() {
    const fnQuery = `
        CREATE OR REPLACE FUNCTION trigger_set_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `;
    await query(fnQuery);
}

// ────────────────────────────────────────────
// Table: inventory_items
// ────────────────────────────────────────────

async function createInventoryTable() {
    const createTable = `
        CREATE TABLE IF NOT EXISTS inventory_items (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity >= 0),
            category TEXT NOT NULL,
            location TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;
    const indexName = `CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);`;
    const indexCat = `CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);`;
    const trigger = `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_inventory_items'
            ) THEN
                CREATE TRIGGER set_timestamp_inventory_items
                BEFORE UPDATE ON inventory_items
                FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
            END IF;
        END $$;
    `;

    await query(createTable);
    await query(indexName);
    await query(indexCat);
    await query(trigger);
}

// ────────────────────────────────────────────
// Table: defective_items_log
// ────────────────────────────────────────────

async function createDefectiveItemsLogTable() {
    const createTable = `
        CREATE TABLE IF NOT EXISTS defective_items_log (
            id SERIAL PRIMARY KEY,
            inventory_item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
            item_name_at_log_time TEXT NOT NULL,
            quantity_defective INTEGER NOT NULL CHECK (quantity_defective > 0),
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending Review',
            notes TEXT,
            logged_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;
    const indexFK = `CREATE INDEX IF NOT EXISTS idx_defective_items_log_inventory_item_id ON defective_items_log(inventory_item_id);`;
    const indexStatus = `CREATE INDEX IF NOT EXISTS idx_defective_items_log_status ON defective_items_log(status);`;
    const trigger = `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_defective_items_log'
            ) THEN
                CREATE TRIGGER set_timestamp_defective_items_log
                BEFORE UPDATE ON defective_items_log
                FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
            END IF;
        END $$;
    `;

    await query(createTable);
    await query(indexFK);
    await query(indexStatus);
    await query(trigger);
}

// ────────────────────────────────────────────
// Table: users
// ────────────────────────────────────────────

async function createUsersTable() {
    const createRoleEnum = `
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
                CREATE TYPE user_role_enum AS ENUM ('admin', 'employee');
            END IF;
        END $$;
    `;
    const createStatusEnum = `
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN
                CREATE TYPE user_status_enum AS ENUM ('active', 'suspended');
            END IF;
        END $$;
    `;
    const createTable = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role user_role_enum NOT NULL,
            status user_status_enum NOT NULL DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;
    const indexUsername = `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`;
    const trigger = `
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_users'
            ) THEN
                CREATE TRIGGER set_timestamp_users
                BEFORE UPDATE ON users
                FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
            END IF;
        END $$;
    `;

    await query(createRoleEnum);
    await query(createStatusEnum);
    await query(createTable);
    await query(indexUsername);
    await query(trigger);

    const res = await query('SELECT 1 FROM users WHERE role = $1 LIMIT 1;', [
        'admin',
    ]);
    if (res.rowCount === 0) {
        const hashed = bcryptjs.hashSync('admin123', BCRYPT_SALT_ROUNDS);
        await query(
            'INSERT INTO users (username, password_hash, role, status) VALUES ($1, $2, $3, $4);',
            ['admin', hashed, 'admin', 'active'],
        );
        console.log(
            '[DB] Default admin created: username="admin", password="admin123"',
        );
    }
}

// ────────────────────────────────────────────
// Table: activity_log
// ────────────────────────────────────────────

async function createActivityLogTable() {
    const createTable = `
        CREATE TABLE IF NOT EXISTS activity_log (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            username_at_log_time TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            logged_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;
    const indexUserId = `CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);`;
    const indexLoggedAt = `CREATE INDEX IF NOT EXISTS idx_activity_log_logged_at ON activity_log(logged_at);`;

    await query(createTable);
    await query(indexUserId);
    await query(indexLoggedAt);
}

// ────────────────────────────────────────────
// Init All (if not in test)
// ────────────────────────────────────────────

async function initializeDatabase() {
    console.log('[DB] Initializing all database tables...');
    await ensureUpdatedAtTriggerFunction();
    await createInventoryTable();
    await createDefectiveItemsLogTable();
    await createUsersTable();
    await createActivityLogTable();
    console.log('[DB] Database setup complete.');
}

if (process.env.NODE_ENV !== 'test') {
    initializeDatabase().catch((err) =>
        console.error('[DB Init] CRITICAL ERROR:', err),
    );
}
