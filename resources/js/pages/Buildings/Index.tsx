
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    LayoutGrid, Table as TableIcon, Plus, Edit, Trash2, Upload, UploadCloud,
    Star, ChevronLeft, ChevronRight, Archive, MapPin, ArchiveRestore,
    ChevronDown, MoreHorizontal, Download, Sliders, Building as IconBuilding, X, CheckCircle,
    User
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building } from '@/types/models/Building';



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
    buildings: {
        data: Building[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
    googleMapsApiKey: string;
}

export default function Index({ buildings, googleMapsApiKey }: Props) {
    // Estados para la tabla
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // Estados para la vista y modales
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [gridColumns, setGridColumns] = useState<number>(4);
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Formulario
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        image: null as File | null,
        description: '',
        location_link: '',
        owner: {
            name: '',
            email: '',
            photo: null as File | null,
            phone: ''
        },
        doormen: [] as Array<{
            id?: number;
            name: string;
            photo: File | null;
            email: string;
            phone: string;
            shift: 'morning' | 'afternoon' | 'night';
        }>,
    });

    // Definición de columnas para la tabla
    const columns: ColumnDef<Building>[] = [
        {
            accessorKey: "image",
            header: "Image",
            cell: ({ row }) => {
                const building = row.original;
                return building.image ? (
                    <img
                        src={`/storage/${building.image}`}
                        alt={building.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <IconBuilding className="w-5 h-5 text-gray-400" />
                    </div>
                );
            },
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const building = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={building.status}
                            onCheckedChange={() => toggleStatus(building)}
                            className="data-[state=checked]:bg-green-500"
                            disabled={isUpdatingStatus === building.id}
                        />
                        <StatusBadge status={building.status ? "active" : "inactive"} />
                    </div>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate">
                    {row.getValue("description") || "No description"}
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => (
                <div className="text-sm text-gray-500">
                    {new Date(row.getValue("created_at")).toLocaleDateString()}
                </div>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const building = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(building)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(building)}>
                                {building.status ? (
                                    <>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Archive
                                    </>
                                ) : (
                                    <>
                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                        Restore
                                    </>
                                )}
                            </DropdownMenuItem>
                            {building.location_link && (
                                <DropdownMenuItem onClick={() => showLocation(building)}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    View Location
                                </DropdownMenuItem>
                            )}
                            {!building.status && (
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(building)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    // Configuración de la tabla
    const table = useReactTable({
        data: buildings.data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    // Funciones para exportar datos
    const exportToCSV = () => {
        const headers = table.getAllColumns()
            .filter(column => column.getIsVisible())
            .map(column => column.id)
            .join(',') + '\n';

        const rows = table.getFilteredRowModel().rows.map(row => {
            return table.getAllColumns()
                .filter(column => column.getIsVisible())
                .map(column => {
                    const value = row.getValue(column.id);
                    // Formatear valores para CSV
                    if (column.id === 'status') {
                        return row.original.status ? 'Active' : 'Inactive';
                    }
                    if (column.id === 'created_at') {
                        return new Date(row.original.created_at).toLocaleDateString();
                    }
                    return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
                })
                .join(',');
        }).join('\n');

        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `buildings_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportToExcel = () => {
        toast.info('Excel export feature coming soon!');
        // Implementación real requeriría una librería como xlsx
    };

    // Funciones para manejar edificios
    const toggleStatus = async (building: Building) => {
        setIsUpdatingStatus(building.id);
        try {
            await router.put(
                route('buildings.update-status', building.id),
                { status: !building.status },
                {
                    preserveScroll: true,
                    onSuccess: () => toast.success('Status updated successfully'),
                    onError: () => toast.error('Connection error')
                }
            );
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        // Building data
        formData.append('name', data.name);
        if (data.image) formData.append('image', data.image);
        formData.append('description', data.description);
        formData.append('location_link', data.location_link);

        // Owner data
        formData.append('owner[name]', data.owner.name);
        formData.append('owner[email]', data.owner.email);
        formData.append('owner[phone]', data.owner.phone);
        if (data.owner.photo) formData.append('owner[photo]', data.owner.photo);

        // Doormen data
        data.doormen.forEach((doorman, index) => {
            formData.append(`doormen[${index}][name]`, doorman.name);
            formData.append(`doormen[${index}][email]`, doorman.email);
            formData.append(`doormen[${index}][phone]`, doorman.phone);
            formData.append(`doormen[${index}][shift]`, doorman.shift);
            if (doorman.id) formData.append(`doormen[${index}][id]`, doorman.id.toString());
            if (doorman.photo) formData.append(`doormen[${index}][photo]`, doorman.photo);
        });

        post(route('buildings.store'), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                toast.success('Building created successfully');
            },
            onError: (errors) => {
                console.error('Errors:', errors);
                Object.values(errors).forEach(error => toast.error(error));
            }
        });
    };

    const handleEdit = (building: Building) => {
        setData({
            id: building.id,
            name: building.name,
            image: null,
            description: building.description,
            location_link: building.location_link,
            owner: {
                name: building.owner.name,
                email: building.owner.email,
                photo: null,
                phone: building.owner.phone || ''
            },
            doormen: building.doormen.map(d => ({
                id: d.id,
                name: d.name,
                photo: null,
                email: d.email,
                phone: d.phone || '',
                shift: d.shift || 'morning'
            }))
        });
        setCurrentBuilding(building);
        setShowCreateModal(true);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.id) return;

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        if (data.image) formData.append('image', data.image);
        formData.append('description', data.description);
        formData.append('location_link', data.location_link);

        // Owner data
        formData.append('owner[name]', data.owner.name);
        formData.append('owner[email]', data.owner.email);
        formData.append('owner[phone]', data.owner.phone);
        if (data.owner.photo) formData.append('owner[photo]', data.owner.photo);

        // Doormen data
        data.doormen.forEach((doorman, index) => {
            formData.append(`doormen[${index}][name]`, doorman.name);
            formData.append(`doormen[${index}][email]`, doorman.email);
            formData.append(`doormen[${index}][phone]`, doorman.phone);
            formData.append(`doormen[${index}][shift]`, doorman.shift);
            if (doorman.id) formData.append(`doormen[${index}][id]`, doorman.id.toString());
            if (doorman.photo) formData.append(`doormen[${index}][photo]`, doorman.photo);
        });

        router.post(route('buildings.update', data.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                setCurrentBuilding(null);
                toast.success('Building updated successfully');
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error));
            }
        });
    };

    const handleDelete = (building: Building) => {
        setCurrentBuilding(building);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!currentBuilding) return;

        destroy(route('buildings.destroy', currentBuilding.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setCurrentBuilding(null);
                toast.success('Building deleted successfully');
            },
            onError: () => {
                toast.error('Error deleting building');
            }
        });
    };

    const showLocation = (building: Building) => {
        setCurrentBuilding(building);
        setShowLocationModal(true);
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

    // Vista de cuadrícula
    const GridView = ({ buildings, onEdit, onDelete, onToggleStatus, isUpdatingStatus, gridColumns, onShowLocation }: {
        buildings: Building[],
        onEdit: (building: Building) => void,
        onDelete: (building: Building) => void,
        onToggleStatus: (building: Building) => void,
        isUpdatingStatus: number | null,
        gridColumns: number,
        onShowLocation: (building: Building) => void
    }) => {
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
        const [selectedDoorman, setSelectedDoorman] = useState<Doorman | null>(null);
        const [openBuildingId, setOpenBuildingId] = useState<number | null>(null);

        return (
            <div className={`grid ${getGridClass()} gap-6`}>
                {buildings.map((building) => (
                    <div key={building.id} className="bg-card text-card-foreground p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border relative">
                        {building.image && (
                            <div className='relative'>
                                <img
                                    src={`/storage/${building.image}`}
                                    alt={building.name}
                                    className="object-cover rounded-md mb-4 w-full aspect-[4/3]"
                                />
                                {building.location_link && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onShowLocation(building)}
                                        className="absolute top-0 right-0 w-max text-destructive hover:bg-transparent hover:text-destructive"
                                    >
                                        <MapPin className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-xl truncate">{building.name}</h3>
                                <div className="relative">
                                    {/* Botón para mostrar lista (CLICK) */}
                                    <button
                                        onClick={() => setOpenBuildingId(openBuildingId === building.id ? null : building.id)}
                                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                                    >
                                        <span className="text-sm">{building.doormen.length}</span>
                                        <User className="w-4 h-4" />
                                    </button>

                                    {/* Lista de doormans (aparece al CLICK) */}
                                    {openBuildingId === building.id && (
                                        <div className="absolute right-0 bottom-8 mt-2   rounded-lg z-20  space-y-2">
                                            {building.doormen.map((doorman) => (
                                                <div
                                                    key={doorman.id}
                                                    className="relative group flex items-center gap-3 p-1 rounded-full bg-muted shadow-xl border-2 border-white cursor-pointer"
                                                    onClick={() => setSelectedDoorman(doorman)}
                                                >
                                                    {/* Tooltip que aparece al HOVER */}
                                                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <div className="bg-foreground text-background px-2 py-1 rounded-md text-sm whitespace-nowrap shadow-lg">
                                                            {doorman.name}
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[1px] w-2 h-2 bg-foreground rotate-45" />
                                                        </div>
                                                    </div>

                                                    <img
                                                        src={doorman.photo ? `/storage/${doorman.photo}` : '/placeholder-user.jpg'}
                                                        alt={doorman.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {building.apartments && (
                                <p className="text-sm line-clamp-2">{building.apartments.length} apartments</p>
                            )}
                            <div className="text-xs mt-2">
                                Created: {new Date(building.created_at).toLocaleDateString()}
                            </div>
                            <div className='flex space-x-4'>
                                <Link
                                    href={route('buildings.apartments', building)}
                                    className="flex rounded-lg items-center justify-center gap-2 transition-all duration-300 w-7/12 bg-primary text-primary-foreground"
                                >
                                    <span className="hidden sm:block">Admin</span>
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                                <div className="relative flex gap-4 w-5/12 justify-end items-center">
                                    {building.status ? (
                                        <>
                                            <Button
                                                onClick={() => onEdit(building)}
                                                variant="secondary"
                                                title="Edit"
                                                size="icon"
                                            >
                                                <Edit className="w-6 h-6" />
                                            </Button>
                                            <Button
                                                onClick={() => onToggleStatus(building)}
                                                variant="default"
                                                title="Archive"
                                                size="icon"
                                                className='bg-amber-600 hover:bg-amber-500'
                                            >
                                                <Archive className="w-6 h-6" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={() => onToggleStatus(building)}
                                                variant="default"
                                                title="Restore"
                                                size="icon"
                                                className='bg-amber-600 hover:bg-amber-500'
                                            >
                                                <ArchiveRestore className="w-6 h-6" />
                                            </Button>
                                            <Button
                                                onClick={() => onDelete(building)}
                                                variant="destructive"
                                                title="Delete"
                                                size="icon"
                                            >
                                                <Trash2 className="w-6 h-6" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Modal de detalles del doorman */}
                        {selectedDoorman && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-card rounded-lg p-6 max-w-sm w-full mx-4">
                                    <div className="flex flex-col items-center gap-4">
                                        <img
                                            src={selectedDoorman.photo
                                                ? `/storage/${selectedDoorman.photo}`
                                                : '/placeholder-user.jpg'}
                                            alt={selectedDoorman.name}
                                            className="w-24 h-24 rounded-full object-cover border-4 border-primary"
                                        />
                                        <div className="text-center">
                                            <h4 className="text-xl font-semibold">  {selectedDoorman.name}</h4>
                                            <p className="text-muted-foreground"> Email: {selectedDoorman.email}</p>
                                            <p className="text-muted-foreground"> Phone: {selectedDoorman.phone}</p>
                                            <p className="text-muted-foreground">
                                                Shift: {selectedDoorman.shift === 'morning' ? 'Morning' :
                                                    selectedDoorman.shift === 'afternoon' ? 'Afternoon' : 'Night'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            className="mt-4"
                                            onClick={() => setSelectedDoorman(null)}
                                        >
                                            Cerrar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Estado vacío
    const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
        <div className="bg-sidebar p-8 rounded-xl text-center border-2 border-dashed">
            <div className="text-primary mb-4 flex justify-center">
                <IconBuilding className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">No buildings registered</h3>
            <p className="text-primary mb-4">Start by adding your first building</p>
            <button
                onClick={onAddNew}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg transition-colors"
            >
                <Plus className="w-5 h-5" />
                Create First Building
            </button>
        </div>
    );

    // Paginación personalizada
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
                            className={`px-3 py-1 rounded-lg ${link.active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    )
                ))}
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buildings" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
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
                                <TableIcon className={`w-5 h-5 ${viewMode === 'table' ? 'text-primary' : 'text-gray-600'}`} />
                            </button>
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

                    <div className="flex gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-2">
                                    <Sliders className="mr-2 h-4 w-4" />
                                    Actions
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={exportToCSV}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export to CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={exportToExcel}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export to Excel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={() => {
                                reset();
                                setCurrentBuilding(null);
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:block">New Building</span>
                        </Button>
                    </div>
                </div>

                {/* Filtros y controles de tabla */}
                {viewMode === 'table' && (
                    <div className="flex items-center gap-4">
                        <Input
                            placeholder="Filter by name..."
                            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("name")?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* Content Section */}
                {buildings.data.length === 0 ? (
                    <EmptyState onAddNew={() => setShowCreateModal(true)} />
                ) : viewMode === 'grid' ? (
                    <GridView
                        buildings={buildings.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={toggleStatus}
                        isUpdatingStatus={isUpdatingStatus}
                        onShowLocation={showLocation}
                        gridColumns={gridColumns}
                    />
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
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
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
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
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex-1 text-sm text-muted-foreground">
                                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                {table.getFilteredRowModel().rows.length} row(s) selected.
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Create/Edit Building Modal */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="w-full max-w-none sm:max-w-4xl mx-0 sm:mx-4 p-0 overflow-hidden bg-background">
                        <div className="overflow-y-auto px-6 py-8" style={{ maxHeight: '90vh' }}>
                            <DialogHeader className="mb-8">
                                <DialogTitle className="text-3xl font-semibold tracking-tight">
                                    {currentBuilding ? 'Edit Building' : 'New Building'}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    {currentBuilding ? 'Update the building information below.' : 'Fill in the building information below to create a new record.'}
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={currentBuilding ? handleUpdateSubmit : handleCreateSubmit} className="space-y-8">
                                <Tabs defaultValue="building" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="building">Building</TabsTrigger>
                                        <TabsTrigger value="owner">Owner</TabsTrigger>
                                        <TabsTrigger value="doorman">Doorman</TabsTrigger>
                                    </TabsList>

                                    {/* Building Tab */}
                                    <TabsContent value="building">
                                        <div className="grid grid-cols-12 gap-6 p-4">
                                            <div className="col-span-12 md:col-span-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="image" className="text-base">
                                                        Building Photo
                                                    </Label>
                                                    {!currentBuilding && <span className="text-[0.8rem] text-muted-foreground">Required *</span>}
                                                </div>

                                                <div className={`group relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300 
                            ${errors.image ? 'ring-2 ring-destructive' : 'hover:ring-2 hover:ring-ring'} 
                            bg-muted/50`}>
                                                    <input
                                                        id="building-image-upload"
                                                        type="file"
                                                        accept="image/png, image/jpeg, image/jpg"
                                                        onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                                        className="hidden"
                                                    />
                                                    <label htmlFor="building-image-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                        {data.image || currentBuilding?.image ? (
                                                            <div className="relative w-full h-full group">
                                                                <img
                                                                    src={data.image
                                                                        ? URL.createObjectURL(data.image)
                                                                        : `/storage/${currentBuilding?.image}`}
                                                                    alt="Building preview"
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
                                                                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                                                                </div>
                                                                <p className="text-sm font-medium text-muted-foreground mb-1">Drag & drop or click to upload</p>
                                                                <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 2MB)</p>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                                {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
                                            </div>

                                            <div className="col-span-12 md:col-span-7 space-y-6">
                                                <div className="grid gap-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="name" className="text-base">
                                                                Building Name
                                                            </Label>
                                                            <span className="text-[0.8rem] text-muted-foreground">Required *</span>
                                                        </div>
                                                        <Input
                                                            id="name"
                                                            value={data.name}
                                                            onChange={(e) => setData('name', e.target.value)}
                                                            className={`h-11 ${errors.name ? 'ring-2 ring-destructive' : ''}`}
                                                            placeholder="Enter building name"
                                                            required
                                                        />
                                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="description" className="text-base">
                                                            Description
                                                        </Label>
                                                        <Textarea
                                                            id="description"
                                                            value={data.description}
                                                            onChange={(e) => setData('description', e.target.value)}
                                                            rows={4}
                                                            className="resize-none"
                                                            placeholder="Enter building description..."
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="location_link" className="text-base">
                                                            Location URL
                                                        </Label>
                                                        <Input
                                                            id="location_link"
                                                            value={data.location_link}
                                                            onChange={(e) => setData('location_link', e.target.value)}
                                                            type="url"
                                                            placeholder="https://maps.google.com/..."
                                                            className="h-11"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Owner Tab */}
                                    <TabsContent value="owner">
                                        <div className="grid grid-cols-12 gap-6 p-4">
                                            <div className="col-span-12 md:col-span-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="owner-photo" className="text-base">
                                                        Owner Photo
                                                    </Label>
                                                    {!currentBuilding && <span className="text-[0.8rem] text-muted-foreground">Required *</span>}
                                                </div>

                                                <div className={`group relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300 
                            ${errors['owner.photo'] ? 'ring-2 ring-destructive' : 'hover:ring-2 hover:ring-ring'} 
                            bg-muted/50`}>
                                                    <input
                                                        id="owner-photo-upload"
                                                        type="file"
                                                        accept="image/png, image/jpeg, image/jpg"
                                                        onChange={(e) => setData('owner', {
                                                            ...data.owner,
                                                            photo: e.target.files?.[0] || null
                                                        })}
                                                        className="hidden"
                                                    />
                                                    <label htmlFor="owner-photo-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                        {data.owner.photo || currentBuilding?.owner.photo ? (
                                                            <div className="relative w-full h-full group">
                                                                <img
                                                                    src={data.owner.photo
                                                                        ? URL.createObjectURL(data.owner.photo)
                                                                        : `/storage/${currentBuilding?.owner.photo}`}
                                                                    alt="Owner preview"
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
                                                                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                                                                </div>
                                                                <p className="text-sm font-medium text-muted-foreground mb-1">Drag & drop or click to upload</p>
                                                                <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 2MB)</p>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                                {errors['owner.photo'] && <p className="text-sm text-destructive">{errors['owner.photo']}</p>}
                                            </div>

                                            <div className="col-span-12 md:col-span-7 space-y-6">
                                                <div className="grid gap-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="owner-name" className="text-base">
                                                                Owner Name
                                                            </Label>
                                                            <span className="text-[0.8rem] text-muted-foreground">Required *</span>
                                                        </div>
                                                        <Input
                                                            id="owner-name"
                                                            value={data.owner.name}
                                                            onChange={(e) => setData('owner', {
                                                                ...data.owner,
                                                                name: e.target.value
                                                            })}
                                                            className={`h-11 ${errors['owner.name'] ? 'ring-2 ring-destructive' : ''}`}
                                                            placeholder="Enter owner name"
                                                            required
                                                        />
                                                        {errors['owner.name'] && <p className="text-sm text-destructive">{errors['owner.name']}</p>}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="owner-email" className="text-base">
                                                            Email
                                                        </Label>
                                                        <Input
                                                            id="owner-email"
                                                            value={data.owner.email}
                                                            onChange={(e) => setData('owner', {
                                                                ...data.owner,
                                                                email: e.target.value
                                                            })}
                                                            type="email"
                                                            className={`h-11 ${errors['owner.email'] ? 'ring-2 ring-destructive' : ''}`}
                                                            placeholder="owner@example.com"
                                                            required
                                                        />
                                                        {errors['owner.email'] && <p className="text-sm text-destructive">{errors['owner.email']}</p>}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="owner-phone" className="text-base">
                                                            Phone Number
                                                        </Label>
                                                        <Input
                                                            id="owner-phone"
                                                            value={data.owner.phone}
                                                            onChange={(e) => setData('owner', {
                                                                ...data.owner,
                                                                phone: e.target.value
                                                            })}
                                                            placeholder="+1 (555) 000-0000"
                                                            className="h-11"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Doorman Tab */}

                                    <TabsContent value="doorman" className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg font-semibold">Doormen Management</h3>

                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setData('doormen', [...data.doormen, {
                                                            name: '',
                                                            photo: null,
                                                            email: '',
                                                            phone: '',
                                                            shift: 'morning',
                                                        }]);
                                                    }}
                                                    //disabled={data.doormen.length >= 5}
                                                    variant="default"
                                                    className="gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Doorman
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {data.doormen.map((doorman, index) => (
                                                    <div key={index} className="bg-card border rounded-lg p-4 space-y-4 shadow-sm relative">
                                                        <div className="absolute top-2 right-2 z-[9999]">
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                className="w-8 h-8"
                                                                onClick={() => {
                                                                    const newDoormen = [...data.doormen];
                                                                    newDoormen.splice(index, 1);
                                                                    setData('doormen', newDoormen);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4 " />
                                                            </Button>
                                                        </div>

                                                        {/* Photo Upload */}
                                                        <div className="space-y-2">

                                                            <div className={`group relative aspect-square w-full rounded-lg border-2 border-dashed ${errors[`doormen.${index}.photo`] ? 'border-destructive' : 'border-muted'
                                                                } transition-colors hover:border-primary`}>
                                                                <input
                                                                    id={`doorman-photo-${index}`}
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const newDoormen = [...data.doormen];
                                                                        newDoormen[index].photo = e.target.files?.[0] || null;
                                                                        setData('doormen', newDoormen);
                                                                    }}
                                                                    className="hidden"
                                                                />
                                                                <label
                                                                    htmlFor={`doorman-photo-${index}`}
                                                                    className="flex flex-col items-center justify-center h-full w-full cursor-pointer p-4"
                                                                >
                                                                    {doorman.photo || currentBuilding?.doormen[index]?.photo ? (
                                                                        <img
                                                                            src={doorman.photo
                                                                                ? URL.createObjectURL(doorman.photo)
                                                                                : `/storage/${currentBuilding?.doormen[index]?.photo}`}
                                                                            alt="Preview"
                                                                            className="w-full h-full object-cover rounded-md"
                                                                        />
                                                                    ) : (
                                                                        <div className="text-center space-y-2">
                                                                            <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                                                                            <p className="text-sm text-muted-foreground">Click to upload</p>
                                                                            <p className="text-xs text-muted-foreground">Recommended: 400x400px</p>
                                                                        </div>
                                                                    )}
                                                                </label>
                                                            </div>
                                                            {errors[`doormen.${index}.photo`] && (
                                                                <p className="text-xs text-destructive">{errors[`doormen.${index}.photo`]}</p>
                                                            )}
                                                        </div>

                                                        {/* Form Fields */}
                                                        <div className="space-y-2">
                                                            <Input
                                                                placeholder="Full Name"
                                                                value={doorman.name}
                                                                onChange={(e) => {
                                                                    const newDoormen = [...data.doormen];
                                                                    newDoormen[index].name = e.target.value;
                                                                    setData('doormen', newDoormen);
                                                                }}
                                                                className="h-11"
                                                            />
                                                            <Input
                                                                type="email"
                                                                placeholder="Email address"
                                                                value={doorman.email}
                                                                onChange={(e) => {
                                                                    const newDoormen = [...data.doormen];
                                                                    newDoormen[index].email = e.target.value;
                                                                    setData('doormen', newDoormen);
                                                                }}
                                                                className="h-11"
                                                            />
                                                            <Input
                                                                placeholder="Phone number"
                                                                value={doorman.phone}
                                                                onChange={(e) => {
                                                                    const newDoormen = [...data.doormen];
                                                                    newDoormen[index].phone = e.target.value;
                                                                    setData('doormen', newDoormen);
                                                                }}
                                                                className="h-11"
                                                            />
                                                            <div className="space-y-2">

                                                                <Select
                                                                    value={doorman.shift}
                                                                    onValueChange={(value) => {
                                                                        const newDoormen = [...data.doormen];
                                                                        newDoormen[index].shift = value as 'morning' | 'afternoon' | 'night';
                                                                        setData('doormen', newDoormen);
                                                                    }}

                                                                >
                                                                    <SelectTrigger className="w-full h-11">
                                                                        <SelectValue placeholder="Select work shift" />
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
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                </Tabs>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-4 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-11"
                                    >
                                        {processing
                                            ? (currentBuilding ? 'Updating...' : 'Creating...')
                                            : (currentBuilding ? 'Update Building' : 'Create Building')}
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
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the building <strong>{currentBuilding?.name}</strong>?
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

                {/* Location Modal */}
                <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
                    <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle>Location of {currentBuilding?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="w-full aspect-video">
                            <iframe
                                src={getEmbedUrl(currentBuilding?.location_link || '')}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Pagination para vista de cuadrícula */}
                {viewMode === 'grid' && buildings.data.length > 0 && (
                    <Pagination links={buildings.links} meta={buildings.meta} />
                )}
            </div>
        </AppLayout>
    );
}

// Componente StatusBadge
const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
        {status === 'active' ? 'Active' : 'Inactive'}
    </span>
);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Buildings', href: '/buildings' }
];