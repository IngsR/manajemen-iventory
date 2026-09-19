import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/manajemen_inventory';
const defaultDbName = process.env.MONGODB_DB_NAME || 'manajemen_inventory';

const options = {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
};

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
        const client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export async function getMongoClient(): Promise<MongoClient> {
    return clientPromise;
}

export async function getMongoDb(dbName?: string): Promise<Db> {
    const client = await getMongoClient();
    return client.db(dbName || defaultDbName);
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
