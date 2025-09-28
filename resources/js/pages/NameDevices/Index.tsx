import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    Edit, Search, Image, CheckCircle, XCircle, RefreshCw, Upload, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NameDevice {
    id: number;
    name: string;
    status: string;
    image?: string;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    [key: string]: unknown;
    nameDevices: {
        data: NameDevice[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
}

export default function Index() {
    const { nameDevices, filters } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [deviceToEdit, setDeviceToEdit] = useState<NameDevice | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        status: 'active',
        image: null as File | null,
        _method: 'PUT',
    });

    const handleSearch = () => {
        router.get(route('name-devices.index'), {
            search: searchTerm
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearchTerm('');
        router.get(route('name-devices.index'));
    };

    const handleEdit = (device: NameDevice) => {
        setDeviceToEdit(device);
        setData({
            name: device.name,
            status: device.status || 'active',
            image: null,
            _method: 'PUT',
        });
        setImagePreview(device.image ? `/storage/${device.image}` : null);
        setShowEditDialog(true);
    };

    const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handleImageFile(file);
            }
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    };

    const handleImageFile = (file: File) => {
        setData('image', file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setData('image', null);
        setImagePreview(deviceToEdit?.image ? `/storage/${deviceToEdit.image}` : null);
        // Clear the file input
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceToEdit) return;
        
        post(route('name-devices.update', deviceToEdit.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Device name updated successfully');
                setShowEditDialog(false);
                reset();
                setDeviceToEdit(null);
                setImagePreview(null);
            },
            onError: () => {
                toast.error('Error updating device name');
            }
        });
    };

    const closeDialog = () => {
        setShowEditDialog(false);
        setDeviceToEdit(null);
        setImagePreview(null);
        reset();
    };

    const columns: ColumnDef<NameDevice>[] = [
        {
            accessorKey: 'image',
            header: 'Image',
            cell: ({ row }) => {
                const device = row.original;
                return (
                    <div className="flex items-center justify-center">
                        {device.image ? (
                            <img
                                src={`/storage/${device.image}`}
                                alt={device.name}
                                className="w-12 h-12 rounded-lg object-cover border"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Image className="w-6 h-6 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => {
                const device = row.original;
                return (
                    <div className="font-medium">
                        {device.name}
                    </div>
                );
            },
        },
   
        {
            accessorKey: 'created_at',
            header: 'Created',
            cell: ({ row }) => {
                const device = row.original;
                return new Date(device.created_at).toLocaleDateString();
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const device = row.original;
                return (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(device)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                );
            },
        },
    ];

    const table = useReactTable({
        data: nameDevices.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'Device Names', href: route('name-devices.index') }]}>
            <Head title="Device Names" />

            <div className="space-y-6 mx-4">
             
            
                {/* Filters */}
                    <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search devices..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSearch}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
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
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                                No device names found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {nameDevices.last_page > 1 && (
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing page {nameDevices.current_page} of {nameDevices.last_page}
                                </div>
                                <div className="flex gap-2">
                                    {nameDevices.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            onClick={() => router.get(route('name-devices.index', { page: nameDevices.current_page - 1 }))}
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {nameDevices.current_page < nameDevices.last_page && (
                                        <Button
                                            variant="outline"
                                            onClick={() => router.get(route('name-devices.index', { page: nameDevices.current_page + 1 }))}
                                        >
                                            Next
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Device Name</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Form Fields */}
                            <div className="space-y-4">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter device name"
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-destructive">{errors.status}</p>
                                    )}
                                </div>
                            </div>

                            {/* Image Dropzone */}
                            <div className="space-y-2">
                                <Label>Image</Label>
                                <div
                                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                                        isDragging
                                            ? 'border-blue-400 bg-blue-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    onDrop={handleImageDrop}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onClick={() => document.getElementById('image')?.click()}
                                >
                                    {/* Hidden file input - covers entire dropzone */}
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        style={{ zIndex: -1 }}
                                    />
                                    
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-w-full h-32 object-cover rounded-lg mx-auto"
                                            />
                                            {data.image && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 right-2 h-6 w-6 p-0 z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeImage();
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <div className="absolute inset-0  hover:bg-opacity-10 transition-colors rounded-lg flex items-center justify-center pointer-events-none">
                                                <p className="text-white text-sm opacity-0 hover:opacity-100 transition-opacity">
                                                    Click to change image
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pointer-events-none">
                                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-600 mb-1">Drop image here or click to select</p>
                                            <p className="text-xs text-gray-400">PNG, JPG, GIF up to 2MB</p>
                                        </div>
                                    )}
                                </div>
                                {errors.image && (
                                    <p className="text-sm text-destructive">{errors.image}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}