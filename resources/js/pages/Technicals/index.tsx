import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plus, Edit, Trash2, MoreHorizontal, User,
    List, Activity, Clock, CheckCircle, AlertCircle, Laptop, Trophy, Target, AlertTriangle
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
    
    // Helper function to check if technical is default
    const isDefaultTechnical = (technical: Technical): boolean => {
        return Boolean(technical.is_default);
    };
    
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'list'>('list');
    const [open, setOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedTechnical, setSelectedTechnical] = useState<Technical | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [gridColumns, setGridColumns] = useState<number>(4);
    
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
                            variant={isDefaultTechnical(row.original) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleDefaultTechnical(row.original)}
                            className="h-6 px-2 text-xs"
                        >
                            {isDefaultTechnical(row.original) ? "Remove Chief" : "Set as Chief"}
                        </Button>
                    ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                            isDefaultTechnical(row.original) 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            {isDefaultTechnical(row.original) ? "Tech Chief" : "Technical"}
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
                {technicals.map((technical, index) => (
                    <div 
                        key={technical.id} 
                        className="bg-gradient-to-br from-white to-corporate-gold/5 dark:from-dark-brown dark:to-corporate-gold/10 group p-4 rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 border-2 border-corporate-gold/20 hover:border-corporate-gold/40 relative overflow-hidden"
                        style={{
                            animationDelay: `${index * 150}ms`,
                            animation: 'fadeInUp 0.6s ease-out forwards'
                        }}
                    >
                        {/* Decorative corner gradient */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-corporate-gold/20 to-transparent rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Imagen cuadrada arriba */}
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 border-2 border-corporate-gold/30 group-hover:border-corporate-gold/50 transition-all duration-300 relative">
                            {technical.photo ? (
                                <img
                                    src={`/storage/${technical.photo}`}
                                    alt={technical.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    e.currentTarget.src = '/images/default-user.png';
                                }}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-corporate-gold/10 to-corporate-warm/10 flex items-center justify-center">
                                    <User className="w-16 h-16 text-corporate-gold/60" />
                                </div>
                            )}
                            {/* Animated border ring */}
                            <div className="absolute inset-0 rounded-lg border-2 border-corporate-gold/0 group-hover:border-corporate-gold/30 transition-all duration-300 group-hover:scale-105"></div>
                        </div>

                        {/* Contenido debajo de la imagen */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-xl truncate text-corporate-gold dark:text-corporate-gold-light group-hover:text-corporate-warm transition-colors duration-300">{technical.name}</h3>
                                <Switch
                                    checked={technical.status}
                                    onCheckedChange={() => toggleStatus(technical)}
                                    disabled={isUpdatingStatus === technical.id}
                                    className="scale-90 data-[state=checked]:bg-corporate-gold"
                                />
                            </div>

                            <div className="space-y-1 text-sm">
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
                                        <span className="bg-gradient-to-r from-corporate-gold via-corporate-warm to-corporate-gold text-white px-2 py-1 rounded-md text-xs font-medium animate-pulse shadow-lg">
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
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 px-4 border-corporate-gold/30 hover:bg-corporate-gold hover:text-white hover:border-corporate-gold transition-all duration-300 group-hover:scale-105"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(technical)}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 px-4 border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 group-hover:scale-105"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                {isSuperAdmin && (
                                    <Button
                                        onClick={() => toggleDefaultTechnical(technical)}
                                        variant={isDefaultTechnical(technical) ? "default" : "outline"}
                                        size="sm"
                                        className={`text-xs transition-all duration-300 group-hover:scale-105 ${
                                            isDefaultTechnical(technical) 
                                                ? 'bg-gradient-to-r from-corporate-gold to-corporate-warm text-white shadow-lg hover:shadow-xl' 
                                                : 'border-corporate-gold/30 hover:bg-corporate-gold hover:text-white'
                                        }`}
                                    >
                                        {isDefaultTechnical(technical) ? "Remove Chief" : "Set as Chief"}
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
                    {technicals.map((technical, index) => (
                        <div 
                            key={technical.id} 
                            className="bg-gradient-to-r from-white to-corporate-gold/5 dark:from-transparent dark:to-corporate-gold/10 rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 border-2 border-corporate-gold/20 hover:border-corporate-gold/40 overflow-hidden group"
                            style={{
                                animationDelay: `${index * 200}ms`,
                                animation: 'fadeInUp 0.8s ease-out forwards'
                            }}
                        >
                            {/* Animated gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-corporate-gold/0 via-corporate-gold/5 to-corporate-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                            
                            <div className="flex relative z-10">
                                {/* Card pequeño izquierdo - Info básica */}
                                <div className="w-80 bg-gradient-to-br from-corporate-gold/10 to-corporate-warm/10 dark:from-corporate-gold/20 dark:to-corporate-warm/20 p-6 border-r border-corporate-gold/20 relative overflow-hidden">
                                    {/* Decorative elements */}
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-corporate-gold/20 to-transparent rounded-bl-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-corporate-warm/20 to-transparent rounded-tr-3xl"></div>
                                    
                                    <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-corporate-gold/30 shadow-xl relative group-hover:scale-110 transition-transform duration-500">
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
                                                    <div className="w-full h-full bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 flex items-center justify-center">
                                                        <User className="w-12 h-12 text-corporate-gold" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Animated ring */}
                                            <div className="absolute inset-0 rounded-full border-2 border-corporate-gold/0 group-hover:border-corporate-gold/50 transition-all duration-500 group-hover:scale-125"></div>
                                            
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
                                            <h3 className="font-bold text-xl text-corporate-gold dark:text-corporate-gold-light group-hover:text-corporate-warm transition-colors duration-300">{technical.name}</h3>
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
                                                        Tech Chief
                                                    </span>
                                                )}
                                            </div>

                                            {/* Nuevas métricas adicionales con animaciones */}
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-white/70 dark:bg-transparent dark:bg-corporate-gold/10 p-2 rounded-lg border border-corporate-gold/20 text-center hover:bg-white/90 dark:hover:bg-corporate-gold/15 transition-colors duration-300 cursor-pointer">
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
                                                        <div className="bg-white/70 dark:bg-transparent p-2 rounded-lg border border-corporate-gold/20 text-center hover:bg-white/90 dark:hover:bg-corporate-gold/15 transition-colors duration-300 cursor-pointer">
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
                                                        className="flex-1 border-corporate-gold/30 hover:bg-corporate-gold hover:text-primary-foreground hover:border-corporate-gold dark:hover:text-white transition-colors duration-300"
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
                                                        className="flex-1 border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors duration-300"
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
                                                                    ? 'bg-secondary text-primary-foreground border-corporate-gold hover:opacity-90' 
                                                                    : 'border-corporate-gold/30  hover:bg-corporate-gold hover:text-white hover:border-corporate-gold'
                                                            }`}
                                                        >
                                                            <Trophy className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{isDefaultTechnical(technical) ? 'Remove as' : 'Set as'} Tech Chief</p>
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
                                                <Activity className="w-5 h-5 text-corporate-gold" />
                                                <h4 className="font-semibold text-lg text-corporate-gold dark:text-corporate-gold-light">Performance Metrics</h4>
                                            </div>

                                            {/* Estadísticas principales con animación */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg border border-green-200 text-center hover:bg-gradient-to-br hover:from-green-100 hover:to-green-150 transition-colors duration-300 cursor-pointer">
                                                            <div className="text-xl font-bold text-green-600">
                                                                <AnimatedCounter value={technical.today_tickets} />
                                                            </div>
                                                            <div className="text-xs text-green-600">Today</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tickets assigned today</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 p-3 rounded-lg border border-corporate-gold/30 text-center hover:bg-gradient-to-br hover:from-corporate-gold/30 hover:to-corporate-warm/30 transition-colors duration-300 cursor-pointer">
                                                            <div className="text-xl font-bold text-corporate-gold">
                                                                <AnimatedCounter value={technical.weekly_tickets} />
                                                            </div>
                                                            <div className="text-xs text-corporate-gold">This Week</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tickets assigned this week</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg border border-purple-200 text-center hover:bg-gradient-to-br hover:from-purple-100 hover:to-purple-150 transition-colors duration-300 cursor-pointer">
                                                            <div className="text-xl font-bold text-purple-600">
                                                                <AnimatedCounter value={technical.monthly_tickets} />
                                                            </div>
                                                            <div className="text-xs text-purple-600">This Month</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tickets assigned this month</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>

                                            {/* Estados de tickets con barras animadas */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                        <span className="text-sm">Open</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 bg-red-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ 
                                                                    width: `${technical.total_tickets > 0 ? (technical.open_tickets / technical.total_tickets) * 100 : 0}%`,
                                                                    animationDelay: `${index * 200}ms`
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="font-medium text-red-600">
                                                            <AnimatedCounter value={technical.open_tickets} />
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-sm">In Progress</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 bg-yellow-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ 
                                                                    width: `${technical.total_tickets > 0 ? (technical.in_progress_tickets / technical.total_tickets) * 100 : 0}%`,
                                                                    animationDelay: `${index * 200 + 100}ms`
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="font-medium text-yellow-600">
                                                            <AnimatedCounter value={technical.in_progress_tickets} />
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm">Resolved</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 bg-green-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ 
                                                                    width: `${technical.total_tickets > 0 ? (technical.resolved_tickets / technical.total_tickets) * 100 : 0}%`,
                                                                    animationDelay: `${index * 200 + 200}ms`
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="font-medium text-green-600">
                                                            <AnimatedCounter value={technical.resolved_tickets} />
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-2">
                                                        <Target className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm">Closed</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-gray-400 to-gray-600 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ 
                                                                    width: `${technical.total_tickets > 0 ? (technical.closed_tickets / technical.total_tickets) * 100 : 0}%`,
                                                                    animationDelay: `${index * 200 + 300}ms`
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="font-medium text-gray-600">
                                                            <AnimatedCounter value={technical.closed_tickets} />
                                                        </span>
                                                    </div>
                                                </div>
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

                                            {/* Información adicional */}
                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-corporate-gold/20">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-center p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 hover:bg-gradient-to-br hover:from-green-100 hover:to-green-150 transition-colors duration-300 cursor-pointer">
                                                            <div className="text-sm font-medium text-green-600">Resolved Today</div>
                                                            <div className="text-lg font-bold text-green-600">
                                                                <AnimatedCounter value={technical.resolved_today} />
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tickets resolved today</p>
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-center p-2 rounded-lg bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 border border-corporate-gold/30 hover:bg-gradient-to-br hover:from-corporate-gold/30 hover:to-corporate-warm/30 transition-colors duration-300 cursor-pointer">
                                                            <div className="text-sm font-medium text-corporate-gold">Last Activity</div>
                                                            <div className="text-lg font-bold text-corporate-gold">{getTimeAgo(technical.last_activity)}</div>
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

                                            {/* Tickets recientes */}
                                            <div>
                                                <h4 className="font-semibold text-lg mb-3 text-corporate-gold dark:text-corporate-gold-light">Recent Tickets</h4>
                                                <div className="space-y-2 max-h-44 overflow-y-auto overflow-x-hidden">
                                                    {technical.tickets?.length > 0 ? (
                                                        technical.tickets.map((ticket, ticketIndex) => (
                                                            <Tooltip key={ticket.id}>
                                                                <TooltipTrigger asChild>
                                                                    <div 
                                                                        className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg border border-corporate-gold/20 hover:bg-gradient-to-r hover:from-corporate-gold/10 hover:to-corporate-warm/10 hover:border-corporate-gold/40 transition-colors duration-300 cursor-pointer"
                                                                        style={{
                                                                            animationDelay: `${index * 100 + ticketIndex * 50}ms`,
                                                                            animation: 'fadeInUp 0.6s ease-out forwards'
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="font-medium text-sm truncate pr-2 text-corporate-gold">{ticket.title}</div>
                                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 flex-shrink-0 ${getStatusColor(ticket.status)}`}>
                                                                                {ticket.status.replace('_', ' ')}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-1 truncate">
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
                                                        <div className="text-sm text-muted-foreground italic p-3 text-center bg-corporate-gold/5 rounded-lg border border-corporate-gold/20">
                                                            No recent tickets
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
            toast.error('Only super-admin can manage Tech Chiefs');
            return;
        }

        try {
            await router.put(route('technicals.set-default', technical.id), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    const action = isDefaultTechnical(technical) ? 'removed from' : 'assigned as';
                    toast.success(`Technical ${action} Tech Chief successfully`);
                },
                onError: () => toast.error('Error updating Tech Chief status')
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
            <Head title="Technicals" />
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 dark:bg-transparent p-1 rounded flex">
                            <Button  onClick={() => setViewMode('list')}
                                className={viewMode === 'list' ? 'bg-white shadow dark:bg-card' : ''}>
                                <List className="w-5 h-5 text-primary" />
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
                    <Button onClick={() => {
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
                    }}>
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