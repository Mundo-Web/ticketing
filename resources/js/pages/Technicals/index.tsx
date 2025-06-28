import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plus, Edit, Trash2, MoreHorizontal, User, Search, Filter, Calendar, Clock,
    List, CheckCircle, AlertCircle, Laptop, Trophy, Target, AlertTriangle,
    TrendingUp, Eye, FileText, Users, Star, Grid3X3,
    TableIcon, RefreshCw, ChevronRight, MapPin,
    ExternalLink, History, MessageSquare, Phone, Mail, Timer, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ColumnDef, useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Componente para contador animado
const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
    const [displayValue, setDisplayValue] = React.useState(0);

    React.useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Easing out cubic
            const currentValue = Math.floor(easedProgress * value);

            setDisplayValue(currentValue);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [value, duration]);

    return <span>{displayValue}</span>;
};

interface TicketDetail {
    id: number;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    device?: {
        id: number;
        name: string;
        brand?: { name: string };
        model?: { name: string };
    };
    building?: {
        id: number;
        name: string;
        address: string;
    };
    apartment?: {
        id: number;
        number: string;
    };
    tenant?: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
    history: Array<{
        id: number;
        action: string;
        description: string;
        created_at: string;
        user?: {
            name: string;
            role: string;
        };
    }>;
    comments: Array<{
        id: number;
        content: string;
        created_at: string;
        user: {
            name: string;
            role: string;
        };
    }>;
    resolution_time?: number;
    rating?: number;
    feedback?: string;
}

interface Device {
    id: number;
    name: string;
    brand?: {
        name: string;
    };
    system?: {
        name: string;
    };
    model?: {
        name: string;
    };
}

interface Ticket {
    id: number;
    title: string;
    status: string;
    priority?: string;
    created_at: string;
    building?: {
        name: string;
    };
    device?: {
        name: string;
    };
}

interface Technical {
    id: number;
    name: string;
    email: string;
    photo?: string;
    phone: string;
    shift: 'morning' | 'afternoon' | 'night';
    status: boolean;
    is_default: boolean;
    created_at: string;
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
    weekly_tickets: number;
    monthly_tickets: number;
    today_tickets: number;
    resolved_today: number;
    resolved_this_week: number;
    assigned_devices: Device[];
    assigned_devices_count: number;
    tickets: Ticket[];
    avg_resolution_time: number;
    current_streak: number;
    last_activity?: string;
}

interface TechnicalsPageProps {
    technicals: {
        data: Technical[];
        links: unknown;
        meta: unknown;
    };
}

export default function Index({ technicals }: TechnicalsPageProps) {
    const { auth } = usePage().props as unknown as { auth: { user: { roles: string[] } } };
    const userRoles = auth?.user?.roles || [];
    const isSuperAdmin = Array.isArray(userRoles) ? userRoles.includes('super-admin') : false;
    
    console.log('User roles:', userRoles); // Debug para verificar estructura
    
    // Helper function to check if technical is default
    const isDefaultTechnical = (technical: Technical): boolean => {
        return Boolean(technical.is_default);
    };

    // Helper functions for formatting and status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Enhanced ticket handling functions with better filtering and API calls
    const handleViewTickets = async (technical: Technical, type: 'all' | 'today' | 'week' | 'month' | 'recent' | 'open' | 'in_progress' | 'resolved' | 'closed') => {
        const typeDisplayNames = {
            'all': 'All Tickets',
            'today': 'Today\'s Tickets', 
            'week': 'This Week\'s Tickets',
            'month': 'This Month\'s Tickets',
            'recent': 'Recent Completed Tickets (Last 7 days)',
            'open': 'Open Tickets',
            'in_progress': 'In Progress Tickets',
            'resolved': 'Resolved Tickets',
            'closed': 'Closed Tickets'
        };
        
        setTicketModalTitle(`${technical.name} - ${typeDisplayNames[type]}`);
        setLoadingTickets(true);
        setShowTicketModal(true);
        
        try {
            const response = await fetch(`/api/technicals/${technical.id}/tickets?type=${type}`);
            if (response.ok) {
                const tickets = await response.json();
                setSelectedTickets(tickets);
            } else {
                // Enhanced filtering logic for different ticket types
                let filteredTickets = technical.tickets || [];
                
                switch (type) {
                    case 'open': {
                        filteredTickets = filteredTickets.filter(t => t.status === 'open');
                        break;
                    }
                    case 'in_progress': {
                        filteredTickets = filteredTickets.filter(t => t.status === 'in_progress');
                        break;
                    }
                    case 'resolved': {
                        filteredTickets = filteredTickets.filter(t => t.status === 'resolved');
                        break;
                    }
                    case 'closed': {
                        filteredTickets = filteredTickets.filter(t => t.status === 'closed');
                        break;
                    }
                    case 'today': {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(today.getDate() + 1);
                        
                        filteredTickets = filteredTickets.filter(t => {
                            const ticketDate = new Date(t.created_at);
                            return ticketDate >= today && ticketDate < tomorrow;
                        });
                        break;
                    }
                    case 'week': {
                        const now = new Date();
                        const weekStart = new Date(now);
                        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                        weekStart.setHours(0, 0, 0, 0);
                        
                        filteredTickets = filteredTickets.filter(t => {
                            const ticketDate = new Date(t.created_at);
                            return ticketDate >= weekStart;
                        });
                        break;
                    }
                    case 'month': {
                        const now = new Date();
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                        
                        filteredTickets = filteredTickets.filter(t => {
                            const ticketDate = new Date(t.created_at);
                            return ticketDate >= monthStart;
                        });
                        break;
                    }
                    case 'recent': {
                        // Recent tickets: last 7 days that are COMPLETED (resolved/closed) - no active tickets
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        sevenDaysAgo.setHours(0, 0, 0, 0);
                        
                        filteredTickets = filteredTickets.filter(t => {
                            const ticketDate = new Date(t.created_at);
                            return ticketDate >= sevenDaysAgo && 
                                   ['resolved', 'closed'].includes(t.status); // Only completed tickets
                        });
                        break;
                    }
                    default:
                        // 'all' - no filtering
                        break;
                }
                
                setSelectedTickets(filteredTickets);
            }
        } catch (error) {
            console.log('Using local tickets data:', error);
            toast.error('Could not fetch latest ticket data, showing local data');
            
            // Apply same filtering logic as above in case of API failure
            let filteredTickets = technical.tickets || [];
            
            switch (type) {
                case 'open':
                    filteredTickets = filteredTickets.filter(t => t.status === 'open');
                    break;
                case 'in_progress':
                    filteredTickets = filteredTickets.filter(t => t.status === 'in_progress');
                    break;
                case 'resolved':
                    filteredTickets = filteredTickets.filter(t => t.status === 'resolved');
                    break;
                case 'closed':
                    filteredTickets = filteredTickets.filter(t => t.status === 'closed');
                    break;
                case 'today': {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    
                    filteredTickets = filteredTickets.filter(t => {
                        const ticketDate = new Date(t.created_at);
                        return ticketDate >= today && ticketDate < tomorrow;
                    });
                    break;
                }
                case 'week': {
                    const now = new Date();
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    
                    filteredTickets = filteredTickets.filter(t => {
                        const ticketDate = new Date(t.created_at);
                        return ticketDate >= weekStart;
                    });
                    break;
                }
                case 'month': {
                    const now = new Date();
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    
                    filteredTickets = filteredTickets.filter(t => {
                        const ticketDate = new Date(t.created_at);
                        return ticketDate >= monthStart;
                    });
                    break;
                }
                case 'recent': {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    sevenDaysAgo.setHours(0, 0, 0, 0);
                    
                    filteredTickets = filteredTickets.filter(t => {
                        const ticketDate = new Date(t.created_at);
                        return ticketDate >= sevenDaysAgo && 
                               ['resolved', 'closed'].includes(t.status);
                    });
                    break;
                }
            }
            
            setSelectedTickets(filteredTickets);
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleViewTicketDetail = async (ticketId: number) => {
        setLoadingTicketDetail(true);
        setShowTicketDetailModal(true);
        
        try {
            const response = await fetch(`/api/tickets/${ticketId}/detail`);
            if (response.ok) {
                const ticketDetail = await response.json();
                setSelectedTicketDetail(ticketDetail);
            } else {
                // Mock data si no hay endpoint
                const mockDetail: TicketDetail = {
                    id: ticketId,
                    title: "Sample Ticket",
                    description: "This is a sample ticket description with technical details...",
                    status: 'in_progress',
                    priority: 'high',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    history: [
                        {
                            id: 1,
                            action: "Ticket Created",
                            description: "Ticket was created by tenant",
                            created_at: new Date().toISOString(),
                            user: { name: "System", role: "system" }
                        }
                    ],
                    comments: []
                };
                setSelectedTicketDetail(mockDetail);
            }
        } catch {
            toast.error('Error loading ticket details');
        } finally {
            setLoadingTicketDetail(false);
        }
    };

    const navigateToTicket = (ticketId: number) => {
        router.visit(`/tickets/${ticketId}`);
    };

    // State declarations first
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'list'>('list');
    const [open, setOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedTechnical, setSelectedTechnical] = useState<Technical | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [gridColumns, setGridColumns] = useState<number>(4);
    
    // Nuevos estados para modales de tickets y detalles
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
    const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
    const [selectedTicketDetail, setSelectedTicketDetail] = useState<TicketDetail | null>(null);
    const [ticketModalTitle, setTicketModalTitle] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterShift, setFilterShift] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);
    const [loadingTickets, setLoadingTickets] = useState(false);

    // Helper function to get safe image URL
    const getPhotoUrl = (photo: string | null | undefined) => {
        if (!photo || photo === 'null' || photo.trim() === '') {
            return null;
        }
        return `/storage/${photo}`;
    };

    // Now we can use the state variables
    const filteredTechnicals = technicals.data.filter(technical => {
        const matchesSearch = technical.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            technical.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            technical.phone.includes(searchTerm);
        
        const matchesStatus = filterStatus === 'all' || 
                            (filterStatus === 'active' && technical.status) ||
                            (filterStatus === 'inactive' && !technical.status);
        
        const matchesShift = filterShift === 'all' || technical.shift === filterShift;
        
        return matchesSearch && matchesStatus && matchesShift;
    });
    
    // Estados para detección de cambios no guardados
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [originalData, setOriginalData] = useState<{
        id: number | null;
        name: string;
        email: string;
        phone: string;
        shift: 'morning' | 'afternoon' | 'night';
        photo: File | null;
    } | null>(null);
    
    const { data, setData, delete: destroy, processing, reset } = useForm({
        id: null as number | null,
        name: '',
        email: '',
        phone: '',
        shift: 'morning' as 'morning' | 'afternoon' | 'night',
        photo: null as File | null,
    });

    // Función wrapper para setData que detecta cambios
    const setFormData = (key: keyof typeof data, value: string | number | File | null) => {
        // Usamos switch para manejar cada tipo de campo específicamente
        switch (key) {
            case 'name':
            case 'email':
            case 'phone':
                setData(key, value as string);
                break;
            case 'shift':
                setData(key, value as 'morning' | 'afternoon' | 'night');
                break;
            case 'photo':
                setData(key, value as File | null);
                break;
            case 'id':
                setData(key, value as number | null);
                break;
        }
        
        if (originalData) {
            const newData = { ...data, [key]: value };
            const hasChanges = Object.keys(originalData).some(k => {
                const typedKey = k as keyof typeof originalData;
                if (typedKey === 'photo') {
                    // Para archivos, comparamos si se seleccionó uno nuevo
                    return newData[typedKey] !== null;
                }
                return originalData[typedKey] !== newData[typedKey];
            });
            setHasUnsavedChanges(hasChanges);
        }
    };

    // Función para manejar el cierre del modal
    const handleCloseModal = () => {
        if (hasUnsavedChanges) {
            setShowConfirmClose(true);
        } else {
            closeModalAndReset();
        }
    };

    // Función para cerrar y resetear el modal
    const closeModalAndReset = () => {
        setOpen(false);
        setShowConfirmClose(false);
        setHasUnsavedChanges(false);
        setOriginalData(null);
        reset();
    };

    // Función para confirmar descarte de cambios
    const confirmDiscardChanges = () => {
        closeModalAndReset();
    };

    // Columnas para tabla
    const columns: ColumnDef<Technical>[] = [
        {
            accessorKey: "photo",
            header: "Photo",
            cell: ({ row }) => (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                    {getPhotoUrl(row.original.photo) ? (
                        <img src={getPhotoUrl(row.original.photo)!}
                            alt={row.original.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center"><User size={16} class="text-gray-500" /></div>`;
                            }} />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "phone",
            header: "Phone",
        },
        {
            accessorKey: "shift",
            header: "Shift",
            cell: ({ row }) => <span className="capitalize">{row.original.shift}</span>,
        },
        {
            accessorKey: "is_default",
            header: "Role",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {isSuperAdmin ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={isDefaultTechnical(row.original) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleDefaultTechnical(row.original)}
                                    className="h-6 px-2 text-xs"
                                >
                                    {isDefaultTechnical(row.original) ? "Remove Chief" : "Set as Chief"}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isDefaultTechnical(row.original) ? 'Remove as' : 'Set as'} Tech Default</p>
                                <p>Tech Defaults have additional permissions</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                            isDefaultTechnical(row.original) 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            {isDefaultTechnical(row.original) ? "Tech Default" : "Technical"}
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Switch
                                checked={row.original.status}
                                onCheckedChange={() => toggleStatus(row.original)}
                                disabled={isUpdatingStatus === row.original.id}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{row.original.status ? 'Deactivate' : 'Activate'} technical</p>
                        </TooltipContent>
                    </Tooltip>
                    <StatusBadge status={row.original.status ? "active" : "inactive"} />
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>More actions</p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(row.original)}>
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const table = useReactTable({
        data: filteredTechnicals,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Vista de cuadrícula con tooltips mejorados
    const GridView = ({ technicals, gridColumns }: { technicals: Technical[], gridColumns: number }) => {
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

        return (
            <TooltipProvider>
                <div className={`grid ${getGridClass()} gap-6`}>
                    {technicals.map((technical, index) => (
                        <div 
                            key={technical.id} 
                            className="bg-gradient-to-br from-white to-corporate-gold/5 dark:from-dark-brown dark:to-corporate-gold/10 p-4 rounded-xl shadow-sm transition-all duration-500 border-2 border-corporate-gold/20 relative overflow-hidden"
                            style={{
                                animationDelay: `${index * 150}ms`,
                                animation: 'fadeInUp 0.6s ease-out forwards'
                            }}
                        >
                            {/* Decorative corner gradient */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-corporate-gold/20 to-transparent rounded-bl-2xl opacity-50"></div>
                            
                            {/* Imagen cuadrada arriba */}
                            <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 border-2 border-corporate-gold/30 transition-all duration-300 relative">
                                {getPhotoUrl(technical.photo) ? (
                                    <img
                                        src={getPhotoUrl(technical.photo)!}
                                        alt={technical.name}
                                        className="w-full h-full object-cover"
                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                            e.currentTarget.src = '/images/default-user.png';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-corporate-gold/10 to-corporate-warm/10 flex items-center justify-center">
                                        <User className="w-16 h-16 text-corporate-gold/60" />
                                    </div>
                                )}
                            </div>

                            {/* Contenido debajo de la imagen */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <h3 className="font-semibold text-xl truncate text-corporate-gold dark:text-corporate-gold-light transition-colors duration-300 cursor-help">{technical.name}</h3>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Technical: {technical.name}</p>
                                            <p>Email: {technical.email}</p>
                                            <p>Phone: {technical.phone}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Switch
                                                checked={technical.status}
                                                onCheckedChange={() => toggleStatus(technical)}
                                                disabled={isUpdatingStatus === technical.id}
                                                className="scale-90 data-[state=checked]:bg-corporate-gold"
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{technical.status ? 'Deactivate' : 'Activate'} technical</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p className="text-muted-foreground truncate">{technical.email}</p>
                                    <p className="font-medium text-corporate-dark-brown dark:text-corporate-gold-light">{technical.phone}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`capitalize text-white px-3 py-1 rounded-md font-medium transition-all duration-300 ${
                                            technical.shift === 'morning' 
                                                ? 'bg-gradient-to-r from-corporate-gold to-corporate-warm shadow-lg shadow-corporate-gold/30' 
                                                : technical.shift === 'afternoon'
                                                ? 'bg-gradient-to-r from-corporate-warm to-corporate-gold shadow-lg shadow-corporate-warm/30'
                                                : 'bg-gradient-to-r from-corporate-dark-brown to-corporate-brown shadow-lg shadow-corporate-dark-brown/30'
                                        }`}>
                                            {technical.shift}
                                        </span>
                                        {isDefaultTechnical(technical) && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="bg-gradient-to-r from-corporate-gold via-corporate-warm to-corporate-gold text-white px-2 py-1 rounded-md text-xs font-medium animate-pulse shadow-lg cursor-help">
                                                        Tech Default
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Technical Chief - Team Leader</p>
                                                    <p>Has special permissions and responsibilities</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>

                                {/* Ticket Statistics - CLICKABLE */}
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div 
                                                onClick={() => handleViewTickets(technical, 'month')}
                                                className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-2 rounded-lg border border-purple-200 text-center transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                            >
                                                <div className="text-lg font-bold text-purple-600">
                                                    <AnimatedCounter value={technical.monthly_tickets} />
                                                </div>
                                                <div className="text-xs text-purple-600">Month</div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Click to view this month's tickets</p>
                                            <p>{technical.monthly_tickets} tickets this month</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div 
                                                onClick={() => handleViewTickets(technical, 'week')}
                                                className="bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 p-2 rounded-lg border border-corporate-gold/30 text-center transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                            >
                                                <div className="text-lg font-bold text-corporate-gold">
                                                    <AnimatedCounter value={technical.weekly_tickets} />
                                                </div>
                                                <div className="text-xs text-corporate-gold">Week</div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Click to view this week's tickets</p>
                                            <p>{technical.weekly_tickets} tickets this week</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div 
                                                onClick={() => handleViewTickets(technical, 'today')}
                                                className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-2 rounded-lg border border-green-200 text-center transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                            >
                                                <div className="text-lg font-bold text-green-600">
                                                    <AnimatedCounter value={technical.today_tickets} />
                                                </div>
                                                <div className="text-xs text-green-600">Today</div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Click to view today's tickets</p>
                                            <p>{technical.today_tickets} tickets today</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                {/* Botones en la parte inferior con tooltips */}
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={() => handleEdit(technical)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 px-4 border-corporate-gold/30 transition-all duration-300"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Edit technical information</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={() => handleDelete(technical)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 px-4 border-red-300 transition-all duration-300"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Delete technical permanently</p>
                                                <p className="text-red-500">This action cannot be undone</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    
                                    {isSuperAdmin && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={() => toggleDefaultTechnical(technical)}
                                                    variant={isDefaultTechnical(technical) ? "default" : "outline"}
                                                    size="sm"
                                                    className={`text-xs transition-all duration-300 ${
                                                        isDefaultTechnical(technical) 
                                                            ? 'bg-gradient-to-r from-corporate-gold to-corporate-warm text-white shadow-lg' 
                                                            : 'border-corporate-gold/30'
                                                    }`}
                                                >
                                                    <Trophy className="w-4 h-4 mr-1" />
                                                    {isDefaultTechnical(technical) ? "Remove Chief" : "Set as Chief"}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{isDefaultTechnical(technical) ? 'Remove as' : 'Set as'} Tech Default</p>
                                                <p>Tech Defaults have additional permissions</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </TooltipProvider>
        )
    };

    // Nueva vista de lista con cards detallados
    const ListView = ({ technicals }: { technicals: Technical[] }) => {
        return (
            <TooltipProvider>
                <div className="space-y-6">
                    {technicals.map((technical, index) => (
                        <div 
                            key={technical.id} 
                            className="bg-gradient-to-r from-white to-corporate-gold/5 dark:from-transparent dark:to-corporate-gold/10 rounded-xl shadow-sm transition-all duration-500 border-2 border-corporate-gold/20 overflow-hidden group"
                            style={{
                                animationDelay: `${index * 200}ms`,
                                animation: 'fadeInUp 0.8s ease-out forwards'
                            }}
                        >
                            {/* Animated gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-corporate-gold/0 via-corporate-gold/5 to-corporate-gold/0 opacity-0 transition-opacity duration-700 pointer-events-none"></div>
                            
                            <div className="flex relative z-10">
                                {/* Card pequeño izquierdo - Info básica */}
                                <div className="w-80 bg-gradient-to-br from-corporate-gold/10 to-corporate-warm/10 dark:from-corporate-gold/20 dark:to-corporate-warm/20 p-6 border-r border-corporate-gold/20 relative overflow-hidden">
                                    {/* Decorative elements */}
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-corporate-gold/20 to-transparent rounded-bl-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-corporate-warm/20 to-transparent rounded-tr-3xl"></div>
                                    
                                    <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-corporate-gold/30 shadow-xl relative transition-transform duration-500">
                                                {getPhotoUrl(technical.photo) ? (
                                                    <img
                                                        src={getPhotoUrl(technical.photo)!}
                                                        alt={technical.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                            e.currentTarget.src = '/images/default-user.png';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 flex items-center justify-center">
                                                        <User className="w-12 h-12 text-corporate-gold" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Animated ring */}
                                            <div className="absolute inset-0 rounded-full border-2 border-corporate-gold/0 transition-all duration-500"></div>
                                            
                                            {isDefaultTechnical(technical) && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-corporate-gold to-corporate-warm rounded-full p-2 shadow-lg animate-bounce">
                                                            <Trophy className="w-4 h-4 text-primary-foreground dark:text-white" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Technical Chief - Team Leader</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="font-bold text-xl text-corporate-gold dark:text-corporate-gold-light transition-colors duration-300">{technical.name}</h3>
                                            <p className="text-sm text-muted-foreground">{technical.email}</p>
                                            <p className="font-medium text-corporate-dark-brown dark:text-corporate-gold-light">{technical.phone}</p>
                                            
                                            <div className="flex flex-col gap-2">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize shadow-lg transition-all duration-300  ${
                                                    technical.shift === 'morning' 
                                                        ? 'bg-gradient-to-r from-corporate-gold to-corporate-warm text-primary-foregrounde shadow-corporate-gold/30' 
                                                        : technical.shift === 'afternoon' 
                                                        ? 'bg-gradient-to-r from-corporate-warm to-corporate-gold text-primary-foreground shadow-corporate-warm/30'
                                                        : 'bg-gradient-to-r from-corporate-dark-brown to-corporate-brown text-primary-foreground shadow-corporate-dark-brown/30'
                                                }`}>
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {technical.shift}
                                                </span>
                                                
                                                {isDefaultTechnical(technical) && (
                                                    <span className="inline-flex items-center px-3 py-1 dark:text-white rounded-full text-xs font-medium bg-gradient-to-r from-corporate-gold via-corporate-warm to-corporate-gold text-primary-foreground shadow-lg">
                                                        <Trophy className="w-3 h-3 mr-1" />
                                                        Tech Default
                                                    </span>
                                                )}
                                            </div>

                                            {/* Nuevas métricas adicionales con animaciones */}
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-white/70 dark:bg-transparent dark:bg-corporate-gold/10 p-2 rounded-lg border border-corporate-gold/20 text-center transition-colors duration-300 cursor-pointer">
                                                            <div className="text-lg font-bold text-corporate-gold animate-pulse">
                                                                <AnimatedCounter value={technical.current_streak} />
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">Streak</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Consecutive resolved tickets</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-white/70 dark:bg-transparent p-2 rounded-lg border border-corporate-gold/20 text-center transition-colors duration-300 cursor-pointer">
                                                            <div className="text-lg font-bold text-corporate-warm">
                                                                <AnimatedCounter value={technical.avg_resolution_time} />h
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">Avg Time</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Average resolution time in hours</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                             <span className={`px-2 py-1 flex gap-2 items-center rounded-full text-xs font-medium transition-all duration-300 ${
                                                technical.status 
                                                    ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-green-200/50' 
                                                    : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 shadow-red-200/50'
                                            }`}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Switch
                                                        checked={technical.status}
                                                        onCheckedChange={() => toggleStatus(technical)}
                                                        disabled={isUpdatingStatus === technical.id}
                                                        className="data-[state=checked]:bg-white data-[state=unchecked]:bg-gray-200"
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{technical.status ? 'Deactivate' : 'Activate'} technical</p>
                                                </TooltipContent>
                                            </Tooltip>
                                           
                                                {technical.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => handleEdit(technical)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 border-corporate-gold/30 transition-colors duration-300"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Edit technical information</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => handleDelete(technical)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 border-red-300 transition-colors duration-300"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Delete technical permanently</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            {isSuperAdmin && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            onClick={() => toggleDefaultTechnical(technical)}
                                                            variant={isDefaultTechnical(technical) ? "default" : "outline"}
                                                            size="sm"
                                                            className={`flex-1 transition-colors duration-300 ${
                                                                isDefaultTechnical(technical) 
                                                                    ? 'bg-secondary text-primary-foreground border-corporate-gold' 
                                                                    : 'border-corporate-gold/30'
                                                            }`}
                                                        >
                                                            <Trophy className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{isDefaultTechnical(technical) ? 'Remove as' : 'Set as'} Tech Default</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Card grande derecho - Información detallada */}
                                <div className="flex-1 p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                                        {/* Estadísticas de tickets */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Target className="w-5 h-5 text-corporate-gold" />
                                                <h4 className="font-semibold text-lg text-corporate-gold dark:text-corporate-gold-light">Performance Metrics</h4>
                                            </div>

                                            {/* Estadísticas principales con animación - CLICKABLES */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            onClick={() => handleViewTickets(technical, 'today')}
                                                            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg border border-green-200 text-center transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                                        >
                                                            <div className="text-xl font-bold text-green-600">
                                                                <AnimatedCounter value={technical.today_tickets} />
                                                            </div>
                                                            <div className="text-xs text-green-600">Today</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Click to view today's tickets</p>
                                                        <p>{technical.today_tickets} tickets created today</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            onClick={() => handleViewTickets(technical, 'week')}
                                                            className="bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 p-3 rounded-lg border border-corporate-gold/30 text-center transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                                        >
                                                            <div className="text-xl font-bold text-corporate-gold">
                                                                <AnimatedCounter value={technical.weekly_tickets} />
                                                            </div>
                                                            <div className="text-xs text-corporate-gold">This Week</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Click to view this week's tickets</p>
                                                        <p>{technical.weekly_tickets} tickets this week</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            onClick={() => handleViewTickets(technical, 'month')}
                                                            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg border border-purple-200 text-center transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                                        >
                                                            <div className="text-xl font-bold text-purple-600">
                                                                <AnimatedCounter value={technical.monthly_tickets} />
                                                            </div>
                                                            <div className="text-xs text-purple-600">This Month</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Click to view this month's tickets</p>
                                                        <p>{technical.monthly_tickets} tickets this month</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>

                                            {/* Estados de tickets con información detallada - CLICKABLES */}
                                            <div className="space-y-3">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            onClick={() => handleViewTickets(technical, 'open')}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <AlertCircle className="w-5 h-5 text-red-500" />
                                                                <div>
                                                                    <div className="text-sm font-medium text-red-700 dark:text-red-300">Open Tickets</div>
                                                                    <div className="text-xs text-red-600 dark:text-red-400">Require immediate attention</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl font-bold text-red-600">
                                                                    <AnimatedCounter value={technical.open_tickets} />
                                                                </span>
                                                                <ChevronRight className="w-4 h-4 text-red-500" />
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Click to view all open tickets</p>
                                                        <p>{technical.open_tickets} tickets waiting for work to begin</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            onClick={() => handleViewTickets(technical, 'in_progress')}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Clock className="w-5 h-5 text-yellow-500" />
                                                                <div>
                                                                    <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">In Progress</div>
                                                                    <div className="text-xs text-yellow-600 dark:text-yellow-400">Currently being worked on</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl font-bold text-yellow-600">
                                                                    <AnimatedCounter value={technical.in_progress_tickets} />
                                                                </span>
                                                                <ChevronRight className="w-4 h-4 text-yellow-500" />
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Click to view all tickets in progress</p>
                                                        <p>{technical.in_progress_tickets} tickets actively being resolved</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            onClick={() => handleViewTickets(technical, 'resolved')}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                                <div>
                                                                    <div className="text-sm font-medium text-green-700 dark:text-green-300">Resolved</div>
                                                                    <div className="text-xs text-green-600 dark:text-green-400">Successfully completed</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl font-bold text-green-600">
                                                                    <AnimatedCounter value={technical.resolved_tickets} />
                                                                </span>
                                                                <ChevronRight className="w-4 h-4 text-green-500" />
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Click to view all resolved tickets</p>
                                                        <p>{technical.resolved_tickets} tickets successfully completed</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            onClick={() => handleViewTickets(technical, 'recent')}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 transition-all duration-300 cursor-pointer hover:scale-105 transform"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <History className="w-5 h-5 text-blue-500" />
                                                                <div>
                                                                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Recent Completed</div>
                                                                    <div className="text-xs text-blue-600 dark:text-blue-400">Last 7 days (resolved/closed only)</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl font-bold text-blue-600">
                                                                    <AnimatedCounter value={technical.tickets?.filter(t => {
                                                                        const sevenDaysAgo = new Date();
                                                                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                                                        return new Date(t.created_at) >= sevenDaysAgo && 
                                                                               ['resolved', 'closed'].includes(t.status);
                                                                    }).length || 0} />
                                                                </span>
                                                                <ChevronRight className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Click to view recent completed tickets</p>
                                                        <p>Shows only resolved/closed tickets from last 7 days</p>
                                                        <p className="text-blue-500">Excludes active (open/in progress) tickets</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>

                                            {/* Progress bar de eficiencia con animación */}
                                            {technical.total_tickets > 0 && (
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="text-corporate-gold font-medium">Success Rate</span>
                                                        <span className="font-bold text-corporate-gold">
                                                            <AnimatedCounter value={Math.round((technical.resolved_tickets / technical.total_tickets) * 100)} />%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-3 shadow-inner overflow-hidden">
                                                        <div 
                                                            className="bg-gradient-to-r from-corporate-gold via-corporate-warm to-corporate-gold h-3 rounded-full transition-all duration-2000 ease-out shadow-lg relative"
                                                            style={{ 
                                                                width: `${Math.round((technical.resolved_tickets / technical.total_tickets) * 100)}%`,
                                                                animationDelay: `${index * 300}ms`
                                                            }}
                                                        >
                                                            {/* Shimmering effect */}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Performance Summary */}
                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-corporate-gold/20">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-center p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 transition-colors duration-300 cursor-pointer hover:bg-gradient-to-br hover:from-green-100 hover:to-green-150">
                                                            <div className="text-sm font-medium text-green-600">Resolved Today</div>
                                                            <div className="text-lg font-bold text-green-600">
                                                                <AnimatedCounter value={technical.resolved_today} />
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tickets resolved today</p>
                                                        <p>Shows completion performance for today</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-center p-2 rounded-lg bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 border border-corporate-gold/30 transition-colors duration-300 cursor-pointer hover:bg-gradient-to-br hover:from-corporate-gold/30 hover:to-corporate-warm/30">
                                                            <div className="text-sm font-medium text-corporate-gold">Avg Resolution</div>
                                                            <div className="text-lg font-bold text-corporate-gold">
                                                                <AnimatedCounter value={technical.avg_resolution_time} />h
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Average time to resolve tickets</p>
                                                        <p>Lower is better for efficiency</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        {/* Dispositivos asignados y tickets recientes */}
                                        <div className="space-y-4">
                                            {/* Dispositivos asignados */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Laptop className="w-5 h-5 text-corporate-gold" />
                                                    <h4 className="font-semibold text-lg text-corporate-gold dark:text-corporate-gold-light">Active Assignments</h4>
                                                    <span className="bg-gradient-to-r from-corporate-gold/20 to-corporate-warm/20 text-corporate-gold border border-corporate-gold/30 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                                                        <AnimatedCounter value={technical.assigned_devices_count} />
                                                    </span>
                                                </div>

                                                <div className="space-y-2 max-h-36 overflow-y-auto overflow-x-hidden">
                                                    {technical.assigned_devices?.length > 0 ? (
                                                        technical.assigned_devices.map((device, deviceIndex) => (
                                                            <Tooltip key={device.id}>
                                                                <TooltipTrigger asChild>
                                                                    <div 
                                                                        className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg border border-corporate-gold/20 hover:bg-gradient-to-r hover:from-corporate-gold/10 hover:to-corporate-warm/10 hover:border-corporate-gold/40 transition-colors duration-300 cursor-pointer"
                                                                        style={{
                                                                            animationDelay: `${index * 100 + deviceIndex * 50}ms`,
                                                                            animation: 'fadeInUp 0.6s ease-out forwards'
                                                                        }}
                                                                    >
                                                                        <div className="font-medium text-sm text-corporate-gold truncate">{device.name}</div>
                                                                        <div className="text-xs text-muted-foreground truncate">
                                                                            {device.brand?.name} • {device.model?.name}
                                                                        </div>
                                                                        {device.system && (
                                                                            <div className="text-xs text-corporate-warm mt-1 truncate">
                                                                                System: {device.system.name}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Device with active/in-progress tickets</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground italic p-3 text-center bg-corporate-gold/5 rounded-lg border border-corporate-gold/20">
                                                            No active device assignments
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Recent Completed Tickets - ENHANCED */}
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <History className="w-5 h-5 text-corporate-gold" />
                                                        <h4 className="font-semibold text-lg text-corporate-gold dark:text-corporate-gold-light">Recent Completed Tickets</h4>
                                                    </div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleViewTickets(technical, 'recent')}
                                                                className="text-xs border-corporate-gold/30 hover:bg-corporate-gold hover:text-white"
                                                            >
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                View All Recent
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>View all completed tickets from last 7 days</p>
                                                            <p className="text-blue-500">Excludes active tickets</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>

                                                <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin">
                                                    {technical.tickets?.filter(t => {
                                                        // Filter for completed tickets from last 7 days only
                                                        const sevenDaysAgo = new Date();
                                                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                                        sevenDaysAgo.setHours(0, 0, 0, 0);
                                                        
                                                        const ticketDate = new Date(t.created_at);
                                                        return ticketDate >= sevenDaysAgo && 
                                                               ['resolved', 'closed'].includes(t.status); // Only completed tickets
                                                    }).length > 0 ? (
                                                        technical.tickets
                                                            .filter(t => {
                                                                const sevenDaysAgo = new Date();
                                                                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                                                sevenDaysAgo.setHours(0, 0, 0, 0);
                                                                
                                                                const ticketDate = new Date(t.created_at);
                                                                return ticketDate >= sevenDaysAgo && 
                                                                       ['resolved', 'closed'].includes(t.status);
                                                            })
                                                            .slice(0, 5) // Show only first 5
                                                            .map((ticket, ticketIndex) => (
                                                                <Tooltip key={ticket.id}>
                                                                    <TooltipTrigger asChild>
                                                                        <div 
                                                                            onClick={() => handleViewTicketDetail(ticket.id)}
                                                                            className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg border border-corporate-gold/20 hover:bg-gradient-to-r hover:from-corporate-gold/10 hover:to-corporate-warm/10 hover:border-corporate-gold/40 transition-all duration-300 cursor-pointer hover:scale-105 transform group"
                                                                            style={{
                                                                                animationDelay: `${index * 100 + ticketIndex * 50}ms`,
                                                                                animation: 'fadeInUp 0.6s ease-out forwards'
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="font-medium text-sm truncate pr-2 text-corporate-gold group-hover:text-corporate-warm">{ticket.title}</div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 flex-shrink-0 ${getStatusColor(ticket.status)}`}>
                                                                                        {ticket.status.replace('_', ' ')}
                                                                                    </span>
                                                                                    <ExternalLink className="w-3 h-3 text-corporate-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground mt-1 truncate">
                                                                                {formatDate(ticket.created_at)}
                                                                                {ticket.building && (
                                                                                    <span className="ml-2 text-corporate-warm">• {ticket.building.name}</span>
                                                                                )}
                                                                            </div>
                                                                            {ticket.device && (
                                                                                <div className="text-xs text-corporate-gold mt-1 truncate">
                                                                                    Device: {ticket.device.name}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Click to view ticket details and history</p>
                                                                        <p className="text-green-500">✓ Completed ticket</p>
                                                                        <p>Status: {ticket.status}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            ))
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground italic p-3 text-center bg-corporate-gold/5 rounded-lg border border-corporate-gold/20">
                                                            <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                                            <p>No recent completed tickets</p>
                                                            <p className="text-xs mt-1">Last 7 days show no resolved/closed tickets</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </TooltipProvider>
        );
    };

    const toggleStatus = async (technical: Technical) => {
        setIsUpdatingStatus(technical.id);
        try {
            await router.put(route('technicals.update-status', technical.id), {}, {
                preserveScroll: true,
                onSuccess: () => toast.success('Status updated'),
                onError: () => toast.error('Error updating status')
            });
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const toggleDefaultTechnical = async (technical: Technical) => {
        if (!isSuperAdmin) {
            toast.error('Only super-admin can manage Tech Defaults');
            return;
        }

        try {
            await router.put(route('technicals.set-default', technical.id), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    const action = isDefaultTechnical(technical) ? 'removed from' : 'assigned as';
                    toast.success(`Technical ${action} Tech Default successfully`);
                },
                onError: () => toast.error('Error updating Tech Default status')
            });
        } catch {
            toast.error('Connection error');
        }
    };

    const handleEdit = (technical: Technical) => {
        const initialData = {
            id: technical.id,
            name: technical.name,
            email: technical.email,
            phone: technical.phone,
            shift: technical.shift,
            photo: null
        };
        setData(initialData);
        setOriginalData(initialData);
        setSelectedTechnical(technical);
        setHasUnsavedChanges(false);
        setOpen(true);
    };

    const handleDelete = (technical: Technical) => {
        setSelectedTechnical(technical);
        setDeleteOpen(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (data.id) {
            // Para actualización
            const formData = new FormData();
            formData.append('_method', 'PUT');
            Object.entries(data).forEach(([key, value]) => {
                if (value !== null) {
                    if (typeof value === 'number') {
                        formData.append(key, value.toString());
                    } else {
                        formData.append(key, value);
                    }
                }
            });
            
            router.post(route('technicals.update', data.id), formData, {
                preserveScroll: true,
                onSuccess: () => {
                    closeModalAndReset();
                    toast.success('Technical updated');
                },
                onError: (errors: Record<string, string>) => {
                    Object.values(errors).forEach(error => toast.error(error));
                }
            });
        } else {
            // Para creación - usar el método post de useForm que maneja CSRF automáticamente
            const formData = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                shift: data.shift,
                photo: data.photo
            };

            router.post(route('technicals.store'), formData, {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    closeModalAndReset();
                    toast.success('Technical created');
                },
                onError: (errors: Record<string, string>) => {
                    Object.values(errors).forEach(error => toast.error(error));
                }
            });
        }
    };

    const confirmDelete = () => {
        if (!selectedTechnical) return;
        destroy(route('technicals.destroy', selectedTechnical.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                toast.success('Technical deleted');
            },
            onError: () => {
                toast.error('Delete failed');
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Technicals Management" />
            
            {/* Add custom CSS animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes bounceIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.3);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.05);
                    }
                    70% {
                        transform: scale(0.9);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes shimmer {
                    0% {
                        background-position: -200px 0;
                    }
                    100% {
                        background-position: calc(200px + 100%) 0;
                    }
                }
                
                .animate-fadeInUp {
                    animation: fadeInUp 0.6s ease-out;
                }
                
                .animate-bounceIn {
                    animation: bounceIn 0.8s ease-out;
                }
                
                .animate-shimmer {
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.2),
                        transparent
                    );
                    background-size: 200px 100%;
                    animation: shimmer 2s infinite;
                }
                
                .scrollbar-thin {
                    scrollbar-width: thin;
                }
                
                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.2);
                    border-radius: 2px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 0.3);
                }
            `}} />

            {/* Enhanced Header Section */}
            <div className="bg-gradient-to-br from-corporate-gold/10 via-corporate-warm/10 to-corporate-gold/5 dark:from-corporate-gold/20 dark:via-corporate-warm/20 dark:to-corporate-gold/10 p-6 border-b border-corporate-gold/20">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-r from-primary to-accent rounded-xl shadow-lg">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-corporate-gold dark:text-corporate-gold-light">
                                    Technical Team Management
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage technical staff, track performance, and monitor ticket assignments
                                </p>
                            </div>
                        </div>
                        
                        {/* Stats Overview with Enhanced Tooltips */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
                                <CardContent className="p-3">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2 cursor-help">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-green-600">Active Technicals</p>
                                                    <p className="text-xl font-bold text-green-700">
                                                        <AnimatedCounter value={technicals.data.filter(t => t.status).length} />
                                                    </p>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Currently active technicals</p>
                                            <p>Ready to handle tickets and assignments</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 border-corporate-gold/30">
                                <CardContent className="p-3">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2 cursor-help">
                                                <Trophy className="w-5 h-5 text-corporate-gold" />
                                                <div>
                                                    <p className="text-sm font-medium text-corporate-gold">Tech Defaults</p>
                                                    <p className="text-xl font-bold text-corporate-gold">
                                                        <AnimatedCounter value={technicals.data.filter(t => t.is_default).length} />
                                                    </p>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Technical Chiefs - Team Leaders</p>
                                            <p>Have additional permissions and responsibilities</p>
                                            <p className="text-corporate-gold">Only super-admin can assign this role</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
                                <CardContent className="p-3">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2 cursor-help">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-blue-600">Total Tickets</p>
                                                    <p className="text-xl font-bold text-blue-700">
                                                        <AnimatedCounter value={technicals.data.reduce((sum, t) => sum + t.total_tickets, 0)} />
                                                    </p>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Total tickets handled by all technicals</p>
                                            <p>Includes all statuses across the team</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
                                <CardContent className="p-3">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2 cursor-help">
                                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-purple-600">Avg Resolution</p>
                                                    <p className="text-xl font-bold text-purple-700">
                                                        <AnimatedCounter value={Math.round(technicals.data.reduce((sum, t) => sum + t.avg_resolution_time, 0) / technicals.data.length) || 0} />h
                                                    </p>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Average resolution time across all technicals</p>
                                            <p>Time from ticket creation to resolution</p>
                                            <p className="text-purple-500">Lower values indicate better efficiency</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="border-corporate-gold/30 hover:bg-corporate-gold hover:text-primary-foreground transition-all duration-300"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    Advanced Filters
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Advanced search and filtering options</p>
                                <p>Filter by status, shift, and search terms</p>
                            </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    onClick={() => {
                                        const initialData = {
                                            id: null,
                                            name: '',
                                            email: '',
                                            phone: '',
                                            shift: 'morning' as 'morning' | 'afternoon' | 'night',
                                            photo: null
                                        };
                                        setData(initialData);
                                        setOriginalData(initialData);
                                        setSelectedTechnical(null);
                                        setHasUnsavedChanges(false);
                                        setOpen(true);
                                    }}
                                    className="text-primary-foreground bg-primary hover:from-corporate-warm hover:to-corporate-gold  shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New Technical
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Add a new technical staff member</p>
                               
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-corporate-gold/20 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search" className="text-sm font-medium text-corporate-gold">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        id="search"
                                        placeholder="Search by name, email, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-corporate-gold/20 focus:border-corporate-gold"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-corporate-gold">Status</Label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="border-corporate-gold/20 focus:border-corporate-gold">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active Only</SelectItem>
                                        <SelectItem value="inactive">Inactive Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-corporate-gold">Shift</Label>
                                <Select value={filterShift} onValueChange={setFilterShift}>
                                    <SelectTrigger className="border-corporate-gold/20 focus:border-corporate-gold">
                                        <SelectValue placeholder="All Shifts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Shifts</SelectItem>
                                        <SelectItem value="morning">Morning</SelectItem>
                                        <SelectItem value="afternoon">Afternoon</SelectItem>
                                        <SelectItem value="night">Night</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-corporate-gold">View Mode</Label>
                                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewMode('list')}
                                                className={`flex-1 ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                            >
                                                <List className="w-4 h-4 mr-1" />
                                              
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Detailed List View - Comprehensive View</p>
                                          
                                        </TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewMode('grid')}
                                                className={`flex-1 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                            >
                                                <Grid3X3 className="w-4 h-4 mr-1" />
                                               
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Grid Cards View - Quick Overview</p>
                                           
                                        </TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewMode('table')}
                                                className={`flex-1 ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                            >
                                                <TableIcon className="w-4 h-4 mr-1" />
                                             
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Data Table View - Traditional Layout</p>
                                           
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                        
                        {(searchTerm || filterStatus !== 'all' || filterShift !== 'all') && (
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Active filters:</span>
                                {searchTerm && (
                                    <Badge variant="secondary" className="bg-corporate-gold/10 text-corporate-gold">
                                        Search: {searchTerm}
                                    </Badge>
                                )}
                                {filterStatus !== 'all' && (
                                    <Badge variant="secondary" className="bg-corporate-gold/10 text-corporate-gold">
                                        Status: {filterStatus}
                                    </Badge>
                                )}
                                {filterShift !== 'all' && (
                                    <Badge variant="secondary" className="bg-corporate-gold/10 text-corporate-gold">
                                        Shift: {filterShift}
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterStatus('all');
                                        setFilterShift('all');
                                    }}
                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-corporate-gold"
                                >
                                    Clear all
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-6 space-y-6">
                {/* View Options for Grid */}
                {viewMode === 'grid' && (
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Grid columns:</span>
                            <Select
                                value={gridColumns.toString()}
                                onValueChange={(value) => setGridColumns(Number(value))}
                            >
                                <SelectTrigger className="w-24 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2, 3, 4, 5, 6].map(num => (
                                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                            Showing {filteredTechnicals.length} of {technicals.data.length} technicals
                        </div>
                    </div>
                )}

                {/* Content Area */}
                {filteredTechnicals.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="animate-bounceIn">
                            <div className="w-32 h-32 bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-corporate-gold/30">
                                <Users className="w-16 h-16 text-corporate-gold" />
                            </div>
                            <h3 className="text-2xl font-bold text-corporate-gold mb-4">
                                {technicals.data.length === 0 ? 'No Technicals Yet' : 'No Results Found'}
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                {technicals.data.length === 0 
                                    ? 'Start building your technical team by adding your first technical staff member.'
                                    : 'Try adjusting your search criteria or filters to find the technicals you\'re looking for.'
                                }
                            </p>
                            {technicals.data.length === 0 ? (
                                <Button
                                    onClick={() => {
                                        const initialData = {
                                            id: null,
                                            name: '',
                                            email: '',
                                            phone: '',
                                            shift: 'morning' as 'morning' | 'afternoon' | 'night',
                                            photo: null
                                        };
                                        setData(initialData);
                                        setOriginalData(initialData);
                                        setSelectedTechnical(null);
                                        setHasUnsavedChanges(false);
                                        setOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-corporate-gold to-corporate-warm hover:from-corporate-warm hover:to-corporate-gold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Technical
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterStatus('all');
                                        setFilterShift('all');
                                    }}
                                    className="border-corporate-gold/30 hover:bg-corporate-gold hover:text-white"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Clear All Filters
                                </Button>
                            )}
                        </div>
                    </div>
                ) : viewMode === 'list' ? (
                    <ListView technicals={filteredTechnicals} />
                ) : viewMode === 'grid' ? (
                    <GridView technicals={filteredTechnicals} gridColumns={gridColumns} />
                ) : (
                    <TooltipProvider>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
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
                                        table.getRowModel().rows.map(row => (
                                            <TableRow key={row.id}>
                                                {row.getVisibleCells().map(cell => (
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
                                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TooltipProvider>
                )}

                {/* Create/Edit Modal */}
                <Dialog open={open} onOpenChange={handleCloseModal}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader className="flex-shrink-0">
                            <DialogTitle>
                                {selectedTechnical ? 'Edit Technical' : 'New Technical'}
                            </DialogTitle>
                        </DialogHeader>
                        
                        {/* Scrollable content area with custom scrollbar */}
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 scrollbar-thin scrollbar-thumb-corporate-gold/20 scrollbar-track-transparent hover:scrollbar-thumb-corporate-gold/40 dark:scrollbar-thumb-corporate-gold-light/20 dark:hover:scrollbar-thumb-corporate-gold-light/40">
                            <form onSubmit={submitForm} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className=" space-y-2">
                                        <Label>Photo</Label>
                                        <div className="mt-2 group relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed bg-muted/50">
                                            <input
                                                type="file"
                                                onChange={e => setFormData('photo', e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="photo-upload"
                                            />
                                            <label
                                                htmlFor="photo-upload"
                                                className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                {data.photo ? (
                                                    <img
                                                        src={URL.createObjectURL(data.photo)}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : selectedTechnical && getPhotoUrl(selectedTechnical.photo) ? (
                                                    <img
                                                        src={getPhotoUrl(selectedTechnical.photo)!}
                                                        alt="Current"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-center space-y-2">
                                                        <User className="w-12 h-12 mx-auto text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Click to upload photo
                                                        </p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                value={data.name}
                                                onChange={e => setFormData('name', e.target.value)}
                                                required
                                                className='h-11 mt-2'
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                value={data.email}
                                                onChange={e => setFormData('email', e.target.value)}
                                                required
                                                className='h-11 mt-2'
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input
                                                value={data.phone}
                                                onChange={e => setFormData('phone', e.target.value)}
                                                required
                                                className='h-11 mt-2'
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Shift</Label>
                                            <Select
                                                value={data.shift}
                                                onValueChange={(value) => setFormData('shift', value as 'morning' | 'afternoon' | 'night')}
                                            >
                                                <SelectTrigger className='h-11 mt-2' >
                                                    <SelectValue placeholder="Select shift" />
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
                                <DialogFooter className="flex-shrink-0 pt-4">
                                    <Button type="button" variant="outline" onClick={handleCloseModal}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Confirmation dialog for unsaved changes */}
                <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <DialogTitle>Unsaved Changes</DialogTitle>
                                    <DialogDescription className="mt-1">
                                        You have unsaved changes that will be lost if you close this dialog.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowConfirmClose(false)}
                                className="w-full sm:w-auto"
                            >
                                Continue Editing
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={confirmDiscardChanges}
                                className="w-full sm:w-auto"
                            >
                                Discard Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Delete</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {selectedTechnical?.name}?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Enhanced Tickets List Modal */}
                <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
                    <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader className="flex-shrink-0 pb-4 border-b border-corporate-gold/20">
                            <DialogTitle className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-corporate-gold to-corporate-warm rounded-lg">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-corporate-gold">{ticketModalTitle}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {loadingTickets ? 'Loading tickets...' : `${selectedTickets.length} tickets found`}
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <Badge variant="secondary" className="bg-corporate-gold/10 text-corporate-gold border-corporate-gold/30">
                                        {selectedTickets.length} total
                                    </Badge>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-corporate-gold/20 scrollbar-track-transparent hover:scrollbar-thumb-corporate-gold/40">
                            {loadingTickets ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-gold mb-4"></div>
                                    <p className="text-lg font-medium text-corporate-gold">Loading tickets...</p>
                                    <p className="text-sm text-muted-foreground">Please wait while we fetch the latest data</p>
                                </div>
                            ) : selectedTickets.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedTickets.map((ticket, index) => (
                                        <div 
                                            key={ticket.id}
                                            onClick={() => handleViewTicketDetail(ticket.id)}
                                            className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg border border-corporate-gold/20 hover:bg-gradient-to-r hover:from-corporate-gold/10 hover:to-corporate-warm/10 hover:border-corporate-gold/40 transition-all duration-300 cursor-pointer  transform group"
                                            style={{
                                                animationDelay: `${index * 100}ms`,
                                                animation: 'fadeInUp 0.6s ease-out forwards'
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-lg text-corporate-gold group-hover:text-corporate-warm transition-colors duration-300 truncate">
                                                            #{ticket.id} - {ticket.title}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                            {ticket.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-corporate-gold" />
                                                            <span>Created: {formatDate(ticket.created_at)}</span>
                                                        </div>
                                                        {ticket.building && (
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-corporate-warm" />
                                                                <span>{ticket.building.name}</span>
                                                            </div>
                                                        )}
                                                        {ticket.device && (
                                                            <div className="flex items-center gap-2">
                                                                <Laptop className="w-4 h-4 text-corporate-gold" />
                                                                <span>{ticket.device.name}</span>
                                                            </div>
                                                        )}
                                                        {ticket.priority && (
                                                            <div className="flex items-center gap-2">
                                                                <AlertTriangle className={`w-4 h-4 ${
                                                                    ticket.priority === 'urgent' ? 'text-red-500' :
                                                                    ticket.priority === 'high' ? 'text-orange-500' :
                                                                    ticket.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
                                                                }`} />
                                                                <span className="capitalize">{ticket.priority} Priority</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigateToTicket(ticket.id);
                                                                }}
                                                                className="border-corporate-gold/30 hover:bg-primary hover:text-white"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Open full ticket detail</p>
                                                          
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FileText className="w-12 h-12 text-corporate-gold" />
                                    </div>
                                    <h3 className="text-xl font-bold text-corporate-gold mb-2">No tickets found</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        This technical has no tickets for the selected filter. Try a different filter or check back later.
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <DialogFooter className="flex-shrink-0 pt-4">
                            <div className="flex justify-between w-full">
                                <div className="text-sm text-muted-foreground">
                                    {selectedTickets.length > 0 && (
                                        <span>Showing {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''}</span>
                                    )}
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" onClick={() => setShowTicketModal(false)}>
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Close
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Close ticket list modal</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Enhanced Ticket Detail Modal */}
                <Dialog open={showTicketDetailModal} onOpenChange={setShowTicketDetailModal}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader className="flex-shrink-0">
                            <DialogTitle className="flex items-center gap-2">
                                <History className="w-5 h-5 text-corporate-gold" />
                                {selectedTicketDetail ? `Ticket #${selectedTicketDetail.id} - ${selectedTicketDetail.title}` : 'Loading...'}
                            </DialogTitle>
                        </DialogHeader>
                        
                        <TooltipProvider>
                            <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-corporate-gold/20 scrollbar-track-transparent hover:scrollbar-thumb-corporate-gold/40">
                            {loadingTicketDetail ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-gold"></div>
                                    <span className="ml-2 text-corporate-gold">Loading ticket details...</span>
                                </div>
                            ) : selectedTicketDetail ? (
                                <div className="space-y-6">
                                    {/* Ticket Header */}
                                    <div className="bg-gradient-to-r from-corporate-gold/10 to-corporate-warm/10 p-4 rounded-lg border border-corporate-gold/20">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="font-semibold text-lg text-corporate-gold mb-2">{selectedTicketDetail.title}</h3>
                                                <p className="text-sm text-muted-foreground">{selectedTicketDetail.description}</p>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Status:</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicketDetail.status)}`}>
                                                        {selectedTicketDetail.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Priority:</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        selectedTicketDetail.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                        selectedTicketDetail.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        selectedTicketDetail.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {selectedTicketDetail.priority}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Created:</span>
                                                    <span>{formatDate(selectedTicketDetail.created_at)}</span>
                                                </div>
                                                {selectedTicketDetail.resolved_at && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Resolved:</span>
                                                        <span>{formatDate(selectedTicketDetail.resolved_at)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Details */}
                                    {(selectedTicketDetail.building || selectedTicketDetail.device || selectedTicketDetail.tenant) && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {selectedTicketDetail.building && (
                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg">
                                                    <h4 className="font-medium text-sm text-corporate-gold mb-1 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        Building
                                                    </h4>
                                                    <p className="text-sm">{selectedTicketDetail.building.name}</p>
                                                    <p className="text-xs text-muted-foreground">{selectedTicketDetail.building.address}</p>
                                                </div>
                                            )}
                                            
                                            {selectedTicketDetail.device && (
                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg">
                                                    <h4 className="font-medium text-sm text-corporate-gold mb-1 flex items-center gap-1">
                                                        <Laptop className="w-3 h-3" />
                                                        Device
                                                    </h4>
                                                    <p className="text-sm">{selectedTicketDetail.device.name}</p>
                                                    {selectedTicketDetail.device.brand && (
                                                        <p className="text-xs text-muted-foreground">{selectedTicketDetail.device.brand.name}</p>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {selectedTicketDetail.tenant && (
                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg">
                                                    <h4 className="font-medium text-sm text-corporate-gold mb-1 flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        Tenant
                                                    </h4>
                                                    <p className="text-sm">{selectedTicketDetail.tenant.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{selectedTicketDetail.tenant.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Phone className="w-3 h-3" />
                                                        <span>{selectedTicketDetail.tenant.phone}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Ticket History */}
                                    <div>
                                        <h3 className="font-semibold text-lg text-corporate-gold mb-4 flex items-center gap-2">
                                            <History className="w-5 h-5" />
                                            Ticket History
                                        </h3>
                                        <div className="space-y-4">
                                            {selectedTicketDetail.history.map((historyItem) => (
                                                <div key={historyItem.id} className="flex gap-4">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-corporate-gold to-corporate-warm rounded-full flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg border border-corporate-gold/20">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-medium text-sm text-corporate-gold">{historyItem.action}</h4>
                                                                <span className="text-xs text-muted-foreground">{formatDate(historyItem.created_at)}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">{historyItem.description}</p>
                                                            {historyItem.user && (
                                                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                                    <User className="w-3 h-3" />
                                                                    <span>{historyItem.user.name} ({historyItem.user.role})</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    {selectedTicketDetail.comments && selectedTicketDetail.comments.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-lg text-corporate-gold mb-4 flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5" />
                                                Comments
                                            </h3>
                                            <div className="space-y-3">
                                                {selectedTicketDetail.comments.map((comment) => (
                                                    <div key={comment.id} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg border border-corporate-gold/20">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-sm text-corporate-gold">{comment.user.name}</span>
                                                            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Performance Metrics */}
                                    {selectedTicketDetail.resolution_time && (
                                        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200">
                                            <h3 className="font-semibold text-lg text-green-600 mb-2 flex items-center gap-2">
                                                <Timer className="w-5 h-5" />
                                                Resolution Metrics
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium">Resolution Time:</span>
                                                    <p className="text-lg font-bold text-green-600">{selectedTicketDetail.resolution_time}h</p>
                                                </div>
                                                {selectedTicketDetail.rating && (
                                                    <div>
                                                        <span className="font-medium">Rating:</span>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-4 h-4 ${i < selectedTicketDetail.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                                            ))}
                                                            <span className="ml-1 font-bold text-yellow-600">({selectedTicketDetail.rating}/5)</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedTicketDetail.feedback && (
                                                    <div>
                                                        <span className="font-medium">Feedback:</span>
                                                        <p className="text-sm text-muted-foreground italic">"{selectedTicketDetail.feedback}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground">Error loading ticket details</p>
                                    <p className="text-sm text-muted-foreground">Please try again later</p>
                                </div>
                            )}
                            </div>
                        </TooltipProvider>
                        
                        <DialogFooter className="flex-shrink-0 pt-4">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setShowTicketDetailModal(false);
                                            setSelectedTicketDetail(null);
                                        }}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Back
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Return to ticket list</p>
                                </TooltipContent>
                            </Tooltip>
                            {selectedTicketDetail && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            onClick={() => navigateToTicket(selectedTicketDetail.id)}
                                            className="bg-gradient-to-r from-corporate-gold to-corporate-warm hover:from-corporate-warm hover:to-corporate-gold"
                                        >
                                            <ExternalLink className="w-4 h-4 mr-1" />
                                            Open Full Ticket
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Navigate to full ticket page</p>
                                        <p>Edit ticket, add comments, and more</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
        {status === 'active' ? 'Active' : 'Inactive'}
    </span>
);