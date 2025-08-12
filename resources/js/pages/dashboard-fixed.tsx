import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Ticket, User, Monitor } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardData {
    activeTickets: number;
    pendingTickets: number;
    resolvedTickets: number;
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    totalUsers: number;
    recentTickets: any[];
    deviceStatuses: any[];
    alertCounts: any[];
}

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    read_at: string | null;
    created_at: string;
    ticket_id?: number;
    ticket_code?: string;
    ticket_title?: string;
    technical_name?: string;
    assigned_by?: string;
    device_name?: string;
}

interface TicketsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tickets: any[];
    title: string;
}

function TicketsModal({ isOpen, onClose, tickets, title }: TicketsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </div>
                <div className="space-y-2">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="border p-3 rounded">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium">{ticket.title}</h3>
                                    <p className="text-sm text-gray-600">#{ticket.ticket_code}</p>
                                    <p className="text-sm">{ticket.description}</p>
                                </div>
                                <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'secondary'}>
                                    {ticket.priority}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        activeTickets: 0,
        pendingTickets: 0,
        resolvedTickets: 0,
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        totalUsers: 0,
        recentTickets: [],
        deviceStatuses: [],
        alertCounts: []
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showOpenTicketsModal, setShowOpenTicketsModal] = useState(false);
    const [showPendingTicketsModal, setShowPendingTicketsModal] = useState(false);
    const [showResolvedTicketsModal, setShowResolvedTicketsModal] = useState(false);
    const [modalTickets, setModalTickets] = useState<any[]>([]);

    const breadcrumbs = [
        { title: "Dashboard", href: "/dashboard" }
    ];

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/dashboard-data');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setDashboardData(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Error al cargar los datos del dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleShowTickets = async (status: string, title: string) => {
        try {
            const response = await fetch(`/api/tickets?status=${status}`);
            if (!response.ok) throw new Error('Error fetching tickets');
            
            const tickets = await response.json();
            setModalTickets(tickets);
            
            if (status === 'open') setShowOpenTicketsModal(true);
            else if (status === 'pending') setShowPendingTicketsModal(true);
            else if (status === 'resolved') setShowResolvedTicketsModal(true);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };

    if (isLoading) {
        return (
            <TooltipProvider>
                <AppLayout breadcrumbs={breadcrumbs}>
                    <Head title="Dashboard" />
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Cargando dashboard...</p>
                        </div>
                    </div>
                </AppLayout>
            </TooltipProvider>
        );
    }

    if (error) {
        return (
            <TooltipProvider>
                <AppLayout breadcrumbs={breadcrumbs}>
                    <Head title="Dashboard" />
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </AppLayout>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                
                <div className="space-y-6">
                    {/* Tickets Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                              onClick={() => handleShowTickets('open', 'Tickets Activos')}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tickets Activos</CardTitle>
                                <Ticket className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{dashboardData.activeTickets}</div>
                                <p className="text-xs text-muted-foreground">Tickets en progreso</p>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                              onClick={() => handleShowTickets('pending', 'Tickets Pendientes')}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tickets Pendientes</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{dashboardData.pendingTickets}</div>
                                <p className="text-xs text-muted-foreground">En espera de atención</p>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                              onClick={() => handleShowTickets('resolved', 'Tickets Resueltos')}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tickets Resueltos</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{dashboardData.resolvedTickets}</div>
                                <p className="text-xs text-muted-foreground">Completados este mes</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Devices Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Dispositivos</CardTitle>
                                <Monitor className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData.totalDevices}</div>
                                <p className="text-xs text-muted-foreground">Dispositivos registrados</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Dispositivos Online</CardTitle>
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{dashboardData.onlineDevices}</div>
                                <p className="text-xs text-muted-foreground">Conectados actualmente</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Dispositivos Offline</CardTitle>
                                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{dashboardData.offlineDevices}</div>
                                <p className="text-xs text-muted-foreground">Sin conexión</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Users Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                                <User className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
                                <p className="text-xs text-muted-foreground">Usuarios registrados en el sistema</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Tickets */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tickets Recientes</CardTitle>
                            <CardDescription>Los últimos tickets creados en el sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dashboardData.recentTickets.length > 0 ? (
                                <div className="space-y-3">
                                    {dashboardData.recentTickets.slice(0, 5).map((ticket) => (
                                        <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{ticket.title}</h4>
                                                <p className="text-sm text-gray-600">#{ticket.ticket_code}</p>
                                                <p className="text-xs text-gray-500">
                                                    {ticket.created_at ? format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Fecha no disponible'}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant={
                                                    ticket.priority === 'high' ? 'destructive' : 
                                                    ticket.priority === 'medium' ? 'default' : 'secondary'
                                                }>
                                                    {ticket.priority}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {ticket.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No hay tickets recientes</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Modals */}
                <TicketsModal 
                    isOpen={showOpenTicketsModal} 
                    onClose={() => setShowOpenTicketsModal(false)} 
                    tickets={modalTickets} 
                    title="Tickets Activos"
                />
                <TicketsModal 
                    isOpen={showPendingTicketsModal} 
                    onClose={() => setShowPendingTicketsModal(false)} 
                    tickets={modalTickets} 
                    title="Tickets Pendientes"
                />
                <TicketsModal 
                    isOpen={showResolvedTicketsModal} 
                    onClose={() => setShowResolvedTicketsModal(false)} 
                    tickets={modalTickets} 
                    title="Tickets Resueltos"
                />
            </AppLayout>
        </TooltipProvider>
    );
}
