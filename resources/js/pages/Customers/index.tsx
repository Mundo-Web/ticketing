import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { LayoutGrid, Table, Plus, Edit, Trash2, X, Upload, UploadCloud, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface Customer {
    id: number;
    name: string;
    image: string;
    description: string;
    status: boolean;
    created_at: string;
}

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
    customers: {
        data: Customer[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
}

export default function Index({ customers }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        image: null as File | null,
        description: '',
    });

    const toggleStatus = async (customer: Customer) => {
        setIsUpdatingStatus(customer.id);

        // Convertir explícitamente a booleano
        const newStatus = !customer.status;

        try {
            await router.put(
                route('customers.update-status', customer.id),
                { status: newStatus }, // Asegurar tipo booleano
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Cliente activado exitosamente');

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
        formData.append('image', data.image || "");
        formData.append('description', data.description);

        post(route('customers.store'), {
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

    const handleEdit = (customer: Customer) => {
        setData({
            id: customer.id,
            name: customer.name,
            image: null,
            description: customer.description,
        });
        setCurrentCustomer(customer);
        setShowCreateModal(true);
    };

    // components/Customers/Index.tsx
    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.id) return;

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description || "");
        if (data.image) {
            formData.append('image', data.image);
        }

        // ✅ Laravel espera _method como parte del FormData
        formData.append('_method', 'PUT');

        // ✅ Usar router.post() directamente con FormData y method: 'put'
        router.post(route('customers.update', data.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                setCurrentCustomer(null);
                toast.success('Cliente actualizado exitosamente');
            },
            onError: (errors) => {
                if (errors.name) toast.error(errors.name);
                if (errors.image) toast.error(errors.image);
            }
        });
    };



    const handleDelete = (customer: Customer) => {
        setCurrentCustomer(customer);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!currentCustomer) return;

        destroy(route('customers.destroy', currentCustomer.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setCurrentCustomer(null);
                toast.success('Cliente eliminado exitosamente');
            },
            onError: () => {
                toast.error('Error al eliminar cliente');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clientes" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header Section */}
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
                                setCurrentCustomer(null);
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
                        >
                            <Star className="w-5 h-5" />
                            <span className="hidden sm:block">Nuevo Cliente</span>
                        </Button>
                    </div>
                </div>

                {/* Create/Edit Customer Modal */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent
                        className="w-full max-w-none sm:max-w-2xl mx-0 sm:mx-4 p-0 overflow-hidden"
                        style={{ maxHeight: '90vh' }}
                    >
                        <div className="overflow-y-auto px-6 py-8" style={{ maxHeight: '90vh' }}>
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl">
                                    {currentCustomer ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                                </DialogTitle>
                                <DialogDescription>
                                    Completa los campos requeridos para {currentCustomer ? 'actualizar' : 'crear'} el cliente
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                onSubmit={currentCustomer ? handleUpdateSubmit : handleCreateSubmit}
                                className="space-y-6"
                            >
                                {/* Nombre */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-base">
                                        Nombre <span className="text-red-500">*</span>
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

                                {/* Imagen Drag & Drop */}
                                <div className="space-y-2">
                                    <Label htmlFor="image" className="text-base">
                                        Imagen {!currentCustomer && <span className="text-red-500">*</span>}
                                    </Label>

                                    <div
                                        className={`relative w-full h-64 border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-colors duration-200 
                            ${errors.image ? 'border-red-500' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const file = e.dataTransfer.files[0];
                                            if (file) {
                                                setData('image', file);
                                            }
                                        }}
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                    >
                                        {data.image ? (
                                            <img
                                                src={URL.createObjectURL(data.image)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : currentCustomer?.image ? (
                                            <img
                                                src={`/storage/${currentCustomer.image}`}
                                                alt="Imagen actual"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                                <UploadCloud className="w-12 h-12" />
                                                <span>Arrastra una imagen o haz clic para seleccionar</span>
                                            </div>
                                        )}

                                        <Input
                                            id="image-upload"
                                            type="file"
                                            accept="image/png, image/jpeg,image/jpg"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setData('image', e.target.files[0]);
                                                }
                                            }}
                                            className="hidden"
                                        />
                                    </div>

                                    {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
                                </div>

                                {/* Descripción */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-base">
                                        Descripción
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={5}
                                        className="text-base"
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
                                            ? (currentCustomer ? 'Actualizando...' : 'Creando...')
                                            : (currentCustomer ? 'Actualizar Cliente' : 'Crear Cliente')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar Eliminación</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro de que deseas eliminar al cliente <strong>{currentCustomer?.name}</strong>?
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

                {/* Content Section */}
                {customers.data.length === 0 ? (
                    <EmptyState onAddNew={() => setShowCreateModal(true)} />
                ) : viewMode === 'grid' ? (
                    <GridView
                        customers={customers.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={toggleStatus}
                        isUpdatingStatus={isUpdatingStatus}
                    />
                ) : (
                    <TableView
                        customers={customers.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={toggleStatus}
                        isUpdatingStatus={isUpdatingStatus}
                    />
                )}

                {/* Pagination */}
                {customers.data.length > 0 && (
                    <Pagination links={customers.links} meta={customers.meta} />
                )}
            </div>
        </AppLayout>
    );
}

// Componentes Auxiliares
const GridView = ({ customers, onEdit, onDelete, onToggleStatus, isUpdatingStatus }: {
    customers: Customer[],
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void,
    onToggleStatus: (customer: Customer) => void,
    isUpdatingStatus: number | null
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {customers.map((customer) => (
            <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border relative">
                {customer.image && (
                    <img
                        src={`/storage/${customer.image}`}
                        alt={customer.name}
                        className="object-cover rounded-lg mb-4 w-full aspect-[4/3]"
                    />
                )}
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
                    {customer.description ? (
                        <p className="text-sm text-gray-600 line-clamp-2">{customer.description}</p>
                    ) : (
                        <p className="text-sm text-gray-600 line-clamp-2 italic">Sin descripción</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                        Creado: {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                    <Link
                        href={route('customers.apartments', customer)}
                        className="flex  py-2 rounded-lg items-center gap-2 transition-all duration-300 w-max px-8 bg-slate-200 hover:bg-slate-300 text-black"
                    >
                        <span className="hidden sm:block">Admin</span>
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                    <button
                        onClick={() => onEdit(customer)}
                        className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        title="Editar"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(customer)}
                        className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ))}
    </div>
);

const TableView = ({ customers, onEdit, onDelete, onToggleStatus, isUpdatingStatus }: {
    customers: Customer[],
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void,
    onToggleStatus: (customer: Customer) => void,
    isUpdatingStatus: number | null
}) => (
    <div className="rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50">
                <tr>
                    <TableHeader>Imagen</TableHeader>
                    <TableHeader>Nombre</TableHeader>
                    <TableHeader>Estado</TableHeader>
                    <TableHeader>Descripción</TableHeader>
                    <TableHeader>Acciones</TableHeader>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                            {customer.image && (
                                <img
                                    src={`/storage/${customer.image}`}
                                    alt={customer.name}
                                    className="w-12 h-12 rounded-full  object-cover"

                                />
                            )}
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
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
                        <TableCell className="max-w-[200px]">
                            <p className="truncate">{customer.description || 'Sin descripción'}</p>
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
    <div className="bg-blue-50/50 p-8 rounded-xl text-center border-2 border-dashed border-blue-100">
        <div className="text-blue-500 mb-4 flex justify-center">
            <LayoutGrid className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-semibold text-blue-800 mb-2">No hay clientes registrados</h3>
        <p className="text-blue-600 mb-4">Comienza agregando tu primer cliente</p>
        <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
            <Plus className="w-5 h-5" />
            Crear Primer Cliente
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
    { title: 'Clientes', href: '/customers' }
];