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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Monitor,
    TicketPlus,
    Wifi,
    Calendar,
} from 'lucide-react';

interface Device {
    id: number;
    name: string;
    ninjaone_device_id?: string;
    device_type?: string;
    status?: string;
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
    raw_data?: Record<string, unknown>;
}

interface Props {
    alert: NinjaOneAlert;
}

const getSeverityBadge = (severity: string) => {
    switch (severity) {
        case 'critical':
            return <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-4 w-4" />
                Crítico
            </Badge>;
        case 'warning':
            return <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-4 w-4" />
                Advertencia
            </Badge>;
        case 'info':
            return <Badge variant="outline" className="gap-1">
                <AlertTriangle className="h-4 w-4" />
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
                <Clock className="h-4 w-4" />
                Abierto
            </Badge>;
        case 'acknowledged':
            return <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-4 w-4" />
                Reconocido
            </Badge>;
        case 'resolved':
            return <Badge variant="default" className="gap-1">
                <CheckCircle className="h-4 w-4" />
                Resuelto
            </Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function Show({ alert }: Props) {
    const [processing, setProcessing] = useState(false);

    const handleAcknowledge = async () => {
        if (processing) return;
        
        setProcessing(true);
        try {
            await router.post(`/ninjaone-alerts/${alert.id}/acknowledge`);
            toast.success('Alerta reconocida correctamente');
        } catch {
            toast.error('Error al reconocer la alerta');
        } finally {
            setProcessing(false);
        }
    };

    const handleCreateTicket = async () => {
        if (processing) return;
        
        setProcessing(true);
        try {
            await router.post(`/ninjaone-alerts/${alert.id}/create-ticket`);
            toast.success('Ticket creado correctamente');
        } catch {
            toast.error('Error al crear el ticket');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title={`Alerta: ${alert.title}`} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/ninjaone-alerts">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver a alertas
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{alert.title}</h1>
                            <p className="text-muted-foreground">
                                Detalles de la alerta NinjaOne
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {alert.status === 'open' && (
                            <Button 
                                onClick={handleAcknowledge}
                                disabled={processing}
                                className="gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Reconocer
                            </Button>
                        )}
                        {!alert.ticket_created && (
                            <Button 
                                onClick={handleCreateTicket}
                                disabled={processing}
                                className="gap-2"
                            >
                                <TicketPlus className="h-4 w-4" />
                                Crear Ticket
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Información Principal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wifi className="h-5 w-5" />
                                Información de la Alerta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Estado:</span>
                                    {getStatusBadge(alert.status)}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Severidad:</span>
                                    {getSeverityBadge(alert.severity)}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Tipo:</span>
                                    <Badge variant="outline">{alert.alert_type}</Badge>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Ticket creado:</span>
                                    {alert.ticket_created ? (
                                        <Badge variant="default" className="gap-1">
                                            <TicketPlus className="h-3 w-3" />
                                            Sí
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">No</Badge>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-start gap-2">
                                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium">Fecha de creación:</div>
                                        <div className="text-sm text-muted-foreground">
                                            {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                                        </div>
                                    </div>
                                </div>
                                
                                {alert.acknowledged_at && (
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">Fecha de reconocimiento:</div>
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(alert.acknowledged_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información del Dispositivo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="h-5 w-5" />
                                Dispositivo Afectado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {alert.device ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-lg font-semibold">{alert.device.name}</div>
                                        {alert.device.ninjaone_device_id && (
                                            <div className="text-sm text-muted-foreground">
                                                ID NinjaOne: {alert.device.ninjaone_device_id}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {alert.device.device_type && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">Tipo:</span>
                                            <Badge variant="outline">{alert.device.device_type}</Badge>
                                        </div>
                                    )}
                                    
                                    {alert.device.status && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">Estado:</span>
                                            <Badge 
                                                variant={alert.device.status === 'active' ? 'default' : 'secondary'}
                                            >
                                                {alert.device.status}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Dispositivo no encontrado</p>
                                    <p className="text-sm">Es posible que el dispositivo haya sido eliminado</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Descripción de la Alerta */}
                <Card>
                    <CardHeader>
                        <CardTitle>Descripción</CardTitle>
                        <CardDescription>
                            Detalles específicos de la alerta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{alert.description}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Datos Raw (si están disponibles) */}
                {alert.raw_data && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos Técnicos</CardTitle>
                            <CardDescription>
                                Información técnica completa de la alerta
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted rounded-md p-4">
                                <pre className="text-sm overflow-x-auto">
                                    {JSON.stringify(alert.raw_data, null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ID de Referencia */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información de Referencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">ID Interno</div>
                                <div className="font-mono text-sm">{alert.id}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">ID NinjaOne</div>
                                <div className="font-mono text-sm">{alert.ninjaone_alert_id}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
