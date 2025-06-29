import type React from "react"

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from "@/types"
import { Head, Link, router, usePage, useForm } from "@inertiajs/react"
import { useEffect } from "react"
import { useState } from "react"

import {
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    Plus,
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
    Search,
    User,
    Building,
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
import KanbanBoard from "./KanbanBoard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

import { Device } from "@/types/models/Device"
import { Tenant } from "@/types/models/Tenant";

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
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/20 text-primary-foreground text-xs font-medium border border-primary/30">
            <Monitor className="w-3 h-3" />
            {device?.name_device?.name || device?.name || "Sin dispositivo"}
        </div>
    )
}

// Elegant Corporate Device Information Component
export default function TicketsIndex({ tickets, allTickets, allTicketsUnfiltered, devicesOwn, devicesShared, memberData, apartmentData, buildingData, statusFilter }: TicketsProps) {
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
    const [showHistoryModal, setShowHistoryModal] = useState<{ open: boolean; ticketId?: number }>({ open: false })
    const [showAssignModal, setShowAssignModal] = useState<{ open: boolean; ticketId?: number }>({ open: false })
    const [historyText, setHistoryText] = useState("")
    const [historyAction, setHistoryAction] = useState("comment")
    const [assignTechnicalId, setAssignTechnicalId] = useState<number | null>(null)
    const [assigning, setAssigning] = useState(false)
    const [addingHistory, setAddingHistory] = useState(false)
    const [technicals, setTechnicals] = useState<any[]>([])
    const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null)
    const [tab, setTab] = useState<"all" | "assigned" | "approved">("all")
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [selectedTicketLoading, setSelectedTicketLoading] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { auth, isTechnicalDefault } = usePage<SharedData & { isTechnicalDefault?: boolean }>().props;
    const isMember = (auth.user as any)?.roles?.includes("member");
    const isSuperAdmin = (auth.user as any)?.roles?.includes("super-admin");
    const isTechnical = (auth.user as any)?.roles?.includes("technical");
    // isTechnicalDefault ahora viene del backend correctamente

    // Tab labels in English
    const [searchQuery] = useState("")

    const deviceOptions = [...devicesOwn, ...devicesShared].map(device => ({
        ...device,
        // Si el nombre es null, usar device.name_device?.name
        name: device.name || (device.name_device ? device.name_device.name : ''),
    }));

    // useForm for ticket creation
    const { data, setData, post, processing, errors, reset } = useForm({
        device_id: "",
        category: "",
        title: "",
        description: "",
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
        if (!window.confirm("¿Estás seguro de que deseas eliminar este ticket?")) return
        router.delete(`/tickets/${ticket.id}`, {
            preserveScroll: true,
        })
    }

    const handleStatusChange = (ticket: any, newStatus: string) => {
        setStatusLoadingId(ticket.id)
        router.put(
            `/tickets/${ticket.id}`,
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    refreshSelectedTicket(ticket.id);
                },
                onFinish: () => setStatusLoadingId(null),
            },
        )
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

    // Filter tickets
    const userId = (usePage().props as any)?.auth?.user?.id;
    const assignedTickets = tickets.data;
    const approvedTickets = tickets.data.filter((t: any) => t.status === "resolved" || t.status === "closed");

    let ticketsToShow: any[] = [];
    let canActOnTickets = false;
    if (tab === "all") {
        ticketsToShow = allTickets;
        canActOnTickets = false;
    } else if (tab === "assigned") {
        ticketsToShow = assignedTickets;
        canActOnTickets = true;
    } else if (tab === "approved") {
        ticketsToShow = approvedTickets;
        canActOnTickets = true;
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
        : allTickets.filter((ticket: any) => ticket.user_id === userId);
    
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ticket Management" />

            <div className="flex flex-col gap-6 p-6">
                

                {/* Header Section */}
                {isMember && (
                    <div className="border-b bg-background border-slate-200 sticky top-0 z-20">
                        <div className="px-6 py-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-extrabold text-accent flex items-center gap-2">
                                        <CheckCircle className="w-7 h-7 text-accent" />
                                        Ticket Management
                                    </h1>
                                    <p className="text-slate-600 mt-1 mb-4">
                                        Select a device to report an issue or search tickets.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        {deviceOptions.length > 0 ? deviceOptions.map((device: any) => {

                                            return (
                                                <button
                                                    key={device.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setData('device_id', device.id.toString());
                                                        setShowCreateModal(true);
                                                    }}
                                                    className="flex flex-col items-center bg-white border border-slate-200 rounded-lg shadow hover:shadow-lg px-4 py-3 min-w-[140px] transition group"
                                                >
                                                    <Monitor className="w-4 h-4 text-sky-500 mb-1" />
                                                    <span className="font-semibold text-slate-800 text-sm truncate max-w-[120px]">{device.name_device?.name || device.name || `Device #${device.id}`}</span>
                                                    {/* Mostrar con quién se comparte o el dueño */}
                                                    <div className="flex items-center gap-1 mt-2">
                                                        {/* Dueño */}
                                                        {device.owner && (
                                                            <TooltipProvider key={device.owner[0].id}>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <img
                                                                            src={`/storage/${device.owner[0].photo}`}
                                                                            alt={device.owner[0].name}
                                                                            title={`Dueño: ${device.owner[0].name}`}
                                                                            className="min-w-6 min-h-6 max-w-6 max-h-6 object-cover rounded-full border-2 border-yellow-400"
                                                                        />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{device.owner[0].name}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                        {/* Compartido con */}
                                                        {Array.isArray(device.shared_with) && device.shared_with.length > 0 && device.shared_with.map((tenant: any) => (

                                                            <TooltipProvider key={tenant.id}>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <img
                                                                            key={tenant.id}
                                                                            src={`/storage/${tenant.photo}`}
                                                                            alt={tenant.name}
                                                                            title={`Compartido con: ${tenant.name}`}
                                                                            className="min-w-6 min-h-6 max-w-6 max-h-6 object-cover rounded-full border-2 border-blue-400 -ml-2"
                                                                        />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{tenant.name}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                        ))}
                                                    </div>
                                                </button>
                                            )
                                        }) : (
                                            <span className="text-slate-500 text-sm">You have no registered devices.</span>
                                        )}
                                    </div>

                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    {/* <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search tickets..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 w-64 rounded-lg border-sidebar-border focus:ring-2 focus:ring-blue-400 transition"
                                        />
                                    </div> */}
                                    {/* Lista de dispositivos como botones/cards */}
                                    <div className="flex flex-col gap-3 justify-end">


                                        <div className="flex items-center gap-3 ">

                                            <img
                                                src={`/storage/${memberData?.photo}`}
                                                alt={memberData?.name}
                                                className="w-12 h-12 rounded-full border border-primary object-cover"
                                              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                    e.currentTarget.src = '/images/default-user.png'; // Ruta de imagen por defecto
                                                }}
                                            />
                                            <h1 className="text-3xl font-extrabold text-accent flex justify-end text-end gap-2">

                                                {memberData?.name}
                                            </h1>
                                        </div>
                                        <p className="text-slate-600 mt-1 mb-4 flex gap-2">
                                            <span> {apartmentData?.name} </span> |
                                            <span> {buildingData?.name} </span>
                                        </p>



                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-6 py-8">
                    <div className={`grid grid-cols-1 xl:grid-cols-12 gap-8`}>
                        {/* Main Content */}
                        <div className={`xl:col-span-8 flex flex-col gap-8`}>
                            {/* Tabs */}
                            {(isTechnicalDefault || isSuperAdmin || isTechnical) ? (
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
                                        onStatusChange={(ticketId) => {
                                            if (selectedTicket && selectedTicket.id === ticketId) {
                                                refreshSelectedTicket(ticketId);
                                            }
                                        }}
                                    />
                                </div>
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
                                                className={`cursor-pointer transition-all hover:shadow-lg  ${
                                                    selectedTicket?.id === ticket.id 
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
                                                        
                                                        <p className="text-sm text-slate-600 line-clamp-2">
                                                            {ticket.description}
                                                        </p>
                                                        
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <CategoryBadge category={ticket.category} />
                                                            <DeviceBadge device={ticket.device} />
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                                            <span>{ticket.code}</span>
                                                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        
                                                        {ticket.technical && (
                                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                <UserIcon className="w-3 h-3" />
                                                                <span>Assigned to {ticket.technical.name}</span>
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
                            <div className="sticky top-8 border-2 border-primary rounded-lg shadow-2xl">
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
                                                        </div>
                                                    </div>

                                                    {/* Device Information - Compact Badges Row */}
                                                    {selectedTicket.device && (
                                                        <div className="px-6">
                                                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                <Monitor className="w-4 h-4 text-primary" />
                                                                Device Information
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                                                                    <Cpu className="w-3 h-3" />
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
                                                                {selectedTicket.device.apartment && (
                                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-200">
                                                                        <Home className="w-3 h-3" />
                                                                        {selectedTicket.device.apartment.building?.name} - {selectedTicket.device.apartment.name}
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
                                                                                        onSuccess: () => refreshSelectedTicket(selectedTicket.id)
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
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Ticket History */}
                                                    <div className="px-6 pb-6">
                                                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                                            Recent Activity
                                                        </h4>
                                                        <div className="space-y-3 max-h-48 overflow-y-auto">
                                                            {selectedTicket.history && selectedTicket.history.length > 0 ? (
                                                                selectedTicket.history.slice(0, 5).map((entry: any, index: number) => (
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
                                                                                    {new Date(entry.created_at).toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                                                {entry.description}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : selectedTicket.histories && selectedTicket.histories.length > 0 ? (
                                                                selectedTicket.histories.slice(0, 5).map((entry: any, index: number) => (
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
                                                                                    {new Date(entry.created_at).toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                                                {entry.description}
                                                                            </p>
                                                                            {entry.action && (
                                                                                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                                                    {entry.action.replace('_', ' ')}
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
                            Assign Technician
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                            Select a technician to assign this ticket and ensure proper handling.
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
                                {technicals.map((t) => (
                                    <div
                                        key={t.id}
                                        className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                            assignTechnicalId === t.id
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
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 ${
                                            assignTechnicalId === t.id 
                                                ? 'border-purple-500 bg-purple-500' 
                                                : 'border-slate-300'
                                        }`}>
                                            {assignTechnicalId === t.id && (
                                                <div className="w-full h-full rounded-full bg-purple-500"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
        </AppLayout>
    )
}
