import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { LayoutGrid, Table, Plus, Edit, Trash2, ChevronRight, Laptop, User, UploadCloud, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ModalDispositivos from './ModalDispositivos';

import Select, { components } from 'react-select';
import { BuildingCombobox } from './ComboBox';

type Apartment = {
    id: number;
    name: string;
    ubicacion: string;
    share: boolean;
    status: boolean;
    created_at: string;
    tenant?: Tenant;
    devices?: Device[];
};

type Tenant = {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
    photo?: string;
};

type Device = {
    id: number;
    name: string;
};

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    apartments: {
        data: Apartment[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
    brands: { id: number; name: string }[];
    models: { id: number; name: string }[];
    systems: { id: number; name: string }[];
    deviceNames: { id: number; name: string }[];
}

export default function Index({ apartments, brands, models, systems, deviceNames }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentApartment, setCurrentApartment] = useState<Apartment | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
    const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
    const [showDevicesModal, setShowDevicesModal] = useState(false);

    const { building, all_buildings } = usePage().props as { building: { id: number, name: string, image: string }, all_buildings: { id: number, name: string, image: string }[] };

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        ubicacion: '',
        share: false,
        tenant: {
            name: '',
            email: '',
            phone: '',
            photo: null as File | null,
        }
    });

    const toggleStatus = async (apartment: Apartment) => {
        setIsUpdatingStatus(apartment.id);
        try {
            await router.put(
                route('apartments.update-status', apartment.id),
                { status: !apartment.status },
                {
                    preserveScroll: true,
                    onSuccess: () => toast.success('Status updated successfully'),
                }
            );
        } catch (error) {
            toast.error('Connection error');
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();

        formData.append('name', data.name);
        formData.append('ubicacion', data.ubicacion);
        formData.append('share', data.share.toString());
        if (data.tenant.name) {
            formData.append('tenant[name]', data.tenant.name);
            formData.append('tenant[email]', data.tenant.email);
            formData.append('tenant[phone]', data.tenant.phone);
            if (data.tenant.photo) {
                formData.append('tenant[photo]', data.tenant.photo);
            }
        }

        post(route('buildings.apartments.store', building), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                toast.success('Apartment created successfully');
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error));
            }
        });
    };

    const handleEdit = (apartment: Apartment) => {
        setData({
            id: apartment.id,
            name: apartment.name,
            ubicacion: apartment.ubicacion,
            share: apartment.share,
            tenant: {
                name: apartment.tenant?.name || '',
                email: apartment.tenant?.email || '',
                phone: apartment.tenant?.phone || '',
                photo: null, // Mantenemos null pero usamos apartment.tenant?.photo para la preview
            }
        });
        setCurrentApartment(apartment);
        setShowCreateModal(true);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.id) return;

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        formData.append('ubicacion', data.ubicacion);

        if (data.tenant.name) {
            formData.append('tenant[name]', data.tenant.name);
            formData.append('tenant[email]', data.tenant.email);
            formData.append('tenant[phone]', data.tenant.phone);
            if (data.tenant.photo) {
                formData.append('tenant[photo]', data.tenant.photo);
            }
        }

        router.post(route('apartments.update', data.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                setCurrentApartment(null);
                toast.success('Apartment updated successfully');
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error));
            }
        });
    };

    const handleDelete = (apartment: Apartment) => {
        setCurrentApartment(apartment);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!currentApartment) return;

        destroy(route('apartments.destroy', currentApartment.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setCurrentApartment(null);
                toast.success('Apartment deleted successfully');
            },
            onError: () => {
                toast.error('Error deleting apartment');
            }
        });
    };

    const handleShowDevices = (apartment: Apartment) => {
        setSelectedApartment(apartment);
        setSelectedDevices(apartment.devices || []);
        setShowDevicesModal(true);
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Apartments" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header Section 
                <Card className='w-full border-none py-0 shadow-none'>
                    <CardContent className="p-0">
                        <div className='flex gap-4 items-center'>
                            <img
                                src={`/storage/${building.image}`}
                                alt={building.name}
                                className="object-cover rounded-full w-15 h-15 border-2 border-primary p-1"
                            />
                            <h2 className='text-xl font-medium'>{building.name}</h2>
                        </div>
                    </CardContent>
                </Card>*/}




                <Card className='w-full border-none py-0 shadow-none'>
                    <CardContent className="p-0">
                        <BuildingCombobox
                            buildings={all_buildings}
                            selectedId={building.id}
                            onChange={(id) => router.visit(route('buildings.apartments', id))}
                        />


                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="bg-gray-100 p-1 rounded flex">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                        >
                            <LayoutGrid className={`w-5 h-5 ${viewMode === 'grid' ? 'text-primary' : 'text-gray-600'}`} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow' : ''}`}
                        >
                            <Table className={`w-5 h-5 ${viewMode === 'table' ? 'text-primary' : 'text-gray-600'}`} />
                        </button>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => {
                                reset();
                                setCurrentApartment(null);
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:block">New Apartment</span>
                        </Button>
                    </div>
                </div>

                {/* Create/Edit Apartment Modal */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="w-full max-w-none sm:max-w-2xl mx-0 sm:mx-4 p-0 overflow-hidden">
                        <div className="overflow-y-auto px-6 py-8" style={{ maxHeight: '90vh' }}>
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl">
                                    {currentApartment ? 'Edit Apartment' : 'Create New Apartment'}
                                </DialogTitle>
                                <DialogDescription>
                                    {currentApartment ? 'Update the apartment information' : 'Fill in the required fields to create a new apartment'}
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="apartment" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="apartment">Apartment</TabsTrigger>
                                    <TabsTrigger value="tenant">Tenant</TabsTrigger>
                                </TabsList>

                                <form onSubmit={currentApartment ? handleUpdateSubmit : handleCreateSubmit}>
                                    <TabsContent value="apartment" className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">
                                                Apartment Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className={`h-11 mt-2 ${errors.name ? 'border-red-500' : ''}`}
                                                required

                                            />
                                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ubicacion">Location</Label>
                                            <Textarea
                                                id="ubicacion"
                                                value={data.ubicacion}
                                                onChange={(e) => setData('ubicacion', e.target.value)}
                                                rows={3}
                                                className='mt-2'
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="share"
                                                    checked={data.share}
                                                    onCheckedChange={(checked) => setData('share', checked)}
                                                />
                                                <Label htmlFor="share">Share</Label>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="tenant" className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                            {/* Columna izquierda - Foto */}
                                            <div className="md:col-span-2 space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="tenant-photo">Photo</Label>
                                                    <div className={`mt-2 group relative w-full aspect-square rounded-lg overflow-hidden transition-all duration-300 
          ${errors['tenant.photo'] ? 'ring-2 ring-destructive' : 'hover:ring-2 hover:ring-ring'} 
          bg-muted/50`}>
                                                        <input
                                                            id="tenant-photo-upload"
                                                            type="file"
                                                            accept="image/png, image/jpeg, image/jpg"
                                                            onChange={(e) => setData('tenant', {
                                                                ...data.tenant,
                                                                photo: e.target.files?.[0] || null
                                                            })}
                                                            className="hidden"
                                                        />
                                                        <label
                                                            htmlFor="tenant-photo-upload"
                                                            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                                                        >
                                                            {data.tenant.photo || currentApartment?.tenant?.photo ? (
                                                                <div className="relative w-full h-full group">
                                                                    <img
                                                                        src={data.tenant.photo
                                                                            ? URL.createObjectURL(data.tenant.photo)
                                                                            : `/storage/${currentApartment?.tenant?.photo}`}
                                                                        alt="Tenant preview"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                                                        <UploadCloud className="w-8 h-8 text-white" />
                                                                        <p className="text-sm text-white font-medium">Click to change photo</p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                                                    <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                                                        <User className="w-6 h-6 text-muted-foreground" />
                                                                    </div>
                                                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                                                        Drag & drop or click to upload
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        PNG, JPG or JPEG (max. 2MB)
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </label>
                                                    </div>
                                                    {errors['tenant.photo'] && (
                                                        <p className="text-sm text-destructive">{errors['tenant.photo']}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Columna derecha - Campos del formulario */}
                                            <div className="md:col-span-3 space-y-4">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="tenant-name">Tenant Name</Label>
                                                        <Input
                                                            id="tenant-name"
                                                            value={data.tenant.name}
                                                            onChange={(e) => setData('tenant', {
                                                                ...data.tenant,
                                                                name: e.target.value
                                                            })}
                                                            className="w-full h-11 mt-2"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="tenant-email">Email</Label>
                                                            <Input
                                                                id="tenant-email"
                                                                type="email"
                                                                value={data.tenant.email}
                                                                onChange={(e) => setData('tenant', {
                                                                    ...data.tenant,
                                                                    email: e.target.value
                                                                })}
                                                                className="w-full h-11 mt-2"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="tenant-phone">Phone</Label>
                                                            <Input
                                                                id="tenant-phone"
                                                                value={data.tenant.phone}
                                                                onChange={(e) => setData('tenant', {
                                                                    ...data.tenant,
                                                                    phone: e.target.value
                                                                })}
                                                                className="w-full h-11 mt-2"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <div className="flex justify-end gap-4 pt-8 pb-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-12"
                                            onClick={() => setShowCreateModal(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="h-12"
                                        >
                                            {processing
                                                ? (currentApartment ? 'Updating...' : 'Creating...')
                                                : (currentApartment ? 'Update Apartment' : 'Create Apartment')}
                                        </Button>
                                    </div>
                                </form>
                            </Tabs>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the apartment <strong>{currentApartment?.name}</strong>?
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Devices Modal */}
                <Dialog open={showDevicesModal} onOpenChange={setShowDevicesModal}>
                    <DialogContent className="min-w-3xl">
                        <ModalDispositivos
                            apartmentName={selectedApartment?.name || ''}
                            devices={selectedDevices}
                            brands={brands}
                            models={models}
                            systems={systems}
                            deviceNames={deviceNames}
                            apartmentId={selectedApartment?.id || 0}
                        />
                    </DialogContent>
                </Dialog>

                {/* Content Section */}
                {apartments.data.length === 0 ? (
                    <EmptyState onAddNew={() => setShowCreateModal(true)} />
                ) : viewMode === 'grid' ? (
                    <GridView
                        apartments={apartments.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={toggleStatus}
                        isUpdatingStatus={isUpdatingStatus}
                        handleShowDevices={handleShowDevices}
                    />
                ) : (
                    <TableView
                        apartments={apartments.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={toggleStatus}
                        isUpdatingStatus={isUpdatingStatus}
                        handleShowDevices={handleShowDevices}
                    />
                )}

                {/* Pagination */}
                {apartments.data.length > 0 && (
                    <Pagination links={apartments.links} meta={apartments.meta} />
                )}
            </div>
        </AppLayout>
    );
}

const GridView = ({
    apartments,
    onEdit,
    onDelete,
    onToggleStatus,
    isUpdatingStatus,
    handleShowDevices
}: {
    apartments: Apartment[];
    onEdit: (apartment: Apartment) => void;
    onDelete: (apartment: Apartment) => void;
    onToggleStatus: (apartment: Apartment) => void;
    isUpdatingStatus: number | null;
    handleShowDevices: (apartment: Apartment) => void;
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {apartments.map((apartment) => (
            <div key={apartment.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border relative">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xl truncate">{apartment.name}</h3>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={apartment.status}
                                onCheckedChange={() => onToggleStatus(apartment)}
                                className="data-[state=checked]:bg-green-500"
                                disabled={isUpdatingStatus === apartment.id}
                            />
                            <StatusBadge status={apartment.status ? "active" : "inactive"} />
                        </div>
                    </div>

                    {apartment.ubicacion && (
                        <p className="text-sm text-gray-600 line-clamp-2">{apartment.ubicacion}</p>
                    )}

                    {apartment.tenant && (
                        <div className="text-sm text-gray-500">
                            <p className="truncate">Tenant: {apartment.tenant.name}</p>
                            <p className="truncate">{apartment.tenant.email}</p>
                        </div>
                    )}

                    <div className="text-xs text-gray-400 mt-2">
                        Created: {new Date(apartment.created_at).toLocaleDateString()}
                    </div>

                    <div className='flex gap-4 mt-4'>
                        <Button
                            onClick={() => handleShowDevices(apartment)}
                            className="flex py-2 rounded-lg items-center gap-2 transition-all w-6/12 bg-primary text-primary-foreground"
                        >
                            {apartment.devices?.length || 0}
                            <span className="hidden sm:block">Devices</span>
                            <ChevronRight className="w-5 h-5" />
                        </Button>

                        <div className="flex gap-4 w-6/12 justify-end items-center">
                            <Button
                                onClick={() => onEdit(apartment)}
                                variant="secondary"
                                size="icon"
                            >
                                <Edit className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={() => onDelete(apartment)}
                                variant="destructive"
                                size="icon"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const TableView = ({
    apartments,
    onEdit,
    onDelete,
    onToggleStatus,
    isUpdatingStatus,
    handleShowDevices
}: {
    apartments: Apartment[];
    onEdit: (apartment: Apartment) => void;
    onDelete: (apartment: Apartment) => void;
    onToggleStatus: (apartment: Apartment) => void;
    isUpdatingStatus: number | null;
    handleShowDevices: (apartment: Apartment) => void;
}) => (
    <div className="rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50">
                <tr>
                    <TableHeader>Apartment</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Tenant</TableHeader>
                    <TableHeader>Devices</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {apartments.map((apartment) => (
                    <tr key={apartment.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{apartment.name}</TableCell>

                        <TableCell>
                            <p className="truncate max-w-[200px]">{apartment.ubicacion || '-'}</p>
                        </TableCell>

                        <TableCell>
                            {apartment.tenant ? (
                                <div className='flex gap-2 items-center'> <img src={`/storage/${apartment.tenant.photo}`} className='h-12 w-12 object-cover rounded-full border-2 border-white' /> <div className="text-sm">
                                    <p className="truncate">{apartment.tenant.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{apartment.tenant.email}</p>
                                </div></div>

                            ) : '-'}
                        </TableCell>

                        <TableCell>
                            <Button
                                onClick={() => handleShowDevices(apartment)}
                                variant="outline"
                                className="gap-2"
                            >
                                <Laptop className="w-4 h-4" />
                                {apartment.devices?.length || 0}
                            </Button>
                        </TableCell>

                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={apartment.status}
                                    onCheckedChange={() => onToggleStatus(apartment)}
                                    className="data-[state=checked]:bg-green-500"
                                    disabled={isUpdatingStatus === apartment.id}
                                />
                                <StatusBadge status={apartment.status ? "active" : "inactive"} />
                            </div>
                        </TableCell>

                        <TableCell>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => onEdit(apartment)}
                                    variant="ghost"
                                    size="icon"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={() => onDelete(apartment)}
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
        {status === 'active' ? 'Active' : 'Inactive'}
    </span>
);

const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
    <div className="bg-background p-8 rounded-xl text-center border-2 border-dashed">
        <div className="text-primary mb-4 flex justify-center">
            <LayoutGrid className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-semibold text-primary mb-2">No apartments registered</h3>
        <p className="text-primary mb-4">Start by adding your first apartment</p>
        <Button
            onClick={onAddNew}
            className="inline-flex items-center gap-2"
        >
            <Plus className="w-5 h-5" />
            Create First Apartment
        </Button>
    </div>
);

const Pagination = ({ links, meta }: { links: PaginationLink[], meta: PaginationMeta }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-muted-foreground">
            Showing {meta.per_page * (meta.current_page - 1) + 1} -{' '}
            {Math.min(meta.per_page * meta.current_page, meta.total)} of {meta.total}
        </div>
        <div className="flex gap-1">
            {links.map((link, index) => (
                link.url && (
                    <Link
                        key={index}
                        href={link.url}
                        className={`px-3 py-1 rounded-lg ${link.active ? 'bg-primary text-primary-foreground' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                )
            ))}
        </div>
    </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{children}</th>
);

const TableCell = ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 text-sm text-gray-600">{children}</td>
);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Apartments', href: '/apartments' }
];