'use client';

import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { User, UserStatus, UserRole } from '@/lib/types';
import {
    ArrowUpDown,
    Search,
    KeyRound,
    MoreHorizontal,
    Trash2,
    ShieldAlert,
    ShieldCheck,
    UserCog,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { id as IndonesianLocale } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UsersTableProps {
    users: User[];
    currentUser: User | null;
    onUpdateStatus: (user: User) => void;
    onChangeUsername: (user: User) => void;
    onChangePassword: (user: User) => void;
    onDeleteUser: (user: User) => void;
}

type SortKey = keyof User | null;

export function UsersTable({
    users,
    currentUser,
    onUpdateStatus,
    onChangeUsername,
    onChangePassword,
    onDeleteUser,
}: UsersTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('username');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const filteredAndSortedUsers = useMemo(() => {
        let sortedUsers = [...users];
        if (sortKey) {
            sortedUsers.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];

                if (valA === null || valA === undefined)
                    return sortOrder === 'asc' ? 1 : -1;
                if (valB === null || valB === undefined)
                    return sortOrder === 'asc' ? -1 : 1;

                if (sortKey === 'created_at' || sortKey === 'updated_at') {
                    return sortOrder === 'asc'
                        ? new Date(valA as string).getTime() -
                              new Date(valB as string).getTime()
                        : new Date(valB as string).getTime() -
                              new Date(valA as string).getTime();
                }
                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sortOrder === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                if (typeof valA === 'number' && typeof valB === 'number') {
                    // For ID
                    return sortOrder === 'asc' ? valA - valB : valB - valA;
                }
                return 0;
            });
        }

        if (searchTerm) {
            return sortedUsers.filter(
                (user) =>
                    user.username
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    user.role
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    user.status
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            );
        }
        return sortedUsers;
    }, [users, sortKey, sortOrder, searchTerm]);

    const renderSortIcon = (key: SortKey) => {
        if (sortKey !== key)
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        return sortOrder === 'asc' ? (
            <ArrowUpDown className="ml-2 h-4 w-4 text-primary" />
        ) : (
            <ArrowUpDown
                className="ml-2 h-4 w-4 text-primary"
                style={{ transform: 'scaleY(-1)' }}
            />
        );
    };

    const getStatusBadgeVariant = (status: UserStatus) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'suspended':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getRoleBadgeVariant = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return 'secondary';
            case 'employee':
                return 'outline';
            default:
                return 'outline';
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Cari pengguna..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border focus:ring-primary w-full"
                />
            </div>

            {filteredAndSortedUsers.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground">
                    <p className="text-lg">
                        {searchTerm
                            ? 'Tidak ada pengguna yang cocok.'
                            : 'Belum ada pengguna terdaftar.'}
                    </p>
                    {searchTerm && (
                        <p>Coba sesuaikan istilah pencarian Anda.</p>
                    )}
                    {!searchTerm && <p>Buat pengguna baru untuk memulai.</p>}
                </div>
            ) : (
                <div className="overflow-x-auto border rounded-lg">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted transition-colors w-[25%]"
                                    onClick={() => handleSort('username')}
                                >
                                    <div className="flex items-center">
                                        Username {renderSortIcon('username')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted transition-colors w-[15%]"
                                    onClick={() => handleSort('role')}
                                >
                                    <div className="flex items-center">
                                        Peran {renderSortIcon('role')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted transition-colors w-[15%]"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status {renderSortIcon('status')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted transition-colors w-[20%]"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center">
                                        Tgl Dibuat{' '}
                                        {renderSortIcon('created_at')}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right w-[25%]">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="hover:bg-muted/20 transition-colors"
                                >
                                    <TableCell className="font-medium text-foreground py-3">
                                        {user.username}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Badge
                                            variant={getRoleBadgeVariant(
                                                user.role,
                                            )}
                                            className="text-xs capitalize"
                                        >
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Badge
                                            variant={getStatusBadgeVariant(
                                                user.status,
                                            )}
                                            className="text-xs capitalize"
                                        >
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-xs">
                                        {format(
                                            new Date(user.created_at),
                                            'dd MMM yyyy, HH:mm',
                                            { locale: IndonesianLocale },
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <span className="sr-only">
                                                        Buka menu
                                                    </span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="bg-card"
                                            >
                                                <DropdownMenuLabel>
                                                    Aksi untuk {user.username}
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onUpdateStatus(user)
                                                    }
                                                    disabled={
                                                        user.role === 'admin'
                                                    }
                                                >
                                                    {user.status ===
                                                    'active' ? (
                                                        <ShieldAlert className="mr-2 h-4 w-4 text-destructive" />
                                                    ) : (
                                                        <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
                                                    )}
                                                    {user.status === 'active'
                                                        ? 'Tangguhkan'
                                                        : 'Aktifkan'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onChangeUsername(user)
                                                    }
                                                >
                                                    <UserCog className="mr-2 h-4 w-4" />
                                                    Ganti Username
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onChangePassword(user)
                                                    }
                                                >
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    Ganti Password
                                                </DropdownMenuItem>
                                                {currentUser &&
                                                    currentUser.id !==
                                                        user.id && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    onDeleteUser(
                                                                        user,
                                                                    )
                                                                }
                                                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Hapus Pengguna
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
