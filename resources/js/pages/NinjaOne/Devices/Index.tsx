import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
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
    Laptop
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

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
}

interface Stats {
    total_devices: number;
    online_devices: number;
    offline_devices: number;
    mapped_devices: number;
    unmapped_devices: number;
    devices_with_alerts: number;
}

interface Props {
    devices: NinjaOneDevice[];
    stats: Stats;
    connection_status: 'connected' | 'error';
    error_message?: string;
}

export default function NinjaOneDevicesIndex({ devices, stats, connection_status, error_message }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'alerts'>('all');

    // Filter devices based on search and status
    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.ninjaone_data.systemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            device.ninjaone_data.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            device.ninjaone_data.operatingSystem?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = 
            filterStatus === 'all' ||
            (filterStatus === 'online' && device.ninjaone_data.online) ||
            (filterStatus === 'offline' && !device.ninjaone_data.online) ||
            (filterStatus === 'alerts' && device.alerts_count > 0);

        return matchesSearch && matchesFilter;
    });

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
                return 'bg-green-100 text-green-800 border-green-200';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'offline':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const testConnection = async () => {
        try {
            const response = await fetch('/api/ninjaone/test-connection');
            const data = await response.json();
            
            if (data.status === 'success') {
                toast.success(`Connection successful! Found ${data.device_count} devices.`);
            } else {
                toast.error(`Connection failed: ${data.message}`);
            }
        } catch {
            toast.error('Error testing connection');
        }
    };

    const refreshDevices = async () => {
        try {
            toast.loading('Refreshing devices...', { id: 'refresh-devices' });
            
            const response = await fetch('/api/ninjaone/devices/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.ok) {
                toast.success('Devices refreshed successfully!', { id: 'refresh-devices' });
                window.location.reload();
            } else {
                toast.error('Error refreshing devices', { id: 'refresh-devices' });
            }
        } catch {
            toast.error('Error refreshing devices', { id: 'refresh-devices' });
        }
    };

    const checkApiRoutes = async () => {
        toast.loading('Checking API routes...', { id: 'check-routes' });
        
        const routes = [
            '/api/ninjaone/test-connection',
            '/api/ninjaone/devices',
            '/api/ninjaone/devices/refresh',
            '/api/ninjaone/devices/123/sync'
        ];
        
        for (const route of routes) {
            try {
                const response = await fetch(route, { method: 'HEAD' });
                console.log(`Route ${route}: ${response.status} ${response.statusText}`);
            } catch (error) {
                console.log(`Route ${route}: Failed to connect`, error);
            }
        }
        
        toast.success('Route check completed. See console for details.', { id: 'check-routes' });
    };

    const syncDevice = async (deviceId: number) => {
        const device = devices.find(d => d.ninjaone_data.id === deviceId);
        console.log('Attempting to sync device:', {
            id: deviceId,
            systemName: device?.ninjaone_data.systemName,
            hostname: device?.ninjaone_data.hostname,
            manufacturer: device?.ninjaone_data.manufacturer,
            model: device?.ninjaone_data.model,
            hasLocalMapping: device?.has_local_mapping
        });
        
        try {
            toast.loading('Syncing device...', { id: `sync-${deviceId}` });
            
            const response = await fetch(`/api/ninjaone/devices/${deviceId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    systemName: device?.ninjaone_data.systemName,
                    hostname: device?.ninjaone_data.hostname,
                    manufacturer: device?.ninjaone_data.manufacturer,
                    model: device?.ninjaone_data.model,
                    operatingSystem: device?.ninjaone_data.operatingSystem,
                    deviceId: deviceId
                })
            });

            console.log('Response status:', response.status);
            console.log('Response statusText:', response.statusText);
            console.log('Response url:', response.url);

            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const textResponse = await response.text();
                console.log('Non-JSON response:', textResponse);
                
                // If it's a 404, the route probably doesn't exist
                if (response.status === 404) {
                    toast.error('Sync endpoint not found. Please check if the API route exists.', { id: `sync-${deviceId}` });
                    return;
                }
                
                throw new Error(`Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 200)}`);
            }
            
            console.log('Sync response:', data);
            
            if (response.ok && data.success) {
                toast.success(data.message || 'Device synced successfully!', { id: `sync-${deviceId}` });
                setTimeout(() => window.location.reload(), 1000);
            } else {
                const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
                toast.error(errorMessage, { id: `sync-${deviceId}` });
                console.error('Sync error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
                
                if (data.details) {
                    console.error('Detailed error:', data.details);
                }
            }
        } catch (error: unknown) {
            console.error('Sync error details:', {
                error: error,
                deviceId: deviceId,
                device: device
            });
            
            let errorMessage = 'Network error while syncing device';
            
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                
                if (error.message.includes('404')) {
                    errorMessage = 'Sync endpoint not found. Please verify the API route exists.';
                } else if (error.message.includes('403')) {
                    errorMessage = 'Permission denied. Please check authentication.';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Server error. Please check server logs.';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Network connection failed. Check your internet connection and CORS settings.';
                } else if (error.message.includes('NetworkError')) {
                    errorMessage = 'Network error. The API endpoint might not exist or be accessible.';
                } else {
                    errorMessage = `Error: ${error.message}`;
                }
            }
            
            toast.error(errorMessage, { id: `sync-${deviceId}` });
        }
    };

    return (
        <AppLayout>
            <Head title="NinjaOne Devices Dashboard" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">NinjaOne Integration Dashboard</h1>
                        <p className="text-gray-600 mt-1">Real-time device monitoring and management</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Badge 
                            variant={connection_status === 'connected' ? 'default' : 'destructive'}
                            className={connection_status === 'connected' ? 'bg-green-100 text-green-800' : ''}
                        >
                            {connection_status === 'connected' ? (
                                <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Connected
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
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Devices
                        </Button>
                        
                        <Button onClick={checkApiRoutes} variant="outline" size="sm">
                            <Database className="w-4 h-4 mr-2" />
                            Check API Routes
                        </Button>
                    </div>
                </div>

                {/* Connection Error Alert */}
                {connection_status === 'error' && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-red-800">
                                <AlertTriangle className="w-5 h-5" />
                                <div>
                                    <h3 className="font-semibold">Connection Error</h3>
                                    <p className="text-sm mt-1">{error_message}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Monitor className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Devices</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_devices}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Wifi className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Online</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.online_devices}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <WifiOff className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Offline</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.offline_devices}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">With Alerts</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.devices_with_alerts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Link className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Mapped</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.mapped_devices}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Database className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Unmapped</p>
                                    <p className="text-2xl font-bold text-gray-600">{stats.unmapped_devices}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search devices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'online' | 'offline' | 'alerts')}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="online">Online</TabsTrigger>
                            <TabsTrigger value="offline">Offline</TabsTrigger>
                            <TabsTrigger value="alerts">With Alerts</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Devices Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDevices.map((device) => (
                        <Card key={device.ninjaone_data.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${device.ninjaone_data.online ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            {getDeviceIcon(device.ninjaone_data.deviceType, device.ninjaone_data.operatingSystem)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{device.ninjaone_data.systemName || device.ninjaone_data.hostname}</h3>
                                            <p className="text-sm text-gray-600">{device.ninjaone_data.operatingSystem}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {device.ninjaone_data.online ? (
                                            <Badge className="bg-green-100 text-green-800">
                                                <Wifi className="w-3 h-3 mr-1" />
                                                Online
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <WifiOff className="w-3 h-3 mr-1" />
                                                Offline
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Health Status */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Health Status:</span>
                                    <Badge className={getStatusColor(device.health_status.status)}>
                                        {device.health_status.status}
                                    </Badge>
                                </div>

                                {/* Issues Count */}
                                {device.health_status.issuesCount > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Issues:</span>
                                        <Badge variant="destructive">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            {device.health_status.issuesCount}
                                        </Badge>
                                    </div>
                                )}

                                {/* Alerts */}
                                {device.alerts_count > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Active Alerts:</span>
                                        <Badge variant="destructive">
                                            {device.alerts_count}
                                        </Badge>
                                    </div>
                                )}

                                {/* Local Mapping Status */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Local Mapping:</span>
                                    {device.has_local_mapping ? (
                                        <Badge className="bg-purple-100 text-purple-800">
                                            <Link className="w-3 h-3 mr-1" />
                                            Mapped
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">
                                            Not Mapped
                                        </Badge>
                                    )}
                                </div>

                                {/* Device Info */}
                                <div className="pt-3 border-t space-y-2">
                                    {device.ninjaone_data.serialNumber && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Serial:</span>
                                            <span className="font-mono">{device.ninjaone_data.serialNumber}</span>
                                        </div>
                                    )}
                                    
                                    {device.ninjaone_data.manufacturer && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Manufacturer:</span>
                                            <span>{device.ninjaone_data.manufacturer}</span>
                                        </div>
                                    )}
                                    
                                    {device.ninjaone_data.model && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Model:</span>
                                            <span>{device.ninjaone_data.model}</span>
                                        </div>
                                    )}
                                    
                                    {device.ninjaone_data.ipAddress && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">IP:</span>
                                            <span className="font-mono">{device.ninjaone_data.ipAddress}</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">NinjaOne ID:</span>
                                        <span className="font-mono">{device.ninjaone_data.id}</span>
                                    </div>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Last Seen:</span>
                                        <span>{new Date(device.ninjaone_data.lastSeenUtc).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-3 border-t">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <Eye className="w-4 h-4 mr-2" />
                                                Details
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Device Details: {device.ninjaone_data.systemName}</DialogTitle>
                                            </DialogHeader>
                                            <DeviceDetailsModal device={device} />
                                        </DialogContent>
                                    </Dialog>

                                    {!device.has_local_mapping && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => syncDevice(device.ninjaone_data.id)}
                                            className="flex-1"
                                            title={`Sync device: ${device.ninjaone_data.systemName || device.ninjaone_data.hostname}`}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Sync to Local
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Empty State */}
                {filteredDevices.length === 0 && (
                    <Card className="p-12 text-center">
                        <Monitor className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No devices found</h3>
                        <p className="text-gray-600">
                            {devices.length === 0 
                                ? 'No devices are available in NinjaOne or there was a connection error.'
                                : 'No devices match your current filters.'
                            }
                        </p>
                    </Card>
                )}
            </div>
        </AppLayout>
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
                        <span className="text-gray-600">System Name:</span>
                        <p className="font-medium">{device.ninjaone_data.systemName}</p>
                    </div>
                    <div>
                        <span className="text-gray-600">Hostname:</span>
                        <p className="font-medium">{device.ninjaone_data.hostname}</p>
                    </div>
                    <div>
                        <span className="text-gray-600">Operating System:</span>
                        <p className="font-medium">{device.ninjaone_data.operatingSystem}</p>
                    </div>
                    <div>
                        <span className="text-gray-600">Serial Number:</span>
                        <p className="font-medium">{device.ninjaone_data.serialNumber || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Health Status */}
            <div>
                <h4 className="font-semibold mb-3">Health Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Status:</span>
                        <p className="font-medium">{device.health_status.status}</p>
                    </div>
                    <div>
                        <span className="text-gray-600">Total Issues:</span>
                        <p className="font-medium">{device.health_status.issuesCount}</p>
                    </div>
                    <div>
                        <span className="text-gray-600">Critical Issues:</span>
                        <p className="font-medium text-red-600">{device.health_status.criticalCount}</p>
                    </div>
                    <div>
                        <span className="text-gray-600">Warning Issues:</span>
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
                            <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="font-medium">{alert.message || 'Alert'}</span>
                                </div>
                                {alert.createdAt && (
                                    <p className="text-sm text-gray-600 mt-1">
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
                            <span className="text-gray-600">Local Name:</span>
                            <p className="font-medium">{device.local_device.name}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Brand:</span>
                            <p className="font-medium">{device.local_device.brand?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Model:</span>
                            <p className="font-medium">{device.local_device.model?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">System:</span>
                            <p className="font-medium">{device.local_device.system?.name || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
