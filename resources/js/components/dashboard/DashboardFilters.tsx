import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardFiltersProps {
    filters: {
        dateRange: {
            from?: Date;
            to?: Date;
        };
        role: string;
        status: string;
        priority: string;
    };
    onFiltersChange: (filters: {
        dateRange: { from?: Date; to?: Date; };
        role: string;
        status: string;
        priority: string;
    }) => void;
    onReset: () => void;
    loading?: boolean;
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, RefreshCw } from 'lucide-react';

interface DashboardFiltersProps {
    filters: {
        dateRange: {
            from?: Date;
            to?: Date;
        };
        role: string;
        status: string;
        priority: string;
    };
    onFiltersChange: (filters: {
        dateRange: { from?: Date; to?: Date; };
        role: string;
        status: string;
        priority: string;
    }) => void;
    onReset: () => void;
    loading?: boolean;
}

export default function DashboardFilters({ 
    filters, 
    onFiltersChange, 
    onReset, 
    loading = false 
}: DashboardFiltersProps) {
    const handleDateRangeChange = (type: 'from' | 'to', dateString: string) => {
        const date = dateString ? new Date(dateString) : undefined;
        onFiltersChange({
            ...filters,
            dateRange: {
                ...filters.dateRange,
                [type]: date
            }
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };

    return (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Filter className="h-5 w-5" />
                    Dashboard Filters
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Date Range - From */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            From Date
                        </label>
                        <Input
                            type="date"
                            value={filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : ''}
                            onChange={(e) => handleDateRangeChange('from', e.target.value)}
                            className="w-full"
                        />
                    </div>

                    {/* Date Range - To */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            To Date
                        </label>
                        <Input
                            type="date"
                            value={filters.dateRange.to ? filters.dateRange.to.toISOString().split('T')[0] : ''}
                            onChange={(e) => handleDateRangeChange('to', e.target.value)}
                            className="w-full"
                            min={filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : undefined}
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            User Role
                        </label>
                        <Select 
                            value={filters.role} 
                            onValueChange={(value) => handleFilterChange('role', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="super-admin">Super Admin</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="doorman">Doorman</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Status
                        </label>
                        <Select 
                            value={filters.status} 
                            onValueChange={(value) => handleFilterChange('status', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Priority Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Priority
                        </label>
                        <Select 
                            value={filters.priority} 
                            onValueChange={(value) => handleFilterChange('priority', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Priorities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reset Button */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Actions
                        </label>
                        <Button 
                            onClick={onReset}
                            variant="outline"
                            className="w-full"
                            disabled={loading}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Reset Filters
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
