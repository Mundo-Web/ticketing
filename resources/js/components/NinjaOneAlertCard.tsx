import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface NinjaOneAlert {
    id: number;
    ninjaone_alert_id: string;
    ninjaone_device_id: string;
    device_id: number;
    alert_type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    status: 'open' | 'acknowledged' | 'resolved';
    ninjaone_created_at: string;
    acknowledged_at?: string;
    resolved_at?: string;
    ticket_id?: number;
    notification_sent: boolean;
    device?: {
        id: number;
        name: string;
        brand?: { name: string };
        ubicacion?: string;
    };
}

interface NinjaOneAlertCardProps {
    alert: NinjaOneAlert;
    onAcknowledge?: (alertId: number) => void;
    onResolve?: (alertId: number) => void;
    onCreateTicket?: (alertId: number) => void;
    showActions?: boolean;
}

const severityConfig = {
    info: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Info, 
        bgColor: 'border-blue-200 bg-blue-50/30' 
    },
    warning: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: AlertCircle, 
        bgColor: 'border-yellow-200 bg-yellow-50/30' 
    },
    critical: { 
        color: 'bg-red-100 text-red-800', 
        icon: AlertTriangle, 
        bgColor: 'border-red-200 bg-red-50/30' 
    },
};

const statusConfig = {
    open: { color: 'bg-red-100 text-red-800', label: 'Open' },
    acknowledged: { color: 'bg-yellow-100 text-yellow-800', label: 'Acknowledged' },
    resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
};

export default function NinjaOneAlertCard({ 
    alert, 
    onAcknowledge, 
    onResolve, 
    onCreateTicket, 
    showActions = true 
}: NinjaOneAlertCardProps) {
    const severityInfo = severityConfig[alert.severity];
    const statusInfo = statusConfig[alert.status];
    const SeverityIcon = severityInfo.icon;

    const handleAcknowledge = () => {
        if (onAcknowledge) {
            onAcknowledge(alert.id);
        }
    };

    const handleResolve = () => {
        if (onResolve) {
            onResolve(alert.id);
        }
    };

    const handleCreateTicket = () => {
        if (onCreateTicket) {
            onCreateTicket(alert.id);
        } else {
            // Default behavior: navigate to create ticket page
            window.location.href = `/tickets/create-from-alert/${alert.id}`;
        }
    };

    return (
        <Card className={`transition-all duration-200 ${severityInfo.bgColor} border-2`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${severityInfo.color.replace('text-', 'bg-').replace('800', '200')}`}>
                            <SeverityIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                {alert.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className={severityInfo.color}>
                                    {alert.severity.toUpperCase()}
                                </Badge>
                                <Badge className={statusInfo.color}>
                                    {statusInfo.label}
                                </Badge>
                                {alert.ticket_id && (
                                    <Badge variant="outline">
                                        Ticket #{alert.ticket_id}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(alert.ninjaone_created_at), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            ID: {alert.ninjaone_alert_id}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Device Information */}
                {alert.device && (
                    <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Device</h4>
                        <div className="text-sm text-gray-600">
                            <p><strong>Name:</strong> {alert.device.name}</p>
                            {alert.device.brand && (
                                <p><strong>Brand:</strong> {alert.device.brand.name}</p>
                            )}
                            {alert.device.ubicacion && (
                                <p><strong>Location:</strong> {alert.device.ubicacion}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Alert Description */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {alert.description}
                    </p>
                </div>

                {/* Alert Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-gray-900">Type:</span>
                        <span className="ml-2 text-gray-600">{alert.alert_type}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-900">Status:</span>
                        <span className="ml-2 text-gray-600">{statusInfo.label}</span>
                    </div>
                    {alert.acknowledged_at && (
                        <div className="col-span-2">
                            <span className="font-medium text-gray-900">Acknowledged:</span>
                            <span className="ml-2 text-gray-600">
                                {formatDistanceToNow(new Date(alert.acknowledged_at), { addSuffix: true })}
                            </span>
                        </div>
                    )}
                    {alert.resolved_at && (
                        <div className="col-span-2">
                            <span className="font-medium text-gray-900">Resolved:</span>
                            <span className="ml-2 text-gray-600">
                                {formatDistanceToNow(new Date(alert.resolved_at), { addSuffix: true })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {showActions && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                        {!alert.ticket_id && (
                            <Button 
                                onClick={handleCreateTicket}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Create Ticket
                            </Button>
                        )}
                        
                        {alert.ticket_id && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/tickets/${alert.ticket_id}`}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Ticket
                            </Button>
                        )}

                        {alert.status === 'open' && (
                            <Button 
                                onClick={handleAcknowledge}
                                variant="outline"
                                size="sm"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                Acknowledge
                            </Button>
                        )}

                        {alert.status !== 'resolved' && (
                            <Button 
                                onClick={handleResolve}
                                variant="outline"
                                size="sm"
                                className="text-green-700 border-green-700 hover:bg-green-50"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Resolved
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
