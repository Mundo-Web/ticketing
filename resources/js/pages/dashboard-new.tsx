import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
    Building,
    Users,
    Ticket,
    Wrench,
    Smartphone,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Home,
    Activity,
    BarChart3,
    Calendar,
    MapPin,
    Timer,
    Download,
    ExternalLink,
    RefreshCcw,
    FileSpreadsheet,
    BarChart,
    Settings,
    Bell,
    ArrowUpRight,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Cell,
    Pie,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    Area,
    AreaChart
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

interface DashboardProps extends PageProps {
    metrics: {
        tickets: {
            total: number;
            open: number;
            in_progress: number;
            resolved: number;
            resolved_today: number;
            avg_resolution_hours: number;
        };
        resources: {
            buildings: number;
            apartments: number;
            tenants: number;
            devices: number;
            technicals: number;
        };
    };
    charts: {
        ticketsByStatus: Record<string, number>;
        ticketsLastWeek: Array<{ date: string; count: number }>;
        devicesByType: Array<{ name: string; count: number }>;
        ticketsByPriority: Record<string, number>;
        ticketsByCategory: Record<string, number>;
    };
    lists: {
        topTechnicals: Array<{ name: string; photo?: string; tickets_count: number }>;
        buildingsWithTickets: Array<{ name: string; image?: string; tickets_count: number }>;
        recentTickets: Array<{
            id: number;
            title: string;
            status: string;
            priority?: string;
            category?: string;
            created_at: string;
            user?: { name: string };
            device?: { 
                apartment?: { 
                    name: string; 
                    building?: { name: string } 
                } 
            };
            technical?: { name: string };
        }>;
        problematicDevices: Array<{
            device_type: string;
            device_name: string;
            tickets_count: number;
        }>;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Colores para gráficos
const CHART_COLORS = [
    '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', 
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
];

// Funciones de exportación a Excel
const exportToExcel = (data: Record<string, unknown>[], filename: string, sheetName: string = 'Datos') => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(fileData, `${filename}.xlsx`);
};

export default function Dashboard() {
    const { metrics, charts, lists } = usePage<DashboardProps>().props;
    const pageProps = usePage().props as unknown as { auth: { user: { roles: { name: string }[] } } };
    const isSuperAdmin = pageProps?.auth?.user?.roles?.some((role) => role.name === 'super-admin') || false;

    // Funciones de manejo de clicks
    const handleTicketStatusClick = (status: string, count: number) => {
        console.log(`Clicked on ${status}: ${count} tickets`);
        window.open(`/tickets?status=${status}`, '_blank');
    };

    const handleDeviceClick = (data: Record<string, string | number>) => {
        console.log(`Clicked on device: ${data.name}`);
        window.open(`/devices?type=${data.name}`, '_blank');
    };

    const handleTechnicalClick = (name: string) => {
        console.log(`Clicked on technical: ${name}`);
        window.open(`/technicals?search=${name}`, '_blank');
    };

    const handleTicketClick = (ticketId: number) => {
        console.log(`Clicked on ticket: ${ticketId}`);
        window.open(`/tickets/${ticketId}`, '_blank');
    };

    // Preparar datos para gráficos de tendencia
    const trendData = charts.ticketsLastWeek.map(item => ({
        date: format(new Date(item.date), 'dd/MM'),
        tickets: item.count,
        promedio: Math.round(charts.ticketsLastWeek.reduce((sum, d) => sum + d.count, 0) / charts.ticketsLastWeek.length)
    }));

    return (
        <TooltipProvider>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard Profesional" />
                
                {/* Contenedor principal con espaciado premium */}
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
                    <div className="container mx-auto px-8 py-16 space-y-20">
                        
                        {/* Header Premium con máximo espaciado */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                            <div className="space-y-8">
                                <div className="flex items-center gap-8">
                                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl ring-4 ring-blue-100">
                                        <BarChart3 className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="space-y-4">
                                        <h1 className="text-6xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-slate-700 bg-clip-text text-transparent">
                                            Dashboard
                                        </h1>
                                        <p className="text-2xl text-slate-600 font-medium">
                                            {isSuperAdmin 
                                                ? "Centro de control administrativo del sistema"
                                                : "Tu panel personalizado de gestión"
                                            }
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Indicadores de estado en tiempo real */}
                                <div className="flex items-center gap-12">
                                    <div className="flex items-center gap-4">
                                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                                        <span className="text-lg font-bold text-slate-600">Sistema En Línea</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Activity className="h-6 w-6 text-blue-500" />
                                        <span className="text-lg font-bold text-slate-600">Actualizado hace 2 min</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Zap className="h-6 w-6 text-yellow-500" />
                                        <span className="text-lg font-bold text-slate-600">Alto Rendimiento</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Controles principales */}
                            <div className="flex flex-wrap items-center gap-6">
                                <Button variant="outline" size="lg" className="gap-4 h-14 px-8 shadow-xl text-lg">
                                    <RefreshCcw className="h-6 w-6" />
                                    Actualizar
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="lg"
                                    onClick={() => {
                                        const allMetrics = {
                                            'Tickets Totales': metrics.tickets.total,
                                            'Tickets Abiertos': metrics.tickets.open,
                                            'Tickets En Progreso': metrics.tickets.in_progress,
                                            'Tickets Resueltos': metrics.tickets.resolved,
                                            'Resueltos Hoy': metrics.tickets.resolved_today,
                                            'Tiempo Promedio (horas)': metrics.tickets.avg_resolution_hours,
                                            'Edificios': metrics.resources.buildings,
                                            'Apartamentos': metrics.resources.apartments,
                                            'Inquilinos': metrics.resources.tenants,
                                            'Dispositivos': metrics.resources.devices,
                                            'Técnicos': metrics.resources.technicals
                                        };
                                        exportToExcel([allMetrics], 'dashboard_completo', 'Métricas Generales');
                                    }}
                                    className="gap-4 h-14 px-8 shadow-xl text-lg"
                                >
                                    <Download className="h-6 w-6" />
                                    Exportar Todo
                                </Button>
                                <Button variant="outline" size="lg" className="gap-4 h-14 px-8 shadow-xl relative text-lg">
                                    <Bell className="h-6 w-6" />
                                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-7 w-7 p-0 text-sm font-bold shadow-lg">
                                        3
                                    </Badge>
                                    Alertas
                                </Button>
                            </div>
                        </div>
                        
                        {/* SECCIÓN 1: MÉTRICAS PRINCIPALES DE TICKETS */}
                        <div className="space-y-16">
                            <div className="text-center space-y-6">
                                <h2 className="text-5xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-slate-600 bg-clip-text text-transparent">
                                    Estado de Tickets
                                </h2>
                                <p className="text-2xl text-slate-600 max-w-3xl mx-auto">
                                    Monitoreo en tiempo real del flujo de trabajo y métricas de rendimiento
                                </p>
                            </div>
                            
                            {/* Grid principal de métricas con espaciado extremo */}
                            <div className="grid gap-16 lg:grid-cols-2 2xl:grid-cols-4">
                                {/* Métrica destacada - Total Tickets */}
                                <Card className="lg:col-span-2 2xl:col-span-1 group transition-all duration-700 hover:shadow-2xl hover:-translate-y-4 border-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                                    <CardContent className="p-16 relative">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    <p className="text-2xl font-black text-blue-600 tracking-wider">TOTAL TICKETS</p>
                                                    <div className="flex items-center gap-6">
                                                        <p className="text-8xl font-black bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                                            {metrics.tickets.total}
                                                        </p>
                                                        <div className="px-6 py-3 rounded-3xl bg-blue-100 text-blue-700 font-black text-lg shadow-xl">
                                                            +12% este mes
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 font-bold text-2xl">
                                                    Gestión completa del sistema
                                                </p>
                                            </div>
                                            <div className="p-12 rounded-4xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-700">
                                                <Ticket className="h-16 w-16 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Tickets Críticos */}
                                <Card 
                                    className="group transition-all duration-700 hover:shadow-2xl hover:-translate-y-4 border-0 bg-gradient-to-br from-red-50 via-white to-red-50 overflow-hidden relative cursor-pointer"
                                    onClick={() => window.open('/tickets?status=open', '_blank')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5"></div>
                                    <CardContent className="p-12 relative">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <p className="text-xl font-black text-red-600 tracking-wider">CRÍTICOS</p>
                                                    <ExternalLink className="h-6 w-6 text-red-400" />
                                                </div>
                                                <div className="space-y-3">
                                                    <p className="text-6xl font-black bg-gradient-to-br from-red-600 to-red-800 bg-clip-text text-transparent">
                                                        {metrics.tickets.open}
                                                    </p>
                                                    <div className="px-4 py-2 rounded-2xl bg-red-100 text-red-700 font-black text-sm w-fit">
                                                        -5% vs ayer
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 font-bold text-lg">Atención inmediata</p>
                                            </div>
                                            <div className="p-8 rounded-3xl bg-gradient-to-br from-red-500 to-red-600 shadow-xl group-hover:shadow-red-500/25 transition-all duration-700">
                                                <AlertCircle className="h-10 w-10 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* En Progreso */}
                                <Card 
                                    className="group transition-all duration-700 hover:shadow-2xl hover:-translate-y-4 border-0 bg-gradient-to-br from-amber-50 via-white to-yellow-50 overflow-hidden relative cursor-pointer"
                                    onClick={() => window.open('/tickets?status=in_progress', '_blank')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5"></div>
                                    <CardContent className="p-12 relative">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <p className="text-xl font-black text-amber-600 tracking-wider">EN PROGRESO</p>
                                                    <ExternalLink className="h-6 w-6 text-amber-400" />
                                                </div>
                                                <div className="space-y-3">
                                                    <p className="text-6xl font-black bg-gradient-to-br from-amber-600 to-yellow-700 bg-clip-text text-transparent">
                                                        {metrics.tickets.in_progress}
                                                    </p>
                                                    <div className="px-4 py-2 rounded-2xl bg-amber-100 text-amber-700 font-black text-sm w-fit">
                                                        +8% esta semana
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 font-bold text-lg">Siendo atendidos</p>
                                            </div>
                                            <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-xl group-hover:shadow-amber-500/25 transition-all duration-700">
                                                <Clock className="h-10 w-10 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Resueltos */}
                                <Card 
                                    className="group transition-all duration-700 hover:shadow-2xl hover:-translate-y-4 border-0 bg-gradient-to-br from-emerald-50 via-white to-green-50 overflow-hidden relative cursor-pointer"
                                    onClick={() => window.open('/tickets?status=resolved', '_blank')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
                                    <CardContent className="p-12 relative">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <p className="text-xl font-black text-emerald-600 tracking-wider">RESUELTOS</p>
                                                    <ExternalLink className="h-6 w-6 text-emerald-400" />
                                                </div>
                                                <div className="space-y-3">
                                                    <p className="text-6xl font-black bg-gradient-to-br from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                                        {metrics.tickets.resolved}
                                                    </p>
                                                    <div className="px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-sm w-fit">
                                                        +15% vs objetivo
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 font-bold text-lg">Completados</p>
                                            </div>
                                            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl group-hover:shadow-emerald-500/25 transition-all duration-700">
                                                <CheckCircle className="h-10 w-10 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Métricas de rendimiento con separación mayor */}
                            <div className="grid gap-16 lg:grid-cols-3 mt-24">
                                <Card className="group transition-all duration-700 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-purple-50 via-white to-violet-50">
                                    <CardContent className="p-12">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-6">
                                                <p className="text-xl font-black text-purple-600 tracking-wider">RESUELTOS HOY</p>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-5xl font-black text-purple-700">
                                                            {metrics.tickets.resolved_today}
                                                        </p>
                                                        <TrendingUp className="h-8 w-8 text-emerald-500" />
                                                    </div>
                                                    <p className="text-slate-600 font-bold text-lg">Productividad diaria</p>
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-3xl bg-purple-100 text-purple-600">
                                                <Calendar className="h-9 w-9" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="group transition-all duration-700 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
                                    <CardContent className="p-12">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-6">
                                                <p className="text-xl font-black text-indigo-600 tracking-wider">TIEMPO PROMEDIO</p>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-5xl font-black text-indigo-700">
                                                            {metrics.tickets.avg_resolution_hours}h
                                                        </p>
                                                        <div className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs">
                                                            -2h mejor
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 font-bold text-lg">De resolución</p>
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-3xl bg-indigo-100 text-indigo-600">
                                                <Timer className="h-9 w-9" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="group transition-all duration-700 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
                                    <CardContent className="p-12">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-6">
                                                <p className="text-xl font-black text-teal-600 tracking-wider">EFICIENCIA</p>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-5xl font-black text-teal-700">
                                                            {metrics.tickets.total > 0 
                                                                ? Math.round((metrics.tickets.resolved / metrics.tickets.total) * 100)
                                                                : 0}%
                                                        </p>
                                                        <TrendingUp className="h-8 w-8 text-emerald-500" />
                                                    </div>
                                                    <p className="text-slate-600 font-bold text-lg">Tasa de resolución</p>
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-3xl bg-teal-100 text-teal-600">
                                                <BarChart3 className="h-9 w-9" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                        
                        {/* SECCIÓN 2: RECURSOS DEL SISTEMA */}
                        {metrics.resources.buildings > 0 && (
                            <div className="space-y-16">
                                <div className="text-center space-y-6">
                                    <h2 className="text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-700 to-slate-600 bg-clip-text text-transparent">
                                        Recursos del Sistema
                                    </h2>
                                    <p className="text-2xl text-slate-600 max-w-3xl mx-auto">
                                        Gestión integral de edificios, apartamentos, usuarios y dispositivos
                                    </p>
                                    <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200 px-8 py-3 text-xl font-black">
                                        Vista Completa - Admin
                                    </Badge>
                                </div>
                                
                                <div className="grid gap-16 lg:grid-cols-3 2xl:grid-cols-5">
                                    {/* Edificios */}
                                    <Card className="group transition-all duration-700 hover:shadow-2xl hover:-translate-y-6 border-0 bg-gradient-to-br from-violet-50 via-white to-purple-50 overflow-hidden relative cursor-pointer"
                                          onClick={() => window.open('/buildings', '_blank')}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5"></div>
                                        <CardContent className="p-16 relative">
                                            <div className="flex flex-col items-center text-center space-y-12">
                                                <div className="p-12 rounded-4xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl group-hover:shadow-violet-500/25 transition-all duration-700 group-hover:scale-110">
                                                    <Building className="h-16 w-16 text-white" />
                                                </div>
                                                <div className="space-y-6">
                                                    <p className="text-xl font-black text-violet-600 tracking-wider">EDIFICIOS</p>
                                                    <p className="text-7xl font-black bg-gradient-to-br from-violet-600 to-purple-700 bg-clip-text text-transparent">
                                                        {metrics.resources.buildings}
                                                    </p>
                                                    <div className="flex items-center justify-center gap-3 text-slate-600">
                                                        <ExternalLink className="h-6 w-6 text-violet-400" />
                                                        <span className="font-black text-lg">Ver gestión</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Apartamentos */}
                                    <Card className="group transition-all duration-700 hover:shadow-2xl hover:-translate-y-6 border-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden relative cursor-pointer"
                                          onClick={() => window.open('/apartments', '_blank')}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
                                        <CardContent className="p-16 relative">
                                            <div className="flex flex-col items-center text-center space-y-12">
                                                <div className="p-12 rounded-4xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-700 group-hover:scale-110">
                                                    <Home className="h-16 w-16 text-white" />
                                                </div>
                                                <div className="space-y-6">
                                                    <p className="text-xl font-black text-blue-600 tracking-wider">APARTAMENTOS</p>
                                                    <p className="text-7xl font-black bg-gradient-to-br from-blue-600 to-cyan-700 bg-clip-text text-transparent">
                                                        {metrics.resources.apartments}
                                                    </p>
                                                    <div className="flex items-center justify-center gap-3 text-slate-600">
                                                        <ExternalLink className="h-6 w-6 text-blue-400" />
                                                        <span className="font-black text-lg">Ver gestión</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Inquilinos */}
                                    <Card className="group transition-all duration-700 hover:shadow-2xl hover:-translate-y-6 border-0 bg-gradient-to-br from-emerald-50 via-white to-green-50 overflow-hidden relative cursor-pointer"
                                          onClick={() => window.open('/tenants', '_blank')}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
                                        <CardContent className="p-16 relative">
                                            <div className="flex flex-col items-center text-center space-y-12">
                                                <div className="p-12 rounded-4xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-2xl group-hover:shadow-emerald-500/25 transition-all duration-700 group-hover:scale-110">
                                                    <Users className="h-16 w-16 text-white" />
                                                </div>
                                                <div className="space-y-6">
                                                    <p className="text-xl font-black text-emerald-600 tracking-wider">INQUILINOS</p>
                                                    <p className="text-7xl font-black bg-gradient-to-br from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                                        {metrics.resources.tenants}
                                                    </p>
                                                    <div className="flex items-center justify-center gap-3 text-slate-600">
                                                        <ExternalLink className="h-6 w-6 text-emerald-400" />
                                                        <span className="font-black text-lg">Ver gestión</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Dispositivos */}
                                    <Card className="group transition-all duration-700 hover:shadow-2xl hover:-translate-y-6 border-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 overflow-hidden relative cursor-pointer"
                                          onClick={() => window.open('/devices', '_blank')}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5"></div>
                                        <CardContent className="p-16 relative">
                                            <div className="flex flex-col items-center text-center space-y-12">
                                                <div className="p-12 rounded-4xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl group-hover:shadow-amber-500/25 transition-all duration-700 group-hover:scale-110">
                                                    <Smartphone className="h-16 w-16 text-white" />
                                                </div>
                                                <div className="space-y-6">
                                                    <p className="text-xl font-black text-amber-600 tracking-wider">DISPOSITIVOS</p>
                                                    <p className="text-7xl font-black bg-gradient-to-br from-amber-600 to-orange-700 bg-clip-text text-transparent">
                                                        {metrics.resources.devices}
                                                    </p>
                                                    <div className="flex items-center justify-center gap-3 text-slate-600">
                                                        <ExternalLink className="h-6 w-6 text-amber-400" />
                                                        <span className="font-black text-lg">Ver gestión</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Técnicos */}
                                    <Card className="group transition-all duration-700 hover:shadow-2xl hover:-translate-y-6 border-0 bg-gradient-to-br from-rose-50 via-white to-red-50 overflow-hidden relative cursor-pointer"
                                          onClick={() => window.open('/technicals', '_blank')}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-red-500/5"></div>
                                        <CardContent className="p-16 relative">
                                            <div className="flex flex-col items-center text-center space-y-12">
                                                <div className="p-12 rounded-4xl bg-gradient-to-br from-rose-500 to-red-600 shadow-2xl group-hover:shadow-rose-500/25 transition-all duration-700 group-hover:scale-110">
                                                    <Wrench className="h-16 w-16 text-white" />
                                                </div>
                                                <div className="space-y-6">
                                                    <p className="text-xl font-black text-rose-600 tracking-wider">TÉCNICOS</p>
                                                    <p className="text-7xl font-black bg-gradient-to-br from-rose-600 to-red-700 bg-clip-text text-transparent">
                                                        {metrics.resources.technicals}
                                                    </p>
                                                    <div className="flex items-center justify-center gap-3 text-slate-600">
                                                        <ExternalLink className="h-6 w-6 text-rose-400" />
                                                        <span className="font-black text-lg">Ver gestión</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                        
                        {/* SECCIÓN 3: ANÁLISIS VISUAL Y GRÁFICAS */}
                        <div className="space-y-16">
                            <div className="text-center space-y-6">
                                <h2 className="text-5xl font-black bg-gradient-to-r from-slate-800 via-indigo-700 to-slate-600 bg-clip-text text-transparent">
                                    Análisis Visual
                                </h2>
                                <p className="text-2xl text-slate-600 max-w-3xl mx-auto">
                                    Gráficas interactivas y tendencias para monitorear el rendimiento del sistema
                                </p>
                                <div className="flex justify-center gap-6">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => window.open('/reports', '_blank')}
                                        className="gap-4 h-14 px-8 shadow-xl border-blue-200 hover:bg-blue-50 text-blue-700 text-lg"
                                    >
                                        <BarChart className="h-6 w-6" />
                                        Ver Reportes Completos
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => {
                                            const allMetrics = [
                                                {
                                                    'Métrica': 'Tickets Totales',
                                                    'Valor': metrics.tickets.total,
                                                    'Estado': 'Activo'
                                                },
                                                {
                                                    'Métrica': 'Tickets Abiertos',
                                                    'Valor': metrics.tickets.open,
                                                    'Estado': 'Crítico'
                                                },
                                                {
                                                    'Métrica': 'Tickets En Progreso',
                                                    'Valor': metrics.tickets.in_progress,
                                                    'Estado': 'En Proceso'
                                                },
                                                {
                                                    'Métrica': 'Tickets Resueltos',
                                                    'Valor': metrics.tickets.resolved,
                                                    'Estado': 'Completado'
                                                }
                                            ];
                                            exportToExcel(allMetrics, 'dashboard_analisis_completo', 'Análisis Dashboard');
                                        }}
                                        className="gap-4 h-14 px-8 shadow-xl border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-lg"
                                    >
                                        <Download className="h-6 w-6" />
                                        Exportar Análisis
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-20 lg:grid-cols-12">
                                {/* Gráfico Principal - Distribución de Tickets */}
                                <div className="lg:col-span-6">
                                    <Card className="h-full border-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 shadow-2xl overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
                                        <CardHeader className="pb-12 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-4">
                                                    <CardTitle className="text-3xl font-black text-slate-900">Distribución de Tickets</CardTitle>
                                                    <p className="text-xl text-slate-600">Estado actual del sistema</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        onClick={() => {
                                                            const chartData = Object.entries(charts.ticketsByStatus).map(([key, value]) => ({
                                                                'Estado': key.replace('_', ' ').toUpperCase(),
                                                                'Cantidad': value,
                                                                'Porcentaje': `${Math.round((value / Object.values(charts.ticketsByStatus).reduce((sum, val) => sum + val, 0)) * 100)}%`
                                                            }));
                                                            exportToExcel(chartData, 'tickets_por_estado', 'Distribución Tickets');
                                                        }}
                                                        className="h-14 w-14 p-0 hover:bg-blue-50 shadow-xl"
                                                    >
                                                        <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        onClick={() => window.open('/tickets', '_blank')}
                                                        className="h-14 w-14 p-0 hover:bg-blue-50 shadow-xl"
                                                    >
                                                        <ExternalLink className="h-6 w-6 text-blue-600" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0 pb-16 relative">
                                            <div className="h-[500px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={Object.entries(charts.ticketsByStatus).map(([key, value], index) => ({
                                                                name: key.replace('_', ' ').toUpperCase(),
                                                                value,
                                                                color: CHART_COLORS[index % CHART_COLORS.length]
                                                            }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={160}
                                                            innerRadius={80}
                                                            paddingAngle={8}
                                                            dataKey="value"
                                                            onClick={(data) => handleTicketStatusClick(data.name.toLowerCase().replace(' ', '_'), data.value)}
                                                            className="cursor-pointer drop-shadow-2xl"
                                                        >
                                                            {Object.entries(charts.ticketsByStatus).map((entry, index) => (
                                                                <Cell 
                                                                    key={`cell-${index}`} 
                                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                                    stroke="#fff"
                                                                    strokeWidth={6}
                                                                    className="hover:opacity-80 transition-all duration-500"
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip 
                                                            formatter={(value: number) => [
                                                                `${value} tickets (${Math.round((value / Object.values(charts.ticketsByStatus).reduce((sum, val) => sum + val, 0)) * 100)}%)`,
                                                                'Cantidad'
                                                            ]}
                                                            labelStyle={{ color: '#374151', fontWeight: 'bold', fontSize: '18px' }}
                                                            contentStyle={{ 
                                                                backgroundColor: '#fff',
                                                                border: 'none',
                                                                borderRadius: '20px',
                                                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                                                                padding: '20px 24px'
                                                            }}
                                                        />
                                                        <Legend 
                                                            verticalAlign="bottom" 
                                                            height={80}
                                                            formatter={(value) => (
                                                                <span className="text-lg font-black text-slate-700">
                                                                    {value}
                                                                </span>
                                                            )}
                                                        />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Gráfico de Tendencias */}
                                <div className="lg:col-span-6">
                                    <Card className="h-full border-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-2xl overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
                                        <CardHeader className="pb-12 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-4">
                                                    <CardTitle className="text-3xl font-black text-slate-900">Tendencia Semanal</CardTitle>
                                                    <p className="text-xl text-slate-600">Evolución de tickets en los últimos 7 días</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        onClick={() => {
                                                            exportToExcel(trendData, 'tendencia_tickets_semanal', 'Tendencia Semanal');
                                                        }}
                                                        className="h-14 w-14 p-0 hover:bg-indigo-50 shadow-xl"
                                                    >
                                                        <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        onClick={() => window.open('/reports/trends', '_blank')}
                                                        className="h-14 w-14 p-0 hover:bg-indigo-50 shadow-xl"
                                                    >
                                                        <BarChart className="h-6 w-6 text-indigo-600" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0 pb-16 relative">
                                            <div className="h-[500px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                        <defs>
                                                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6}/>
                                                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeWidth={2} />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            tick={{ fontSize: 16, fill: '#475569', fontWeight: 'bold' }}
                                                            tickLine={{ stroke: '#cbd5e1' }}
                                                            axisLine={{ stroke: '#cbd5e1' }}
                                                        />
                                                        <YAxis 
                                                            tick={{ fontSize: 16, fill: '#475569', fontWeight: 'bold' }}
                                                            tickLine={{ stroke: '#cbd5e1' }}
                                                            axisLine={{ stroke: '#cbd5e1' }}
                                                        />
                                                        <RechartsTooltip 
                                                            contentStyle={{ 
                                                                backgroundColor: '#fff',
                                                                border: 'none',
                                                                borderRadius: '20px',
                                                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                                                                padding: '20px 24px'
                                                            }}
                                                            labelFormatter={(value) => `Fecha: ${value}`}
                                                            formatter={(value: number, name: string) => [
                                                                `${value} tickets`,
                                                                name === 'tickets' ? 'Total diario' : 'Promedio'
                                                            ]}
                                                        />
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey="tickets" 
                                                            stroke="#6366F1" 
                                                            strokeWidth={5}
                                                            fill="url(#colorGradient)"
                                                            dot={{ fill: '#6366F1', strokeWidth: 4, r: 8 }}
                                                            activeDot={{ r: 10, stroke: '#6366F1', strokeWidth: 4, fill: '#fff' }}
                                                        />
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey="promedio" 
                                                            stroke="#94A3B8" 
                                                            strokeWidth={4}
                                                            strokeDasharray="10 10"
                                                            fill="none"
                                                            dot={false}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                        
                        {/* FOOTER PREMIUM */}
                        <div className="mt-32">
                            <Card className="border-0 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
                                <CardContent className="p-16 relative">
                                    <div className="grid gap-16 lg:grid-cols-4">
                                        <div className="text-center space-y-4">
                                            <div className="p-6 rounded-3xl bg-blue-500/20 w-fit mx-auto">
                                                <Activity className="h-10 w-10 text-blue-300" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black text-white">
                                                    {metrics.tickets.total + metrics.tickets.resolved_today}
                                                </p>
                                                <p className="text-blue-200 font-bold text-lg">Total Procesados</p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-center space-y-4">
                                            <div className="p-6 rounded-3xl bg-green-500/20 w-fit mx-auto">
                                                <TrendingUp className="h-10 w-10 text-green-300" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black text-white">98.5%</p>
                                                <p className="text-green-200 font-bold text-lg">Tiempo de Actividad</p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-center space-y-4">
                                            <div className="p-6 rounded-3xl bg-purple-500/20 w-fit mx-auto">
                                                <Users className="h-10 w-10 text-purple-300" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black text-white">
                                                    {metrics.resources.tenants + metrics.resources.technicals}
                                                </p>
                                                <p className="text-purple-200 font-bold text-lg">Usuarios Activos</p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-center space-y-4">
                                            <div className="p-6 rounded-3xl bg-yellow-500/20 w-fit mx-auto">
                                                <Zap className="h-10 w-10 text-yellow-300" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black text-white">
                                                    {Math.round(metrics.tickets.avg_resolution_hours * 0.8)}h
                                                </p>
                                                <p className="text-yellow-200 font-bold text-lg">Tiempo Respuesta</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                    </div>
                </div>
            </AppLayout>
        </TooltipProvider>
    );
}
