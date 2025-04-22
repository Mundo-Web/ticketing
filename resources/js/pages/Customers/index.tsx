import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { LayoutGrid, Table, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    name: string;
    image: string;
    description: string;
    status: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page?: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    customers: {
        data: Customer[];
        links: PaginationLink[];
        meta?: PaginationMeta;
    };
}

export default function Index({ customers }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        image: null as File | null,
        description: '',
        status: 'active'
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.image) {
            toast.error('Debes seleccionar una imagen');
            return;
        }

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('image', data.image);
        formData.append('description', data.description);
        formData.append('status', data.status);

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
            status: customer.status
        });
        setCurrentCustomer(customer);
        setShowCreateModal(true);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        if (data.image) {
            formData.append('image', data.image);
        }
        formData.append('description', data.description);
        formData.append('status', data.status);
        formData.append('_method', 'PUT');

        if (!data.id) return;

        post(route('customers.update', data.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                setCurrentCustomer(null);
                toast.success('Cliente actualizado exitosamente');
            },
            onError: (errors) => {
                console.error('Errores:', errors);
                if (errors.image) toast.error(errors.image);
                if (errors.name) toast.error(errors.name);
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
                    <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="bg-gray-100 p-1 rounded flex">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                            >
                                <LayoutGrid className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow' : ''}`}
                            >
                                <Table className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                reset();
                                setCurrentCustomer(null);
                                setShowCreateModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 flex-1 justify-center sm:flex-none"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:block">Nuevo Cliente</span>
                        </button>
                    </div>
                </div>

                {/* Create/Edit Customer Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl w-full max-w-md">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="text-lg font-semibold">
                                    {currentCustomer ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCurrentCustomer(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form
                                onSubmit={currentCustomer ? handleUpdateSubmit : handleCreateSubmit}
                                className="p-4 space-y-4"
                                encType="multipart/form-data"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className={`w-full rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'} p-2`}
                                        required
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Imagen {!currentCustomer && '*'}
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setData('image', e.target.files[0]);
                                            }
                                        }}
                                        className="w-full rounded-lg border border-gray-200 p-2"
                                        required={!currentCustomer}
                                    />
                                    {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
                                    {currentCustomer?.image && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">Imagen actual:</p>
                                            <img
                                                src={`/storage/${currentCustomer.image}`}
                                                alt="Imagen actual"
                                                className="h-20 object-cover rounded mt-1"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 p-2"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado *
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 p-2"
                                        required
                                    >
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setCurrentCustomer(null);
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {processing
                                            ? (currentCustomer ? 'Actualizando...' : 'Creando...')
                                            : (currentCustomer ? 'Actualizar Cliente' : 'Crear Cliente')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && currentCustomer && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl w-full max-w-md">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="text-lg font-semibold">Confirmar Eliminación</h3>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4">
                                <p>¿Estás seguro de que deseas eliminar al cliente <strong>{currentCustomer.name}</strong>? Esta acción no se puede deshacer.</p>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmDelete}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Section */}
                {customers.data.length === 0 ? (
                    <EmptyState onAddNew={() => setShowCreateModal(true)} />
                ) : viewMode === 'grid' ? (
                    <GridView
                        customers={customers.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ) : (
                    <TableView
                        customers={customers.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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
const GridView = ({ customers, onEdit, onDelete }: {
    customers: Customer[],
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {customers.map((customer) => (
            <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border relative">
                {customer.image && (
                    <img
                        src={`/storage/${customer.image}`}
                        alt={customer.name}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                )}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 truncate">{customer.name}</h3>
                        <StatusBadge status={customer.status} />
                    </div>
                    {customer.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{customer.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                        Creado: {new Date(customer.created_at).toLocaleDateString()}
                    </div>
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

const TableView = ({ customers, onEdit, onDelete }: {
    customers: Customer[],
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void
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
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            )}
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell><StatusBadge status={customer.status} /></TableCell>
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
                                    Editar
                                </button>
                                <button
                                    onClick={() => onDelete(customer)}
                                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
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
                        className={`px-3 py-1 rounded-md ${link.active
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