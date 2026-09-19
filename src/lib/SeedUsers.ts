import { ObjectId } from 'mongodb';
import { getUserCollection, UserRole } from '@/models/UserModel';
import { hashPassword } from './Auth';
import { initUserIndexes } from '@/models/UserModel';

interface SeedUserSpec {
    name: string;
    email: string;
    plainPassword: string;
    role: UserRole;
}

export const SEED_USERS: SeedUserSpec[] = [
    {
        name: 'Administrator',
        email: 'admin@inventory.local',
        plainPassword: 'admin123',
        role: 'ADMIN',
    },
    {
        name: 'Supervisor Gudang',
        email: 'supervisor@inventory.local',
        plainPassword: 'supervisor123',
        role: 'SUPERVISOR',
    },
    {
        name: 'Petugas Operasional',
        email: 'petugas@inventory.local',
        plainPassword: 'petugas123',
        role: 'PETUGAS',
    },
];

export async function seedUsers(): Promise<void> {
    console.log('Seeding development users...');
    await initUserIndexes();
    const col = await getUserCollection();

    for (const spec of SEED_USERS) {
        const passwordHash = await hashPassword(spec.plainPassword);
        const existing = await col.findOne({ email: spec.email });

        if (!existing) {
            await col.insertOne({
                _id: new ObjectId(),
                name: spec.name,
                email: spec.email,
                passwordHash,
                role: spec.role,
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`  ✓ Created ${spec.role}: ${spec.email}`);
        } else {
            await col.updateOne(
                { _id: existing._id },
                {
                    $set: {
                        name: spec.name,
                        passwordHash,
                        role: spec.role,
                        status: 'ACTIVE',
                        updatedAt: new Date(),
                    },
                }
            );
            console.log(`  ✓ Updated ${spec.role}: ${spec.email}`);
        }
    }
    console.log('Seed users completed successfully.');
}

if (require.main === module) {
    seedUsers()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Failed to seed users:', err);
            process.exit(1);
        });
}
