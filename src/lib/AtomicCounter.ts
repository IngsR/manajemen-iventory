import { ObjectId, Collection } from 'mongodb';
import { getMongoDb } from './MongoDb';

interface CounterDoc {
    _id: string;
    seq: number;
}

async function getCounterCollection(): Promise<Collection<CounterDoc>> {
    const db = await getMongoDb();
    return db.collection<CounterDoc>('_counters');
}

/**
 * Atomically increments a named counter and returns the new sequence value.
 * Uses findOneAndUpdate with $inc which is race-condition safe.
 */
async function getNextSequence(counterName: string): Promise<number> {
    const collection = await getCounterCollection();
    const result = await collection.findOneAndUpdate(
        { _id: counterName },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    return result!.seq;
}

/**
 * Generates a unique, concurrency-safe movement number.
 * Format: MOV-YYYYMMDD-NNNN
 * The sequence is global (not per-day) to avoid race conditions at midnight.
 */
export async function generateMovementNumber(): Promise<string> {
    const seq = await getNextSequence('movement_seq');
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const padded = String(seq).padStart(6, '0');
    return `MOV-${date}-${padded}`;
}

export { ObjectId };
