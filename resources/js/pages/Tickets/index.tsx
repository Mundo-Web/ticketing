import type React from "react"

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from "@/types"
import { Head, router, usePage, useForm } from "@inertiajs/react"
import { toast } from 'sonner';
import { useEffect, useMemo } from "react"
import { useState } from "react"

import {
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    Share2,
    Clock,
    Monitor,
    Tag,
    UserIcon,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    PlayCircle,
    StopCircle,
    User,
    Building,
    Building2,
    Home,
    Zap,
    Mail,
    Phone,
    UserPlus,
    UserMinus,
    UserCheck,
    Settings,
    Cpu,
    Smartphone,
    Upload,
    Camera,
    Video,
    FileText,
    Star,
    ThumbsUp,
    PhoneCall,
    Monitor as MonitorIcon,
    RefreshCw,
    Calendar,
    Award,
    TrendingUp,
    Shield,
    MapPin,
    Ticket,
    X,
    ShieldCheck,
    Wifi,
    HelpCircle,
    BookOpen,
    LightbulbIcon,
    Filter,
    Users,
    Trash2,
    Bell,
    Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchableSelect } from "@/components/ui/searchable-select"
import KanbanBoard from "./KanbanBoard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import DeviceIcon from '@/components/DeviceIcon';
import NinjaOneAlertCard from '@/components/NinjaOneAlertCard';

import { Device } from "@/types/models/Device"
import { Tenant } from "@/types/models/Tenant";

// Helper function to format dates consistently 
const formatLocalDateTime = (dateString: string) => {
    const date = new Date(dateString);
    // Ensure we get the date formatted consistently regardless of timezone
    return {
        date: date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        time: date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Use 24-hour format for consistency
        })
    };
};

// Helper function for history display - same format for consistency
const formatHistoryDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        time: date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        })
    };
};

// Define available ticket categories here
const TICKET_CATEGORIES = [
    "Hardware",
    "Software",
    "Red",
    "Soporte",
    "Otro",
];

// Enhanced status configuration with better colors and icons
const statusConfig: Record<
    string,
    {
        label: string
        color: string
        bgColor: string
        textColor: string
        icon: React.ComponentType<any>
    }
> = {
    open: {
        label: "Open",
        color: "border-blue-200 bg-blue-50",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: AlertCircle,
    },
    in_progress: {
        label: "In Progress",
        color: "border-amber-200 bg-amber-50",
        bgColor: "bg-amber-100",
        textColor: "text-amber-800",
        icon: PlayCircle,
    },
    resolved: {
        label: "Resolved",
        color: "border-emerald-200 bg-emerald-50",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-800",
        icon: CheckCircle2,
    },
    closed: {
        label: "Closed",
        color: "border-slate-200 bg-slate-50",
        bgColor: "bg-slate-100",
        textColor: "text-slate-700",
        icon: StopCircle,
    },
    cancelled: {
        label: "Cancelled",
        color: "border-red-200 bg-red-50",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        icon: XCircle,
    },
}

function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || {
        label: status,
        bgColor: "bg-gray-100",
        textColor: "text-gray-700",
        icon: AlertCircle,
    }
    const IconComponent = config.icon

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
        >
            <IconComponent className="w-3 h-3" />
            {config.label}
        </div>
    )
}



// Enhanced interfaces
interface Ticket {
    id: number
    device?: {
        name?: string
        name_device?: {
            name: string
        }
    }
    category: string
    title: string
    description: string
    status: string
    created_at?: string
    updated_at?: string
}

interface PaginationLink {
    url: string | null
    label: string
    active: boolean
}

interface PaginationMeta {
    current_page: number
    from: number
    last_page: number
    path: string
    per_page: number
    to: number
    total: number
    links: PaginationLink[]
}
interface Apartment {
    name: string;
    photo?: string;
    floor?: string;
    ubicacion?: string;
}

interface Building {
    id: number;
    name: string;
    photo?: string;
    address: string;
}

interface Member {
    id: number;
    name: string;
    email?: string;
    photo?: string;
    apartment_name?: string;
    tenant?: {
        id: number;
        name: string;
        email: string;
        photo?: string;
        apartment_id?: number;
    };
}

interface ApartmentData {
    id: number;
    name: string;
    floor?: string;
    building?: {
        id: number;
        name: string;
    };
    members?: Member[];
}

interface TicketsProps {
    tickets: {
        data: Ticket[]
        links: PaginationLink[]
        meta: PaginationMeta
    }
    allTickets: Ticket[],
    allTicketsUnfiltered: Ticket[],
    devicesOwn: Device[],
    devicesShared: Device[],
    memberData: Tenant | null;
    apartmentData: Apartment | null;
    buildingData: Building | null;
    statusFilter?: string;
    // Nuevas props para doorman y owner
    allMembers?: Member[];
    allApartments?: ApartmentData[];
}

function CategoryBadge({ category }: { category: string }) {
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/20 text-secondary-foreground text-xs font-medium border border-secondary/30">
            <Tag className="w-3 h-3" />
            {category}
        </div>
    )
}

function DeviceBadge({ device }: { device: any }) {
    console.log('DeviceBadge rendered with device:', device);
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/20 text-primary-foreground text-xs font-medium border border-primary/30">
            {device?.icon_id ? (
                <DeviceIcon deviceIconId={device.icon_id} size={12} />
            ) : (
                <Monitor className="w-3 h-3" />
            )}
            {device?.name_device?.name || device?.name || "No device"}
        </div>
    )
}

// Elegant Corporate Device Information Component
export default function TicketsIndex({ 
    tickets, 
    allTickets, 
    allTicketsUnfiltered, 
    devicesOwn, 
    devicesShared, 
    allDevices = [], // Default to empty array
    memberData, 
    apartmentData, 
    buildingData, 
    statusFilter,
    allMembers,
    allApartments 
}: TicketsProps) {
    // Dynamic breadcrumbs based on status filter
    const breadcrumbs: BreadcrumbItem[] = statusFilter
        ? [
            { title: "Tickets", href: "/tickets" },
            { title: statusFilter === 'closed,cancelled' ? "Closed & Cancelled" : statusFilter, href: "#" }
        ]
        : [{ title: "Tickets", href: "/tickets" }];
    // Refresca el ticket seleccionado desde el backend
    const refreshSelectedTicket = async (ticketId?: number) => {
        if (!ticketId) return;
        setSelectedTicketLoading(true);
        try {
            const response = await fetch(`/tickets/${ticketId}`, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error("Error al cargar ticket");
            const data = await response.json();
            setSelectedTicket(data.ticket);
        } catch (e) {
            // No hacer nada
        } finally {
            setSelectedTicketLoading(false);
        }
    };
    // State management
    const [refreshKey, setRefreshKey] = useState(0); // Key para forzar re-render del kanban
    const [showHistoryModal, setShowHistoryModal] = useState<{ open: boolean; ticketId?: number }>({ open: false })
    const [showAssignModal, setShowAssignModal] = useState<{ open: boolean; ticketId?: number }>({ open: false })
    const [showStatusChangeModal, setShowStatusChangeModal] = useState<{ open: boolean; ticketId?: number; newStatus?: string; ticket?: any }>({ open: false })
    const [historyText, setHistoryText] = useState("")
    const [historyAction, setHistoryAction] = useState("comment")
    const [statusChangeComment, setStatusChangeComment] = useState("")
    const [assignTechnicalId, setAssignTechnicalId] = useState<number | null>(null)
    const [assigning, setAssigning] = useState(false)
    const [addingHistory, setAddingHistory] = useState(false)
    const [changingStatus, setChangingStatus] = useState(false)
    const [technicals, setTechnicals] = useState<any[]>([])
    const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null)
    const [tab, setTab] = useState<"all" | "assigned" | "approved">("all")
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [selectedTicketLoading, setSelectedTicketLoading] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuickActionsModal, setShowQuickActionsModal] = useState<{ open: boolean; ticketId?: number }>({ open: false });
    const [showRatingModal, setShowRatingModal] = useState<{ open: boolean; ticketId?: number }>({ open: false });
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [ticketRating, setTicketRating] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);
    const [showDeviceStats, setShowDeviceStats] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<{ open: boolean; ticket?: any }>({ open: false });
    
    // Member feedback states
    const [showMemberFeedbackModal, setShowMemberFeedbackModal] = useState<{ open: boolean; ticketId?: number }>({ open: false });
    const [memberFeedback, setMemberFeedback] = useState({ comment: "", rating: 0 });
    const [submittingMemberFeedback, setSubmittingMemberFeedback] = useState(false);
    
    // Appointment states
    const [showScheduleAppointmentModal, setShowScheduleAppointmentModal] = useState<{ open: boolean; ticketId?: number }>({ open: false });
    const [appointmentForm, setAppointmentForm] = useState({
        title: "",
        description: "",
        address: "",
        scheduled_for: "",
        estimated_duration: 60,
        member_instructions: "",
        notes: ""
    });
    const [schedulingAppointment, setSchedulingAppointment] = useState(false);
    const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState<{ open: boolean; appointment?: any }>({ open: false });
    const [appointmentAction, setAppointmentAction] = useState<{ type: string; appointmentId?: number }>({ type: "" });
    const [appointmentActionForm, setAppointmentActionForm] = useState({
        completion_notes: "",
        member_feedback: "",
        rating: 0,
        service_rating: 0,
        reason: "",
        new_scheduled_for: ""
    });
    
    // NinjaOne Alerts States
    const [deviceAlerts, setDeviceAlerts] = useState<any[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState<Record<number, boolean>>({});
    const [showNinjaOneAlerts, setShowNinjaOneAlerts] = useState<Record<number, boolean>>({});
    const [userDeviceAlerts, setUserDeviceAlerts] = useState<any[]>([]);
    const [loadingUserAlerts, setLoadingUserAlerts] = useState(false);
    const [showNinjaOneNotifications, setShowNinjaOneNotifications] = useState(false);
    const [creatingTicketFromAlert, setCreatingTicketFromAlert] = useState<number | null>(null);
    const [allTenants, setAllTenants] = useState<any[]>([]);
    const { auth, isTechnicalDefault } = usePage<SharedData & { isTechnicalDefault?: boolean }>().props;
    const isMember = (auth.user as any)?.roles?.includes("member");
    const isSuperAdmin = (auth.user as any)?.roles?.includes("super-admin");
    const isTechnical = (auth.user as any)?.roles?.includes("technical");
    const isDoorman = (auth.user as any)?.roles?.includes("doorman");
    const isOwner = (auth.user as any)?.roles?.includes("owner");
    // isTechnicalDefault ahora viene del backend correctamente
    
    // Efecto para registrar cuando se abre el modal de cita
    useEffect(() => {
        if (showAppointmentDetailsModal.open && showAppointmentDetailsModal.appointment) {
            console.log("Appointment modal opened:", {
                appointmentId: showAppointmentDetailsModal.appointment.id,
                status: showAppointmentDetailsModal.appointment.status,
                isMember,
                shouldShowFeedback: showAppointmentDetailsModal.appointment.status === 'awaiting_feedback' && isMember
            });
        }
    }, [showAppointmentDetailsModal.open, showAppointmentDetailsModal.appointment, isMember]);

    // Estados para filtros de doorman y owner
    const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
    const [selectedApartmentFilter, setSelectedApartmentFilter] = useState<string>('all');

    // Función para filtrar tickets para doorman/owner - FILTRADO FRONTEND DIRECTO
    const getFilteredTicketsForDoormanOwner = () => {
        // FORZAR FILTRADO EN FRONTEND por building del usuario logueado
        let filtered = allTicketsUnfiltered; // Usar TODOS los tickets
        
        // 1. FILTRAR POR BUILDING DEL USUARIO (Owner/Doorman)
        if (buildingData?.id) {
            filtered = filtered.filter((ticket: any) => {
                // Verificar si el ticket pertenece al building del usuario
                const ticketBuildingId = ticket.user?.tenant?.apartment?.building?.id || 
                                       ticket.user?.tenant?.apartment?.buildings_id ||
                                       ticket.device?.apartment?.building?.id ||
                                       ticket.device?.apartment?.buildings_id;
                return ticketBuildingId === buildingData.id;
            });
        }
        
        // 2. Filtrar por member si está seleccionado
        if (selectedMemberFilter !== 'all') {
            filtered = filtered.filter((ticket: any) => 
                ticket.user?.id?.toString() === selectedMemberFilter ||
                ticket.user?.tenant?.id?.toString() === selectedMemberFilter
            );
        }
        
        // 3. Filtrar por apartment si está seleccionado
        if (selectedApartmentFilter !== 'all') {
            filtered = filtered.filter((ticket: any) => 
                ticket.user?.tenant?.apartment_id?.toString() === selectedApartmentFilter ||
                ticket.device?.apartment_id?.toString() === selectedApartmentFilter
            );
        }
        
        return filtered;
    };

    // Tab labels in English
    const [searchQuery] = useState("")

    // Device options based on user role
    const getDeviceOptions = () => {
        if (isSuperAdmin || isTechnicalDefault) {
            // Admin and technical default can access all devices
            return allDevices.map(device => {
                // Safely get the first tenant (owner) and their apartment/building info
                const firstTenant = Array.isArray(device.tenants) && device.tenants.length > 0 ? device.tenants[0] : null;
                const apartment = firstTenant?.apartment || null;
                const building = apartment?.building || null;
                
                return {
                    ...device,
                    name: device.name || (device.name_device ? device.name_device.name : ''),
                    // Add building and apartment info for context from the first tenant (owner)
                    building_name: building?.name || 'N/A',
                    apartment_name: apartment?.name || 'N/A'
                };
            });
        } else {
            // Members use their own and shared devices
            return [...devicesOwn, ...devicesShared].map(device => ({
                ...device,
                name: device.name || (device.name_device ? device.name_device.name : ''),
            }));
        }
    };

    const deviceOptions = getDeviceOptions();

    // useForm for ticket creation
    const { data, setData, post, processing, errors, reset } = useForm({
        device_id: "",
        category: "",
        title: "",
        description: "",
        tenant_id: "", // For admin/technical to select which tenant the ticket is for
    });

    // Manejar envío del formulario
    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tickets', {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
                // Refresh the page to show the new ticket
                router.reload({ only: ['tickets', 'allTickets'] });
            },
        });
    };

    const handleDelete = (ticket: any) => {
        // Open custom confirmation modal instead of browser alert
        setShowDeleteModal({ open: true, ticket });
    }

    const confirmDelete = () => {
        if (!showDeleteModal.ticket) return;
        
        router.delete(`/tickets/${showDeleteModal.ticket.id}`, {
            preserveScroll: true,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            onSuccess: () => {
                // Clear selected ticket if it was the one deleted
                if (selectedTicket && selectedTicket.id === showDeleteModal.ticket.id) {
                    setSelectedTicket(null);
                }
                // Close modal and show success message
                setShowDeleteModal({ open: false });
                toast.success('Ticket eliminado exitosamente');
                // Refresh the page to show updated tickets
                router.reload({ only: ['tickets', 'allTickets', 'allTicketsUnfiltered'] });
            },
            onError: () => {
                // Keep modal open and show error
                toast.error("Error al eliminar el ticket. Por favor intenta de nuevo.");
            }
        });
    }

    const handleStatusChange = (ticket: any, newStatus: string) => {
        // Estados que requieren comentario obligatorio
        const statusesRequiringComment = ['resolved', 'closed', 'cancelled'];

        if (statusesRequiringComment.includes(newStatus)) {
            // Abrir modal para pedir comentario obligatorio
            setShowStatusChangeModal({
                open: true,
                ticketId: ticket.id,
                newStatus: newStatus,
                ticket: ticket
            });
            setStatusChangeComment("");
        } else {
            // Cambio directo para estados que no requieren comentario
            setStatusLoadingId(ticket.id);
            
            // ✨ Actualización optimista - actualizar UI inmediatamente
            const updatedTicket = { ...ticket, status: newStatus };
            
            // Actualizar el ticket seleccionado si es el mismo
            if (selectedTicket && selectedTicket.id === ticket.id) {
                setSelectedTicket(updatedTicket);
            }
            
            // Actualizar en la lista de tickets (para Kanban)
            setData(prevData => ({
                ...prevData,
                allTickets: prevData.allTickets.map(t => 
                    t.id === ticket.id ? updatedTicket : t
                ),
                tickets: {
                    ...prevData.tickets,
                    data: prevData.tickets.data.map(t => 
                        t.id === ticket.id ? updatedTicket : t
                    )
                }
            }));
            
            router.put(
                `/tickets/${ticket.id}`,
                { status: newStatus },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        // Actualizar desde servidor para mantener sincronización
                        refreshSelectedTicket(ticket.id);
                        toast.success(`Ticket moved to ${newStatus}`);
                    },
                    onError: () => {
                        // Revertir cambios optimistas en caso de error
                        if (selectedTicket && selectedTicket.id === ticket.id) {
                            setSelectedTicket(ticket);
                        }
                        setData(prevData => ({
                            ...prevData,
                            allTickets: prevData.allTickets.map(t => 
                                t.id === ticket.id ? ticket : t
                            ),
                            tickets: {
                                ...prevData.tickets,
                                data: prevData.tickets.data.map(t => 
                                    t.id === ticket.id ? ticket : t
                                )
                            }
                        }));
                        toast.error('Failed to update ticket status');
                    },
                    onFinish: () => setStatusLoadingId(null),
                },
            );
        }
    }

    const getNextStatuses = (status: string) => {
        switch (status) {
            case "open":
                return ["in_progress", "cancelled"]
            case "in_progress":
                return ["resolved", "cancelled"]
            case "resolved":
                return ["closed"]
            default:
                return []
        }
    }

    const loadTechnicals = async () => {
        try {
            const response = await fetch("/api/technicals", { headers: { Accept: "application/json" } })
            if (!response.ok) throw new Error("Error al cargar técnicos")
            const data = await response.json()
            setTechnicals(data.technicals || [])
            console.log("Técnicos cargados:", data.technicals)
        } catch (e) {
            console.error("Error al cargar técnicos:", e)
            setTechnicals([])
        }
    }

    const loadAllTenants = async () => {
        try {
            const response = await fetch("/api/tenants/all", { headers: { Accept: "application/json" } })
            if (!response.ok) throw new Error("Error al cargar tenants")
            const data = await response.json()
            setAllTenants(data.tenants || [])
            console.log("Tenants cargados:", data.tenants)
        } catch (e) {
            console.error("Error al cargar tenants:", e)
            setAllTenants([])
        }
    }

    const handleSelectTicket = async (ticket: any) => {
        if (selectedTicket?.id === ticket.id) return
        setSelectedTicketLoading(true)
        try {
            const response = await fetch(`/tickets/${ticket.id}`, {
                headers: { Accept: "application/json" },
            })
            if (!response.ok) throw new Error("Error al cargar ticket")
            const data = await response.json()
            setSelectedTicket(data.ticket)
        } catch (e) {
            setSelectedTicket(null)
        } finally {
            setSelectedTicketLoading(false)
        }
    }

    // NinjaOne Alert Functions
    const loadDeviceAlerts = async (deviceId: number) => {
        setLoadingAlerts(prev => ({ ...prev, [deviceId]: true }));
        try {
            const response = await fetch(`/ninjaone/devices/${deviceId}/alerts`, {
                headers: { Accept: "application/json" },
            });
            if (response.ok) {
                const data = await response.json();
                setDeviceAlerts(prev => prev.filter(alert => alert.device_id !== deviceId).concat(data.alerts || []));
            }
        } catch (error) {
            console.error('Error loading device alerts:', error);
        } finally {
            setLoadingAlerts(prev => ({ ...prev, [deviceId]: false }));
        }
    };

    const toggleDeviceAlerts = (deviceId: number) => {
        setShowNinjaOneAlerts(prev => {
            const isCurrentlyShowing = prev[deviceId];
            if (!isCurrentlyShowing) {
                // Load alerts when showing for the first time
                loadDeviceAlerts(deviceId);
            }
            return { ...prev, [deviceId]: !isCurrentlyShowing };
        });
    };

    const acknowledgeAlert = async (alertId: number) => {
        try {
            const response = await fetch(`/ninjaone/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: { 
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
            });
            if (response.ok) {
                // Refresh alerts for all devices
                const uniqueDeviceIds = [...new Set(deviceAlerts.map(alert => alert.device_id))];
                uniqueDeviceIds.forEach(deviceId => loadDeviceAlerts(deviceId));
            }
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    };

    const resolveAlert = async (alertId: number) => {
        try {
            const response = await fetch(`/ninjaone/alerts/${alertId}/resolve`, {
                method: 'POST',
                headers: { 
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
            });
            if (response.ok) {
                // Refresh alerts for all devices
                const uniqueDeviceIds = [...new Set(deviceAlerts.map(alert => alert.device_id))];
                uniqueDeviceIds.forEach(deviceId => loadDeviceAlerts(deviceId));
            }
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    const createTicketFromAlert = (alertId: number) => {
        window.location.href = `/tickets/create-from-alert/${alertId}`;
    };

    // Load user device alerts for notifications
    const loadUserDeviceAlerts = async () => {
        if (!isMember) return; // Only for members
        
        setLoadingUserAlerts(true);
        try {
            // Use the same endpoint that works in NinjaOne alerts index, but request JSON
            const response = await fetch('/ninjaone-alerts', {
                headers: { 
                    'Accept': 'application/json'
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Extract alerts from the JSON response
                const alertsData = data.alerts?.data || [];
                
                // Convert to the format expected by notifications
                const deviceAlerts = alertsData.map((alert: any) => ({
                    id: alert.id,
                    device_id: alert.device_id,
                    device_name: alert.device?.name || 'Unknown Device',
                    title: alert.title,
                    description: alert.description,
                    severity: alert.severity,
                    status: alert.status,
                    alert_type: alert.alert_type,
                    created_at: alert.created_at,
                    health_status: alert.severity, // For compatibility
                    issues_count: 1
                }));
                
                setUserDeviceAlerts(deviceAlerts);
            }
        } catch (error) {
            console.error('Error loading user device alerts:', error);
            setUserDeviceAlerts([]);
        } finally {
            setLoadingUserAlerts(false);
        }
    };

    // Create ticket from device alert
    const createTicketFromDeviceAlert = async (deviceAlert: any) => {
        // Map alert types to ticket categories
        const mapAlertTypeToCategory = (alertType: string) => {
            switch (alertType.toLowerCase()) {
                case 'system health':
                case 'service':
                    return 'Hardware';
                case 'disk space':
                case 'network':
                    return 'Red';
                case 'security':
                    return 'Soporte';
                default:
                    return 'Hardware';
            }
        };

        // Map severity to Spanish
        const mapSeverityToSpanish = (severity: string) => {
            switch (severity.toLowerCase()) {
                case 'critical':
                    return 'Crítico';
                case 'warning':
                    return 'Advertencia';
                case 'info':
                    return 'Información';
                default:
                    return severity;
            }
        };

        // Map status to Spanish
        const mapStatusToSpanish = (status: string) => {
            switch (status.toLowerCase()) {
                case 'open':
                    return 'Abierto';
                case 'acknowledged':
                    return 'Reconocido';
                case 'resolved':
                    return 'Resuelto';
                default:
                    return status;
            }
        };

        // Pre-fill form data with alert information
        setData({
            device_id: deviceAlert.device_id.toString(),
            category: mapAlertTypeToCategory(deviceAlert.alert_type),
            title: `Alerta: ${deviceAlert.title}`,
            description: `🚨 ALERTA NINJAONE AUTOMÁTICA

📱 Dispositivo: ${deviceAlert.device_name}
📊 Tipo de Alerta: ${deviceAlert.alert_type}
⚠️ Severidad: ${mapSeverityToSpanish(deviceAlert.severity)}
📋 Estado: ${mapStatusToSpanish(deviceAlert.status)}

📝 Descripción:
${deviceAlert.description}

📅 Fecha de la alerta: ${new Date(deviceAlert.created_at).toLocaleString('es-ES')}

---
⚡ Esta incidencia fue generada automáticamente desde una alerta de NinjaOne.
Por favor, revise el dispositivo y complete los detalles adicionales si es necesario.`,
            tenant_id: "", // This will be auto-filled by backend for members
        });
        
        // Open the create ticket modal
        setShowCreateModal(true);
        
        // Show success message
        toast.success(`Formulario pre-llenado con datos de la alerta de ${deviceAlert.device_name}`);
        
        // Remove this alert from notifications since user is creating a ticket
        setUserDeviceAlerts(prev => prev.filter(alert => alert.device_id !== deviceAlert.device_id));
    };

    // Appointment functions
    const handleScheduleAppointment = (ticketId: number) => {
        const ticket = memoizedAllTickets.find(t => t.id === ticketId);
        if (!ticket) return;

        // Pre-fill appointment form
        setAppointmentForm({
            title: `Visita técnica - ${ticket.title}`,
            description: `Visita presencial para resolver el ticket: ${ticket.description}`,
            address: ticket.device?.apartment?.address || ticket.user?.tenant?.apartment?.address || "",
            scheduled_for: "",
            estimated_duration: 60,
            member_instructions: "Por favor, asegúrese de estar disponible en el horario acordado.",
            notes: ""
        });
        
        setShowScheduleAppointmentModal({ open: true, ticketId });
    };

    const submitScheduleAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showScheduleAppointmentModal.ticketId) return;

        setSchedulingAppointment(true);
        
        // Log the data being sent for debugging
        const appointmentData = {
            ticket_id: showScheduleAppointmentModal.ticketId,
            technical_id: selectedTicket?.technical_id,
            ...appointmentForm
        };
        
        console.log('Sending appointment data:', appointmentData);
        
        try {
            // Using Inertia router for better CSRF handling
            router.post('/appointments', appointmentData, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowScheduleAppointmentModal({ open: false });
                    setAppointmentForm({
                        title: "",
                        description: "",
                        address: "",
                        scheduled_for: "",
                        estimated_duration: 60,
                        member_instructions: "",
                        notes: ""
                    });
                    
                    // Refresh selected ticket
                    refreshSelectedTicket(showScheduleAppointmentModal.ticketId);
                    
                    toast.success('Appointment scheduled successfully');
                },
                onError: (errors) => {
                    console.error('Appointment scheduling errors:', errors);
                    
                    // Handle different types of errors
                    if (errors.message && errors.message.includes('CSRF')) {
                        toast.error('Session expired. Please refresh the page and try again.');
                        setTimeout(() => window.location.reload(), 2000);
                        return;
                    }
                    
                    // Handle validation errors
                    if (typeof errors === 'object' && errors !== null) {
                        const errorMessages = Object.values(errors).flat();
                        if (errorMessages.length > 0) {
                            errorMessages.forEach(message => {
                                if (typeof message === 'string') {
                                    toast.error(message);
                                }
                            });
                        } else {
                            toast.error('Error scheduling appointment. Please check your data and try again.');
                        }
                    } else {
                        toast.error('Error scheduling appointment');
                    }
                },
                onFinish: () => {
                    setSchedulingAppointment(false);
                }
            });
            
        } catch (error) {
            console.error('Error scheduling appointment:', error);
            toast.error('Error scheduling appointment');
            setSchedulingAppointment(false);
        }
    };

    const handleAppointmentAction = async (action: string, appointmentId: number, formData?: any) => {
        try {
            // Map action to the correct route
            const routeAction = action === 'member_feedback' ? 'member-feedback' : action;
            
            // Using Inertia router for better CSRF handling
            router.post(`/appointments/${appointmentId}/${routeAction}`, formData || {}, {
                preserveScroll: true,
                onSuccess: (page) => {
                    const data = (page.props as any).flash || {};
                    
                    // Show success notification with specific messages
                    const successMessages = {
                        'start': 'Visit started successfully!',
                        'complete': 'Visit completed successfully! Waiting for member feedback.',
                        'member_feedback': 'Thank you for your feedback!',
                        'cancel': 'Appointment cancelled successfully!',
                        'reschedule': 'Appointment rescheduled successfully!'
                    };
                    
                    const message = data.success || data.message || successMessages[action] || `${action} completed successfully`;
                    toast.success(message);
                    
                    // Refresh selected ticket
                    if (selectedTicket) {
                        refreshSelectedTicket(selectedTicket.id);
                    }
                },
                onError: (errors) => {
                    console.error(`Error ${action} appointment:`, errors);
                    
                    if (typeof errors === 'object' && errors !== null) {
                        const errorMessages = Object.values(errors).flat();
                        errorMessages.forEach(message => {
                            if (typeof message === 'string') {
                                toast.error(message);
                            }
                        });
                    } else {
                        toast.error(`Error processing ${action} action`);
                    }
                }
            });
        } catch (error) {
            console.error(`Error ${action} appointment:`, error);
            toast.error(`Error processing ${action} action`);
        }
    };

    // Member feedback functions
    const handleMemberFeedback = (ticketId: number) => {
        setShowMemberFeedbackModal({ open: true, ticketId });
        setMemberFeedback({ comment: "", rating: 0 });
    };

    const submitMemberFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showMemberFeedbackModal.ticketId || memberFeedback.rating === 0) return;

        setSubmittingMemberFeedback(true);
        
        try {
            const response = await fetch(`/tickets/${showMemberFeedbackModal.ticketId}/add-member-feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    comment: memberFeedback.comment,
                    rating: memberFeedback.rating,
                    is_feedback: true
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setShowMemberFeedbackModal({ open: false });
                setMemberFeedback({ comment: "", rating: 0 });
                
                // Refresh selected ticket
                refreshSelectedTicket(showMemberFeedbackModal.ticketId);
                
                toast.success('¡Gracias por tu feedback! Solo será visible para los administradores.');
            } else {
                toast.error(data.message || 'Error al enviar feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error('Error al enviar feedback');
        } finally {
            setSubmittingMemberFeedback(false);
        }
    };

    // Dismiss device alert notification
    const dismissDeviceAlert = (deviceId: number) => {
        setUserDeviceAlerts(prev => prev.filter(alert => alert.device_id !== deviceId));
    };

    // Load user device alerts for member notifications
    useEffect(() => {
        if (isMember) {
            loadUserDeviceAlerts();
        }
    }, [isMember]);

    // Auto-refresh device alerts every 5 minutes for members
    useEffect(() => {
        if (!isMember) return;
        
        const interval = setInterval(loadUserDeviceAlerts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isMember]);

    // Filter tickets
    const userId = (usePage().props as any)?.auth?.user?.id;
    
    // Memoized tickets que se actualizan cuando cambia refreshKey o los datos originales
    const memoizedTickets = useMemo(() => {
        return tickets.data; // Se recalcula cuando refreshKey cambia
    }, [tickets.data, refreshKey]);

    const memoizedAllTickets = useMemo(() => {
        return allTickets;
    }, [allTickets, refreshKey]);

    const assignedTickets = memoizedTickets;
    const approvedTickets = memoizedTickets.filter((t: any) => t.status === "resolved" || t.status === "closed");

    let ticketsToShow: any[] = [];
    if (tab === "all") {
        ticketsToShow = memoizedAllTickets;
    } else if (tab === "assigned") {
        ticketsToShow = assignedTickets;
    } else if (tab === "approved") {
        ticketsToShow = approvedTickets;
    }



    // Member tabs for filtering tickets (declaración única y arriba)
    const memberTabs = [
        { value: "all", label: "All", icon: Eye },
        { value: "open", label: "Open", icon: AlertCircle },
        { value: "in_progress", label: "In Progress", icon: PlayCircle },
        { value: "resolved", label: "Resolved", icon: CheckCircle2 },
        { value: "closed", label: "Closed", icon: StopCircle },
    ];
    const [memberTab, setMemberTab] = useState<string>("all");

    // Filter tickets for members by tab (status) and then by search
    // Si hay statusFilter del backend, allTickets ya viene filtrado y solo contiene tickets del usuario
    // Si no hay statusFilter, necesitamos filtrar por user_id y luego por tab local
    const memberTickets = statusFilter
        ? allTickets  // Si hay filtro del backend, allTickets ya está filtrado por usuario y estado
        : memoizedAllTickets.filter((ticket: any) => ticket.user_id === userId);

    const memberTabFilteredTickets = statusFilter
        ? memberTickets  // Si hay filtro del backend, usar todos los tickets filtrados
        : (memberTab === "all"
            ? memberTickets
            : memberTickets.filter((ticket: any) => ticket.status === memberTab));

    const memberFilteredTickets = memberTabFilteredTickets.filter(
        (ticket: any) =>
            ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Super admin filtered tickets by current tab
    const superAdminFilteredTickets = statusFilter
        ? allTickets  // Si hay filtro del backend, usar todos los tickets filtrados
        : allTickets;

    // Apply search filter
    const filteredTickets = isSuperAdmin
        ? superAdminFilteredTickets.filter(
            (ticket) =>
                ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.category.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        : isMember
            ? memberFilteredTickets
            : ticketsToShow.filter(
                (ticket) =>
                    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ticket.category.toLowerCase().includes(searchQuery.toLowerCase()),
            );

    useEffect(() => {
        if (selectedTicket && !tickets.data.some((t: any) => t.id === selectedTicket.id)) {
            setSelectedTicket(null)
        }
    }, [tickets.data, selectedTicket])

    // (Eliminado: declaración duplicada de memberTabs y memberTab)

    // Cargar los técnicos cuando se abre el modal de asignación
    useEffect(() => {
        if (showAssignModal.open) {
            loadTechnicals();
        }
    }, [showAssignModal.open]);

    // Cargar tenants cuando se abre el modal de crear ticket (solo para admin/technical)
    useEffect(() => {
        if (showCreateModal && (isSuperAdmin || isTechnicalDefault || isTechnical)) {
            loadAllTenants();
        }
    }, [showCreateModal, isSuperAdmin, isTechnicalDefault, isTechnical]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ticket Management" />

            <div className="flex flex-col gap-6 p-6">


                {/* Header Section */}
                {isMember && (
                    <><div className="border-b bg-background border-slate-200 sticky top-0 z-20">
                        <div className="px-6 py-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="min-w-max">
                                    <h1 className="text-3xl font-extrabold text-accent flex items-center gap-2">
                                        <CheckCircle className="w-7 h-7 text-accent" />
                                        Ticket Management
                                    </h1>
                                    <p className="text-slate-600 mt-1 mb-4">
                                        Select a device to report an issue or search tickets.
                                    </p>
                             

                                </div>
                                {/* Panel Personal del Tenant Mejorado */}
                                <div className="flex w-full  gap-4 items-center justify-end">
                                      {/* Dashboard Rápido */}
                                    <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                                        {/* Last Ticket */}
                                        <Card className="p-3 text-center hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => setShowDeviceStats(true)}>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Clock className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <span className="text-xs text-slate-600">Last Ticket</span>
                                                <span className="text-lg font-bold text-blue-600">
                                                    {memberTickets.length > 0 ? memberTickets[0]?.code?.slice(-3) || '000' : '---'}
                                                </span>
                                            </div>
                                        </Card>

                                        {/* Device Status */}
                                        <Card className="p-3 text-center hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => setShowDeviceStats(true)}>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <Monitor className="w-4 h-4 text-green-600" />
                                                </div>
                                                <span className="text-xs text-slate-600">Devices</span>
                                                <span className="text-lg font-bold text-green-600">
                                                    {deviceOptions.length}
                                                </span>
                                            </div>
                                        </Card>

                                        {/* Active Tickets */}
                                        <Card className="p-3 text-center hover:shadow-md transition-shadow">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                                </div>
                                                <span className="text-xs text-slate-600">Active</span>
                                                <span className="text-lg font-bold text-amber-600">
                                                    {memberTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length}
                                                </span>
                                            </div>
                                        </Card>
                                    </div>
                                    {/* Información del Usuario */}
                                    <div className="flex items-center gap-3 min-w-max">
                                        <div className="relative">
                                            <img
                                                src={`/storage/${memberData?.photo}`}
                                                alt={memberData?.name}
                                                className="w-16 h-16 rounded-full border-2 border-primary object-cover shadow-lg"
                                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                    e.currentTarget.src = '/images/default-user.png';
                                                }}
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                <Shield className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h1 className="text-2xl font-bold text-accent">
                                                {memberData?.name}
                                            </h1>
                                            <p className="text-slate-600 text-sm flex items-center gap-1">
                                                <Home className="w-3 h-3" />
                                                {apartmentData?.name} | {buildingData?.name}
                                            </p>
                                        </div>
                                        
                                        {/* NinjaOne Device Alerts Notification */}
                                        <div className="relative">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowNinjaOneNotifications(!showNinjaOneNotifications)}
                                                className={`relative ${
                                                    userDeviceAlerts.length > 0 
                                                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' 
                                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                                                }`}
                                            >
                                                <Bell className="w-4 h-4" />
                                                {userDeviceAlerts.length > 0 && (
                                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                        {userDeviceAlerts.length}
                                                    </span>
                                                )}
                                            </Button>
                                            
                                            {/* Notification Dropdown */}
                                            {showNinjaOneNotifications && (
                                                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                                    <div className="p-4 border-b border-gray-200">
                                                        <h3 className="font-semibold text-gray-900">Device Alerts</h3>
                                                        <p className="text-sm text-gray-600">NinjaOne device health notifications</p>
                                                    </div>
                                                    
                                                    <div className="max-h-96 overflow-y-auto">
                                                        {loadingUserAlerts ? (
                                                            <div className="p-4 text-center">
                                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                                                <p className="text-sm text-gray-600 mt-2">Loading alerts...</p>
                                                            </div>
                                                        ) : userDeviceAlerts.length === 0 ? (
                                                            <div className="p-4 text-center text-gray-500">
                                                                <Shield className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                                                <p className="text-sm">All your devices are healthy!</p>
                                                            </div>
                                                        ) : (
                                                            userDeviceAlerts.map((alert, index) => (
                                                                <div key={index} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={`w-3 h-3 rounded-full mt-1 ${
                                                                            alert.health_status === 'critical' ? 'bg-red-500' :
                                                                            alert.health_status === 'offline' ? 'bg-gray-500' :
                                                                            alert.health_status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                                                        }`}></div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <h4 className="font-medium text-gray-900">{alert.device_name}</h4>
                                                                                <button 
                                                                                    onClick={() => dismissDeviceAlert(alert.device_id)}
                                                                                    className="text-gray-400 hover:text-gray-600"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                            <p className="text-sm text-gray-600 capitalize">
                                                                                Status: {alert.health_status}
                                                                            </p>
                                                                            {alert.issues_count > 0 && (
                                                                                <p className="text-sm text-red-600">
                                                                                    {alert.issues_count} issue{alert.issues_count > 1 ? 's' : ''} detected
                                                                                </p>
                                                                            )}
                                                                            <div className="mt-2 flex gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => createTicketFromDeviceAlert(alert)}
                                                                                    disabled={creatingTicketFromAlert === alert.device_id}
                                                                                    className="text-xs"
                                                                                >
                                                                                    {creatingTicketFromAlert === alert.device_id ? (
                                                                                        <>
                                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                                                            Creating...
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <Plus className="w-3 h-3 mr-1" />
                                                                                            Create Ticket
                                                                                        </>
                                                                                    )}
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                  

                                    {/* Acciones Rápidas  <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowHelpModal(true)}
                                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                        >
                                            <HelpCircle className="w-4 h-4 mr-1" />
                                            Ayuda
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open('tel:+1234567890', '_self')}
                                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                        >
                                            <PhoneCall className="w-4 h-4 mr-1" />
                                            Llamar
                                        </Button>
                                    </div>*/}
                                   

                                    {/* Consejo del Mes   {memberTickets.filter((t: any) => new Date(t.created_at).getMonth() === new Date().getMonth()).length === 0 && (
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 max-w-md">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Award className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-semibold text-green-800">¡Felicitaciones!</span>
                                            </div>
                                            <p className="text-xs text-green-700">
                                                Este mes no has reportado incidencias. ¡Excelente trabajo!
                                            </p>
                                        </div>
                                    )}*/}
                                  

                                    {/* Sugerencia de Mantenimiento 
                                     <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 max-w-md">
                                        <div className="flex items-center gap-2 mb-1">
                                            <LightbulbIcon className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-800">Consejo del mes</span>
                                        </div>
                                        <p className="text-xs text-blue-700">
                                            Reinicia tu router cada 2 semanas para mantener una conexión óptima.
                                        </p>
                                    </div> */}
                                   

                                </div>
                            </div>
                        </div>
                    </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {deviceOptions.length > 0 ? deviceOptions.map((device: any) => {
                                            // Determinar el estado del dispositivo basado en tickets activos
                                            const activeTickets = memberTickets.filter((ticket: any) => 
                                                ticket.device_id === device.id && 
                                                (ticket.status === 'open' || ticket.status === 'in_progress')
                                            );
                                            const hasActiveIssues = activeTickets.length > 0;

                                            return (
                                                <div key={device.id} className="space-y-3">
                                                    {/* Botón principal del dispositivo */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setData('device_id', device.id.toString());
                                                            setShowCreateModal(true);
                                                        }}
                                                        className={`relative flex flex-row items-center bg-white border-2 rounded-xl shadow-md hover:shadow-xl p-5 w-full transition-all duration-300 group ${
                                                            hasActiveIssues 
                                                                ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50/50' 
                                                                : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                                                        }`}
                                                    >
                                                        {/* Estado del dispositivo */}
                                                        <div className={`absolute top-4 right-4 w-3 h-3 rounded-full shadow-sm ${
                                                            hasActiveIssues ? 'bg-amber-400' : 'bg-green-400'
                                                        }`}></div>

                                                        {/* Icono principal */}
                                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center mr-5 flex-shrink-0 transition-colors duration-300 ${
                                                            hasActiveIssues 
                                                                ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-200' 
                                                                : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                                                        }`}>
                                                            {device.icon_id ? (
                                                                <DeviceIcon deviceIconId={device.icon_id} size={32} />
                                                            ) : (
                                                                <Monitor className="w-8 h-8" />
                                                            )}
                                                        </div>

                                                        {/* Información principal del dispositivo */}
                                                        <div className="flex-1 min-w-0 space-y-3">
                                                            {/* Encabezado con nombre */}
                                                            <div className="flex items-start justify-between">
                                                                <h3 className="font-bold text-slate-800 text-lg truncate pr-2 leading-tight">
                                                                    {device.name_device?.name || device.name || `Device #${device.id}`}
                                                                </h3>
                                                            </div>

                                                            {/* Fila 1: Marca, Modelo y Sistema */}
                                                            <div className="flex flex-wrap gap-2">
                                                                {device.brand && (
                                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                                        <Tag className="w-3 h-3 mr-1" />
                                                                        {device.brand.name}
                                                                    </span>
                                                                )}
                                                                {device.model && (
                                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                                        <Smartphone className="w-3 h-3 mr-1" />
                                                                        {device.model.name}
                                                                    </span>
                                                                )}
                                                                {device.system && (
                                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                                        <Settings className="w-3 h-3 mr-1" />
                                                                        {device.system.name}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Fila 2: Ubicación */}
                                                            {device.ubicacion && (
                                                                <div className="flex items-center text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                                                    <Home className="w-4 h-4 mr-2 text-slate-500" />
                                                                    <span className="truncate font-medium">
                                                                        {device.ubicacion}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Fila 3: Estado del dispositivo y usuarios */}
                                                            <div className="flex items-center justify-between">
                                                                {/* Estado */}
                                                                <div className="flex-1 mr-4">
                                                                    {hasActiveIssues ? (
                                                                        <div className="flex items-center text-sm text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">
                                                                            <AlertCircle className="w-4 h-4 mr-2" />
                                                                            <span className="font-medium">{activeTickets.length} issue{activeTickets.length !== 1 ? 's' : ''}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center text-sm text-green-700 bg-green-100 px-3 py-1.5 rounded-lg border border-green-200">
                                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                                            <span className="font-medium">Working</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Usuarios y botón de acción */}
                                                                <div className="flex items-center gap-3">
                                                                    {/* Usuarios */}
                                                                    <div className="flex items-center -space-x-1">
                                                                        {/* Dueño */}
                                                                        {device.owner && (
                                                                            <TooltipProvider key={device.owner[0].id}>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger>
                                                                                        <img
                                                                                            src={`/storage/${device.owner[0].photo}`}
                                                                                            alt={device.owner[0].name}
                                                                                            title={`Owner: ${device.owner[0].name}`}
                                                                                            className="w-7 h-7 object-cover rounded-full border-2 border-yellow-400 hover:border-yellow-500 transition-colors"
                                                                                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                                                e.currentTarget.src = '/images/default-user.png';
                                                                                            }}
                                                                                        />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p>Owner: {device.owner[0].name}</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                        {/* Compartido con */}
                                                                        {Array.isArray(device.shared_with) && device.shared_with.length > 0 && device.shared_with.slice(0, 2).map((tenant: any) => (
                                                                            <TooltipProvider key={tenant.id}>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger>
                                                                                        <img
                                                                                            src={`/storage/${tenant.photo}`}
                                                                                            alt={tenant.name}
                                                                                            title={`Shared with: ${tenant.name}`}
                                                                                            className="w-7 h-7 object-cover rounded-full border-2 border-blue-400 hover:border-blue-500 transition-colors"
                                                                                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                                                e.currentTarget.src = '/images/default-user.png';
                                                                                            }}
                                                                                        />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p>Shared with: {tenant.name}</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        ))}
                                                                        {/* Mostrar +N si hay más usuarios */}
                                                                        {Array.isArray(device.shared_with) && device.shared_with.length > 2 && (
                                                                            <div className="w-7 h-7 bg-slate-200 rounded-full border-2 border-slate-400 flex items-center justify-center hover:bg-slate-300 transition-colors">
                                                                                <span className="text-xs font-bold text-slate-600">
                                                                                    +{device.shared_with.length - 2}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Botón de acción */}
                                                                    <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-full group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300 flex-shrink-0">
                                                                        <span className="text-primary text-lg font-bold">+</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Indicador de hover */}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                                    </button>

                                                    {/* NinjaOne Integration - Solo mostrar si el dispositivo tiene integración habilitada */}
                                                    {device.ninjaone_enabled && (
                                                        <div className="space-y-2">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleDeviceAlerts(device.id);
                                                                }}
                                                                className="w-full flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Shield className="w-4 h-4 text-blue-600" />
                                                                    <span className="font-medium text-blue-800">NinjaOne Alerts</span>
                                                                    {deviceAlerts.filter(alert => alert.device_id === device.id && alert.status !== 'resolved').length > 0 && (
                                                                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                                                            {deviceAlerts.filter(alert => alert.device_id === device.id && alert.status !== 'resolved').length}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className={`transition-transform ${showNinjaOneAlerts[device.id] ? 'rotate-180' : ''}`}>
                                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </button>

                                                            {/* Mostrar alertas cuando están expandidas */}
                                                            {showNinjaOneAlerts[device.id] && (
                                                                <div className="space-y-2 pl-4">
                                                                    {loadingAlerts[device.id] ? (
                                                                        <div className="flex items-center justify-center py-4">
                                                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                                                            <span className="ml-2 text-sm text-gray-600">Loading alerts...</span>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {deviceAlerts.filter(alert => alert.device_id === device.id).length === 0 ? (
                                                                                <div className="text-center py-4 text-sm text-gray-500">
                                                                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                                                                    No active alerts for this device
                                                                                </div>
                                                                            ) : (
                                                                                deviceAlerts
                                                                                    .filter(alert => alert.device_id === device.id)
                                                                                    .map(alert => (
                                                                                        <NinjaOneAlertCard
                                                                                            key={alert.id}
                                                                                            alert={alert}
                                                                                            onAcknowledge={acknowledgeAlert}
                                                                                            onResolve={resolveAlert}
                                                                                            onCreateTicket={createTicketFromAlert}
                                                                                            showActions={true}
                                                                                        />
                                                                                    ))
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        }) : (
                                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                                                <Monitor className="w-16 h-16 mb-3 text-slate-300" />
                                                <p className="text-lg font-medium text-slate-600">No devices registered</p>
                                                <p className="text-sm text-slate-500">Contact your administrator to register devices</p>
                                            </div>
                                        )}
                                    </div>
                    </>
                    
                )}

                <div className="px-6 py-8">
                    <div className={`grid grid-cols-1 xl:grid-cols-12 gap-8`}>
                        {/* Main Content */}
                        <div className={`xl:col-span-8 flex flex-col gap-8`}>
                            {/* Tabs */}
                            {(isDoorman || isOwner) ? (
                                <>
                                    {/* Filtros para Doorman/Owner */}
                                    <Card className="shadow-lg border-0 !p-0">
                                        <CardContent className="!p-0">
                                            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl border border-primary/20 shadow-inner">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg flex-shrink-0">
                                                        <Filter className="w-6 h-6 text-primary-foreground" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-lg font-bold text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                                            Ticket Filters
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                                            Filter tickets by member or apartment
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col sm:flex-row gap-3 min-w-0 flex-1 xl:flex-initial xl:max-w-md">
                                                    {/* Filtro por Member */}
                                                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                                                        <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                                <Users className="w-2.5 h-2.5 text-primary" />
                                                            </div>
                                                            <span className="truncate">Filter by Member</span>
                                                        </label>
                                                        <SearchableSelect
                                                            value={selectedMemberFilter}
                                                            onValueChange={setSelectedMemberFilter}
                                                            placeholder="All Members"
                                                            searchPlaceholder="Search members..."
                                                            className="bg-background border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 shadow-sm text-sm min-w-0"
                                                            options={[
                                                                {
                                                                    value: 'all',
                                                                    label: 'All Members',
                                                                    icon: <Users className="w-4 h-4 text-primary" />
                                                                },
                                                                ...(allMembers ? allMembers.map((member) => ({
                                                                    value: member.id.toString(),
                                                                    label: member.name,
                                                                    subtitle: member.apartment_name ? `Apt: ${member.apartment_name}` : undefined,
                                                                    image: member.photo ? `/storage/${member.photo}` : '/images/default-user.png'
                                                                })) : [])
                                                            ]}
                                                        />
                                                    </div>

                                                    {/* Filtro por Apartment */}
                                                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                                                        <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                                                                <MapPin className="w-2.5 h-2.5 text-secondary" />
                                                            </div>
                                                            <span className="truncate">Filter by Apartment</span>
                                                        </label>
                                                        <SearchableSelect
                                                            value={selectedApartmentFilter}
                                                            onValueChange={setSelectedApartmentFilter}
                                                            placeholder="All Apartments"
                                                            searchPlaceholder="Search apartments..."
                                                            className="bg-background border-border focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20 shadow-sm text-sm min-w-0"
                                                            options={[
                                                                {
                                                                    value: 'all',
                                                                    label: 'All Apartments',
                                                                    icon: <Home className="w-4 h-4 text-secondary" />
                                                                },
                                                                ...(allApartments ? allApartments.map((apartment) => ({
                                                                    value: apartment.id.toString(),
                                                                    label: apartment.name,
                                                                    subtitle: apartment.building ? apartment.building.name : undefined,
                                                                    icon: <Home className="w-4 h-4 text-accent" />
                                                                })) : [])
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                  
                                    
                                    <div className="kanban-container flex w-full min-h-[500px] overflow-x-scroll">
                                        <KanbanBoard
                                            tickets={getFilteredTicketsForDoormanOwner()}
                                            user={auth.user}
                                            onTicketClick={handleSelectTicket}
                                            isTechnicalDefault={false}
                                            isTechnical={false}
                                            isSuperAdmin={false}
                                            isMember={false}
                                            statusFilter={statusFilter}
                                            onAssign={(ticket) => setShowAssignModal({ open: true, ticketId: ticket.id })}
                                            onComment={(ticket) => setShowHistoryModal({ open: true, ticketId: ticket.id })}
                                            onDelete={handleDelete}
                                            onStatusChange={(ticketId) => {
                                                if (selectedTicket && selectedTicket.id === ticketId) {
                                                    refreshSelectedTicket(ticketId);
                                                }
                                            }}
                                            onStatusChangeWithComment={(ticket, newStatus) => {
                                                handleStatusChange(ticket, newStatus);
                                            }}
                                        />
                                    </div>

                                    {/* Indicador de filtros activos */}
                                    {(selectedMemberFilter !== 'all' || selectedApartmentFilter !== 'all') && (
                                        <div className="mt-4 p-3 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 rounded-lg shadow-sm overflow-hidden">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 text-sm text-foreground min-w-0">
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                        <Filter className="w-2.5 h-2.5 text-primary" />
                                                    </div>
                                                    <span className="font-semibold flex-shrink-0">Active Filters:</span>
                                                    <div className="flex flex-wrap gap-1.5 min-w-0">
                                                        {selectedMemberFilter !== 'all' && (
                                                            <span className="bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground px-2 py-1 rounded-full text-xs font-medium border border-primary/30 shadow-sm truncate max-w-32">
                                                                Member: {allMembers?.find(m => m.id.toString() === selectedMemberFilter)?.name}
                                                            </span>
                                                        )}
                                                        {selectedApartmentFilter !== 'all' && (
                                                            <span className="bg-gradient-to-r from-secondary/20 to-accent/20 text-foreground px-2 py-1 rounded-full text-xs font-medium border border-secondary/30 shadow-sm truncate max-w-32">
                                                                Apt: {allApartments?.find(a => a.id.toString() === selectedApartmentFilter)?.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedMemberFilter('all');
                                                        setSelectedApartmentFilter('all');
                                                    }}
                                                    className="text-primary border-primary/30 hover:bg-primary hover:border-primary/50 transition-all duration-200 shadow-sm text-xs px-3 py-1.5 flex-shrink-0"
                                                >
                                                    Clear All
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (isTechnicalDefault || isSuperAdmin || isTechnical) ? (
                                <>
                                   
                                    <div className="kanban-container flex w-full min-h-[500px] overflow-x-scroll">
                                        <KanbanBoard
                                            tickets={statusFilter ? allTickets : (allTicketsUnfiltered.length > 0 ? allTicketsUnfiltered : allTickets)}
                                            user={auth.user}
                                            onTicketClick={handleSelectTicket}
                                            isTechnicalDefault={isTechnicalDefault}
                                            isTechnical={isTechnical}
                                            isSuperAdmin={isSuperAdmin}
                                            isMember={isMember}
                                            statusFilter={statusFilter} // Pasar el filtro de estado
                                            onAssign={(ticket) => setShowAssignModal({ open: true, ticketId: ticket.id })}
                                            onComment={(ticket) => setShowHistoryModal({ open: true, ticketId: ticket.id })}
                                            onDelete={handleDelete}
                                            onStatusChange={(ticketId) => {
                                                if (selectedTicket && selectedTicket.id === ticketId) {
                                                    refreshSelectedTicket(ticketId);
                                                }
                                            }}
                                            onStatusChangeWithComment={(ticket, newStatus) => {
                                                handleStatusChange(ticket, newStatus);
                                            }}
                                        />
                                    </div>
                                </>
                            ) : isMember ? (
                                // Solo mostrar tabs locales si NO hay filtro del backend
                                !statusFilter ? (
                                    <Card className="shadow-none border-0 bg-transparent mb-10">
                                        <CardContent className="p-0">
                                            <Tabs value={memberTab} onValueChange={setMemberTab} className="w-full">
                                                <TabsList className="grid w-full grid-cols-5 bg-transparent rounded-full p-1">
                                                    {memberTabs.map((tabItem) => {
                                                        // Define color classes for each tab
                                                        let colorClass = "";
                                                        let countColor = "";
                                                        let iconColor = "";
                                                        switch (tabItem.value) {
                                                            case "all":
                                                                colorClass = "data-[state=active]:text-blue-700";
                                                                countColor = "text-blue-700";
                                                                iconColor = "text-blue-700";
                                                                break;
                                                            case "open":
                                                                colorClass = "data-[state=active]:text-yellow-600";
                                                                countColor = "text-yellow-600";
                                                                iconColor = "text-yellow-600";
                                                                break;
                                                            case "in_progress":
                                                                colorClass = "data-[state=active]:text-amber-700";
                                                                countColor = "text-amber-700";
                                                                iconColor = "text-amber-700";
                                                                break;
                                                            case "resolved":
                                                                colorClass = "data-[state=active]:text-emerald-700";
                                                                countColor = "text-emerald-700";
                                                                iconColor = "text-emerald-700";
                                                                break;
                                                            case "closed":
                                                                colorClass = "data-[state=active]:text-slate-700";
                                                                countColor = "text-slate-700";
                                                                iconColor = "text-slate-700";
                                                                break;
                                                            default:
                                                                colorClass = "";
                                                                countColor = "text-blue-700";
                                                                iconColor = "text-blue-700";
                                                        }
                                                        return (
                                                            <TabsTrigger
                                                                key={tabItem.value}
                                                                value={tabItem.value}
                                                                className={`flex flex-col items-center py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all rounded-xl ${colorClass}`}
                                                            >
                                                                <span className={`font-bold text-3xl ${countColor}`}>
                                                                    {tabItem.value === "all"
                                                                        ? memberTickets.length
                                                                        : memberTickets.filter((t: any) => t.status === tabItem.value).length}
                                                                </span>
                                                                <div className="flex gap-2 items-center">
                                                                    <tabItem.icon className={`w-5 h-5 ${iconColor}`} />
                                                                    <span className="text-sm">{tabItem.label}</span>
                                                                </div>
                                                            </TabsTrigger>
                                                        );
                                                    })}
                                                </TabsList>
                                            </Tabs>
                                        </CardContent>
                                    </Card>
                                ) : null // No mostrar tabs cuando hay filtro del backend
                            ) : (
                                <Card className="shadow-none border-0 bg-transparent mb-10">
                                    <CardContent className="p-0">
                                        <Tabs value={tab} onValueChange={v => setTab(v as "all" | "assigned" | "approved")} className="w-full">
                                            <TabsList className="grid w-full grid-cols-3 bg-transparent rounded-full p-1">
                                                <TabsTrigger
                                                    value="all"
                                                    className="flex flex-col items-center py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-700  transition-all rounded-xl"
                                                >
                                                    <span className="ml-1  py-2 text-blue-700 px-2 rounded-full text-3xl">{allTickets.length}</span>
                                                    <div className="flex gap-2 items-center">
                                                        <Eye className="w-4 h-4" /> Todos{" "}

                                                    </div>
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="assigned"
                                                    className="flex flex-col items-center py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-purple-700  transition-all rounded-xl"
                                                >
                                                    <span className="ml-1  text-purple-700 px-2 rounded-full text-3xl">{assignedTickets.length}</span>
                                                    <div className="flex gap-2 items-center">
                                                        <UserIcon className="w-4 h-4" />
                                                        Asignados{" "}
                                                    </div>

                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="approved"
                                                    className="flex flex-col items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700  transition-all rounded-xl"
                                                >

                                                    <span className="ml-1 text-emerald-700 px-2 rounded-full text-3xl">
                                                        {approvedTickets.length}
                                                    </span>
                                                    <div className="flex gap-2 items-center">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Resueltos{" "}
                                                    </div>
                                                </TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            )}

                            {/**TICKETS GRID AQUI */}
                            {isMember && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {memberFilteredTickets.length === 0 ? (
                                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                                            <AlertCircle className="w-12 h-12 mb-3" />
                                            <p className="text-lg font-medium">No tickets found</p>
                                            <p className="text-sm">Create a ticket by selecting a device above</p>
                                        </div>
                                    ) : (
                                        memberFilteredTickets.map((ticket: any) => (
                                            <Card
                                                key={ticket.id}
                                                className={`cursor-pointer transition-all hover:shadow-lg  ${selectedTicket?.id === ticket.id
                                                        ? 'border-primary bg-blue-50/50'
                                                        : ' '
                                                    }`}
                                                onClick={() => handleSelectTicket(ticket)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between">
                                                            <h3 className="font-semibold text-slate-900 line-clamp-1">
                                                                {ticket.title}
                                                            </h3>
                                                            <StatusBadge status={ticket.status} />
                                                        </div>

                                                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                                                            {ticket.description}
                                                        </p>

                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <CategoryBadge category={ticket.category} />
                                                            <DeviceBadge device={ticket.device} />
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                                                            <span className="bg-slate-100 px-2 py-1 rounded">{ticket.code}</span>
                                                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                        </div>

                                                        {ticket.technical && (
                                                            <div className="flex items-center gap-2 text-xs text-slate-700 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                                                                <UserIcon className="w-3 h-3 text-green-600" />
                                                                <span>Assigned to <strong>{ticket.technical.name}</strong></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Sidebar - Ticket Details */}
                        <div className={`${isMember ? "xl:col-span-4" : "xl:col-span-4"}`}>
                            <div className="sticky top-8  rounded-lg shadow-2xl">
                                <Card className="shadow-2xl border-0 bg-gradient-to-br from-background via-sidebar to-muted overflow-hidden">
                                    <CardHeader className="border-b-2 border-primary text-primary-foreground pb-6 relative overflow-hidden">
                                        {/* Elegant Background Pattern */}
                                        <div className="absolute inset-0 "></div>
                                        <div className="absolute top-0 right-0 w-32 h-32  rounded-full transform translate-x-16 -translate-y-16"></div>

                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center">
                                                    <Eye className="w-6 h-6 text-primary-foreground" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black">Ticket Details</h2>
                                                    <p className="text-primary-foreground/80 text-sm font-medium">Complete ticket information</p>
                                                </div>
                                            </div>
                                            {/*selectedTicket && (
                                                <div className="text-right">
                                                    <span className="text-sm bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-primary-foreground/20 font-mono text-primary-foreground/90">
                                                        ID #{selectedTicket.id}
                                                    </span>
                                                </div>
                                            )*/}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                                            {selectedTicketLoading && (
                                                <div className="flex items-center justify-center h-64">
                                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                                </div>
                                            )}

                                            {!selectedTicket && !selectedTicketLoading && (
                                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6">
                                                    <Eye className="w-12 h-12 mb-3" />
                                                    <h3 className="font-medium text-slate-600 mb-1">Select a ticket</h3>
                                                    <p className="text-sm text-center">
                                                        Click any ticket to view its full details
                                                    </p>
                                                </div>
                                            )}

                                            {selectedTicket && !selectedTicketLoading && (
                                                <div className="space-y-6">
                                                    {/* Ticket Title & Status */}
                                                    <div className="p-6 border-b border-border">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <h3 className="text-lg font-bold text-foreground leading-tight pr-4">
                                                                {selectedTicket.title}
                                                            </h3>
                                                            <StatusBadge status={selectedTicket.status} />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                                            {selectedTicket.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <CategoryBadge category={selectedTicket.category} />
                                                            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                                                {selectedTicket.code}
                                                            </span>
                                                            {/* Badge para mostrar si fue creado por Owner o Doorman */}
                                                            {selectedTicket.created_by_owner_id && selectedTicket.created_by_owner && (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                                                    <Building2 className="w-3 h-3" />
                                                                    Created by Owner: {selectedTicket.created_by_owner.name}
                                                                </span>
                                                            )}
                                                            {selectedTicket.created_by_doorman_id && selectedTicket.created_by_doorman && (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                                    <ShieldCheck className="w-3 h-3" />
                                                                    Created by Doorman: {selectedTicket.created_by_doorman.name}
                                                                </span>
                                                            )}
                                                            {selectedTicket.created_by_admin_id && selectedTicket.created_by_admin && (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                                                    <Shield className="w-3 h-3" />
                                                                    Created by Admin: {selectedTicket.created_by_admin.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Device Information - Compact Badges Row */}
                                                    {selectedTicket.device && (
                                                        <div className="px-6">
                                                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                {selectedTicket.device.icon_id ? (
                                                                    <DeviceIcon deviceIconId={selectedTicket.device.icon_id} size={16} />
                                                                ) : (
                                                                    <Monitor className="w-4 h-4 text-primary" />
                                                                )}
                                                                Device Information
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                                                                    {selectedTicket.device?.icon_id ? (
                                                                        <DeviceIcon deviceIconId={selectedTicket.device.icon_id} size={12} />
                                                                    ) : (
                                                                        <Cpu className="w-3 h-3" />
                                                                    )}
                                                                    {selectedTicket.device.name_device?.name || selectedTicket.device.name || 'Unknown Device'}
                                                                </div>
                                                                {selectedTicket.device.brand && (
                                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary-foreground rounded-full text-xs font-medium border border-secondary/20">
                                                                        <Tag className="w-3 h-3" />
                                                                        {selectedTicket.device.brand.name}
                                                                    </div>
                                                                )}
                                                                {selectedTicket.device.model && (
                                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-primary-foreground rounded-full text-xs font-medium border border-accent/20">
                                                                        <Smartphone className="w-3 h-3" />
                                                                        {selectedTicket.device.model.name}
                                                                    </div>
                                                                )}
                                                                {selectedTicket.device.system && (
                                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-primary-foreground rounded-full text-xs font-medium border border-border">
                                                                        <Settings className="w-3 h-3" />
                                                                        {selectedTicket.device.system.name}
                                                                    </div>
                                                                )}
                                                                {  selectedTicket.device.ubicacion && (
                                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-200">
                                                                        <Home className="w-3 h-3" />
                                                                        {selectedTicket.device.ubicacion}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Creator Information */}
                                                    {selectedTicket.user?.tenant && (
                                                        <div className="px-6">
                                                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                <User className="w-4 h-4 text-secondary" />
                                                                Created by
                                                            </h4>
                                                            <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                                                        <User className="w-5 h-5 text-secondary" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-foreground text-sm">{selectedTicket.user.tenant.name}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {selectedTicket.user.tenant.apartment?.name} - {selectedTicket.user.tenant.apartment?.building?.name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {selectedTicket.user.tenant.email && (
                                                                        <a
                                                                            href={`mailto:${selectedTicket.user.tenant.email}`}
                                                                            className="p-2 bg-secondary/10 hover:bg-secondary/20 rounded-full transition-colors"
                                                                            title={`Send email to ${selectedTicket.user.tenant.name}`}
                                                                        >
                                                                            <Mail className="w-4 h-4 text-secondary" />
                                                                        </a>
                                                                    )}
                                                                    {selectedTicket.user.tenant.phone && (
                                                                        <a
                                                                            href={`tel:${selectedTicket.user.tenant.phone}`}
                                                                            className="p-2 bg-secondary/10 hover:bg-secondary/20 rounded-full transition-colors"
                                                                            title={`Call ${selectedTicket.user.tenant.name}`}
                                                                        >
                                                                            <Phone className="w-4 h-4 text-secondary" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Technical Assignment */}
                                                    <div className="px-6">
                                                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                            <UserCheck className="w-4 h-4 text-accent" />
                                                            Technical Assignment
                                                        </h4>

                                                        {selectedTicket.technical ? (
                                                            <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg border border-accent/20">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                                                        <UserCheck className="w-5 h-5 text-accent" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-foreground text-sm">{selectedTicket.technical.name}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {selectedTicket.technical.shift && `Shift: ${selectedTicket.technical.shift}`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {selectedTicket.technical.email && (
                                                                        <a
                                                                            href={`mailto:${selectedTicket.technical.email}`}
                                                                            className="p-2 bg-accent/10 hover:bg-accent/20 rounded-full transition-colors"
                                                                            title={`Send email to ${selectedTicket.technical.name}`}
                                                                        >
                                                                            <Mail className="w-4 h-4 text-accent" />
                                                                        </a>
                                                                    )}
                                                                    {selectedTicket.technical.phone && (
                                                                        <a
                                                                            href={`tel:${selectedTicket.technical.phone}`}
                                                                            className="p-2 bg-accent/10 hover:bg-accent/20 rounded-full transition-colors"
                                                                            title={`Call ${selectedTicket.technical.name}`}
                                                                        >
                                                                            <Phone className="w-4 h-4 text-accent" />
                                                                        </a>
                                                                    )}
                                                                    {(isTechnicalDefault || isSuperAdmin) && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => setShowAssignModal({ open: true, ticketId: selectedTicket.id })}
                                                                                className="p-2 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
                                                                                title="Change technical assignment"
                                                                            >
                                                                                <UserPlus className="w-4 h-4 text-primary" />
                                                                            </button>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    router.post(`/tickets/${selectedTicket.id}/unassign`, {}, {
                                                                                        preserveScroll: true,
                                                                                        onSuccess: () => {
                                                                                            refreshSelectedTicket(selectedTicket.id);
                                                                                            // Forzar re-render del kanban
                                                                                            setRefreshKey(prev => prev + 1);
                                                                                        }
                                                                                    });
                                                                                }}
                                                                                className="p-2 bg-destructive/10 hover:bg-destructive/20 rounded-full transition-colors"
                                                                                title="Unassign technical"
                                                                            >
                                                                                <UserMinus className="w-4 h-4 text-destructive" />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                                        <UserMinus className="w-5 h-5 text-muted-foreground" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-muted-foreground text-sm">Unassigned</p>
                                                                        <p className="text-xs text-muted-foreground/70">No technical assigned yet</p>
                                                                    </div>
                                                                </div>
                                                                {(isTechnicalDefault || isSuperAdmin) && (
                                                                    <button
                                                                        onClick={() => setShowAssignModal({ open: true, ticketId: selectedTicket.id })}
                                                                        className="p-2 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
                                                                        title="Assign technical"
                                                                    >
                                                                        <UserPlus className="w-4 h-4 text-primary" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Scheduled Visit Section - VISIBLE TO ALL USERS */}
                                                    {selectedTicket.active_appointment && (
                                                        <div className="px-6 mb-4">
                                                            <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="w-4 h-4 text-blue-600" />
                                                                        <span className="text-sm font-medium text-blue-800">
                                                                            Scheduled Visit
                                                                        </span>
                                                                    </div>
                                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                        selectedTicket.active_appointment.status === 'scheduled' 
                                                                            ? 'bg-blue-100 text-blue-800'
                                                                            : selectedTicket.active_appointment.status === 'in_progress'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : selectedTicket.active_appointment.status === 'awaiting_feedback'
                                                                            ? 'bg-purple-100 text-purple-800'
                                                                            : 'bg-green-100 text-green-800'
                                                                    }`}>
                                                                        {selectedTicket.active_appointment.status === 'scheduled' 
                                                                            ? 'Scheduled' 
                                                                            : selectedTicket.active_appointment.status === 'in_progress'
                                                                            ? 'In Progress' 
                                                                            : selectedTicket.active_appointment.status === 'awaiting_feedback'
                                                                            ? 'Awaiting Feedback'
                                                                            : 'Completed'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-blue-700 mt-1">
                                                                    {formatLocalDateTime(selectedTicket.active_appointment.scheduled_for).date} {formatLocalDateTime(selectedTicket.active_appointment.scheduled_for).time}
                                                                </p>
                                                                <p className="text-xs text-blue-600 mt-1">
                                                                    {selectedTicket.active_appointment.title}
                                                                </p>
                                                                
                                                                {/* Appointment Actions */}
                                                                <div className="flex gap-2 mt-3">
                                                                    {/* Technical Actions */}
                                                                    {(isTechnical || isTechnicalDefault || isSuperAdmin) && (
                                                                        <>
                                                                            {selectedTicket.active_appointment.status === 'scheduled' && (
                                                                                <button
                                                                                    onClick={() => handleAppointmentAction('start', selectedTicket.active_appointment.id)}
                                                                                    className="text-xs px-3 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors font-medium"
                                                                                >
                                                                                    <PlayCircle className="w-3 h-3 inline mr-1" />
                                                                                    Start Visit
                                                                                </button>
                                                                            )}
                                                                            {selectedTicket.active_appointment.status === 'in_progress' && (
                                                                                <button
                                                                                    onClick={() => setShowAppointmentDetailsModal({ open: true, appointment: selectedTicket.active_appointment })}
                                                                                    className="text-xs px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors font-medium"
                                                                                >
                                                                                    <CheckCircle className="w-3 h-3 inline mr-1" />
                                                                                    Complete Visit
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                    
                                                                    {/* Member Action */}
                                                                    {isMember && selectedTicket.active_appointment.status === 'awaiting_feedback' && (
                                                                        <button
                                                                            onClick={() => setShowAppointmentDetailsModal({ open: true, appointment: selectedTicket.active_appointment })}
                                                                            className="text-xs px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors font-medium animate-pulse"
                                                                        >
                                                                            <Star className="w-3 h-3 inline mr-1" />
                                                                            Provide Feedback
                                                                        </button>
                                                                    )}
                                                                    
                                                                    {/* Common View Details Button */}
                                                                    <button
                                                                        onClick={() => setShowAppointmentDetailsModal({ open: true, appointment: selectedTicket.active_appointment })}
                                                                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors"
                                                                    >
                                                                        View Details
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Quick Actions */}
                                                    {(isTechnicalDefault || isSuperAdmin || selectedTicket.technical_id === auth.user?.id) && (
                                                        <div className="px-6">
                                                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                <Zap className="w-4 h-4 text-primary" />
                                                                Quick Actions
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => setShowHistoryModal({ open: true, ticketId: selectedTicket.id })}
                                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors border border-primary/20"
                                                                >
                                                                    <MessageSquare className="w-4 h-4" />
                                                                    Add Comment
                                                                </button>
                                                                
                                                                {/* Schedule Appointment Button - only for technicians working on the ticket */}
                                                                {selectedTicket.status === 'in_progress' && selectedTicket.technical_id && !selectedTicket.active_appointment && (isTechnical || isTechnicalDefault || isSuperAdmin) && (
                                                                    <button
                                                                        onClick={() => handleScheduleAppointment(selectedTicket.id)}
                                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200 hover:border-blue-300"
                                                                    >
                                                                        <Calendar className="w-4 h-4" />
                                                                        Schedule Visit
                                                                    </button>
                                                                )}

                                                               
                                                                {getNextStatuses(selectedTicket.status).map((status) => (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => handleStatusChange(selectedTicket, status)}
                                                                        disabled={statusLoadingId === selectedTicket.id}
                                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground rounded-lg text-sm font-medium transition-colors border border-secondary/20 disabled:opacity-50"
                                                                    >
                                                                        {statusLoadingId === selectedTicket.id ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle className="w-4 h-4" />
                                                                        )}
                                                                        Mark as {statusConfig[status]?.label || status}
                                                                    </button>
                                                                ))}
                                                                {/* Delete button - only for super admins */}
                                                                {isSuperAdmin && (
                                                                    <button
                                                                        onClick={() => handleDelete(selectedTicket)}
                                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg text-sm font-medium transition-colors border border-red-200 hover:border-red-300"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Delete Ticket
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Acciones Rápidas para Members */}
                                                    {isMember && selectedTicket.status === 'resolved' && !selectedTicket.histories?.some((h: any) => h.action === 'member_feedback') && (
                                                        <div className="px-6 mb-6">
                                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                                <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                                                                    <MessageSquare className="w-4 h-4" />
                                                                    ¿Cómo fue tu experiencia?
                                                                </h4>
                                                                <p className="text-sm text-green-600 mb-4">
                                                                    Tu ticket ha sido resuelto. Nos gustaría conocer tu opinión sobre el servicio recibido.
                                                                </p>
                                                                <button
                                                                    onClick={() => setShowMemberFeedbackModal({ open: true, ticketId: selectedTicket.id })}
                                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                                                                >
                                                                    <Star className="w-4 h-4" />
                                                                    Dar Feedback
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Línea de Tiempo Visual del Ticket */}
                                                    {isMember && selectedTicket.histories && selectedTicket.histories.length > 0 && (
                                                        <div className="px-6">
                                                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-indigo-600" />
                                                                Línea de Tiempo
                                                            </h4>
                                                            <div className="relative">
                                                                {/* Línea vertical */}
                                                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 to-indigo-100"></div>

                                                                <div className="space-y-4">
                                                                    {[...selectedTicket.histories].reverse().map((entry: any, index: number) => (
                                                                        <div key={index} className="relative flex items-start gap-4">
                                                                            {/* Icono de estado */}
                                                                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 ${entry.action?.includes('created') ? 'bg-blue-100 border-blue-300' :
                                                                                    entry.action?.includes('assigned') ? 'bg-purple-100 border-purple-300' :
                                                                                        entry.action?.includes('in_progress') ? 'bg-amber-100 border-amber-300' :
                                                                                            entry.action?.includes('resolved') ? 'bg-green-100 border-green-300' :
                                                                                                entry.action?.includes('closed') ? 'bg-gray-100 border-gray-300' :
                                                                                                    'bg-indigo-100 border-indigo-300'
                                                                                }`}>
                                                                                {entry.action?.includes('created') ? <AlertCircle className="w-4 h-4 text-blue-600" /> :
                                                                                    entry.action?.includes('assigned') ? <UserCheck className="w-4 h-4 text-purple-600" /> :
                                                                                        entry.action?.includes('in_progress') ? <Clock className="w-4 h-4 text-amber-600" /> :
                                                                                            entry.action?.includes('resolved') ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                                                                                                entry.action?.includes('closed') ? <XCircle className="w-4 h-4 text-gray-600" /> :
                                                                                                    <MessageSquare className="w-4 h-4 text-indigo-600" />}
                                                                            </div>

                                                                            {/* Contenido */}
                                                                            <div className="flex-1 min-w-0 pb-4">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="text-sm font-medium text-foreground">
                                                                                        {entry.technical?.name || entry.user?.name || 'Sistema'}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {formatHistoryDateTime(entry.created_at).date} a las {formatHistoryDateTime(entry.created_at).time}
                                                                                    </span>
                                                                                    {entry.action && (
                                                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${entry.action?.includes('created') ? 'bg-blue-100 text-blue-800' :
                                                                                                entry.action?.includes('assigned') ? 'bg-purple-100 text-purple-800' :
                                                                                                    entry.action?.includes('in_progress') ? 'bg-amber-100 text-amber-800' :
                                                                                                        entry.action?.includes('resolved') ? 'bg-green-100 text-green-800' :
                                                                                                            entry.action?.includes('closed') ? 'bg-gray-100 text-gray-800' :
                                                                                                                'bg-indigo-100 text-indigo-800'
                                                                                            }`}>
                                                                                            {entry.action.replaceAll('_', ' ').replaceAll('status change ', '')}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                                                    {entry.description}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Ticket History - Solo para técnicos */}
                                                    {!isMember && (
                                                        <div className="px-6 pb-6">
                                                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                                Complete Activity History
                                                            </h4>
                                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                                {selectedTicket.history && selectedTicket.history.length > 0 ? (
                                                                    [...selectedTicket.history].reverse().map((entry: any, index: number) => (
                                                                        <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                                                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="text-xs font-medium text-foreground">
                                                                                        {entry.user?.name || 'System'}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {formatHistoryDateTime(entry.created_at).date} a las {formatHistoryDateTime(entry.created_at).time}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                                                    {entry.description}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : selectedTicket.histories && selectedTicket.histories.length > 0 ? (
                                                                    [...selectedTicket.histories].reverse().map((entry: any, index: number) => (
                                                                        <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                                                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="text-xs font-medium text-foreground">
                                                                                        {entry.user?.name || entry.technical?.name || 'System'}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {formatHistoryDateTime(entry.created_at).date} a las {formatHistoryDateTime(entry.created_at).time}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-xs text-muted-foreground leading-relaxed">                                                                                {entry.description}
                                                                                </p>
                                                                                {entry.action && (
                                                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                                                        {entry.action.replaceAll('_', ' ')}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                                        <MessageSquare className="w-12 h-12 mb-3 text-muted-foreground/50" />
                                                                        <p className="text-sm font-medium">No activity yet</p>
                                                                        <p className="text-xs text-center">Comments and updates will appear here</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* History Modal */}
            <Dialog
                open={showHistoryModal.open}
                onOpenChange={(open) => setShowHistoryModal({ open, ticketId: showHistoryModal.ticketId })}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                            Add Comment
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            Add a comment or action to the ticket history for better tracking.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault()
                            setAddingHistory(true)
                            // Use Inertia.js to handle CSRF token automatically
                            router.post(`/tickets/${showHistoryModal.ticketId}/add-history`,
                                {
                                    action: historyAction,
                                    description: historyText
                                },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setShowHistoryModal({ open: false });
                                        setHistoryText("");
                                        setHistoryAction("comment");
                                        // Refresca el ticket seleccionado para ver el nuevo historial
                                        refreshSelectedTicket(showHistoryModal.ticketId);
                                        // También refrescar el kanban para mostrar los cambios
                                        setRefreshKey(prev => prev + 1);
                                    },
                                    onError: () => {
                                        alert("Error adding history entry");
                                    },
                                    onFinish: () => {
                                        setAddingHistory(false);
                                    }
                                }
                            );
                        }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-3">
                                    Action Type
                                </label>
                                <div className="relative">
                                    <Input
                                        value={historyAction}
                                        onChange={(e) => setHistoryAction(e.target.value)}
                                        placeholder="Ex: comment, resolution, consultation"
                                        className="pl-4 pr-4 h-12 text-base border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-3">
                                    Description
                                </label>
                                <div className="relative">
                                    <textarea
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base min-h-[120px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none transition-all duration-200"
                                        value={historyText}
                                        onChange={(e) => setHistoryText(e.target.value)}
                                        placeholder="Describe the action, update, or comment in detail..."
                                        required
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                                        {historyText.length}/500
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="pt-6 border-t border-slate-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowHistoryModal({ open: false })}
                                className="px-6 py-2.5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={addingHistory}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                {addingHistory ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Save Comment
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Assign Modal */}
            <Dialog
                open={showAssignModal.open}
                onOpenChange={(open) => setShowAssignModal({ open, ticketId: showAssignModal.ticketId })}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Share2 className="w-6 h-6 text-purple-600" />
                            </div>
                            {(() => {
                                const currentTicket = selectedTicket || allTickets.find(ticket => ticket.id === showAssignModal.ticketId);
                                return currentTicket?.technical ? 'Reassign Technician' : 'Assign Technician';
                            })()}
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            {(() => {
                                const currentTicket = selectedTicket || allTickets.find(ticket => ticket.id === showAssignModal.ticketId);
                                return currentTicket?.technical
                                    ? `Currently assigned to ${currentTicket.technical.name}. Select a different technician to reassign this ticket.`
                                    : 'Select a technician to assign this ticket and ensure proper handling.';
                            })()}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault()
                            if (!assignTechnicalId) return;
                            setAssigning(true);
                            // Use Inertia.js to handle CSRF token automatically
                            router.post(`/tickets/${showAssignModal.ticketId}/assign-technical`,
                                {
                                    technical_id: assignTechnicalId
                                },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setShowAssignModal({ open: false });
                                        setAssignTechnicalId(null);
                                        // Refresca el ticket seleccionado para ver el nuevo técnico
                                        refreshSelectedTicket(showAssignModal.ticketId);
                                        // Forzar re-render del kanban
                                        setRefreshKey(prev => prev + 1);
                                    },
                                    onError: () => {
                                        alert("Error assigning technician");
                                    },
                                    onFinish: () => {
                                        setAssigning(false);
                                    }
                                }
                            );
                        }}
                        className="space-y-6"
                    >
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-800 mb-3">
                                Available Technicians
                            </label>
                            <div className="space-y-2">
                                {technicals
                                    .filter((t) => {
                                        // Filtrar el técnico que ya está asignado al ticket
                                        const currentTicket = selectedTicket || allTickets.find(ticket => ticket.id === showAssignModal.ticketId);
                                        return !currentTicket?.technical || currentTicket.technical.id !== t.id;
                                    })
                                    .map((t) => (
                                        <div
                                            key={t.id}
                                            className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${assignTechnicalId === t.id
                                                    ? 'border-purple-500 bg-purple-50 shadow-md'
                                                    : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                                                }`}
                                            onClick={() => setAssignTechnicalId(t.id)}
                                        >
                                            <div className="relative">
                                                {t.photo ? (
                                                    <img
                                                        src={t.photo?.startsWith('http') ? t.photo : `/storage/${t.photo}`}
                                                        alt={t.name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                                                        {t.name?.substring(0, 1) || '?'}
                                                    </div>
                                                )}
                                                {assignTechnicalId === t.id && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-800">{t.name}</h4>
                                                <p className="text-sm text-slate-600">{t.email}</p>
                                                {t.shift && (
                                                    <p className="text-xs text-slate-500">Shift: {t.shift}</p>
                                                )}
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 ${assignTechnicalId === t.id
                                                    ? 'border-purple-500 bg-purple-500'
                                                    : 'border-slate-300'
                                                }`}>
                                                {assignTechnicalId === t.id && (
                                                    <div className="w-full h-full rounded-full bg-purple-500"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                {/* Mostrar mensaje si no hay técnicos disponibles */}
                                {technicals.filter((t) => {
                                    const currentTicket = selectedTicket || allTickets.find(ticket => ticket.id === showAssignModal.ticketId);
                                    return !currentTicket?.technical || currentTicket.technical.id !== t.id;
                                }).length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                            <UserCheck className="w-12 h-12 mb-3 text-slate-400" />
                                            <p className="text-sm font-medium">No other technicians available</p>
                                            <p className="text-xs text-center">All technicians are either assigned or unavailable</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                        <DialogFooter className="pt-6 border-t border-slate-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAssignModal({ open: false })}
                                className="px-6 py-2.5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={assigning || !assignTechnicalId}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                {assigning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Assign Technician
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Ticket Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-green-600" />
                            </div>
                            Create New Ticket
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            Fill out the form below to create a new support ticket for your device.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitTicket} className="space-y-6">
                        <div className="space-y-4">
                            {/* Tenant selection - only for admin/technical */}
                            {(isSuperAdmin || isTechnicalDefault || isTechnical) && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-3">Select Member</label>
                                    <select
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base bg-white focus:ring-2 focus:ring-transparent focus:outline-0 transition-all duration-200"
                                        value={data.tenant_id}
                                        onChange={e => setData('tenant_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select a member</option>
                                        {allTenants.map((tenant: any) => (
                                            <option key={tenant.id} value={tenant.id}>
                                                {tenant.name} - {tenant.apartment?.name || 'No apartment'} ({tenant.apartment?.building?.name || 'No building'})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.tenant_id && <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.tenant_id}
                                    </div>}
                                </div>
                            )}

                            {/* Device */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-3">Device</label>
                                <select
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base bg-white focus:ring-2 focus:ring-transparent focus:outline-0 transition-all duration-200"
                                    value={data.device_id}
                                    onChange={e => setData('device_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select a device</option>
                                    {deviceOptions.length > 0 ? (
                                        deviceOptions.map((d: any) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name_device?.name || d.name || `Device #${d.id}`}
                                                {(isSuperAdmin || isTechnicalDefault) && d.building_name && d.apartment_name && 
                                                    ` - ${d.building_name} / ${d.apartment_name}`
                                                }
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No devices available</option>
                                    )}
                                </select>
                                {errors.device_id && <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.device_id}
                                </div>}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-3">Category</label>
                                <select
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base bg-white  focus:ring-2 focus:ring-transparent focus:outline-0 transition-all duration-200"
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {TICKET_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.category && <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.category}
                                </div>}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-3">Title</label>
                                <Input
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className="border-2 h-12 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                                    required
                                    placeholder="Brief description of the issue"
                                />
                                {errors.title && <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.title}
                                </div>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-3">Description</label>
                                <div className="relative">
                                    <textarea
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base min-h-[120px] focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none transition-all duration-200"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        required
                                        placeholder="Please provide a detailed description of the issue, including any error messages, when it occurred, and steps to reproduce..."
                                        maxLength={1000}
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                                        {data.description.length}/1000
                                    </div>
                                </div>
                                {errors.description && <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.description}
                                </div>}
                            </div>
                        </div>

                        <DialogFooter className="pt-6 border-t border-slate-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-2.5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating Ticket...
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Create Ticket
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Status Change with Comment Modal */}
            <Dialog
                open={showStatusChangeModal.open}
                onOpenChange={(open) => setShowStatusChangeModal({
                    open,
                    ticketId: showStatusChangeModal.ticketId,
                    newStatus: showStatusChangeModal.newStatus,
                    ticket: showStatusChangeModal.ticket
                })}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            {showStatusChangeModal.newStatus === 'resolved' && 'Mark as Resolved'}
                            {showStatusChangeModal.newStatus === 'closed' && 'Close Ticket'}
                            {showStatusChangeModal.newStatus === 'cancelled' && 'Cancel Ticket'}
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            {showStatusChangeModal.newStatus === 'resolved' &&
                                'Please describe how you resolved this issue. This information is crucial for future reference and similar problems.'
                            }
                            {showStatusChangeModal.newStatus === 'closed' &&
                                'Please provide final comments before closing this ticket. Include any additional notes or recommendations.'
                            }
                            {showStatusChangeModal.newStatus === 'cancelled' &&
                                'Please explain why this ticket is being cancelled. This helps with tracking and future improvements.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (!statusChangeComment.trim()) return;

                            setChangingStatus(true);
                            setStatusLoadingId(showStatusChangeModal.ticketId || 0);

                            // Primero cambiar el estado
                            router.put(
                                `/tickets/${showStatusChangeModal.ticketId}`,
                                { status: showStatusChangeModal.newStatus },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        // Luego agregar el comentario con la acción
                                        router.post(`/tickets/${showStatusChangeModal.ticketId}/add-history`,
                                            {
                                                action: `status_change_${showStatusChangeModal.newStatus}`,
                                                description: statusChangeComment
                                            },
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setShowStatusChangeModal({ open: false });
                                                    setStatusChangeComment("");
                                                    refreshSelectedTicket(showStatusChangeModal.ticketId);
                                                    // Forzar re-render del kanban
                                                    setRefreshKey(prev => prev + 1);
                                                },
                                                onFinish: () => {
                                                    setChangingStatus(false);
                                                    setStatusLoadingId(null);
                                                }
                                            }
                                        );
                                    },
                                    onError: () => {
                                        alert("Error changing status");
                                        setChangingStatus(false);
                                        setStatusLoadingId(null);
                                    }
                                }
                            );
                        }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-3">
                                    {showStatusChangeModal.newStatus === 'resolved' && 'Resolution Details *'}
                                    {showStatusChangeModal.newStatus === 'closed' && 'Final Comments *'}
                                    {showStatusChangeModal.newStatus === 'cancelled' && 'Cancellation Reason *'}
                                </label>
                                <div className="relative">
                                    <textarea
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base min-h-[120px] focus:border-amber-500 focus:ring-2 focus:ring-amber-200 resize-none transition-all duration-200"
                                        value={statusChangeComment}
                                        onChange={(e) => setStatusChangeComment(e.target.value)}
                                        placeholder={
                                            showStatusChangeModal.newStatus === 'resolved'
                                                ? "Describe in detail how you fixed the issue, what tools/parts were used, and any preventive measures taken..."
                                                : showStatusChangeModal.newStatus === 'closed'
                                                    ? "Add any final notes, recommendations, or follow-up actions needed..."
                                                    : "Explain why this ticket is being cancelled and any alternative solutions provided..."
                                        }
                                        required
                                        maxLength={1000}
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                                        {statusChangeComment.length}/1000
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    * This comment is required and will be added to the ticket history for future reference.
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="pt-6 border-t border-slate-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowStatusChangeModal({ open: false })}
                                className="px-6 py-2.5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={changingStatus || !statusChangeComment.trim()}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                {changingStatus ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {showStatusChangeModal.newStatus === 'resolved' && 'Mark as Resolved'}
                                        {showStatusChangeModal.newStatus === 'closed' && 'Close Ticket'}
                                        {showStatusChangeModal.newStatus === 'cancelled' && 'Cancel Ticket'}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Quick Actions Modal - Para miembros */}
            <Dialog
                open={showQuickActionsModal.open}
                onOpenChange={(open) => setShowQuickActionsModal({ open, ticketId: showQuickActionsModal.ticketId })}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                            Additional Actions
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            These features will be available soon. For now, use the technician's contacts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Remote Assistance */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <Monitor className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-800">Remote Assistance</h4>
                            </div>
                            <p className="text-sm text-blue-700 mb-3">
                                Allows the technician to remotely access your device to solve the problem.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                                disabled
                            >
                                Coming soon
                            </Button>
                        </div>

                        {/* Upload File */}
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <Upload className="w-5 h-5 text-purple-600" />
                                <h4 className="font-semibold text-purple-800">Upload Evidence</h4>
                            </div>
                            <p className="text-sm text-purple-700 mb-3">
                                Upload photos, videos or documents related to the problem.
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                                    disabled
                                >
                                    <Camera className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                                    disabled
                                >
                                    <Video className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                                    disabled
                                >
                                    <FileText className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Direct Chat */}
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <MessageSquare className="w-5 h-5 text-green-600" />
                                <h4 className="font-semibold text-green-800">Direct Chat</h4>
                            </div>
                            <p className="text-sm text-green-700 mb-3">
                                Chat in real time with your assigned technician.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full border-green-300 text-green-700 hover:bg-green-100"
                                disabled
                            >
                                Start Chat (Coming Soon)
                            </Button>
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowQuickActionsModal({ open: false })}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rating Modal */}
            <Dialog
                open={showRatingModal.open}
                onOpenChange={(open) => setShowRatingModal({ open, ticketId: showRatingModal.ticketId })}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Star className="w-6 h-6 text-yellow-600" />
                            </div>
                            Rate Service
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            Your opinion helps us improve. How would you rate the solution to your problem?
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (ticketRating === 0) return;

                            setSubmittingRating(true);

                            // Agregar la calificación como comentario en el historial
                            router.post(`/tickets/${showRatingModal.ticketId}/add-history`,
                                {
                                    action: 'service_rating',
                                    description: `Calificación del servicio: ${ticketRating}/5 estrellas${ratingComment ? ` - ${ratingComment}` : ''}`
                                },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setShowRatingModal({ open: false });
                                        setTicketRating(0);
                                        setRatingComment("");
                                        refreshSelectedTicket(showRatingModal.ticketId);
                                    },
                                    onError: () => {
                                        alert("Error submitting rating");
                                    },
                                    onFinish: () => {
                                        setSubmittingRating(false);
                                    }
                                }
                            );
                        }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            {/* Rating Stars */}
                            <div className="text-center">
                                <div className="flex justify-center gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setTicketRating(star)}
                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${star <= ticketRating
                                                    ? 'bg-yellow-100 text-yellow-500 scale-110'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-400'
                                                }`}
                                        >
                                            <Star className={`w-6 h-6 ${star <= ticketRating ? 'fill-current' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm text-slate-600">
                                    {ticketRating === 0 && 'Selecciona una calificación'}
                                    {ticketRating === 1 && 'Muy insatisfecho'}
                                    {ticketRating === 2 && 'Insatisfecho'}
                                    {ticketRating === 3 && 'Neutral'}
                                    {ticketRating === 4 && 'Satisfecho'}
                                    {ticketRating === 5 && 'Muy satisfecho'}
                                </p>
                            </div>

                            {/* Optional Comment */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-3">
                                    Comentarios adicionales (opcional)
                                </label>
                                <textarea
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base min-h-[80px] focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 resize-none transition-all duration-200"
                                    value={ratingComment}
                                    onChange={(e) => setRatingComment(e.target.value)}
                                    placeholder="¿Algo específico que quieras comentar sobre el servicio?"
                                    maxLength={500}
                                />
                                <div className="text-xs text-slate-400 mt-1">
                                    {ratingComment.length}/500
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="pt-6 border-t border-slate-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowRatingModal({ open: false })}
                                className="px-6 py-2.5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submittingRating || ticketRating === 0}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                {submittingRating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Star className="w-4 h-4 mr-2" />
                                        Enviar Calificación
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Help/Guides Modal */}
            <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <HelpCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            ADK Assist Help Center
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            Find quick solutions and guides for the most common problems.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        {/* Guías Rápidas */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                Guías de Solución Rápida
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Wifi className="w-5 h-5 text-blue-600" />
                                        <h4 className="font-semibold text-blue-800">Problemas de Red</h4>
                                    </div>
                                    <p className="text-sm text-blue-700">
                                        Soluciones para conexión lenta, WiFi inestable y problemas de conectividad.
                                    </p>
                                </div>

                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Monitor className="w-5 h-5 text-green-600" />
                                        <h4 className="font-semibold text-green-800">Problemas de Hardware</h4>
                                    </div>
                                    <p className="text-sm text-green-700">
                                        Diagnóstico de equipos, periféricos y componentes del sistema.
                                    </p>
                                </div>

                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Settings className="w-5 h-5 text-purple-600" />
                                        <h4 className="font-semibold text-purple-800">Software y Aplicaciones</h4>
                                    </div>
                                    <p className="text-sm text-purple-700">
                                        Instalación, configuración y resolución de problemas de software.
                                    </p>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Shield className="w-5 h-5 text-amber-600" />
                                        <h4 className="font-semibold text-amber-800">Seguridad</h4>
                                    </div>
                                    <p className="text-sm text-amber-700">
                                        Antivirus, actualizaciones de seguridad y protección de datos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contacto de Emergencia */}
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-800">
                                <PhoneCall className="w-5 h-5 text-red-600" />
                                Contacto de Emergencia
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-red-700 mb-2">
                                        <strong>Soporte Técnico 24/7:</strong>
                                    </p>
                                    <a
                                        href="tel:+1234567890"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                        +1 (234) 567-890
                                    </a>
                                </div>
                                <div>
                                    <p className="text-sm text-red-700 mb-2">
                                        <strong>Email de Soporte:</strong>
                                    </p>
                                    <a
                                        href="mailto:soporte@adkassist.com"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        soporte@adkassist.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Tips y Recomendaciones */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <LightbulbIcon className="w-5 h-5 text-amber-600" />
                                Tips y Recomendaciones
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-xs font-bold text-amber-800">1</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-amber-800">Reinicia regularmente</h4>
                                        <p className="text-sm text-amber-700">Reinicia tu router cada 2 semanas y tu PC una vez por semana.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-xs font-bold text-blue-800">2</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-blue-800">Mantén actualizado</h4>
                                        <p className="text-sm text-blue-700">Instala las actualizaciones de Windows y antivirus automáticamente.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-xs font-bold text-green-800">3</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-green-800">Respaldo regular</h4>
                                        <p className="text-sm text-green-700">Guarda copias de tus archivos importantes en la nube o disco externo.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowHelpModal(false)}
                            className="w-full"
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Device Stats Modal */}
            <Dialog open={showDeviceStats} onOpenChange={setShowDeviceStats}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-indigo-600" />
                            </div>
                            Device and Ticket Summary
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            Statistics of your devices and tickets from last month.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        {/* Estadísticas Generales */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Monitor className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold text-blue-600">{deviceOptions.length}</div>
                                <div className="text-xs text-blue-700">Devices</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    {memberTickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length}
                                </div>
                                <div className="text-xs text-green-700">Resolved</div>
                            </div>
                            <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="text-2xl font-bold text-amber-600">
                                    {memberTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length}
                                </div>
                                <div className="text-xs text-amber-700">Active</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Calendar className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {memberTickets.filter((t: any) => new Date(t.created_at).getMonth() === new Date().getMonth()).length}
                                </div>
                                <div className="text-xs text-purple-700">This Month</div>
                            </div>
                        </div>

                        {/* Device List */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-indigo-600" />
                                Your Devices
                            </h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {deviceOptions.map((device: any) => {
                                    const deviceTickets = memberTickets.filter((t: any) => t.device_id === device.id);
                                    const activeTickets = deviceTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress');

                                    return (
                                        <div key={device.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTickets.length > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                                                    {device.icon_id ? (
                                                        <DeviceIcon deviceIconId={device.icon_id} size={20} />
                                                    ) : (
                                                        <Monitor className="w-5 h-5 text-slate-600" />
                                                    )}
                                                </div>
                                                <div className={`w-3 h-3 rounded-full ${activeTickets.length > 0 ? 'bg-amber-400' : 'bg-green-400'}`}></div>
                                                <div>
                                                    <h4 className="font-medium text-slate-800">
                                                        {device.name_device?.name || device.name || `Device #${device.id}`}
                                                    </h4>
                                                    <p className="text-xs text-slate-600">
                                                        {activeTickets.length > 0 ?
                                                            `${activeTickets.length} active ticket(s)` :
                                                            'No active issues'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-slate-700">
                                                    {deviceTickets.length} total
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    tickets
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Monthly Performance */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-800">
                                <Award className="w-5 h-5 text-green-600" />
                                Monthly Performance
                            </h3>
                            {memberTickets.filter((t: any) => new Date(t.created_at).getMonth() === new Date().getMonth()).length === 0 ? (
                                <div className="text-center py-4">
                                    <div className="text-4xl mb-2">🎉</div>
                                    <p className="text-green-800 font-medium">Excellent!</p>
                                    <p className="text-sm text-green-700">No incidents this month</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-green-800 font-medium">
                                        {memberTickets.filter((t: any) => new Date(t.created_at).getMonth() === new Date().getMonth()).length} ticket(s) this month
                                    </p>
                                    <p className="text-sm text-green-700">Keep your devices updated</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeviceStats(false)}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Custom Delete Confirmation Modal */}
            <Dialog
                open={showDeleteModal.open}
                onOpenChange={(open) => setShowDeleteModal({ open, ticket: showDeleteModal.ticket })}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Confirmar eliminación
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            ¿Estás seguro de que deseas eliminar el ticket #{showDeleteModal.ticket?.id}? 
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDeleteModal({ open: false })}
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

            {/* Schedule Appointment Modal */}
            <Dialog
                open={showScheduleAppointmentModal.open}
                onOpenChange={(open) => setShowScheduleAppointmentModal({ open, ticketId: showScheduleAppointmentModal.ticketId })}
            >
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            Schedule On-Site Visit
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            Schedule an on-site technical visit to resolve this ticket.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[55vh] overflow-y-auto pr-2">
                        <form id="schedule-appointment-form" onSubmit={submitScheduleAppointment} className="space-y-6">
                            <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Appointment Title
                                </label>
                                <Input
                                    value={appointmentForm.title}
                                    onChange={e => setAppointmentForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="border-2 h-12 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                    required
                                    placeholder="e.g., Technical Visit - Equipment Repair"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={appointmentForm.description}
                                    onChange={e => setAppointmentForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[100px] resize-none"
                                    placeholder="Describe what will be performed during the visit..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Date and Time
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={appointmentForm.scheduled_for}
                                    onChange={e => setAppointmentForm(prev => ({ ...prev, scheduled_for: e.target.value }))}
                                    className="border-2 h-12 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Instructions for User
                                </label>
                                <textarea
                                    value={appointmentForm.member_instructions}
                                    onChange={e => setAppointmentForm(prev => ({ ...prev, member_instructions: e.target.value }))}
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[80px] resize-none"
                                    placeholder="Special instructions for the user (e.g., have equipment available, prepare access, etc.)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Internal Notes
                                </label>
                                <textarea
                                    value={appointmentForm.notes}
                                    onChange={e => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[80px] resize-none"
                                    placeholder="Additional notes for the technician..."
                                />
                            </div>
                        </div>
                    </form>
                    </div>

                    <DialogFooter className="pt-6 border-t border-slate-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowScheduleAppointmentModal({ open: false })}
                            className="px-6 py-2.5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="schedule-appointment-form"
                            disabled={schedulingAppointment}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            {schedulingAppointment ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Scheduling...
                                </>
                            ) : (
                                <>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Schedule Appointment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Appointment Details/Action Modal */}
            <Dialog
                open={showAppointmentDetailsModal.open}
                onOpenChange={(open) => setShowAppointmentDetailsModal({ open, appointment: showAppointmentDetailsModal.appointment })}
            >
                <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader className="pb-6 border-b border-slate-200">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                <Calendar className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <div>Appointment Details</div>
                                <div className="text-sm font-normal text-slate-600 mt-1">
                                    Manage and track appointment progress
                                </div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                    {showAppointmentDetailsModal.appointment && (
                        <div className="space-y-8">
                            {/* Main Appointment Info Card */}
                            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                                            {showAppointmentDetailsModal.appointment.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                                                showAppointmentDetailsModal.appointment.status === 'scheduled' 
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                    : showAppointmentDetailsModal.appointment.status === 'in_progress'
                                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                    : showAppointmentDetailsModal.appointment.status === 'completed'
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : 'bg-red-100 text-red-700 border border-red-200'
                                            }`}>
                                                {showAppointmentDetailsModal.appointment.status === 'scheduled' && <Clock className="w-4 h-4" />}
                                                {showAppointmentDetailsModal.appointment.status === 'in_progress' && <AlertCircle className="w-4 h-4" />}
                                                {showAppointmentDetailsModal.appointment.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                                                {showAppointmentDetailsModal.appointment.status === 'cancelled' && <X className="w-4 h-4" />}
                                                <span className="capitalize">{showAppointmentDetailsModal.appointment.status.replace('_', ' ')}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-600">Scheduled Date & Time</div>
                                                <div className="text-base font-semibold text-slate-900">
                                                    {formatLocalDateTime(showAppointmentDetailsModal.appointment.scheduled_for).date}
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    {formatLocalDateTime(showAppointmentDetailsModal.appointment.scheduled_for).time}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <MapPin className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-600">Location</div>
                                                <div className="text-base font-semibold text-slate-900">
                                                    {showAppointmentDetailsModal.appointment.address}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <User className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-600">Assigned Technician</div>
                                                <div className="text-base font-semibold text-slate-900">
                                                    {showAppointmentDetailsModal.appointment.technical?.name || 'Not assigned'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                                            <div className="p-2 bg-orange-100 rounded-lg">
                                                <Ticket className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-600">Related Ticket</div>
                                                <div className="text-base font-semibold text-slate-900">
                                                    #{showAppointmentDetailsModal.appointment.ticket?.code || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {showAppointmentDetailsModal.appointment.description && (
                                    <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100">
                                        <h4 className="text-sm font-medium text-slate-600 mb-2">Description</h4>
                                        <p className="text-slate-900">{showAppointmentDetailsModal.appointment.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Complete Appointment Form - Technical Side */}
                            {showAppointmentDetailsModal.appointment.status === 'in_progress' && (isTechnical || isSuperAdmin || !isMember) && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-green-900">Complete Visit</h3>
                                            <p className="text-sm text-green-700">Mark this visit as completed. The member will provide their feedback separately.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        await handleAppointmentAction('complete', showAppointmentDetailsModal.appointment.id, {
                                            completion_notes: appointmentActionForm.completion_notes
                                        });
                                        setShowAppointmentDetailsModal({ open: false });
                                    }} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-green-900 mb-3">
                                                Completion Notes *
                                            </label>
                                            <textarea
                                                value={appointmentActionForm.completion_notes}
                                                onChange={e => setAppointmentActionForm(prev => ({ ...prev, completion_notes: e.target.value }))}
                                                className="w-full border-2 border-green-200 rounded-xl px-4 py-3 text-base focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200 min-h-[120px] resize-none bg-white"
                                                placeholder="Describe what was performed during the visit and the outcome..."
                                                required
                                            />
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <h4 className="font-semibold text-blue-900">Next Step</h4>
                                            </div>
                                            <p className="text-sm text-blue-700">
                                                After you complete this visit, the member will be notified to provide their feedback and rating.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                                            disabled={!appointmentActionForm.completion_notes.trim()}
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Complete Visit
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Member Feedback Form - Only for Members */}
                            {showAppointmentDetailsModal.appointment && showAppointmentDetailsModal.appointment.status === 'awaiting_feedback' && isMember && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Star className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-blue-900">Provide Feedback</h3>
                                            <p className="text-sm text-blue-700">Please rate the service and provide your comments</p>
                                        </div>
                                    </div>

                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        await handleAppointmentAction('member_feedback', showAppointmentDetailsModal.appointment.id, {
                                            member_feedback: appointmentActionForm.member_feedback,
                                            service_rating: appointmentActionForm.service_rating
                                        });
                                        setShowAppointmentDetailsModal({ open: false });
                                    }} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-blue-900 mb-3">
                                                Your Comments
                                            </label>
                                            <textarea
                                                value={appointmentActionForm.member_feedback}
                                                onChange={e => setAppointmentActionForm(prev => ({ ...prev, member_feedback: e.target.value }))}
                                                className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-base focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 min-h-[100px] resize-none bg-white"
                                                placeholder="How was the service? Any comments or suggestions..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-blue-900 mb-3">
                                                Service Rating *
                                            </label>
                                            <div className="flex gap-2 p-4 bg-white rounded-xl border border-blue-200">
                                                {[1, 2, 3, 4, 5].map(rating => (
                                                    <button
                                                        key={rating}
                                                        type="button"
                                                        onClick={() => setAppointmentActionForm(prev => ({ ...prev, service_rating: rating }))}
                                                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                                            appointmentActionForm.service_rating >= rating 
                                                                ? 'text-yellow-500 bg-yellow-50' 
                                                                : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'
                                                        }`}
                                                    >
                                                        <Star className="w-8 h-8 fill-current" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                                            disabled={!appointmentActionForm.service_rating}
                                        >
                                            <Star className="w-5 h-5" />
                                            Submit Feedback
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Cancel/Reschedule Appointment Forms */}
                            {showAppointmentDetailsModal.appointment.status === 'scheduled' && (
                                <div className="space-y-6">
                                    {/* Cancel Section */}
                                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-red-100 rounded-lg">
                                                <X className="w-6 h-6 text-red-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-red-900">Cancel Appointment</h3>
                                                <p className="text-sm text-red-700">Cancel this scheduled appointment</p>
                                            </div>
                                        </div>

                                        <form onSubmit={async (e) => {
                                            e.preventDefault();
                                            await handleAppointmentAction('cancel', showAppointmentDetailsModal.appointment.id, { reason: appointmentActionForm.reason });
                                            setShowAppointmentDetailsModal({ open: false });
                                        }} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-red-900 mb-3">
                                                    Cancellation Reason *
                                                </label>
                                                <textarea
                                                    value={appointmentActionForm.reason}
                                                    onChange={e => setAppointmentActionForm(prev => ({ ...prev, reason: e.target.value }))}
                                                    className="w-full border-2 border-red-200 rounded-xl px-4 py-3 text-base focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all duration-200 min-h-[100px] resize-none bg-white"
                                                    placeholder="Explain why the appointment is being cancelled..."
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                                            >
                                                <X className="w-5 h-5" />
                                                Cancel Appointment
                                            </button>
                                        </form>
                                    </div>

                                    {/* Reschedule Section */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Calendar className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-blue-900">Reschedule Appointment</h3>
                                                <p className="text-sm text-blue-700">Change the date and time of this appointment</p>
                                            </div>
                                        </div>

                                        <form onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!appointmentActionForm.new_scheduled_for) {
                                                toast.error('Please select a new date and time');
                                                return;
                                            }
                                            
                                            // Validate that the selected date is in the future
                                            const selectedDate = new Date(appointmentActionForm.new_scheduled_for);
                                            const now = new Date();
                                            
                                            if (selectedDate <= now) {
                                                toast.error('Please select a future date and time');
                                                return;
                                            }
                                            
                                            try {
                                                // Show loading notification
                                                const loadingToast = toast.loading('Rescheduling appointment...');
                                                
                                                // Convert local datetime to proper format that Carbon can parse
                                                const localDateTime = appointmentActionForm.new_scheduled_for;
                                                
                                                // Create a Date object and format it properly for backend
                                                const dateObj = new Date(localDateTime);
                                                
                                                // Ensure we format the date in a consistent timezone-aware way
                                                const year = dateObj.getFullYear();
                                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                                const day = String(dateObj.getDate()).padStart(2, '0');
                                                const hours = String(dateObj.getHours()).padStart(2, '0');
                                                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                                                
                                                // Format as YYYY-MM-DD HH:mm:ss for consistent backend parsing
                                                const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:00`;
                                                
                                                await handleAppointmentAction('reschedule', showAppointmentDetailsModal.appointment.id, { 
                                                    new_scheduled_for: formattedDateTime,
                                                    reason: appointmentActionForm.reason || '' // Allow empty reason
                                                });
                                                
                                                // Dismiss loading and show success
                                                toast.dismiss(loadingToast);
                                                toast.success('Appointment rescheduled successfully!');
                                                
                                                // Clear form
                                                setAppointmentActionForm(prev => ({ 
                                                    ...prev, 
                                                    new_scheduled_for: '',
                                                    reason: ''
                                                }));
                                                appointmentActionForm.reason = '';
                                                
                                                setShowAppointmentDetailsModal({ open: false });
                                            } catch (error) {
                                                console.error('Error rescheduling appointment:', error);
                                                toast.error('Failed to reschedule appointment');
                                            }
                                        }} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-blue-900 mb-3">
                                                    New Date and Time *
                                                </label>
                                                <Input
                                                    type="datetime-local"
                                                    value={appointmentActionForm.new_scheduled_for}
                                                    onChange={e => setAppointmentActionForm(prev => ({ ...prev, new_scheduled_for: e.target.value }))}
                                                    className="border-2 border-blue-200 h-12 rounded-xl px-4 py-3 text-base focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-blue-900 mb-3">
                                                    Reason for Reschedule (Optional)
                                                </label>
                                                <textarea
                                                    value={appointmentActionForm.reason}
                                                    onChange={e => setAppointmentActionForm(prev => ({ ...prev, reason: e.target.value }))}
                                                    className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-base focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 min-h-[80px] resize-none bg-white"
                                                    placeholder="Optional: explain why you're rescheduling..."
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                                                disabled={!appointmentActionForm.new_scheduled_for}
                                            >
                                                <Calendar className="w-5 h-5" />
                                                Reschedule Appointment
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* View Only for Completed Appointments */}
                            {showAppointmentDetailsModal.appointment.status === 'completed' && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                                            <CheckCircle className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-green-900">Appointment Completed</h3>
                                            <p className="text-sm text-green-700">This visit has been successfully completed</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {showAppointmentDetailsModal.appointment.completion_notes && (
                                            <div className="p-4 bg-white rounded-xl border border-green-200">
                                                <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    Completion Notes
                                                </h4>
                                                <p className="text-green-800 leading-relaxed">
                                                    {showAppointmentDetailsModal.appointment.completion_notes}
                                                </p>
                                            </div>
                                        )}

                                        {showAppointmentDetailsModal.appointment.member_feedback && (
                                            <div className="p-4 bg-white rounded-xl border border-green-200">
                                                <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                    <MessageSquare className="w-4 h-4" />
                                                    User Feedback
                                                </h4>
                                                <p className="text-green-800 leading-relaxed">
                                                    {typeof showAppointmentDetailsModal.appointment.member_feedback === 'string' 
                                                        ? showAppointmentDetailsModal.appointment.member_feedback 
                                                        : showAppointmentDetailsModal.appointment.member_feedback?.comment || 'No feedback provided'}
                                                </p>
                                            </div>
                                        )}

                                        {showAppointmentDetailsModal.appointment.rating && (
                                            <div className="p-4 bg-white rounded-xl border border-green-200">
                                                <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                                                    <Star className="w-4 h-4" />
                                                    Service Rating
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star
                                                                key={star}
                                                                className={`w-6 h-6 ${
                                                                    star <= showAppointmentDetailsModal.appointment.rating
                                                                        ? 'text-yellow-500 fill-current'
                                                                        : 'text-gray-300'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-lg font-bold text-green-900">
                                                        {showAppointmentDetailsModal.appointment.rating}/5
                                                    </span>
                                                    <span className="text-sm text-green-700 px-3 py-1 bg-green-100 rounded-full">
                                                        {showAppointmentDetailsModal.appointment.rating >= 4 ? 'Excellent' :
                                                         showAppointmentDetailsModal.appointment.rating >= 3 ? 'Good' :
                                                         showAppointmentDetailsModal.appointment.rating >= 2 ? 'Fair' : 'Poor'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {showAppointmentDetailsModal.appointment.completed_at && (
                                            <div className="p-4 bg-white rounded-xl border border-green-200">
                                                <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Completion Date
                                                </h4>
                                                <p className="text-green-800">
                                                    {new Date(showAppointmentDetailsModal.appointment.completed_at).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    </div>

                    <DialogFooter className="pt-6 border-t border-slate-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAppointmentDetailsModal({ open: false })}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Member Feedback Modal */}
            <Dialog open={showMemberFeedbackModal.open} onOpenChange={(open) => setShowMemberFeedbackModal({ open })}>
                <DialogContent className="max-w-md mx-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Rate Your Experience
                        </DialogTitle>
                        <DialogDescription className="text-slate-600">
                            Your feedback helps us improve our service
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitMemberFeedback} className="space-y-6">
                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                                How satisfied are you with the solution?
                            </label>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setMemberFeedback(prev => ({ ...prev, rating: star }))}
                                        className="p-1 hover:scale-110 transition-transform"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${
                                                star <= memberFeedback.rating
                                                    ? 'text-yellow-500 fill-current'
                                                    : 'text-gray-300 hover:text-yellow-400'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Additional Comments (optional)
                            </label>
                            <textarea
                                value={memberFeedback.comment}
                                onChange={e => setMemberFeedback(prev => ({ ...prev, comment: e.target.value }))}
                                className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                placeholder="Share your experience with the service received..."
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowMemberFeedbackModal({ open: false })}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={memberFeedback.rating === 0}
                            >
                                Send Feedback
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    )
}
