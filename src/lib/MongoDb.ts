import { MongoClient, Db } from 'mongodb';

function getMongoUri(): string {
    return (
        process.env.MONGODB_URI_MONGODB_URI ||
        process.env.MONGODB_URI ||
        'mongodb://127.0.0.1:27017/manajemen_inventory'
    );
}

const defaultDbName = process.env.MONGODB_DB_NAME || 'manajemen_inventory';

const options = {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
};

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
    // eslint-disable-next-line no-var
    var _mongoClientUri: string | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
    const uri = getMongoUri();

    if (process.env.NODE_ENV === 'development') {
        if (!global._mongoClientPromise || global._mongoClientUri !== uri) {
            global._mongoClientUri = uri;
            const client = new MongoClient(uri, options);
            global._mongoClientPromise = client.connect().catch((err) => {
                // Reset cache on error so next attempt can retry fresh
                global._mongoClientPromise = undefined;
                global._mongoClientUri = undefined;
                throw err;
            });
        }
        return global._mongoClientPromise;
    }

    const client = new MongoClient(uri, options);
    return client.connect();
}

export async function getMongoDb(dbName?: string): Promise<Db> {
    const client = await getMongoClient();
    return client.db(dbName || process.env.MONGODB_DB_NAME || defaultDbName);
}

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
