// pages/Apartments/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    LayoutGrid, Plus, Edit, Trash2, ChevronRight, Laptop, UploadCloud, 
    ChevronDown, ChevronLeft, Search, Filter, FileSpreadsheet, 
    Download, Users, MapPin, Mail, Phone, Crown, Shield, MapPinIcon,
    Building2, UserCheck
} from 'lucide-react';
import * as XLSX from 'exceljs';
import { saveAs } from 'file-saver';
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
    Table as TableComponent,
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
import { BuildingCombobox } from './ComboBox';
import { Tenant } from '@/types/models/Tenant';
import { TenantForm } from './TenantForm';
import { Apartment } from '@/types/models/Apartment';
import _ from 'lodash';

// Extend Tenant type to include additional properties used in this component
interface ExtendedTenant extends Tenant {
    devices?: Array<{ id: number; name: string }>;
    shared_devices?: Array<{ id: number; name: string }>;
}

// Extend Apartment type to include tenants with extended properties
interface ExtendedApartment extends Omit<Apartment, 'tenants'> {
    tenants?: ExtendedTenant[];
}

// Add CSS animations for enhanced UX
const styles = `
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideRight {
    from {
        transform: translateX(-100%);
    }
    to {
        transform: translateX(100%);
    }
}

.border-3 {
    border-width: 3px;
}

.animate-pulse-soft {
    animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-soft {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.8;
    }
}

/* Animación de entrada suave para las cards */
@keyframes cardEntrance {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.card-entrance {
    animation: cardEntrance 0.5s ease-out forwards;
}
`;

// Inject styles into head
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

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
    const { auth } = usePage<SharedData>().props;
  
    // Debug inicial
    console.log('=== COMPONENT RENDERED ===');
    console.log('Apartments data:', apartments);
    console.log('Building info:', usePage().props);
    console.log('=== END COMPONENT DEBUG ===');

    // Estados para la tabla
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState('');
  
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
    const [initialFormData, setInitialFormData] = useState<typeof data | undefined>();
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [mapKey, setMapKey] = useState(0); // Para forzar re-render del mapa

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

    // Efecto para forzar re-render del mapa cuando cambie el building
    useEffect(() => {
        console.log('=== BUILDING CHANGED IN USEEFFECT ===');
        console.log('Building ID:', building.id);
        console.log('Building name:', building.name);
        console.log('Building location_link:', building.location_link);
        console.log('Full building object:', building);
        setMapKey(prev => {
            console.log('MapKey changed from', prev, 'to', prev + 1);
            return prev + 1;
        });
        console.log('=== END BUILDING CHANGE ===');
    }, [building]);

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

        post(route('buildings.apartments.store', building), formData, {
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

    const handleShowDevices = (apartment: Apartment, tenant: ExtendedTenant) => {
        setSelectedApartment(apartment);
        setSelectedTenant(tenant);
        setSelectedDevices(tenant.devices || []);
        setSelectedShareDevices(tenant.shared_devices || []);
        setShowDevicesModal(true);
    };

    const getEmbedUrl = (locationLink: string): string => {
    console.log('=== GENERATING EMBED URL ===');
    console.log('Input location_link:', locationLink);
    console.log('Building ID:', building?.id);
    console.log('Google Maps API Key:', googleMapsApiKey ? 'Present' : 'Missing');

    if (!locationLink?.trim()) {
        console.warn('No location link provided');
        return '';
    }

    if (!googleMapsApiKey) {
        console.warn('No Google Maps API Key provided');
        return '';
    }

    const cleanedLink = locationLink.trim();

    // Si ya es un embed URL válido
    if (cleanedLink.includes('/embed')) {
        console.log('Using existing embed URL:', cleanedLink);
        return cleanedLink;
    }

    // Coordenadas directas "lat, lng"
    const coordsDirectMatch = cleanedLink.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordsDirectMatch) {
        const lat = parseFloat(coordsDirectMatch[1]);
        const lng = parseFloat(coordsDirectMatch[2]);

        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            // Usar /v1/place con coordenadas para mostrar el PIN/MARCADOR
            const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${lat},${lng}&zoom=17`;
            console.log('Generated embed URL for coordinates WITH PIN:', embedUrl);
            return embedUrl;
        } else {
            console.warn('Invalid coordinates:', { lat, lng });
        }
    }

    // Enlace acortado (maps.app.goo.gl o goo.gl/maps) — solo se puede usar como búsqueda
    if (/maps\.app\.goo\.gl|goo\.gl\/maps/.test(cleanedLink)) {
        const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(cleanedLink)}`;
        console.log('Generated embed URL for short link (fallback as search):', embedUrl);
        return embedUrl;
    }

    // URL de Google Maps completa
    if (cleanedLink.includes('google.com/maps')) {
        // Extraer el parámetro pb si existe
        const pbMatch = cleanedLink.match(/pb=([^&]+)/);
        if (pbMatch) {
            const embedUrl = `https://www.google.com/maps/embed?pb=${pbMatch[1]}`;
            console.log('Generated embed URL from pb parameter:', embedUrl);
            return embedUrl;
        }

        // Extraer coordenadas del patrón @lat,lng,zoom
        const coordsMatch = cleanedLink.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordsMatch) {
            const lat = parseFloat(coordsMatch[1]);
            const lng = parseFloat(coordsMatch[2]);

            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                // Usar /v1/place con coordenadas para mostrar el PIN/MARCADOR
                const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${lat},${lng}&zoom=17`;
                console.log('Generated embed URL from @ coordinates WITH PIN:', embedUrl);
                return embedUrl;
            }
        }

        // Buscar place ID
        const placeIdMatch = cleanedLink.match(/place\/([^/?#]+)/);
        if (placeIdMatch) {
            const placeId = placeIdMatch[1];
            const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&place_id=${placeId}`;
            console.log('Generated embed URL for place ID:', embedUrl);
            return embedUrl;
        }
    }

    // Fallback: tratar como dirección
    const fallbackEmbed = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(cleanedLink)}`;
    console.log('Fallback embed URL (address or query):', fallbackEmbed);
    return fallbackEmbed;
};


    const toggleStatus = async (apartment: Apartment) => {
        setIsUpdatingStatus(apartment.id);
        try {
            router.put(
                route('apartments.update-status', apartment.id),
                { status: !apartment.status },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Status updated successfully');
                    },
                    onError: (errors) => {
                        console.error('Error updating status:', errors);
                        toast.error('Error updating status');
                    },
                    onFinish: () => {
                        setIsUpdatingStatus(null);
                    }
                }
            );
        } catch (error) {
            console.error('Connection error:', error);
            toast.error('Connection error');
            setIsUpdatingStatus(null);
        }
    };

    const handleBulkUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkFile) {
            toast.error('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', bulkFile);

        setIsBulkUploading(true);
        
        router.post(route('buildings.apartments.bulk-upload', building.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowBulkUploadModal(false);
                setBulkFile(null);
                toast.success('Apartments uploaded successfully');
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error as string));
            },
            onFinish: () => {
                setIsBulkUploading(false);
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                toast.error('Please select an Excel file (.xlsx or .xls)');
                return;
            }
            setBulkFile(file);
        }
    };

    const downloadTemplate = () => {
        // Descarga directa del archivo estático
        const link = document.createElement('a');
        link.href = '/resources/apartments_template.xlsx';
        link.download = 'apartments_template.xlsx';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Definición de columnas para la tabla
    const columns: ColumnDef<Apartment>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start hover:bg-transparent"
                    >
                        Apartment
                        {column.getIsSorted() === "asc" ? (
                            <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4 opacity-20" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        },
        {
            id: "tenants_count",
            accessorFn: (row) => row.tenants?.length || 0,
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start hover:bg-transparent"
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Members
                        {column.getIsSorted() === "asc" ? (
                            <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4 opacity-20" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const apartment = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                            <Users className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{apartment.tenants?.length || 0}</span>
                        <span className="text-muted-foreground text-sm">members</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "ubicacion",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start hover:bg-transparent"
                    >
                        <MapPin className="mr-2 h-4 w-4" />
                        Location
                        {column.getIsSorted() === "asc" ? (
                            <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4 opacity-20" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate">
                    {row.getValue("ubicacion") || "No location specified"}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start hover:bg-transparent"
                    >
                        Status
                        {column.getIsSorted() === "asc" ? (
                            <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4 opacity-20" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const apartment = row.original;
                return (
                    <Switch
                        checked={apartment.status}
                        disabled={isUpdatingStatus === apartment.id}
                        onCheckedChange={() => toggleStatus(apartment)}
                        className="data-[state=checked]:bg-green-500"
                    />
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const apartment = row.original;
                return (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(apartment)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(apartment)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    // Configuración de la tabla
    const table = useReactTable({
        data: apartments.data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    });

    // Funciones para exportar datos
    const exportToCSV = () => {
        const visibleColumns = table.getAllColumns()
            .filter(column => column.getIsVisible() && column.id !== 'actions')
            .map(column => ({
                id: column.id,
                header: typeof column.columnDef.header === 'string' 
                    ? column.columnDef.header 
                    : column.id.charAt(0).toUpperCase() + column.id.slice(1)
            }));

        const headers = visibleColumns.map(col => col.header).join(',') + '\n';

        const rows = table.getFilteredRowModel().rows.map(row => {
            return visibleColumns.map(column => {
                const value = row.getValue(column.id);
                // Formatear valores para CSV
                if (column.id === 'status') {
                    return row.original.status ? 'Active' : 'Inactive';
                }
                if (column.id === 'tenants_count') {
                    return row.original.tenants?.length || 0;
                }
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || '';
            })
            .join(',');
        }).join('\n');

        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `apartments_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('CSV exported successfully!');
    };

    const exportToExcel = async () => {
        try {
            // Create a new workbook
            const workbook = new XLSX.Workbook();
            const worksheet = workbook.addWorksheet('Apartments');
            
            // Get visible columns
            const visibleColumns = table.getAllColumns()
                .filter(column => column.getIsVisible() && column.id !== 'actions')
                .map(column => ({
                    id: column.id,
                    header: typeof column.columnDef.header === 'string' 
                        ? column.columnDef.header 
                        : column.id.charAt(0).toUpperCase() + column.id.slice(1)
                }));

            // Add headers
            const headerRow = worksheet.addRow(visibleColumns.map(col => col.header));
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Add data rows
            table.getFilteredRowModel().rows.forEach(row => {
                const rowData = visibleColumns.map(column => {
                    const value = row.getValue(column.id);
                    // Format values for Excel
                    if (column.id === 'status') {
                        return row.original.status ? 'Active' : 'Inactive';
                    }
                    if (column.id === 'tenants_count') {
                        return row.original.tenants?.length || 0;
                    }
                    return value || '';
                });
                worksheet.addRow(rowData);
            });

            // Auto-fit columns
            worksheet.columns.forEach(column => {
                if (column.header) {
                    column.width = Math.max(
                        column.header.toString().length,
                        ...worksheet.getColumn(column.number!).values
                            .slice(1)
                            .map(v => v?.toString().length || 0)
                    ) + 2;
                }
            });

            // Add borders to all cells
            worksheet.eachRow({ includeEmpty: false }, (row) => {
                row.eachCell({ includeEmpty: false }, (cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

            // Generate buffer and save
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            saveAs(blob, `apartments_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Excel file exported successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Error exporting to Excel. Please try again.');
        }
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
                            onChange={(id) => {
                                console.log('=== BUILDING COMBOBOX ONCHANGE CALLED ===');
                                console.log('New building ID:', id);
                                console.log('Current building ID:', building.id);
                                console.log('Route that will be called:', route('buildings.apartments', id));
                                console.log('=== CALLING ROUTER.VISIT ===');
                                router.visit(route('buildings.apartments', id));
                            }}
                           
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
                        <Button
                            onClick={() => setShowBulkUploadModal(true)}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <UploadCloud className="w-5 h-5" />
                            <span className="hidden sm:block">Bulk Upload</span>
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
                                    <TabsTrigger value="tenant">Members</TabsTrigger>
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
                                <DialogTitle>Do you have unsaved changes?</DialogTitle>
                                <DialogDescription>
                                You have pending changes to the form. Are you sure you want to exit without saving?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowConfirmClose(false)}>
                                    Cancel
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
                                    Discard changes
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
                            tenantName={selectedTenant || undefined}
                            devices={selectedDevices as any}
                            shareDevice={selectedShareDevices as any}
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

                {/* Bulk Upload Modal */}
                <Dialog open={showBulkUploadModal} onOpenChange={setShowBulkUploadModal}>
                    <DialogContent className="w-full max-w-md">
                        <DialogHeader>
                            <DialogTitle>Bulk Upload Apartments</DialogTitle>
                            <DialogDescription>
                                Upload an Excel file with apartments and their members information
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleBulkUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="excel-file">
                                    Excel File <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="excel-file"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="h-11 mt-2"
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    Supported formats: .xlsx, .xls
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">Excel Format Required:</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• <strong>apartment:</strong> Apartment name</li>
                                    <li>• <strong>name:</strong> Member name</li>
                                    <li>• <strong>email:</strong> Member email</li>
                                    <li>• <strong>phone:</strong> Member phone</li>
                                </ul>
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                    <p className="text-yellow-800">
                                        <strong>Limitations:</strong> Maximum 1000 rows, 10MB file size
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-blue-600 p-0 h-auto mt-2"
                                    onClick={downloadTemplate}
                                >
                                    Download Template
                                </Button>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowBulkUploadModal(false)}
                                    disabled={isBulkUploading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isBulkUploading || !bulkFile}
                                >
                                    {isBulkUploading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Uploading...
                                        </div>
                                    ) : (
                                        'Upload'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
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
                                <Card className="overflow-hidden !p-0 border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl group bg-gradient-to-br from-white to-primary/5">
                                    <CardContent className="p-0">
                                        {/* Header con gradiente mejorado */}
                                        <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 p-4 border-b border-primary/10 relative overflow-hidden">
                                            <div className="flex items-center gap-2 text-primary relative z-10">
                                                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
                                                    <Crown className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-sm">Building Owner</span>
                                            </div>
                                            {/* Decorative gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        </div>
                                        
                                        {/* Contenido principal mejorado */}
                                        <div className="p-6">
                                            <div className="flex items-start gap-5">
                                                <div className="relative">
                                                    <div className="relative">
                                                        <img
                                                            src={`/storage/${building.owner.photo}`}
                                                            alt={building.owner.name}
                                                            className="w-20 h-20 rounded-full object-cover border-3 border-primary/30 shadow-lg group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-xl"
                                                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                e.currentTarget.src = '/images/default-user.png';
                                                            }}
                                                        />
                                                        {/* Ring animado */}
                                                        <div className="absolute inset-0 rounded-full border-2 border-primary/40 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"></div>
                                                    </div>
                                                    
                                                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                        <Crown className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">{building.owner.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                            <p className="text-sm text-muted-foreground font-semibold">Property Owner</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3 text-sm group/item hover:bg-primary/5 p-3 rounded-lg transition-all duration-300 cursor-pointer border border-transparent hover:border-primary/20">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover/item:from-blue-200 group-hover/item:to-blue-300 transition-all duration-300 group-hover/item:scale-110">
                                                                <Mail className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <span className="text-muted-foreground group-hover/item:text-primary font-medium flex-1">{building.owner.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm group/item hover:bg-primary/5 p-3 rounded-lg transition-all duration-300 cursor-pointer border border-transparent hover:border-primary/20">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center group-hover/item:from-green-200 group-hover/item:to-green-300 transition-all duration-300 group-hover/item:scale-110">
                                                                <Phone className="w-4 h-4 text-green-600" />
                                                            </div>
                                                            <span className="text-muted-foreground group-hover/item:text-primary font-medium flex-1">{building.owner.phone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {building.doormen && building.doormen.length > 0 && (
                                <div className="space-y-4 w-full">
                                    {/* Header mejorado */}
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Shield className="w-5 h-5" />
                                            <h3 className="text-lg font-bold">Doormen</h3>
                                        </div>
                                        <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent"></div>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full font-medium">
                                            {building.doormen.length} {building.doormen.length === 1 ? 'Guard' : 'Guards'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {building.doormen.map((doorman, index) => (
                                            <Card 
                                                key={doorman.id} 
                                                className="group !p-0 overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50"
                                                style={{
                                                    animationDelay: `${index * 150}ms`,
                                                }}
                                            >
                                                <CardContent className="p-4">
                                                    {/* Avatar con badge de estado */}
                                                    <div className="relative mb-4">
                                                        <div className="relative">
                                                            <img
                                                                src={`/storage/${doorman.photo}`}
                                                                alt={doorman.name}
                                                                className="w-full aspect-square rounded-full object-cover border-3 border-primary/20 group-hover:border-primary/50 transition-all duration-300 shadow-lg group-hover:shadow-xl"
                                                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                    e.currentTarget.src = '/images/default-user.png';
                                                                }}
                                                            />
                                                            {/* Ring animado en hover */}
                                                            <div className="absolute inset-0 rounded-full border-2 border-primary/30 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"></div>
                                                        </div>
                                                        
                                                      
                                                        
                                                      
                                                    </div>
                                                    
                                                    {/* Información del portero */}
                                                    <div className="text-center space-y-2">
                                                        <h4 className="text-sm font-bold text-primary line-clamp-1 group-hover:text-primary/80 transition-colors">
                                                            {doorman.name}
                                                        </h4>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${
                                                                doorman.shift.toLowerCase().includes('morning') || doorman.shift.toLowerCase().includes('day') 
                                                                    ? 'bg-yellow-400' 
                                                                    : doorman.shift.toLowerCase().includes('night') 
                                                                    ? 'bg-purple-500'
                                                                    : 'bg-orange-400'
                                                            }`}></div>
                                                            <p className="text-xs font-semibold text-muted-foreground">{doorman.shift}</p>
                                                        </div>
                                                        
                                                        
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {building.location_link && (
                                <Card className="overflow-hidden !p-0 border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl group bg-gradient-to-br from-white to-blue-50/30">
                                    {/* Header del mapa mejorado */}
                                    <div className="bg-gradient-to-r from-blue-50 via-primary/10 to-blue-50 p-4 border-b border-primary/10 relative overflow-hidden">
                                        <div className="flex items-center gap-2 text-primary relative z-10">
                                            <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
                                                <MapPinIcon className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-sm">Building Location</span>
                                        </div>
                                        {/* Decorative moving gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full duration-1000"></div>
                                    </div>
                                    
                                    {/* Contenedor del mapa mejorado */}
                                    <div className="relative overflow-hidden">
                                        <div className="aspect-video relative">
                                            {(() => {
                                                console.log('=== RENDERING IFRAME ===');
                                                console.log('Building location_link:', building.location_link);
                                                console.log('Generated iframe src:', getEmbedUrl(building?.location_link || ''));
                                                console.log('Iframe key:', `map-${building.id}-${mapKey}`);
                                                console.log('=== END IFRAME RENDER ===');
                                                return null;
                                            })()}
                                            <iframe
                                                key={`map-${building.id}-${mapKey}`}
                                                src={getEmbedUrl(building?.location_link || '')}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                allowFullScreen
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                className="group-hover:scale-105 transition-transform duration-700 ease-out"
                                                onLoad={() => console.log('Iframe loaded successfully')}
                                                onError={() => console.log('Iframe failed to load')}
                                            />
                                        </div>
                                        
                                        {/* Overlay con efectos mejorados */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        
                                        {/* Corner accent */}
                                        <div className="absolute top-3 right-3 w-3 h-3 bg-primary/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150"></div>
                                        <div className="absolute bottom-3 left-3 w-2 h-2 bg-blue-500/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-125"></div>
                                    </div>
                                </Card>
                            )}

                        </div>
                        <div className='lg:w-8/12 flex flex-col'>
                            {/* Advanced Table Controls */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search apartments, members, locations..."
                                            value={globalFilter ?? ""}
                                            onChange={(event) => setGlobalFilter(event.target.value)}
                                            className="pl-10 w-80"
                                        />
                                    </div>
                                    <div className="hidden sm:block text-sm text-muted-foreground">
                                        {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} entries
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Filter className="mr-2 h-4 w-4" />
                                                Columns <ChevronDown className="ml-1 h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
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
                                                        {column.id.replace(/_/g, ' ')}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                Export <ChevronDown className="ml-1 h-4 w-4" />
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
                                </div>
                            </div>

                            {/* Advanced Data Table */}
                            <div className="rounded-md border">
                                <TableComponent>
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
                                                <ApartmentRowExpanded
                                                    key={row.id}
                                                    row={row}
                                                    handleShowDevices={handleShowDevices}
                                                />
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={columns.length}
                                                    className="h-24 text-center"
                                                >
                                                    No results found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </TableComponent>
                            </div>

                            {/* Enhanced Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/20">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>
                                        Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                                        {Math.min(
                                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                            table.getFilteredRowModel().rows.length
                                        )}{' '}
                                        of {table.getFilteredRowModel().rows.length} entries
                                        {table.getFilteredRowModel().rows.length !== table.getCoreRowModel().rows.length && (
                                            <span className="text-primary font-medium">
                                                (filtered from {table.getCoreRowModel().rows.length} total)
                                            </span>
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Rows per page:</span>
                                        <select
                                            value={table.getState().pagination.pageSize}
                                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                                            className="border rounded px-2 py-1 text-sm bg-background"
                                        >
                                            {[10, 20, 30, 40, 50].map(pageSize => (
                                                <option key={pageSize} value={pageSize}>
                                                    {pageSize}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.setPageIndex(0)}
                                            disabled={!table.getCanPreviousPage()}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <ChevronLeft className="h-4 w-4 -ml-2" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.previousPage()}
                                            disabled={!table.getCanPreviousPage()}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm text-muted-foreground">Page</span>
                                            <input
                                                type="number"
                                                value={table.getState().pagination.pageIndex + 1}
                                                onChange={(e) => {
                                                    const page = e.target.value ? Number(e.target.value) - 1 : 0;
                                                    table.setPageIndex(page);
                                                }}
                                                className="w-12 h-8 text-center border rounded text-sm bg-background"
                                                min="1"
                                                max={table.getPageCount()}
                                            />
                                            <span className="text-sm text-muted-foreground">of {table.getPageCount()}</span>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                            disabled={!table.getCanNextPage()}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                            <ChevronRight className="h-4 w-4 -ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}



// Definir tipos para mejor TypeScript
interface TableCell {
    id: string;
    column: { 
        id: string; 
        columnDef: { 
            cell: (context: unknown) => React.ReactNode; 
        } 
    };
    getContext: () => unknown;
}

interface ApartmentRowExpandedProps {
    row: {
        id: string;
        original: Apartment;
        getIsSelected: () => boolean;
        getVisibleCells: () => Array<{
            id: string;
            column: { id: string; columnDef: { cell?: (context: unknown) => React.ReactNode } };
            getContext: () => unknown;
        }>;
    };
    handleShowDevices: (apartment: Apartment, tenant: ExtendedTenant) => void;
}

// Componente de fila expandible para la tabla avanzada
const ApartmentRowExpanded = ({ row, handleShowDevices }: ApartmentRowExpandedProps) => {
    const [expanded, setExpanded] = useState(false);
    const apartment = row.original;

    return (
        <>
            <TableRow 
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-muted/50 transition-colors group"
            >
                {row.getVisibleCells().map((cell) => {
                    // Special handling for the members count cell to add expand functionality
                    if (cell.column.id === 'tenants_count') {
                        return (
                            <TableCell key={cell.id}>
                                <div 
                                    className="cursor-pointer hover:bg-muted/70 p-3 rounded-lg transition-all duration-200 group-hover:bg-muted/30" 
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Enhanced expand/collapse icon */}
                                        <div className={`
                                            flex items-center justify-center w-8 h-8 rounded-full 
                                            bg-gradient-to-br from-primary/10 to-primary/20 
                                            border border-primary/20 transition-all duration-300 
                                            hover:from-primary/20 hover:to-primary/30 hover:border-primary/30
                                            hover:scale-110 hover:shadow-md
                                            ${expanded ? 'bg-gradient-to-br from-primary/20 to-primary/30 border-primary/40 shadow-sm' : ''}
                                        `}>
                                            <ChevronRight className={`
                                                w-4 h-4 text-primary transition-all duration-300 ease-in-out
                                                ${expanded ? 'rotate-90 scale-110' : 'hover:scale-105'}
                                            `} />
                                        </div>
                                        
                                        {/* Enhanced member count display */}
                                        <div className="flex items-center gap-2">
                                            <div className={`
                                                flex items-center justify-center w-6 h-6 rounded-full 
                                                bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700
                                                transition-all duration-200 hover:from-blue-200 hover:to-blue-300
                                            `}>
                                                <Users className="w-3 h-3" />
                                            </div>
                                            <span className="font-semibold text-primary">{apartment.tenants?.length || 0}</span>
                                            <span className="text-muted-foreground text-sm font-medium">
                                                {apartment.tenants?.length === 1 ? 'member' : 'members'}
                                            </span>
                                        </div>
                                        
                                        {/* Subtle indicator for expandable content */}
                                        {apartment.tenants && apartment.tenants.length > 0 && (
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                                    {expanded ? 'Click to collapse' : 'Click to expand'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                        );
                    }
                    
                    return (
                        <TableCell key={cell.id}>
                            {cell.column.columnDef.cell ? flexRender(cell.column.columnDef.cell, cell.getContext() as object) : null}
                        </TableCell>
                    );
                })}
            </TableRow>
            
            {/* Expanded members details row with enhanced animation */}
            {expanded && apartment.tenants && apartment.tenants.length > 0 && (
                <TableRow className="border-b bg-gradient-to-r from-muted/10 to-muted/30">
                    <TableCell colSpan={5} className="p-6">
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <div className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full"></div>
                                <Users className="w-4 h-4 text-primary" />
                                <span>Apartment Members ({apartment.tenants?.length || 0})</span>
                            </div>
                            
                            <div className="grid gap-4">
                                {apartment.tenants?.map((tenant: ExtendedTenant, index: number) => (
                                    <div 
                                        key={tenant.id} 
                                        className="flex items-center justify-between gap-4 p-5 bg-background rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:border-primary/20 group/member"
                                        style={{ 
                                            animationDelay: `${index * 100}ms`,
                                            animation: 'fadeInUp 0.4s ease-out forwards'
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img
                                                    src={`/storage/${tenant.photo}`}
                                                    alt={tenant.name}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/20 shadow-sm group-hover/member:border-primary/40 transition-all duration-200"
                                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                        e.currentTarget.src = '/images/default-user.png';
                                                    }}
                                                />
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-primary text-lg">{tenant.name}</h4>
                                                    <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/20 text-primary text-xs font-medium rounded-full border border-primary/20">
                                                        Member
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <Mail className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                        <span className="font-medium">{tenant.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                                            <Phone className="w-3 h-3 text-green-600" />
                                                        </div>
                                                        <span className="font-medium">{tenant.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2 hover:bg-primary hover:text-white transition-all duration-300 border-primary/20 hover:border-primary group-hover/member:border-primary/40"
                                                onClick={() => handleShowDevices(apartment, tenant)}
                                            >
                                                <Laptop className="w-4 h-4" />
                                                <span className="font-bold text-base">
                                                    {Number(tenant.devices?.length || 0) + Number(tenant.shared_devices?.length || 0)}
                                                </span>
                                                <span className="hidden sm:inline font-medium">Devices</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Apartments', href: '/apartments' }
];