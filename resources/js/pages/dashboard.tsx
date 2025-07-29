import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// UI Components
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Icons
import {
    Building, Users, Ticket, Wrench, Smartphone, TrendingUp, Clock,
    CheckCircle, AlertCircle, Home, Activity, BarChart3, Calendar,
    Timer, Download, ExternalLink, RefreshCcw, FileSpreadsheet,
    Bell, Zap, UserPlus, AlertTriangle, X, User, Phone, Mail,
    Monitor, ChevronLeft, ChevronRight, Laptop, Check,
    MessageSquare, Info, AlertOctagon, MapPin, PlayCircle, Eye
} from 'lucide-react';

// Charts
import {
    ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    Legend, Area, AreaChart
} from 'recharts';

// Export utilities
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Advanced Dashboard Components
import DashboardFilterPanel from '@/components/dashboard/DashboardFilterPanel';
import ExtendedKPIs from '@/components/dashboard/ExtendedKPIs';
import AdvancedCharts from '@/components/dashboard/AdvancedCharts';
import ExportData from '@/components/dashboard/ExportData';

interface AppointmentItem {
    id: number;
    title: string;
    description?: string;
    address: string;
    scheduled_for: string;
    estimated_duration: number;
    status: string;
    ticket: {
        id: number;
        title: string;
        code: string;
        user: {
            name: string;
            email: string;
        };
        device: {
            id: number;
            name: string;
            tenants: Array<{
                id: number;
                apartment: {
                    id: number;
                    name: string;
                    building: {
                        id: number;
                        name: string;
                        address: string;
                        location_link: string;
                    };
                };
            }>;
        };
    };
    technical: {
        id: number;
        name: string;
        email: string;
    };
}

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
    }; charts: {
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
    }; lists: {
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
        upcomingAppointments?: Array<AppointmentItem>;
    };
    googleMapsApiKey: string;
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

// Professional Weekly Trend Export
const exportWeeklyTrendExcel = async (trendData: Array<{ date: string; count: number }>) => {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Ticketing System - Trend Analysis';
    workbook.created = new Date();
    workbook.company = 'Weekly Performance Report';

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Ensure we have exactly 7 days of data, filling gaps with zeros
    const ensureSevenDays = (data: Array<{ date: string; count: number }>) => {
        const result = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - i);
            const dateStr = targetDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            const existingData = data.find(item => item.date === dateStr);
            result.push({
                date: dateStr,
                count: existingData ? (existingData.count || 0) : 0
            });
        }

        return result;
    };

    const validatedTrendData = ensureSevenDays(trendData);

    const colors = {
        primary: 'FF2563EB',
        secondary: 'FF1E3A8A',
        success: 'FF059669',
        warning: 'FFF59E0B',
        danger: 'FFDC2626',
        info: 'FF0891B2',
        light: 'FFF8FAFC',
        dark: 'FF1E293B',
        white: 'FFFFFFFF'
    };

    const sheet = workbook.addWorksheet('Weekly Trend Analysis', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    sheet.columns = [
        { width: 15 }, { width: 18 }, { width: 18 }, { width: 20 }, { width: 25 }, { width: 30 }
    ];

    // Title
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'WEEKLY PERFORMANCE TREND ANALYSIS';
    titleCell.style = {
        font: { name: 'Segoe UI', size: 20, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thick', color: { argb: colors.secondary } },
            left: { style: 'thick', color: { argb: colors.secondary } },
            bottom: { style: 'thick', color: { argb: colors.secondary } },
            right: { style: 'thick', color: { argb: colors.secondary } }
        }
    };
    sheet.getRow(1).height = 40;

    // Date range
    sheet.mergeCells('A2:D2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Analysis Period: Last 7 Days | Generated: ${currentDate}`;
    dateCell.style = {
        font: { name: 'Segoe UI', size: 11, italic: true, color: { argb: colors.dark } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
        alignment: { horizontal: 'left', vertical: 'middle' }
    };

    // Summary stats with safe calculations
    sheet.mergeCells('E2:F2');
    const totalTickets = validatedTrendData.reduce((sum, day) => sum + (day.count || 0), 0);
    const avgDaily = validatedTrendData.length > 0 ? Math.round(totalTickets / validatedTrendData.length) : 0;
    const summaryCell = sheet.getCell('E2');
    summaryCell.value = `Total: ${totalTickets} tickets | Daily Avg: ${avgDaily}`;
    summaryCell.style = {
        font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.primary } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
        alignment: { horizontal: 'right', vertical: 'middle' }
    };

    // Headers
    let currentRow = 4;
    const headers = ['Date', 'Tickets Created', 'Trend vs Avg', 'Performance', 'Volume Category', 'Action Needed'];
    headers.forEach((header, index) => {
        const cell = sheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.style = {
            font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'medium', color: { argb: 'FFFFFFFF' } },
                left: { style: 'medium', color: { argb: 'FFFFFFFF' } },
                bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
                right: { style: 'medium', color: { argb: 'FFFFFFFF' } }
            }
        };
    });
    sheet.getRow(currentRow).height = 30;
    currentRow++;

    // Data rows with enhanced analysis and safe calculations
    validatedTrendData.forEach((day, index) => {
        const dayCount = day.count || 0;
        const safeAvgDaily = avgDaily || 1; // Prevent division by zero

        const vsAverage = safeAvgDaily > 0 ? Math.round(((dayCount - safeAvgDaily) / safeAvgDaily) * 100) : 0;
        const trendDirection = vsAverage > 15 ? '↗ Above Average' :
            vsAverage < -15 ? '↘ Below Average' :
                '→ Normal Range';

        const performance = dayCount > safeAvgDaily * 1.3 ? 'High Volume' :
            dayCount < safeAvgDaily * 0.7 ? 'Low Volume' :
                'Standard Volume';

        const volumeCategory = dayCount > safeAvgDaily * 1.5 ? 'Peak Day' :
            dayCount > safeAvgDaily * 1.2 ? 'Busy Day' :
                dayCount < safeAvgDaily * 0.8 ? 'Light Day' :
                    'Normal Day';

        const actionNeeded = dayCount > safeAvgDaily * 1.5 ? 'Monitor capacity & resources' :
            dayCount < safeAvgDaily * 0.5 ? 'Review for issues' :
                'Continue monitoring';

        const rowData = [
            day.date || 'Unknown',
            dayCount,
            `${vsAverage > 0 ? '+' : ''}${vsAverage}% ${trendDirection}`,
            performance,
            volumeCategory,
            actionNeeded
        ];

        rowData.forEach((value, colIndex) => {
            const cell = sheet.getCell(currentRow, colIndex + 1);
            cell.value = value;

            let fillColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
            let fontColor = colors.dark;

            // Trend column styling
            if (colIndex === 2) {
                if (vsAverage > 15) {
                    fillColor = colors.success;
                    fontColor = 'FFFFFFFF';
                } else if (vsAverage < -15) {
                    fillColor = colors.warning;
                    fontColor = 'FFFFFFFF';
                }
            }

            // Performance column styling
            if (colIndex === 3) {
                switch (value) {
                    case 'High Volume':
                        fillColor = colors.info;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Low Volume':
                        fillColor = colors.warning;
                        fontColor = 'FFFFFFFF';
                        break;
                }
            }

            // Volume category styling
            if (colIndex === 4) {
                switch (value) {
                    case 'Peak Day':
                        fillColor = colors.danger;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Busy Day':
                        fillColor = colors.warning;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Light Day':
                        fillColor = colors.info;
                        fontColor = 'FFFFFFFF';
                        break;
                }
            }

            cell.style = {
                font: { name: 'Segoe UI', size: 10, color: { argb: fontColor } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
                alignment: { horizontal: colIndex === 0 || colIndex === 5 ? 'left' : 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                }
            };
        });
        sheet.getRow(currentRow).height = 25;
        currentRow++;
    });

    // Trend Analysis
    currentRow += 2;
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const analysisHeaderCell = sheet.getCell(`A${currentRow}`);
    analysisHeaderCell.value = 'TREND ANALYSIS & INSIGHTS';
    analysisHeaderCell.style = {
        font: { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.info } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    currentRow++;

    const maxDay = trendData.reduce((max, day) => day.count > max.count ? day : max, trendData[0]);
    const minDay = trendData.reduce((min, day) => day.count < min.count ? day : min, trendData[0]);
    const peakVariance = Math.round(((maxDay.count - minDay.count) / avgDaily) * 100);

    const insights = [
        ['Metric', 'Value', 'Analysis', 'Recommendation'],
        ['Peak Day', `${maxDay.date} (${maxDay.count} tickets)`, maxDay.count > avgDaily * 1.5 ? 'Significant spike' : 'Normal peak', 'Monitor for patterns'],
        ['Lowest Day', `${minDay.date} (${minDay.count} tickets)`, minDay.count < avgDaily * 0.5 ? 'Unusual low' : 'Normal variation', 'Check for issues if unusually low'],
        ['Variance', `${peakVariance}%`, peakVariance > 50 ? 'High volatility' : 'Stable pattern', peakVariance > 50 ? 'Review capacity planning' : 'Maintain current approach'],
        ['Trend Direction', totalTickets > avgDaily * 7 ? 'Growing' : 'Stable', 'Week over week', 'Adjust resources as needed'],
        ['Consistency', Math.abs(peakVariance) < 30 ? 'Very Consistent' : 'Variable', 'Daily fluctuation', 'Plan for peak capacity']
    ];

    insights.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
            const cell = sheet.getCell(currentRow + rowIndex, colIndex + 1);
            cell.value = value;

            let fillColor = rowIndex === 0 ? colors.secondary : 'FFFFFFFF';
            let fontColor = rowIndex === 0 ? 'FFFFFFFF' : colors.dark;

            if (rowIndex > 0 && colIndex === 2) {
                if (value.includes('spike') || value.includes('High volatility')) {
                    fillColor = colors.warning;
                    fontColor = 'FFFFFFFF';
                } else if (value.includes('Consistent') || value.includes('Stable')) {
                    fillColor = colors.success;
                    fontColor = 'FFFFFFFF';
                }
            }

            cell.style = {
                font: { name: 'Segoe UI', size: 10, bold: rowIndex === 0 || colIndex === 0, color: { argb: fontColor } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
                alignment: { horizontal: colIndex === 0 ? 'left' : 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                }
            };
        });
        sheet.getRow(currentRow + rowIndex).height = 22;
    });

    const fileName = `Weekly_Trend_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

    toast.success('Weekly Trend Analysis Generated!', {
        description: `${fileName} has been downloaded with comprehensive trend analysis and insights.`
    });
};

// Professional Ticket Distribution Export
const exportTicketDistributionExcel = async (ticketsByStatus: Record<string, number>, totalTickets: number) => {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Ticketing System - Analytics';
    workbook.created = new Date();
    workbook.company = 'Ticket Distribution Analysis';

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const colors = {
        primary: 'FF2563EB',
        secondary: 'FF1E3A8A',
        success: 'FF059669',
        warning: 'FFF59E0B',
        danger: 'FFDC2626',
        info: 'FF0891B2',
        light: 'FFF8FAFC',
        dark: 'FF1E293B',
        white: 'FFFFFFFF'
    };

    const sheet = workbook.addWorksheet('Ticket Distribution Analysis', {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    sheet.columns = [
        { width: 25 }, { width: 15 }, { width: 18 }, { width: 20 }, { width: 25 }
    ];

    // Title
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'TICKET DISTRIBUTION ANALYSIS REPORT';
    titleCell.style = {
        font: { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thick', color: { argb: colors.secondary } },
            left: { style: 'thick', color: { argb: colors.secondary } },
            bottom: { style: 'thick', color: { argb: colors.secondary } },
            right: { style: 'thick', color: { argb: colors.secondary } }
        }
    };
    sheet.getRow(1).height = 35;

    // Date and stats
    sheet.mergeCells('A2:C2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Report Generated: ${currentDate}`;
    dateCell.style = {
        font: { name: 'Segoe UI', size: 11, italic: true, color: { argb: colors.dark } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
        alignment: { horizontal: 'left', vertical: 'middle' }
    };

    sheet.mergeCells('D2:E2');
    const totalCell = sheet.getCell('D2');
    totalCell.value = `Total Tickets: ${totalTickets}`;
    totalCell.style = {
        font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.primary } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
        alignment: { horizontal: 'right', vertical: 'middle' }
    };

    // Headers
    let currentRow = 4;
    const headers = ['Status', 'Count', 'Percentage', 'Priority Level', 'Action Required'];
    headers.forEach((header, index) => {
        const cell = sheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.style = {
            font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'medium', color: { argb: 'FFFFFFFF' } },
                left: { style: 'medium', color: { argb: 'FFFFFFFF' } },
                bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
                right: { style: 'medium', color: { argb: 'FFFFFFFF' } }
            }
        };
    });
    sheet.getRow(currentRow).height = 30;
    currentRow++;

    // Data rows with enhanced information
    const statusMapping: Record<string, { label: string; priority: string; action: string; color: string }> = {
        'open': { label: 'Open', priority: 'Critical', action: 'Immediate Assignment Required', color: colors.danger },
        'in_progress': { label: 'In Progress', priority: 'High', action: 'Monitor Progress', color: colors.warning },
        'resolved': { label: 'Resolved', priority: 'Low', action: 'Quality Check', color: colors.success },
        'closed': { label: 'Closed', priority: 'Completed', action: 'Archive', color: colors.info }
    };

    Object.entries(ticketsByStatus).forEach(([status, count]) => {
        const percentage = Math.round((Number(count) / totalTickets) * 100);
        const statusInfo = statusMapping[status] || { label: status, priority: 'Unknown', action: 'Review', color: colors.dark };

        const rowData = [
            statusInfo.label,
            count,
            `${percentage}%`,
            statusInfo.priority,
            statusInfo.action
        ];

        rowData.forEach((value, colIndex) => {
            const cell = sheet.getCell(currentRow, colIndex + 1);
            cell.value = value;

            let fillColor = 'FFFFFFFF';
            let fontColor = colors.dark;

            // Status column styling
            if (colIndex === 0) {
                fillColor = statusInfo.color;
                fontColor = 'FFFFFFFF';
            }

            // Priority column styling
            if (colIndex === 3) {
                switch (value) {
                    case 'Critical':
                        fillColor = colors.danger;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'High':
                        fillColor = colors.warning;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Low':
                        fillColor = colors.success;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Completed':
                        fillColor = colors.info;
                        fontColor = 'FFFFFFFF';
                        break;
                }
            }

            cell.style = {
                font: { name: 'Segoe UI', size: 11, bold: colIndex === 0, color: { argb: fontColor } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                }
            };
        });
        sheet.getRow(currentRow).height = 25;
        currentRow++;
    });

    // Analysis section
    currentRow += 2;
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const analysisHeaderCell = sheet.getCell(`A${currentRow}`);
    analysisHeaderCell.value = 'WORKFLOW ANALYSIS & RECOMMENDATIONS';
    analysisHeaderCell.style = {
        font: { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.info } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    currentRow++;

    const openPercentage = Math.round((ticketsByStatus.open / totalTickets) * 100);
    const resolvedPercentage = Math.round((ticketsByStatus.resolved / totalTickets) * 100);

    const recommendations = [
        ['Metric', 'Value', 'Status', 'Recommendation'],
        ['Open Tickets Rate', `${openPercentage}%`, openPercentage > 20 ? 'High' : 'Normal', openPercentage > 20 ? 'Increase technical resources' : 'Maintain current level'],
        ['Resolution Rate', `${resolvedPercentage}%`, resolvedPercentage > 70 ? 'Excellent' : 'Needs Improvement', resolvedPercentage > 70 ? 'Continue best practices' : 'Review resolution processes'],
        ['Workflow Efficiency', totalTickets > 100 ? 'High Volume' : 'Standard', 'Active', 'Monitor trends and adjust capacity'],
        ['System Health', 'Operational', 'Good', 'Regular monitoring recommended']
    ];

    recommendations.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
            const cell = sheet.getCell(currentRow + rowIndex, colIndex + 1);
            cell.value = value;

            let fillColor = rowIndex === 0 ? colors.secondary : 'FFFFFFFF';
            let fontColor = rowIndex === 0 ? 'FFFFFFFF' : colors.dark;

            if (rowIndex > 0 && colIndex === 2) {
                switch (value) {
                    case 'High':
                        fillColor = colors.danger;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Excellent':
                        fillColor = colors.success;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Good':
                        fillColor = colors.success;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Needs Improvement':
                        fillColor = colors.warning;
                        fontColor = 'FFFFFFFF';
                        break;
                }
            }

            cell.style = {
                font: { name: 'Segoe UI', size: 10, bold: rowIndex === 0 || colIndex === 0, color: { argb: fontColor } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
                alignment: { horizontal: colIndex === 0 ? 'left' : 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                }
            };
        });
        sheet.getRow(currentRow + rowIndex).height = 22;
    });

    const fileName = `Ticket_Distribution_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

    toast.success('Ticket Distribution Analysis Generated!', {
        description: `${fileName} has been downloaded with detailed analysis and recommendations.`
    });
};

// Professional Devices Export
const exportDevicesExcel = async (devices: Array<{ id: number; device_name: string; device_type: string; brand_name: string; system_name: string; users_count: number }>) => {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'Ticketing System - Device Management';
    workbook.created = new Date();
    workbook.company = 'Device Inventory Report';

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Professional color scheme
    const colors = {
        primary: 'FF2563EB',
        secondary: 'FF1E3A8A',
        success: 'FF059669',
        warning: 'FFF59E0B',
        info: 'FF0891B2',
        light: 'FFF8FAFC',
        dark: 'FF1E293B',
        white: 'FFFFFFFF'
    };

    // Main sheet
    const sheet = workbook.addWorksheet('Device Inventory', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
    });    // Set column widths
    sheet.columns = [
        { width: 8 }, { width: 25 }, { width: 18 }, { width: 18 }, { width: 20 },
        { width: 20 }, { width: 15 }, { width: 15 }, { width: 25 }
    ];// Title
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'DEVICE INVENTORY MANAGEMENT REPORT';
    titleCell.style = {
        font: { name: 'Segoe UI', size: 20, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thick', color: { argb: colors.secondary } },
            left: { style: 'thick', color: { argb: colors.secondary } },
            bottom: { style: 'thick', color: { argb: colors.secondary } },
            right: { style: 'thick', color: { argb: colors.secondary } }
        }
    };
    sheet.getRow(1).height = 40;

    // Subtitle with date
    sheet.mergeCells('A2:E2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Generated on: ${currentDate}`;
    dateCell.style = {
        font: { name: 'Segoe UI', size: 12, italic: true, color: { argb: colors.dark } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
        alignment: { horizontal: 'left', vertical: 'middle' },
    };    // Statistics
    sheet.mergeCells('F2:H2');
    const statsCell = sheet.getCell('F2');
    const totalDevices = devices.length;
    const activeDevices = devices.filter(d => d.users_count > 0).length;
    const uniqueTypes = new Set(devices.map(d => d.device_type)).size;
    statsCell.value = `Total: ${totalDevices} | Active: ${activeDevices} | Types: ${uniqueTypes}`;
    statsCell.style = {
        font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: colors.primary } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
        alignment: { horizontal: 'right', vertical: 'middle' },
    };    // Headers
    const headers = ['ID', 'Name Device', 'Model', 'Brand', 'System', 'Users', 'Status', 'Usage Level'];
    let currentRow = 4;

    headers.forEach((header, index) => {
        const cell = sheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.style = {
            font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'medium', color: { argb: 'FFFFFFFF' } },
                left: { style: 'medium', color: { argb: 'FFFFFFFF' } },
                bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
                right: { style: 'medium', color: { argb: 'FFFFFFFF' } }
            }
        };
    });
    sheet.getRow(currentRow).height = 30;
    currentRow++;

    // Data rows
    devices.forEach((device, index) => {
        const usageLevel = device.users_count === 0 ? 'Unused' :
            device.users_count <= 2 ? 'Low Usage' :
                device.users_count <= 5 ? 'Medium Usage' : 'High Usage';

        const status = device.users_count > 0 ? 'Active' : 'Inactive'; const rowData = [
            device.id,
            // device.device_name || 'N/A',
            device.device_type || 'Unknown',
            device.device_name || 'N/A',
            device.brand_name || 'N/A',
            device.system_name || 'N/A',
            device.users_count || 0,
            status,
            usageLevel
        ];

        rowData.forEach((value, colIndex) => {
            const cell = sheet.getCell(currentRow, colIndex + 1);
            cell.value = value;

            let fillColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
            let fontColor = colors.dark;            // Status column styling
            if (colIndex === 7) {
                if (value === 'Active') {
                    fillColor = colors.success;
                    fontColor = 'FFFFFFFF';
                } else {
                    fillColor = 'FFEF4444';
                    fontColor = 'FFFFFFFF';
                }
            }

            // Usage level styling
            if (colIndex === 8) {
                switch (value) {
                    case 'High Usage':
                        fillColor = colors.success;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Medium Usage':
                        fillColor = colors.warning;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Low Usage':
                        fillColor = colors.info;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Unused':
                        fillColor = 'FFEF4444';
                        fontColor = 'FFFFFFFF';
                        break;
                }
            }

            cell.style = {
                font: { name: 'Segoe UI', size: 10, color: { argb: fontColor } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
                alignment: { horizontal: colIndex === 1 ? 'left' : 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                }
            };
        });
        sheet.getRow(currentRow).height = 25;
        currentRow++;
    });

    // Summary section
    currentRow += 2;
    sheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const summaryHeaderCell = sheet.getCell(`A${currentRow}`);
    summaryHeaderCell.value = 'INVENTORY SUMMARY';
    summaryHeaderCell.style = {
        font: { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.info } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    currentRow++;

    // Summary stats
    const summaryData = [
        ['Total Devices', totalDevices, 'Complete inventory count'],
        ['Active Devices', activeDevices, `${Math.round((activeDevices / totalDevices) * 100)}% utilization rate`],
        ['Inactive Devices', totalDevices - activeDevices, 'Available for assignment'],
        ['Device Types', uniqueTypes, 'Different categories available'],
        ['Total Users', devices.reduce((sum, d) => sum + d.users_count, 0), 'Active device users']
    ];

    summaryData.forEach((row) => {
        row.forEach((value, colIndex) => {
            const cell = sheet.getCell(currentRow, colIndex + 1);
            cell.value = value;
            cell.style = {
                font: { name: 'Segoe UI', size: 10, bold: colIndex === 0 },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
                alignment: { horizontal: colIndex === 0 ? 'left' : 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                }
            };
        });
        currentRow++;
    });

    // Generate and download
    const fileName = `Device_Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

    toast.success('Device Inventory Report Generated!', {
        description: `${fileName} has been downloaded with professional formatting and detailed analysis.`
    });
};

// Professional Dashboard Export with advanced styling using ExcelJS
const exportProfessionalDashboard = async (metrics: Record<string, unknown>, charts: Record<string, unknown>, lists: Record<string, unknown>) => {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'Ticketing System';
    workbook.created = new Date();
    workbook.company = 'Professional Dashboard';

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Define professional color scheme
    const colors = {
        primary: 'FF2563EB',      // Blue
        secondary: 'FF1E3A8A',   // Dark Blue
        success: 'FF059669',     // Green
        warning: 'FFF59E0B',     // Yellow
        danger: 'FFDC2626',      // Red
        light: 'FFF8FAFC',       // Light Gray
        dark: 'FF1E293B',        // Dark Gray
        white: 'FFFFFFFF'
    };

    // SHEET 1: Executive Summary
    const summarySheet = workbook.addWorksheet('Executive Summary', {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    // Set column widths
    summarySheet.columns = [
        { width: 35 }, { width: 18 }, { width: 22 }, { width: 30 }
    ];

    // Main Title
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'EXECUTIVE DASHBOARD - TICKETING SYSTEM';
    titleCell.style = {
        font: { name: 'Segoe UI', size: 20, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thick', color: { argb: colors.secondary } },
            left: { style: 'thick', color: { argb: colors.secondary } },
            bottom: { style: 'thick', color: { argb: colors.secondary } },
            right: { style: 'thick', color: { argb: colors.secondary } }
        }
    };
    summarySheet.getRow(1).height = 40;

    // Date and metadata
    summarySheet.mergeCells('A2:B2');
    const dateCell = summarySheet.getCell('A2');
    dateCell.value = `Generation Date: ${currentDate}`;
    dateCell.style = {
        font: { name: 'Segoe UI', size: 12, italic: true, color: { argb: colors.dark } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        }
    };

    // Company info
    summarySheet.mergeCells('C2:D2');
    const logoCell = summarySheet.getCell('C2');
    logoCell.value = 'PROFESSIONAL REPORT';
    logoCell.style = {
        font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: colors.primary } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        }
    };

    // Section: KEY METRICS
    let currentRow = 4;

    // Section header
    summarySheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const metricsHeaderCell = summarySheet.getCell(`A${currentRow}`);
    metricsHeaderCell.value = 'KEY PERFORMANCE METRICS';
    metricsHeaderCell.style = {
        font: { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'medium', color: { argb: colors.primary } },
            left: { style: 'medium', color: { argb: colors.primary } },
            bottom: { style: 'medium', color: { argb: colors.primary } },
            right: { style: 'medium', color: { argb: colors.primary } }
        }
    };
    summarySheet.getRow(currentRow).height = 30;
    currentRow++;

    // Column headers
    const headers = ['Indicator', 'Value', 'Status', 'Trend'];
    headers.forEach((header, index) => {
        const cell = summarySheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.style = {
            font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
            }
        };
    });
    summarySheet.getRow(currentRow).height = 25;
    currentRow++;

    // Metrics data
    const metricsData = [
        ['Total Tickets', metrics.tickets.total, 'Active', '+12% vs last month'],
        ['Open Tickets', metrics.tickets.open, 'Critical', 'Requires immediate attention'],
        ['In Progress Tickets', metrics.tickets.in_progress, 'Processing', '+8% this week'],
        ['Resolved Tickets', metrics.tickets.resolved, 'Completed', '+15% vs target'],
        ['Resolved Today', metrics.tickets.resolved_today, 'Daily', 'Daily productivity'],
        ['Average Time (h)', metrics.tickets.avg_resolution_hours, 'Efficiency', '-2h improvement'],
        ['Unassigned', metrics.tickets.unassigned || 0, 'Pending', 'Requires assignment']
    ];

    metricsData.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
            const cell = summarySheet.getCell(currentRow + rowIndex, colIndex + 1);
            cell.value = value;

            // Determine cell color based on status
            let fillColor = 'FFFFFFFF';
            let fontColor = colors.dark;

            if (colIndex === 2) { // Status column
                switch (value) {
                    case 'Critical':
                        fillColor = colors.danger;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Completed':
                        fillColor = colors.success;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Processing':
                        fillColor = colors.warning;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Pending':
                        fillColor = 'FFFBBF24';
                        fontColor = 'FF1F2937';
                        break;
                    default:
                        fillColor = 'FFF1F5F9';
                        break;
                }
            }

            cell.style = {
                font: {
                    name: 'Segoe UI',
                    size: 11,
                    bold: colIndex === 0,
                    color: { argb: fontColor }
                },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
                alignment: {
                    horizontal: colIndex === 0 ? 'left' : 'center',
                    vertical: 'middle'
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                }
            };
        });
        summarySheet.getRow(currentRow + rowIndex).height = 22;
    });

    currentRow += metricsData.length + 2;

    // SHEET 2: Tickets Analysis
    const ticketsSheet = workbook.addWorksheet('Tickets Analysis', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Set column widths for tickets sheet
    ticketsSheet.columns = [
        { width: 25 }, { width: 15 }, { width: 15 }, { width: 18 }, { width: 20 }
    ];

    // Title
    ticketsSheet.mergeCells('A1:E1');
    const ticketsTitleCell = ticketsSheet.getCell('A1');
    ticketsTitleCell.value = 'DETAILED TICKETS ANALYSIS';
    ticketsTitleCell.style = {
        font: { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thick', color: { argb: colors.secondary } },
            left: { style: 'thick', color: { argb: colors.secondary } },
            bottom: { style: 'thick', color: { argb: colors.secondary } },
            right: { style: 'thick', color: { argb: colors.secondary } }
        }
    };
    ticketsSheet.getRow(1).height = 35;

    // Weekly trend section
    let ticketsRow = 3;
    ticketsSheet.mergeCells(`A${ticketsRow}:E${ticketsRow}`);
    const weeklyHeaderCell = ticketsSheet.getCell(`A${ticketsRow}`);
    weeklyHeaderCell.value = 'WEEKLY TREND ANALYSIS';
    weeklyHeaderCell.style = {
        font: { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    ticketsRow++;

    // Weekly headers
    const weeklyHeaders = ['Week', 'Total Tickets', 'Resolved', 'Resolution Rate', 'Performance'];
    weeklyHeaders.forEach((header, index) => {
        const cell = ticketsSheet.getCell(ticketsRow, index + 1);
        cell.value = header;
        cell.style = {
            font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
            }
        };
    });
    ticketsRow++;

    // Weekly data
    charts.ticketsLastWeek.forEach((item: Record<string, unknown>, index: number) => {
        const resolutionRate = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;
        const performance = resolutionRate >= 80 ? 'Excellent' : resolutionRate >= 60 ? 'Good' : 'Needs Improvement';

        const weekData = [
            `Week ${index + 1}`,
            item.total,
            item.resolved,
            `${resolutionRate}%`,
            performance
        ];

        weekData.forEach((value, colIndex) => {
            const cell = ticketsSheet.getCell(ticketsRow, colIndex + 1);
            cell.value = value;

            let fillColor = 'FFFFFFFF';
            let fontColor = colors.dark;

            if (colIndex === 4) { // Performance column
                switch (value) {
                    case 'Excellent':
                        fillColor = colors.success;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Good':
                        fillColor = colors.warning;
                        fontColor = 'FFFFFFFF';
                        break;
                    case 'Needs Improvement':
                        fillColor = colors.danger;
                        fontColor = 'FFFFFFFF';
                        break;
                }
            }

            cell.style = {
                font: { name: 'Segoe UI', size: 10, color: { argb: fontColor } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                }
            };
        });
        ticketsRow++;
    });

    // SHEET 3: Resources Summary
    const resourcesSheet = workbook.addWorksheet('Resources Summary', {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    resourcesSheet.columns = [
        { width: 30 }, { width: 18 }, { width: 20 }, { width: 25 }
    ];

    // Title
    resourcesSheet.mergeCells('A1:D1');
    const resourcesTitleCell = resourcesSheet.getCell('A1');
    resourcesTitleCell.value = 'SYSTEM RESOURCES SUMMARY';
    resourcesTitleCell.style = {
        font: { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thick', color: { argb: colors.secondary } },
            left: { style: 'thick', color: { argb: colors.secondary } },
            bottom: { style: 'thick', color: { argb: colors.secondary } },
            right: { style: 'thick', color: { argb: colors.secondary } }
        }
    };
    resourcesSheet.getRow(1).height = 35;

    // Resources data
    let resourcesRow = 3;
    resourcesSheet.mergeCells(`A${resourcesRow}:D${resourcesRow}`);
    const portfolioHeaderCell = resourcesSheet.getCell(`A${resourcesRow}`);
    portfolioHeaderCell.value = 'BUILDINGS PORTFOLIO';
    portfolioHeaderCell.style = {
        font: { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    resourcesRow++;

    const resourceHeaders = ['Metric', 'Value', 'Status', 'Observations'];
    resourceHeaders.forEach((header, index) => {
        const cell = resourcesSheet.getCell(resourcesRow, index + 1);
        cell.value = header;
        cell.style = {
            font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
            }
        };
    });
    resourcesRow++;

    const resourcesData = [
        ['Buildings', lists.buildingsWithTickets.length, 'Active', 'Complete management'],
        ['Apartments', metrics.resources.apartments, 'Operational', 'Distribution by buildings'],
        ['Tenants/Members', metrics.resources.tenants, 'Active', 'User base'],
        ['Devices', metrics.resources.devices, 'Monitored', 'Updated inventory'],
        ['Technicians', metrics.resources.technicals, 'Available', 'Active team']
    ];

    resourcesData.forEach((row) => {
        row.forEach((value, colIndex) => {
            const cell = resourcesSheet.getCell(resourcesRow, colIndex + 1);
            cell.value = value;
            cell.style = {
                font: { name: 'Segoe UI', size: 10, bold: colIndex === 0 },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
                alignment: { horizontal: colIndex === 0 ? 'left' : 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                }
            };
        });
        resourcesRow++;
    });

    // Generate and download
    const fileName = `Dashboard_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

    // Show success message
    toast.success('Professional Excel Report Generated!', {
        description: `${fileName} has been downloaded with advanced styling, colors, and professional formatting.`
    });
};

export default function Dashboard({ metrics, charts, lists, googleMapsApiKey }: DashboardProps) {
    const pageProps = usePage().props as unknown as { auth: { user: { roles: { name: string }[]; technical?: { is_default: boolean } } } };
    const isSuperAdmin = pageProps?.auth?.user?.roles?.some((role) => role.name === 'super-admin') || false;
    const isDefaultTechnical = pageProps?.auth?.user?.technical?.is_default || false; const canAssignTickets = isSuperAdmin || isDefaultTechnical;
    // States for modals and UI
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
    const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false);
    const buildingsContainerRef = useRef<HTMLDivElement>(null);

    // Estados para los nuevos componentes avanzados
    const [dashboardFilters, setDashboardFilters] = useState({
        dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date()
        },
        role: '',
        status: '',
        priority: ''
    });

    // Función para manejar cambios en los filtros
    const handleFiltersChange = (newFilters: {
        dateRange: { from?: Date; to?: Date };
        role: string;
        status: string;
        priority: string;
    }) => {
        setDashboardFilters({
            dateRange: {
                from: newFilters.dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                to: newFilters.dateRange.to || new Date()
            },
            role: newFilters.role,
            status: newFilters.status,
            priority: newFilters.priority
        });
    };

    // Función para resetear filtros
    const handleResetFilters = () => {
        setDashboardFilters({
            dateRange: {
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                to: new Date()
            },
            role: '',
            status: '',
            priority: ''
        });
    };

    // Initialize notifications from localStorage or default values
    const getInitialNotifications = (): NotificationItem[] => {
        try {
            const saved = localStorage.getItem('dashboard_notifications');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Convert icon names back to components
                return parsed.map((notif: { iconName: string;[key: string]: unknown }) => ({
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

    // States for appointments
    const [appointments, setAppointments] = useState<AppointmentItem[]>(() => {
        // Get real upcoming appointments from backend
        console.log('Dashboard upcomingAppointments from backend:', lists.upcomingAppointments);
        return lists.upcomingAppointments || [];
    });

    // Update appointments when props change
    useEffect(() => {
        if (lists.upcomingAppointments) {
            console.log('Updating appointments with new data:', lists.upcomingAppointments);
            setAppointments(lists.upcomingAppointments);
        }
    }, [lists.upcomingAppointments]);

    // Calculate upcoming appointments count (next 7 days) - using useMemo for performance
    const upcomingAppointmentsCount = useMemo(() => {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.scheduled_for);
            return appointmentDate >= today && appointmentDate <= nextWeek && appointment.status === 'scheduled';
        }).length;
    }, [appointments]);

    // Get status configuration for appointments
    const getAppointmentStatusConfig = (status: string) => {
        const config = {
            scheduled: {
                label: 'Scheduled',
                color: 'text-blue-500 bg-blue-50',
                icon: Calendar
            },
            in_progress: {
                label: 'In Progress',
                color: 'text-yellow-500 bg-yellow-50',
                icon: PlayCircle
            },
            completed: {
                label: 'Completed',
                color: 'text-green-500 bg-green-50',
                icon: CheckCircle
            },
            cancelled: {
                label: 'Cancelled',
                color: 'text-red-500 bg-red-50',
                icon: X
            },
            rescheduled: {
                label: 'Rescheduled',
                color: 'text-gray-500 bg-gray-50',
                icon: Clock
            }
        };
        return config[status as keyof typeof config] || config.scheduled;
    };

    // Format date and time for appointments
    const formatAppointmentDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    // Navigate to appointment details
    const viewAppointmentDetails = (appointmentId: number) => {
        window.open(`/appointments?appointment=${appointmentId}`, '_blank');
    };

    // Navigate to appointments calendar
    const viewAllAppointments = () => {
        window.open('/appointments', '_blank');
    };

    // Function to show appointment location
    const showAppointmentLocation = (appointment: AppointmentItem) => {
        // Primero cerramos el dropdown para evitar conflictos de overlay
        setIsAppointmentsOpen(false);
        
        // Pequeño delay para asegurar que el dropdown se cierre primero
        setTimeout(() => {
            setSelectedAppointment(appointment);
            setShowLocationModal(true);
        }, 100);
    };

    // Function to close location modal
    const closeLocationModal = useCallback(() => {
        setShowLocationModal(false);
        
        // Pequeño delay para asegurar que el modal se cierre completamente
        setTimeout(() => {
            setSelectedAppointment(null);
            
            // Aseguramos que no haya overlays activos
            document.body.classList.remove('overflow-hidden');
            
            // Eliminamos cualquier elemento .overlay residual
            const overlays = document.querySelectorAll('[data-radix-portal]');
            overlays.forEach(overlay => {
                if (overlay.children.length === 0) {
                    overlay.remove();
                }
            });
        }, 150);
    }, []);

    // Close modal with Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showLocationModal) {
                closeLocationModal();
            }
        };

        if (showLocationModal) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [showLocationModal, closeLocationModal]);

    // Function to get Google Maps embed URL
    const getEmbedUrl = (locationLink: string): string => {
        if (!locationLink) return '';

        if (locationLink.includes('maps.app.goo.gl')) {
            return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=-10.916879,-74.883391&zoom=15`;
        }

        if (locationLink.includes('/embed')) return locationLink;

        if (locationLink.includes('google.com/maps')) {
            const coordsMatch = locationLink.match(/@([-0-9.]+),([-0-9.]+)/);
            if (coordsMatch) {
                return `https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=${coordsMatch[1]},${coordsMatch[2]}&zoom=15`;
            }

            const placeIdMatch = locationLink.match(/place\/([^/]+)/);
            if (placeIdMatch) {
                return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=place_id:${placeIdMatch[1]}`;
            }
        }

        return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(locationLink)}`;
    };

    // Helper function to get building and apartment info from appointment
    const getAppointmentLocation = (appointment: AppointmentItem) => {
        const tenant = appointment.ticket.device?.tenants?.[0];
        const apartment = tenant?.apartment;
        const building = apartment?.building;
        
        return {
            buildingName: building?.name || 'No building',
            unitNumber: apartment?.name || 'N/A',
            locationLink: building?.location_link || '',
            building: building
        };
    };

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
            <AppLayout breadcrumbs={breadcrumbs}>                <Head title="Dashboard" />

                {/* Custom styles for scrollbar */}                <style dangerouslySetInnerHTML={{
                    __html: `
                        .scrollbar-hide {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                        .scrollbar-hide::-webkit-scrollbar {
                            display: none;
                        }
                        
                        /* Custom scrollbar para modales */
                        .custom-scrollbar {
                            scrollbar-width: thin;
                            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
                        }
                        
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 8px;
                        }
                        
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                            border-radius: 4px;
                        }
                        
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: rgba(156, 163, 175, 0.3);
                            border-radius: 4px;
                            transition: background-color 0.2s ease;
                        }
                        
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: rgba(156, 163, 175, 0.6);
                        }
                        
                        .dark .custom-scrollbar {
                            scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
                        }
                        
                        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: rgba(75, 85, 99, 0.3);
                        }
                        
                        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: rgba(75, 85, 99, 0.6);
                        }
                    `
                }} />
                {/* Main container with premium spacing */}
                <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
                    <div className="container mx-auto px-8 py-16 space-y-20">

                        {/* Premium header with maximum spacing */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                            <div className="space-y-8">
                                <div className="flex items-center gap-8">
                                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary via-primary-foreground to-secondary-foreground flex items-center justify-center shadow-2xl ring-4 ring-blue-100">
                                        <BarChart3 className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="space-y-4">                                        <h1 className="text-6xl font-black tracking-tight text-slate-900 dark:text-white">
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
                            </Button>                                <Button
                                variant="outline"
                                size="lg"
                                onClick={() => {
                                    exportProfessionalDashboard(metrics, charts, lists);
                                }}
                                className="gap-4 h-14 px-8 shadow-xl text-lg"
                            >
                                    <Download className="h-6 w-6" />
                                    Export </Button>

                                {/* Appointments Dropdown */}
                                <DropdownMenu 
                                    open={isAppointmentsOpen} 
                                    onOpenChange={setIsAppointmentsOpen}
                                >
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="lg" className="gap-4 h-14 px-8 shadow-xl text-lg relative">
                                            <Calendar className="h-6 w-6" />
                                            Appointments
                                            {upcomingAppointmentsCount > 0 && (
                                                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center p-0">
                                                    {upcomingAppointmentsCount}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-96 max-h-96 mt-4" align="end">
                                        <DropdownMenuLabel className="flex items-center justify-between">
                                            <span className="text-lg font-semibold">Upcoming Appointments</span>
                                            {appointments.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={viewAllAppointments}
                                                    className="text-xs"
                                                >
                                                    View Calendar
                                                </Button>
                                            )}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />

                                        {appointments.length === 0 ? (
                                            <div className="p-4 text-center text-slate-500">
                                                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No upcoming appointments</p>
                                                <p className="text-xs text-slate-400 mt-1">Schedule appointments from ticket details</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                {appointments
                                                    .filter(appointment => {
                                                        const appointmentDate = new Date(appointment.scheduled_for);
                                                        const today = new Date();
                                                        return appointmentDate >= today;
                                                    })
                                                    .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
                                                    .slice(0, 10)
                                                    .map((appointment: AppointmentItem) => {
                                                    const statusConfig = getAppointmentStatusConfig(appointment.status);
                                                    const dateTime = formatAppointmentDateTime(appointment.scheduled_for);
                                                    const locationInfo = getAppointmentLocation(appointment);
                                                    
                                                    return (
                                                        <div key={appointment.id} className="group relative">
                                                            <DropdownMenuItem className="p-0 focus:bg-slate-50 dark:focus:bg-slate-800/50 cursor-pointer">
                                                                <div className="w-full p-4 flex items-center gap-4">
                                                                    {/* Date Circle */}
                                                                    <div className="flex-shrink-0 w-20 h-20 rounded-full border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                                            {new Date(appointment.scheduled_for).toLocaleString('default', { weekday: 'short' }).toLowerCase()}
                                                                        </span>
                                                                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                                            {new Date(appointment.scheduled_for).getDate()}
                                                                        </span>
                                                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                            {new Date(appointment.scheduled_for).toLocaleString('default', { month: 'short' })}
                                                                        </span>
                                                                    </div>

                                                                    {/* Main Content - Info Box */}
                                                                    <div className="flex-1 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                                        {/* Header with Technical and Member Info */}
                                                                        <div className="space-y-1 mb-1.5">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                                        Technical: {appointment.technical.name}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    {locationInfo.locationLink && (
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                showAppointmentLocation(appointment);
                                                                                            }}
                                                                                        >
                                                                                            <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                                                        </Button>
                                                                                    )}
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            viewAppointmentDetails(appointment.id);
                                                                                        }}
                                                                                    >
                                                                                        <Eye className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-sm text-slate-700 dark:text-slate-300">
                                                                                Member: {appointment.ticket.user?.name || "No Member"}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* Building and Unit Info with Location Icon */}
                                                                        <div className="flex items-center mb-1.5">
                                                                            <div className="flex items-center gap-1 flex-1">
                                                                                <MapPin className="h-4 w-4 text-red-500" />
                                                                                <span className="text-sm font-medium text-primary-foreground hover:text-primary-foreground">
                                                                                    Building: {locationInfo.buildingName} apartment {locationInfo.unitNumber}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Time */}
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                                    {dateTime.time}
                                                                                </span>
                                                                            </div>
                                                                            <Badge 
                                                                                variant="outline" 
                                                                                className={`text-xs px-2 py-0.5 ${statusConfig.color} border-current`}
                                                                            >
                                                                                {statusConfig.label}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </DropdownMenuItem>
                                                            
                                                            {/* Separator */}
                                                            <DropdownMenuSeparator className="my-0 last:hidden" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="p-0">
                                            <Button 
                                                variant="ghost" 
                                                className="w-full justify-center py-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={viewAllAppointments}
                                            >
                                                <Calendar className="h-4 w-4 mr-2" />
                                                View All Appointments
                                            </Button>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

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
                                            <div className="max-h-80 overflow-y-auto flex flex-col gap-4">
                                                {notifications.map((notification: NotificationItem) => {
                                                    const IconComponent = notification.icon;
                                                    return (
                                                        <DropdownMenuItem
                                                            key={notification.id}
                                                            className={`p-0 focus:bg-slate-50 dark:!text-slate-100 ${!notification.read ? 'bg-blue-50/50 dark:bg-secondary/10' : ''}`}
                                                        >
                                                            <div className="w-full p-4 flex items-start gap-3 dark:!text-slate-100">
                                                                <div className={`p-2 rounded-lg ${notification.color} flex-shrink-0`}>
                                                                    <IconComponent className="h-4 w-4" />
                                                                </div>

                                                                <div className="flex-1 space-y-1 dark:!text-slate-100">
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className={`text-sm font-semibold dark:!text-slate-100 ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                                                            {notification.title}
                                                                        </h4>
                                                                        <div className="flex items-center gap-1 dark:!text-slate-200">
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

                                                                    <p className={`text-sm dark:!text-slate-100 ${!notification.read ? 'text-slate-700' : 'text-slate-600'}`}>
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
                        <div className="space-y-12">                            <div className="text-center space-y-6">                                <h2 className="text-4xl font-bold text-foreground">
                            Ticket Analytics
                        </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Real-time monitoring of workflow and performance metrics
                            </p>
                        </div>

                            {/* Perfectly aligned metrics grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">                                {/* Card 1: Total Tickets */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-primary/20">
                                                <Ticket className="h-6 w-6 text-primary" />
                                            </div>
                                            <ExternalLink
                                                className="h-4 w-4 text-primary/60 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => window.open('/tickets', '_blank')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Total Tickets</p>
                                            <p className="text-3xl font-bold text-foreground">{metrics.tickets.total}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                                                    +12%
                                                </span>
                                                <span className="text-xs text-muted-foreground">vs last month</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>                                {/* Card 2: Critical Tickets */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-destructive/10 via-background to-destructive/5 overflow-hidden cursor-pointer"
                                    onClick={() => window.open('/tickets?status=open', '_blank')}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-destructive/20">
                                                <AlertCircle className="h-6 w-6 text-destructive" />
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-destructive/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-destructive uppercase tracking-wider">Open Tickets</p>
                                            <p className="text-3xl font-bold text-foreground">{metrics.tickets.open}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/20 text-destructive">                                                    Priority
                                                </span>
                                                <span className="text-xs text-muted-foreground">Immediate attention</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 3: In Progress */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-secondary/10 via-background to-secondary/5 overflow-hidden cursor-pointer"
                                    onClick={() => window.open('/tickets?status=in_progress', '_blank')}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-secondary/20">
                                                <Clock className="h-6 w-6 text-secondary" />
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity" />                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-secondary uppercase tracking-wider">In Progress</p>
                                            <p className="text-3xl font-bold text-foreground">{metrics.tickets.in_progress}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                                                    +8%
                                                </span>
                                                <span className="text-xs text-muted-foreground">This week</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 4: Resolved */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-accent/10 via-background to-accent/5 overflow-hidden cursor-pointer"
                                    onClick={() => window.open('/tickets?status=resolved', '_blank')}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-accent/20">
                                                <CheckCircle className="h-6 w-6 text-accent" />
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-accent/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-accent uppercase tracking-wider">Resolved</p>
                                            <p className="text-3xl font-bold text-foreground">{metrics.tickets.resolved}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/20 text-accent">
                                                    +15%
                                                </span>
                                                <span className="text-xs text-muted-foreground">vs target</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Additional metrics cards - Second row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Card 5: Unassigned (only visible for admins and default technicians) */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-3/10 via-background to-chart-3/5 overflow-hidden">
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
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.tickets.unassigned || 0}</p>
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
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-4/10 via-background to-chart-4/5 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-purple-100">
                                                <Calendar className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Resolved Today</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white ">{metrics.tickets.resolved_today}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                                    Today
                                                </span>
                                                <span className="text-xs text-slate-500">Daily Productivity</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 7: Average Time */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-2/10 via-background to-chart-2/5 overflow-hidden">
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
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.tickets.avg_resolution_hours}h</p>
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
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-5/10 via-background to-chart-5/5 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-teal-100">
                                                <BarChart3 className="h-6 w-6 text-teal-600" />
                                            </div>
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider">Efficiency</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
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
                        {lists.unassignedTickets && lists.unassignedTickets.length > 0 && (
                            <div className="space-y-8">                                <div className="text-center space-y-4">                                    <h2 className="text-4xl font-bold text-chart-3">
                                Unassigned Tickets
                            </h2>
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                                <div className="text-center space-y-4">                                    <div className="flex items-center justify-center gap-4">                                        <h2 className="text-4xl font-bold text-foreground">
                                    System Resources
                                </h2>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-semibold">
                                        Full Access - Admin
                                    </Badge>
                                </div>
                                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                        Comprehensive management of buildings, apartments, users and devices
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Buildings Card - Enhanced with carousel */}
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-1/10 via-background to-chart-1/5 overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-4">
                                                <div className="p-4 rounded-xl bg-violet-100 w-fit mx-auto">
                                                    <Building className="h-8 w-8 text-violet-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider">Buildings</p>
                                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.resources.buildings}</p>
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
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-2/10 via-background to-chart-2/5 overflow-hidden cursor-pointer"
                                    >
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-4">
                                                <div className="p-4 rounded-xl bg-blue-100 w-fit mx-auto">
                                                    <Home className="h-8 w-8 text-blue-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Apartments</p>
                                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.resources.apartments}</p>
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
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-3/10 via-background to-chart-3/5 overflow-hidden cursor-pointer"
                                    >
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-4">
                                                <div className="p-4 rounded-xl bg-emerald-100 w-fit mx-auto">
                                                    <Users className="h-8 w-8 text-emerald-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Members</p>
                                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.resources.tenants}</p>
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
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-4/10 via-background to-chart-4/5 overflow-hidden cursor-pointer"
                                        onClick={() => setShowDevicesModal(true)}>
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-4">
                                                <div className="p-4 rounded-xl bg-amber-100 w-fit mx-auto">
                                                    <Smartphone className="h-8 w-8 text-amber-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Devices</p>
                                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.resources.devices}</p>
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
                        <div className="space-y-16">                            <div className="text-center space-y-6">
                            <h2 className="text-5xl font-black text-foreground">
                                Visual Analysis
                            </h2>
                            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto font-semibold">
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
                                {/* <Button
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
                                    </Button> */}
                            </div>
                        </div>

                            <div className="grid gap-20 lg:grid-cols-12">
                                {/* Main Chart - Ticket Distribution */}                                <div className="lg:col-span-6">
                                    <Card className="h-full border-0 bg-gradient-to-br from-muted/20 via-background to-primary/5 shadow-2xl overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
                                        <CardHeader className="pb-12 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-4">
                                                    <CardTitle className="text-3xl font-black text-foreground">Ticket Distribution</CardTitle>
                                                    <p className="text-xl text-muted-foreground">Estado actual del sistema</p>
                                                </div>
                                                <div className="flex gap-4">                                                    <Button
                                                    variant="outline"
                                                    size="lg"
                                                    onClick={() => {
                                                        const totalTickets = Object.values(charts.ticketsByStatus).reduce((sum, val) => sum + val, 0);
                                                        exportTicketDistributionExcel(charts.ticketsByStatus, totalTickets);
                                                    }}
                                                    className="h-14 w-14 p-0 hover:bg-primary/10 shadow-xl border-primary/20 hover:scale-105 transition-all duration-300"
                                                    title="Export Professional Analysis"
                                                >                                                        <FileSpreadsheet className="h-6 w-6 text-primary" />
                                                </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        onClick={() => window.open('/tickets', '_blank')}
                                                        className="h-14 w-14 p-0 hover:bg-primary/10 shadow-xl border-primary/20"
                                                    >
                                                        <ExternalLink className="h-6 w-6 text-primary" />
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

                                {/* Gráfico de Tendencias */}                                <div className="lg:col-span-6">
                                    <Card className="h-full border-0 bg-gradient-to-br from-secondary/10 via-background to-accent/5 shadow-2xl overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-accent/5"></div>
                                        <CardHeader className="pb-12 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-4">
                                                    <CardTitle className="text-3xl font-black text-foreground">Weekly Trend</CardTitle>
                                                    <p className="text-xl text-muted-foreground font-semibold">Ticket evolution over the last 7 days</p>
                                                </div>
                                                <div className="flex gap-4">                                                    <Button
                                                    variant="outline"
                                                    size="lg"
                                                    onClick={() => {
                                                        const exportData = charts.ticketsLastWeek.map(item => ({
                                                            date: item.date,
                                                            count: item.count
                                                        }));
                                                        exportWeeklyTrendExcel(exportData);
                                                    }}
                                                    className="h-14 w-14 p-0 hover:bg-secondary/10 shadow-xl border-secondary/20 hover:scale-105 transition-all duration-300"
                                                    title="Export Weekly Trend Analysis"
                                                >
                                                    <FileSpreadsheet className="h-6 w-6 text-secondary" />
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
                                                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6} />
                                                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
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

                    {/* SECTION 3: ADVANCED CHARTS */}
                    <div className="space-y-6 mt-4">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold text-foreground">
                                Advanced Analytics
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Interactive charts and visualizations
                            </p>
                        </div>
                        <AdvancedCharts
                            data={{
                                ticketsByStatus: Object.entries(charts.ticketsByStatus).map(([status, count]) => ({
                                    status,
                                    count: count as number,
                                    color: status === 'open' ? '#ef4444' :
                                        status === 'in_progress' ? '#f59e0b' :
                                            status === 'resolved' ? '#10b981' : '#6b7280'
                                })),
                                ticketsByPriority: Object.entries(charts.ticketsByPriority).map(([priority, count]) => ({
                                    priority,
                                    count: count as number,
                                    color: priority === 'high' ? '#dc2626' :
                                        priority === 'medium' ? '#ea580c' :
                                            priority === 'low' ? '#16a34a' : '#6b7280'
                                })),
                                ticketsByBuilding: lists.buildingsWithTickets.map(b => ({
                                    building: b.name,
                                    count: b.tickets_count
                                })),
                                ticketsOverTime: charts.ticketsLastWeek.map((item, index) => ({
                                    month: `Day ${index + 1}`,
                                    created: item.count,
                                    resolved: Math.floor(item.count * 0.8)
                                })),
                                deviceIssues: lists.problematicDevices.map(d => ({
                                    device: d.device_name,
                                    count: d.tickets_count,
                                    avgResolution: 24
                                })),
                                techniciansPerformance: lists.topTechnicals.map(t => ({
                                    technician: t.name,
                                    resolved: t.tickets_count,
                                    avg_time: 18
                                }))
                            }}
                        />
                    </div>

                


                      {/* FOOTER PREMIUM */}
                        <div className="mt-32">
                            <Card className="border-0 bg-chart-5 text-background shadow-2xl overflow-hidden relative dark:bg-white/10">
                                <div className="absolute inset-0 bg-primary/10 dark:bg-transparent"></div>
                                <CardContent className="p-16 relative">
                                    <div className="grid gap-16 lg:grid-cols-4">                                        <div className="text-center space-y-4">
                                        <div className="p-6 rounded-3xl bg-primary/20 w-fit mx-auto dark:bg-primary">
                                            <Activity className="h-10 w-10 text-primary dark:text-primary-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-4xl font-black text-background">
                                                {metrics.tickets.total + metrics.tickets.resolved_today}
                                            </p>
                                            <p className="text-primary/80 font-bold text-lg">Total Processed</p>
                                        </div>
                                    </div>

                                        <div className="text-center space-y-4">
                                            <div className="p-6 rounded-3xl bg-primary/20 w-fit mx-auto dark:bg-primary">
                                                <TrendingUp className="h-10 w-10 text-primary dark:text-primary-foreground" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black text-background">98.5%</p>
                                                <p className="text-primary/80 font-bold text-lg">Uptime</p>
                                            </div>
                                        </div>

                                        <div className="text-center space-y-4">
                                            <div className="p-6 rounded-3xl bg-accent/20 w-fit mx-auto dark:bg-primary">
                                                <Users className="h-10 w-10 text-accent dark:text-primary-foreground" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black text-background">
                                                    {metrics.resources.tenants + metrics.resources.technicals}
                                                </p>
                                                <p className="text-accent/80 font-bold text-lg">Active Users</p>
                                            </div>
                                        </div>

                                        <div className="text-center space-y-4">
                                            <div className="p-6 rounded-3xl bg-chart-1/20 w-fit mx-auto dark:bg-primary">
                                                <Zap className="h-10 w-10 text-chart-1 dark:text-primary-foreground" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-4xl font-black text-background">
                                                    {Math.round(metrics.tickets.avg_resolution_hours * 0.8)}h
                                                </p>
                                                <p className="text-chart-1/80 font-bold text-lg">Response Time</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                      
                    </div>



                </div>                {/* Devices Modal con animaciones mejoradas */}
                {showDevicesModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300"
                        onClick={() => setShowDevicesModal(false)}
                    >
                        <div
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-chart-4/10 to-chart-3/10 dark:from-chart-4/20 dark:to-chart-3/20">
                                <div className="flex items-center gap-3 animate-in slide-in-from-left-4 duration-700 delay-200">
                                    <div className="p-3 rounded-xl bg-chart-4/20 dark:bg-chart-4/30">
                                        <Smartphone className="h-6 w-6 text-chart-4 dark:text-chart-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground dark:text-white">Device Management</h2>
                                        <p className="text-muted-foreground dark:text-gray-300">Complete overview of all devices in the system</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={() => setShowDevicesModal(false)}
                                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 animate-in slide-in-from-right-4 duration-700 delay-200 transition-all hover:scale-105"
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-white dark:bg-gray-900 scroll-smooth custom-scrollbar">
                                {lists.allDevices && lists.allDevices.length > 0 ? (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-700 delay-300">
                                        {/* Device Summary Cards con animación escalonada */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-primary/20 dark:border-primary/30 dark:bg-gray-800/50 animate-in slide-in-from-left-2 duration-500 delay-400 hover:scale-105 transition-transform">
                                                <CardContent className="p-4 text-center">
                                                    <Monitor className="h-8 w-8 text-primary dark:text-primary mx-auto mb-2" />
                                                    <h3 className="font-semibold text-primary dark:text-primary">Total Devices</h3>
                                                    <p className="text-2xl font-bold text-foreground dark:text-white">{lists.allDevices.length}</p>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10 border-secondary/20 dark:border-secondary/30 dark:bg-gray-800/50 animate-in slide-in-from-bottom-2 duration-500 delay-500 hover:scale-105 transition-transform">
                                                <CardContent className="p-4 text-center">
                                                    <Users className="h-8 w-8 text-secondary dark:text-secondary mx-auto mb-2" />
                                                    <h3 className="font-semibold text-secondary dark:text-secondary">Active Users</h3>
                                                    <p className="text-2xl font-bold text-foreground dark:text-white">
                                                        {lists.allDevices.reduce((sum, device) => sum + device.users_count, 0)}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10 border-accent/20 dark:border-accent/30 dark:bg-gray-800/50 animate-in slide-in-from-right-2 duration-500 delay-600 hover:scale-105 transition-transform">
                                                <CardContent className="p-4 text-center">
                                                    <BarChart3 className="h-8 w-8 text-accent dark:text-accent mx-auto mb-2" />
                                                    <h3 className="font-semibold text-accent dark:text-accent">Device Types</h3>
                                                    <p className="text-2xl font-bold text-foreground dark:text-white">
                                                        {new Set(lists.allDevices.map(d => d.device_type)).size}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Devices Table */}
                                        <Card className="border-0 shadow-lg dark:bg-gray-800/50 dark:border-gray-700">
                                            <CardHeader className="pb-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:!bg-transparent">
                                                <div className="flex items-center justify-between dark:!bg-transparent">
                                                    <CardTitle className="text-xl text-foreground dark:text-white">Device Inventory</CardTitle>                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => exportDevicesExcel(lists.allDevices)}
                                                        className="gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 hover:text-gray-700 dark:text-gray-300 hover:scale-105 transition-all duration-300"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Export
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0 bg-white dark:bg-gray-800/50">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">                                                        <thead>
                                                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70">
                                                            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Device</th>

                                                            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Model</th>
                                                            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Brand</th>
                                                            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">System</th>
                                                            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Users</th>
                                                            <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Status</th>
                                                        </tr>
                                                    </thead>
                                                        <tbody>
                                                            {lists.allDevices.map((device, index) => (<tr key={device.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800/30' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-4/20 to-chart-3/20 dark:from-chart-4/30 dark:to-chart-3/30 flex items-center justify-center">
                                                                            <Laptop className="h-4 w-4 text-chart-4 dark:text-chart-4" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold text-foreground dark:text-white text-sm">  {device.device_type || 'Unknown'}</p>

                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="py-3 px-4">
                                                                    <span className="text-sm font-medium text-foreground dark:text-white">
                                                                        {device.device_type || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className="text-sm font-medium text-foreground dark:text-white">{device.brand_name}</span>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className="text-sm text-muted-foreground dark:text-gray-400">{device.system_name}</span>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Users className="h-4 w-4 text-accent dark:text-accent" />
                                                                        <span className="font-semibold text-accent dark:text-accent">{device.users_count}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={device.users_count > 0
                                                                            ? "bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent border-accent/20 dark:border-accent/30"
                                                                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
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
                                        <Smartphone className="h-16 w-16 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-muted-foreground dark:text-gray-300 mb-2">No Devices Found</h3>
                                        <p className="text-muted-foreground dark:text-gray-400">No device data is available at the moment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Location Modal */}
                <Dialog 
                    open={showLocationModal} 
                    onOpenChange={(open) => {
                        if (!open) closeLocationModal();
                    }}
                >
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-600" />
                                Appointment Location - {selectedAppointment ? getAppointmentLocation(selectedAppointment).buildingName : ''}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Appointment Details */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                    {selectedAppointment?.title}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Calendar className="h-4 w-4" />
                                        <span>{selectedAppointment ? formatAppointmentDateTime(selectedAppointment.scheduled_for).date : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Clock className="h-4 w-4" />
                                        <span>{selectedAppointment ? formatAppointmentDateTime(selectedAppointment.scheduled_for).time : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <User className="h-4 w-4" />
                                        <span>{selectedAppointment?.technical.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Ticket className="h-4 w-4" />
                                        <span>#{selectedAppointment?.ticket.code}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                                    <Home className="h-4 w-4 mt-0.5" />
                                    <div>
                                        <div className="font-medium">{selectedAppointment ? getAppointmentLocation(selectedAppointment).buildingName : ''}</div>
                                        <div className="text-xs text-slate-500">
                                            Unit {selectedAppointment ? getAppointmentLocation(selectedAppointment).unitNumber : ''} • {selectedAppointment?.address}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Map */}
                            <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                <iframe
                                    src={getEmbedUrl(selectedAppointment ? getAppointmentLocation(selectedAppointment).locationLink : '')}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="w-full h-full"
                                />
                            </div>
                            
                            {/* Footer with Action Button */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                {selectedAppointment && getAppointmentLocation(selectedAppointment).locationLink && (
                                    <Button
                                        onClick={() => {
                                            window.open(getAppointmentLocation(selectedAppointment).locationLink, '_blank');
                                        }}
                                        className="px-6"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open in Google Maps
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
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
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ technical_id: selectedTech })
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(result.message || 'Ticket assigned successfully!');
                // Recargar la página para mostrar datos actualizados
                router.reload({ only: ['lists'] });
            } else {
                // Manejar errores de validación
                if (response.status === 422) {
                    const errorData = await response.json();
                    const errorMessages = Object.values(errorData.errors || {}).flat();
                    toast.error(errorMessages.join(', ') || 'Validation error');
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    toast.error(errorData.message || errorData.error || 'Failed to assign ticket');
                }
            }
        } catch (error) {
            toast.error('Error assigning ticket');
            console.error('Assignment error:', error);
        } finally {
            setIsAssigning(false);
        }
    }; const getStatusBadge = (status: string) => {
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
                </div>            </td>
        </tr>
    );
}