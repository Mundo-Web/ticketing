import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Ticket } from '@/types/models/Ticket.d';
import { Tenant } from '@/types/models/Tenant.d';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Clock, 
    User, 
    AlertCircle, 
    CheckCircle, 
    XCircle, 
    RotateCcw, 
    Calendar,
    Tag,
    Monitor,
    MessageSquare,
    User as UserIcon,
    Building,
    Home,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

// Add custom scrollbar styles
const customScrollbarStyles = `
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: rgb(243 244 246);
    border-radius: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgb(209 213 219);
    border-radius: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgb(156 163 175);
}
.dark .custom-scrollbar::-webkit-scrollbar-track {
    background: rgb(55 65 81);
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgb(75 85 99);
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgb(107 114 128);
}
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('ticket-history-styles')) {
    const style = document.createElement('style');
    style.id = 'ticket-history-styles';
    style.textContent = customScrollbarStyles;
    document.head.appendChild(style);
}

interface TicketHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: Tenant | null;
}

const statusConfig = {
    open: { color: 'bg-blue-500', icon: AlertCircle, text: 'Open' },
    in_progress: { color: 'bg-yellow-500', icon: Clock, text: 'In Progress' },
    resolved: { color: 'bg-green-500', icon: CheckCircle, text: 'Resolved' },
    closed: { color: 'bg-gray-500', icon: CheckCircle, text: 'Closed' },
    cancelled: { color: 'bg-red-500', icon: XCircle, text: 'Cancelled' },
    reopened: { color: 'bg-orange-500', icon: RotateCcw, text: 'Reopened' },
};

// Status badge component similar to index
function StatusBadge({ status }: { status: string }) {
    const statusConfigBadge: Record<string, any> = {
        open: {
            label: "Open",
            bgColor: "bg-blue-100",
            textColor: "text-blue-800",
            icon: AlertCircle,
        },
        in_progress: {
            label: "In Progress",
            bgColor: "bg-amber-100",
            textColor: "text-amber-800",
            icon: Clock,
        },
        resolved: {
            label: "Resolved",
            bgColor: "bg-emerald-100",
            textColor: "text-emerald-800",
            icon: CheckCircle,
        },
        closed: {
            label: "Closed",
            bgColor: "bg-slate-100",
            textColor: "text-slate-700",
            icon: CheckCircle,
        },
        cancelled: {
            label: "Cancelled",
            bgColor: "bg-red-100",
            textColor: "text-red-800",
            icon: XCircle,
        },
    }
    
    const config = statusConfigBadge[status] || {
        label: status,
        bgColor: "bg-gray-100",
        textColor: "text-gray-700",
        icon: AlertCircle,
    }
    const IconComponent = config.icon

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
        >
            <IconComponent className="w-3 h-3" />
            {config.label}
        </div>
    )
}

function CategoryBadge({ category }: { category: string }) {
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-medium">
            <Tag className="w-3 h-3" />
            {category}
        </div>
    )
}

function DeviceBadge({ device }: { device: any }) {
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-100 text-sky-700 text-xs font-medium">
            <Monitor className="w-3 h-3" />
            {device?.name_device?.name || device?.name || "Sin dispositivo"}
        </div>
    )
}

// Member card component from index
function MemberCard({ ticket, showContactInfo = false }: { ticket: any, showContactInfo?: boolean }) {
    if (!ticket.user || !ticket.user.tenant) return null;

    const tenant = ticket.user.tenant;
    
    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    {tenant.photo ? (
                        <img
                            src={tenant.photo.startsWith('http')
                                ? tenant.photo
                                : `/storage/${tenant.photo}`}
                            alt={tenant.name}
                            className="w-12 h-12 rounded-full border-2 border-purple-300 shadow-md object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                            {tenant.name?.substring(0, 1) || '?'}
                        </div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                        <User className="w-3 h-3 text-purple-600" />
                        <p className="text-sm font-semibold text-purple-900 truncate">
                            {tenant.name}
                        </p>
                    </div>
                    
                    {showContactInfo && tenant.email && (
                        <div className="flex items-center gap-1 mb-1">
                            <MessageSquare className="w-3 h-3 text-green-600" />
                            <p className="text-xs text-green-800 truncate">
                                {tenant.email}
                            </p>
                        </div>
                    )}
                    
                    {tenant.apartment && (
                        <div className="flex items-center gap-1 mb-1">
                            <Home className="w-3 h-3 text-blue-600" />
                            <p className="text-xs text-blue-800 truncate">
                                {tenant.apartment.name}
                            </p>
                        </div>
                    )}
                    
                    {tenant.apartment?.building && (
                        <div className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-gray-600" />
                            <p className="text-xs text-gray-700 truncate">
                                {tenant.apartment.building.name}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TicketHistoryModal({ isOpen, onClose, tenant }: TicketHistoryModalProps) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    const fetchTickets = useCallback(async (status = 'all') => {
        if (!tenant?.id) return;
        
        setLoading(true);
        try {
            const response = await axios.get(`/tenants/${tenant.id}/tickets`, {
                params: { status }
            });
            setTickets(response.data.tickets);
        } catch (error: unknown) {
            console.error('Error fetching tickets:', error);
            
            // Better error handling
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    console.error('Access denied to fetch tickets');
                } else if (error.response?.status === 404) {
                    console.error('Tenant not found');
                } else {
                    console.error('Unexpected error:', error.response?.data || error.message);
                }
            } else {
                console.error('Non-axios error:', error);
            }
        } finally {
            setLoading(false);
        }
    }, [tenant?.id]);

    useEffect(() => {
        if (isOpen && tenant?.id) {
            fetchTickets(selectedStatus);
        }
    }, [isOpen, tenant?.id, selectedStatus, fetchTickets]);

    // Early return if tenant is null
    if (!tenant) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-8">
                        <p className="text-gray-500">No tenant selected</p>
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
        const Icon = config.icon;
        return (
            <Badge className={`${config.color} text-white`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.text}
            </Badge>
        );
    };

    const statusCounts = tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalTickets = tickets.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="min-w-5xl h-[95vh] max-h-[95vh] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                        <div className="p-2 bg-corporate-gold/10 rounded-lg">
                            <User className="w-5 h-5 text-corporate-gold" />
                        </div>
                        <span className="text-corporate-gold">Ticket History</span>
                        <span className="text-muted-foreground text-lg">•</span>
                        <span className="text-foreground">{tenant?.name || 'Unknown Tenant'}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex h-[calc(88vh-140px)] gap-6 mt-4">
                    {/* Left sidebar with tickets list - Compact & Modern */}
                    <div className="w-3/5 border-r border-gray-200 dark:border-gray-700 pr-6">
                        <div className="mb-4">
                            {/* Compact Statistics Cards */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center shadow-sm">
                                    <div className="text-2xl font-bold mb-1">{totalTickets}</div>
                                    <div className="text-xs text-blue-100 font-medium">Total</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white text-center shadow-sm">
                                    <div className="text-2xl font-bold mb-1">{statusCounts.resolved || 0}</div>
                                    <div className="text-xs text-green-100 font-medium">Resolved</div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white text-center shadow-sm">
                                    <div className="text-2xl font-bold mb-1">{statusCounts.open || 0}</div>
                                    <div className="text-xs text-orange-100 font-medium">Pending</div>
                                </div>
                            </div>

                            {/* Modern Status Filters */}
                            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
                                <TabsList className="grid w-full grid-cols-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 border-0">
                                    <TabsTrigger 
                                        value="all" 
                                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-sm font-medium rounded-md"
                                    >
                                        All ({totalTickets})
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="open"
                                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-sm font-medium rounded-md"
                                    >
                                        Open ({statusCounts.open || 0})
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="resolved"
                                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-sm font-medium rounded-md"
                                    >
                                        Resolved ({statusCounts.resolved || 0})
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Compact Tickets List */}
                        <div className="h-[calc(100%-140px)] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-gold mx-auto mb-3"></div>
                                    <p className="text-sm text-muted-foreground">Loading tickets...</p>
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <AlertCircle className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">No tickets found</p>
                                    <p className="text-xs text-muted-foreground">This member hasn't created any tickets yet</p>
                                </div>
                            ) : (
                                tickets.map((ticket) => (
                                    <div 
                                        key={ticket.id} 
                                        className={`cursor-pointer transition-all duration-200 rounded-lg border p-3 hover:shadow-md ${
                                            selectedTicket?.id === ticket.id 
                                                ? 'bg-corporate-gold/5 border-corporate-gold shadow-sm' 
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-corporate-gold/30'
                                        }`}
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-medium text-corporate-gold bg-corporate-gold/10 px-2 py-1 rounded">
                                                    {ticket.code}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(ticket.created_at), 'MMM d')}
                                                </span>
                                            </div>
                                            <div className="scale-75">
                                                {getStatusBadge(ticket.status)}
                                            </div>
                                        </div>
                                        
                                        <h4 className="font-medium text-sm line-clamp-1 mb-1">{ticket.title}</h4>
                                        <div className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                            {ticket.description}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-xs">
                                            {ticket.device && (
                                                <div className="flex items-center gap-1 text-corporate-gold bg-corporate-gold/10 px-2 py-1 rounded-full">
                                                    <div className="w-1 h-1 bg-corporate-gold rounded-full"></div>
                                                    <span className="font-medium truncate max-w-20">{ticket.device.name}</span>
                                                </div>
                                            )}
                                            {ticket.technical && (
                                                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                                                    <User className="w-2.5 h-2.5" />
                                                    <span className="font-medium truncate max-w-16">{ticket.technical.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right side with ticket details - Using Index UI */}
                    <div className="w-2/5 pl-6">
                        {selectedTicket ? (
                            <div className="h-full overflow-y-auto custom-scrollbar">
                                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
                                    <CardHeader className="text-black rounded-t-lg shadow pb-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-semibold">Ticket Details</h2>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                                            <div className="px-6 pb-6">
                                                {/* Member Card - Creator of the ticket */}
                                                <MemberCard ticket={selectedTicket} showContactInfo={true} />

                                                {/* Ticket Info */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold text-slate-900">{selectedTicket.title}</h3>
                                                        <StatusBadge status={selectedTicket.status} />
                                                    </div>

                                                    <p className="text-slate-600 text-sm leading-relaxed">{selectedTicket.description}</p>

                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <span className="text-slate-500">ID:</span>
                                                            <span className="ml-2 font-medium">#{selectedTicket.id}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Code:</span>
                                                            <span className="ml-2 font-medium">{selectedTicket.code}</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex flex-wrap gap-2 items-center">
                                                            <DeviceBadge device={selectedTicket.device} />
                                                            <CategoryBadge category={selectedTicket.category} />
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-slate-500 space-y-1 mb-4">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Created:{" "}
                                                            {selectedTicket.created_at
                                                                ? new Date(selectedTicket.created_at).toLocaleString("en-US")
                                                                : "-"}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Updated:{" "}
                                                            {selectedTicket.updated_at
                                                                ? new Date(selectedTicket.updated_at).toLocaleString("en-US")
                                                                : "-"}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* History */}
                                                <div className="space-y-4 mt-4">
                                                    <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-blue-500" />
                                                        History
                                                    </h4>

                                                    <div className="space-y-3">
                                                        {!selectedTicket.histories || selectedTicket.histories.length === 0 ? (
                                                            <div className="text-center py-6 text-slate-500">
                                                                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                                                <p className="text-sm">No history available</p>
                                                            </div>
                                                        ) : (
                                                            [...selectedTicket.histories]
                                                                .slice()
                                                                .reverse()
                                                                .map((h: any, idx: number, arr: any[]) => (
                                                                    <div key={h.id} className="relative pl-6 pb-4 last:pb-0">
                                                                        <div className="absolute left-0 top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                                                                        {idx !== arr.length - 1 && (
                                                                            <div className="absolute left-1.5 top-4 w-0.5 h-full bg-slate-200"></div>
                                                                        )}

                                                                        <div className="bg-slate-50 rounded-lg p-3 ml-4 shadow-sm">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                                                                    {h.action.replace("_", " ")}
                                                                                </span>
                                                                                {idx === 0 && (
                                                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                                                        Recent
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-slate-700 mb-2">{h.description}</p>
                                                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                                                <span className="flex items-center gap-1">
                                                                                    <UserIcon className="w-3 h-3" />
                                                                                    {h.user ? h.user.name : "Sistema"}
                                                                                </span>
                                                                                <span>{new Date(h.created_at).toLocaleString("es-ES")}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 bg-corporate-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Eye className="w-8 h-8 text-corporate-gold/40" />
                                    </div>
                                    <h3 className="font-bold text-lg text-muted-foreground mb-2">Select a Ticket</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                                        Choose a ticket from the list to view its details and activity history.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modern Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 bg-white dark:bg-gray-900">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {tickets.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span>
                                    <span className="font-medium text-corporate-gold">{tickets.length}</span> ticket{tickets.length !== 1 ? 's' : ''} • 
                                    <span className="text-green-600 ml-1">{statusCounts.resolved || 0} resolved</span> • 
                                    <span className="text-orange-600 ml-1">{statusCounts.open || 0} pending</span>
                                </span>
                            </div>
                        )}
                    </div>
                    <Button 
                        onClick={onClose}
                        className="bg-corporate-gold hover:bg-corporate-warm text-white px-6 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
