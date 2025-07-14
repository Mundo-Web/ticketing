import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Building, 
    Wrench, 
    Timer, 
    TrendingUp,
    ExternalLink 
} from 'lucide-react';

interface ExtendedKPIsProps {
    metrics: {
        avgResolutionTime: number; // in hours
        ticketsByBuilding: Array<{ building: string; count: number; }>;
        ticketsByDevice: Array<{ device: string; count: number; }>;
        totalTicketsThisMonth: number;
        totalTicketsLastMonth: number;
        resolutionRate: number; // percentage
        unassignedTickets: number;
    };
}

export default function ExtendedKPIs({ metrics }: ExtendedKPIsProps) {
    // Calculate growth percentage
    const growthPercentage = metrics.totalTicketsLastMonth > 0 
        ? ((metrics.totalTicketsThisMonth - metrics.totalTicketsLastMonth) / metrics.totalTicketsLastMonth * 100)
        : 0;

    // Format resolution time
    const formatResolutionTime = (hours: number) => {
        if (hours < 24) {
            return `${Math.round(hours)}h`;
        }
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    };

    // Get top building and device
    const topBuilding = metrics.ticketsByBuilding[0];
    const topDevice = metrics.ticketsByDevice[0];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Average Resolution Time */}
            <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-blue-50 via-background to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                            <Timer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <ExternalLink 
                            className="h-4 w-4 text-blue-500/60 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => window.open('/tickets?status=resolved', '_blank')}
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Avg Resolution Time
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                            {formatResolutionTime(metrics.avgResolutionTime)}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                metrics.avgResolutionTime <= 24 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : metrics.avgResolutionTime <= 48
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                                {metrics.avgResolutionTime <= 24 ? 'Excellent' : 
                                 metrics.avgResolutionTime <= 48 ? 'Good' : 'Needs Attention'}
                            </span>
                            <span className="text-xs text-muted-foreground">Performance</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top Building by Tickets */}
            <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-purple-50 via-background to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 overflow-hidden cursor-pointer"
                  onClick={() => window.open('/buildings', '_blank')}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                            <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <ExternalLink className="h-4 w-4 text-purple-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            Top Building
                        </p>
                        <p className="text-2xl font-bold text-foreground truncate">
                            {topBuilding?.building || 'No data'}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {topBuilding?.count || 0} tickets
                            </span>
                            <span className="text-xs text-muted-foreground">This month</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top Device by Tickets */}
            <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-orange-50 via-background to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 overflow-hidden cursor-pointer"
                  onClick={() => window.open('/devices', '_blank')}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                            <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <ExternalLink className="h-4 w-4 text-orange-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                            Top Device Issue
                        </p>
                        <p className="text-2xl font-bold text-foreground truncate">
                            {topDevice?.device || 'No data'}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                {topDevice?.count || 0} tickets
                            </span>
                            <span className="text-xs text-muted-foreground">This month</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resolution Rate */}
            <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-green-50 via-background to-green-100 dark:from-green-900/20 dark:to-green-800/10 overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <ExternalLink 
                            className="h-4 w-4 text-green-500/60 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => window.open('/tickets', '_blank')}
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                            Resolution Rate
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                            {metrics.resolutionRate.toFixed(1)}%
                        </p>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                growthPercentage >= 0 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                                {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
