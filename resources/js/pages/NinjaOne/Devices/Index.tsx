import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { createCSRFHeaders } from '@/utils/csrf-helper';
import { 
    Monitor, 
    Wifi, 
    WifiOff, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    Database,
    Link,
    RefreshCw,
    Eye,
    Search,
    Download,
    Server,
    Smartphone,
    Laptop,
    Filter,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Building,
    Activity,
     MapPin,
    Clock,
    Info,
    Cpu,
    HardDrive,
    Globe,
    MemoryStick
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle
} from '@/components/ui/dialog';
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Alert {
    id?: string;
    message?: string;
    createdAt?: string;
    severity?: string;
}

interface NinjaOneDevice {
    ninjaone_data: {
        id: number;
        systemName: string;
        hostname?: string;
        displayName?: string;
        dnsName?: string;
        operatingSystem?: string;
        online?: boolean;
        offline?: boolean;
        lastSeenUtc?: string;
        lastContact?: number;
        lastUpdate?: number;
        serialNumber?: string;
        deviceType?: string;
        nodeClass?: string;
        approvalStatus?: string;
        organizationId?: number;
        locationId?: number;
        nodeRoleId?: number;
        rolePolicyId?: number;
        publicIP?: string;
        ipAddresses?: string | string[];
        macAddresses?: string | string[];
        lastLoggedInUser?: string;
        
        // OS Information
        os?: {
            manufacturer?: string;
            name?: string;
            architecture?: string;
            buildNumber?: string;
            language?: string;
            locale?: string;
            needsReboot?: boolean;
        };
        
        // System/Hardware Information
        system?: {
            name?: string;
            manufacturer?: string;
            model?: string;
            biosSerialNumber?: string;
            serialNumber?: string;
            domain?: string;
            domainRole?: string;
            numberOfProcessors?: number;
            totalPhysicalMemory?: number;
            virtualMachine?: boolean;
            chassisType?: string;
        };
        
        // Memory Information
        memory?: {
            capacity?: number;
        };
        
        // Processors Information
        processors?: Array<{
            name?: string;
            architecture?: string;
            maxClockSpeed?: number;
            clockSpeed?: number;
            numCores?: number;
            numLogicalCores?: number;
        }>;
        
        // Volumes/Disks Information
        volumes?: Array<{
            name?: string;
            label?: string;
            deviceType?: string;
            fileSystem?: string;
            capacity?: number;
            freeSpace?: number;
            autoMount?: boolean;
            compressed?: boolean;
        }>;
    };
    local_device?: {
        id: number;
        name: string;
        brand?: { name: string };
        model?: { name: string };
        system?: { name: string };
    };
    health_status: {
        status: string;
        issuesCount: number;
        criticalCount: number;
        warningCount: number;
        isOffline: boolean;
        lastContact?: number;
        maintenance?: {
            status?: string;
            [key: string]: unknown;
        };
    };
    alerts: Alert[];
    alerts_count: number;
    has_local_mapping: boolean;
    organization?: {
        id: number;
        name: string;
    };
    location?: {
        id: number;
        name: string;
    };
}

interface Stats {
    total_devices: number;
    online_devices: number;
    offline_devices: number;
    mapped_devices: number;
    unmapped_devices: number;
    devices_with_alerts: number;
    organizations?: Array<{ id: number; name: string; deviceCount: number }>;
    locations?: Array<{ id: number; name: string; deviceCount: number }>;
}

interface Props {
    devices: NinjaOneDevice[];
    stats: Stats;
    connection_status: 'connected' | 'error';
    error_message?: string;
}

type SortField = 'systemName' | 'organization' | 'location' | 'status' | 'lastSeen' | 'deviceType' | 'alerts' | 'osName' | 'processor' | 'memory' | 'storage';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'online' | 'offline' | 'alerts' | 'mapped' | 'unmapped';

// Helper functions
const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatSpeed = (hz?: number) => {
    if (!hz) return 'N/A';
    const ghz = hz / 1000000000;
    return `${ghz.toFixed(1)} GHz`;
};

const getTotalStorage = (volumes?: Array<{capacity?: number}>) => {
    if (!volumes || volumes.length === 0) return 0;
    return volumes.reduce((total, volume) => total + (volume.capacity || 0), 0);
};

const getUsedStorage = (volumes?: Array<{capacity?: number, freeSpace?: number}>) => {
    if (!volumes || volumes.length === 0) return 0;
    return volumes.reduce((total, volume) => total + ((volume.capacity || 0) - (volume.freeSpace || 0)), 0);
};

// Component for device table row
interface DeviceTableRowProps {
    device: NinjaOneDevice;
    index: number;
    onSync: (deviceId: number) => void;
    onViewDetails: (device: NinjaOneDevice) => void;
}

function DeviceTableRow({ device, index, onSync, onViewDetails }: DeviceTableRowProps) {
    const getDeviceIcon = (deviceType?: string, os?: string) => {
        if (deviceType?.toLowerCase().includes('mobile') || os?.toLowerCase().includes('android') || os?.toLowerCase().includes('ios')) {
            return <Smartphone className="w-5 h-5" />;
        }
        if (deviceType?.toLowerCase().includes('server') || os?.toLowerCase().includes('server')) {
            return <Server className="w-5 h-5" />;
        }
        return <Laptop className="w-5 h-5" />;
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'healthy':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800';
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800';
            case 'offline':
                return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800';
        }
    };

    const formatLastSeen = (lastSeenUtc?: string, lastContact?: number) => {
        // Priorizar lastContact si está disponible
        if (lastContact) {
            try {
                const date = new Date(lastContact * 1000); // Convert Unix timestamp to milliseconds
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diffMins < 60) {
                    return `${diffMins}m ago`;
                } else if (diffHours < 24) {
                    return `${diffHours}h ago`;
                } else {
                    return `${diffDays}d ago`;
                }
            } catch {
                return 'Invalid date';
            }
        }
        
        // Fallback a lastSeenUtc si está disponible
        if (!lastSeenUtc) return 'Never';
        
        try {
            const date = new Date(lastSeenUtc);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 60) {
                return `${diffMins}m ago`;
            } else if (diffHours < 24) {
                return `${diffHours}h ago`;
            } else {
                return `${diffDays}d ago`;
            }
        } catch {
            return 'Invalid date';
        }
    };

    return (
        <tr className={cn(
            "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
            index % 2 === 0 ? 'bg-white dark:bg-gray-800/30' : 'bg-gray-50 dark:bg-gray-800/50'
        )}>
            {/* Device Info */}
            <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "min-w-10 min-h-10 rounded-lg flex items-center justify-center",
                        (!device.ninjaone_data.offline && device.ninjaone_data.online !== false)
                            ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
                    )}>
                        <div className={cn(
                            (!device.ninjaone_data.offline && device.ninjaone_data.online !== false)
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-gray-600 dark:text-gray-400'
                        )}>
                            {getDeviceIcon(device.ninjaone_data.deviceType, device.ninjaone_data.operatingSystem)}
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {device.ninjaone_data.systemName || device.ninjaone_data.hostname || device.ninjaone_data.displayName || 'Unknown Device'}
                        </p>
                      
                    </div>
                </div>
            </td>

            {/* System Info */}
            <td className="py-4 px-6">
                <div 
                    className="relative group cursor-help"
                    title={`${device.ninjaone_data.os?.manufacturer || 'N/A'} | Arch: ${device.ninjaone_data.os?.architecture || 'N/A'} | Build: ${device.ninjaone_data.os?.buildNumber || 'N/A'} | CPU: ${device.ninjaone_data.processors && device.ninjaone_data.processors.length > 0 ? `${device.ninjaone_data.processors[0].numCores}c/${device.ninjaone_data.processors[0].numLogicalCores}t @ ${formatSpeed(device.ninjaone_data.processors[0].maxClockSpeed)}` : 'N/A'} | RAM: ${device.ninjaone_data.system?.totalPhysicalMemory ? formatBytes(device.ninjaone_data.system.totalPhysicalMemory) : 'N/A'} | Storage: ${device.ninjaone_data.volumes && device.ninjaone_data.volumes.length > 0 ? `${formatBytes(getUsedStorage(device.ninjaone_data.volumes))} / ${formatBytes(getTotalStorage(device.ninjaone_data.volumes))}` : 'N/A'}`}
                >
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {device.ninjaone_data.os?.name || device.ninjaone_data.operatingSystem || 'Unknown OS'}
                    </div>
                    
                    {/* Tooltip - aparece al hacer hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999]" 
                         style={{ position: 'fixed', zIndex: 9999 }}>
                        <div className="space-y-2">
                            {/* OS Details */}
                            <div className="border-b border-gray-700 pb-2">
                                <div className="font-semibold text-blue-300 mb-1">Operating System</div>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                    <div><span className="text-gray-400">OS:</span> {device.ninjaone_data.os?.name || 'N/A'}</div>
                                    <div><span className="text-gray-400">Vendor:</span> {device.ninjaone_data.os?.manufacturer || 'N/A'}</div>
                                    <div><span className="text-gray-400">Architecture:</span> {device.ninjaone_data.os?.architecture || 'N/A'}</div>
                                    <div><span className="text-gray-400">Build:</span> {device.ninjaone_data.os?.buildNumber || 'N/A'}</div>
                                </div>
                            </div>
                            
                            {/* Hardware Details */}
                            <div>
                                <div className="font-semibold text-green-300 mb-1">Hardware</div>
                                <div className="space-y-1 text-xs">
                                    {device.ninjaone_data.processors && device.ninjaone_data.processors.length > 0 && (
                                        <div><span className="text-gray-400">CPU:</span> {device.ninjaone_data.processors[0].numCores}c/{device.ninjaone_data.processors[0].numLogicalCores}t @ {formatSpeed(device.ninjaone_data.processors[0].maxClockSpeed)}</div>
                                    )}
                                    {device.ninjaone_data.system?.totalPhysicalMemory && (
                                        <div><span className="text-gray-400">RAM:</span> {formatBytes(device.ninjaone_data.system.totalPhysicalMemory)}</div>
                                    )}
                                    {device.ninjaone_data.volumes && device.ninjaone_data.volumes.length > 0 && (
                                        <div><span className="text-gray-400">Storage:</span> {formatBytes(getUsedStorage(device.ninjaone_data.volumes))} / {formatBytes(getTotalStorage(device.ninjaone_data.volumes))}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Flecha del tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            </td>

            {/* Status */}
            <td className="py-4 px-6">
                <div className="flex flex-col gap-2">
                    <Badge className={cn(
                        "w-fit",
                        // Verificar si está online - NinjaOne usa 'offline' boolean, no 'online'
                        (!device.ninjaone_data.offline && device.ninjaone_data.online !== false)
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    )}>
                        {(!device.ninjaone_data.offline && device.ninjaone_data.online !== false) ? (
                            <>
                                <Wifi className="w-3 h-3 mr-1" />
                                Online
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-3 h-3 mr-1" />
                                Offline
                            </>
                        )}
                    </Badge>
                    {device.has_local_mapping && (
                        <Badge className="w-fit bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                            <Link className="w-3 h-3 mr-1" />
                            Synced
                        </Badge>
                    )}
                </div>
            </td>

            {/* Organization */}
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                        {device.organization?.name || `Org ${device.ninjaone_data.organizationId}` || 'N/A'}
                    </span>
                </div>
            </td>

            {/* Location */}
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                        {device.location?.name || `Location ${device.ninjaone_data.locationId}` || 'N/A'}
                    </span>
                </div>
            </td>

            {/* Health & Alerts */}
            <td className="py-4 px-6">
                <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(device.health_status.status)}>
                        {device.health_status.status}
                    </Badge>
                    {device.alerts_count > 0 && (
                        <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                {device.alerts_count} alert{device.alerts_count > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                    {device.health_status.issuesCount > 0 && (
                        <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-orange-500" />
                            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                {device.health_status.issuesCount} issue{device.health_status.issuesCount > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </td>

            {/* Last Seen */}
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                            {formatLastSeen(device.ninjaone_data.lastSeenUtc, device.ninjaone_data.lastContact)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {device.ninjaone_data.lastContact 
                                ? new Date(device.ninjaone_data.lastContact * 1000).toLocaleDateString()
                                : (device.ninjaone_data.lastSeenUtc ? new Date(device.ninjaone_data.lastSeenUtc).toLocaleDateString() : '-')
                            }
                        </span>
                    </div>
                </div>
            </td>

            {/* Actions */}
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onViewDetails(device)}
                                className="h-8 w-8 p-0"
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>View device details</p>
                        </TooltipContent>
                    </Tooltip>

                    {!device.has_local_mapping && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => onSync(device.ninjaone_data.id)}
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Sync to local database</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

              
                </div>
            </td>
        </tr>
    );
}

// Component for device details modal
function DeviceDetailsModal({ device }: { device: NinjaOneDevice }) {
    const [activeTab, setActiveTab] = useState('overview');
    
    const tabs = [
        { id: 'overview', label: 'Overview', icon: Info },
        { id: 'system', label: 'System', icon: Cpu },
        { id: 'storage', label: 'Storage', icon: HardDrive },
        { id: 'network', label: 'Network', icon: Globe },
        { id: 'health', label: 'Health', icon: Activity },
        ...(device.alerts.length > 0 ? [{ id: 'alerts', label: 'Alerts', icon: AlertTriangle }] : []),
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {tab.id === 'alerts' && device.alerts.length > 0 && (
                                    <Badge className="ml-1 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                        {device.alerts.length}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content with Custom Scrollbar */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Quick Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Cpu className="w-8 h-8 text-blue-600" />
                                        <div>
                                            <p className="text-xs text-blue-700 dark:text-blue-300">CPU</p>
                                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                {device.ninjaone_data.processors?.[0] 
                                                    ? `${device.ninjaone_data.processors[0].numCores}c/${device.ninjaone_data.processors[0].numLogicalCores}t`
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <MemoryStick className="w-8 h-8 text-green-600" />
                                        <div>
                                            <p className="text-xs text-green-700 dark:text-green-300">RAM</p>
                                            <p className="font-semibold text-green-900 dark:text-green-100">
                                                {formatBytes(device.ninjaone_data.system?.totalPhysicalMemory)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <HardDrive className="w-8 h-8 text-purple-600" />
                                        <div>
                                            <p className="text-xs text-purple-700 dark:text-purple-300">Storage</p>
                                            <p className="font-semibold text-purple-900 dark:text-purple-100">
                                                {formatBytes(getTotalStorage(device.ninjaone_data.volumes))}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-8 h-8 text-orange-600" />
                                        <div>
                                            <p className="text-xs text-orange-700 dark:text-orange-300">Last Seen</p>
                                            <p className="font-semibold text-orange-900 dark:text-orange-100 text-sm">
                                                {device.ninjaone_data.lastContact 
                                                    ? new Date(device.ninjaone_data.lastContact * 1000).toLocaleDateString()
                                                    : 'Never'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="w-5 h-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">System Name</label>
                                            <p className="text-lg font-semibold">{device.ninjaone_data.systemName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Hostname</label>
                                            <p className="text-lg font-semibold">{device.ninjaone_data.hostname || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Device Type</label>
                                            <p className="text-lg font-semibold">{device.ninjaone_data.deviceType || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Serial Number</label>
                                            <p className="text-lg font-semibold">{device.ninjaone_data.serialNumber || device.ninjaone_data.system?.serialNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Display Name</label>
                                            <p className="text-lg font-semibold">{device.ninjaone_data.displayName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">DNS Name</label>
                                            <p className="text-lg font-semibold">{device.ninjaone_data.dnsName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Node Class</label>
                                            <p className="text-lg font-semibold">{device.ninjaone_data.nodeClass || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Approval Status</label>
                                            <p className="text-lg font-semibold">{device.ninjaone_data.approvalStatus || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Operating System */}
                        {device.ninjaone_data.os && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Monitor className="w-5 h-5" />
                                        Operating System
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">OS Name</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.os.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Architecture</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.os.architecture || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Language</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.os.language || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Manufacturer</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.os.manufacturer || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Build Number</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.os.buildNumber || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Needs Reboot</label>
                                                <Badge className={device.ninjaone_data.os.needsReboot ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                                    {device.ninjaone_data.os.needsReboot ? 'Yes' : 'No'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="space-y-6">
                        {/* Hardware Information */}
                        {device.ninjaone_data.system && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Cpu className="w-5 h-5" />
                                        Hardware Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Manufacturer</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.system.manufacturer || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Model</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.system.model || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Chassis Type</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.system.chassisType || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Memory</label>
                                                <p className="text-lg font-semibold">{formatBytes(device.ninjaone_data.system.totalPhysicalMemory)}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Virtual Machine</label>
                                                <Badge className={device.ninjaone_data.system.virtualMachine ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                                                    {device.ninjaone_data.system.virtualMachine ? 'Yes' : 'No'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Processors</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.system.numberOfProcessors || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Domain</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.system.domain || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Domain Role</label>
                                                <p className="text-lg font-semibold">{device.ninjaone_data.system.domainRole || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Processor Information */}
                        {device.ninjaone_data.processors && device.ninjaone_data.processors.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Cpu className="w-5 h-5" />
                                        Processor Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {device.ninjaone_data.processors.map((processor, index) => (
                                            <div key={index} className="p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                                                        <p className="font-semibold">{processor.name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cores</label>
                                                        <p className="font-semibold">{processor.numCores}/{processor.numLogicalCores} cores</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Speed</label>
                                                        <p className="font-semibold">{formatSpeed(processor.maxClockSpeed)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'storage' && (
                    <div className="space-y-6">
                        {/* Storage Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HardDrive className="w-5 h-5" />
                                    Storage Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Capacity</p>
                                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {formatBytes(getTotalStorage(device.ninjaone_data.volumes))}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                        <p className="text-sm text-red-600 dark:text-red-400">Used Space</p>
                                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                                            {formatBytes(getUsedStorage(device.ninjaone_data.volumes))}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                        <p className="text-sm text-green-600 dark:text-green-400">Free Space</p>
                                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {formatBytes(getTotalStorage(device.ninjaone_data.volumes) - getUsedStorage(device.ninjaone_data.volumes))}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Storage Details */}
                        {device.ninjaone_data.volumes && device.ninjaone_data.volumes.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Volume Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {device.ninjaone_data.volumes.map((volume, index) => {
                                            const usagePercent = volume.capacity ? Math.round(((volume.capacity - (volume.freeSpace || 0)) / volume.capacity) * 100) : 0;
                                            return (
                                                <div key={index} className="p-4 border rounded-lg dark:border-gray-700">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-semibold text-lg">{volume.name || volume.label || 'Unnamed Volume'}</h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">{volume.fileSystem} • {volume.deviceType}</p>
                                                        </div>
                                                        <Badge className={usagePercent > 90 ? "bg-red-100 text-red-800" : usagePercent > 70 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                                                            {usagePercent}% Used
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span>Used: {formatBytes((volume.capacity || 0) - (volume.freeSpace || 0))}</span>
                                                            <span>Free: {formatBytes(volume.freeSpace)}</span>
                                                            <span>Total: {formatBytes(volume.capacity)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className={cn(
                                                                    "h-2 rounded-full transition-all",
                                                                    usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-yellow-500" : "bg-green-500"
                                                                )}
                                                                style={{ width: `${usagePercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'network' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Network Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Public IP Address</label>
                                        <p className="text-lg font-semibold font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                                            {device.ninjaone_data.publicIP || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">IP Addresses</label>
                                        <div className="mt-2 space-y-1">
                                            {Array.isArray(device.ninjaone_data.ipAddresses) 
                                                ? device.ninjaone_data.ipAddresses.map((ip, index) => (
                                                    <Badge key={index} variant="outline" className="mr-2 font-mono">
                                                        {ip}
                                                    </Badge>
                                                ))
                                                : <p className="text-gray-600 dark:text-gray-400">{device.ninjaone_data.ipAddresses || 'N/A'}</p>
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">MAC Addresses</label>
                                        <div className="mt-2 space-y-1">
                                            {Array.isArray(device.ninjaone_data.macAddresses) 
                                                ? device.ninjaone_data.macAddresses.map((mac, index) => (
                                                    <Badge key={index} variant="outline" className="mr-2 font-mono">
                                                        {mac}
                                                    </Badge>
                                                ))
                                                : <p className="text-gray-600 dark:text-gray-400">{device.ninjaone_data.macAddresses || 'N/A'}</p>
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Logged User</label>
                                        <p className="text-lg font-semibold">{device.ninjaone_data.lastLoggedInUser || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'health' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5" />
                                    Health Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Status</label>
                                            <Badge className={cn(
                                                "text-lg px-3 py-1 mt-1",
                                                device.health_status.status === 'healthy' ? "bg-green-100 text-green-800" :
                                                device.health_status.status === 'critical' ? "bg-red-100 text-red-800" :
                                                "bg-yellow-100 text-yellow-800"
                                            )}>
                                                {device.health_status.status}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Issues</label>
                                            <p className="text-2xl font-bold">{device.health_status.issuesCount}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Is Offline</label>
                                            <Badge className={device.health_status.isOffline ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                                {device.health_status.isOffline ? 'Yes' : 'No'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Issues</label>
                                            <p className="text-2xl font-bold text-red-600">{device.health_status.criticalCount}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Warning Issues</label>
                                            <p className="text-2xl font-bold text-yellow-600">{device.health_status.warningCount}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Contact</label>
                                            <p className="text-lg font-semibold">
                                                {device.health_status.lastContact 
                                                    ? new Date(device.health_status.lastContact * 1000).toLocaleString()
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Local Device Info */}
                        {device.local_device && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Link className="w-5 h-5" />
                                        Local Device Mapping
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Local Name</label>
                                                <p className="text-lg font-semibold">{device.local_device.name}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Model</label>
                                                <p className="text-lg font-semibold">{device.local_device.model?.name || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Brand</label>
                                                <p className="text-lg font-semibold">{device.local_device.brand?.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">System</label>
                                                <p className="text-lg font-semibold">{device.local_device.system?.name || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'alerts' && device.alerts.length > 0 && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Active Alerts ({device.alerts.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {device.alerts.map((alert, index) => (
                                        <div key={index} className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-r-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-red-800 dark:text-red-200">
                                                        {alert.message || 'Alert'}
                                                    </h4>
                                                    <div className="mt-2 space-y-1">
                                                        {alert.createdAt && (
                                                            <p className="text-sm text-red-600 dark:text-red-300">
                                                                <strong>Created:</strong> {new Date(alert.createdAt).toLocaleString()}
                                                            </p>
                                                        )}
                                                        {alert.severity && (
                                                            <Badge className={cn(
                                                                "text-xs",
                                                                alert.severity === 'CRITICAL' ? "bg-red-600 text-white" :
                                                                alert.severity === 'HIGH' ? "bg-orange-500 text-white" :
                                                                alert.severity === 'MEDIUM' ? "bg-yellow-500 text-white" :
                                                                "bg-blue-500 text-white"
                                                            )}>
                                                                {alert.severity}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function NinjaOneDevicesIndex({ devices, stats, connection_status, error_message }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [filterOrganization, setFilterOrganization] = useState<string>('all');
    const [filterLocation, setFilterLocation] = useState<string>('all');
    const [sortField, setSortField] = useState<SortField>('systemName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [selectedDevice, setSelectedDevice] = useState<NinjaOneDevice | null>(null);

    // Extract unique organizations and locations from devices
    const organizations = useMemo(() => {
        const orgs = new Map();
        devices.forEach(device => {
            if (device.ninjaone_data.organizationId) {
                const id = device.ninjaone_data.organizationId;
                if (!orgs.has(id)) {
                    orgs.set(id, {
                        id,
                        name: device.organization?.name || `Organization ${id}`,
                        count: 0
                    });
                }
                orgs.get(id).count++;
            }
        });
        return Array.from(orgs.values());
    }, [devices]);

    const locations = useMemo(() => {
        const locs = new Map();
        devices.forEach(device => {
            if (device.ninjaone_data.locationId) {
                const id = device.ninjaone_data.locationId;
                if (!locs.has(id)) {
                    locs.set(id, {
                        id,
                        name: device.location?.name || `Location ${id}`,
                        count: 0
                    });
                }
                locs.get(id).count++;
            }
        });
        return Array.from(locs.values());
    }, [devices]);

    // Filter and sort devices
    const filteredAndSortedDevices = useMemo(() => {
        const filtered = devices.filter(device => {
            // Search filter
            const matchesSearch = device.ninjaone_data.systemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                device.ninjaone_data.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                device.ninjaone_data.operatingSystem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                device.ninjaone_data.os?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                device.ninjaone_data.system?.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                device.ninjaone_data.system?.model?.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = 
                filterStatus === 'all' ||
                (filterStatus === 'online' && (!device.ninjaone_data.offline && device.ninjaone_data.online !== false)) ||
                (filterStatus === 'offline' && (device.ninjaone_data.offline || device.ninjaone_data.online === false)) ||
                (filterStatus === 'alerts' && device.alerts_count > 0) ||
                (filterStatus === 'mapped' && device.has_local_mapping) ||
                (filterStatus === 'unmapped' && !device.has_local_mapping);

            // Organization filter
            const matchesOrganization = filterOrganization === 'all' || 
                                      device.ninjaone_data.organizationId?.toString() === filterOrganization;

            // Location filter
            const matchesLocation = filterLocation === 'all' || 
                                  device.ninjaone_data.locationId?.toString() === filterLocation;

            return matchesSearch && matchesStatus && matchesOrganization && matchesLocation;
        });

        // Sort devices
        filtered.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch (sortField) {
                case 'systemName':
                    aValue = a.ninjaone_data.systemName || a.ninjaone_data.hostname || '';
                    bValue = b.ninjaone_data.systemName || b.ninjaone_data.hostname || '';
                    break;
                case 'organization':
                    aValue = a.organization?.name || '';
                    bValue = b.organization?.name || '';
                    break;
                case 'location':
                    aValue = a.location?.name || '';
                    bValue = b.location?.name || '';
                    break;
                case 'status':
                    aValue = (!a.ninjaone_data.offline && a.ninjaone_data.online !== false) ? 'online' : 'offline';
                    bValue = (!b.ninjaone_data.offline && b.ninjaone_data.online !== false) ? 'online' : 'offline';
                    break;
                case 'lastSeen':
                    // Priorizar lastContact si está disponible, sino lastSeenUtc
                    aValue = a.ninjaone_data.lastContact 
                        ? a.ninjaone_data.lastContact * 1000
                        : (a.ninjaone_data.lastSeenUtc ? new Date(a.ninjaone_data.lastSeenUtc).getTime() : 0);
                    bValue = b.ninjaone_data.lastContact 
                        ? b.ninjaone_data.lastContact * 1000
                        : (b.ninjaone_data.lastSeenUtc ? new Date(b.ninjaone_data.lastSeenUtc).getTime() : 0);
                    break;
                case 'deviceType':
                    aValue = a.ninjaone_data.deviceType || '';
                    bValue = b.ninjaone_data.deviceType || '';
                    break;
                case 'osName':
                    aValue = a.ninjaone_data.os?.name || a.ninjaone_data.operatingSystem || '';
                    bValue = b.ninjaone_data.os?.name || b.ninjaone_data.operatingSystem || '';
                    break;
                case 'processor':
                    aValue = a.ninjaone_data.processors?.[0]?.name || '';
                    bValue = b.ninjaone_data.processors?.[0]?.name || '';
                    break;
                case 'memory':
                    aValue = a.ninjaone_data.system?.totalPhysicalMemory || 0;
                    bValue = b.ninjaone_data.system?.totalPhysicalMemory || 0;
                    break;
                case 'storage':
                    aValue = getTotalStorage(a.ninjaone_data.volumes);
                    bValue = getTotalStorage(b.ninjaone_data.volumes);
                    break;
                case 'alerts':
                    aValue = a.alerts_count;
                    bValue = b.alerts_count;
                    break;
                default:
                    aValue = '';
                    bValue = '';
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sortDirection === 'asc' 
                ? (aValue > bValue ? 1 : -1)
                : (bValue > aValue ? 1 : -1);
        });

        return filtered;
    }, [devices, searchTerm, filterStatus, filterOrganization, filterLocation, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
        }
        return sortDirection === 'asc' 
            ? <ArrowUp className="w-4 h-4 text-blue-600" />
            : <ArrowDown className="w-4 h-4 text-blue-600" />;
    };

    const testConnection = async () => {
        try {
            toast.loading('Testing connection...', { id: 'test-connection' });
            
            const response = await fetch('/api/ninjaone/test-connection', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...createCSRFHeaders()
                },
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                toast.success(`Connection successful! Found ${data.device_count} devices.`, { id: 'test-connection' });
            } else {
                toast.error(`Connection failed: ${data.message}`, { id: 'test-connection' });
            }
        } catch (error) {
            toast.error('Error testing connection', { id: 'test-connection' });
            console.error('Test connection error:', error);
        }
    };

    const refreshDevices = async () => {
        try {
            toast.loading('Refreshing devices from NinjaOne...', { id: 'refresh-devices' });
            
            const response = await fetch('/api/ninjaone/devices/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...createCSRFHeaders()
                },
                credentials: 'same-origin'
            });

            // Log response status for debugging
            console.log('Refresh response status:', response.status);
            console.log('Refresh response headers:', Object.fromEntries(response.headers.entries()));

            const data = await response.json();
            console.log('Refresh response data:', data);
            
            if (response.ok && data.success) {
                toast.success(data.message || 'Devices refreshed successfully!', { id: 'refresh-devices' });
                // Refresh the page to show updated data
                setTimeout(() => window.location.reload(), 1000);
            } else {
                if (response.status === 401) {
                    toast.error('You are not authenticated. Please log in again.', { id: 'refresh-devices' });
                    console.error('Authentication failed. User may need to log in again.');
                } else if (response.status === 403) {
                    toast.error('You do not have permission to perform this action.', { id: 'refresh-devices' });
                } else if (response.status === 419) {
                    toast.error('CSRF token mismatch. Please refresh the page and try again.', { id: 'refresh-devices' });
                } else {
                    toast.error(data.message || `Error refreshing devices (${response.status})`, { id: 'refresh-devices' });
                }
            }
        } catch (error) {
            console.error('Refresh devices error:', error);
            toast.error('Network error while refreshing devices', { id: 'refresh-devices' });
        }
    };

    const syncDevice = async (deviceId: number) => {
        const device = devices.find(d => d.ninjaone_data.id === deviceId);
        
        if (!device) {
            toast.error('Device not found');
            return;
        }
        
        try {
            toast.loading('Syncing device to local database...', { id: `sync-${deviceId}` });
            
            const response = await fetch(`/api/ninjaone/devices/${deviceId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...createCSRFHeaders()
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    systemName: device.ninjaone_data.systemName,
                    hostname: device.ninjaone_data.hostname,
                    manufacturer: device.ninjaone_data.system?.manufacturer,
                    model: device.ninjaone_data.system?.model,
                    operatingSystem: device.ninjaone_data.operatingSystem || device.ninjaone_data.os?.name,
                    serialNumber: device.ninjaone_data.serialNumber || device.ninjaone_data.system?.serialNumber,
                    deviceId: deviceId
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                toast.success(data.message || 'Device synced successfully!', { id: `sync-${deviceId}` });
                // Refresh the page to show updated sync status
                setTimeout(() => window.location.reload(), 1000);
            } else {
                if (response.status === 401) {
                    toast.error('You are not authenticated. Please log in again.', { id: `sync-${deviceId}` });
                } else if (response.status === 403) {
                    toast.error('You do not have permission to perform this action.', { id: `sync-${deviceId}` });
                } else if (response.status === 404) {
                    // Mensaje específico para cuando no se encuentra dispositivo local para hacer match
                    const errorMessage = data.error || 'No local device found to match with this NinjaOne device';
                    toast.error(errorMessage, { 
                        id: `sync-${deviceId}`,
                        duration: 6000  // Mostrar por más tiempo para que el usuario pueda leer
                    });
                } else if (response.status === 400) {
                    // Mensaje específico para cuando el dispositivo ya está sincronizado
                    const errorMessage = data.error || 'Device is already synced to local database';
                    toast.error(errorMessage, { 
                        id: `sync-${deviceId}`,
                        duration: 4000
                    });
                } else {
                    const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
                    toast.error(errorMessage, { id: `sync-${deviceId}` });
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
            let errorMessage = 'Network error while syncing device';
            
            if (error instanceof Error) {
                if (error.message.includes('404')) {
                    errorMessage = 'Sync endpoint not found. Please verify the API route exists.';
                } else if (error.message.includes('403')) {
                    errorMessage = 'Permission denied. Please check authentication.';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Server error. Please check server logs.';
                }
            }
            
            toast.error(errorMessage, { id: `sync-${deviceId}` });
        }
    };

    return (
        <TooltipProvider>
            <AppLayout>
                <Head title="NinjaOne Devices Dashboard - Real-time Monitoring & Management" />

                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                                    Device Management Center
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                                    Monitor and manage all NinjaOne connected devices in real-time
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <Badge 
                                    variant={connection_status === 'connected' ? 'default' : 'destructive'}
                                    className={cn(
                                        "px-3 py-1",
                                        connection_status === 'connected' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    )}
                                >
                                    {connection_status === 'connected' ? (
                                        <>
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            NinjaOne Connected
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Connection Error
                                        </>
                                    )}
                                </Badge>
                                
                                <Button onClick={testConnection} variant="outline" size="sm">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Test Connection
                                </Button>
                                
                                <Button onClick={refreshDevices} variant="outline" size="sm">
                                    <Database className="w-4 h-4 mr-2" />
                                    Refresh Data
                                </Button>
                            </div>
                        </div>

                        {/* Connection Error Alert */}
                        {connection_status === 'error' && (
                            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
                                        <AlertTriangle className="w-5 h-5" />
                                        <div>
                                            <h3 className="font-semibold">NinjaOne Connection Error</h3>
                                            <p className="text-sm mt-1">{error_message}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-600 rounded-lg">
                                            <Monitor className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Devices</p>
                                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total_devices}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-600 rounded-lg">
                                            <Wifi className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-green-700 dark:text-green-300">Online</p>
                                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.online_devices}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-600 rounded-lg">
                                            <WifiOff className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-red-700 dark:text-red-300">Offline</p>
                                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.offline_devices}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50 border-yellow-200 dark:border-yellow-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-yellow-600 rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">With Alerts</p>
                                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.devices_with_alerts}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-600 rounded-lg">
                                            <Link className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Synced</p>
                                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.mapped_devices}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-600 rounded-lg">
                                            <Database className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Unsynced</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.unmapped_devices}</p>
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
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {/* Search */}
                                    <div className="lg:col-span-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                placeholder="Search devices, models, OS..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Status Filter */}
                                    <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Devices</SelectItem>
                                            <SelectItem value="online">Online Only</SelectItem>
                                            <SelectItem value="offline">Offline Only</SelectItem>
                                            <SelectItem value="alerts">With Alerts</SelectItem>
                                            <SelectItem value="mapped">Synced to Local</SelectItem>
                                            <SelectItem value="unmapped">Not Synced</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Organization Filter */}
                                    <Select value={filterOrganization} onValueChange={setFilterOrganization}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Organizations</SelectItem>
                                            {organizations.map(org => (
                                                <SelectItem key={org.id} value={org.id.toString()}>
                                                    {org.name} ({org.count})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Location Filter */}
                                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Locations</SelectItem>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                                    {loc.name} ({loc.count})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Activity className="w-4 h-4" />
                                    Showing {filteredAndSortedDevices.length} of {devices.length} devices
                                </div>
                            </CardContent>
                        </Card>

                        {/* Devices Table */}
                        <Card className="border-0 shadow-xl dark:shadow-gray-900/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Monitor className="w-5 h-5" />
                                    Device Inventory
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 ">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70">
                                                <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">
                                                    <button 
                                                        onClick={() => handleSort('systemName')}
                                                        className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        Device
                                                        {getSortIcon('systemName')}
                                                    </button>
                                                </th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">
                                                    <button 
                                                        onClick={() => handleSort('osName')}
                                                        className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        System Info
                                                        {getSortIcon('osName')}
                                                    </button>
                                                </th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">
                                                    <button 
                                                        onClick={() => handleSort('status')}
                                                        className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        Status
                                                        {getSortIcon('status')}
                                                    </button>
                                                </th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">
                                                    <button 
                                                        onClick={() => handleSort('organization')}
                                                        className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        Organization
                                                        {getSortIcon('organization')}
                                                    </button>
                                                </th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">
                                                    <button 
                                                        onClick={() => handleSort('location')}
                                                        className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        Location
                                                        {getSortIcon('location')}
                                                    </button>
                                                </th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">
                                                    <button 
                                                        onClick={() => handleSort('alerts')}
                                                        className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        Health
                                                        {getSortIcon('alerts')}
                                                    </button>
                                                </th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">
                                                    <button 
                                                        onClick={() => handleSort('lastSeen')}
                                                        className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        Last Seen
                                                        {getSortIcon('lastSeen')}
                                                    </button>
                                                </th>
                                                <th className="text-left py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndSortedDevices.length > 0 ? (
                                                filteredAndSortedDevices.map((device, index) => (
                                                    <DeviceTableRow 
                                                        key={device.ninjaone_data.id} 
                                                        device={device} 
                                                        index={index}
                                                        onSync={syncDevice}
                                                        onViewDetails={setSelectedDevice}
                                                    />
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={8} className="py-12 text-center">
                                                        <div className="space-y-3">
                                                            <Monitor className="h-12 w-12 text-gray-400 mx-auto" />
                                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                                No devices found
                                                            </h3>
                                                            <p className="text-gray-600 dark:text-gray-400">
                                                                {devices.length === 0 
                                                                    ? 'No devices are available in NinjaOne or there was a connection error.'
                                                                    : 'No devices match your current filters. Try adjusting your search criteria.'
                                                                }
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Device Details Modal */}
                        {selectedDevice && (
                            <Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
                                <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-white dark:bg-gray-900 border shadow-2xl">
                                    {/* Header con colores del sistema */}
                                    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-4 text-xl">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                        {selectedDevice.ninjaone_data.systemName || selectedDevice.ninjaone_data.hostname}
                                                    </h2>
                                                    
                                                </div>
                                            </DialogTitle>
                                        </DialogHeader>
                                        
                                        {/* Status badges en el header */}
                                        <div className="flex items-center gap-3 mt-4">
                                            <Badge className={cn(
                                                "px-3 py-1",
                                                (!selectedDevice.ninjaone_data.offline && selectedDevice.ninjaone_data.online !== false)
                                                    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800' 
                                                    : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800'
                                            )}>
                                                {(!selectedDevice.ninjaone_data.offline && selectedDevice.ninjaone_data.online !== false) ? (
                                                    <>
                                                        <Wifi className="w-3 h-3 mr-1" />
                                                        Online
                                                    </>
                                                ) : (
                                                    <>
                                                        <WifiOff className="w-3 h-3 mr-1" />
                                                        Offline
                                                    </>
                                                )}
                                            </Badge>
                                            
                                            <Badge className={cn(
                                                "px-3 py-1",
                                                selectedDevice.health_status.status === 'healthy' 
                                                    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
                                                    : selectedDevice.health_status.status === 'critical'
                                                    ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800'
                                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800'
                                            )}>
                                                <Activity className="w-3 h-3 mr-1" />
                                                {selectedDevice.health_status.status}
                                            </Badge>
                                            
                                            {selectedDevice.has_local_mapping && (
                                                <Badge className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800">
                                                    <Link className="w-3 h-3 mr-1" />
                                                    Synced
                                                </Badge>
                                            )}
                                            
                                            {selectedDevice.alerts_count > 0 && (
                                                <Badge className="px-3 py-1 bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    {selectedDevice.alerts_count} Alert{selectedDevice.alerts_count > 1 ? 's' : ''}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Content con scroll personalizado */}
                                    <div className="flex-1 overflow-hidden">
                                        <DeviceDetailsModal device={selectedDevice} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </AppLayout>
            
            {/* Custom scrollbar styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(156, 163, 175, 0.2);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(156, 163, 175, 0.5);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(156, 163, 175, 0.7);
                    }
                    /* Firefox */
                    .custom-scrollbar {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(156, 163, 175, 0.5) rgba(156, 163, 175, 0.2);
                    }
                    /* Dark mode */
                    .dark .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(75, 85, 99, 0.2);
                    }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(75, 85, 99, 0.5);
                    }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(75, 85, 99, 0.7);
                    }
                `
            }} />
        </TooltipProvider>
    );
}
