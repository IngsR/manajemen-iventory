import { MongoClient, Db, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/manajemen_inventory';
const defaultDbName = process.env.MONGODB_DB_NAME || 'manajemen_inventory';

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
};

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        const client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

/**
 * Returns the connected MongoClient promise.
 */
export async function getMongoClient(): Promise<MongoClient> {
    return clientPromise;
}

/**
 * Returns the MongoDB Database instance.
 * @param dbName Optional database name override
 */
export async function getMongoDb(dbName?: string): Promise<Db> {
    const client = await getMongoClient();
    return client.db(dbName || defaultDbName);
}

/**
 * Pings the MongoDB instance to verify connectivity.
 */
export async function pingMongoDb(): Promise<{
    success: boolean;
    latencyMs?: number;
    message: string;
}> {
    const startTime = Date.now();
    try {
        const db = await getMongoDb();
        await db.command({ ping: 1 });
        const latencyMs = Date.now() - startTime;
        return {
            success: true,
            latencyMs,
            message: `Connected successfully to MongoDB (ping: ${latencyMs}ms)`,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            message: `Failed to connect to MongoDB: ${errorMessage}`,
        };
    }
}
