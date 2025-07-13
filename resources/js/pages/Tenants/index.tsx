// pages/Apartments/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, SharedData } from '@/types';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Plus, Edit, Trash2, ChevronRight, Laptop, UploadCloud, 
    ChevronDown, ChevronLeft, Search, Filter, FileSpreadsheet, 
    Download, Users, Mail, Phone, Crown, Shield, MapPinIcon, Ticket, KeyRound
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ModalDispositivos from './ModalDispositivos';
import { BuildingCombobox } from './ComboBox';
import { Tenant } from '@/types/models/Tenant';
import { TenantForm } from './TenantForm';
import { Apartment } from '@/types/models/Apartment';
import TicketHistoryModal from '@/components/TicketHistoryModal';
import _ from 'lodash';

// Extend Tenant type to include additional properties used in this component
interface ExtendedTenant extends Tenant {
    devices?: Array<{ id: number; name: string }>;
    shared_devices?: Array<{ id: number; name: string }>;
}

// Doorman type for building doormen
interface Doorman {
    id: number;
    name: string;
    email: string;
    phone: string;
    photo?: string;
    shift: string;
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
    filters?: {
        search: string;
        per_page: number;
        sort_by?: string;
        sort_dir?: string;
    };
}

export default function Index({ apartments, brands, models, systems, name_devices, filters }: Props) {
    // Removing unused auth
    const { auth } = usePage<SharedData>().props;
  
    // Debug inicial
    console.log('=== COMPONENT RENDERED ===');
    console.log('Apartments data:', apartments);
    console.log('Building info:', usePage().props);
    console.log('USER ROLE DEBUG:', auth.user?.role);
    console.log('USER ROLES ARRAY:', auth.user?.roles);
    console.log('IS OWNER OR DOORMAN (role):', auth.user?.role === 'owner' || auth.user?.role === 'doorman');
    console.log('IS OWNER OR DOORMAN (roles array):', auth.user?.roles?.includes('owner') || auth.user?.roles?.includes('doorman'));
    console.log('=== END COMPONENT DEBUG ===');

    // Estados para la tabla
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [isSearching, setIsSearching] = useState(false);

    // Inicializar sorting state desde URL parameters
    const [sorting, setSorting] = useState<SortingState>(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const sortBy = urlParams.get('sort_by');
            const sortDir = urlParams.get('sort_dir');
            
            if (sortBy && sortDir) {
                return [{
                    id: sortBy,
                    desc: sortDir === 'desc'
                }];
            }
        }
        // Default: ordenar por order ascendente
        return [{
            id: 'order',
            desc: false
        }];
    });
  
    // Removing unused viewMode
    // const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentApartment, setCurrentApartment] = useState<Apartment | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
    const [selectedShareDevices, setSelectedShareDevices] = useState<Device[]>([]);

    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [showTicketHistoryModal, setShowTicketHistoryModal] = useState(false);
    const [selectedTenantForTickets, setSelectedTenantForTickets] = useState<Tenant | null>(null);
    
    // Nuevos estados para crear tickets
    const [showCreateTicketDevicesModal, setShowCreateTicketDevicesModal] = useState(false);
    const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
    const [selectedTenantForTicketCreation, setSelectedTenantForTicketCreation] = useState<Apartment | null>(null);
    const [selectedDeviceForTicket, setSelectedDeviceForTicket] = useState<Device | null>(null);
    const [initialFormData, setInitialFormData] = useState<typeof data | undefined>();
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [mapKey, setMapKey] = useState(0); // Para forzar re-render del mapa
    
    // Estados para reset de contraseñas
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [showBulkResetModal, setShowBulkResetModal] = useState(false);
    const [selectedTenantForReset, setSelectedTenantForReset] = useState<Tenant | null>(null);
    const [selectedTenantsForBulkReset, setSelectedTenantsForBulkReset] = useState<number[]>([]);
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    const { building, all_buildings, googleMapsApiKey } = usePage().props as unknown as {
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

    const { data, setData, post, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        ubicacion: '',
        order: 0,
        tenants: [] as Array<{
            id?: number;
            name: string;
            email: string;
            phone: string;
            photo: File | null;
            photoPreview?: string;
        }>,
    });

    // Form para crear tickets
    const ticketForm = useForm({
        device_id: '',
        category: '',
        title: '',
        description: '',
        member_id: '',
        tenant_id: '',
        priority: 'medium',
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

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

    // Función de búsqueda con debounce
    const debouncedSearch = useCallback(
        _.debounce((searchValue: string) => {
            setIsSearching(true);
            const currentUrl = window.location.pathname + window.location.search;
            const url = new URL(currentUrl, window.location.origin);
            
            // Detecta si el input tenía el foco
            const wasFocused = document.activeElement === searchInputRef.current;

            if (searchValue.trim()) {
                url.searchParams.set('search', searchValue.trim());
            } else {
                url.searchParams.delete('search');
            }
            
            // Resetear a la primera página cuando se busca
            url.searchParams.set('page', '1');
            
            router.visit(url.toString(), {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setIsSearching(false);
                    // Restaura el foco si el usuario estaba escribiendo
                    if (wasFocused && searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                }
            });
        }, 500),
        []
    );

    // Manejar cambio en el término de búsqueda
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const hasUnsavedChanges = () => {
        return !_.isEqual(data, initialFormData);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();

        formData.append('name', data.name);
        formData.append('ubicacion', data.ubicacion);
        formData.append('order', data.order.toString());

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

        post(route('buildings.apartments.store', building.id), {
            forceFormData: true,
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                reset();
                setInitialFormData(undefined);
                setShowCreateModal(false);
                toast.success('Apartment created successfully');
            },
            onError: (errors: Record<string, string>) => {
                Object.values(errors).forEach((error: string) => toast.error(error));
            }
        });
    };

    const handleEdit = (apartment: Apartment) => {
        const initialData = {
            id: apartment.id,
            name: apartment.name,
            ubicacion: apartment.ubicacion,
            order: apartment.order || 0,
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
        formData.append('order', data.order.toString());

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
            order: 0,
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
        if (!currentApartment) {
            toast.error('No apartment selected for deletion');
            return;
        }

        console.log('=== APARTMENT DELETE DEBUG ===');
        console.log('Attempting to delete apartment:', currentApartment);
        console.log('Route:', route('apartments.destroy', currentApartment.id));
        console.log('=== END APARTMENT DELETE DEBUG ===');

        destroy(route('apartments.destroy', currentApartment.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                console.log('Apartment delete success:', page);
                setShowDeleteModal(false);
                setCurrentApartment(null);
                toast.success('Apartment deleted successfully');
            },
            onError: (errors) => {
                console.error('=== APARTMENT DELETION ERROR DETAILS ===');
                console.error('Full error object:', errors);
                console.error('Error type:', typeof errors);
                console.error('Error keys:', Object.keys(errors || {}));
                
                // Check for Laravel validation errors
                if (errors && typeof errors === 'object') {
                    const errorMessages = [];
                    
                    // Handle different error structures
                    if (errors.error) {
                        errorMessages.push(errors.error);
                    }
                    if (errors.message) {
                        errorMessages.push(errors.message);
                    }
                    if (errors.errors) {
                        Object.values(errors.errors).forEach((fieldErrors: any) => {
                            if (Array.isArray(fieldErrors)) {
                                errorMessages.push(...fieldErrors);
                            } else {
                                errorMessages.push(fieldErrors);
                            }
                        });
                    }
                    
                    if (errorMessages.length > 0) {
                        toast.error(`Error deleting apartment: ${errorMessages.join(', ')}`);
                    } else {
                        toast.error('Error deleting apartment. Unknown error format.');
                    }
                } else if (typeof errors === 'string') {
                    toast.error(`Error deleting apartment: ${errors}`);
                } else {
                    toast.error('Error deleting apartment. Check console for details.');
                }
                console.error('=== END APARTMENT DELETION ERROR ===');
            },
            onFinish: () => {
                console.log('Apartment deletion request finished');
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

    const handleShowTicketHistory = (tenant: Tenant) => {
        setSelectedTenantForTickets(tenant);
        setShowTicketHistoryModal(true);
    };

    // Nuevas funciones para crear tickets (se usan en el modal)

    const handleDeviceSelected = (device: Device) => {
        console.log('=== DEVICE SELECTED ===');
        console.log('Selected device:', device);
        console.log('Selected tenant:', selectedTenant);
        console.log('Selected apartment for ticket creation:', selectedTenantForTicketCreation);
        console.log('User roles:', auth.user?.roles);
        console.log('=== END DEVICE SELECTED ===');
        
        setSelectedDeviceForTicket(device);
        ticketForm.setData('device_id', device.id.toString());
        
        // Verificar el rol del usuario para determinar qué campo usar
        const isAdminOrTechnical = auth.user?.roles?.includes('super-admin') || auth.user?.roles?.includes('technical');
        
        if (isAdminOrTechnical) {
            // Para admin/technical usar tenant_id
            ticketForm.setData('tenant_id', selectedTenant?.id.toString() || '');
            ticketForm.setData('member_id', ''); // Limpiar member_id
        } else {
            // Para doorman/owner usar member_id
            ticketForm.setData('member_id', selectedTenant?.id.toString() || '');
            ticketForm.setData('tenant_id', ''); // Limpiar tenant_id
        }
        
        setShowCreateTicketDevicesModal(false);
        setShowCreateTicketModal(true);
    };

    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        ticketForm.post('/tickets', {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateTicketModal(false);
                ticketForm.reset();
                setSelectedTenantForTicketCreation(null);
                setSelectedDeviceForTicket(null);
                toast.success('Ticket created successfully!');
            },
            onError: () => {
                toast.error('Error creating ticket. Please try again.');
            }
        });
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
            accessorKey: "order",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start hover:bg-transparent hover:text-primary-foreground"
                    >
                        Order
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
                const order = row.getValue("order") as number;
                return (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full text-primary-foreground font-medium text-xs">
                            {order || 0}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start hover:bg-transparent hover:text-primary-foreground"
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
                        className="h-8 p-0 font-semibold text-left justify-start hover:bg-transparent  hover:text-primary-foreground"
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
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-corporate-gold/10 text-corporate-gold">
                            <Users className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{apartment.tenants?.length || 0}</span>
                        <span className="text-muted-foreground text-sm">members</span>
                    </div>
                );
            },
        },
      
        {
            accessorKey: "status",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start hover:bg-transparent  hover:text-primary-foreground"
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

    // Funciones para manejar la paginación del servidor
    const handlePageChange = (page: number) => {
        const currentUrl = window.location.pathname + window.location.search;
        const url = new URL(currentUrl, window.location.origin);
        url.searchParams.set('page', page.toString());
        router.visit(url.toString(), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Función para manejar ordenamiento del servidor
    const handleSortingChange = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
        const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;
        setSorting(newSorting);
        
        const currentUrl = window.location.pathname + window.location.search;
        const url = new URL(currentUrl, window.location.origin);
        
        if (newSorting.length > 0) {
            const sort = newSorting[0];
            url.searchParams.set('sort_by', sort.id);
            url.searchParams.set('sort_dir', sort.desc ? 'desc' : 'asc');
        } else {
            // Si no hay ordenamiento, usar orden por defecto (order asc)
            url.searchParams.set('sort_by', 'order');
            url.searchParams.set('sort_dir', 'asc');
        }
        
        // Resetear a la primera página cuando se cambia el ordenamiento
        url.searchParams.set('page', '1');
        
        router.visit(url.toString(), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Configuración de la tabla
    const table = useReactTable({
        data: apartments.data,
        columns,
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        // Deshabilitar ordenamiento del lado del cliente
        manualSorting: true,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        manualPagination: true,
        pageCount: apartments.meta.last_page,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex: apartments.meta.current_page - 1,
                pageSize: apartments.meta.per_page,
            },
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

        const rows = apartments.data.map(apartment => {
            return visibleColumns.map(column => {
                // Formatear valores para CSV
                if (column.id === 'status') {
                    return apartment.status ? 'Active' : 'Inactive';
                }
                if (column.id === 'tenants_count') {
                    return apartment.tenants?.length || 0;
                }
                if (column.id === 'name') {
                    return apartment.name;
                }
                if (column.id === 'ubicacion') {
                    return apartment.ubicacion || '';
                }
                return '';
            })
            .join(',');
        }).join('\n');

        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `apartments_${new Date().toISOString().split('T')[0]}${filters?.search ? `_${filters.search}` : ''}.csv`;
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
            apartments.data.forEach(apartment => {
                const rowData = visibleColumns.map(column => {
                    // Format values for Excel
                    if (column.id === 'status') {
                        return apartment.status ? 'Active' : 'Inactive';
                    }
                    if (column.id === 'tenants_count') {
                        return apartment.tenants?.length || 0;
                    }
                    if (column.id === 'name') {
                        return apartment.name;
                    }
                    if (column.id === 'ubicacion') {
                        return apartment.ubicacion || '';
                    }
                    return '';
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
            
            saveAs(blob, `apartments_${new Date().toISOString().split('T')[0]}${filters?.search ? `_${filters.search}` : ''}.xlsx`);
            toast.success('Excel file exported successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Error exporting to Excel. Please try again.');
        }
    };

    // Handlers para acciones de Superintendent
    const [showEditSuperintendent, setShowEditSuperintendent] = useState(false);
    const [superintendentData, setSuperintendentData] = useState<{ id: number; name: string; email: string; phone: string } | null>(null);

    const handleEditSuperintendent = (owner: { id: number; name: string; email: string; phone: string }) => {
        setSuperintendentData(owner);
        setShowEditSuperintendent(true);
    };

    const handleSuperintendentUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('owner[id]', superintendentData!.id.toString());
        formData.append('owner[name]', superintendentData!.name);
        formData.append('owner[email]', superintendentData!.email);
        formData.append('owner[phone]', superintendentData!.phone);

        router.post(route('buildings.update-owner', building.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowEditSuperintendent(false);
                toast.success('Superintendent updated!');
            },
            onError: () => {
                toast.error('Error updating superintendent');
            }
        });
    };

    // Handlers para acciones de Doormen
    const [showCreateDoorman, setShowCreateDoorman] = useState(false);
    const [showEditDoorman, setShowEditDoorman] = useState(false);
    const [showDeleteDoorman, setShowDeleteDoorman] = useState(false);
    const [doormanData, setDoormanData] = useState<Doorman | null>(null);
    const [isDoormanProcessing, setIsDoormanProcessing] = useState(false);

    const handleAddDoorman = () => {
        setDoormanData({
            id: 0,
            name: '',
            email: '',
            phone: '',
            shift: ''
        });
        setShowCreateDoorman(true);
    };

    const handleEditDoorman = (doorman: Doorman) => {
        setDoormanData(doorman);
        setShowEditDoorman(true);
    };

    const handleDeleteDoorman = (doorman: Doorman) => {
        setDoormanData(doorman);
        setShowDeleteDoorman(true);
    };

    const handleCreateDoorman = (e: React.FormEvent) => {
        e.preventDefault();
        setIsDoormanProcessing(true);
        
        // Debug: Check if doormanData has the expected values
        console.log('=== DOORMAN CREATION DEBUG ===');
        console.log('doormanData:', doormanData);
        console.log('Building ID:', building.id);
        
        // Try using regular object instead of FormData
        const postData = {
            _method: 'PUT',
            action: 'create_doorman',
            doorman: {
                name: doormanData!.name,
                email: doormanData!.email,
                phone: doormanData!.phone || '',
                shift: doormanData!.shift
            }
        };
        
        // Debug: Log what we're sending
        console.log('Post data:', postData);
        console.log('=== END DEBUG ===');

        // Usando ruta genérica del building para crear doorman con método PUT
        router.post(route('buildings.update', building.id), postData, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateDoorman(false);
                setDoormanData(null);
                toast.success('Doorman created successfully!');
            },
            onError: (errors) => {
                console.error('Doorman creation errors:', errors);
                toast.error('Error creating doorman');
            },
            onFinish: () => {
                setIsDoormanProcessing(false);
            }
        });
    };

    const handleUpdateDoorman = (e: React.FormEvent) => {
        e.preventDefault();
        setIsDoormanProcessing(true);
        
        // Debug: Check if doormanData has the expected values
        console.log('=== DOORMAN UPDATE DEBUG ===');
        console.log('doormanData:', doormanData);
        console.log('Building ID:', building.id);
        
        // Use regular object instead of FormData (matching create method)
        const postData = {
            _method: 'PUT',
            action: 'update_doorman',
            doorman: {
                id: doormanData!.id,
                name: doormanData!.name,
                email: doormanData!.email,
                phone: doormanData!.phone || '',
                shift: doormanData!.shift
            }
        };
        
        // Debug: Log what we're sending
        console.log('Update data:', postData);
        console.log('=== END UPDATE DEBUG ===');

        // Usando ruta genérica del building para actualizar doorman
        router.post(route('buildings.update', building.id), postData, {
            preserveScroll: true,
            onSuccess: () => {
                setShowEditDoorman(false);
                setDoormanData(null);
                toast.success('Doorman updated successfully!');
            },
            onError: (errors) => {
                console.error('Doorman update errors:', errors);
                toast.error('Error updating doorman');
            },
            onFinish: () => {
                setIsDoormanProcessing(false);
            }
        });
    };

    const confirmDeleteDoorman = () => {
        if (!doormanData) {
            toast.error('No doorman selected for deletion');
            return;
        }
        
        setIsDoormanProcessing(true);
        
        // Debug: Check if doormanData has the expected values
        console.log('=== DOORMAN DELETE DEBUG ===');
        console.log('doormanData:', doormanData);
        console.log('Building ID:', building.id);
        
        // Use regular object instead of FormData (matching create method)
        const postData = {
            _method: 'PUT',
            action: 'delete_doorman',
            doorman: {
                id: doormanData.id
            }
        };
        
        // Debug: Log what we're sending
        console.log('Delete data:', postData);
        console.log('Route:', route('buildings.update', building.id));
        console.log('=== END DELETE DEBUG ===');
        
        // Usando ruta genérica del building para eliminar doorman
        router.post(route('buildings.update', building.id), postData, {
            preserveScroll: true,
            onSuccess: (page) => {
                console.log('Delete success response:', page);
                setShowDeleteDoorman(false);
                setDoormanData(null);
                toast.success('Doorman deleted successfully!');
            },
            onError: (errors) => {
                console.error('Doorman deletion errors:', errors);
                
                // More specific error handling
                if (errors.message) {
                    toast.error(`Error deleting doorman: ${errors.message}`);
                } else if (errors['doorman.id']) {
                    toast.error(`Validation error: ${errors['doorman.id']}`);
                } else if (typeof errors === 'string') {
                    toast.error(`Error deleting doorman: ${errors}`);
                } else {
                    toast.error('Error deleting doorman. Check console for details.');
                }
            },
            onFinish: () => {
                setIsDoormanProcessing(false);
            }
        });
    };

    // Funciones para reset de contraseña
    const handleResetPassword = (tenant: Tenant) => {
        setSelectedTenantForReset(tenant);
        setShowResetPasswordModal(true);
    };

    const confirmResetPassword = () => {
        if (!selectedTenantForReset) return;

        setIsResettingPassword(true);
        
        router.post(route('tenants.reset-password', selectedTenantForReset.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setShowResetPasswordModal(false);
                setSelectedTenantForReset(null);
                toast.success('Password reset successfully! Email notification sent.');
            },
            onError: (errors) => {
                console.error('Password reset errors:', errors);
                toast.error('Error resetting password. Please try again.');
            },
            onFinish: () => {
                setIsResettingPassword(false);
            }
        });
    };

    const handleBulkResetPasswords = () => {
        if (selectedTenantsForBulkReset.length === 0) {
            toast.error('Please select at least one tenant');
            return;
        }

        setIsResettingPassword(true);
        
        router.post(route('tenants.bulk-reset-passwords'), {
            tenant_ids: selectedTenantsForBulkReset
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowBulkResetModal(false);
                setSelectedTenantsForBulkReset([]);
                toast.success('Bulk password reset completed!');
            },
            onError: (errors) => {
                console.error('Bulk reset errors:', errors);
                toast.error('Error in bulk password reset. Please try again.');
            },
            onFinish: () => {
                setIsResettingPassword(false);
            }
        });
    };

    const handleResetApartmentPasswords = (apartmentId: number) => {
        setIsResettingPassword(true);
        
        router.post(route('apartments.reset-passwords', apartmentId), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('All apartment passwords reset successfully!');
            },
            onError: (errors) => {
                console.error('Apartment reset errors:', errors);
                toast.error('Error resetting apartment passwords. Please try again.');
            },
            onFinish: () => {
                setIsResettingPassword(false);
            }
        });
    };

    const handleResetBuildingPasswords = () => {
        setIsResettingPassword(true);
        
        router.post(route('buildings.reset-passwords', building.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('All building passwords reset successfully!');
            },
            onError: (errors) => {
                console.error('Building reset errors:', errors);
                toast.error('Error resetting building passwords. Please try again.');
            },
            onFinish: () => {
                setIsResettingPassword(false);
            }
        });
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
                        
                        {/* Botones de reset masivo - Solo para super-admin, owner, doorman */}
                        {(auth.user?.roles?.includes('super-admin') || 
                          auth.user?.roles?.includes('owner') || 
                          auth.user?.roles?.includes('doorman')) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        className="flex items-center gap-2 border-orange-300 hover:bg-orange-500 hover:text-white"
                                        disabled={isResettingPassword}
                                    >
                                        <KeyRound className="w-5 h-5" />
                                        <span className="hidden sm:block">Reset Passwords</span>
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleResetBuildingPasswords}>
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Reset All Building Passwords
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
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

                                        <div className="space-y-2">
                                            <Label htmlFor="order">
                                                Order <span className="text-muted-foreground">(optional)</span>
                                            </Label>
                                            <Input
                                                id="order"
                                                type="number"
                                                min="0"
                                                value={data.order}
                                                onChange={(e) => setData('order', parseInt(e.target.value) || 0)}
                                                className="h-11 mt-2"
                                                placeholder="Enter display order (0 = first)"
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Use this to control the order in which apartments are displayed. Lower numbers appear first.
                                            </p>
                                            {errors.order && <p className="text-sm text-red-500">{errors.order}</p>}
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

                {/* Ticket History Modal */}
                <TicketHistoryModal
                    isOpen={showTicketHistoryModal}
                    onClose={() => {
                        setShowTicketHistoryModal(false);
                        setSelectedTenantForTickets(null);
                    }}
                    tenant={selectedTenantForTickets}
                />

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

                            <div className="bg-corporate-gold/10 dark:bg-corporate-gold/20 border border-corporate-gold/20 p-4 rounded-lg">
                                <h4 className="font-medium text-corporate-gold dark:text-corporate-gold-light mb-2">Excel Format Required:</h4>
                                <ul className="text-sm text-corporate-dark-brown dark:text-corporate-gold-light/80 space-y-1">
                                    <li>• <strong>apartment:</strong> Apartment name</li>
                                    <li>• <strong>order:</strong> Apartment order (optional, default: 0)</li>
                                    <li>• <strong>name:</strong> Member name</li>
                                    <li>• <strong>email:</strong> Member email</li>
                                    <li>• <strong>phone:</strong> Member phone</li>
                                </ul>
                                <div className="mt-3 p-2 bg-corporate-warm/10 border border-corporate-warm/20 rounded text-sm">
                                    <p className="text-corporate-dark-brown dark:text-corporate-gold-light/80">
                                        <strong>Limitations:</strong> Maximum 1000 rows, 10MB file size
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-corporate-gold p-0 h-auto mt-2 hover:text-corporate-warm"
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

                <div className='flex flex-col lg:flex-row gap-4'>
                    <div className="w-full lg:w-4/12 space-y-6">
                        {building.owner && (
                            <Card className="overflow-hidden !p-0 border-2 border-corporate-gold/20 hover:border-corporate-gold/40 transition-all duration-300 hover:shadow-xl group bg-gradient-to-br from-white to-corporate-gold/5 dark:from-dark-brown to-corporate-gold/10">
                                <CardContent className="p-0">
                                    {/* Header con gradiente mejorado */}
                                    <div className="bg-gradient-to-r from-corporate-gold/15 via-corporate-gold/10 to-corporate-gold/5 dark:from-corporate-gold/25 dark:via-corporate-gold/15 dark:to-corporate-gold/10 p-4 border-b border-corporate-gold/20 relative overflow-hidden flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-corporate-gold dark:text-corporate-gold-light relative z-10">
                                            <Shield className="w-4 h-4" />
                                            <span className="font-bold text-sm">Superintendent</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => building.owner && handleEditSuperintendent({
                                                id: 1, // El owner no tiene ID en la estructura actual
                                                name: building.owner.name,
                                                email: building.owner.email,
                                                phone: building.owner.phone
                                            })}><Edit className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                    
                                    {/* Contenido principal mejorado */}
                                    <div className="p-6">
                                        <div className="flex items-start gap-5">
                                            <div className="relative">
                                                <div className="relative">
                                                    <img
                                                        src={`/storage/${building.owner.photo}`}
                                                        alt={building.owner.name}
                                                        className="w-20 h-20 rounded-full object-cover border-3 border-corporate-gold/30 shadow-lg group-hover:border-corporate-gold/50 transition-all duration-300 group-hover:shadow-xl"
                                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                            e.currentTarget.src = '/images/default-user.png';
                                                        }}
                                                    />
                                                    {/* Ring animado */}
                                                    <div className="absolute inset-0 rounded-full border-2 border-corporate-gold/40 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"></div>
                                                </div>
                                                
                                                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-br from-corporate-warm via-corporate-gold to-corporate-dark-brown rounded-full border-3 border-background shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <Crown className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-foreground group-hover:text-corporate-gold transition-colors">{building.owner.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="w-2 h-2 bg-corporate-gold rounded-full animate-pulse"></div>
                                                        <p className="text-sm text-muted-foreground font-semibold">Property Owner</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <a href={`mailto:${building.owner.email}`}  className="flex items-center gap-3 text-sm group/item hover:bg-corporate-gold/5 px-3 rounded-lg transition-all duration-300 cursor-pointer border border-transparent hover:border-corporate-gold/20">
                                                        <a href={`mailto:${building.owner.email}`} className="w-8 h-8 rounded-full bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 flex items-center justify-center group-hover/item:from-corporate-gold/30 group-hover/item:to-corporate-warm/30 transition-all duration-300 group-hover/item:scale-110">
                                                            <Mail className="w-4 h-4 text-corporate-gold dark:text-corporate-gold-light" />
                                                        </a>
                                                        <span className="text-muted-foreground group-hover/item:text-foreground font-medium flex-1">{building.owner.email}</span>
                                                    </a>
                                                    <a href={`tel:${building.owner.phone}`} className="flex items-center gap-3 text-sm group/item hover:bg-corporate-gold/5 px-3 rounded-lg transition-all duration-300 cursor-pointer border border-transparent hover:border-corporate-gold/20">
                                                        <a href={`tel:${building.owner.phone}`} className="w-8 h-8 rounded-full bg-gradient-to-br from-corporate-warm/20 to-corporate-gold/20 flex items-center justify-center group-hover/item:from-corporate-warm/30 group-hover/item:to-corporate-gold/30 transition-all duration-300 group-hover/item:scale-110">
                                                            <Phone className="w-4 h-4 text-corporate-warm dark:text-corporate-gold-light" />
                                                        </a>
                                                        <span className="text-muted-foreground group-hover/item:text-foreground font-medium flex-1">{building.owner.phone}</span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Modal de edición para Superintendent */}
                        <Dialog open={showEditSuperintendent} onOpenChange={setShowEditSuperintendent}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Superintendent</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSuperintendentUpdate} className="space-y-4">
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            value={superintendentData?.name || ''}
                                            onChange={e => setSuperintendentData(prev => prev ? { ...prev, name: e.target.value } : null)}
                                            placeholder="Name"
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            value={superintendentData?.email || ''}
                                            onChange={e => setSuperintendentData(prev => prev ? { ...prev, email: e.target.value } : null)}
                                            placeholder="Email"
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={superintendentData?.phone || ''}
                                            onChange={e => setSuperintendentData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                            placeholder="Phone"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setShowEditSuperintendent(false)}>Cancel</Button>
                                        <Button type="submit">Save</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Modal para crear Doorman */}
                        <Dialog open={showCreateDoorman} onOpenChange={setShowCreateDoorman}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Doorman</DialogTitle>
                                    <DialogDescription>
                                        Fill in the information for the new doorman
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateDoorman} className="space-y-4">
                                    <div>
                                        <Label htmlFor="doorman-name">
                                            Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="doorman-name"
                                            value={doormanData?.name || ''}
                                            onChange={e => setDoormanData(prev => prev ? { ...prev, name: e.target.value } : null)}
                                            placeholder="Enter doorman's name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="doorman-email">
                                            Email <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="doorman-email"
                                            type="email"
                                            value={doormanData?.email || ''}
                                            onChange={e => setDoormanData(prev => prev ? { ...prev, email: e.target.value } : null)}
                                            placeholder="Enter doorman's email"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="doorman-phone">Phone</Label>
                                        <Input
                                            id="doorman-phone"
                                            value={doormanData?.phone || ''}
                                            onChange={e => setDoormanData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                            placeholder="Enter doorman's phone"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="doorman-shift">
                                            Shift <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="doorman-shift"
                                            value={doormanData?.shift || ''}
                                            onChange={e => setDoormanData(prev => prev ? { ...prev, shift: e.target.value } : null)}
                                            className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            required
                                        >
                                            <option value="">Select shift</option>
                                            <option value="morning">Morning</option>
                                            <option value="afternoon">Afternoon</option>
                                            <option value="night">Night</option>
                                        </select>
                                    </div>
                                    <DialogFooter>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setShowCreateDoorman(false)}
                                            disabled={isDoormanProcessing}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit"
                                            disabled={isDoormanProcessing}
                                        >
                                            {isDoormanProcessing ? 'Creating...' : 'Create Doorman'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Modal para editar Doorman */}
                        <Dialog open={showEditDoorman} onOpenChange={setShowEditDoorman}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Doorman</DialogTitle>
                                    <DialogDescription>
                                        Update the doorman's information
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleUpdateDoorman} className="space-y-4">
                                    <div>
                                        <Label htmlFor="edit-doorman-name">
                                            Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="edit-doorman-name"
                                            value={doormanData?.name || ''}
                                            onChange={e => setDoormanData(prev => prev ? { ...prev, name: e.target.value } : null)}
                                            placeholder="Enter doorman's name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-doorman-email">
                                            Email <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="edit-doorman-email"
                                            type="email"
                                            value={doormanData?.email || ''}
                                            onChange={e => setDoormanData(prev => prev ? { ...prev, email: e.target.value } : null)}
                                            placeholder="Enter doorman's email"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-doorman-phone">Phone</Label>
                                        <Input
                                            id="edit-doorman-phone"
                                            value={doormanData?.phone || ''}
                                            onChange={e => setDoormanData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                            placeholder="Enter doorman's phone"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-doorman-shift">
                                            Shift <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="edit-doorman-shift"
                                            value={doormanData?.shift || ''}
                                            onChange={e => setDoormanData(prev => prev ? { ...prev, shift: e.target.value } : null)}
                                            className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            required
                                        >
                                            <option value="">Select shift</option>
                                            <option value="morning">Morning</option>
                                            <option value="afternoon">Afternoon</option>
                                            <option value="night">Night</option>
                                        </select>
                                    </div>
                                    <DialogFooter>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setShowEditDoorman(false)}
                                            disabled={isDoormanProcessing}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit"
                                            disabled={isDoormanProcessing}
                                        >
                                            {isDoormanProcessing ? 'Updating...' : 'Update Doorman'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Modal para eliminar Doorman */}
                        <Dialog open={showDeleteDoorman} onOpenChange={setShowDeleteDoorman}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Doorman</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete <strong>{doormanData?.name}</strong>? 
                                        This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setShowDeleteDoorman(false)}
                                        disabled={isDoormanProcessing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="destructive" 
                                        onClick={confirmDeleteDoorman}
                                        disabled={isDoormanProcessing}
                                    >
                                        {isDoormanProcessing ? 'Deleting...' : 'Delete Doorman'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Doormen Section - Always show header with Add button */}
                        <div className="space-y-4 w-full">
                            {/* Header mejorado */}
                            <div className="flex items-center gap-3 px-2">
                                <div className="flex items-center gap-2 text-corporate-gold dark:text-corporate-gold-light">
                                    <Shield className="w-5 h-5" />
                                    <h3 className="text-lg font-bold">Doormen</h3>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-corporate-gold/30 to-transparent"></div>
                                <span className="text-xs text-muted-foreground bg-corporate-gold/10 border border-corporate-gold/20 px-2 py-1 rounded-full font-medium">
                                    {building.doormen?.length || 0} {(building.doormen?.length || 0) === 1 ? 'Guard' : 'Guards'}
                                </span>
                                <Button size="sm" variant="outline" onClick={handleAddDoorman} className="ml-2">
                                    <Plus className="w-4 h-4" /> Add Doorman
                                </Button>
                            </div>
                            
                            {building.doormen && building.doormen.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {building.doormen.map((doorman: Doorman, index: number) => (
                                        <Card 
                                            key={doorman.id} 
                                            className="group !p-0 overflow-hidden border-2 border-corporate-gold/20 hover:border-corporate-gold/40 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-corporate-gold/5 dark:from-dark-brown dark:to-corporate-gold/10 relative"
                                            style={{ animationDelay: `${index * 150}ms` }}
                                        >
                                            {/* Action buttons - Always visible on mobile, hover on desktop */}
                                            <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white hover:text-primary-foreground shadow-sm border border-corporate-gold/20 hover:border-corporate-gold/40"
                                                    onClick={() => handleEditDoorman(doorman)}
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-corporate-gold" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 p-0 bg-white/80 hover:bg-red-50 shadow-sm border border-red-200 hover:border-red-300"
                                                    onClick={() => handleDeleteDoorman(doorman)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                            
                                            <CardContent className="p-4">
                                                {/* Avatar with status badge */}
                                                <div className="relative mb-4">
                                                    <div className="relative mx-auto w-20 h-20">
                                                        <img
                                                            src={`/storage/${doorman.photo}`}
                                                            alt={doorman.name}
                                                            className="w-full h-full rounded-full object-cover border-3 border-corporate-gold/20 group-hover:border-corporate-gold/50 transition-all duration-300 shadow-lg group-hover:shadow-xl"
                                                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                e.currentTarget.src = '/images/default-user.png';
                                                            }}
                                                        />
                                                        {/* Ring animado en hover */}
                                                        <div className="absolute inset-0 rounded-full border-2 border-corporate-gold/30 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"></div>
                                                        
                                                        {/* Shift indicator badge */}
                                                        <div className="absolute -bottom-1 -right-1">
                                                            <div className={`w-5 h-5 rounded-full border-2 border-white shadow-sm ${
                                                                doorman.shift.toLowerCase().includes('morning') ? 'bg-yellow-400' :
                                                                doorman.shift.toLowerCase().includes('night') ? 'bg-blue-900' :
                                                                'bg-orange-500'
                                                            }`}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Doorman information */}
                                                <div className="text-center space-y-2">
                                                    <h4 className="text-sm font-bold text-corporate-gold dark:text-corporate-gold-light line-clamp-1 group-hover:text-corporate-warm transition-colors">
                                                        {doorman.name}
                                                    </h4>
                                                    
                                                    {/* Shift info with better styling */}
                                                    <div className="flex items-center justify-center gap-2">
                                                       
                                                        <span className="text-xs font-medium text-muted-foreground capitalize">
                                                            {doorman.shift} Shift
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Email with icon */}
                                                    {doorman.email && (
                                                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                            <Mail className="w-3 h-3" />
                                                            <span className="truncate max-w-[120px]">{doorman.email}</span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Phone with icon */}
                                                    {doorman.phone && (
                                                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{doorman.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 px-4 bg-corporate-gold/5 border border-corporate-gold/20 rounded-lg">
                                    <Shield className="w-12 h-12 mx-auto text-corporate-gold/40 mb-3" />
                                    <p className="text-muted-foreground mb-2">No doormen assigned to this building</p>
                                    <p className="text-sm text-muted-foreground">Click "Add Doorman" to assign security personnel</p>
                                </div>
                            )}
                        </div>

                        {building.location_link && (
                            <Card className="overflow-hidden !p-0 border-2 border-corporate-gold/20 hover:border-corporate-gold/40 transition-all duration-300 hover:shadow-xl group bg-gradient-to-br from-white to-corporate-gold/5 dark:from-dark-brown dark:to-corporate-gold/10">
                                {/* Header del mapa mejorado */}
                                <div className="bg-gradient-to-r from-corporate-gold/10 via-corporate-gold/15 to-corporate-gold/10 dark:from-corporate-gold/20 dark:via-corporate-gold/25 dark:to-corporate-gold/20 p-4 border-b border-corporate-gold/20 relative overflow-hidden">
                                    <div className="flex items-center gap-2 text-corporate-gold dark:text-corporate-gold-light relative z-10">
                                        <div className="p-2 bg-corporate-gold/10 rounded-full group-hover:bg-corporate-gold/20 transition-colors duration-300">
                                            <MapPinIcon className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm">Building Location</span>
                                    </div>
                                    {/* Decorative moving gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-corporate-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full duration-1000"></div>
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
                                    <div className="absolute top-3 right-3 w-3 h-3 bg-corporate-gold/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150"></div>
                                    <div className="absolute bottom-3 left-3 w-2 h-2 bg-corporate-warm/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-125"></div>
                                </div>
                            </Card>
                        )}

                    </div>
                    <div className='lg:w-8/12 flex flex-col'>
                        {/* Advanced Table Controls */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-corporate-gold/5 dark:bg-corporate-gold/10 border border-corporate-gold/20 rounded-lg">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                                        isSearching ? 'text-corporate-gold animate-pulse' : 'text-corporate-gold/60'
                                    }`} />
                                    <Input
                                        ref={searchInputRef}
                                        placeholder="Search apartments, members, locations..."
                                        value={searchTerm}
                                        onChange={(event) => handleSearchChange(event.target.value)}
                                        className="pl-10 w-80 border-corporate-gold/20 focus:border-corporate-gold focus:ring-corporate-gold/20"
                                        disabled={isSearching}
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-corporate-gold"></div>
                                        </div>
                                    )}
                                    {searchTerm && !isSearching && (
                                        <button
                                            onClick={() => handleSearchChange('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-corporate-gold/60 hover:text-corporate-gold transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                               
                            </div>

                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-corporate-gold/20 hover:bg-primary hover:border-corporate-gold">
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
                                        <Button variant="outline" size="sm" className="border-corporate-gold/20 hover:bg-primary hover:border-corporate-gold">
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
                                                handleShowTicketHistory={handleShowTicketHistory}
                                                handleResetPassword={handleResetPassword}
                                                auth={auth}
                                                setSelectedTenantForTicketCreation={setSelectedTenantForTicketCreation}
                                                setShowCreateTicketDevicesModal={setShowCreateTicketDevicesModal}
                                                setSelectedApartment={setSelectedApartment}
                                                setSelectedTenant={setSelectedTenant}
                                                setSelectedDevices={setSelectedDevices}
                                                setSelectedShareDevices={setSelectedShareDevices}
                                                isResettingPassword={isResettingPassword}
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
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-corporate-gold/20 bg-corporate-gold/5 dark:bg-corporate-gold/10">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                    Showing {((apartments.meta.current_page - 1) * apartments.meta.per_page) + 1} to{' '}
                                    {Math.min(apartments.meta.current_page * apartments.meta.per_page, apartments.meta.total)}{' '}
                                    of {apartments.meta.total} entries
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                               {/* <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                                    <select
                                        value={apartments.meta.per_page}
                                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                        className="border rounded px-2 py-1 text-sm bg-background"
                                    >
                                        {[10, 20, 30, 40, 50].map(pageSize => (
                                            <option key={pageSize} value={pageSize}>
                                                {pageSize}
                                            </option>
                                        ))}
                                    </select>
                                </div> */}

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(1)}
                                            disabled={apartments.meta.current_page === 1}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <ChevronLeft className="h-4 w-4 -ml-2" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(apartments.meta.current_page - 1)}
                                            disabled={apartments.meta.current_page === 1}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm text-muted-foreground">Page</span>
                                            <input
                                                type="number"
                                                value={apartments.meta.current_page}
                                                onChange={(e) => {
                                                    const page = e.target.value ? Number(e.target.value) : 1;
                                                    if (page >= 1 && page <= apartments.meta.last_page) {
                                                        handlePageChange(page);
                                                    }
                                                }}
                                                className="w-12 h-8 text-center border rounded text-sm bg-background"
                                                min="1"
                                                max={apartments.meta.last_page}
                                            />
                                            <span className="text-sm text-muted-foreground">of {apartments.meta.last_page}</span>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(apartments.meta.current_page + 1)}
                                            disabled={apartments.meta.current_page === apartments.meta.last_page}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(apartments.meta.last_page)}
                                            disabled={apartments.meta.current_page === apartments.meta.last_page}
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
                </div>

            {/* Modal for Device Selection */}
            <Dialog open={showCreateTicketDevicesModal} onOpenChange={setShowCreateTicketDevicesModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Select Device</DialogTitle>
                        <DialogDescription>
                            Choose a device for apartment {selectedTenantForTicketCreation?.name} to create a ticket.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {/* Devices del tenant */}
                        {selectedDevices.length > 0 && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Personal Devices</h4>
                                <div className="space-y-2">
                                    {selectedDevices.map((device: Device) => (
                                        <div
                                            key={device.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleDeviceSelected(device)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-corporate-gold/10 flex items-center justify-center">
                                                    <Laptop className="w-5 h-5 text-corporate-gold" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{device.name || 'Unknown Device'}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {device.brand?.name} - {device.model?.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Shared Devices */}
                        {selectedShareDevices.length > 0 && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Shared Devices</h4>
                                <div className="space-y-2">
                                    {selectedShareDevices.map((device: Device) => (
                                        <div
                                            key={device.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                                            onClick={() => handleDeviceSelected(device)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{device.name || 'Unknown Device'}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {device.brand?.name} - {device.model?.name} (Shared)
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No devices message */}
                        {selectedDevices.length === 0 && selectedShareDevices.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Laptop className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="font-medium">No devices available</p>
                                <p className="text-sm">This member doesn't have any devices assigned.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal for Ticket Creation */}
            <Dialog open={showCreateTicketModal} onOpenChange={setShowCreateTicketModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create Ticket</DialogTitle>
                        <DialogDescription>
                            Creating ticket for {selectedTenant?.name} in apartment {selectedTenantForTicketCreation?.name} - {selectedDeviceForTicket?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitTicket} className="space-y-4">
                        <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select 
                                value={ticketForm.data.category} 
                                onValueChange={(value) => ticketForm.setData('category', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Hardware">Hardware</SelectItem>
                                    <SelectItem value="Software">Software</SelectItem>
                                    <SelectItem value="Red">Network</SelectItem>
                                    <SelectItem value="Soporte">Support</SelectItem>
                                    <SelectItem value="Otro">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {ticketForm.errors.category && (
                                <p className="text-sm text-red-600 mt-1">{ticketForm.errors.category}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={ticketForm.data.title}
                                onChange={(e) => ticketForm.setData('title', e.target.value)}
                                placeholder="Enter ticket title"
                                required
                            />
                            {ticketForm.errors.title && (
                                <p className="text-sm text-red-600 mt-1">{ticketForm.errors.title}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={ticketForm.data.description}
                                onChange={(e) => ticketForm.setData('description', e.target.value)}
                                placeholder="Describe the issue..."
                                rows={4}
                            />
                            {ticketForm.errors.description && (
                                <p className="text-sm text-red-600 mt-1">{ticketForm.errors.description}</p>
                            )}
                        </div>

                       {/* <div>
                            <Label htmlFor="priority">Priority</Label>
                            <Select 
                                value={ticketForm.data.priority} 
                                onValueChange={(value) => ticketForm.setData('priority', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                            {ticketForm.errors.priority && (
                                <p className="text-sm text-red-600 mt-1">{ticketForm.errors.priority}</p>
                            )}
                        </div> */}

                        <div className="flex justify-end gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowCreateTicketModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={ticketForm.processing}
                            >
                                {ticketForm.processing ? 'Creating...' : 'Create Ticket'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de confirmación para reset de contraseña individual */}
            <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reset the password for <strong>{selectedTenantForReset?.name}</strong>?
                            <br /><br />
                            The password will be changed to their email address: <strong>{selectedTenantForReset?.email}</strong>
                            <br />
                            An email notification will be sent to them with their new credentials.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowResetPasswordModal(false)}
                            disabled={isResettingPassword}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmResetPassword}
                            disabled={isResettingPassword}
                        >
                            {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de confirmación para reset masivo */}
            <Dialog open={showBulkResetModal} onOpenChange={setShowBulkResetModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Password Reset</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reset passwords for <strong>{selectedTenantsForBulkReset.length}</strong> selected members?
                            <br /><br />
                            Each member's password will be changed to their email address and they will receive email notifications with their new credentials.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowBulkResetModal(false)}
                            disabled={isResettingPassword}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleBulkResetPasswords}
                            disabled={isResettingPassword}
                        >
                            {isResettingPassword ? 'Resetting...' : 'Reset All Passwords'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
           
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
    handleShowTicketHistory: (tenant: Tenant) => void;
    handleResetPassword: (tenant: Tenant) => void;
    auth: { user?: { roles?: string[] } };
    setSelectedTenantForTicketCreation: (apartment: Apartment | null) => void;
    setShowCreateTicketDevicesModal: (show: boolean) => void;
    setSelectedApartment: (apartment: Apartment | null) => void;
    setSelectedTenant: (tenant: Tenant | null) => void;
    setSelectedDevices: (devices: Device[]) => void;
    setSelectedShareDevices: (devices: Device[]) => void;
    isResettingPassword: boolean;
}

// Componente de fila expandible para la tabla avanzada
const ApartmentRowExpanded = ({ 
    row, 
    handleShowDevices, 
    handleShowTicketHistory, 
    handleResetPassword,
    auth, 
    setSelectedTenantForTicketCreation, 
    setShowCreateTicketDevicesModal,
    setSelectedApartment,
    setSelectedTenant,
    setSelectedDevices,
    setSelectedShareDevices,
    isResettingPassword
}: ApartmentRowExpandedProps) => {
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
                                            bg-gradient-to-br from-corporate-gold/10 to-corporate-gold/20 
                                            border border-corporate-gold/20 transition-all duration-300 
                                            hover:from-corporate-gold/20 hover:to-corporate-gold/30 hover:border-corporate-gold/30
                                            hover:scale-110 hover:shadow-md
                                            ${expanded ? 'bg-gradient-to-br from-corporate-gold/20 to-corporate-gold/30 border-corporate-gold/40 shadow-sm' : ''}
                                        `}>
                                            <ChevronRight className={`
                                                w-4 h-4 text-corporate-gold transition-all duration-300 ease-in-out
                                                ${expanded ? 'rotate-90 scale-110' : 'hover:scale-105'}
                                            `} />
                                        </div>
                                        
                                        {/* Enhanced member count display */}
                                        <div className="flex items-center gap-2">
                                            <div className={`
                                                flex items-center justify-center w-6 h-6 rounded-full 
                                                bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 text-corporate-gold
                                                transition-all duration-200 hover:from-corporate-gold/30 hover:to-corporate-warm/30
                                            `}>
                                                <Users className="w-3 h-3" />
                                            </div>
                                            <span className="font-semibold text-corporate-gold dark:text-corporate-gold-light">{apartment.tenants?.length || 0}</span>
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
                <TableRow className="border-b bg-gradient-to-r from-corporate-gold/5 to-corporate-gold/10 dark:from-corporate-gold/10 dark:to-corporate-gold/15">
                    <TableCell colSpan={5} className="p-6">
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <div className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-corporate-gold rounded-full"></div>
                                <Users className="w-4 h-4 text-corporate-gold" />
                                <span>Apartment Members ({apartment.tenants?.length || 0})</span>
                            </div>
                            
                            <div className="grid gap-4">
                                {apartment.tenants?.map((tenant: ExtendedTenant, index: number) => (
                                    <div 
                                        key={tenant.id} 
                                        className="flex items-center justify-between gap-4 p-5 bg-background border border-corporate-gold/20 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-corporate-gold/40 group/member"
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
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-corporate-gold/20 shadow-sm group-hover/member:border-corporate-gold/40 transition-all duration-200"
                                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                        e.currentTarget.src = '/images/default-user.png';
                                                    }}
                                                />
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-corporate-gold dark:text-corporate-gold-light text-lg">{tenant.name}</h4>
                                                    <span className="px-3 py-1 bg-gradient-to-r from-corporate-gold/10 to-corporate-gold/20 text-corporate-gold border border-corporate-gold/20 text-xs font-medium rounded-full">
                                                        Member
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                    <a href={`mailto:${tenant.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-corporate-gold transition-colors">
                                                        <div className="w-6 h-6 rounded-full bg-corporate-gold/20 flex items-center justify-center">
                                                            <Mail className="w-3 h-3 text-corporate-gold" />
                                                        </div>
                                                        <span className="font-medium">{tenant.email}</span>
                                                    </a>
                                                    <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-corporate-gold transition-colors">
                                                        <div className="w-6 h-6 rounded-full bg-corporate-warm/20 flex items-center justify-center">
                                                            <Phone className="w-3 h-3 text-corporate-warm" />
                                                        </div>
                                                        <span className="font-medium">{tenant.phone}</span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Botón Devices - Para todos los roles excepto superadmin regular */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2 hover:bg-corporate-gold hover:text-primary-foreground transition-all duration-300 border-corporate-gold/20 hover:border-corporate-gold group-hover/member:border-corporate-gold/40"
                                                onClick={() => {
                                                    console.log('=== DEVICES BUTTON CLICKED ===');
                                                    console.log('User role:', auth.user?.role);
                                                    console.log('User roles array:', auth.user?.roles);
                                                    console.log('Tenant:', tenant);
                                                    console.log('Tenant devices:', tenant.devices);
                                                    console.log('Tenant shared devices:', tenant.shared_devices);
                                                    console.log('Apartment:', apartment);
                                                    console.log('=== END DEVICES BUTTON DEBUG ===');
                                                    
                                                    const userRoles = auth.user?.roles || [];
                                                    const isSuperAdmin = userRoles.includes('superadmin') || userRoles.includes('super-admin');
                                                    const isOwner = userRoles.includes('owner');
                                                    const isDoorman = userRoles.includes('doorman');
                                                    const isTechnical = userRoles.includes('technical');
                                                    
                                                    if (isSuperAdmin || isOwner || isDoorman || isTechnical) {
                                                        // Todos los roles pueden crear tickets - diferencia está en el backend
                                                        setSelectedApartment(apartment);
                                                        setSelectedTenant(tenant);
                                                        setSelectedDevices(tenant.devices || []);
                                                        setSelectedShareDevices(tenant.shared_devices || []);
                                                        setSelectedTenantForTicketCreation(apartment);
                                                        setShowCreateTicketDevicesModal(true);
                                                    }
                                                }}
                                            >
                                                <Laptop className="w-4 h-4" />
                                                <span className="font-bold text-base">
                                                    {Number(tenant.devices?.length || 0) + Number(tenant.shared_devices?.length || 0)}
                                                </span>
                                                <span className="hidden sm:inline font-medium">Devices</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all duration-300 border-blue-300 hover:border-blue-500"
                                                onClick={() => handleShowTicketHistory(tenant)}
                                            >
                                                <Ticket className="w-4 h-4" />
                                                <span className="font-bold text-base">
                                                    {tenant.tickets_count || 0}
                                                </span>
                                                <span className="hidden sm:inline font-medium">Tickets</span>
                                            </Button>

                                            {/* Botón Reset Password - Solo para super-admin, owner, doorman */}
                                            {(auth.user?.roles?.includes('super-admin') || 
                                              auth.user?.roles?.includes('owner') || 
                                              auth.user?.roles?.includes('doorman')) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all duration-300 border-orange-300 hover:border-orange-500"
                                                    onClick={() => handleResetPassword(tenant)}
                                                    disabled={isResettingPassword}
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                    <span className="hidden sm:inline font-medium">Reset Password</span>
                                                </Button>
                                            )}
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