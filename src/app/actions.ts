'use server';

import type {
    InventoryItem,
    ItemFormData,
    LogDefectiveItemFormData,
    DefectiveItemLog,
    DefectiveItemLogEntry,
    UpdateDefectiveItemStatusFormData,
    LoginFormSchemaType,
    User,
    UserRole,
    SessionPayload,
    CreateUserFormData,
    UserStatus,
    ActivityLog,
    ChangePasswordFormData,
    ChangeUsernameFormData,
} from '@/lib/types';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import bcryptjs from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-fallback-super-secret-key-32-chars',
);
const COOKIE_NAME = 'session';
const BCRYPT_SALT_ROUNDS = 10;

// --- Internal Helper for Activity Logging ---
async function _logActivity(
    performingUser: User | null,
    action: string,
    details?: string,
) {
    noStore();
    if (!performingUser) {
        console.warn(
            'Activity Log: Skipping log - no performing user identified.',
        );
        return;
    }

    try {
        await query(
            'INSERT INTO activity_log (user_id, username_at_log_time, action, details) VALUES ($1, $2, $3, $4)',
            [
                performingUser.id,
                performingUser.username,
                action,
                details || null,
            ],
        );
    } catch (dbError) {
        console.error(
            'Activity Log: Failed to write to activity_log table:',
            dbError,
        );
        // Important: Do not let logging failure break the main action.
    }
}

// --- Auth Actions ---

interface LoginResult {
    success: boolean;
    message: string;
    user?: Pick<User, 'id' | 'username' | 'role'>;
}

export async function loginAction(
    formData: LoginFormSchemaType,
): Promise<LoginResult> {
    noStore();
    console.log('[LoginAttempt] Received login data:', {
        username: formData.username,
        passwordProvided: formData.password ? 'Yes' : 'No',
    });
    try {
        const userResult = await query<{
            id: number;
            username: string;
            password_hash: string;
            role: UserRole;
            status: string;
        }>(
            'SELECT id, username, password_hash, role, status FROM users WHERE username = $1',
            [formData.username],
        );

        console.log('[LoginAttempt] DB query result rows:', userResult.rows);

        if (userResult.rows.length === 0) {
            console.log(
                '[LoginAttempt] User not found in database:',
                formData.username,
            );
            return { success: false, message: 'Username atau password salah.' };
        }

        const userFromDb = userResult.rows[0];
        console.log('[LoginAttempt] User found:', {
            id: userFromDb.id,
            username: userFromDb.username,
            storedHashPresent: !!userFromDb.password_hash,
            role: userFromDb.role,
            status: userFromDb.status,
        });

        const isValidPassword = bcryptjs.compareSync(
            formData.password,
            userFromDb.password_hash,
        );
        console.log(
            '[LoginAttempt] Password comparison result (bcrypt.compareSync):',
            isValidPassword,
        );

        if (!isValidPassword) {
            console.warn(
                `Login FAILED for user ${userFromDb.username}. Password mismatch.`,
            );
            return { success: false, message: 'Username atau password salah.' };
        }

        if (userFromDb.status !== 'active') {
            console.log(
                '[LoginAttempt] User account is not active:',
                userFromDb.username,
                userFromDb.status,
            );
            return {
                success: false,
                message: 'Akun Anda tidak aktif. Hubungi administrator.',
            };
        }

        const user: User = {
            id: userFromDb.id, // id is number
            username: userFromDb.username,
            role: userFromDb.role,
            status: userFromDb.status as UserStatus,
            created_at: '',
            updated_at: '',
        };

        const sessionPayload: SessionPayload = {
            userId: user.id,
            role: user.role,
        }; // user.id is already number
        const token = await new SignJWT(sessionPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        cookies().set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        console.log('[LoginAttempt] Login successful for user:', user.username);
        await _logActivity(user, 'User logged in');
        return {
            success: true,
            message: 'Login berhasil!',
            user: { id: user.id, username: user.username, role: user.role },
        };
    } catch (error) {
        console.error('[LoginAttempt] Login error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan saat mencoba login.',
        };
    }
}

export async function logoutAction(): Promise<void> {
    noStore();
    const currentUser = await getCurrentUserAction(); // Get user before deleting cookie for logging
    cookies().delete(COOKIE_NAME);
    if (currentUser) {
        await _logActivity(currentUser, 'User logged out');
    }
    redirect('/login');
}

export async function getCurrentUserAction(): Promise<User | null> {
    noStore();
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    console.log(
        '[CurrentUserAction] Token from cookie:',
        token ? 'Token found' : 'No token',
    );

    if (!token) {
        return null;
    }
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const session = payload as SessionPayload;
        console.log('[CurrentUserAction] Session payload:', session);

        const userIdAsNumber = Number(session.userId); // session.userId is number from payload
        if (isNaN(userIdAsNumber)) {
            console.warn(
                '[CurrentUserAction] Invalid userId in session (not a number):',
                session.userId,
            );
            // Do NOT delete cookie here
            return null;
        }

        const userResult = await query<User>(
            'SELECT id, username, role, status, created_at, updated_at FROM users WHERE id = $1 AND status = $2',
            [userIdAsNumber, 'active'],
        );
        if (userResult.rows.length > 0) {
            console.log(
                '[CurrentUserAction] User found in DB:',
                userResult.rows[0].username,
            );
            return userResult.rows[0];
        }
        console.log(
            '[CurrentUserAction] User not found in DB for session ID or not active.',
        );
        // Do NOT delete cookie here
        return null;
    } catch (error) {
        console.warn(
            '[CurrentUserAction] Session token verification failed or DB error:',
            error,
        );
        // Do NOT delete cookie here
        return null;
    }
}

// --- Inventory Item Actions ---
export async function fetchInventoryItemsAction(): Promise<InventoryItem[]> {
    noStore();
    try {
        const result = await query<InventoryItem>(
            'SELECT id, name, quantity, category, location FROM inventory_items ORDER BY name ASC',
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        const dbError =
            error instanceof Error ? error.message : 'Unknown database error';
        throw new Error(
            `Gagal mengambil item inventaris dari database. Penyebab: ${dbError}. Pastikan tabel 'inventory_items' ada dan memiliki skema yang benar, terutama kolom 'id' yang seharusnya SERIAL PRIMARY KEY.`,
        );
    }
}

export async function addItemToDbAction(
    itemData: ItemFormData,
): Promise<InventoryItem | { error: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return { error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.' };

    const newItemData = {
        name: itemData.name,
        quantity: itemData.quantity,
        category: itemData.category,
        location: itemData.location || null,
    };
    try {
        const result = await query<InventoryItem>(
            'INSERT INTO inventory_items (name, quantity, category, location) VALUES ($1, $2, $3, $4) RETURNING *',
            [
                newItemData.name,
                newItemData.quantity,
                newItemData.category,
                newItemData.location,
            ],
        );
        if (result.rows.length > 0) {
            const addedItem = result.rows[0];
            await _logActivity(
                currentUser,
                'Created inventory item',
                `ID: ${addedItem.id}, Name: '${addedItem.name}', Qty: ${addedItem.quantity}, Category: '${addedItem.category}'`,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            return addedItem;
        }
        return {
            error: 'Gagal menambahkan item ke database: Tidak ada baris yang dikembalikan.',
        };
    } catch (error: any) {
        console.error('Error adding item to database:', error);
        let errorMessage = 'Gagal menambahkan item karena kesalahan database.';
        if (error.code === '23502' && error.column === 'id') {
            errorMessage =
                'Gagal menambahkan item: Kolom ID di database inventory_items tidak diatur untuk auto-increment (SERIAL PRIMARY KEY). Harap perbaiki skema database. Cara termudah adalah hapus tabel dan biarkan aplikasi membuatnya kembali saat restart.';
        } else if (error instanceof Error) {
            errorMessage = `Gagal menambahkan item: ${error.message}`;
        }
        return { error: errorMessage };
    }
}

export async function updateItemQuantityInDbAction(
    itemId: number,
    newQuantity: number,
): Promise<InventoryItem | { error: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return { error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.' };

    try {
        const currentItemResult = await query<InventoryItem>(
            'SELECT name, quantity FROM inventory_items WHERE id = $1',
            [itemId],
        );
        if (currentItemResult.rows.length === 0) {
            return { error: 'Item tidak ditemukan untuk diperbarui.' };
        }
        const currentItem = currentItemResult.rows[0];

        const result = await query<InventoryItem>(
            'UPDATE inventory_items SET quantity = $1 WHERE id = $2 RETURNING *',
            [newQuantity, itemId],
        );
        if (result.rows.length > 0) {
            const updatedItem = result.rows[0];
            await _logActivity(
                currentUser,
                'Updated inventory item quantity',
                `Item: '${updatedItem.name}' (ID: ${updatedItem.id}), Qty changed from ${currentItem.quantity} to ${updatedItem.quantity}`,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            return updatedItem;
        }
        return {
            error: 'Gagal memperbarui kuantitas item: Item tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error updating item quantity in database:', error);
        let errorMessage =
            'Gagal memperbarui kuantitas item karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal memperbarui kuantitas item: ${error.message}`;
        }
        return { error: errorMessage };
    }
}

export async function deleteItemFromDbAction(
    itemId: number,
): Promise<{ success: boolean; error?: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return {
            success: false,
            error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.',
        };

    let itemNameForLog = `ID: ${itemId}`;
    try {
        const itemResult = await query<{ name: string }>(
            'SELECT name FROM inventory_items WHERE id = $1',
            [itemId],
        );
        if (itemResult.rows.length > 0) {
            itemNameForLog = `'${itemResult.rows[0].name}' (ID: ${itemId})`;
        }
    } catch (e) {
        /* ignore */
    }

    try {
        const result = await query(
            'DELETE FROM inventory_items WHERE id = $1',
            [itemId],
        );
        if (result.rowCount !== null && result.rowCount > 0) {
            await _logActivity(
                currentUser,
                'Deleted inventory item',
                `Item: ${itemNameForLog}`,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            return { success: true };
        }
        return {
            success: false,
            error: 'Gagal menghapus item: Item tidak ditemukan.',
        };
    } catch (error) {
        console.error('Error deleting item from database:', error);
        let errorMessage = 'Gagal menghapus item karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal menghapus item: ${error.message}`;
        }
        if (
            error instanceof Error &&
            'code' in error &&
            (error as any).code === '23503'
        ) {
            errorMessage =
                'Gagal menghapus item: Item ini memiliki catatan terkait (mis., log barang cacat). Pastikan konfigurasi database memperbolehkan penghapusan berantai atau hapus catatan terkait terlebih dahulu.';
        }
        return { success: false, error: errorMessage };
    }
}

// --- Defective Item Actions ---

export async function logDefectiveItemAction(
    data: LogDefectiveItemFormData,
): Promise<DefectiveItemLog | { error: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return { error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.' };

    const newLogData = {
        inventory_item_id: data.inventory_item_id,
        item_name_at_log_time: data.item_name_at_log_time,
        quantity_defective: data.quantity_defective,
        reason: data.reason,
        status: data.status,
        notes: data.notes || null,
    };
    try {
        const result = await query<DefectiveItemLog>(
            'INSERT INTO defective_items_log (inventory_item_id, item_name_at_log_time, quantity_defective, reason, status, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [
                newLogData.inventory_item_id,
                newLogData.item_name_at_log_time,
                newLogData.quantity_defective,
                newLogData.reason,
                newLogData.status,
                newLogData.notes,
            ],
        );
        if (result.rows.length > 0) {
            const loggedDefect = result.rows[0];
            await _logActivity(
                currentUser,
                'Logged defective item',
                `Item: '${loggedDefect.item_name_at_log_time}' (Ref ID: ${loggedDefect.inventory_item_id}), Qty Defective: ${loggedDefect.quantity_defective}, Reason: '${loggedDefect.reason}', Log ID: ${loggedDefect.id}`,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            revalidatePath('/defective-items');
            return loggedDefect;
        }
        return {
            error: 'Gagal mencatat barang cacat: Tidak ada baris yang dikembalikan.',
        };
    } catch (error: any) {
        console.error('Error logging defective item:', error);
        let errorMessage =
            'Gagal mencatat barang cacat karena kesalahan database.';
        if (error.code === '23502' && error.column === 'id') {
            errorMessage =
                'Gagal mencatat barang cacat: Kolom ID di database defective_items_log tidak diatur untuk auto-increment (SERIAL PRIMARY KEY). Harap perbaiki skema database. Cara termudah adalah hapus tabel dan biarkan aplikasi membuatnya kembali saat restart.';
        } else if (error instanceof Error) {
            errorMessage = `Gagal mencatat barang cacat: ${error.message}`;
        }
        return { error: errorMessage };
    }
}

export async function fetchDefectiveItemsLogAction(): Promise<
    DefectiveItemLogEntry[]
> {
    noStore();
    try {
        const result = await query<DefectiveItemLogEntry>(`
      SELECT
        dil.id,
        dil.inventory_item_id,
        dil.item_name_at_log_time,
        dil.quantity_defective,
        dil.reason,
        dil.status,
        dil.notes,
        dil.logged_at,
        dil.updated_at,
        ii.name as inventory_item_name
      FROM defective_items_log dil
      LEFT JOIN inventory_items ii ON dil.inventory_item_id = ii.id
      ORDER BY dil.logged_at DESC
    `);
        return result.rows.map((row) => ({
            ...row,
            inventory_item_name:
                row.inventory_item_name || row.item_name_at_log_time,
        }));
    } catch (error) {
        console.error('Error fetching defective items log:', error);
        const dbError =
            error instanceof Error ? error.message : 'Unknown database error';
        let specificHint = `Penyebab: ${dbError}. Pastikan tabel 'defective_items_log' dan 'inventory_items' ada dan memiliki skema yang benar. Khususnya, kolom 'id' pada 'defective_items_log' dan 'inventory_items' harus SERIAL PRIMARY KEY.`;

        if (
            typeof dbError === 'string' &&
            dbError.includes('relation "defective_items_log" does not exist')
        ) {
            specificHint =
                "Tabel 'defective_items_log' tidak ditemukan di database. Coba restart aplikasi agar tabel dibuat.";
        } else if (
            typeof dbError === 'string' &&
            dbError.includes('relation "inventory_items" does not exist')
        ) {
            specificHint =
                "Tabel 'inventory_items' tidak ditemukan di database. Coba restart aplikasi agar tabel dibuat.";
        } else if (
            typeof dbError === 'string' &&
            (dbError.includes('column dil.inventory_item_id does not exist') ||
                dbError.includes('column ii.id does not exist') ||
                dbError.includes('column ii.name does not exist'))
        ) {
            specificHint = `Satu atau lebih kolom yang dibutuhkan untuk JOIN (dil.inventory_item_id, ii.id, ii.name) tidak ditemukan. Harap periksa skema tabel 'defective_items_log' dan 'inventory_items'. Penyebab: ${dbError}`;
        }

        throw new Error(
            `Gagal mengambil log barang cacat dari database. ${specificHint}`,
        );
    }
}

export async function updateDefectiveItemStatusAction(
    logId: number,
    data: UpdateDefectiveItemStatusFormData,
): Promise<DefectiveItemLog | { error: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return { error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.' };

    try {
        const currentLogResult = await query<DefectiveItemLog>(
            'SELECT item_name_at_log_time, status FROM defective_items_log WHERE id = $1',
            [logId],
        );
        if (currentLogResult.rows.length === 0) {
            return { error: 'Log barang cacat tidak ditemukan.' };
        }
        const currentLog = currentLogResult.rows[0];

        const result = await query<DefectiveItemLog>(
            'UPDATE defective_items_log SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [data.status, data.notes || null, logId],
        );
        if (result.rows.length > 0) {
            const updatedLog = result.rows[0];
            await _logActivity(
                currentUser,
                'Updated defective item log status',
                `Log ID: ${updatedLog.id} for item '${updatedLog.item_name_at_log_time}', Status changed from '${currentLog.status}' to '${updatedLog.status}'`,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            revalidatePath('/defective-items');
            return updatedLog;
        }
        return {
            error: 'Gagal memperbarui status log barang cacat: Log tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error updating defective item log status:', error);
        let errorMessage =
            'Gagal memperbarui status log barang cacat karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal memperbarui status: ${error.message}`;
        }
        return { error: errorMessage };
    }
}

export async function deleteDefectiveItemLogAction(
    logId: number,
): Promise<{ success: boolean; error?: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return {
            success: false,
            error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.',
        };

    let logDescriptionForLog = `Log ID: ${logId}`;
    try {
        const logResult = await query<{
            item_name_at_log_time: string;
            quantity_defective: number;
        }>(
            'SELECT item_name_at_log_time, quantity_defective FROM defective_items_log WHERE id = $1',
            [logId],
        );
        if (logResult.rows.length > 0) {
            logDescriptionForLog = `Defective log for item '${logResult.rows[0].item_name_at_log_time}' (Qty: ${logResult.rows[0].quantity_defective}, Log ID: ${logId})`;
        }
    } catch (e) {
        /* ignore */
    }

    try {
        const result = await query(
            'DELETE FROM defective_items_log WHERE id = $1',
            [logId],
        );
        if (result.rowCount !== null && result.rowCount > 0) {
            await _logActivity(
                currentUser,
                'Deleted defective item log',
                logDescriptionForLog,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            revalidatePath('/defective-items');
            return { success: true };
        }
        return {
            success: false,
            error: 'Gagal menghapus log barang cacat: Log tidak ditemukan.',
        };
    } catch (error) {
        console.error(
            'Error deleting defective item log from database:',
            error,
        );
        let errorMessage =
            'Gagal menghapus log barang cacat karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal menghapus log: ${error.message}`;
        }
        return { success: false, error: errorMessage };
    }
}

// --- User Management Actions ---
export async function fetchUsersAction(): Promise<User[]> {
    noStore();
    try {
        const result = await query<User>(
            'SELECT id, username, role, status, created_at, updated_at FROM users ORDER BY username ASC',
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        const dbError =
            error instanceof Error ? error.message : 'Unknown database error';
        throw new Error(
            `Gagal mengambil data pengguna dari database. Penyebab: ${dbError}. Pastikan tabel 'users' ada dan memiliki skema yang benar.`,
        );
    }
}

export async function createUserAction(
    formData: CreateUserFormData,
): Promise<User | { error: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser || currentUser.role !== 'admin') {
        return { error: 'Hanya admin yang dapat membuat pengguna baru.' };
    }

    try {
        const existingUser = await query(
            'SELECT id FROM users WHERE username = $1',
            [formData.username],
        );
        if (existingUser.rows.length > 0) {
            return {
                error: 'Username sudah digunakan. Silakan pilih username lain.',
            };
        }

        const hashedPassword = bcryptjs.hashSync(
            formData.password,
            BCRYPT_SALT_ROUNDS,
        );
        const role: UserRole = 'employee';

        const result = await query<User>(
            'INSERT INTO users (username, password_hash, role, status) VALUES ($1, $2, $3, $4) RETURNING id, username, role, status, created_at, updated_at',
            [formData.username, hashedPassword, role, formData.status],
        );

        if (result.rows.length > 0) {
            const createdUser = result.rows[0];
            await _logActivity(
                currentUser,
                'Created user account',
                `User: '${createdUser.username}' (ID: ${createdUser.id}), Role: '${createdUser.role}', Status: '${createdUser.status}'`,
            );
            revalidatePath('/admin/dashboard'); // For user count
            revalidatePath('/admin/user-management');
            return createdUser;
        }
        return {
            error: 'Gagal membuat pengguna: Tidak ada baris yang dikembalikan.',
        };
    } catch (error) {
        console.error('Error creating user:', error);
        let errorMessage = 'Gagal membuat pengguna karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal membuat pengguna: ${error.message}`;
        }
        return { error: errorMessage };
    }
}

export async function updateUserStatusAction(
    userId: number,
    newStatus: UserStatus,
): Promise<User | { error: string }> {
    noStore();
    const performingAdmin = await getCurrentUserAction();
    if (!performingAdmin || performingAdmin.role !== 'admin') {
        return { error: 'Hanya admin yang dapat memperbarui status pengguna.' };
    }

    try {
        const targetUserResult = await query<User>(
            'SELECT username, role, status FROM users WHERE id = $1',
            [userId],
        );
        if (targetUserResult.rows.length === 0) {
            return { error: 'Pengguna target tidak ditemukan.' };
        }
        const targetUserCurrent = targetUserResult.rows[0];

        if (
            targetUserCurrent.role === 'admin' &&
            performingAdmin.id === userId &&
            targetUserCurrent.status === 'active' &&
            newStatus === 'suspended'
        ) {
            const activeAdminCountResult = await query<{ count: string }>(
                'SELECT COUNT(*) FROM users WHERE role = $1 AND status = $2',
                ['admin', 'active'],
            );
            if (parseInt(activeAdminCountResult.rows[0].count, 10) <= 1) {
                return {
                    error: 'Tidak dapat menangguhkan akun admin terakhir yang aktif.',
                };
            }
        }

        const result = await query<User>(
            'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, role, status, created_at, updated_at',
            [newStatus, userId],
        );
        if (result.rows.length > 0) {
            const updatedUser = result.rows[0];
            await _logActivity(
                performingAdmin,
                'Updated user account status',
                `User: '${updatedUser.username}' (ID: ${updatedUser.id}), Status changed from '${targetUserCurrent.status}' to '${updatedUser.status}'`,
            );
            revalidatePath('/admin/dashboard'); // For user count
            revalidatePath('/admin/user-management');
            return updatedUser;
        }
        return {
            error: 'Gagal memperbarui status pengguna: Pengguna tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error updating user status:', error);
        let errorMessage =
            'Gagal memperbarui status pengguna karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal memperbarui status: ${error.message}`;
        }
        return { error: errorMessage };
    }
}

export async function changeUsernameAction(
    userId: number,
    formData: ChangeUsernameFormData,
): Promise<{ success: boolean; error?: string; user?: User }> {
    noStore();
    const performingAdmin = await getCurrentUserAction();
    if (!performingAdmin || performingAdmin.role !== 'admin') {
        return {
            success: false,
            error: 'Hanya admin yang dapat mengubah username pengguna.',
        };
    }

    try {
        const targetUserResult = await query<User>(
            'SELECT username FROM users WHERE id = $1',
            [userId],
        );
        if (targetUserResult.rows.length === 0) {
            return {
                success: false,
                error: 'Pengguna target tidak ditemukan.',
            };
        }
        const oldUsername = targetUserResult.rows[0].username;

        if (oldUsername === formData.username) {
            const updatedUserResult = await query<User>(
                'SELECT id, username, role, status, created_at, updated_at FROM users WHERE id = $1',
                [userId],
            );
            revalidatePath('/admin/user-management');
            return { success: true, user: updatedUserResult.rows[0] };
        }

        const existingUserWithNewName = await query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [formData.username, userId],
        );
        if (existingUserWithNewName.rows.length > 0) {
            return {
                success: false,
                error: 'Username baru sudah digunakan oleh pengguna lain.',
            };
        }

        const result = await query<User>(
            'UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, role, status, created_at, updated_at',
            [formData.username, userId],
        );

        if (result.rows.length > 0) {
            const updatedUser = result.rows[0];
            await _logActivity(
                performingAdmin,
                'Changed user username',
                `Username changed for user ID: ${userId} from '${oldUsername}' to '${updatedUser.username}'`,
            );
            revalidatePath('/admin/user-management');
            return { success: true, user: updatedUser };
        }
        return {
            success: false,
            error: 'Gagal mengubah username: Pengguna tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error changing user username:', error);
        let errorMessage = 'Gagal mengubah username karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal mengubah username: ${error.message}`;
        }
        return { success: false, error: errorMessage };
    }
}

export async function changeUserPasswordAction(
    userId: number,
    formData: ChangePasswordFormData,
): Promise<{ success: boolean; error?: string; username?: string }> {
    noStore();
    const performingAdmin = await getCurrentUserAction();
    if (!performingAdmin || performingAdmin.role !== 'admin') {
        return {
            success: false,
            error: 'Hanya admin yang dapat mengubah kata sandi pengguna.',
        };
    }

    try {
        const targetUserResult = await query<{ username: string }>(
            'SELECT username FROM users WHERE id = $1',
            [userId],
        );
        if (targetUserResult.rows.length === 0) {
            return {
                success: false,
                error: 'Pengguna target tidak ditemukan.',
            };
        }
        const targetUsername = targetUserResult.rows[0].username;

        const newHashedPassword = bcryptjs.hashSync(
            formData.password,
            BCRYPT_SALT_ROUNDS,
        );

        const result = await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newHashedPassword, userId],
        );

        if (result.rowCount !== null && result.rowCount > 0) {
            await _logActivity(
                performingAdmin,
                'Changed user password',
                `Password changed for user: '${targetUsername}' (ID: ${userId})`,
            );
            revalidatePath('/admin/user-management');
            return { success: true, username: targetUsername };
        }
        return {
            success: false,
            error: 'Gagal mengubah kata sandi: Pengguna tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error changing user password:', error);
        let errorMessage =
            'Gagal mengubah kata sandi karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal mengubah kata sandi: ${error.message}`;
        }
        return { success: false, error: errorMessage };
    }
}

export async function deleteUserAction(
    userId: number,
): Promise<{ success: boolean; error?: string; username?: string }> {
    noStore();
    const performingAdmin = await getCurrentUserAction();
    if (!performingAdmin || performingAdmin.role !== 'admin') {
        return {
            success: false,
            error: 'Hanya admin yang dapat menghapus pengguna.',
        };
    }

    if (performingAdmin.id === userId) {
        return {
            success: false,
            error: 'Admin tidak dapat menghapus akunnya sendiri.',
        };
    }

    try {
        const targetUserResult = await query<User>(
            'SELECT username, role, status FROM users WHERE id = $1',
            [userId],
        );
        if (targetUserResult.rows.length === 0) {
            return {
                success: false,
                error: 'Pengguna target tidak ditemukan.',
            };
        }
        const targetUser = targetUserResult.rows[0];

        if (targetUser.role === 'admin' && targetUser.status === 'active') {
            const adminCountResult = await query<{ count: string }>(
                'SELECT COUNT(*) FROM users WHERE role = $1 AND status = $2',
                ['admin', 'active'],
            );
            if (parseInt(adminCountResult.rows[0].count, 10) <= 1) {
                return {
                    success: false,
                    error: 'Tidak dapat menghapus akun admin terakhir yang aktif.',
                };
            }
        }

        const result = await query('DELETE FROM users WHERE id = $1', [userId]);

        if (result.rowCount !== null && result.rowCount > 0) {
            await _logActivity(
                performingAdmin,
                'Deleted user account',
                `Deleted user: '${targetUser.username}' (ID: ${targetUser.id}), Role: '${targetUser.role}'`,
            );
            revalidatePath('/admin/dashboard'); // For user count
            revalidatePath('/admin/user-management');
            return { success: true, username: targetUser.username };
        }
        return {
            success: false,
            error: 'Gagal menghapus pengguna: Pengguna tidak ditemukan atau tidak ada perubahan.',
        };
    } catch (error) {
        console.error('Error deleting user:', error);
        let errorMessage =
            'Gagal menghapus pengguna karena kesalahan database.';
        if (error instanceof Error) {
            errorMessage = `Gagal menghapus pengguna: ${error.message}`;
        }
        if (
            error instanceof Error &&
            'code' in error &&
            (error as any).code === '23503'
        ) {
            errorMessage =
                'Gagal menghapus pengguna: Pengguna ini memiliki catatan terkait (mis., log aktivitas). Hapus atau perbarui catatan terkait terlebih dahulu atau konfigurasikan ON DELETE SET NULL/CASCADE pada foreign key.';
        }
        return { success: false, error: errorMessage };
    }
}

// --- Activity Log Actions ---
export async function fetchActivityLogsAction(): Promise<ActivityLog[]> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser || currentUser.role !== 'admin') {
        console.warn(
            'Attempt to fetch activity logs by non-admin or unauthenticated user.',
        );
        throw new Error('Hanya admin yang dapat melihat log aktivitas.');
    }

    try {
        const result = await query<ActivityLog>(
            'SELECT id, user_id, username_at_log_time, action, details, logged_at FROM activity_log ORDER BY logged_at DESC',
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        const dbError =
            error instanceof Error ? error.message : 'Unknown database error';
        throw new Error(
            `Gagal mengambil log aktivitas dari database. Penyebab: ${dbError}. Pastikan tabel 'activity_log' ada dan memiliki skema yang benar.`,
        );
    }
}
