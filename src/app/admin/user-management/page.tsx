'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { UsersTable } from '@/components/admin/UsersTable';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { UpdateUserStatusDialog } from '@/components/admin/UpdateUserStatusDialog';
import { ChangePasswordDialog } from '@/components/admin/ChangePasswordDialog';
import { ChangeUsernameDialog } from '@/components/admin/ChangeUsernameDialog';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';
import type {
    User,
    CreateUserFormData,
    UserStatus,
    ChangePasswordFormData,
    ChangeUsernameFormData,
} from '@/lib/types';
import {
    PlusCircle,
    Users,
    Loader2,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUserAction } from '@/logic/user';
import {
    fetchUsersAction,
    createUserAction,
    updateUserStatusAction,
    changeUserPasswordAction,
    changeUsernameAction, // New import
    deleteUserAction,
} from '@/logic/user';

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userToUpdateStatus, setUserToUpdateStatus] = useState<User | null>(
        null,
    );
    const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] =
        useState(false);
    const [userToChangePassword, setUserToChangePassword] =
        useState<User | null>(null);
    const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] =
        useState(false);
    const [userToChangeUsername, setUserToChangeUsername] =
        useState<User | null>(null); // New state
    const [isChangeUsernameDialogOpen, setIsChangeUsernameDialogOpen] =
        useState(false); // New state
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const mountedRef = useRef(true);

    const { toast } = useToast();

    const loadUsers = useCallback(async () => {
        if (!mountedRef.current) return;
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedUsers, adminUser] = await Promise.all([
                fetchUsersAction(),
                getCurrentUserAction(),
            ]);
            if (mountedRef.current) {
                setUsers(fetchedUsers);
                setCurrentUser(adminUser);
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Tidak dapat mengambil data pengguna.';
            if (mountedRef.current) {
                setError(errorMessage);
                toast({
                    title: 'Kesalahan Memuat Pengguna',
                    description: errorMessage,
                    variant: 'destructive',
                });
                setUsers([]);
                setCurrentUser(null);
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [toast]);

    useEffect(() => {
        mountedRef.current = true;
        loadUsers();
        return () => {
            mountedRef.current = false;
        };
    }, [loadUsers]);

    const handleCreateUser = async (
        formData: CreateUserFormData,
    ): Promise<{ success: boolean; error?: string }> => {
        const result = await createUserAction(formData);
        if ('error' in result) {
            toast({
                title: 'Gagal Membuat Pengguna',
                description: result.error,
                variant: 'destructive',
            });
            return { success: false, error: result.error };
        }
        toast({
            title: 'Pengguna Dibuat',
            description: `Pengguna "${result.username}" berhasil dibuat sebagai karyawan.`,
        });
        await loadUsers();
        return { success: true };
    };

    const handleOpenUpdateStatusDialog = (user: User) => {
        setUserToUpdateStatus(user);
        setIsUpdateStatusDialogOpen(true);
    };

    const handleUpdateUserStatus = async (
        userId: number,
        newStatus: UserStatus,
    ) => {
        const result = await updateUserStatusAction(userId, newStatus);
        if ('error' in result) {
            toast({
                title: 'Gagal Memperbarui Status',
                description: result.error,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Status Pengguna Diperbarui',
                description: `Status untuk "${result.username}" telah diperbarui menjadi "${result.status}".`,
            });
            await loadUsers();
        }
        if (mountedRef.current) {
            setIsUpdateStatusDialogOpen(false);
            setUserToUpdateStatus(null);
        }
    };

    const handleOpenChangeUsernameDialog = (user: User) => {
        setUserToChangeUsername(user);
        setIsChangeUsernameDialogOpen(true);
    };

    const handleChangeUsername = async (
        userId: number,
        formData: ChangeUsernameFormData,
    ) => {
        const result = await changeUsernameAction(userId, formData);
        if (result.success && result.user) {
            toast({
                title: 'Username Diubah',
                description: `Username berhasil diubah menjadi "${result.user.username}".`,
            });
            await loadUsers(); // Refresh the user list
        } else {
            toast({
                title: 'Gagal Mengubah Username',
                description: result.error,
                variant: 'destructive',
            });
        }
        if (mountedRef.current) {
            setIsChangeUsernameDialogOpen(false);
            setUserToChangeUsername(null);
        }
    };

    const handleOpenChangePasswordDialog = (user: User) => {
        setUserToChangePassword(user);
        setIsChangePasswordDialogOpen(true);
    };

    const handleChangePassword = async (
        userId: number,
        formData: ChangePasswordFormData,
    ) => {
        const result = await changeUserPasswordAction(userId, formData);
        if (result.success) {
            toast({
                title: 'Password Diubah',
                description: `Password untuk pengguna "${result.username}" berhasil diubah.`,
            });
        } else {
            toast({
                title: 'Gagal Mengubah Password',
                description: result.error,
                variant: 'destructive',
            });
        }
        if (mountedRef.current) {
            setIsChangePasswordDialogOpen(false);
            setUserToChangePassword(null);
        }
    };

    const handleOpenDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteUser = async (userId: number) => {
        const result = await deleteUserAction(userId);
        if (result.success) {
            toast({
                title: 'Pengguna Dihapus',
                description: `Pengguna "${result.username}" berhasil dihapus.`,
            });
            await loadUsers();
        } else {
            toast({
                title: 'Gagal Menghapus Pengguna',
                description: result.error,
                variant: 'destructive',
            });
        }
        if (mountedRef.current) {
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="shadow-lg rounded-lg">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center text-3xl font-semibold text-primary">
                            <Users className="mr-4 h-8 w-8" />
                            Manajemen Pengguna
                        </CardTitle>
                        <CardDescription className="mt-1 text-muted-foreground">
                            Buat, lihat, dan kelola akun pengguna sistem. Akun
                            baru akan otomatis menjadi peran karyawan.
                        </CardDescription>
                    </div>
                    <CreateUserDialog onCreateUser={handleCreateUser}>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                            <PlusCircle className="mr-2 h-5 w-5" /> Buat
                            Karyawan Baru
                        </Button>
                    </CreateUserDialog>
                </CardHeader>
                <CardContent className="mt-6">
                    {isLoading && (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-3 text-muted-foreground">
                                Memuat data pengguna...
                            </p>
                        </div>
                    )}
                    {!isLoading && error && (
                        <div className="flex flex-col items-center justify-center py-10 text-destructive bg-destructive/10 p-4 rounded-md">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p className="font-semibold">Gagal Memuat Data</p>
                            <p className="text-sm">{error}</p>
                            <Button
                                variant="outline"
                                onClick={loadUsers}
                                className="mt-4"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
                            </Button>
                        </div>
                    )}
                    {!isLoading && !error && (
                        <UsersTable
                            users={users}
                            currentUser={currentUser}
                            onUpdateStatus={handleOpenUpdateStatusDialog}
                            onChangeUsername={handleOpenChangeUsernameDialog}
                            onChangePassword={handleOpenChangePasswordDialog}
                            onDeleteUser={handleOpenDeleteDialog}
                        />
                    )}
                </CardContent>
            </Card>

            {userToUpdateStatus && (
                <UpdateUserStatusDialog
                    user={userToUpdateStatus}
                    open={isUpdateStatusDialogOpen}
                    onOpenChange={setIsUpdateStatusDialogOpen}
                    onUpdateStatus={handleUpdateUserStatus}
                />
            )}

            {userToChangeUsername && (
                <ChangeUsernameDialog
                    user={userToChangeUsername}
                    open={isChangeUsernameDialogOpen}
                    onOpenChange={setIsChangeUsernameDialogOpen}
                    onChangeUsername={handleChangeUsername}
                />
            )}

            {userToChangePassword && (
                <ChangePasswordDialog
                    user={userToChangePassword}
                    open={isChangePasswordDialogOpen}
                    onOpenChange={setIsChangePasswordDialogOpen}
                    onChangePassword={handleChangePassword}
                />
            )}

            {userToDelete && (
                <DeleteUserDialog
                    user={userToDelete}
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onConfirmDelete={handleDeleteUser}
                />
            )}
        </div>
    );
}
