import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
    Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Componente para métricas principales
const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "blue",
    subtitle 
}: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color?: "blue" | "green" | "yellow" | "red" | "purple";
    subtitle?: string;
}) => {
    const colorClasses = {
        blue: "text-blue-600 bg-blue-100",
        green: "text-green-600 bg-green-100",
        yellow: "text-yellow-600 bg-yellow-100",
        red: "text-red-600 bg-red-100",
        purple: "text-purple-600 bg-purple-100"
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    <div className={cn("p-3 rounded-full", colorClasses[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Componente para gráfico de dona simple
const DonutChart = ({ data, title }: { data: Record<string, number>; title: string }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    
    const statusColors: Record<string, string> = {
        open: "bg-red-500",
        in_progress: "bg-yellow-500",
        resolved: "bg-green-500",
        closed: "bg-gray-500"
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Object.entries(data).map(([status, count]) => {
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-full", statusColors[status] || "bg-gray-500")} />
                                    <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-medium">{count}</span>
                                    <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

// Componente para lista de técnicos top
const TopTechnicals = ({ technicals }: { technicals: Array<{ name: string; photo?: string; tickets_count: number }> }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Técnicos Más Activos
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {technicals.map((technical, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                {technical.photo ? (
                                    <AvatarImage src={`/storage/${technical.photo}`} alt={technical.name} />
                                ) : (
                                    <AvatarFallback>{technical.name.charAt(0)}</AvatarFallback>
                                )}
                            </Avatar>
                            <span className="text-sm font-medium">{technical.name}</span>
                        </div>
                        <Badge variant="secondary">{technical.tickets_count} tickets</Badge>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

// Componente para tickets recientes
const RecentTickets = ({ tickets }: { tickets: DashboardProps['lists']['recentTickets'] }) => {
    const statusColors: Record<string, string> = {
        open: "bg-red-100 text-red-800",
        in_progress: "bg-yellow-100 text-yellow-800",
        resolved: "bg-green-100 text-green-800",
        closed: "bg-gray-100 text-gray-800"
    };

    const priorityColors: Record<string, string> = {
        low: "bg-blue-100 text-blue-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-red-100 text-red-800",
        urgent: "bg-purple-100 text-purple-800"
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Tickets Recientes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-b-0">
                            <div className="flex-1">
                                <p className="text-sm font-medium line-clamp-1">{ticket.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={cn("text-xs", statusColors[ticket.status])}>
                                        {ticket.status.replace('_', ' ')}
                                    </Badge>
                                    {ticket.priority && (
                                        <Badge variant="outline" className={cn("text-xs", priorityColors[ticket.priority])}>
                                            {ticket.priority}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {ticket.device?.apartment?.building?.name} - {ticket.device?.apartment?.name}
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default function Dashboard() {
    const { metrics, charts, lists } = usePage<DashboardProps>().props;
    const { auth } = usePage().props as any;
    const isSuperAdmin = auth?.user?.roles?.some((role: any) => role.name === 'super-admin') || false;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        {isSuperAdmin 
                            ? "Panel de administración completo del sistema de tickets"
                            : "Vista personalizada de tus tickets y actividades"
                        }
                    </p>
                </div>

                {/* Métricas de Tickets */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <MetricCard
                        title="Total Tickets"
                        value={metrics.tickets.total}
                        icon={Ticket}
                        color="blue"
                        subtitle="Todos los tickets"
                    />
                    <MetricCard
                        title="Tickets Abiertos"
                        value={metrics.tickets.open}
                        icon={AlertCircle}
                        color="red"
                        subtitle="Requieren atención"
                    />
                    <MetricCard
                        title="En Progreso"
                        value={metrics.tickets.in_progress}
                        icon={Clock}
                        color="yellow"
                        subtitle="Siendo atendidos"
                    />
                    <MetricCard
                        title="Resueltos"
                        value={metrics.tickets.resolved}
                        icon={CheckCircle}
                        color="green"
                        subtitle="Completados"
                    />
                    <MetricCard
                        title="Resueltos Hoy"
                        value={metrics.tickets.resolved_today}
                        icon={TrendingUp}
                        color="green"
                        subtitle="Hoy"
                    />
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tiempo Promedio</p>
                                    <p className="text-2xl font-bold">{metrics.tickets.avg_resolution_hours}h</p>
                                    <p className="text-xs text-muted-foreground mt-1">De resolución</p>
                                </div>
                                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                                    <Timer className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Métricas de Recursos - Solo Super Admin */}
                {metrics.resources.buildings > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <MetricCard
                            title="Edificios"
                            value={metrics.resources.buildings}
                            icon={Building}
                            color="purple"
                        />
                        <MetricCard
                            title="Apartamentos"
                            value={metrics.resources.apartments}
                            icon={Home}
                            color="blue"
                        />
                        <MetricCard
                            title="Inquilinos"
                            value={metrics.resources.tenants}
                            icon={Users}
                            color="green"
                        />
                        <MetricCard
                            title="Dispositivos"
                            value={metrics.resources.devices}
                            icon={Smartphone}
                            color="yellow"
                        />
                        <MetricCard
                            title="Técnicos"
                            value={metrics.resources.technicals}
                            icon={Wrench}
                            color="red"
                        />
                    </div>
                )}

                {/* Gráficos y Listas */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Gráfico de tickets por estado */}
                    <DonutChart 
                        data={charts.ticketsByStatus} 
                        title="Tickets por Estado"
                    />
                    
                    {/* Técnicos más activos */}
                    <TopTechnicals technicals={lists.topTechnicals} />
                    
                    {/* Tickets recientes */}
                    <RecentTickets tickets={lists.recentTickets} />
                </div>

                {/* Sección adicional de estadísticas */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Dispositivos por tipo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Dispositivos por Tipo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {charts.devicesByType.map((device, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-sm">{device.name}</span>
                                        <Badge variant="outline">{device.count}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edificios con más tickets */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Edificios con Más Tickets
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {lists.buildingsWithTickets.map((building, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {building.image ? (
                                                <img 
                                                    src={`/storage/${building.image}`} 
                                                    alt={building.name}
                                                    className="w-8 h-8 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                                                    <Building className="h-4 w-4 text-gray-500" />
                                                </div>
                                            )}
                                            <span className="text-sm font-medium">{building.name}</span>
                                        </div>
                                        <Badge variant="secondary">{building.tickets_count} tickets</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dispositivos problemáticos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Dispositivos Problemáticos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {lists.problematicDevices.map((device, index) => (
                                    <div key={index} className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{device.device_type}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {device.device_name}
                                            </p>
                                        </div>
                                        <Badge variant="destructive">{device.tickets_count}</Badge>
                                    </div>
                                ))}
                                {lists.problematicDevices.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay dispositivos problemáticos
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Gráficos adicionales */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Tickets por prioridad */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Tickets por Prioridad</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center py-8">
                                <p className="text-sm text-muted-foreground">
                                    Funcionalidad de prioridad no disponible
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tickets por categoría */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Tickets por Categoría</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(charts.ticketsByCategory).map(([category, count]) => {
                                    const total = Object.values(charts.ticketsByCategory).reduce((sum, value) => sum + value, 0);
                                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                                    
                                    return (
                                        <div key={category} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                                <span className="text-sm capitalize">{category}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-medium">{count}</span>
                                                <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer con estadísticas rápidas */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Eficiencia</p>
                                    <p className="text-lg font-semibold">
                                        {metrics.tickets.total > 0 
                                            ? Math.round((metrics.tickets.resolved / metrics.tickets.total) * 100)
                                            : 0}%
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Última Actualización</p>
                                    <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Activity className="h-5 w-5 text-purple-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Estado Sistema</p>
                                    <p className="text-sm font-medium text-green-600">Operativo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Wrench className="h-5 w-5 text-orange-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Técnicos Activos</p>
                                    <p className="text-lg font-semibold">{metrics.resources.technicals}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
