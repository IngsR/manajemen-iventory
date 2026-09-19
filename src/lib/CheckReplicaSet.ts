import { getMongoClient, getMongoDb } from './MongoDb';

async function checkReplicaSet() {
    try {
        const db = await getMongoDb('admin');
        const hello = await db.command({ hello: 1 });
        console.log('MongoDB hello response:');
        console.log('  setName:', hello.setName ?? 'N/A (standalone)');
        console.log('  hosts:', hello.hosts ?? 'N/A');
        console.log('  isWritablePrimary:', hello.isWritablePrimary);
        console.log('  msg:', hello.msg ?? '');

        // Try starting a session and transaction to see if it's supported
        const client = await getMongoClient();
        const session = client.startSession();
        try {
            session.startTransaction();
            await session.abortTransaction();
            console.log('MongoDB transactions: SUPPORTED');
        } catch (txErr: unknown) {
            const msg = txErr instanceof Error ? txErr.message : String(txErr);
            console.log('MongoDB transactions: NOT SUPPORTED -', msg);
        } finally {
            await session.endSession();
        }

        await client.close();
    } catch (err) {
        console.log('Error:', err instanceof Error ? err.message : String(err));
    }
}

checkReplicaSet();
