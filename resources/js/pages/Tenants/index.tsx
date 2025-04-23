import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { LayoutGrid, Table, Plus, Edit, Trash2, X, Upload, UploadCloud, Star, ChevronLeft, ChevronRight, Laptop } from 'lucide-react';
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
import ModalDispositivos from './ModalDispositivos';

type Apartment = {
    id: number;
    name: string;
    ubicacion: string;
    status: boolean;
    created_at: string;

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
    const { customer } = usePage().props as { customer: { id: number, name: string } };
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        ubicacion: '',
    });
    //console.log(apartments.devices);

    const toggleStatus = async (aparment: Apartment) => {
        setIsUpdatingStatus(aparment.id);

        // Convertir explícitamente a booleano
        const newStatus = !aparment.status;

        try {
            await router.put(
                route('apartments.update-status', aparment.id),
                { status: newStatus }, // Asegurar tipo booleano
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Departamento activado exitosamente');

                    }
                }
            );
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsUpdatingStatus(null);
        }
    };





    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();



        const formData = new FormData();
        formData.append('name', data.name);

        formData.append('ubicacion', data.ubicacion);

        post(route('customers.apartments.store', customer.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                toast.success('Cliente creado exitosamente');
            },
            onError: (errors) => {
                console.error('Errores:', errors);
                if (errors.image) toast.error(errors.image);
                if (errors.name) toast.error(errors.name);
            }
        });
    };

    const handleEdit = (customer: Apartment) => {
        setData({
            id: customer.id,
            name: customer.name,

            ubicacion: customer.ubicacion,
        });
        setCurrentApartment(customer);
        setShowCreateModal(true);
    };

    // components/apartments/Index.tsx
    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.id) return;

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('ubicacion', data.ubicacion || "");


        // ✅ Laravel espera _method como parte del FormData
        formData.append('_method', 'PUT');

        // ✅ Usar router.post() directamente con FormData y method: 'put'
        router.post(route('apartments.update', data.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                setCurrentApartment(null);
                toast.success('Departamento actualizado exitosamente');
            },
            onError: (errors) => {
                if (errors.name) toast.error(errors.name);

            }
        });
    };



    const handleDelete = (customer: Apartment) => {
        setCurrentApartment(customer);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!currentApartment) return;

        destroy(route('apartments.destroy', currentApartment.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setCurrentApartment(null);
                toast.success('Cliente eliminado exitosamente');
            },
            onError: () => {
                toast.error('Error al eliminar cliente');
            }
        });
    };



    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
    const [showModal, setShowModal] = useState(false);

    const handleShowDevices = (department: Apartment) => {
        setSelectedDepartment(department);
        setSelectedDevices(department.devices);
        setShowModal(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departamentos" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header Section */}
                <Card className='w-full border-none py-0 shadow-none'>
                    <CardContent className="p-0">
                        <div className='flex gap-4 items-center'>
                            <img
                                src={`/storage/${customer.image}`}
                                alt={customer.name}
                                className="object-cover rounded-full   h-15 w-15 border-2 border-primary p-1"
                            />
                            <h2 className='text-xl font-medium'>{customer.name}</h2>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="bg-gray-100 p-1 rounded flex">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow ' : ''}`}
                        >
                            <LayoutGrid className={`w-5 h-5 text-gray-600 ${viewMode === 'grid' ? ' !text-red-500' : ''}`} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow' : ''}`}
                        >
                            <Table className={`w-5 h-5 text-gray-600 ${viewMode === 'table' ? ' !text-red-500' : ''}`} />
                        </button>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => {
                                reset();
                                setCurrentApartment(null);
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2  text-white transition-all duration-300"
                        >
                            <Star className="w-5 h-5" />
                            <span className="hidden sm:block">Nuevo Departamento</span>
                        </Button>
                    </div>
                </div>

                {/* Create/Edit Apartment Modal */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent
                        className="w-full max-w-none sm:max-w-2xl mx-0 sm:mx-4 p-0 overflow-hidden"
                        style={{ maxHeight: '90vh' }}
                    >
                        <div className="overflow-y-auto px-6 py-8" style={{ maxHeight: '90vh' }}>
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl">
                                    {currentApartment ? 'Editar Departamento' : 'Crear Nuevo Departamento'}
                                </DialogTitle>
                                <DialogDescription>
                                    Completa los campos requeridos para {currentApartment ? 'actualizar' : 'crear'} el cliente
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                onSubmit={currentApartment ? handleUpdateSubmit : handleCreateSubmit}
                                className="space-y-6"
                            >
                                {/* Nombre */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-base">
                                        Departamento <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={`text-base h-12 ${errors.name ? 'border-red-500' : ''}`}
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>



                                {/* Ubicación */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-base">
                                        Ubicación
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.ubicacion}
                                        onChange={(e) => setData('ubicacion', e.target.value)}
                                        rows={5}
                                        className="text-base"
                                        required
                                    />
                                </div>

                                {/* Botones */}
                                <div className="flex justify-end gap-4 pt-8 pb-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 text-base"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-12 text-base"
                                    >
                                        {processing
                                            ? (currentApartment ? 'Actualizando...' : 'Creando...')
                                            : (currentApartment ? 'Actualizar Departamento' : 'Crear Departamento')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                    <DialogContent >
                        <DialogHeader>
                            <DialogTitle>Confirmar Eliminación</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro de que deseas eliminar al departamento <strong>{currentApartment?.name}</strong>?
                                Esta acción no se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                            >
                                Eliminar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="min-w-3xl">
                        <ModalDispositivos
                            departmentName={selectedDepartment.name || ''}
                            devices={selectedDevices || []}
                            brands={brands}
                            models={models}
                            systems={systems}
                            name_devices={name_devices}
                            apartmentId={selectedDepartment.id || 0}
                        />
                    </DialogContent>

                </Dialog>



                {/* Content Section */}
                {apartments && apartments.data.length === 0 ? (
                    <EmptyState onAddNew={() => setShowCreateModal(true)} />
                ) : viewMode === 'grid' ? (
                    <GridView
                        apartments={apartments?.data}
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
                {apartments && apartments.data.length > 0 && (
                    <Pagination links={apartments.links} meta={apartments.meta} />
                )}
            </div>
        </AppLayout>
    );
}

// Componentes Auxiliares
const GridView = ({ apartments, onEdit, onDelete, onToggleStatus, isUpdatingStatus, handleShowDevices }: {
    apartments: Apartment[],
    onEdit: (customer: Apartment) => void,
    onDelete: (customer: Apartment) => void,
    onToggleStatus: (customer: Apartment) => void,
    isUpdatingStatus: number | null,
    handleShowDevices: (apartment: Apartment) => void;

}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ">
        {apartments && apartments.map((customer) => (
            <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border relative">

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xl text-gray-800 truncate">{customer.name}</h3>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={customer.status}
                                onCheckedChange={() => onToggleStatus(customer)}
                                className="data-[state=checked]:bg-green-500"
                                disabled={isUpdatingStatus === customer.id}
                            />
                            <StatusBadge status={customer.status ? "active" : "inactive"} />
                        </div>
                    </div>
                    {customer.ubicacion ? (
                        <p className="text-sm text-gray-600 line-clamp-2">{customer.ubicacion}</p>
                    ) : (
                        <p className="text-sm text-gray-600 line-clamp-2 italic">Sin descripción</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                        Creado: {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                    <div className='flex gap-4'>
                        <Button
                            //  href={route('apartments.apartments', customer)}
                            onClick={() => handleShowDevices(customer)}
                            className="flex  py-2 rounded-lg items-center gap-2 transition-all duration-300 w-6/12 px-8 bg-primary text-primary-foreground"
                        >
                            {customer.devices?.length}
                            <span className="hidden sm:block">Dispositivos</span>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                        <div className="relative   flex gap-4 w-6/12 justify-end items-center">
                            <button
                                onClick={() => onEdit(customer)}
                                className="p-2 bg-secondary text-secondary-foreground rounded-lg "
                                title="Editar"
                            >
                                <Edit className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => onDelete(customer)}
                                className="p-2 bg-accent text-accent-foreground rounded-lg"
                                title="Eliminar"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        ))}
    </div>
);

const TableView = ({ apartments, onEdit, onDelete, onToggleStatus, isUpdatingStatus, onShowDevices, handleShowDevices }: {
    apartments: Apartment[],
    onEdit: (customer: Apartment) => void,
    onDelete: (customer: Apartment) => void,
    onToggleStatus: (customer: Apartment) => void,
    isUpdatingStatus: number | null


    handleShowDevices: (apartment: Apartment) => void;


}) => (
    <div className="rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50">
                <tr>
                    <TableHeader>Departamento</TableHeader>
                    <TableHeader>Ubicación</TableHeader>
                    <TableHeader ><div className='w-full flex items-center justify-center'>
                        Dispositivos</div></TableHeader>
                    <TableHeader>Estado</TableHeader>
                    <TableHeader>Acciones</TableHeader>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {apartments && apartments.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">

                        <TableCell className="font-medium">{customer.name}</TableCell>

                        <TableCell className="max-w-[8rem]">
                            <p className="truncate">{customer.ubicacion || 'Sin descripción'}</p>
                        </TableCell>
                        <TableCell className="max-w-[100px] flex flex-row items-center justify-center">
                            <div className=' flex items-center justify-center w-full'>
                                <button
                                    onClick={() => handleShowDevices(customer)}
                                    className="text-primary-foreground w-28 flex items-center gap-1 bg-primary rounded-lg py-1 px-2 "
                                >
                                    <Laptop className="w-4 h-4" />
                                    <p className="truncate ">{customer.devices?.length ?? 'Sin conteo'} devices</p>
                                </button>
                            </div>

                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={customer.status}
                                    onCheckedChange={() => onToggleStatus(customer)}
                                    className="data-[state=checked]:bg-green-500"
                                    disabled={isUpdatingStatus === customer.id}
                                />
                                <StatusBadge status={customer.status ? "active" : "inactive"} />
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(customer)}
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Edit className="w-4 h-4" />

                                </button>
                                <button
                                    onClick={() => onDelete(customer)}
                                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />

                                </button>

                            </div>
                        </TableCell>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'active'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
        }`}>
        {status === 'active' ? 'Activo' : 'Inactivo'}
    </span>
);

const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
    <div className="bg-sidebar p-8 rounded-xl text-center border-2 border-dashed ">
        <div className="text-primary mb-4 flex justify-center">
            <LayoutGrid className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-semibold text-primary mb-2">No hay departamentos registrados</h3>
        <p className="text-primary mb-4">Comienza agregando tu primer departamento</p>
        <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg  transition-colors"
        >
            <Plus className="w-5 h-5" />
            Crear Primer Departamento
        </button>
    </div>
);

const Pagination = ({ links, meta }: { links: PaginationLink[], meta: PaginationMeta }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-gray-500">
            Mostrando {meta?.per_page * (meta?.current_page - 1) + 1} -{' '}
            {Math.min(meta?.per_page * meta?.current_page, meta?.total)} de {meta?.total}
        </div>
        <div className="flex gap-1">
            {links.map((link, index) => (
                link.url && (
                    <Link
                        key={index}
                        href={link.url}
                        className={`px-3 py-1 rounded-lg ${link.active
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                )
            ))}
        </div>
    </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{children}</th>
);

const TableCell = ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 text-sm text-gray-600">{children}</td>
);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Departametos', href: '/apartments' }
];