import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Area,
    AreaChart,
    Legend
} from 'recharts';
import { TrendingUp, FileSpreadsheet, ExternalLink } from 'lucide-react';

interface AdvancedChartsProps {
    data: {
        ticketsByStatus: Array<{ status: string; count: number; color: string; }>;
        ticketsByPriority: Array<{ priority: string; count: number; color: string; }>;
        ticketsByBuilding: Array<{ building: string; count: number; }>;
        ticketsOverTime: Array<{ month: string; created: number; resolved: number; }>;
        deviceIssues: Array<{ device: string; count: number; avgResolution: number; }>;
        techniciansPerformance: Array<{ technician: string; resolved: number; avg_time: number; }>;
    };
}

// Custom tooltip component
interface TooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        color: string;
        payload?: Record<string, unknown>;
    }>;
    label?: string;
}

// Enhanced custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
        const totalTickets = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
        
        return (
            <div className="bg-white dark:bg-gray-800 border-0 rounded-2xl shadow-2xl p-6 min-w-[200px]">
                <div className="space-y-4">
                    <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                        <p className="font-bold text-lg text-gray-900 dark:text-white">{label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Total: {totalTickets} tickets
                        </p>
                    </div>
                    <div className="space-y-3">
                        {payload.map((entry, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-3 h-3 rounded-full shadow-md" 
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {entry.name}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {entry.value}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                        ({totalTickets > 0 ? Math.round((entry.value / totalTickets) * 100) : 0}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function AdvancedCharts({ data }: AdvancedChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           

         

            {/* Tickets Over Time - Enhanced Area Chart */}
            <Card className="border-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-2xl overflow-hidden relative lg:col-span-2">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-green-50/50 dark:from-blue-950/20 dark:to-green-950/20"></div>
                
                <CardHeader className="pb-8 relative">
                    <div className="flex items-center justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 shadow-lg">
                                    <TrendingUp className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-black text-foreground">
                                        Ticket Evolution
                                    </CardTitle>
                                    <p className="text-lg text-muted-foreground font-medium">
                                        Created vs Resolved trends over time
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        
                    </div>
                    
                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-blue-50/80 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Average Created</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                {data.ticketsOverTime.length > 0 
                                    ? Math.round(data.ticketsOverTime.reduce((sum, item) => sum + item.created, 0) / data.ticketsOverTime.length)
                                    : 0
                                } /day
                            </p>
                        </div>
                        <div className="bg-green-50/80 dark:bg-green-950/30 rounded-xl p-4 border border-green-100 dark:border-green-800">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">Average Resolved</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                                {data.ticketsOverTime.length > 0 
                                    ? Math.round(data.ticketsOverTime.reduce((sum, item) => sum + item.resolved, 0) / data.ticketsOverTime.length)
                                    : 0
                                } /day
                            </p>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="pt-0 pb-8 relative">
                    <div className="h-[450px] bg-gradient-to-b from-white/50 to-transparent dark:from-gray-900/50 rounded-2xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart 
                                data={data.ticketsOverTime}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <defs>
                                    {/* Enhanced gradients with more sophisticated colors */}
                                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                                        <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.6}/>
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    </linearGradient>
                                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                                        <stop offset="50%" stopColor="#10b981" stopOpacity={0.6}/>
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                                    </linearGradient>
                                    
                                    {/* Glow filters for enhanced visual appeal */}
                                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                        <feMerge>
                                            <feMergeNode in="coloredBlur"/>
                                            <feMergeNode in="SourceGraphic"/>
                                        </feMerge>
                                    </filter>
                                </defs>
                                
                                <CartesianGrid 
                                    strokeDasharray="2 6" 
                                    stroke="hsl(var(--muted-foreground))" 
                                    opacity={0.3}
                                    vertical={false}
                                />
                                
                                <XAxis 
                                    dataKey="month" 
                                    tick={{ 
                                        fontSize: 13, 
                                        fill: 'hsl(var(--muted-foreground))',
                                        fontWeight: 500
                                    }}
                                    tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                                    axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
                                    dy={10}
                                />
                                
                                <YAxis 
                                    tick={{ 
                                        fontSize: 13, 
                                        fill: 'hsl(var(--muted-foreground))',
                                        fontWeight: 500
                                    }}
                                    tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                                    axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
                                    dx={-10}
                                />
                                
                                <Tooltip content={<CustomTooltip />} />
                                
                                <Area
                                    type="monotone"
                                    dataKey="created"
                                    stackId="1"
                                    stroke="#3b82f6"
                                    strokeWidth={4}
                                    fill="url(#colorCreated)"
                                    name="Created"
                                    dot={{ 
                                        fill: '#3b82f6', 
                                        strokeWidth: 3, 
                                        r: 6,
                                        stroke: '#ffffff',
                                        filter: 'url(#glow)'
                                    }}
                                    activeDot={{ 
                                        r: 8, 
                                        stroke: '#3b82f6', 
                                        strokeWidth: 4, 
                                        fill: '#ffffff',
                                        filter: 'url(#glow)',
                                        className: 'animate-pulse'
                                    }}
                                />
                                
                                <Area
                                    type="monotone"
                                    dataKey="resolved"
                                    stackId="2"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    fill="url(#colorResolved)"
                                    name="Resolved"
                                    dot={{ 
                                        fill: '#10b981', 
                                        strokeWidth: 3, 
                                        r: 6,
                                        stroke: '#ffffff',
                                        filter: 'url(#glow)'
                                    }}
                                    activeDot={{ 
                                        r: 8, 
                                        stroke: '#10b981', 
                                        strokeWidth: 4, 
                                        fill: '#ffffff',
                                        filter: 'url(#glow)',
                                        className: 'animate-pulse'
                                    }}
                                />
                                
                                <Legend 
                                    verticalAlign="top" 
                                    height={50}
                                    iconType="circle"
                                    formatter={(value, entry) => (
                                        <span className="text-base font-semibold" style={{ color: entry.color }}>
                                            {value}
                                        </span>
                                    )}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

   

        </div>
    );
}
