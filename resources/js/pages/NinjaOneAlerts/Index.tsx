import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    MoreHorizontal,
    Search,
    TicketPlus,
    Wifi,
} from 'lucide-react';

interface Device {
    id: number;
    name: string;
    ninjaone_device_id?: string;
}

interface NinjaOneAlert {
    id: number;
    ninjaone_alert_id: string;
    device_id?: number;
    device?: Device;
    alert_type: string;
    severity: 'info' | 'warning' | 'critical';
    status: 'open' | 'acknowledged' | 'resolved';
    title: string;
    description: string;
    created_at: string;
    acknowledged_at?: string;
    ticket_created: boolean;
}

interface AlertsResponse {
    data: NinjaOneAlert[];
    links: {
        url?: string;
        label: string;
        active: boolean;
    }[];
    meta: {
        current_page: number;
        from: number;
        to: number;
        total: number;
        last_page: number;
    };
}

interface Props {
    alerts?: AlertsResponse;
    filters?: {
        search?: string;
        severity?: string;
        status?: string;
    };
}

const getSeverityBadge = (severity: string) => {
    switch (severity) {
        case 'critical':
            return <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Crítico
            </Badge>;
        case 'warning':
            return <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Advertencia
            </Badge>;
        case 'info':
            return <Badge variant="outline" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Información
            </Badge>;
        default:
            return <Badge variant="outline">{severity}</Badge>;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'open':
            return <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" />
                Abierto
            </Badge>;
        case 'acknowledged':
            return <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Reconocido
            </Badge>;
        case 'resolved':
            return <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Resuelto
            </Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function Index({ alerts, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [severityFilter, setSeverityFilter] = useState(filters?.severity || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');

    const handleSearch = () => {
        router.get('/ninjaone-alerts', {
            search: searchTerm || undefined,
            severity: severityFilter === 'all' ? undefined : severityFilter,
            status: statusFilter === 'all' ? undefined : statusFilter,
        });
    };

    const handleAcknowledge = async (alertId: number) => {
        try {
            await router.post(`/ninjaone-alerts/${alertId}/acknowledge`);
            toast.success('Alerta reconocida correctamente');
        } catch {
            toast.error('Error al reconocer la alerta');
        }
    };

    const handleCreateTicket = async (alertId: number) => {
        try {
            await router.post(`/ninjaone-alerts/${alertId}/create-ticket`);
            toast.success('Ticket creado correctamente');
        } catch {
            toast.error('Error al crear el ticket');
        }
    };

    return (
        <>
            <Head title="Alertas NinjaOne" />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Alertas NinjaOne</h1>
                        <p className="text-muted-foreground">
                            Gestiona las alertas de dispositivos sincronizados con NinjaOne
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wifi className="h-5 w-5" />
                            Filtros de Alertas
                        </CardTitle>
                        <CardDescription>
                            Filtra y busca alertas específicas
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por título, descripción o dispositivo..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Severidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las severidades</SelectItem>
                                    <SelectItem value="critical">Crítico</SelectItem>
                                    <SelectItem value="warning">Advertencia</SelectItem>
                                    <SelectItem value="info">Información</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="open">Abierto</SelectItem>
                                    <SelectItem value="acknowledged">Reconocido</SelectItem>
                                    <SelectItem value="resolved">Resuelto</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSearch}>
                                Buscar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Alertas</CardTitle>
                        <CardDescription>
                            {alerts?.meta?.total || 0} alertas encontradas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Dispositivo</TableHead>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Severidad</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Ticket</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!alerts?.data || alerts.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                No se encontraron alertas
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        alerts.data.map((alert) => (
                                            <TableRow key={alert.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {alert.device?.name || 'Dispositivo no encontrado'}
                                                    </div>
                                                    {alert.device?.ninjaone_device_id && (
                                                        <div className="text-sm text-muted-foreground">
                                                            ID: {alert.device.ninjaone_device_id}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs">
                                                        <div className="font-medium truncate">{alert.title}</div>
                                                        <div className="text-sm text-muted-foreground truncate">
                                                            {alert.description}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getSeverityBadge(alert.severity)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(alert.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{alert.alert_type}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {format(new Date(alert.created_at), 'dd/MM/yyyy', { locale: es })}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(alert.created_at), 'HH:mm', { locale: es })}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {alert.ticket_created ? (
                                                        <Badge variant="default" className="gap-1">
                                                            <TicketPlus className="h-3 w-3" />
                                                            Creado
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">Sin ticket</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/ninjaone-alerts/${alert.id}`}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Ver detalles
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {alert.status === 'open' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleAcknowledge(alert.id)}
                                                                >
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Reconocer
                                                                </DropdownMenuItem>
                                                            )}
                                                            {!alert.ticket_created && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleCreateTicket(alert.id)}
                                                                >
                                                                    <TicketPlus className="mr-2 h-4 w-4" />
                                                                    Crear Ticket
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {alerts?.meta?.last_page && alerts.meta.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {alerts.meta.from || 0} a {alerts.meta.to || 0} de {alerts.meta.total || 0} resultados
                                </div>
                                <div className="flex gap-2">
                                    {alerts.links?.map((link, index: number) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
