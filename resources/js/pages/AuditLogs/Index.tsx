import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/pagination';
import {
    Search,
    Filter,
    Download,
    Eye,
    MoreHorizontal,
    Calendar,
    User,
    Activity,
    Clock,
    Globe,
    Trash2,
    RefreshCw,
    Shield,
    Database,
    Users,
    TrendingUp,
    FileText,
    Settings,
    AlertCircle,
    CheckCircle,
    XCircle,
    Edit,
    Plus,
    Minus,
    Building,
    Ticket,
    Wrench,
    Smartphone,
    CalendarDays,
    UserCheck,
    Home,
    Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

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

interface FilterData {
    users: Array<{ id: number; name: string; email: string }>;
    actionTypes: string[];
    modelTypes: Array<{ value: string; label: string }>;
    ipAddresses: string[];
}

interface Stats {
    total_logs: number;
    today_logs: number;
    week_logs: number;
    month_logs: number;
    unique_users_today: number;
}

interface Props {
    auditLogs: {
        data: AuditLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        user_id?: string;
        action_type?: string;
        model_type?: string;
        date_from?: string;
        date_to?: string;
        ip_address?: string;
    };
    filterData: FilterData;
    stats: Stats;
}

export default function AuditLogsIndex({ auditLogs, filters, filterData, stats }: Props) {
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedUser, setSelectedUser] = useState(filters.user_id || 'all');
    const [selectedAction, setSelectedAction] = useState(filters.action_type || 'all');
    const [selectedModel, setSelectedModel] = useState(filters.model_type || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [selectedIP, setSelectedIP] = useState(filters.ip_address || 'all');

    const handleSearch = () => {
        router.get(route('audit-logs.index'), {
            search: searchTerm,
            user_id: selectedUser === 'all' ? '' : selectedUser,
            action_type: selectedAction === 'all' ? '' : selectedAction,
            model_type: selectedModel === 'all' ? '' : selectedModel,
            date_from: dateFrom,
            date_to: dateTo,
            ip_address: selectedIP === 'all' ? '' : selectedIP,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedUser('all');
        setSelectedAction('all');
        setSelectedModel('all');
        setDateFrom('');
        setDateTo('');
        setSelectedIP('all');
        router.get(route('audit-logs.index'));
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => setIsRefreshing(false),
        });
    };

    const handleExport = () => {
        window.open(route('audit-logs.export', filters));
    };

    const getActionIcon = (actionType: string) => {
        switch (actionType) {
            case 'created':
                return <Plus className="h-3 w-3" />;
            case 'updated':
                return <Edit className="h-3 w-3" />;
            case 'deleted':
                return <Minus className="h-3 w-3" />;
            case 'login':
                return <CheckCircle className="h-3 w-3" />;
            case 'logout':
                return <XCircle className="h-3 w-3" />;
            default:
                return <Activity className="h-3 w-3" />;
        }
    };

    const getModelIcon = (modelType: string | null) => {
        if (!modelType) return <Package className=" min-h-4 min-w-4 max-h-4 max-w-4 text-slate-400" />;

        switch (modelType.toLowerCase()) {
            case 'building':
                return <Building className="min-h-4 min-w-4 max-h-4 max-w-4 text-blue-600" />;
            case 'ticket':
                return <Ticket className="min-h-4 min-w-4 max-h-4 max-w-4 text-green-600" />;
            case 'technical':
                return <Wrench className="min-h-4 min-w-4 max-h-4 max-w-4 text-orange-600" />;
            case 'device':
                return <Smartphone className="min-h-4 min-w-4 max-h-4 max-w-4 text-purple-600" />;
            case 'appointment':
                return <CalendarDays className="min-h-4 min-w-4 max-h-4 max-w-4 text-indigo-600" />;
            case 'tenant':
                return <UserCheck className="min-h-4 min-w-4 max-h-4 max-w-4 text-teal-600" />;
            case 'user':
                return <User className="min-h-4 min-w-4 max-h-4 max-w-4 text-pink-600" />;
            case 'apartment':
                return <Home className="min-h-4 min-w-4 max-h-4 max-w-4 text-amber-600" />;
            default:
                return <Package className="min-h-4 min-w-4 max-h-4 max-w-4 text-slate-500" />;
        }
    };

    const getModelBadgeColor = (modelType: string | null) => {
        if (!modelType) return 'bg-slate-100 text-slate-600 border-slate-200';

        switch (modelType.toLowerCase()) {
            case 'building':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'ticket':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'technical':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'device':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'appointment':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'tenant':
                return 'bg-teal-50 text-teal-700 border-teal-200';
            case 'user':
                return 'bg-pink-50 text-pink-700 border-pink-200';
            case 'apartment':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getActionBadgeVariant = (actionType: string) => {
        switch (actionType) {
            case 'created':
                return 'default';
            case 'updated':
                return 'secondary';
            case 'deleted':
                return 'destructive';
            case 'login':
                return 'default';
            case 'logout':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const getStatIcon = (type: string) => {
        switch (type) {
            case 'total':
                return <Database className="h-5 w-5" />;
            case 'today':
                return <Clock className="h-5 w-5" />;
            case 'week':
                return <TrendingUp className="h-5 w-5" />;
            case 'month':
                return <Calendar className="h-5 w-5" />;
            case 'users':
                return <Users className="h-5 w-5" />;
            default:
                return <Activity className="h-5 w-5" />;
        }
    };

    return (
        <AppLayout>
            <Head title="Security Audit Logs" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="container mx-auto px-4 py-8 space-y-8">
                    {/* Enhanced Header */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-10"></div>
                        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                        <Shield className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                            Security Audit Logs
                                        </h1>
                                        <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">
                                            Comprehensive system activity monitoring and security tracking
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="bg-white/50 hover:bg-white/80 border-slate-200 shadow-sm transition-all duration-200"
                                    >
                                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        Refresh Data
                                    </Button>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                                    Total Activity
                                </CardTitle>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                                    {getStatIcon('total')}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {stats.total_logs.toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    All-time records
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group animate-in slide-in-from-bottom-4 delay-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-green-600 transition-colors duration-200">
                                    Today's Activity
                                </CardTitle>
                                <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                                    {getStatIcon('today')}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {stats.today_logs.toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Events logged today
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group animate-in slide-in-from-bottom-4 delay-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-purple-600 transition-colors duration-200">
                                    This Week
                                </CardTitle>
                                <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                                    {getStatIcon('week')}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {stats.week_logs.toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Weekly activity
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group animate-in slide-in-from-bottom-4 delay-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-orange-600 transition-colors duration-200">
                                    This Month
                                </CardTitle>
                                <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                                    {getStatIcon('month')}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {stats.month_logs.toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Monthly activity
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group animate-in slide-in-from-bottom-4 delay-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 transition-colors duration-200">
                                    Active Users
                                </CardTitle>
                                <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                                    {getStatIcon('users')}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {stats.unique_users_today.toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Unique users today
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Enhanced Filters Section */}
                    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-0 shadow-xl">
                        <CardHeader className="pb-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg">
                                    <Filter className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                                        Advanced Filters
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-400">
                                        Refine your search with powerful filtering options
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="search" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Search Query
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="search"
                                            placeholder="Search descriptions, routes, IPs..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        User Filter
                                    </Label>
                                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="All users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All users</SelectItem>
                                            {filterData.users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Action Type
                                    </Label>
                                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="All actions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All actions</SelectItem>
                                            {filterData.actionTypes.map((action) => (
                                                <SelectItem key={action} value={action}>
                                                    {action.charAt(0).toUpperCase() + action.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Model Type
                                    </Label>
                                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="All models" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All models</SelectItem>
                                            {filterData.modelTypes.map((model) => (
                                                <SelectItem key={model.value} value={model.value}>
                                                    {model.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_from" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Date From
                                    </Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_to" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Date To
                                    </Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        IP Address
                                    </Label>
                                    <Select value={selectedIP} onValueChange={setSelectedIP}>
                                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="All IP addresses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All IP addresses</SelectItem>
                                            {filterData.ipAddresses.map((ip) => (
                                                <SelectItem key={ip} value={ip}>
                                                    {ip}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end space-x-2">
                                    <Button
                                        onClick={handleSearch}
                                        className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-primary transition-all duration-200"
                                    >
                                        <Search className="h-4 w-4 mr-2" />
                                        Apply Filters
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleClearFilters}
                                        className="bg-white hover:text-primary hover:bg-slate-50 border-slate-200"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Enhanced Data Table */}
                    <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600 border-b border-slate-200/50 dark:border-slate-700/50 p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                        <FileText className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                            Audit Trail Records
                                        </CardTitle>
                                        <CardDescription className="text-lg text-slate-600 dark:text-slate-400 mt-2 font-medium">
                                            Showing <span className="font-bold text-blue-600">{auditLogs.from}</span>-<span className="font-bold text-blue-600">{auditLogs.to}</span> of <span className="font-bold text-indigo-600">{auditLogs.total.toLocaleString()}</span> records
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 px-4 py-2 text-sm font-semibold shadow-sm">
                                        <Database className="h-4 w-4 mr-2" />
                                        {auditLogs.total.toLocaleString()} Total Records
                                    </Badge>

                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table className="min-w-full">
                                    <TableHeader>
                                        <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600 border-b-2 border-slate-200 dark:border-slate-600 transition-all duration-300">
                                            <TableHead className="font-bold text-slate-900 dark:text-white py-4 px-4 text-sm uppercase tracking-wide min-w-[180px]">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span>User</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-bold text-slate-900 dark:text-white py-4 px-4 text-sm uppercase tracking-wide min-w-[140px]">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                        <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span>Action</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-bold text-slate-900 dark:text-white py-4 px-4 text-sm uppercase tracking-wide min-w-[160px]">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                        <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <span>Model</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-bold text-slate-900 dark:text-white py-4 px-4 text-sm uppercase tracking-wide min-w-[220px]">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                                        <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <span>Description</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-bold text-slate-900 dark:text-white py-4 px-4 text-sm uppercase tracking-wide min-w-[140px]">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                        <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <span>IP Address</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-bold text-slate-900 dark:text-white py-4 px-4 text-sm uppercase tracking-wide min-w-[160px]">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <span>Timestamp</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-bold text-slate-900 dark:text-white py-4 px-4 text-sm uppercase tracking-wide text-center min-w-[120px]">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                        <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <span>Actions</span>
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {auditLogs.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-12">
                                                    <div className="flex flex-col items-center space-y-3">
                                                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                            <AlertCircle className="h-8 w-8 text-slate-400" />
                                                        </div>
                                                        <div className="text-lg font-medium text-slate-600 dark:text-slate-400">
                                                            No audit records found
                                                        </div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-500">
                                                            Try adjusting your filters or search criteria
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            auditLogs.data.map((log, index) => (
                                                <TableRow
                                                    key={log.id}
                                                    className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-slate-800/50 dark:hover:to-slate-700/50 transition-all duration-300 border-b border-slate-100 dark:border-slate-800 group ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/30'
                                                        }`}
                                                >
                                                    <TableCell className="py-4 px-4">
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                                                {log.user?.name || 'System'}
                                                            </div>
                                                            {log.user?.email && (
                                                                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate mt-1">
                                                                    {log.user.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4">
                                                        <Badge
                                                            variant={getActionBadgeVariant(log.action_type)}
                                                            className="flex items-center justify-center space-x-1 w-fit px-2 py-2 font-semibold text-xs shadow-sm group-hover:shadow-md transition-all duration-300 whitespace-nowrap"
                                                        >
                                                            {getActionIcon(log.action_type)}
                                                       
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4">
                                                        {log.model_type ? (
                                                            <div className="flex items-center space-x-2">
                                                                <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 flex-shrink-0">
                                                                    {getModelIcon(log.model_type)}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                                                        {log.readable_model}
                                                                    </div>
                                                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border shadow-sm mt-1 whitespace-nowrap ${getModelBadgeColor(log.model_type)}`}>
                                                                        {log.model_type}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center space-x-2">
                                                                <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 flex-shrink-0">
                                                                    {getModelIcon(null)}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-bold text-slate-500 dark:text-slate-400 italic text-sm truncate">
                                                                        System Action
                                                                    </div>
                                                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-600 border-slate-200 shadow-sm mt-1 whitespace-nowrap">
                                                                        No Model
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4">
                                                        <div className="max-w-[200px]">
                                                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 font-medium leading-relaxed" title={log.description || ''}>
                                                                {log.description || 'No description available'}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="p-2 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 flex-shrink-0">
                                                                <Globe className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                                            </div>
                                                            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md truncate">
                                                                {log.ip_address || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 flex-shrink-0">
                                                                <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                                    {format(new Date(log.created_at), 'MMM dd, yyyy', {
                                                                        locale: enUS,
                                                                    })}
                                                                </div>
                                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                                    {format(new Date(log.created_at), 'HH:mm:ss', {
                                                                        locale: enUS,
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4 text-center">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setSelectedLog(log)}
                                                                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 dark:hover:text-blue-400 transition-all duration-300 shadow-sm hover:shadow-md px-2 py-1 font-semibold h-8 w-8 p-0"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-7xl min-w-[55vw] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-2xl">
                                                                <DialogHeader className="pb-8 border-b border-slate-200 dark:border-slate-700">
                                                                    <DialogTitle className="text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-4">
                                                                        <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl shadow-lg animate-pulse">
                                                                            <Shield className="h-8 w-8 text-white" />
                                                                        </div>
                                                                        <div>
                                                                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Audit Record Details</span>
                                                                            <div className="text-lg font-medium text-slate-600 dark:text-slate-400">#{log.id}</div>
                                                                        </div>
                                                                    </DialogTitle>
                                                                    <DialogDescription className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                                                                        Complete information about this security audit event
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                {selectedLog && (
                                                                    <div className="space-y-6">
                                                                        {/* Primary Information */}
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                                                                <CardHeader className="pb-4  rounded-t-lg">
                                                                                    <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center space-x-3">
                                                                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                                                                                            <User className="h-6 w-6 text-white" />
                                                                                        </div>
                                                                                        <span>User Information</span>
                                                                                    </CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent className="space-y-3">
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</Label>
                                                                                        <p className="text-base font-semibold text-slate-900 dark:text-white">
                                                                                            {selectedLog.user?.name || 'System / Unidentified User'}
                                                                                        </p>
                                                                                    </div>
                                                                                    {selectedLog.user?.email && (
                                                                                        <div>
                                                                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
                                                                                            <p className="text-base text-slate-700 dark:text-slate-300">
                                                                                                {selectedLog.user.email}
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                    {selectedLog.user_id && (
                                                                                        <div>
                                                                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">User ID</Label>
                                                                                            <p className="text-base font-mono text-slate-700 dark:text-slate-300">
                                                                                                #{selectedLog.user_id}
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </CardContent>
                                                                            </Card>

                                                                            <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                                                                <CardHeader className="pb-4  rounded-t-lg">
                                                                                    <CardTitle className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center space-x-3">
                                                                                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                                                                                            <Activity className="h-6 w-6 text-white" />
                                                                                        </div>
                                                                                        <span>Action Details</span>
                                                                                    </CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent className="space-y-3">
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Action Type</Label>
                                                                                        <div className="flex items-center space-x-2 mt-1">
                                                                                            <Badge variant={getActionBadgeVariant(selectedLog.action_type)} className="px-3 py-1">
                                                                                                {getActionIcon(selectedLog.action_type)}
                                                                                                <span className="ml-1">{selectedLog.readable_action}</span>
                                                                                            </Badge>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Affected Model</Label>
                                                                                        <p className="text-base font-semibold text-slate-900 dark:text-white">
                                                                                            {selectedLog.readable_model}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Timestamp</Label>
                                                                                        <p className="text-base text-slate-700 dark:text-slate-300">
                                                                                            {format(
                                                                                                new Date(selectedLog.created_at),
                                                                                                'MMMM dd, yyyy \\at HH:mm:ss',
                                                                                                { locale: enUS }
                                                                                            )}
                                                                                        </p>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        </div>

                                                                        {/* Technical Details */}
                                                                        <Card className="bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-900/20 dark:via-violet-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                                                            <CardHeader className="pb-4  rounded-t-lg">
                                                                                <CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center space-x-3">
                                                                                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-md">
                                                                                        <Settings className="h-6 w-6 text-white" />
                                                                                    </div>
                                                                                    <span>Technical Information</span>
                                                                                </CardTitle>
                                                                            </CardHeader>
                                                                            <CardContent>
                                                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model Type (Class)</Label>
                                                                                        <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-1">
                                                                                            {selectedLog.model_type || 'N/A'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model ID</Label>
                                                                                        <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-1">
                                                                                            {selectedLog.model_id || 'N/A'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Action Type (Raw)</Label>
                                                                                        <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-1">
                                                                                            {selectedLog.action_type}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">IP Address</Label>
                                                                                        <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-1">
                                                                                            {selectedLog.ip_address || 'Unknown'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Route</Label>
                                                                                        <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-1">
                                                                                            {selectedLog.route || 'N/A'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">HTTP Method</Label>
                                                                                        <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-1">
                                                                                            {selectedLog.method || 'N/A'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Session ID</Label>
                                                                                        <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-1 truncate">
                                                                                            {selectedLog.session_id || 'N/A'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="col-span-2">
                                                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">User Agent</Label>
                                                                                        <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-1 break-all">
                                                                                            {selectedLog.user_agent || 'N/A'}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </CardContent>
                                                                        </Card>

                                                                        {/* Description */}
                                                                        {selectedLog.description && (
                                                                            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
                                                                                <CardHeader className="pb-3">
                                                                                    <CardTitle className="text-lg font-semibold text-orange-900 dark:text-orange-100 flex items-center space-x-2">
                                                                                        <FileText className="h-5 w-5" />
                                                                                        <span>Event Description</span>
                                                                                    </CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent>
                                                                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                                                                        {selectedLog.description}
                                                                                    </p>
                                                                                </CardContent>
                                                                            </Card>
                                                                        )}

                                                                        {/* Request Data */}
                                                                        {selectedLog.request_data && (
                                                                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                                                                                <CardHeader className="pb-3">
                                                                                    <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center space-x-2">
                                                                                        <Globe className="h-5 w-5" />
                                                                                        <span>Request Information</span>
                                                                                    </CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent>
                                                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                                                        <pre className="text-sm font-mono text-blue-800 dark:text-blue-200 overflow-auto max-h-60 whitespace-pre-wrap break-words">
                                                                                            {JSON.stringify(selectedLog.request_data, null, 2)}
                                                                                        </pre>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        )}

                                                                        {/* Data Changes */}
                                                                        {(selectedLog.old_values || selectedLog.new_values) && (
                                                                            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-slate-200 dark:border-slate-700">
                                                                                <CardHeader className="pb-3">
                                                                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                                                                                        <Database className="h-5 w-5" />
                                                                                        <span>Data Changes</span>
                                                                                    </CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent>
                                                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                                                        {selectedLog.old_values && (
                                                                                            <div className="space-y-2">
                                                                                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center space-x-2">
                                                                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                                                                    <span>Previous Values</span>
                                                                                                </Label>
                                                                                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                                                                                    <pre className="text-sm font-mono text-red-800 dark:text-red-200 overflow-auto max-h-60 whitespace-pre-wrap break-words">
                                                                                                        {JSON.stringify(selectedLog.old_values, null, 2)}
                                                                                                    </pre>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                        {selectedLog.new_values && (
                                                                                            <div className="space-y-2">
                                                                                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center space-x-2">
                                                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                                                    <span>New Values</span>
                                                                                                </Label>
                                                                                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                                                                                    <pre className="text-sm font-mono text-green-800 dark:text-green-200 overflow-auto max-h-60 whitespace-pre-wrap break-words">
                                                                                                        {JSON.stringify(selectedLog.new_values, null, 2)}
                                                                                                    </pre>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </DialogContent>
                                                        </Dialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Enhanced Pagination */}
                    {auditLogs.last_page > 1 && (
                        <div className="flex justify-center">
                            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-0 shadow-lg">
                                <CardContent className="p-4">
                                    <Pagination
                                        currentPage={auditLogs.current_page}
                                        lastPage={auditLogs.last_page}
                                        links={[]}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}