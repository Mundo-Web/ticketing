import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plus, Edit, Trash2, MoreHorizontal, User,
    LayoutGrid, Table as TableIcon,
    List, Activity, Clock, CheckCircle, AlertCircle, Laptop, Trophy, Target
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
    created_at: string;
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
    
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'list'>('list');
    const [open, setOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedTechnical, setSelectedTechnical] = useState<Technical | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [gridColumns, setGridColumns] = useState<number>(4);
    const { data, setData, delete: destroy, processing, reset } = useForm({
        id: null as number | null,
        name: '',
        email: '',
        phone: '',
        shift: 'morning' as 'morning' | 'afternoon' | 'night',
        photo: null as File | null,
    });

    // Columnas para tabla
    const columns: ColumnDef<Technical>[] = [
        {
            accessorKey: "photo",
            header: "Photo",
            cell: ({ row }) => (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                    {row.original.photo ? (
                        <img src={`/storage/${row.original.photo}`}
                            alt={row.original.name}
                            className="w-full h-full object-cover" />
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
                        <Button
                            variant={row.original.is_default ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleDefaultTechnical(row.original)}
                            className="h-6 px-2 text-xs"
                        >
                            {row.original.is_default ? "Remove Chief" : "Set as Chief"}
                        </Button>
                    ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                            row.original.is_default 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            {row.original.is_default ? "Tech Chief" : "Technical"}
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
                    <Switch
                        checked={row.original.status}
                        onCheckedChange={() => toggleStatus(row.original)}
                        disabled={isUpdatingStatus === row.original.id}
                    />
                    <StatusBadge status={row.original.status ? "active" : "inactive"} />
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
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
        data: technicals.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Vista de cuadrícula
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
            <div className={`grid ${getGridClass()} gap-6`}>
                {technicals.map((technical) => (
                    <div key={technical.id} className="bg-card group p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border relative">
                        {/* Imagen cuadrada arriba */}
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 border">
                            {technical.photo ? (
                                <img
                                    src={`/storage/${technical.photo}`}
                                    alt={technical.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    e.currentTarget.src = '/images/default-user.png'; // Ruta de imagen por defecto
                                }}
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <User className="w-16 h-16 text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Contenido debajo de la imagen */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-xl truncate">{technical.name}</h3>
                                <Switch
                                    checked={technical.status}
                                    onCheckedChange={() => toggleStatus(technical)}
                                    disabled={isUpdatingStatus === technical.id}
                                    className="scale-90 data-[state=checked]:bg-green-500"
                                />
                            </div>

                            <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground truncate">{technical.email}</p>
                                <p className="font-medium">{technical.phone}</p>
                                <div className="flex items-center gap-2">
                                    <span className="capitalize text-primary bg-primary/10 px-2 py-1 rounded-md">
                                        {technical.shift}
                                    </span>
                                    {technical.is_default && (
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                                            Tech Chief
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Botones en la parte inferior */}
                            <div className="flex justify-between items-center mt-4">
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleEdit(technical)}
                                        variant="default"
                                        size="sm"
                                        className="gap-2 px-4"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(technical)}
                                        variant="destructive"
                                        size="sm"
                                        className="gap-2 px-4"
                                      
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                {isSuperAdmin && (
                                    <Button
                                        onClick={() => toggleDefaultTechnical(technical)}
                                        variant={technical.is_default ? "default" : "outline"}
                                        size="sm"
                                        className="text-xs"

                                    >
                                        {technical.is_default ? "Remove Chief" : "Set as Chief"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    };

    // Nueva vista de lista con cards detallados
    const ListView = ({ technicals }: { technicals: Technical[] }) => {
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

        const getTimeAgo = (dateString?: string) => {
            if (!dateString) return 'Never';
            const now = new Date();
            const date = new Date(dateString);
            const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
            
            if (diffInHours < 1) return 'Just now';
            if (diffInHours < 24) return `${diffInHours}h ago`;
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) return `${diffInDays}d ago`;
            const diffInWeeks = Math.floor(diffInDays / 7);
            return `${diffInWeeks}w ago`;
        };

        return (
            <TooltipProvider>
                <div className="space-y-6">
                    {technicals.map((technical) => (
                        <div key={technical.id} className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow border overflow-hidden">
                            <div className="flex">
                                {/* Card pequeño izquierdo - Info básica */}
                                <div className="w-80 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-r">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                                {technical.photo ? (
                                                    <img
                                                        src={`/storage/${technical.photo}`}
                                                        alt={technical.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                            e.currentTarget.src = '/images/default-user.png';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                        <User className="w-12 h-12 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            {technical.is_default && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                                                            <Trophy className="w-4 h-4 text-yellow-800" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Technical Chief - Team Leader</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="font-bold text-xl text-gray-900">{technical.name}</h3>
                                            <p className="text-sm text-gray-600">{technical.email}</p>
                                            <p className="font-medium text-gray-700">{technical.phone}</p>
                                            
                                            <div className="flex flex-col gap-2">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                                    technical.shift === 'morning' ? 'bg-orange-100 text-orange-800' :
                                                    technical.shift === 'afternoon' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {technical.shift}
                                                </span>
                                                
                                                {technical.is_default && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        <Trophy className="w-3 h-3 mr-1" />
                                                        Tech Chief
                                                    </span>
                                                )}
                                            </div>

                                            {/* Nuevas métricas adicionales */}
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-white/50 p-2 rounded-lg border text-center">
                                                            <div className="text-lg font-bold text-green-600">{technical.current_streak}</div>
                                                            <div className="text-xs text-gray-600">Streak</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Consecutive resolved tickets</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-white/50 p-2 rounded-lg border text-center">
                                                            <div className="text-lg font-bold text-blue-600">{technical.avg_resolution_time}h</div>
                                                            <div className="text-xs text-gray-600">Avg Time</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Average resolution time in hours</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Switch
                                                        checked={technical.status}
                                                        onCheckedChange={() => toggleStatus(technical)}
                                                        disabled={isUpdatingStatus === technical.id}
                                                        className="data-[state=checked]:bg-green-500"
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{technical.status ? 'Deactivate' : 'Activate'} technical</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                technical.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
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
                                                        className="flex-1"
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
                                                        variant="destructive"
                                                        size="sm"
                                                        className="flex-1"
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
                                                            variant={technical.is_default ? "default" : "outline"}
                                                            size="sm"
                                                            className="flex-1"
                                                        >
                                                            <Trophy className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{technical.is_default ? 'Remove as' : 'Set as'} Tech Chief</p>
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
                                                <Activity className="w-5 h-5 text-blue-600" />
                                                <h4 className="font-semibold text-lg">Performance Metrics</h4>
                                            </div>

                                            {/* Estadísticas principales */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                                                            <div className="text-xl font-bold text-green-600">{technical.today_tickets}</div>
                                                            <div className="text-xs text-green-600">Today</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tickets assigned today</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                                                            <div className="text-xl font-bold text-blue-600">{technical.weekly_tickets}</div>
                                                            <div className="text-xs text-blue-600">This Week</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tickets assigned this week</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                                                            <div className="text-xl font-bold text-purple-600">{technical.monthly_tickets}</div>
                                                            <div className="text-xs text-purple-600">This Month</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tickets assigned this month</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>

                                            {/* Estados de tickets */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                        <span className="text-sm">Open</span>
                                                    </div>
                                                    <span className="font-medium">{technical.open_tickets}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-sm">In Progress</span>
                                                    </div>
                                                    <span className="font-medium">{technical.in_progress_tickets}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm">Resolved</span>
                                                    </div>
                                                    <span className="font-medium">{technical.resolved_tickets}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Target className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm">Closed</span>
                                                    </div>
                                                    <span className="font-medium">{technical.closed_tickets}</span>
                                                </div>
                                            </div>

                                            {/* Progress bar de eficiencia */}
                                            {technical.total_tickets > 0 && (
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span>Success Rate</span>
                                                        <span>{Math.round((technical.resolved_tickets / technical.total_tickets) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${Math.round((technical.resolved_tickets / technical.total_tickets) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Información adicional */}
                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-center">
                                                            <div className="text-sm font-medium text-gray-600">Resolved Today</div>
                                                            <div className="text-lg font-bold text-green-600">{technical.resolved_today}</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tickets resolved today</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-center">
                                                            <div className="text-sm font-medium text-gray-600">Last Activity</div>
                                                            <div className="text-lg font-bold text-blue-600">{getTimeAgo(technical.last_activity)}</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Time since last ticket assignment</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        {/* Dispositivos asignados y tickets recientes */}
                                        <div className="space-y-4">
                                            {/* Dispositivos asignados */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Laptop className="w-5 h-5 text-green-600" />
                                                    <h4 className="font-semibold text-lg">Active Assignments</h4>
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                                        {technical.assigned_devices_count}
                                                    </span>
                                                </div>

                                                <div className="space-y-2 max-h-36 overflow-y-auto">
                                                    {technical.assigned_devices?.length > 0 ? (
                                                        technical.assigned_devices.map((device) => (
                                                            <Tooltip key={device.id}>
                                                                <TooltipTrigger asChild>
                                                                    <div className="bg-gray-50 p-3 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer">
                                                                        <div className="font-medium text-sm">{device.name}</div>
                                                                        <div className="text-xs text-gray-600">
                                                                            {device.brand?.name} • {device.model?.name}
                                                                        </div>
                                                                        {device.system && (
                                                                            <div className="text-xs text-blue-600 mt-1">
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
                                                        <div className="text-sm text-gray-500 italic">No active device assignments</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tickets recientes */}
                                            <div>
                                                <h4 className="font-semibold text-lg mb-3">Recent Tickets</h4>
                                                <div className="space-y-2 max-h-44 overflow-y-auto">
                                                    {technical.tickets?.length > 0 ? (
                                                        technical.tickets.map((ticket) => (
                                                            <Tooltip key={ticket.id}>
                                                                <TooltipTrigger asChild>
                                                                    <div className="bg-gray-50 p-3 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="font-medium text-sm truncate pr-2">{ticket.title}</div>
                                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                                                {ticket.status.replace('_', ' ')}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 mt-1">
                                                                            {formatDate(ticket.created_at)}
                                                                        </div>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Click to view ticket details</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))
                                                    ) : (
                                                        <div className="text-sm text-gray-500 italic">No recent tickets</div>
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
            toast.error('Only super-admin can manage Tech Chiefs');
            return;
        }

        try {
            await router.put(route('technicals.set-default', technical.id), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    const action = technical.is_default ? 'removed from' : 'assigned as';
                    toast.success(`Technical ${action} Tech Chief successfully`);
                },
                onError: () => toast.error('Error updating Tech Chief status')
            });
        } catch {
            toast.error('Connection error');
        }
    };

    const handleEdit = (technical: Technical) => {
        setData({
            ...technical,
            photo: null,
        });
        setSelectedTechnical(technical);
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
                    reset();
                    setOpen(false);
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
                    reset();
                    setOpen(false);
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
            <Head title="Technicals" />
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-1 rounded flex">
                            <Button variant="ghost" onClick={() => setViewMode('list')}
                                className={viewMode === 'list' ? 'bg-white shadow' : ''}>
                                <List className="w-5 h-5" />
                            </Button>
                           {/* <Button variant="ghost" onClick={() => setViewMode('grid')}
                                className={viewMode === 'grid' ? 'bg-white shadow' : ''}>
                                <LayoutGrid className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" onClick={() => setViewMode('table')}
                                className={viewMode === 'table' ? 'bg-white shadow' : ''}>
                                <TableIcon className="w-5 h-5" />
                            </Button> */}
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
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Technical
                    </Button>
                </div>

                {viewMode === 'list' ? (
                    <ListView technicals={technicals.data} />
                ) : viewMode === 'grid' ? (
                    <GridView technicals={technicals.data} gridColumns={gridColumns} />
                ) : (
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
                )}

                {/* Create/Edit Modal */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedTechnical ? 'Edit Technical' : 'New Technical'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitForm} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className=" space-y-2">
                                    <Label>Photo</Label>
                                    <div className="mt-2 group relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed bg-muted/50">
                                        <input
                                            type="file"
                                            onChange={e => setData('photo', e.target.files?.[0] || null)}
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
                                            ) : selectedTechnical?.photo ? (
                                                <img
                                                    src={`/storage/${selectedTechnical.photo}`}
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
                                            onChange={e => setData('name', e.target.value)}
                                            required
                                            className='h-11 mt-2'
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            required
                                            className='h-11 mt-2'
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            required
                                            className='h-11 mt-2'
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Shift</Label>
                                        <Select
                                            value={data.shift}
                                            onValueChange={(value) => setData('shift', value as 'morning' | 'afternoon' | 'night')}
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
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save'}
                                </Button>
                            </DialogFooter>
                        </form>
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