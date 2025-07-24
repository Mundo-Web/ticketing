import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    Shield,
    Activity,
    Filter,
    Database,
    RefreshCw,
    Calendar,
    Server
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
            return <Badge className="gap-1 bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
                <AlertTriangle className="h-3 w-3" />
                Critical
            </Badge>;
        case 'warning':
            return <Badge className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-3 w-3" />
                Warning
            </Badge>;
        case 'info':
            return <Badge className="gap-1 bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800">
                <AlertTriangle className="h-3 w-3" />
                Info
            </Badge>;
        default:
            return <Badge variant="outline" className="gap-1">{severity}</Badge>;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'open':
            return <Badge className="gap-1 bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
                <Clock className="h-3 w-3" />
                Open
            </Badge>;
        case 'acknowledged':
            return <Badge className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800">
                <CheckCircle className="h-3 w-3" />
                Acknowledged
            </Badge>;
        case 'resolved':
            return <Badge className="gap-1 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
                <CheckCircle className="h-3 w-3" />
                Resolved
            </Badge>;
        default:
            return <Badge variant="outline" className="gap-1">{status}</Badge>;
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
            toast.success('Alert acknowledged successfully');
        } catch {
            toast.error('Error acknowledging alert');
        }
    };

    const handleRefresh = () => {
        router.reload({ only: ['alerts'] });
    };

    const handleCreateTicket = async (alertId: number) => {
        try {
            await router.post(`/ninjaone-alerts/${alertId}/create-ticket`);
            toast.success('Ticket created successfully');
        } catch {
            toast.error('Error creating ticket');
        }
    };

    return (
        <AppLayout>
            <Head title="NinjaOne Alerts - Monitor & Alert Management" />
            
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                                NinjaOne Alert Center
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                                Monitor and manage alerts from NinjaOne synchronized devices
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={handleRefresh}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-600 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Critical Alerts</p>
                                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                                            {alerts?.data?.filter(alert => alert.severity === 'critical').length || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50 border-yellow-200 dark:border-yellow-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-600 rounded-lg">
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Warnings</p>
                                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                                            {alerts?.data?.filter(alert => alert.severity === 'warning').length || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-600 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Resolved</p>
                                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {alerts?.data?.filter(alert => alert.status === 'resolved').length || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <Activity className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Alerts</p>
                                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {alerts?.meta?.total || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Search */}
                    <Card className="border-0 shadow-lg dark:shadow-gray-900/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                Filters & Search
                            </CardTitle>
                            <CardDescription>
                                Filter and search specific alerts by criteria
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Search */}
                                <div className="lg:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Search by title, description or device..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                </div>
                                
                                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All severities</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="info">Info</SelectItem>
                                    </SelectContent>
                                </Select>
                                
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="acknowledged">Acknowledged</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                                
                                <Button onClick={handleSearch} className="w-full">
                                    <Search className="w-4 h-4 mr-2" />
                                    Search
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Activity className="w-4 h-4" />
                                Showing {alerts?.data?.length || 0} of {alerts?.meta?.total || 0} alerts
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alerts Table */}
                    <Card className="border-0 shadow-xl dark:shadow-gray-900/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                Alert List
                            </CardTitle>
                            <CardDescription>
                                {alerts?.meta?.total || 0} alerts found
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70">
                                            <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">Device</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">Alert</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">Severity</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">Status</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">Type</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">Date</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">Ticket</th>
                                            <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!alerts?.data || alerts.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center">
                                                    <div className="space-y-3">
                                                        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto" />
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                            No alerts found
                                                        </h3>
                                                        <p className="text-gray-600 dark:text-gray-400">
                                                            There are no alerts matching your search criteria.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            alerts.data.map((alert, index) => (
                                                <tr key={alert.id} className={cn(
                                                    "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                                                    index % 2 === 0 ? 'bg-white dark:bg-gray-800/30' : 'bg-gray-50 dark:bg-gray-800/50'
                                                )}>
                                                    {/* Device */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="min-w-10 min-h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center">
                                                                <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {alert.device?.name || 'Device not found'}
                                                                </div>
                                                                {alert.device?.ninjaone_device_id && (
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                        ID: {alert.device.ninjaone_device_id}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Alert */}
                                                    <td className="py-4 px-6">
                                                        <div className="max-w-xs">
                                                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                {alert.title}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                                                {alert.description}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Severity */}
                                                    <td className="py-4 px-6">
                                                        {getSeverityBadge(alert.severity)}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-4 px-6">
                                                        {getStatusBadge(alert.status)}
                                                    </td>

                                                    {/* Type */}
                                                    <td className="py-4 px-6">
                                                        <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                                                            {alert.alert_type}
                                                        </Badge>
                                                    </td>

                                                    {/* Date */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            <div className="flex flex-col">
                                                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                                                    {format(new Date(alert.created_at), 'dd/MM/yyyy', { locale: es })}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {format(new Date(alert.created_at), 'HH:mm', { locale: es })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Ticket */}
                                                    <td className="py-4 px-6">
                                                        {alert.ticket_created ? (
                                                            <Badge className="gap-1 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
                                                                <TicketPlus className="h-3 w-3" />
                                                                Created
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="gap-1 text-gray-500">
                                                                <Clock className="h-3 w-3" />
                                                                No ticket
                                                            </Badge>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 px-6">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/ninjaone-alerts/${alert.id}`} className="flex items-center">
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View details
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                {alert.status === 'open' && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleAcknowledge(alert.id)}
                                                                        className="flex items-center"
                                                                    >
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        Acknowledge
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {!alert.ticket_created && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleCreateTicket(alert.id)}
                                                                        className="flex items-center"
                                                                    >
                                                                        <TicketPlus className="mr-2 h-4 w-4" />
                                                                        Create Ticket
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {alerts?.meta?.last_page && alerts.meta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-6 px-6 pb-6">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing {alerts.meta.from || 0} to {alerts.meta.to || 0} of {alerts.meta.total || 0} results
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
                                                className={cn(
                                                    "min-w-[40px]",
                                                    link.active && "bg-blue-600 hover:bg-blue-700"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
