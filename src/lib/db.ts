import { Pool } from 'pg';
import type { QueryResult } from 'pg';
import bcryptjs from 'bcryptjs';

let pool: Pool;
const BCRYPT_SALT_ROUNDS = 10;

function getPool() {
    if (!pool) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set.');
        }
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
        console.log('[DB Setup] PostgreSQL pool created successfully.');
    }
    return pool;
}

export async function query<T extends Record<string, any>>(
    text: string,
    params?: unknown[],
): Promise<QueryResult<T>> {
    const start = Date.now();
    let client;
    try {
        client = await getPool().connect();
        const res = await client.query<T>(text, params);
        const duration = Date.now() - start;

        return res;
    } catch (dbError: any) {
        console.error(
            `DATABASE QUERY ERROR: Query: "${text.substring(0, 150)}..."`,
            {
                params,
                errorMessage: dbError.message,
                errorCode: dbError.code,
                errorDetail: dbError.detail,
            },
        );
        throw dbError;
    } finally {
        if (client) {
            client.release();
        }
    }
}

const createUpdatedAtTriggerFunctionQuery = `
  CREATE OR REPLACE FUNCTION trigger_set_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`;

async function ensureUpdatedAtTriggerFunction(): Promise<void> {
    try {
        await query(createUpdatedAtTriggerFunctionQuery);
        console.log(
            '[DB Setup] trigger_set_timestamp function checked/created successfully.',
        );
    } catch (error) {
        console.error(
            '[DB Setup] Error ensuring trigger_set_timestamp function:',
            error,
        );
    }
}

export async function createInventoryTable(): Promise<void> {
    console.log('[DB Setup] Attempting to set up inventory_items table...');
    await ensureUpdatedAtTriggerFunction();
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS inventory_items (
      id SERIAL PRIMARY KEY, -- ID adalah SERIAL PRIMARY KEY, dibuat otomatis oleh DB
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      category TEXT NOT NULL,
      location TEXT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
    const createNameIndexQuery = `CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items (name);`;
    const createCategoryIndexQuery = `CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items (category);`;
    const createUpdatedAtTriggerInventory = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'set_timestamp_inventory_items' AND tgrelid = 'inventory_items'::regclass
      ) THEN
        CREATE TRIGGER set_timestamp_inventory_items
        BEFORE UPDATE ON inventory_items
        FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Trigger set_timestamp_inventory_items created for inventory_items.';
      ELSE
        RAISE NOTICE 'Trigger set_timestamp_inventory_items already exists for inventory_items.';
      END IF;
    END $$;
  `;
    try {
        await query(createTableQuery);
        console.log(
            '[DB Setup] inventory_items table structure (CREATE TABLE IF NOT EXISTS) executed. ID is SERIAL PRIMARY KEY.',
        );
        await query(createNameIndexQuery);
        console.log('[DB Setup] inventory_items name index checked/created.');
        await query(createCategoryIndexQuery);
        console.log(
            '[DB Setup] inventory_items category index checked/created.',
        );
        await query(createUpdatedAtTriggerInventory);
        console.log(
            '[DB Setup] inventory_items updated_at trigger checked/created.',
        );
        console.log(
            '[DB Setup] SUCCESS: Inventory table, indexes, and trigger setup complete (ID as SERIAL).',
        );
    } catch (error) {
        console.error(
            '[DB Setup] ERROR: Error setting up inventory_items table, indexes, or trigger:',
            error,
        );
        throw error;
    }
}

export async function createDefectiveItemsLogTable(): Promise<void> {
    console.log('[DB Setup] Attempting to set up defective_items_log table...');
    await ensureUpdatedAtTriggerFunction();
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS defective_items_log (
      id SERIAL PRIMARY KEY, -- ID adalah SERIAL PRIMARY KEY, dibuat otomatis oleh DB
      inventory_item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
      item_name_at_log_time TEXT NOT NULL,
      quantity_defective INTEGER NOT NULL CHECK (quantity_defective > 0),
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending Review',
      notes TEXT NULL,
      logged_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
    const createFkIndexQuery = `CREATE INDEX IF NOT EXISTS idx_defective_items_log_inventory_item_id ON defective_items_log (inventory_item_id);`;
    const createStatusIndexQuery = `CREATE INDEX IF NOT EXISTS idx_defective_items_log_status ON defective_items_log (status);`;
    const createUpdatedAtTriggerDefectiveLog = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'set_timestamp_defective_items_log' AND tgrelid = 'defective_items_log'::regclass
      ) THEN
        CREATE TRIGGER set_timestamp_defective_items_log
        BEFORE UPDATE ON defective_items_log
        FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Trigger set_timestamp_defective_items_log created for defective_items_log.';
      ELSE
        RAISE NOTICE 'Trigger set_timestamp_defective_items_log already exists for defective_items_log.';
      END IF;
    END $$;
  `;
    try {
        await query(createTableQuery);
        console.log(
            '[DB Setup] defective_items_log table structure (CREATE TABLE IF NOT EXISTS) executed. ID is SERIAL PRIMARY KEY.',
        );
        await query(createFkIndexQuery);
        console.log(
            '[DB Setup] defective_items_log foreign key index checked/created.',
        );
        await query(createStatusIndexQuery);
        console.log(
            '[DB Setup] defective_items_log status index checked/created.',
        );
        await query(createUpdatedAtTriggerDefectiveLog);
        console.log(
            '[DB Setup] defective_items_log updated_at trigger checked/created.',
        );
        console.log(
            '[DB Setup] SUCCESS: Defective items log table, indexes, and trigger setup complete (ID as SERIAL).',
        );
    } catch (error) {
        console.error(
            '[DB Setup] ERROR: Error setting up defective_items_log table, indexes, or trigger:',
            error,
        );
        throw error;
    }
}

export async function createUsersTable(): Promise<void> {
    console.log('[DB Setup] Attempting to set up users table...');
    await ensureUpdatedAtTriggerFunction();
    const createRoleEnumQuery = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN CREATE TYPE user_role_enum AS ENUM ('admin', 'employee'); RAISE NOTICE 'Enum user_role_enum created.'; ELSE RAISE NOTICE 'Enum user_role_enum already exists.'; END IF; END $$;`;
    const createStatusEnumQuery = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN CREATE TYPE user_status_enum AS ENUM ('active', 'suspended'); RAISE NOTICE 'Enum user_status_enum created.'; ELSE RAISE NOTICE 'Enum user_status_enum already exists.'; END IF; END $$;`;
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, -- ID adalah SERIAL PRIMARY KEY, dibuat otomatis oleh DB
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role user_role_enum NOT NULL,
      status user_status_enum NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
    const createUsernameIndexQuery = `CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);`;
    const createUpdatedAtTriggerUsers = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'set_timestamp_users' AND tgrelid = 'users'::regclass
      ) THEN
        CREATE TRIGGER set_timestamp_users
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Trigger set_timestamp_users created for users.';
      ELSE
        RAISE NOTICE 'Trigger set_timestamp_users already exists for users.';
      END IF;
    END $$;
  `;

    try {
        await query(createRoleEnumQuery);
        console.log('[DB Setup] user_role_enum type checked/created.');
        await query(createStatusEnumQuery);
        console.log('[DB Setup] user_status_enum type checked/created.');
        await query(createTableQuery);
        console.log(
            '[DB Setup] users table structure (CREATE TABLE IF NOT EXISTS) executed. ID is SERIAL PRIMARY KEY.',
        );
        await query(createUsernameIndexQuery);
        console.log('[DB Setup] users username index checked/created.');
        await query(createUpdatedAtTriggerUsers);
        console.log('[DB Setup] users updated_at trigger checked/created.');

        const anyAdminExists = await query(
            "SELECT 1 FROM users WHERE role = 'admin' LIMIT 1;",
        );
        if (anyAdminExists.rowCount === 0) {
            const defaultAdminPassword = 'admin123';
            const hashedPassword = bcryptjs.hashSync(
                defaultAdminPassword,
                BCRYPT_SALT_ROUNDS,
            );
            await query(
                'INSERT INTO users (username, password_hash, role, status) VALUES ($1, $2, $3, $4);',
                ['admin', hashedPassword, 'admin', 'active'],
            );
            console.log(
                "[DB Setup] Default admin user ('admin'/password:'admin123') created with hashed password as no other admin users were found.",
            );
        } else {
            console.log(
                "[DB Setup] An admin user already exists. Default admin ('admin') not created.",
            );
        }

        console.log(
            '[DB Setup] SUCCESS: Users table, enums, index, trigger, and default admin check complete. Passwords are hashed.',
        );
    } catch (error) {
        console.error(
            '[DB Setup] ERROR: Error setting up users table, enums, index, trigger, or default admin:',
            error,
        );
        throw error;
    }
}

export async function createActivityLogTable(): Promise<void> {
    console.log('[DB Setup] Attempting to set up activity_log table...');
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      username_at_log_time TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NULL,
      logged_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
    const createUserIdIndexQuery = `CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log (user_id);`;
    const createLoggedAtIndexQuery = `CREATE INDEX IF NOT EXISTS idx_activity_log_logged_at ON activity_log (logged_at);`;

    try {
        await query(createTableQuery);
        console.log(
            '[DB Setup] activity_log table structure (CREATE TABLE IF NOT EXISTS) executed.',
        );
        await query(createUserIdIndexQuery);
        console.log('[DB Setup] activity_log user_id index checked/created.');
        await query(createLoggedAtIndexQuery);
        console.log('[DB Setup] activity_log logged_at index checked/created.');
        console.log(
            '[DB Setup] SUCCESS: Activity log table and indexes setup complete.',
        );
    } catch (error) {
        console.error(
            '[DB Setup] ERROR: Error setting up activity_log table or indexes:',
            error,
        );
        throw error;
    }
}

if (process.env.NODE_ENV !== 'test') {
    (async () => {
        try {
            console.log('[DB Init] Starting database initialization...');
            getPool();
            await ensureUpdatedAtTriggerFunction();
            await createInventoryTable();
            await createDefectiveItemsLogTable();
            await createUsersTable();
            await createActivityLogTable();
            console.log('[DB Init] Database initialization process completed.');
        } catch (initError) {
            console.error(
                '[DB Init] CRITICAL ERROR during database initialization:',
                initError,
            );
        }
    })();
}
