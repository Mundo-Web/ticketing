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
    ExternalLink,
    MapPin,
    Clock
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
        hostname: string;
        operatingSystem: string;
        online: boolean;
        lastSeenUtc: string;
        serialNumber?: string;
        deviceType?: string;
        manufacturer?: string;
        model?: string;
        ipAddress?: string;
        macAddress?: string;
        organizationId?: number;
        locationId?: number;
        approvalStatus?: string;
        nodeRoleId?: number;
        nodeClass?: string;
        lastContact?: number;
        lastUpdate?: number;
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
        lastContact: number;
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

type SortField = 'systemName' | 'organization' | 'location' | 'status' | 'lastSeen' | 'deviceType' | 'alerts';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'online' | 'offline' | 'alerts' | 'mapped' | 'unmapped';

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

    const formatLastSeen = (lastSeenUtc: string) => {
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
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        device.ninjaone_data.online 
                            ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
                    )}>
                        <div className={cn(
                            device.ninjaone_data.online 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-gray-600 dark:text-gray-400'
                        )}>
                            {getDeviceIcon(device.ninjaone_data.deviceType, device.ninjaone_data.operatingSystem)}
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {device.ninjaone_data.systemName || device.ninjaone_data.hostname || 'Unknown Device'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {device.ninjaone_data.operatingSystem}
                        </p>
                        {device.ninjaone_data.manufacturer && device.ninjaone_data.model && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {device.ninjaone_data.manufacturer} {device.ninjaone_data.model}
                            </p>
                        )}
                    </div>
                </div>
            </td>

            {/* Status */}
            <td className="py-4 px-6">
                <div className="flex flex-col gap-2">
                    <Badge className={cn(
                        "w-fit",
                        device.ninjaone_data.online 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    )}>
                        {device.ninjaone_data.online ? (
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
                            {formatLastSeen(device.ninjaone_data.lastSeenUtc)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {device.ninjaone_data.lastSeenUtc ? new Date(device.ninjaone_data.lastSeenUtc).toLocaleDateString() : '-'}
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

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(`https://ninjaone.com/device/${device.ninjaone_data.id}`, '_blank')}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Open in NinjaOne</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </td>
        </tr>
    );
}

// Component for device details modal
function DeviceDetailsModal({ device }: { device: NinjaOneDevice }) {
    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <div>
                <h4 className="font-semibold mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">System Name:</span>
                        <p className="font-medium">{device.ninjaone_data.systemName || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">Hostname:</span>
                        <p className="font-medium">{device.ninjaone_data.hostname || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">Operating System:</span>
                        <p className="font-medium">{device.ninjaone_data.operatingSystem || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">Serial Number:</span>
                        <p className="font-medium">{device.ninjaone_data.serialNumber || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">IP Address:</span>
                        <p className="font-medium">{device.ninjaone_data.ipAddress || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">MAC Address:</span>
                        <p className="font-medium">{device.ninjaone_data.macAddress || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Health Status */}
            <div>
                <h4 className="font-semibold mb-3">Health Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <p className="font-medium">{device.health_status.status}</p>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">Total Issues:</span>
                        <p className="font-medium">{device.health_status.issuesCount}</p>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">Critical Issues:</span>
                        <p className="font-medium text-red-600">{device.health_status.criticalCount}</p>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">Warning Issues:</span>
                        <p className="font-medium text-yellow-600">{device.health_status.warningCount}</p>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {device.alerts.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-3">Active Alerts ({device.alerts.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {device.alerts.map((alert, index) => (
                            <div key={index} className="p-3 border rounded-lg dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="font-medium">{alert.message || 'Alert'}</span>
                                </div>
                                {alert.createdAt && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Created: {new Date(alert.createdAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Local Device Info */}
            {device.local_device && (
                <div>
                    <h4 className="font-semibold mb-3">Local Device Mapping</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Local Name:</span>
                            <p className="font-medium">{device.local_device.name}</p>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Brand:</span>
                            <p className="font-medium">{device.local_device.brand?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Model:</span>
                            <p className="font-medium">{device.local_device.model?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">System:</span>
                            <p className="font-medium">{device.local_device.system?.name || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            )}
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
                                device.ninjaone_data.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                device.ninjaone_data.model?.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = 
                filterStatus === 'all' ||
                (filterStatus === 'online' && device.ninjaone_data.online) ||
                (filterStatus === 'offline' && !device.ninjaone_data.online) ||
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
                    aValue = a.ninjaone_data.online ? 'online' : 'offline';
                    bValue = b.ninjaone_data.online ? 'online' : 'offline';
                    break;
                case 'lastSeen':
                    aValue = new Date(a.ninjaone_data.lastSeenUtc).getTime();
                    bValue = new Date(b.ninjaone_data.lastSeenUtc).getTime();
                    break;
                case 'deviceType':
                    aValue = a.ninjaone_data.deviceType || '';
                    bValue = b.ninjaone_data.deviceType || '';
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
                    ...createCSRFHeaders(),
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
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
                    ...createCSRFHeaders(),
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                toast.success(data.message || 'Devices refreshed successfully!', { id: 'refresh-devices' });
                // Refresh the page to show updated data
                setTimeout(() => window.location.reload(), 1000);
            } else {
                if (response.status === 401) {
                    toast.error('You are not authenticated. Please log in again.', { id: 'refresh-devices' });
                    // Optionally redirect to login
                    // window.location.href = '/login';
                } else if (response.status === 403) {
                    toast.error('You do not have permission to perform this action.', { id: 'refresh-devices' });
                } else {
                    toast.error(data.message || 'Error refreshing devices', { id: 'refresh-devices' });
                }
            }
        } catch (error) {
            toast.error('Network error while refreshing devices', { id: 'refresh-devices' });
            console.error('Refresh devices error:', error);
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
                    ...createCSRFHeaders(),
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    systemName: device.ninjaone_data.systemName,
                    hostname: device.ninjaone_data.hostname,
                    manufacturer: device.ninjaone_data.manufacturer,
                    model: device.ninjaone_data.model,
                    operatingSystem: device.ninjaone_data.operatingSystem,
                    serialNumber: device.ninjaone_data.serialNumber,
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
                    // Optionally redirect to login
                    // window.location.href = '/login';
                } else if (response.status === 403) {
                    toast.error('You do not have permission to perform this action.', { id: `sync-${deviceId}` });
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
                <Head title="NinjaOne Devices Dashboard - Real-time Monitoring" />

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
                            <CardContent className="p-0">
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
                                                    <td colSpan={7} className="py-12 text-center">
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
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-3">
                                            <Monitor className="w-5 h-5" />
                                            Device Details: {selectedDevice.ninjaone_data.systemName || selectedDevice.ninjaone_data.hostname}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <DeviceDetailsModal device={selectedDevice} />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </AppLayout>
        </TooltipProvider>
    );
}
