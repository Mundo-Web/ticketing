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
    Calendar,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    PlayCircle,
    StopCircle,
    Search,
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
    DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Device } from "@/types/models/Device"

const breadcrumbs: BreadcrumbItem[] = [{ title: "Tickets", href: "/tickets" }]

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
        label: "Abierto",
        color: "border-blue-200 bg-blue-50",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: AlertCircle,
    },
    in_progress: {
        label: "En progreso",
        color: "border-amber-200 bg-amber-50",
        bgColor: "bg-amber-100",
        textColor: "text-amber-800",
        icon: PlayCircle,
    },
    resolved: {
        label: "Resuelto",
        color: "border-emerald-200 bg-emerald-50",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-800",
        icon: CheckCircle2,
    },
    closed: {
        label: "Cerrado",
        color: "border-slate-200 bg-slate-50",
        bgColor: "bg-slate-100",
        textColor: "text-slate-700",
        icon: StopCircle,
    },
    cancelled: {
        label: "Cancelado",
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

interface TicketsProps {
    tickets: {
        data: Ticket[]
        links: PaginationLink[]
        meta: PaginationMeta
    }
    allTickets: Ticket[],
    devicesOwn: Device[],
    devicesShared: Device[],
}

function CategoryBadge({ category }: { category: string }) {
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-medium">
            <Tag className="w-3 h-3" />
            {category}
        </div>
    )
}

function DeviceBadge({ device }: { device: any }) {
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-100 text-sky-700 text-xs font-medium">
            <Monitor className="w-3 h-3" />
            {device?.name_device?.name || device?.name || "Sin dispositivo"}
        </div>
    )
}

function SkeletonCard() {
    return (
        <Card className="animate-pulse">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-6 w-16 bg-slate-200 rounded-md"></div>
                        <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                        <div className="flex gap-1">
                            <div className="h-8 w-8 bg-slate-200 rounded"></div>
                            <div className="h-8 w-8 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function TicketsIndex({ tickets, allTickets, devicesOwn, devicesShared }: TicketsProps) {
    // State management
    const [showHistoryModal, setShowHistoryModal] = useState<{ open: boolean; ticketId?: number }>({ open: false })
    const [showAssignModal, setShowAssignModal] = useState<{ open: boolean; ticketId?: number }>({ open: false })
    const [historyText, setHistoryText] = useState("")
    const [historyAction, setHistoryAction] = useState("comment")
    const [assignTechnicalId, setAssignTechnicalId] = useState<number | null>(null)
    const [assigning, setAssigning] = useState(false)
    const [addingHistory, setAddingHistory] = useState(false)
    const [technicals, setTechnicals] = useState<any[]>([])
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [viewTicket, setViewTicket] = useState<any | null>(null)
    const [viewLoading, setViewLoading] = useState(false)
    const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null)
    const [tab, setTab] = useState<"all" | "assigned" | "approved">("all")
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [selectedTicketLoading, setSelectedTicketLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { auth } = usePage<SharedData>().props;
    const isMember = auth.user?.roles.includes("member");
    const isSuperAdmin = auth.user?.roles.includes("super-admin");

    // Estado para tab de super-admin (todos los estados)
    const allStatuses = [
        { value: "all", label: "Todos", icon: Eye },
        { value: "open", label: "Abiertos", icon: AlertCircle },
        { value: "in_progress", label: "En progreso", icon: PlayCircle },
        { value: "resolved", label: "Resueltos", icon: CheckCircle2 },
        { value: "closed", label: "Cerrados", icon: StopCircle },
        { value: "cancelled", label: "Cancelados", icon: XCircle },
    ];
    const [superTab, setSuperTab] = useState<string>("all");

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
            },
        });
    };

    const handleDelete = (ticket: any) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este ticket?")) return
        setDeletingId(ticket.id)
        router.delete(`/tickets/${ticket.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        })
    }

    const handleStatusChange = (ticket: any, newStatus: string) => {
        setStatusLoadingId(ticket.id)
        router.put(
            `/tickets/${ticket.id}`,
            { status: newStatus },
            {
                preserveScroll: true,
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
            const response = await fetch("/technicals-list", { headers: { Accept: "application/json" } })
            if (!response.ok) throw new Error("Error al cargar técnicos")
            const data = await response.json()
            setTechnicals(data.technicals || [])
        } catch (e) {
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
        { value: "all", label: "Todos", icon: Eye },
        { value: "open", label: "Abiertos", icon: AlertCircle },
        { value: "in_progress", label: "En progreso", icon: PlayCircle },
        { value: "resolved", label: "Resueltos", icon: CheckCircle2 },
        { value: "closed", label: "Cerrados", icon: StopCircle },
    ];
    const [memberTab, setMemberTab] = useState<string>("all");

    // Filter tickets for members by tab (status) and then by search
    const memberTickets = tickets.data.filter((ticket: any) => ticket.user_id === userId);
    const memberTabFilteredTickets = memberTab === "all"
        ? memberTickets
        : memberTickets.filter((ticket: any) => ticket.status === memberTab);
    const memberFilteredTickets = memberTabFilteredTickets.filter(
        (ticket: any) =>
            ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Super admin filtered tickets by current tab
    const superAdminFilteredTickets = superTab === "all"
        ? allTickets
        : allTickets.filter((ticket: any) => ticket.status === superTab);

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Tickets" />

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
                                    <p className="text-slate-600 mt-1">
                                        Select a device to report a problem or search for tickets.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    {/* <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Buscar tickets..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 w-64 rounded-lg border-sidebar-border focus:ring-2 focus:ring-blue-400 transition"
                                        />
                                    </div> */}
                                    {/* Lista de dispositivos como botones/cards */}
                                    <div className="flex flex-col gap-3 justify-end">
                                         <h1 className="text-3xl font-extrabold text-accent flex text-end gap-2">
                                 
                                        My Devices
                                    </h1>
                                     <div className="flex flex-wrap gap-3 justify-end">
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
                                                    <span className="font-semibold text-slate-800 text-sm truncate max-w-[120px]">{device.name_device?.name || device.name || `Dispositivo #${device.id}`}</span>
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-6 py-8">
                    <div className={`grid grid-cols-1 xl:grid-cols-5 gap-8`}>
                        {/* Main Content */}
                        <div className={`xl:col-span-3 flex flex-col gap-8`}>
                            {/* Tabs */}
                            {isSuperAdmin ? (
                                <Card className="shadow-none border-0 bg-transparent mb-10">
                                    <CardContent className="p-0">
                                        <Tabs value={superTab} onValueChange={setSuperTab} className="w-full">
                                            <TabsList className="grid w-full grid-cols-6 bg-transparent rounded-full p-1">
                                                {allStatuses.map((tabItem) => {
                                                    // Color classes for each status
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
                                                        case "cancelled":
                                                            colorClass = "data-[state=active]:text-red-700";
                                                            countColor = "text-red-700";
                                                            iconColor = "text-red-700";
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
                                                                    ? allTickets.length
                                                                    : allTickets.filter((t: any) => t.status === tabItem.value).length}
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
                            ) : isMember ? (
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

                            {/* Tickets Grid */}
                            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 `}>
                                {viewLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                                {!viewLoading && filteredTickets.length === 0 ? (
                                    <div className="col-span-1 md:col-span-3 w-full">
                                        <Card className="border-0 shadow-none bg-transparent">
                                            <CardContent className="p-12 text-center">
                                                <XCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                                                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay tickets</h3>
                                                <p className="text-slate-600">No se encontraron tickets en esta sección.</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    filteredTickets.map((ticket: any) => {
                                        const statusStyle = statusConfig[ticket.status] || statusConfig.open
                                        const isSelected = selectedTicket?.id === ticket.id;
                                        return (
                                            <Card
                                                key={ticket.id}
                                                className={`relative bg-gray-50 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group border-0 ${isSelected
                                                    ? "shadow-2xl border-sidebar-ring bg-sidebar border-1"
                                                    : "hover:shadow-lg"
                                                    }`}
                                                onClick={() => handleSelectTicket(ticket)}
                                            >
                                                <CardContent className="px-7">
                                                    <div className="">
                                                        {/* Header */}
                                                        <StatusBadge status={ticket.status} />
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-blue-600 transition-colors">
                                                                    {ticket.title}
                                                                </h3>
                                                                <p className="text-slate-600 text-sm mt-1 line-clamp-2">{ticket.description}</p>
                                                            </div>
                                                        </div>
                                                        {/* Badges */}
                                                        <div className="flex flex-wrap gap-2 mt-4">
                                                            <DeviceBadge device={ticket.device} />
                                                            <CategoryBadge category={ticket.category} />
                                                        </div>
                                                        {/* Footer */}
                                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                <Calendar className="w-3 h-3" />
                                                                {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("es-ES") : "-"}
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSelectTicket(ticket);
                                                                            }}
                                                                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-full"
                                                                        >
                                                                            <Eye className="w-4 h-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Ver detalles</TooltipContent>
                                                                </Tooltip>
                                                                {/* Solo acciones para NO miembros */}
                                                                {!isMember && canActOnTickets && Array.isArray(auth.user?.roles) && (auth.user?.roles as string[]).includes("technical") && (
                                                                    <>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setShowHistoryModal({ open: true, ticketId: ticket.id });
                                                                                    }}
                                                                                    className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 rounded-full"
                                                                                >
                                                                                    <MessageSquare className="w-4 h-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Agregar comentario</TooltipContent>
                                                                        </Tooltip>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={async (e) => {
                                                                                        e.stopPropagation();
                                                                                        await loadTechnicals();
                                                                                        setShowAssignModal({ open: true, ticketId: ticket.id });
                                                                                    }}
                                                                                    className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600 rounded-full"
                                                                                >
                                                                                    <Share2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Asignar técnico</TooltipContent>
                                                                        </Tooltip>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Selection indicator */}
                                                        {isSelected && (
                                                            <div className="absolute top-3 right-3">
                                                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                        {/* Sidebar - Ticket Details */}
                        <div className={`${isMember ? "xl:col-span-2" : "xl:col-span-2"}`}>
                            <div className="sticky top-8">
                                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
                                    <CardHeader className=" text-black rounded-t-lg shadow pb-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-semibold">Detalle del Ticket</h2>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                                            {(selectedTicketLoading || viewLoading) && (
                                                <div className="flex items-center justify-center h-64">
                                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                                </div>
                                            )}

                                            {!selectedTicket && !selectedTicketLoading && (
                                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6">
                                                    <Eye className="w-12 h-12 mb-3" />
                                                    <h3 className="font-medium text-slate-600 mb-1">Selecciona un ticket</h3>
                                                    <p className="text-sm text-center">
                                                        Haz clic en cualquier ticket para ver sus detalles completos
                                                    </p>
                                                </div>
                                            )}

                                            {selectedTicket && !selectedTicketLoading && (
                                                <div className="p-6 space-y-6">
                                                    {/* Ticket Info */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="font-semibold text-slate-900">{selectedTicket.title}</h3>
                                                            <StatusBadge status={selectedTicket.status} />
                                                        </div>

                                                        <p className="text-slate-600 text-sm leading-relaxed">{selectedTicket.description}</p>

                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div>
                                                                <span className="text-slate-500">ID:</span>
                                                                <span className="ml-2 font-medium">#{selectedTicket.id}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500">Código:</span>
                                                                <span className="ml-2 font-medium">{selectedTicket.code}</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <DeviceBadge device={selectedTicket.device} />
                                                            <CategoryBadge category={selectedTicket.category} />
                                                        </div>

                                                        <div className="text-xs text-slate-500 space-y-1">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                Creado:{" "}
                                                                {selectedTicket.created_at
                                                                    ? new Date(selectedTicket.created_at).toLocaleString("es-ES")
                                                                    : "-"}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                Actualizado:{" "}
                                                                {selectedTicket.updated_at
                                                                    ? new Date(selectedTicket.updated_at).toLocaleString("es-ES")
                                                                    : "-"}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Separator />

                                                    {/* History */}
                                                    <div className="space-y-4">
                                                        <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-blue-500" />
                                                            Historial
                                                        </h4>

                                                        <div className="space-y-3">
                                                            {!selectedTicket.histories || selectedTicket.histories.length === 0 ? (
                                                                <div className="text-center py-6 text-slate-500">
                                                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                                                    <p className="text-sm">Sin historial disponible</p>
                                                                </div>
                                                            ) : (
                                                                [...selectedTicket.histories]
                                                                    .slice()
                                                                    .reverse()
                                                                    .map((h: any, idx: number, arr: any[]) => (
                                                                        <div key={h.id} className="relative pl-6 pb-4 last:pb-0">
                                                                            <div className="absolute left-0 top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                                                                            {idx !== arr.length - 1 && (
                                                                                <div className="absolute left-1.5 top-4 w-0.5 h-full bg-slate-200"></div>
                                                                            )}

                                                                            <div className="bg-slate-50 rounded-lg p-3 ml-4 shadow-sm">
                                                                                <div className="flex items-center justify-between mb-1">
                                                                                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                                                                        {h.action.replace("_", " ")}
                                                                                    </span>
                                                                                    {idx === 0 && (
                                                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                                                            Reciente
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-sm text-slate-700 mb-2">{h.description}</p>
                                                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <UserIcon className="w-3 h-3" />
                                                                                        {h.user ? h.user.name : "Sistema"}
                                                                                    </span>
                                                                                    <span>{new Date(h.created_at).toLocaleString("es-ES")}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Agregar Comentario
                        </DialogTitle>
                        <DialogDescription>Agrega un comentario o acción al historial del ticket.</DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault()
                            setAddingHistory(true)
                            try {
                                const meta = document.querySelector('meta[name="csrf-token"]')
                                const csrf = (meta && meta.getAttribute("content")) || ""
                                const res = await fetch(`/tickets/${showHistoryModal.ticketId}/add-history`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrf },
                                    body: JSON.stringify({ action: historyAction, description: historyText }),
                                })
                                if (!res.ok) throw new Error("Error al agregar historial")
                                setShowHistoryModal({ open: false })
                                setHistoryText("")
                                setHistoryAction("comment")
                                router.reload({ only: ["tickets"] })
                            } catch (e) {
                                alert("Error al agregar historial")
                            } finally {
                                setAddingHistory(false)
                            }
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de acción</label>
                            <Input
                                value={historyAction}
                                onChange={(e) => setHistoryAction(e.target.value)}
                                placeholder="Ej: comment, resolution, consultation"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                            <textarea
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={historyText}
                                onChange={(e) => setHistoryText(e.target.value)}
                                placeholder="Describe la acción realizada o comentario..."
                                required
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={addingHistory} className="bg-blue-600 hover:bg-blue-700">
                                {addingHistory ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    "Guardar"
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-purple-600" />
                            Asignar Técnico
                        </DialogTitle>
                        <DialogDescription>Selecciona un técnico para asignar este ticket.</DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault()
                            if (!assignTechnicalId) return
                            setAssigning(true)
                            try {
                                const meta = document.querySelector('meta[name="csrf-token"]')
                                const csrf = (meta && meta.getAttribute("content")) || ""
                                const res = await fetch(`/tickets/${showAssignModal.ticketId}/assign-technical`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrf },
                                    body: JSON.stringify({ technical_id: assignTechnicalId }),
                                })
                                if (!res.ok) throw new Error("Error al asignar técnico")
                                setShowAssignModal({ open: false })
                                setAssignTechnicalId(null)
                                router.reload({ only: ["tickets"] })
                            } catch (e) {
                                alert("Error al asignar técnico")
                            } finally {
                                setAssigning(false)
                            }
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Técnico</label>
                            <select
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                value={assignTechnicalId || ""}
                                onChange={(e) => setAssignTechnicalId(Number(e.target.value))}
                                required
                            >
                                <option value="" disabled>
                                    Selecciona un técnico
                                </option>
                                {technicals.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={assigning} className="bg-purple-600 hover:bg-purple-700">
                                {assigning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Asignando...
                                    </>
                                ) : (
                                    "Asignar"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Ticket Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create new ticket</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitTicket} className="space-y-4">
                        {/* Dispositivo */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Dispositivo</label>
                            <select
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            {errors.device_id && <div className="text-red-500 text-xs mt-1">{errors.device_id}</div>}
                        </div>
                        {/* Categoría */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                            <select
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={data.category}
                                onChange={e => setData('category', e.target.value)}
                                required
                            >
                                <option value="">Select a category</option>
                                {TICKET_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {errors.category && <div className="text-red-500 text-xs mt-1">{errors.category}</div>}
                        </div>
                        {/* Título */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                            <Input
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                required
                                placeholder="Ticket subject"
                            />
                            {errors.title && <div className="text-red-500 text-xs mt-1">{errors.title}</div>}
                        </div>
                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                required
                                placeholder="Describe the problem or request..."
                            />
                            {errors.description && <div className="text-red-500 text-xs mt-1">{errors.description}</div>}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing}>
                                {processing ? "Creating..." : "Create Ticket"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    )
}
