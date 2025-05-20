// pages/Apartments/Index.tsx
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
import { Tenant } from '@/types/models/Tenant';
import { TenantForm } from './TenantForm';
import { Apartment } from '@/types/models/Apartment';
import _ from 'lodash';

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
    name_devices: { id: number; name: string }[];

}

export default function Index({ apartments, brands, models, systems, name_devices }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentApartment, setCurrentApartment] = useState<Apartment | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
    const [selectedShareDevices, setSelectedShareDevices] = useState<Device[]>([]);

    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [initialFormData, setInitialFormData] = useState<any>();
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    const { building, all_buildings, googleMapsApiKey } = usePage().props as {
        building: {
            id: number,
            name: string,
            image: string,
            location_link: string,
            owner?: {
                name: string,
                email: string,
                phone: string,
                photo: string
            },
            doormen?: Array<{
                id: number,
                name: string,
                email: string,
                phone: string,
                photo: string,
                shift: string
            }>
        },
        all_buildings: { id: number, name: string, image: string }[],
        googleMapsApiKey: string
    };

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        ubicacion: '',
        tenants: [] as Array<{
            id?: number;
            name: string;
            email: string;
            phone: string;
            photo: File | null;
            photoPreview?: string;
        }>,
    });

    const hasUnsavedChanges = () => {
        return !_.isEqual(data, initialFormData);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();

        formData.append('name', data.name);
        formData.append('ubicacion', data.ubicacion);

        data.tenants.forEach((tenant, index) => {
            formData.append(`tenants[${index}][name]`, tenant.name);
            formData.append(`tenants[${index}][email]`, tenant.email);
            formData.append(`tenants[${index}][phone]`, tenant.phone);
            if (tenant.photo) {
                formData.append(`tenants[${index}][photo]`, tenant.photo);
            }
            if (tenant.id) {
                formData.append(`tenants[${index}][id]`, tenant.id.toString());
            }
        });

        post(route('buildings.apartments.store', building), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setInitialFormData(undefined);
                setShowCreateModal(false);
                toast.success('Apartment created successfully');
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error));
            }
        });
    };

    const handleEdit = (apartment: Apartment) => {
        const initialData = {
            id: apartment.id,
            name: apartment.name,
            ubicacion: apartment.ubicacion,
            tenants: apartment.tenants?.map(t => ({
                id: t.id,
                name: t.name || '',
                email: t.email || '',
                phone: t.phone || '',
                photo: null,
                photoPreview: t.photo || ''
            })) || []
        };

        setData(initialData);
        setInitialFormData(initialData);
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

        data.tenants.forEach((tenant, index) => {
            if (tenant.id) {
                formData.append(`tenants[${index}][id]`, tenant.id.toString());
            }
            formData.append(`tenants[${index}][name]`, tenant.name);
            formData.append(`tenants[${index}][email]`, tenant.email);
            formData.append(`tenants[${index}][phone]`, tenant.phone);
            if (tenant.photo) {
                formData.append(`tenants[${index}][photo]`, tenant.photo);
            }
        });

        router.post(route('apartments.update', data.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setInitialFormData(undefined);
                setShowCreateModal(false);
                setCurrentApartment(null);
                toast.success('Apartment updated successfully');
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error));
            }
        });
    };

    const handleShowCreate = () => {
        const emptyData = {
            id: null,
            name: '',
            ubicacion: '',
            tenants: []
        };

        reset();
        setInitialFormData(emptyData);
        setCurrentApartment(null);
        setShowCreateModal(true);
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

    const handleShowDevices = (apartment: Apartment, tenant: Tenant) => {
        setSelectedApartment(apartment);
        setSelectedTenant(tenant);
        setSelectedDevices(tenant.devices || []);
        setSelectedShareDevices(tenant.shared_devices || []);
        setShowDevicesModal(true);
    };

    const getEmbedUrl = (locationLink: string): string => {
        if (!locationLink) return '';
        if (locationLink.includes('maps.app.goo.gl')) {
            return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=-10.916879,-74.883391&zoom=15`;
        }
        if (locationLink.includes('/embed')) return locationLink;
        if (locationLink.includes('google.com/maps')) {
            const coordsMatch = locationLink.match(/@([-0-9.]+),([-0-9.]+)/);
            if (coordsMatch) {
                return `https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=${coordsMatch[1]},${coordsMatch[2]}&zoom=15`;
            }
            const placeIdMatch = locationLink.match(/place\/([^\/]+)/);
            if (placeIdMatch) {
                return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=place_id:${placeIdMatch[1]}`;
            }
        }
        return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(locationLink)}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Apartments" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className='w-full border-none py-0 shadow-none'>
                    <CardContent className="p-0">
                        <BuildingCombobox
                            buildings={all_buildings}
                            selectedId={building.id}
                            onChange={(id) => router.visit(route('buildings.apartments', id))}
                        />
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={handleShowCreate}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:block">New Apartment</span>
                        </Button>
                    </div>
                </div>

                <Dialog
                    open={showCreateModal}
                    onOpenChange={(open) => {
                        if (!open && hasUnsavedChanges()) {
                            setShowConfirmClose(true);
                        } else {
                            setShowCreateModal(open);
                        }
                    }}
                >
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
                                    </TabsContent>

                                    <TabsContent value="tenant" className="space-y-6">
                                       <div className='h-[400px] max-h-[400px] overflow-y-auto'>
                                       <TenantForm
                                            tenants={data.tenants}
                                            onTenantsChange={(tenants) => setData('tenants', tenants)}
                                            errors={errors}
                                        />
                                       </div>
                                    </TabsContent>

                             
                                    <div className=" px-6 py-4 bg-card flex justify-end gap-4">
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

                    <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>¿Tienes cambios sin guardar?</DialogTitle>
                                <DialogDescription>
                                    Tienes modificaciones pendientes en el formulario. ¿Seguro que quieres salir sin guardar?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowConfirmClose(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setShowConfirmClose(false);
                                        reset();
                                        setInitialFormData(undefined);
                                    }}
                                >
                                    Descartar cambios
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </Dialog>

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

                <Dialog open={showDevicesModal} onOpenChange={setShowDevicesModal}>
                    <DialogContent className="min-w-3xl">
                        <ModalDispositivos
                            onClose={() => {
                                setShowDevicesModal(false);
                                router.reload();
                            }}
                            visible={showDevicesModal}
                            tenantName={selectedTenant}
                            devices={selectedDevices}
                            shareDevice={selectedShareDevices}
                            brands={brands}
                            models={models}
                            systems={systems}
                            name_devices={name_devices}
                            apartmentId={selectedApartment?.id || 0}
                            tenantId={selectedTenant?.id || 0}
                            tenants={selectedApartment?.tenants || []}
                        />
                    </DialogContent>
                </Dialog>

                {apartments.data.length === 0 ? (
                    <div className="bg-background p-8 rounded-xl text-center border-2 border-dashed">
                        <div className="text-primary mb-4 flex justify-center">
                            <LayoutGrid className="w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-semibold text-primary mb-2">No apartments registered</h3>
                        <p className="text-primary mb-4">Start by adding your first apartment</p>
                        <Button
                            onClick={handleShowCreate}
                            className="inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create First Apartment
                        </Button>
                    </div>
                ) : (
                    <div className='flex flex-col lg:flex-row gap-4'>
                        <div className="w-full lg:w-4/12 space-y-6">
                            {building.owner && (
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <img
                                                src={`/storage/${building.owner.photo}`}
                                                alt={building.owner.name}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                                            />
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-semibold">{building.owner.name}</h3>
                                                <div className="space-y-1 text-sm">
                                                    <p className="text-muted-foreground">{building.owner.email}</p>
                                                    <p className="text-muted-foreground">{building.owner.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {building.doormen && building.doormen.length > 0 && (
                                <div className="space-y-4 w-full">
                                    <h3 className="text-lg font-semibold px-2">Doormen</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        {building.doormen.map((doorman) => (
                                            <Card key={doorman.id} className='py-2'>
                                                <CardContent className="px-2 ">
                                                    <img
                                                        src={`/storage/${doorman.photo}`}
                                                        alt={doorman.name}
                                                        className=" aspect-square rounded-full object-cover"
                                                    />
                                                    <div className="flex flex-col items-center justify-center gap-0 mt-4">
                                                        <h4 className="text-sm font-medium line-clamp-1">{doorman.name}</h4>
                                                        <p className="text-xs text-muted-foreground">{doorman.shift}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {building.location_link && (
                                <div className="aspect-video rounded-lg overflow-hidden border">
                                    <iframe
                                        src={getEmbedUrl(building?.location_link || '')}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            )}
                        </div>
                        <div className='lg:w-8/12 flex flex-col'>
                            <div className="rounded-md border">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="h-12 px-4 text-left align-middle font-medium">Members</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium">Apartment</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium">Ubication</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium">State</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {apartments.data.map((apartment) => (
                                            <ApartmentRow
                                                key={apartment.id}
                                                apartment={apartment}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onToggleStatus={() => toggleStatus(apartment)}
                                                isUpdatingStatus={isUpdatingStatus === apartment.id}
                                                handleShowDevices={handleShowDevices}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {apartments.data.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {apartments.meta.per_page * (apartments.meta.current_page - 1) + 1} -{' '}
                                        {Math.min(apartments.meta.per_page * apartments.meta.current_page, apartments.meta.total)} of {apartments.meta.total}
                                    </div>
                                    <div className="flex gap-1">
                                        {apartments.links.map((link, index) => (
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
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

const ApartmentRow = ({ apartment, onEdit, onDelete, onToggleStatus, isUpdatingStatus, handleShowDevices }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr className="border-b">
                <td className="p-4 align-middle cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(!expanded)}>
                    <div className="flex items-center gap-2">
                        <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        <span>{apartment.tenants?.length || 0}</span>
                    </div>
                </td>
                <td className="p-4 align-middle">{apartment.name}</td>
                <td className="p-4 align-middle">{apartment.ubicacion}</td>
                <td className="p-4 align-middle">
                    <Switch
                        checked={apartment.status}
                        disabled={isUpdatingStatus}
                        onCheckedChange={onToggleStatus}
                    />
                </td>
                <td className="p-4 align-middle">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(apartment)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(apartment)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </td>
            </tr>
            {expanded && apartment.tenants?.length > 0 && (
                <tr className="border-b bg-muted/20">
                    <td colSpan={5} className="p-4">
                        <div className="space-y-4">
                            {apartment.tenants.map((tenant) => (
                                <div key={tenant.id} className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={`/storage/${tenant.photo}`}
                                            alt={tenant.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-medium">{tenant.name}</p>
                                            <p className="text-sm text-muted-foreground">{tenant.email}</p>
                                            <p className="text-sm text-muted-foreground">{tenant.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => handleShowDevices(apartment, tenant)}
                                        >
                                            <Laptop className="w-4 h-4" />
                                            {Number(tenant.devices?.length) + Number(tenant.shared_devices?.length) || 0}
                                            <span>Devices</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Apartments', href: '/apartments' }
];

async function toggleStatus(apartment: Apartment) {
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
}