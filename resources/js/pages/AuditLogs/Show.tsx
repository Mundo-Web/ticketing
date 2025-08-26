import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    User,
    Activity,
    Clock,
    Globe,
    Monitor,
    Route,
    Database,
    FileText,
    Code,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
    id: number;
    user_id: number | null;
    action_type: string;
    model_type: string | null;
    model_id: number | null;
    old_values: any;
    new_values: any;
    ip_address: string | null;
    user_agent: string | null;
    session_id: string | null;
    description: string | null;
    route: string | null;
    method: string | null;
    request_data: any;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    readable_action: string;
    readable_model: string;
}

interface Props {
    auditLog: AuditLog;
}

const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
        case 'created':
            return 'default';
        case 'updated':
            return 'secondary';
        case 'deleted':
            return 'destructive';
        case 'login':
            return 'outline';
        case 'logout':
            return 'outline';
        default:
            return 'secondary';
    }
};

const getActionIcon = (actionType: string) => {
    switch (actionType) {
        case 'login':
        case 'logout':
            return <User className="h-4 w-4" />;
        case 'created':
        case 'updated':
        case 'deleted':
            return <Activity className="h-4 w-4" />;
        default:
            return <Activity className="h-4 w-4" />;
    }
};

const JsonViewer = ({ data, title }: { data: any; title: string }) => {
    if (!data) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto border">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </CardContent>
        </Card>
    );
};

export default function AuditLogShow({ auditLog }: Props) {
    return (
        <AppLayout>
            <Head title={`Log de Auditoría #${auditLog.id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('audit-logs.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Log de Auditoría #{auditLog.id}
                            </h1>
                            <p className="text-muted-foreground">
                                Complete audit log details
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant={getActionBadgeVariant(auditLog.action_type)}
                        className="flex items-center gap-2 text-sm px-3 py-1"
                    >
                        {getActionIcon(auditLog.action_type)}
                        {auditLog.readable_action}
                    </Badge>
                </div>

                {/* Main Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Información Básica
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        ID del Log
                                    </Label>
                                    <p className="text-sm font-mono">{auditLog.id}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Action Type
                                    </Label>
                                    <p className="text-sm">{auditLog.readable_action}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Affected Model
                                    </Label>
                                    <p className="text-sm">
                                        {auditLog.model_type ? (
                                            <>
                                                {auditLog.readable_model}
                                                {auditLog.model_id && (
                                                    <span className="text-muted-foreground">
                                                        {' '}(ID: {auditLog.model_id})
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            'No aplica'
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Date and Time
                                    </Label>
                                    <p className="text-sm flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(auditLog.created_at), 'dd/MM/yyyy HH:mm:ss', {
                                            locale: es,
                                        })}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">
                                    Descripción
                                </Label>
                                <p className="text-sm mt-1">
                                    {auditLog.description || 'Sin descripción disponible'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                User Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        User
                                    </Label>
                                    <p className="text-sm">
                                        {auditLog.user ? (
                                            <>
                                                <span className="font-medium">{auditLog.user.name}</span>
                                                <br />
                                                <span className="text-muted-foreground">
                                                    {auditLog.user.email}
                                                </span>
                                            </>
                                        ) : (
                                            'System / Unidentified User'
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        User ID
                                    </Label>
                                    <p className="text-sm font-mono">
                                        {auditLog.user_id || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        ID de Sesión
                                    </Label>
                                    <p className="text-sm font-mono break-all">
                                        {auditLog.session_id || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Network Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Información de Red
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Dirección IP
                                    </Label>
                                    <p className="text-sm font-mono">
                                        {auditLog.ip_address || 'No disponible'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Ruta y Método
                                    </Label>
                                    <p className="text-sm font-mono">
                                        <Badge variant="outline" className="mr-2">
                                            {auditLog.method || 'N/A'}
                                        </Badge>
                                        {auditLog.route || 'No disponible'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Browser Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="h-5 w-5" />
                                Información del Navegador
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">
                                    User Agent
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1 break-all">
                                    {auditLog.user_agent || 'No disponible'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Changes */}
                {(auditLog.old_values || auditLog.new_values) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {auditLog.old_values && (
                            <JsonViewer data={auditLog.old_values} title="Valores Anteriores" />
                        )}
                        {auditLog.new_values && (
                            <JsonViewer data={auditLog.new_values} title="Valores Nuevos" />
                        )}
                    </div>
                )}

                {/* Request Data */}
                {auditLog.request_data && (
                    <JsonViewer data={auditLog.request_data} title="Datos de la Petición" />
                )}

                {/* Technical Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Technical Details
                        </CardTitle>
                        <CardDescription>
                            Información técnica adicional del registro
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Model Type (Class)
                                </Label>
                                <p className="font-mono text-xs">
                                    {auditLog.model_type || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Model ID
                                </Label>
                                <p className="font-mono text-xs">
                                    {auditLog.model_id || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Action Type (Raw)
                                </Label>
                                <p className="font-mono text-xs">
                                    {auditLog.action_type}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Timestamp
                                </Label>
                                <p className="font-mono text-xs">
                                    {new Date(auditLog.created_at).getTime()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}