import { pingMongoDb, getMongoClient } from './MongoDb';

async function testConnection() {
    console.log('Testing MongoDB connection...');
    console.log(`URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/manajemen_inventory'}`);
    console.log(`Database: ${process.env.MONGODB_DB_NAME || 'manajemen_inventory'}`);

    const result = await pingMongoDb();

    if (result.success) {
        console.log(`[SUCCESS] ${result.message}`);
    } else {
        console.log(`[STATUS] ${result.message}`);
    }

    try {
        const client = await getMongoClient();
        await client.close();
    } catch {
        // Ignored if client wasn't connected
    }
}

testConnection();
