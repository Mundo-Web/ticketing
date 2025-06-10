import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plus, Edit, Trash2, ChevronDown, MoreHorizontal, User,
    LayoutGrid, Table as TableIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ColumnDef, useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Technical {
    id: number;
    name: string;
    email: string;
    photo?: string;
    phone: string;
    shift: 'morning' | 'afternoon' | 'night';
    status: boolean;
    is_default: boolean;
    created_at: string;
}

export default function Index({ technicals }: { technicals: any }) {
    const { auth } = usePage().props as any;
    const userRoles = auth?.user?.roles || [];
    const isSuperAdmin = Array.isArray(userRoles) ? userRoles.includes('super-admin') : false;
    
    console.log('User roles:', userRoles); // Debug para verificar estructura
    
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [open, setOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedTechnical, setSelectedTechnical] = useState<Technical | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [gridColumns, setGridColumns] = useState<number>(4);
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        email: '',
        phone: '',
        shift: 'morning' as 'morning' | 'afternoon' | 'night',
        photo: null as File | null,
    });

    // Columnas para tabla
    const columns: ColumnDef<Technical>[] = [
        {
            accessorKey: "photo",
            header: "Photo",
            cell: ({ row }) => (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                    {row.original.photo ? (
                        <img src={`/storage/${row.original.photo}`}
                            alt={row.original.name}
                            className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "phone",
            header: "Phone",
        },
        {
            accessorKey: "shift",
            header: "Shift",
            cell: ({ row }) => <span className="capitalize">{row.original.shift}</span>,
        },
        {
            accessorKey: "is_default",
            header: "Default",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {isSuperAdmin ? (
                        <Button
                            variant={row.original.is_default ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleDefaultTechnical(row.original)}
                            className="h-6 px-2 text-xs"
                        >
                            {row.original.is_default ? "Tech Chief" : "Set Tech Chief"}
                        </Button>
                    ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                            row.original.is_default 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            {row.original.is_default ? "Tech Chief" : "Technical"}
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={row.original.status}
                        onCheckedChange={() => toggleStatus(row.original)}
                        disabled={isUpdatingStatus === row.original.id}
                    />
                    <StatusBadge status={row.original.status ? "active" : "inactive"} />
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(row.original)}>
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const table = useReactTable({
        data: technicals.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Vista de cuadrícula
    const GridView = ({ technicals, gridColumns }: { technicals: Technical[], gridColumns: number }) => {
        const getGridClass = () => {
            switch (gridColumns) {
                case 2: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
                case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
                case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
                case 5: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5';
                case 6: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6';
                default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
            }
        };

        return (
            <div className={`grid ${getGridClass()} gap-6`}>
                {technicals.map((technical) => (
                    <div key={technical.id} className="bg-card group p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border relative">
                        {/* Imagen cuadrada arriba */}
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 border">
                            {technical.photo ? (
                                <img
                                    src={`/storage/${technical.photo}`}
                                    alt={technical.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <User className="w-16 h-16 text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Contenido debajo de la imagen */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-xl truncate">{technical.name}</h3>
                                <Switch
                                    checked={technical.status}
                                    onCheckedChange={() => toggleStatus(technical)}
                                    disabled={isUpdatingStatus === technical.id}
                                    className="scale-90 data-[state=checked]:bg-green-500"
                                />
                            </div>

                            <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground truncate">{technical.email}</p>
                                <p className="font-medium">{technical.phone}</p>
                                <div className="flex items-center gap-2">
                                    <span className="capitalize text-primary bg-primary/10 px-2 py-1 rounded-md">
                                        {technical.shift}
                                    </span>
                                    {technical.is_default && (
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                                            Tech Chief
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Botones en la parte inferior */}
                            <div className="flex justify-between items-center mt-4">
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleEdit(technical)}
                                        variant="default"
                                        size="sm"
                                        className="gap-2 px-4"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(technical)}
                                        variant="destructive"
                                        size="sm"
                                        className="gap-2 px-4"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                {isSuperAdmin && (
                                    <Button
                                        onClick={() => toggleDefaultTechnical(technical)}
                                        variant={technical.is_default ? "default" : "outline"}
                                        size="sm"
                                        className="text-xs"
                                    >
                                        {technical.is_default ? "Tech Chief" : "Set Tech Chief"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    };

    const toggleStatus = async (technical: Technical) => {
        setIsUpdatingStatus(technical.id);
        try {
            await router.put(route('technicals.update-status', technical.id), {}, {
                preserveScroll: true,
                onSuccess: () => toast.success('Status updated'),
                onError: () => toast.error('Error updating status')
            });
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const toggleDefaultTechnical = async (technical: Technical) => {
        if (!isSuperAdmin) {
            toast.error('Only super-admin can set default technical');
            return;
        }

        try {
            await router.put(route('technicals.set-default', technical.id), {}, {
                preserveScroll: true,
                onSuccess: () => toast.success('Technical Chief updated'),
                onError: () => toast.error('Error updating Technical Chief')
            });
        } catch (error) {
            toast.error('Connection error');
        }
    };

    const handleEdit = (technical: Technical) => {
        setData({
            ...technical,
            photo: null,
        });
        setSelectedTechnical(technical);
        setOpen(true);
    };

    const handleDelete = (technical: Technical) => {
        setSelectedTechnical(technical);
        setDeleteOpen(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();

        if (data.id) {
            formData.append('_method', 'PUT');
            Object.entries(data).forEach(([key, value]) => {
                if (value !== null) formData.append(key, value);
            });
            router.post(route('technicals.update', data.id), formData, {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                    toast.success('Technical updated');
                },
                onError: (errors) => {
                    Object.values(errors).forEach(error => toast.error(error));
                }
            });
        } else {
            post(route('technicals.store'), {
                data: formData,
                forceFormData: true,
                onSuccess: () => {
                    reset();
                    setOpen(false);
                    toast.success('Technical created');
                },
                onError: (errors) => {
                    Object.values(errors).forEach(error => toast.error(error));
                }
            });
        }
    };

    const confirmDelete = () => {
        if (!selectedTechnical) return;
        destroy(route('technicals.destroy', selectedTechnical.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                toast.success('Technical deleted');
            },
            onError: () => {
                toast.error('Delete failed');
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Technicals" />
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-1 rounded flex">
                            <Button variant="ghost" onClick={() => setViewMode('grid')}
                                className={viewMode === 'grid' ? 'bg-white shadow' : ''}>
                                <LayoutGrid className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" onClick={() => setViewMode('table')}
                                className={viewMode === 'table' ? 'bg-white shadow' : ''}>
                                <TableIcon className="w-5 h-5" />
                            </Button>
                        </div>
                        {viewMode === 'grid' && (
                            <select
                                value={gridColumns}
                                onChange={(e) => setGridColumns(Number(e.target.value))}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                {[2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>{num} Cards</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Technical
                    </Button>
                </div>

                {viewMode === 'grid' ? (
                    <GridView technicals={technicals.data} gridColumns={gridColumns} />
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <TableHead key={header.id}>
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map(row => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Create/Edit Modal */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedTechnical ? 'Edit Technical' : 'New Technical'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitForm} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className=" space-y-2">
                                    <Label>Photo</Label>
                                    <div className="mt-2 group relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed bg-muted/50">
                                        <input
                                            type="file"
                                            onChange={e => setData('photo', e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="photo-upload"
                                        />
                                        <label
                                            htmlFor="photo-upload"
                                            className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                            {data.photo ? (
                                                <img
                                                    src={URL.createObjectURL(data.photo)}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : selectedTechnical?.photo ? (
                                                <img
                                                    src={`/storage/${selectedTechnical.photo}`}
                                                    alt="Current"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-center space-y-2">
                                                    <User className="w-12 h-12 mx-auto text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Click to upload photo
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-2'>
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            required
                                            className='h-11 mt-2'
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            required
                                            className='h-11 mt-2'
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            required
                                            className='h-11 mt-2'
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Shift</Label>
                                        <Select
                                            value={data.shift}
                                            onValueChange={value => setData('shift', value as any)}
                                        >
                                            <SelectTrigger className='h-11 mt-2' >
                                                <SelectValue placeholder="Select shift" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="morning">Morning</SelectItem>
                                                <SelectItem value="afternoon">Afternoon</SelectItem>
                                                <SelectItem value="night">Night</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Delete</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {selectedTechnical?.name}?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
        {status === 'active' ? 'Active' : 'Inactive'}
    </span>
);