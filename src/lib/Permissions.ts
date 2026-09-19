import { UserRole } from '@/models/UserModel';

export type Permission =
    | 'ITEM_VIEW'
    | 'ITEM_CREATE'
    | 'ITEM_UPDATE'
    | 'LOCATION_VIEW'
    | 'LOCATION_CREATE'
    | 'LOCATION_UPDATE'
    | 'CATEGORY_VIEW'
    | 'CATEGORY_CREATE'
    | 'CATEGORY_UPDATE'
    | 'UNIT_VIEW'
    | 'UNIT_CREATE'
    | 'UNIT_UPDATE'
    | 'WAREHOUSE_VIEW'
    | 'WAREHOUSE_CREATE'
    | 'WAREHOUSE_UPDATE'
    | 'USER_VIEW'
    | 'USER_CREATE'
    | 'USER_UPDATE'
    | 'INVENTORY_VIEW'
    | 'MOVEMENT_VIEW'
    | 'RECEIVE_CREATE'
    | 'ISSUE_CREATE'
    | 'TRANSFER_CREATE'
    | 'RETURN_CREATE'
    | 'ADJUSTMENT_CREATE'
    | 'AUDIT_VIEW';

const ALL_PERMISSIONS: Permission[] = [
    'ITEM_VIEW',
    'ITEM_CREATE',
    'ITEM_UPDATE',
    'LOCATION_VIEW',
    'LOCATION_CREATE',
    'LOCATION_UPDATE',
    'CATEGORY_VIEW',
    'CATEGORY_CREATE',
    'CATEGORY_UPDATE',
    'UNIT_VIEW',
    'UNIT_CREATE',
    'UNIT_UPDATE',
    'WAREHOUSE_VIEW',
    'WAREHOUSE_CREATE',
    'WAREHOUSE_UPDATE',
    'USER_VIEW',
    'USER_CREATE',
    'USER_UPDATE',
    'INVENTORY_VIEW',
    'MOVEMENT_VIEW',
    'RECEIVE_CREATE',
    'ISSUE_CREATE',
    'TRANSFER_CREATE',
    'RETURN_CREATE',
    'ADJUSTMENT_CREATE',
    'AUDIT_VIEW',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    ADMIN: ALL_PERMISSIONS,
    SUPERVISOR: [
        'ITEM_VIEW',
        'LOCATION_VIEW',
        'CATEGORY_VIEW',
        'UNIT_VIEW',
        'WAREHOUSE_VIEW',
        'INVENTORY_VIEW',
        'MOVEMENT_VIEW',
        'AUDIT_VIEW',
    ],
    PETUGAS: [
        'ITEM_VIEW',
        'LOCATION_VIEW',
        'CATEGORY_VIEW',
        'UNIT_VIEW',
        'WAREHOUSE_VIEW',
        'INVENTORY_VIEW',
        'MOVEMENT_VIEW',
        'RECEIVE_CREATE',
        'ISSUE_CREATE',
        'TRANSFER_CREATE',
        'RETURN_CREATE',
        'ADJUSTMENT_CREATE',
    ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    return permissions.includes(permission);
}
