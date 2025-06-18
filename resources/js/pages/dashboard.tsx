import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    Timer,
    Download,    ExternalLink,
    RefreshCcw,
    FileSpreadsheet,
    Bell,
    Zap,
    UserPlus,
    AlertTriangle,
    X,
    User,
    Phone,
    Mail,    Monitor,    ChevronLeft,
    ChevronRight,
    Laptop,
    Check,
    Settings,
    MessageSquare,
    Info,
    AlertOctagon
} from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Cell,
    Pie,
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
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: React.ComponentType<{ className?: string }>;
    iconName?: string;
    color: string;
}

interface DashboardProps extends PageProps {
    metrics: {
        tickets: {
            total: number;
            open: number;
            in_progress: number;
            resolved: number;
            resolved_today: number;
            avg_resolution_hours: number;
            unassigned: number; // Añadido para tickets sin asignar
        };
        resources: {
            buildings: number;
            apartments: number;
            tenants: number;
            devices: number;
            technicals: number;
        };
    };    charts: {
        ticketsByStatus: Record<string, number>;
        ticketsLastWeek: Array<{ date: string; count: number }>;
        devicesByType: Array<{ 
            name: string; 
            count: number; 
            devices: Array<{
                id: number;
                device_name: string;
                device_type: string;
                brand_name: string;
                system_name: string;
                users_count: number;
            }>;
        }>;
        ticketsByPriority: Record<string, number>;
        ticketsByCategory: Record<string, number>;
    };    lists: {
        topTechnicals: Array<{ 
            id: number;
            name: string; 
            photo?: string; 
            email: string;
            phone?: string;
            shift?: string;
            is_default: boolean;
            tickets_count: number;
        }>;
        buildingsWithTickets: Array<{ 
            id: number;
            name: string; 
            image?: string; 
            apartments_count: number;
            tenants_count: number;
            tickets_count: number;
        }>;
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
        unassignedTickets: Array<{
            id: number;
            code: string;
            title: string;
            status: string;
            category: string;
            created_at: string;
            user?: { 
                tenant?: {
                    name: string;
                    apartment?: {
                        name: string;
                        building?: { name: string };
                    };
                };
            };
            device?: { 
                name?: string;
                name_device?: {
                    name: string;
                };
                apartment?: { 
                    name: string; 
                    building?: { name: string } 
                } 
            };
        }>;        
        problematicDevices: Array<{
            device_type: string;
            device_name: string;
            tickets_count: number;
        }>;
        allDevices: Array<{
            id: number;
            device_name: string;
            device_type: string;
            brand_name: string;
            system_name: string;
            users_count: number;
        }>;
        availableTechnicals: Array<{
            id: number;
            name: string;
            is_default: boolean;
        }>;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Chart colors
const CHART_COLORS = [
    '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', 
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
];

// Excel export functions
const exportToExcel = (data: Record<string, unknown>[], filename: string, sheetName: string = 'Data') => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(fileData, `${filename}.xlsx`);
};

export default function Dashboard() {
    const { metrics, charts, lists } = usePage<DashboardProps>().props;
    const pageProps = usePage().props as unknown as { auth: { user: { roles: { name: string }[]; technical?: { is_default: boolean } } } };
    const isSuperAdmin = pageProps?.auth?.user?.roles?.some((role) => role.name === 'super-admin') || false;
    const isDefaultTechnical = pageProps?.auth?.user?.technical?.is_default || false;
    const canAssignTickets = isSuperAdmin || isDefaultTechnical;    // States for modals and UI
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const buildingsContainerRef = useRef<HTMLDivElement>(null);    // Initialize notifications from localStorage or default values
    const getInitialNotifications = (): NotificationItem[] => {
        try {
            const saved = localStorage.getItem('dashboard_notifications');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Convert icon names back to components
                return parsed.map((notif: { iconName: string; [key: string]: unknown }) => ({
                    ...notif,
                    icon: notif.iconName === 'AlertCircle' ? AlertCircle :
                          notif.iconName === 'Info' ? Info :
                          notif.iconName === 'CheckCircle' ? CheckCircle :
                          notif.iconName === 'AlertOctagon' ? AlertOctagon :
                          notif.iconName === 'MessageSquare' ? MessageSquare : AlertCircle
                }));
            }
        } catch (error) {
            console.log('Error loading notifications from localStorage:', error);
        }
        
        // Default notifications if nothing in localStorage
        return [
            {
                id: 1,
                type: 'ticket',
                title: 'New Ticket Assigned',
                message: 'You have been assigned ticket #TCK-2024-001 for AC repair in Apt 204',
                time: '2 min ago',
                read: false,
                icon: AlertCircle,
                iconName: 'AlertCircle',
                color: 'text-red-500 bg-red-50'
            },
            {
                id: 2,
                type: 'system',
                title: 'System Update',
                message: 'Dashboard data has been refreshed with latest information',
                time: '15 min ago',
                read: false,
                icon: Info,
                iconName: 'Info',
                color: 'text-blue-500 bg-blue-50'
            },
            {
                id: 3,
                type: 'resolution',
                title: 'Ticket Resolved',
                message: 'Ticket #TCK-2024-035 has been successfully resolved',
                time: '1 hour ago',
                read: false,
                icon: CheckCircle,
                iconName: 'CheckCircle',
                color: 'text-green-500 bg-green-50'
            },
            {
                id: 4,
                type: 'urgent',
                title: 'Urgent Maintenance',
                message: 'Emergency repair needed in Building A - Elevator malfunction',
                time: '2 hours ago',
                read: true,
                icon: AlertOctagon,
                iconName: 'AlertOctagon',
                color: 'text-orange-500 bg-orange-50'
            },
            {
                id: 5,
                type: 'message',
                title: 'Team Message',
                message: 'Weekly team meeting scheduled for tomorrow at 10:00 AM',
                time: '1 day ago',
                read: true,
                icon: MessageSquare,
                iconName: 'MessageSquare',
                color: 'text-purple-500 bg-purple-50'
            }
        ];
    };

    // States for notifications
    const [notifications, setNotifications] = useState<NotificationItem[]>(getInitialNotifications);
    
    // Calculate unread notifications count
    const [unreadNotifications, setUnreadNotifications] = useState(() => {
        const initialNotifications = getInitialNotifications();
        return initialNotifications.filter((n: NotificationItem) => !n.read).length;
    });

    // States for last update tracking
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [updateText, setUpdateText] = useState<string>('Updated just now');
    
    // Function to calculate time since last update
    const calculateTimeSinceUpdate = (lastUpdateTime: Date): string => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60));
        
        if (diffInMinutes === 0) {
            return 'Updated just now';
        } else if (diffInMinutes === 1) {
            return 'Updated 1 min ago';
        } else if (diffInMinutes < 60) {
            return `Updated ${diffInMinutes} min ago`;
        } else {
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours === 1) {
                return 'Updated 1 hour ago';
            } else {
                return `Updated ${diffInHours} hours ago`;
            }
        }
    };

    // Function to handle refresh
    const handleRefresh = () => {
        const newUpdateTime = new Date();
        setLastUpdated(newUpdateTime);
        setUpdateText(calculateTimeSinceUpdate(newUpdateTime));
        
        // Reload the page to fetch fresh data
        router.reload();
    };    // Function to save notifications to localStorage
    const saveNotificationsToStorage = (notificationsList: NotificationItem[]) => {
        try {
            // Convert notifications to serializable format
            const serializable = notificationsList.map(notif => ({
                ...notif,
                icon: undefined, // Remove icon component
                iconName: notif.iconName
            }));
            localStorage.setItem('dashboard_notifications', JSON.stringify(serializable));
        } catch (error) {
            console.log('Error saving notifications to localStorage:', error);
        }
    };

    // Update the text every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setUpdateText(calculateTimeSinceUpdate(lastUpdated));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [lastUpdated]);

    // Functions to handle notifications
    const markAsRead = (notificationId: number) => {
        setNotifications((prev: NotificationItem[]) => {
            const updated = prev.map((notif: NotificationItem) => 
                notif.id === notificationId 
                    ? { ...notif, read: true }
                    : notif
            );
            saveNotificationsToStorage(updated);
            return updated;
        });
        
        // Update unread count
        setUnreadNotifications((prev: number) => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications((prev: NotificationItem[]) => {
            const updated = prev.map((notif: NotificationItem) => ({ ...notif, read: true }));
            saveNotificationsToStorage(updated);
            return updated;
        });
        setUnreadNotifications(0);
    };

    const clearNotification = (notificationId: number) => {
        setNotifications((prev: NotificationItem[]) => {
            const updated = prev.filter((notif: NotificationItem) => notif.id !== notificationId);
            saveNotificationsToStorage(updated);
            return updated;
        });
        
        // Update unread count if notification was unread
        const notification = notifications.find((n: NotificationItem) => n.id === notificationId);
        if (notification && !notification.read) {
            setUnreadNotifications((prev: number) => Math.max(0, prev - 1));
        }
    };

    // Function to handle ticket status clicks
    const handleTicketStatusClick = (status: string, count: number) => {
        console.log(`Clicked on ${status}: ${count} tickets`);
        window.open(`/tickets?status=${status}`, '_blank');
    };    // Prepare data for trend charts
    const trendData = charts.ticketsLastWeek.map(item => ({
        date: format(new Date(item.date), 'dd/MM'),
        tickets: item.count,
        average: Math.round(charts.ticketsLastWeek.reduce((sum, d) => sum + d.count, 0) / charts.ticketsLastWeek.length)
    }));

    return (
        <TooltipProvider>
            <AppLayout breadcrumbs={breadcrumbs}>                <Head title="Professional Dashboard" />
                
                {/* Custom styles for scrollbar */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                        .scrollbar-hide {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                        .scrollbar-hide::-webkit-scrollbar {
                            display: none;
                        }
                    `
                }} />
                
                {/* Main container with premium spacing */}
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
                    <div className="container mx-auto px-8 py-16 space-y-20">
                        
                        {/* Premium header with maximum spacing */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                            <div className="space-y-8">
                                <div className="flex items-center gap-8">
                                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl ring-4 ring-blue-100">
                                        <BarChart3 className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="space-y-4">                                        <h1 className="text-6xl font-black tracking-tight text-slate-900">
                                            Dashboard
                                        </h1><p className="text-2xl text-slate-600 font-medium">
                                            {isSuperAdmin 
                                                ? "Administrative control center of the system"
                                                : "Your personalized management panel"
                                            }
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Real-time status indicators */}
                                <div className="flex items-center gap-12">
                                    <div className="flex items-center gap-4">
                                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                                        <span className="text-lg font-bold text-slate-600">System Online</span>
                                    </div>                                    <div className="flex items-center gap-4">
                                        <Activity className="h-6 w-6 text-blue-500" />
                                        <span className="text-lg font-bold text-slate-600">{updateText}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Zap className="h-6 w-6 text-yellow-500" />
                                        <span className="text-lg font-bold text-slate-600">High Performance</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Main controls */}
                            <div className="flex flex-wrap items-center gap-6">                                <Button 
                                    variant="outline" 
                                    size="lg" 
                                    className="gap-4 h-14 px-8 shadow-xl text-lg"
                                    onClick={handleRefresh}
                                >
                                    <RefreshCcw className="h-6 w-6" />
                                    Refresh
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="lg"
                                    onClick={() => {                                        const allMetrics = {
                                            'Total Tickets': metrics.tickets.total,
                                            'Open Tickets': metrics.tickets.open,
                                            'In Progress Tickets': metrics.tickets.in_progress,
                                            'Resolved Tickets': metrics.tickets.resolved,
                                            'Resolved Today': metrics.tickets.resolved_today,
                                            'Average Time (hours)': metrics.tickets.avg_resolution_hours,
                                            'Buildings': metrics.resources.buildings,
                                            'Apartments': metrics.resources.apartments,
                                            'Tenants': metrics.resources.tenants,
                                            'Devices': metrics.resources.devices,
                                            'Technicians': metrics.resources.technicals
                                        };
                                        exportToExcel([allMetrics], 'dashboard_complete', 'General Metrics');
                                    }}
                                    className="gap-4 h-14 px-8 shadow-xl text-lg"
                                >
                                    <Download className="h-6 w-6" />
                                    Export All                                </Button>                               
                                
                                {/* Notifications Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="lg" className="gap-4 h-14 px-8 shadow-xl text-lg relative">
                                            <Bell className="h-6 w-6" />
                                            Notifications
                                            {unreadNotifications > 0 && (
                                                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                                                    {unreadNotifications}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-96 max-h-96 mt-4 " align="end">
                                        <DropdownMenuLabel className="flex items-center justify-between">
                                            <span className="text-lg font-semibold">Notifications</span>
                                            {unreadNotifications > 0 && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={markAllAsRead}
                                                    className="text-xs"
                                                >
                                                    Mark all as read
                                                </Button>
                                            )}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-slate-500">
                                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No notifications</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.map((notification: NotificationItem) => {
                                                    const IconComponent = notification.icon;
                                                    return (
                                                        <DropdownMenuItem 
                                                            key={notification.id}
                                                            className={`p-0 focus:bg-slate-50 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                                                        >
                                                            <div className="w-full p-4 flex items-start gap-3">
                                                                <div className={`p-2 rounded-lg ${notification.color} flex-shrink-0`}>
                                                                    <IconComponent className="h-4 w-4" />
                                                                </div>
                                                                
                                                                <div className="flex-1 space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className={`text-sm font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                                                            {notification.title}
                                                                        </h4>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-xs text-slate-500">
                                                                                {notification.time}
                                                                            </span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    clearNotification(notification.id);
                                                                                }}
                                                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <p className={`text-sm ${!notification.read ? 'text-slate-700' : 'text-slate-600'}`}>
                                                                        {notification.message}
                                                                    </p>
                                                                    
                                                                    {!notification.read && (
                                                                        <div className="flex items-center gap-2 mt-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    markAsRead(notification.id);
                                                                                }}
                                                                                className="h-7 px-3 text-xs hover:text-accent-foreground"
                                                                            >
                                                                                <Check className="h-3 w-3 mr-1" />
                                                                                Mark as read
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                {!notification.read && (
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                                                )}
                                                            </div>
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        
                                        <DropdownMenuSeparator />
                                     {/*   <DropdownMenuItem className="p-0">
                                            <Button 
                                                variant="ghost" 
                                                className="w-full justify-center py-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => {
                                                    // Here you could navigate to a full notifications page
                                                    console.log('View all notifications');
                                                }}
                                            >
                                                <Settings className="h-4 w-4 mr-2" />
                                                Notification Settings
                                            </Button>
                                        </DropdownMenuItem> */}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>  
                                                
                                                
                                                {/* SECTION 1: KEY TICKET METRICS */}
                        <div className="space-y-12">
                            <div className="text-center space-y-6">                                <h2 className="text-4xl font-bold text-slate-800">
                                    Ticket Analytics
                                </h2>
                                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                    Real-time monitoring of workflow and performance metrics
                                </p>
                            </div>
                            
                            {/* Perfectly aligned metrics grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Card 1: Total Tickets */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-blue-100">
                                                <Ticket className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <ExternalLink 
                                                className="h-4 w-4 text-blue-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => window.open('/tickets', '_blank')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Total Tickets</p>
                                            <p className="text-3xl font-bold text-slate-900">{metrics.tickets.total}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                                    +12%
                                                </span>
                                                <span className="text-xs text-slate-500">vs last month</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 2: Critical Tickets */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-red-50 via-white to-red-50 overflow-hidden cursor-pointer"
                                      onClick={() => window.open('/tickets?status=open', '_blank')}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-red-100">
                                                <AlertCircle className="h-6 w-6 text-red-600" />
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Open Tickets</p>
                                            <p className="text-3xl font-bold text-slate-900">{metrics.tickets.open}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">                                                    Priority
                                                </span>
                                                <span className="text-xs text-slate-500">Immediate attention</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 3: In Progress */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-amber-50 via-white to-amber-50 overflow-hidden cursor-pointer"
                                      onClick={() => window.open('/tickets?status=in_progress', '_blank')}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-amber-100">
                                                <Clock className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider">In Progress</p>
                                            <p className="text-3xl font-bold text-slate-900">{metrics.tickets.in_progress}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                                                    +8%
                                                </span>
                                                <span className="text-xs text-slate-500">This week</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 4: Resolved */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-hidden cursor-pointer"
                                      onClick={() => window.open('/tickets?status=resolved', '_blank')}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-emerald-100">
                                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Resolved</p>
                                            <p className="text-3xl font-bold text-slate-900">{metrics.tickets.resolved}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                                    +15%
                                                </span>
                                                <span className="text-xs text-slate-500">vs target</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Additional metrics cards - Second row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Card 5: Unassigned (only visible for admins and default technicians) */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-orange-50 via-white to-orange-50 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">                                            <div className="p-3 rounded-xl bg-orange-100">
                                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                                            </div>
                                            {canAssignTickets && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="h-8 px-3 text-xs hover:bg-orange-50 border-orange-200 text-orange-700"
                                                    onClick={() => window.open('/tickets/assign-unassigned', '_blank')}
                                                >
                                                    <UserPlus className="h-3 w-3 mr-1" />
                                                    Assign
                                                </Button>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider">Unassigned</p>
                                            <p className="text-3xl font-bold text-slate-900">{metrics.tickets.unassigned || 0}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                                                    Pending
                                                </span>
                                                <span className="text-xs text-slate-500">Requires assignment</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 6: Resolved Today */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-purple-50 via-white to-purple-50 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-purple-100">
                                                <Calendar className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Resolved Today</p>
                                            <p className="text-3xl font-bold text-slate-900">{metrics.tickets.resolved_today}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                                    Hoy
                                                </span>
                                                <span className="text-xs text-slate-500">Productividad diaria</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 7: Average Time */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-indigo-100">
                                                <Timer className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                -2h
                                            </span>
                                        </div>                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Average Time</p>
                                            <p className="text-3xl font-bold text-slate-900">{metrics.tickets.avg_resolution_hours}h</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                                    Resolution
                                                </span>
                                                <span className="text-xs text-slate-500">Overall average</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 8: Efficiency */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-teal-50 via-white to-teal-50 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-teal-100">
                                                <BarChart3 className="h-6 w-6 text-teal-600" />
                                            </div>
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider">Efficiency</p>
                                            <p className="text-3xl font-bold text-slate-900">
                                                {metrics.tickets.total > 0 
                                                    ? Math.round((metrics.tickets.resolved / metrics.tickets.total) * 100)
                                                    : 0}%
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-teal-100 text-teal-700">
                                                    Resolución
                                                </span>
                                                <span className="text-xs text-slate-500">Tasa general</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>                            </div>
                        </div>

                      
                                     {/* SECTION: UNASSIGNED TICKETS TABLE  canAssignTickets &&*/}
                        { lists.unassignedTickets && lists.unassignedTickets.length > 0 && (
                            <div className="space-y-8">
                                <div className="text-center space-y-4">                                    <h2 className="text-4xl font-bold text-orange-600">
                                        Unassigned Tickets
                                    </h2>
                                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                        Recent tickets awaiting technical assignment - quick actions available
                                    </p>
                                </div>
                                
                                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 via-white to-slate-50">                                    <CardHeader className="border-b border-slate-100 bg-slate-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-orange-100">
                                                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl text-slate-800">Latest Unassigned Tickets</CardTitle>
                                                    <p className="text-sm text-slate-600 mt-1">Showing {lists.unassignedTickets.length} most recent unassigned tickets</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                                                onClick={() => window.open('/tickets', '_blank')}
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Bulk Assign
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-100">
                                                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Ticket</th>
                                                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Location</th>
                                                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Device</th>
                                                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Category</th>
                                                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Created</th>
                                                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Actions</th>
                                                    </tr>
                                                </thead>                                                <tbody>
                                                    {lists.unassignedTickets.length > 0 ? (
                                                        lists.unassignedTickets.map((ticket, index) => (
                                                            <UnassignedTicketRow 
                                                                key={ticket.id} 
                                                                ticket={ticket} 
                                                                index={index} 
                                                                technicals={lists.availableTechnicals}
                                                            />
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="py-12 text-center">
                                                                <div className="space-y-3">
                                                                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                                                                    <p className="text-lg font-semibold text-slate-600">All tickets are assigned!</p>
                                                                    <p className="text-sm text-slate-500">Great job keeping up with the workflow.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}             

                          {/* SECTION 2: SYSTEM RESOURCES */}
                        {metrics.resources.buildings > 0 && (
                            <div className="space-y-8">
                                <div className="text-center space-y-4">
                                    <div className="flex items-center justify-center gap-4">                                        <h2 className="text-4xl font-bold text-slate-800">
                                            System Resources
                                        </h2>
                                        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2 text-sm font-semibold">
                                            Full Access - Admin
                                        </Badge>
                                    </div>
                                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                        Comprehensive management of buildings, apartments, users and devices
                                    </p>
                                </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Buildings Card - Enhanced with carousel */}
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-violet-50 via-white to-violet-50 overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-4">
                                                <div className="p-4 rounded-xl bg-violet-100 w-fit mx-auto">
                                                    <Building className="h-8 w-8 text-violet-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider">Buildings</p>
                                                    <p className="text-3xl font-bold text-slate-900">{metrics.resources.buildings}</p>
                                                </div>
                                                
                                                {/* Buildings Carousel */}
                                                {lists.buildingsWithTickets && lists.buildingsWithTickets.length > 0 && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-semibold text-violet-600">Buildings Overview</h4>
                                                            {lists.buildingsWithTickets.length > 3 && (
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={() => {
                                                                            const container = buildingsContainerRef.current;
                                                                            if (container) {
                                                                                container.scrollBy({ left: -200, behavior: 'smooth' });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <ChevronLeft className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={() => {
                                                                            const container = buildingsContainerRef.current;
                                                                            if (container) {
                                                                                container.scrollBy({ left: 200, behavior: 'smooth' });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <ChevronRight className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div 
                                                            ref={buildingsContainerRef}
                                                            className="flex gap-2 overflow-x-auto scrollbar-hide"
                                                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                                        >
                                                            {lists.buildingsWithTickets.map((building) => (
                                                                <div
                                                                    key={building.id}
                                                                    className="flex-shrink-0 group/building cursor-pointer"
                                                                    title={`${building.name} - ${building.apartments_count} apartments, ${building.tenants_count} tenants`}
                                                                    onClick={() => window.open(`/buildings/${building.id}`, '_blank')}
                                                                >
                                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-200 to-violet-400 flex items-center justify-center transition-transform shadow-lg">
                                                                        {building.image ? (
                                                                            <img 
                                                                                src={`/storage/${building.image}`}
                                                                                alt={building.name}
                                                                                className="w-full h-full rounded-full object-cover"
                                                                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                                   e.currentTarget.src = '/images/default-builder-square.png'; // Ruta de imagen por defecto
                                                                               }}
                                                                            />
                                                                        ) : (
                                                                            <Building className="h-6 w-6 text-white" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center justify-center gap-2">
                                                    <ExternalLink className="h-3 w-3 text-violet-400" />
                                                    <span className="text-xs text-slate-500">View management</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>                                   
                                     {/* Apartments Card - Enhanced with building breakdown */}
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden cursor-pointer"
                                          onClick={() => window.open('/apartments', '_blank')}>
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-4">
                                                <div className="p-4 rounded-xl bg-blue-100 w-fit mx-auto">
                                                    <Home className="h-8 w-8 text-blue-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Apartments</p>
                                                    <p className="text-3xl font-bold text-slate-900">{metrics.resources.apartments}</p>
                                                </div>
                                                
                                                {/* Buildings Circles for Apartments */}
                                                {lists.buildingsWithTickets && lists.buildingsWithTickets.length > 0 && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-semibold text-blue-600">By Building</h4>
                                                            {lists.buildingsWithTickets.length > 3 && (
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const container = document.getElementById('apartments-container');
                                                                            if (container) {
                                                                                container.scrollBy({ left: -200, behavior: 'smooth' });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <ChevronLeft className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const container = document.getElementById('apartments-container');
                                                                            if (container) {
                                                                                container.scrollBy({ left: 200, behavior: 'smooth' });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <ChevronRight className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div 
                                                            id="apartments-container"
                                                            className="flex gap-2 overflow-x-auto scrollbar-hide"
                                                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                                        >
                                                            {lists.buildingsWithTickets.map((building) => (
                                                                <div
                                                                    key={`apt-${building.id}`}
                                                                    className="flex-shrink-0 group/building cursor-pointer flex flex-col items-center gap-1"
                                                                    title={`${building.name}: ${building.apartments_count} apartments`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(`/buildings/${building.id}/apartments`, '_blank');
                                                                    }}
                                                                >
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center  transition-transform shadow-lg">
                                                                        {building.image ? (
                                                                            <img 
                                                                                 src={`/storage/${building.image}`}
                                                                                alt={building.name}
                                                                                className="w-full h-full rounded-full object-cover"
                                                                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                                   e.currentTarget.src = '/images/default-builder-square.png'; // Ruta de imagen por defecto
                                                                               }}
                                                                            
                                                                            />
                                                                        ) : (
                                                                            <Building className="h-5 w-5 text-white" />
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-bold text-blue-700 min-w-0 text-center">
                                                                        {building.apartments_count}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                              {/*  <div className="flex items-center justify-center gap-2">
                                                    <ExternalLink className="h-3 w-3 text-blue-400" />
                                                    <span className="text-xs text-slate-500">View management</span>
                                                </div> */}
                                            </div>
                                        </CardContent>
                                    </Card>                                    
                                    {/* Tenants Card - Enhanced with building breakdown */}
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-hidden cursor-pointer"
                                          onClick={() => window.open('/tenants', '_blank')}>
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-4">
                                                <div className="p-4 rounded-xl bg-emerald-100 w-fit mx-auto">
                                                    <Users className="h-8 w-8 text-emerald-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Members</p>
                                                    <p className="text-3xl font-bold text-slate-900">{metrics.resources.tenants}</p>
                                                </div>
                                                
                                                {/* Buildings Circles for Tenants */}
                                                {lists.buildingsWithTickets && lists.buildingsWithTickets.length > 0 && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-semibold text-emerald-600">By Building</h4>
                                                            {lists.buildingsWithTickets.length > 3 && (
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const container = document.getElementById('tenants-container');
                                                                            if (container) {
                                                                                container.scrollBy({ left: -200, behavior: 'smooth' });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <ChevronLeft className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const container = document.getElementById('tenants-container');
                                                                            if (container) {
                                                                                container.scrollBy({ left: 200, behavior: 'smooth' });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <ChevronRight className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div 
                                                            id="tenants-container"
                                                            className="flex gap-2 overflow-x-auto scrollbar-hide"
                                                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                                        >
                                                            {lists.buildingsWithTickets.map((building) => (
                                                                <div
                                                                    key={`tenant-${building.id}`}
                                                                    className="flex-shrink-0 group/building cursor-pointer flex flex-col items-center gap-1"
                                                                    title={`${building.name}: ${building.tenants_count} tenants`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(`/buildings/${building.id}/tenants`, '_blank');
                                                                    }}
                                                                >
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-400 flex items-center justify-center  transition-transform shadow-lg">
                                                                        {building.image ? (
                                                                            <img 
                                                                                  src={`/storage/${building.image}`}
                                                                                alt={building.name}
                                                                                className="w-full h-full rounded-full object-cover"
                                                                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                                    e.currentTarget.src = '/images/default-builder-square.png'; // Ruta de imagen por defecto
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <Building className="h-5 w-5 text-white" />
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-bold text-emerald-700 min-w-0 text-center">
                                                                        {building.tenants_count}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                               {/* <div className="flex items-center justify-center gap-2">
                                                    <ExternalLink className="h-3 w-3 text-emerald-400" />
                                                    <span className="text-xs text-slate-500">Ver gestión</span>
                                                </div> */}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Devices Card - Enhanced with modal */}
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-amber-50 via-white to-amber-50 overflow-hidden cursor-pointer"
                                          onClick={() => setShowDevicesModal(true)}>
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-4">
                                                <div className="p-4 rounded-xl bg-amber-100 w-fit mx-auto">
                                                    <Smartphone className="h-8 w-8 text-amber-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Devices</p>
                                                    <p className="text-3xl font-bold text-slate-900">{metrics.resources.devices}</p>
                                                </div>
                                                
                                                {/* Device types preview */}
                                                {/*charts.devicesByType && charts.devicesByType.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-amber-600">By Type</h4>
                                                        <div className="space-y-1">
                                                            {charts.devicesByType.slice(0, 3).map((deviceType) => (
                                                                <div key={deviceType.name} className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-600 truncate">
                                                                        {deviceType.name}
                                                                    </span>
                                                                    <span className="font-semibold text-amber-700">{deviceType.count}</span>
                                                                </div>
                                                            ))}
                                                            {charts.devicesByType.length > 3 && (
                                                                <div className="text-xs text-slate-500">+{charts.devicesByType.length - 3} more</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )*/}
                                                
                                                <div className="flex items-center justify-center gap-2">
                                                    <Monitor className="h-3 w-3 text-amber-400" />
                                                    <span className="text-xs text-slate-500">Click to view details</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Technicals Enhanced Section */}
                                {isSuperAdmin && lists.topTechnicals && lists.topTechnicals.length > 0 && (
                                    <div className="mt-8">
                                        <Card className="border-0 bg-gradient-to-br from-rose-50 via-white to-rose-50 shadow-xl">
                                            <CardHeader className="border-b border-rose-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-rose-100">
                                                            <Wrench className="h-5 w-5 text-rose-600" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-xl text-slate-800">Technical Team</CardTitle>
                                                            <p className="text-sm text-slate-600 mt-1">{lists.topTechnicals.length} active technicians</p>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                                                        onClick={() => window.open('/technicals', '_blank')}
                                                    >
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        View All
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {lists.topTechnicals.map((technical) => (
                                                        <div key={technical.id} className="bg-white rounded-xl p-4 shadow-lg border border-rose-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="relative">
                                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-rose-400 flex items-center justify-center overflow-hidden">
                                                                        {technical.photo ? (
                                                                            <img 
                                                                                src={technical.photo} 
                                                                                alt={technical.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <User className="h-6 w-6 text-white" />
                                                                        )}
                                                                    </div>
                                                                    {technical.is_default && (
                                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                                                                            <span className="text-xs">★</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="font-semibold text-slate-800 text-sm truncate">{technical.name}</h4>
                                                                        {technical.is_default && (
                                                                            <Badge variant="secondary" className="text-xs px-1 py-0">Default</Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        {technical.email && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Mail className="h-3 w-3 text-slate-400" />
                                                                                <span className="text-xs text-slate-600 truncate">{technical.email}</span>
                                                                            </div>
                                                                        )}
                                                                        {technical.phone && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Phone className="h-3 w-3 text-slate-400" />
                                                                                <span className="text-xs text-slate-600">{technical.phone}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-1">
                                                                                <Ticket className="h-3 w-3 text-blue-500" />
                                                                                <span className="text-xs font-semibold text-blue-700">{technical.tickets_count} tickets</span>
                                                                            </div>
                                                                            {technical.shift && (
                                                                                <span className="text-xs text-slate-500 capitalize">{technical.shift}</span>
                                                                            )}
                                                                        </div>
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
                        )}
                          {/* SECTION 3: VISUAL ANALYSIS AND CHARTS */}
                        <div className="space-y-16">
                            <div className="text-center space-y-6">
                                <h2 className="text-5xl font-black text-slate-800">
                                    Visual Analysis
                                </h2>
                                <p className="text-2xl text-slate-600 max-w-3xl mx-auto font-semibold">
                                    Interactive charts and trends to monitor system performance
                                </p>
                                <div className="flex justify-center gap-6">
                                   {/* <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => window.open('/reports', '_blank')}
                                        className="gap-4 h-14 px-8 shadow-xl border-blue-200 hover:bg-blue-50 text-blue-700 text-lg"
                                    >
                                        <BarChart className="h-6 w-6" />
                                        Ver Reportes Completos
                                    </Button> */}
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
                                            exportToExcel(allMetrics, 'dashboard_complete_analysis', 'Dashboard Analysis');
                                        }}
                                        className="gap-4 h-14 px-8 shadow-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-500 text-emerald-700 text-lg"
                                    >
                                        <Download className="h-6 w-6" />
                                        Export Complete Analysis
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-20 lg:grid-cols-12">
                                {/* Main Chart - Ticket Distribution */}
                                <div className="lg:col-span-6">
                                    <Card className="h-full border-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 shadow-2xl overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
                                        <CardHeader className="pb-12 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-4">
                                                    <CardTitle className="text-3xl font-black text-slate-900">Ticket Distribution</CardTitle>
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
                                                            exportToExcel(chartData, 'tickets_by_status', 'Ticket Distribution');
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
                                                    <CardTitle className="text-3xl font-black text-slate-900">Weekly Trend</CardTitle>
                                                    <p className="text-xl text-slate-600 font-semibold">Ticket evolution over the last 7 days</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        onClick={() => {
                                                            exportToExcel(trendData, 'weekly_tickets_trend', 'Weekly Trend');
                                                        }}
                                                        className="h-14 w-14 p-0 hover:bg-indigo-50 shadow-xl"
                                                    >
                                                        <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                                                    </Button>
                                                   {/* <Button
                                                        variant="outline"
                                                        size="lg"
                                                        onClick={() => window.open('/reports/trends', '_blank')}
                                                        className="h-14 w-14 p-0 hover:bg-indigo-50 shadow-xl"
                                                    >
                                                        <BarChart className="h-6 w-6 text-indigo-600" />
                                                    </Button> */}
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
                                                                name === 'tickets' ? 'Daily Total' : 'Average'
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
                                                            dataKey="average" 
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
                        <div className="mt-32">                            <Card className="border-0 bg-slate-900 text-white shadow-2xl overflow-hidden relative">
                                <div className="absolute inset-0 bg-blue-600/10"></div>
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
                                                <p className="text-blue-200 font-bold text-lg">Total Processed</p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-center space-y-4">
                                            <div className="p-6 rounded-3xl bg-green-500/20 w-fit mx-auto">
                                                <TrendingUp className="h-10 w-10 text-green-300" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black text-white">98.5%</p>
                                                <p className="text-green-200 font-bold text-lg">Uptime</p>
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
                                                <p className="text-purple-200 font-bold text-lg">Active Users</p>
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
                                                <p className="text-yellow-200 font-bold text-lg">Response Time</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>                        </div>
                          </div>
                </div>

                {/* Devices Modal */}
                {showDevicesModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-amber-100">
                                        <Smartphone className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">Device Management</h2>
                                        <p className="text-slate-600">Complete overview of all devices in the system</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={() => setShowDevicesModal(false)}
                                    className="rounded-full hover:bg-slate-100"
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                {lists.allDevices && lists.allDevices.length > 0 ? (
                                    <div className="space-y-6">
                                        {/* Device Summary Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                                <CardContent className="p-4 text-center">
                                                    <Monitor className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                                    <h3 className="font-semibold text-blue-800">Total Devices</h3>
                                                    <p className="text-2xl font-bold text-blue-900">{lists.allDevices.length}</p>
                                                </CardContent>
                                            </Card>
                                            
                                            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                                <CardContent className="p-4 text-center">
                                                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                                    <h3 className="font-semibold text-green-800">Active Users</h3>
                                                    <p className="text-2xl font-bold text-green-900">
                                                        {lists.allDevices.reduce((sum, device) => sum + device.users_count, 0)}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                            
                                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                                <CardContent className="p-4 text-center">
                                                    <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                                    <h3 className="font-semibold text-purple-800">Device Types</h3>
                                                    <p className="text-2xl font-bold text-purple-900">
                                                        {new Set(lists.allDevices.map(d => d.device_type)).size}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Devices Table */}
                                        <Card className="border-0 shadow-lg">
                                            <CardHeader className="pb-6 border-b">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-xl text-slate-800">Device Inventory</CardTitle>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const deviceData = lists.allDevices.map(device => ({
                                                                'Device Name': device.device_name,
                                                                'Type': device.device_type,
                                                                'Brand': device.brand_name,
                                                                'System': device.system_name,
                                                                'Active Users': device.users_count
                                                            }));
                                                            exportToExcel(deviceData, 'devices_inventory', 'Devices');
                                                        }}
                                                        className="gap-2"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Export
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b border-slate-100">
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Device</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Type</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Brand</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">System</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Users</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {lists.allDevices.map((device, index) => (
                                                                <tr key={device.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                                                                    <td className="py-3 px-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                                                                                <Laptop className="h-4 w-4 text-amber-600" />
                                                                            </div>
                                                                           {/* <div>
                                                                                <p className="font-semibold text-slate-800 text-sm">{device.device_name}</p>
                                                                                <p className="text-xs text-slate-500">ID: {device.id}</p>
                                                                            </div> */}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                            {device.device_type}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <span className="text-sm font-medium text-slate-700">{device.brand_name}</span>
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <span className="text-sm text-slate-600">{device.system_name}</span>
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <Users className="h-4 w-4 text-green-500" />
                                                                            <span className="font-semibold text-green-700">{device.users_count}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <Badge 
                                                                            variant="outline" 
                                                                            className={device.users_count > 0 
                                                                                ? "bg-green-50 text-green-700 border-green-200" 
                                                                                : "bg-gray-50 text-gray-600 border-gray-200"
                                                                            }
                                                                        >
                                                                            {device.users_count > 0 ? 'Active' : 'Unused'}
                                                                        </Badge>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Smartphone className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-slate-600 mb-2">No Devices Found</h3>
                                        <p className="text-slate-500">No device data is available at the moment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </AppLayout>
        </TooltipProvider>
    );
}

// Component for unassigned ticket rows
interface UnassignedTicketRowProps {
    ticket: {
        id: number;
        code: string;
        title: string;
        status: string;
        category: string;
        created_at: string;
        user?: { 
            tenant?: {
                name: string;
                apartment?: {
                    name: string;
                    building?: { name: string };
                };
            };
        };
        device?: { 
            name?: string;
            name_device?: {
                name: string;
            };
            apartment?: { 
                name: string; 
                building?: { name: string } 
            } 
        };
    };
    index: number;
    technicals: Array<{
        id: number;
        name: string;
        is_default: boolean;
    }>;
}

function UnassignedTicketRow({ ticket, index, technicals }: UnassignedTicketRowProps) {
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedTech, setSelectedTech] = useState<number | null>(null);

    const handleAssign = async () => {
        if (!selectedTech) {
            toast.error('Please select a technician');
            return;
        }

        setIsAssigning(true);
          try {
            const response = await fetch(`/tickets/${ticket.id}/assign-technical`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ technical_id: selectedTech })
            });            if (response.ok) {
                await response.json();
                toast.success('Ticket assigned successfully!');
                // Recargar la página para mostrar datos actualizados
                router.reload({ only: ['lists'] });
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to assign ticket');
            }
        } catch (error) {
            toast.error('Error assigning ticket');
            console.error('Assignment error:', error);
        } finally {
            setIsAssigning(false);
        }
    };const getStatusBadge = (status: string) => {
        const statusStyles: Record<string, string> = {
            open: 'bg-red-100 text-red-700 border-red-200',
            in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
            resolved: 'bg-green-100 text-green-700 border-green-200',
            closed: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        
        return (
            <Badge variant="outline" className={`${statusStyles[status] || statusStyles.open} capitalize`}>
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    const getCategoryBadge = (category: string) => {
        const categoryColors: Record<string, string> = {
            Hardware: 'bg-blue-100 text-blue-700',
            Software: 'bg-purple-100 text-purple-700',
            Network: 'bg-green-100 text-green-700',
            Maintenance: 'bg-orange-100 text-orange-700',
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category] || 'bg-gray-100 text-gray-700'}`}>
                {category}
            </span>
        );
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    };

    return (
        <tr className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
            <td className="py-4 px-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">{ticket.code}</span>
                        {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-sm text-slate-600 max-w-xs truncate" title={ticket.title}>
                        {ticket.title}
                    </p>
                </div>
            </td>
            <td className="py-4 px-6">
                <div className="text-sm">
                    <p className="font-medium text-slate-800">
                        {ticket.user?.tenant?.apartment?.building?.name || 'Unknown Building'}
                    </p>
                    <p className="text-slate-600">
                        {ticket.user?.tenant?.apartment?.name || 'Unknown Apt'}
                    </p>
                </div>
            </td>
            <td className="py-4 px-6">
                <div className="text-sm">
                    <p className="font-medium text-slate-800">
                        {ticket.device?.name_device?.name || 'Unknown Device'}
                    </p>
                    <p className="text-slate-600">
                        {ticket.device?.name || 'N/A'}
                    </p>
                </div>
            </td>
            <td className="py-4 px-6">
                {getCategoryBadge(ticket.category)}
            </td>
            <td className="py-4 px-6">
                <div className="text-sm">
                    <p className="text-slate-800">{formatTimeAgo(ticket.created_at)}</p>
                    <p className="text-slate-500 text-xs">{format(new Date(ticket.created_at), 'MMM dd, HH:mm')}</p>
                </div>
            </td>
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <Select value={selectedTech?.toString() || ""} onValueChange={(value) => setSelectedTech(Number(value))}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue placeholder="Select tech" />
                        </SelectTrigger>                        <SelectContent>
                            {technicals.length > 0 ? (
                                technicals.map((tech) => (
                                    <SelectItem key={tech.id} value={tech.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <span>{tech.name}</span>
                                            {tech.is_default && (
                                                <Badge variant="secondary" className="text-xs px-1 py-0">Default</Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="" disabled>
                                    No technicians available
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleAssign}
                        disabled={!selectedTech || isAssigning}
                        className="h-8 px-3 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                    >
                        {isAssigning ? (
                            <RefreshCcw className="h-3 w-3 animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="h-3 w-3 mr-1" />
                                Assign
                            </>
                        )}
                    </Button>
                </div>
            </td>
        </tr>
    );
}
