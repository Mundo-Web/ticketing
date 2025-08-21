import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps, type User as UserType } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Search as SearchIcon, Plus, CalendarPlus } from 'lucide-react';

// Extended User interface for dashboard
interface ExtendedUser extends UserType {
    roles: string[] | { name: string }[];
    technical?: { is_default: boolean };
    tenant?: {
        apartment: {
            id: number;
            name: string;
            building?: {
                id: number;
                name: string;
            };
        };
    };
}

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
    DialogDescription,
} from "@/components/ui/dialog";

// Icons
import {
    Building, Users, Ticket, Wrench, Smartphone, TrendingUp, Clock,
    CheckCircle, AlertCircle, Home, Activity, BarChart3, Calendar,
    Timer, Download, ExternalLink, RefreshCcw, FileSpreadsheet,
    Bell, Zap, UserPlus, UserCheck, AlertTriangle, X, User, Phone, Mail,
    Monitor, ChevronLeft, ChevronRight, Laptop, Check,
    MessageSquare, Info, AlertOctagon, MapPin, PlayCircle, Eye
} from 'lucide-react';

// Charts - D3.js
import D3BarChart from '@/components/charts/D3BarChart';
import D3PieChart from '@/components/charts/D3PieChart';
import {
    ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    Area, AreaChart
} from 'recharts';

// Export utilities
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Advanced Dashboard Components
import AdvancedCharts from '@/components/dashboard/AdvancedCharts';

interface AppointmentItem {
    id: number;
    title: string;
    description?: string;
    address: string;
    scheduled_for: string;
    scheduled_at?: string; // Added for compatibility
    date?: string; // Added for compatibility
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
    id: string;
    type: string;
    data: {
        type: string;
        ticket_id?: number;
        ticket_code?: string;
        title: string;
        message: string;
        action_url?: string;
        icon?: string;
        color?: string;
        assigned_to?: string;
        assigned_to_id?: number;
        assigned_to_email?: string;
        assigned_by?: string;
        assigned_by_id?: number;
        assigned_by_email?: string;
        created_at: string;
    };
    read_at: string | null;
    created_at: string;
}

interface TechnicalInstruction {
    from: string;
    instruction: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    sent_at: string;
    read: boolean;
}

interface DashboardProps extends PageProps {
    metrics: {
        tickets: {
            total: number;
            open: number;
            in_progress: number;
            resolved: number;
            resolved_today: number;
            created_today: number;
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
        technical: {
            today_tickets: number;
            upcoming_visits: number;
            urgent_tickets: number;
            is_technical: boolean;
            is_default: boolean;
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
        technicalAnalysis: Array<{
            id: number;
            name: string;
            tickets_open: number;
            tickets_in_progress: number;
            tickets_resolved: number;
            total_tickets: number;
        }>;
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
    technicalInstructions?: TechnicalInstruction[];
    currentTechnical?: {
        id: number;
        name: string;
        is_default: boolean;
    } | null;
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
        const trendDirection = vsAverage > 15 ? 'â†— Above Average' :
            vsAverage < -15 ? 'â†˜ Below Average' :
                'â†’ Normal Range';

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

// Define Ticket interface for the modal
interface TicketModalItem {
    id: number;
    code: string;
    title: string;
    status: string;
    created_at: string;
    user?: {
        name: string;
        email?: string;
    };
    device?: {
        id?: number;
        name?: string;
        apartment?: {
            name: string;
            building?: {
                name: string;
            };
        };
    };
}

// Ticket Modal Component
const TicketsModal = ({
    isOpen,
    onClose,
    tickets,
    title
}: {
    isOpen: boolean,
    onClose: () => void,
    tickets: TicketModalItem[],
    title: string
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'open': 'bg-red-100 text-red-800 border border-red-200',
            'in_progress': 'bg-blue-100 text-blue-800 border border-blue-200',
            'resolved': 'bg-green-100 text-green-800 border border-green-200',
            'closed': 'bg-gray-100 text-gray-800 border border-gray-200',
            'cancelled': 'bg-red-100 text-red-800 border border-red-200',
            'reopened': 'bg-purple-100 text-purple-800 border border-purple-200'
        };

        return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="text-lg">
                        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    {tickets.length > 0 ? (
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                //onClick={() => router.visit(`/tickets/${ticket.id}`)}
                                >
                                    {/* Header with Code and Status */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                #{ticket.code}
                                            </span>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(ticket.status)}`}>
                                                {ticket.status.toUpperCase().replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatDate(ticket.created_at)}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                                        {ticket.title}
                                    </h3>

                                    {/* User and Device Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        {/* User Info */}
                                        {ticket.user && (
                                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                                                        {ticket.user.name?.substring(0, 1) || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-purple-900 truncate">
                                                            {ticket.user.name}
                                                        </p>
                                                        {ticket.user.email && (
                                                            <p className="text-xs text-purple-700 truncate">
                                                                {ticket.user.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Device Info */}
                                        {ticket.device && (
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-green-900 truncate">
                                                            {ticket.device.name_device.name || 'Device'}
                                                        </p>
                                                        {ticket.device.apartment && (
                                                            <div className="flex items-center gap-1">
                                                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                                                </svg>
                                                                <p className="text-xs text-green-700 truncate">
                                                                    {ticket.device.apartment.name}
                                                                    {ticket.device.apartment.building && ` - ${ticket.device.apartment.building.name}`}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer with ID and Action */}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-500 font-mono">
                                            ID: {ticket.id}
                                        </span>

                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
                            <p className="text-gray-500">There are no tickets in this category at the moment.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function Dashboard({
    metrics,
    charts,
    lists,
    googleMapsApiKey,
    technicalInstructions = [],
    currentTechnical = null
}: DashboardProps) {
    const pageProps = usePage().props as unknown as { auth: { user: { roles: string[] | { name: string }[]; technical?: { is_default: boolean } } } };
    console.log('PageProps structure:', pageProps);
    console.log('Auth user:', pageProps?.auth?.user);
    console.log('Roles array:', pageProps?.auth?.user?.roles);
    console.log('First role:', pageProps?.auth?.user?.roles?.[0]);

    // Handle both string array and object array formats for roles
    const userRoles = pageProps?.auth?.user?.roles || [];
    const isSuperAdmin = userRoles.some((role) =>
        typeof role === 'string' ? role === 'super-admin' : role.name === 'super-admin'
    ) || false;
    const isTechnical = userRoles.some((role) =>
        typeof role === 'string' ? role === 'technical' : role.name === 'technical'
    ) || false;
    const isDefaultTechnical = pageProps?.auth?.user?.technical?.is_default || false;
    const isDoorman = userRoles.some((role) =>
        typeof role === 'string' ? role === 'doorman' : role.name === 'doorman'
    ) || false;
    const isOwner = userRoles.some((role) =>
        typeof role === 'string' ? role === 'owner' : role.name === 'owner'
    ) || false;
    const isTenant = userRoles.some((role) =>
        typeof role === 'string' ? role === 'tenant' : role.name === 'tenant'
    ) || false;
    const canAssignTickets = isSuperAdmin || isDefaultTechnical;
    // States for modals and UI
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
    const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false);
    const buildingsContainerRef = useRef<HTMLDivElement>(null);

    // States for ticket modals
    const [showOpenTicketsModal, setShowOpenTicketsModal] = useState(false);
    const [showInProgressTicketsModal, setShowInProgressTicketsModal] = useState(false);
    const [showResolvedTicketsModal, setShowResolvedTicketsModal] = useState(false);
    const [modalTickets, setModalTickets] = useState<TicketModalItem[]>([]);

    // Helper function to format dates
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Estados para instrucciones del technical
    console.log('Dashboard Props - technicalInstructions:', technicalInstructions);
    console.log('Is Technical:', isTechnical);
    console.log('User Roles:', pageProps?.auth?.user?.roles);
    const [currentInstructions, setCurrentInstructions] = useState<TechnicalInstruction[]>(technicalInstructions || []);

    // FunciÃ³n para marcar instrucciÃ³n como leÃ­da
    const markInstructionAsRead = async (instructionIndex: number) => {
        try {
            await fetch(route('dashboard.mark-instruction-read'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ instruction_index: instructionIndex }),
            });

            // Actualizar estado local
            setCurrentInstructions(prev =>
                prev.map((instruction, index) =>
                    index === instructionIndex ? { ...instruction, read: true } : instruction
                )
            );

            toast.success('Instruction marked as read');
        } catch (error) {
            console.error('Error marking instruction as read:', error);
            toast.error('Failed to mark instruction as read');
        }
    };

    // Estados para notificaciones REALES de la base de datos
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    // Función para cargar notificaciones reales desde la API
    const fetchNotifications = async () => {
        try {
            console.log('🔔 Dashboard: Fetching notifications...');
            const response = await fetch('/notifications/api');
            if (response.ok) {
                const data = await response.json();
                console.log('🔔 Dashboard: Notifications response:', data);

                if (data.success) {
                    const notificationsArray = data.notifications || [];
                    const unreadCount = data.unread_count || 0;

                    console.log('🔔 Dashboard: Setting notifications:', notificationsArray.length);
                    console.log('🔔 Dashboard: Setting unread count:', unreadCount);

                    setNotifications(notificationsArray);
                    setUnreadNotifications(unreadCount);
                } else {
                    console.error('🔔 Dashboard: API returned success=false:', data);
                    setNotifications([]);
                    setUnreadNotifications(0);
                }
            } else {
                console.error('🔔 Dashboard: Error loading notifications:', response.status);
                setNotifications([]);
                setUnreadNotifications(0);
            }
        } catch (error) {
            console.error('🔔 Dashboard: Error fetching notifications:', error);
            setNotifications([]);
            setUnreadNotifications(0);
        }
    };

    // Función para marcar como leída
    const markAsRead = async (notificationId: string) => {
        try {
            console.log('🔔 Marking notification as read:', notificationId);

            router.post(`/notifications/${notificationId}/read`, {}, {
                onSuccess: () => {
                    setNotifications(prev =>
                        prev.map(n =>
                            n.id === notificationId
                                ? { ...n, read_at: new Date().toISOString() }
                                : n
                        )
                    );
                    setUnreadNotifications(prev => Math.max(0, prev - 1));
                    console.log('🔔 Notification marked as read successfully');
                    toast.success('Notification marked as read');
                },
                onError: (errors) => {
                    console.error('🔔 Error marking notification as read:', errors);
                    toast.error('Failed to mark notification as read');
                }
            });
        } catch (error) {
            console.error('🔔 Error marking notification as read:', error);
            toast.error('Network error occurred');
        }
    };

    // Función para marcar todas como leídas
    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
            console.log('🔔 Marking all notifications as read:', unreadIds.length, 'notifications');

            if (unreadIds.length === 0) {
                toast.info('No unread notifications to mark');
                return;
            }

            // Usar Promise.all con router.post para cada notificación
            const markPromises = unreadIds.map(id =>
                new Promise<void>((resolve, reject) => {
                    router.post(`/notifications/${id}/read`, {}, {
                        onSuccess: () => resolve(),
                        onError: () => reject(new Error(`Failed to mark notification ${id} as read`))
                    });
                })
            );

            await Promise.all(markPromises);

            setNotifications(prev =>
                prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
            );
            setUnreadNotifications(0);
            console.log('🔔 All notifications marked as read successfully');
            toast.success(`${unreadIds.length} notifications marked as read`);
        } catch (error) {
            console.error('🔔 Error marking all notifications as read:', error);
            toast.error('Failed to mark all notifications as read');
        }
    };

    // Función para eliminar notificación
    const clearNotification = async (notificationId: string) => {
        try {
            router.delete(`/notifications/${notificationId}`, {
                onSuccess: () => {
                    setNotifications(prev => prev.filter(n => n.id !== notificationId));

                    const wasUnread = notifications.find(n => n.id === notificationId && !n.read_at);
                    if (wasUnread) {
                        setUnreadNotifications(prev => Math.max(0, prev - 1));
                    }
                    toast.success('Notification deleted');
                },
                onError: (errors) => {
                    console.error('Error deleting notification:', errors);
                    toast.error('Failed to delete notification');
                }
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Network error occurred');
        }
    };

    // Cargar notificaciones al montar el componente
    useEffect(() => {
        fetchNotifications();

        // Refrescar notificaciones cada 30 segundos
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, []);

    // States for appointments
    const [appointments, setAppointments] = useState<AppointmentItem[]>(() => {
        // Get real upcoming appointments from backend
        console.log('=== INITIAL APPOINTMENT DEBUG ===');
        console.log('Dashboard upcomingAppointments from backend:', lists.upcomingAppointments);
        console.log('User email from pageProps:', (pageProps?.auth?.user as ExtendedUser)?.email);
        console.log('Current technical from props:', currentTechnical);
        console.log('User roles:', pageProps?.auth?.user?.roles);
        console.log('Is technical user:', isTechnical);
        console.log('Is default technical:', isDefaultTechnical);

        // Add more detailed debugging
        if (lists.upcomingAppointments && lists.upcomingAppointments.length > 0) {
            console.log('Total appointments received:', lists.upcomingAppointments.length);
            console.log('First appointment details:', lists.upcomingAppointments[0]);
            console.log('All appointment technical assignments:',
                lists.upcomingAppointments.map(app => ({
                    id: app.id,
                    title: app.title,
                    scheduled_for: app.scheduled_for,
                    technical_id: app.technical?.id,
                    technical_name: app.technical?.name,
                    status: app.status
                }))
            );

            // For regular technical users (not default), filter to show only their appointments
            if (isTechnical && !isDefaultTechnical && currentTechnical) {
                const filteredAppointments = lists.upcomingAppointments.filter(
                    app => app.technical && app.technical.id === currentTechnical.id
                );
                console.log('Filtered appointments for technical:', filteredAppointments.length);
                console.log('My appointments details:', filteredAppointments);
                console.log('=== END INITIAL APPOINTMENT DEBUG ===');
                return filteredAppointments;
            }

            console.log('=== END INITIAL APPOINTMENT DEBUG ===');
        } else {
            console.log('No appointments in initial props');
            console.log('=== END INITIAL APPOINTMENT DEBUG ===');
        }

        return lists.upcomingAppointments || [];
    });

    // Update appointments when props change
    useEffect(() => {
        if (lists.upcomingAppointments) {
            console.log('Updating appointments with new data:', lists.upcomingAppointments);

            // For regular technical users (not default), filter to show only their appointments
            if (isTechnical && !isDefaultTechnical && currentTechnical) {
                const filteredAppointments = lists.upcomingAppointments.filter(
                    app => app.technical && app.technical.id === currentTechnical.id
                );
                console.log('Filtered appointments for technical on update:', filteredAppointments.length);
                setAppointments(filteredAppointments);
            } else {
                setAppointments(lists.upcomingAppointments);
            }
        }
    }, [lists.upcomingAppointments, isTechnical, isDefaultTechnical, currentTechnical]);

    // Calculate upcoming appointments count (next 3 days) - using useMemo for performance
    const upcomingAppointmentsCount = useMemo(() => {
        if (!appointments || appointments.length === 0) {
            console.log('No appointments available in state');
            return 0;
        }

        console.log('Total appointments in state:', appointments.length);
        console.log('All appointments:', appointments);

        const today = new Date();
        // Set to beginning of the day
        today.setHours(0, 0, 0, 0);

        // Next 3 days (today + 2 more days)
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 2);
        threeDaysLater.setHours(23, 59, 59, 999);

        console.log('Date range for appointments:', {
            today: today.toISOString(),
            threeDaysLater: threeDaysLater.toISOString()
        });

        // Add extra debugging
        const filteredAppointments = appointments.filter(appointment => {
            // Log each appointment to see its structure
            console.log('Processing appointment:', appointment);

            // Handle different field names in the data
            const dateField = appointment.scheduled_for || appointment.scheduled_at || appointment.date || '';
            console.log('Date field found:', dateField);

            const appointmentDate = new Date(dateField);
            console.log('Parsed date:', appointmentDate.toISOString());

            // Skip invalid dates
            if (isNaN(appointmentDate.getTime())) {
                console.log('Invalid date, skipping');
                return false;
            }

            const isInRange = appointmentDate >= today && appointmentDate <= threeDaysLater;
            const isNotCanceled = appointment.status !== 'canceled' && appointment.status !== 'cancelled';

            // Include appointments that are in progress even if they started earlier today
            const isInProgressToday = appointment.status === 'in_progress' &&
                appointmentDate.toDateString() === today.toDateString();

            const shouldInclude = (isInRange || isInProgressToday) && isNotCanceled;

            console.log('Is in range:', isInRange, 'Is not canceled:', isNotCanceled, 'Is in progress today:', isInProgressToday, 'Should include:', shouldInclude);

            return shouldInclude;
        });

        console.log('Filtered appointments count:', filteredAppointments.length);
        console.log('Filtered appointments:', filteredAppointments);

        return filteredAppointments.length;
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

        // PequeÃ±o delay para asegurar que el dropdown se cierre primero
        setTimeout(() => {
            setSelectedAppointment(appointment);
            setShowLocationModal(true);
        }, 100);
    };

    // Function to close location modal
    const closeLocationModal = useCallback(() => {
        setShowLocationModal(false);

        // PequeÃ±o delay para asegurar que el modal se cierre completamente
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
    };

    // Function to fetch tickets by status
    const fetchTicketsByStatus = async (status: string) => {
        try {
            const response = await fetch(`/api/tickets?status=${status}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setModalTickets(data.tickets || []);

            // Open the appropriate modal based on status
            if (status === 'open') {
                setShowOpenTicketsModal(true);
            } else if (status === 'in_progress') {
                setShowInProgressTicketsModal(true);
            } else if (status === 'resolved') {
                setShowResolvedTicketsModal(true);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Failed to load tickets. Please try again.');
        }
    };

    // Update the text every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setUpdateText(calculateTimeSinceUpdate(lastUpdated));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [lastUpdated]);

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
                <div className="mx-auto px-4 py-16 space-y-20">

                    {/* Premium header with maximum spacing */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-8">
                            <div className="flex items-center gap-8">
                                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary via-primary-foreground to-secondary-foreground flex items-center justify-center shadow-2xl ring-4 ring-blue-100">
                                    <BarChart3 className="h-10 w-10 text-white" />
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-6xl font-black tracking-tight text-slate-900 dark:text-white">
                                        {isTechnical && !isSuperAdmin ? "ADK Assist Dashboard" : "Dashboard"}
                                    </h1>
                                    <p className="text-2xl text-slate-600 font-medium">
                                        {isSuperAdmin
                                            ? "Administrative control center of the system"
                                            : isTechnical && !isSuperAdmin
                                                ? "Your technical management control center"
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
                                </div>
                                <div className="flex items-center gap-4">
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
                        <div className="flex flex-wrap items-center gap-6">
                            <Button
                                variant="outline"
                                size="lg"
                                className="gap-4 h-14 px-4 shadow-xl"
                                onClick={handleRefresh}
                            >
                                <RefreshCcw className="h-6 w-6" />
                            </Button>

                            {/* Appointments Dropdown */}
                            <DropdownMenu
                                open={isAppointmentsOpen}
                                onOpenChange={setIsAppointmentsOpen}
                            >
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="lg" className="gap-4 h-14 px-4 shadow-xl relative">
                                        <Calendar className="h-6 w-6" />
                                        {upcomingAppointmentsCount > 0 && (
                                            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center p-0">
                                                {upcomingAppointmentsCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-96 max-h-96 mt-4" align="end">
                                    <DropdownMenuLabel className="flex items-center justify-between">
                                        <span className="text-lg font-semibold">All Appointments</span>
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
                                            <p className="text-sm">No appointments found</p>
                                            <p className="text-xs text-slate-400 mt-1">Schedule appointments from ticket details</p>
                                        </div>
                                    ) : (
                                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                            {appointments
                                                .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
                                                .map((appointment: AppointmentItem) => {
                                                    const statusConfig = getAppointmentStatusConfig(appointment.status);
                                                    const dateTime = formatAppointmentDateTime(appointment.scheduled_for);
                                                    const locationInfo = getAppointmentLocation(appointment);
                                                    const appointmentDate = new Date(appointment.scheduled_for);
                                                    const today = new Date();

                                                    // Check if it's today OR if it's yesterday after 6pm
                                                    const isToday = appointmentDate.toDateString() === today.toDateString();
                                                    const isYesterdayLate = (() => {
                                                        const yesterday = new Date();
                                                        yesterday.setDate(yesterday.getDate() - 1);
                                                        return appointmentDate.toDateString() === yesterday.toDateString() &&
                                                            appointmentDate.getHours() >= 18;
                                                    })();

                                                    // Treat late night appointments from yesterday as "today"
                                                    const showAsTodayAppointment = isToday || isYesterdayLate;

                                                    return (
                                                        <div key={appointment.id} className="group relative">
                                                            <DropdownMenuItem className={`p-0 focus:bg-slate-50 dark:focus:bg-slate-800/50 cursor-pointer ${showAsTodayAppointment ? 'border-2 border-red-500 rounded-lg my-1 bg-red-50/50' : ''}`}>
                                                                <div className={`w-full p-4 flex items-center gap-4 ${showAsTodayAppointment ? 'bg-red-50 rounded-lg border border-red-200' : ''}`}>
                                                                    {/* Date Circle */}
                                                                    <div className={`flex-shrink-0 w-20 h-20 rounded-full border ${showAsTodayAppointment ? 'border-red-400 bg-red-100' : 'border-slate-200 dark:border-slate-700'} flex flex-col items-center justify-center text-center`}>
                                                                        <span className={`text-sm font-medium ${showAsTodayAppointment ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                            {new Date(appointment.scheduled_for).toLocaleString('default', { weekday: 'short' }).toLowerCase()}
                                                                        </span>
                                                                        <span className={`text-2xl font-bold ${showAsTodayAppointment ? 'text-red-700' : 'text-slate-900 dark:text-slate-100'}`}>
                                                                            {new Date(appointment.scheduled_for).getDate()}
                                                                        </span>
                                                                        <span className={`text-xs font-medium ${showAsTodayAppointment ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                            {new Date(appointment.scheduled_for).toLocaleString('default', { month: 'short' })}
                                                                        </span>
                                                                    </div>

                                                                    {/* Main Content - Info Box */}
                                                                    <div className={`flex-1 p-3 ${showAsTodayAppointment ? 'bg-white border-red-200' : 'bg-white dark:bg-slate-800'} rounded-lg border ${showAsTodayAppointment ? 'border-red-200' : 'border-slate-200 dark:border-slate-700'} shadow-sm`}>
                                                                        {/* Header with Technical and Member Info */}
                                                                        <div className="space-y-1 mb-1.5">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className={`text-sm font-medium ${showAsTodayAppointment ? 'text-red-800' : 'text-slate-900 dark:text-slate-100'}`}>
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
                                                                            <div className={`text-sm ${showAsTodayAppointment ? 'text-red-700' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                                Member: {appointment.ticket.user?.name || "No Member"}
                                                                            </div>
                                                                        </div>

                                                                        {/* Building and Unit Info with Location Icon */}
                                                                        <div className="flex items-center mb-1.5">
                                                                            <div className="flex items-center gap-1 flex-1">
                                                                                <MapPin className={`h-4 w-4 ${showAsTodayAppointment ? 'text-red-600' : 'text-red-500'}`} />
                                                                                <span className={`text-sm font-medium ${showAsTodayAppointment ? 'text-red-800' : 'text-primary-foreground'} hover:text-primary-foreground`}>
                                                                                    Building: {locationInfo.buildingName} apartment {locationInfo.unitNumber}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Time */}
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Clock className={`h-3.5 w-3.5 ${showAsTodayAppointment ? 'text-red-600' : 'text-slate-500'}`} />
                                                                                <span className={`text-xs font-medium ${showAsTodayAppointment ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                                    {dateTime.time}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                {showAsTodayAppointment && (
                                                                                    <Badge className="text-xs px-2 py-0.5 bg-red-500 text-white ">
                                                                                        {isYesterdayLate ? 'Urgent!' : 'Today!'}
                                                                                    </Badge>
                                                                                )}
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={`text-xs px-2 py-0.5 ${statusConfig.color} border-current`}
                                                                                >
                                                                                    {statusConfig.label}
                                                                                </Badge>
                                                                            </div>
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
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="gap-4 h-14 px-4 shadow-xl relative hover:shadow-2xl transition-all duration-300 hover:scale-105"
                                    >
                                        <Bell className="h-6 w-6" />
                                        {unreadNotifications > 0 && (
                                            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs flex items-center justify-center p-0 notification-badge-pulse border-2 border-white shadow-lg">
                                                {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[420px] max-h-[520px] mt-4 notification-dropdown shadow-2xl border-0" align="end">
                                    {/* Header con gradiente */}
                                    <div className=" px-4 py-2 rounded-t-lg">
                                        <div className="flex items-center justify-between text-primary-foreground">
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-5 w-5" />
                                                <span className="text-lg font-bold ">Notifications</span>
                                                {unreadNotifications > 0 && (
                                                    <Badge className="bg-primary/20 text-secondary text-xs px-2 py-1 notification-badge-pulse">
                                                        {unreadNotifications} new
                                                    </Badge>
                                                )}
                                            </div>
                                            {unreadNotifications > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={markAllAsRead}
                                                    className="text-white bg-primary hover:bg-primary text-xs font-medium"
                                                >
                                                    Mark all read
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                                <Bell className="h-10 w-10 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">All caught up!</h3>
                                            <p className="text-sm text-gray-500">No new notifications at the moment</p>
                                        </div>
                                    ) : (
                                        <div className="max-h-[400px] overflow-y-auto notification-scrollbar">
                                            <div className="p-2 space-y-1">
                                                {notifications.map((notification: NotificationItem) => {
                                                    // Mapear iconos basado en el tipo de notificación
                                                    const IconComponent = notification.data.icon === 'user-plus' ? UserPlus :
                                                        notification.data.icon === 'clipboard-check' ? CheckCircle :
                                                            notification.data.icon === 'user-check' ? UserCheck :
                                                                notification.data.icon === 'users' ? Users :
                                                                    notification.data.icon === 'check-circle' ? CheckCircle :
                                                                        notification.data.icon === 'alert-circle' ? AlertCircle :
                                                                            notification.data.icon === 'info' ? Info : Bell;

                                                    // Formatear tiempo relativo más elegante
                                                    const timeAgo = (() => {
                                                        const now = new Date();
                                                        const created = new Date(notification.created_at);
                                                        const diffMs = now.getTime() - created.getTime();
                                                        const diffMins = Math.floor(diffMs / 60000);
                                                        const diffHours = Math.floor(diffMs / 3600000);
                                                        const diffDays = Math.floor(diffMs / 86400000);

                                                        if (diffMins < 1) return 'Just now';
                                                        if (diffMins < 60) return `${diffMins}m ago`;
                                                        if (diffHours < 24) return `${diffHours}h ago`;
                                                        if (diffDays < 7) return `${diffDays}d ago`;
                                                        return created.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                                    })();

                                                    // Determinar colores más modernos y elegantes
                                                    const getColorScheme = () => {
                                                        switch (notification.data.color) {
                                                            case 'green': return {
                                                                icon: 'text-emerald-600 bg-gradient-to-r from-emerald-50 to-green-50',
                                                                border: 'border-emerald-200',
                                                                accent: 'text-emerald-600'
                                                            };
                                                            case 'blue': return {
                                                                icon: 'text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50',
                                                                border: 'border-blue-200',
                                                                accent: 'text-blue-600'
                                                            };
                                                            case 'red': return {
                                                                icon: 'text-red-600 bg-gradient-to-r from-red-50 to-pink-50',
                                                                border: 'border-red-200',
                                                                accent: 'text-red-600'
                                                            };
                                                            case 'purple': return {
                                                                icon: 'text-purple-600 bg-gradient-to-r from-purple-50 to-violet-50',
                                                                border: 'border-purple-200',
                                                                accent: 'text-purple-600'
                                                            };
                                                            default: return {
                                                                icon: 'text-gray-600 bg-gradient-to-r from-gray-50 to-slate-50',
                                                                border: 'border-gray-200',
                                                                accent: 'text-gray-600'
                                                            };
                                                        }
                                                    };

                                                    const colorScheme = getColorScheme();

                                                    return (
                                                        <DropdownMenuItem
                                                            key={notification.id}
                                                            className={`p-0 cursor-pointer group transition-all duration-200 rounded-xl overflow-hidden notification-item ${!notification.read_at
                                                                    ? 'bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-200/50 shadow-sm notification-unread'
                                                                    : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50'
                                                                }`}
                                                            onClick={() => {
                                                                if (!notification.read_at) {
                                                                    markAsRead(notification.id);
                                                                }
                                                                /* if (notification.data.action_url) {
                                                                        window.open(notification.data.action_url, '_blank');
                                                                    }*/
                                                            }}
                                                        >
                                                            <div className="w-full p-4 flex items-start gap-4">
                                                                {/* Icon with gradient background */}
                                                                <div className={`relative p-3 rounded-xl ${colorScheme.icon} shadow-sm group-hover:shadow-md transition-shadow`}>
                                                                    <IconComponent className="h-5 w-5" />
                                                                    {!notification.read_at && (
                                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1 space-y-2 min-w-0">
                                                                    {/* Header */}
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h4 className={`text-sm font-bold leading-tight ${!notification.read_at ? 'text-gray-900' : 'text-gray-700'
                                                                            }`}>
                                                                            {notification.data.title}
                                                                        </h4>
                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                            <span className="text-xs text-gray-500 font-medium">
                                                                                {timeAgo}
                                                                            </span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    clearNotification(notification.id);
                                                                                }}
                                                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Message */}
                                                                    <p className={`text-sm leading-relaxed ${!notification.read_at ? 'text-gray-800' : 'text-gray-600'
                                                                        }`}>
                                                                        {notification.data.message}
                                                                    </p>

                                                                    {/* Enhanced ticket info */}
                                                                    {notification.data.type === 'ticket_assigned' && (
                                                                        <div className="mt-3 space-y-2">
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {notification.data.ticket_code && (
                                                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200">
                                                                                        <span className="mr-1">🎫</span>
                                                                                        {notification.data.ticket_code}
                                                                                    </span>
                                                                                )}
                                                                                {notification.data.assigned_to && notification.data.assigned_to_id && (
                                                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200">
                                                                                        <span className="mr-1">👨‍💼</span>
                                                                                        {notification.data.assigned_to}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {notification.data.assigned_by && notification.data.assigned_by_id && (
                                                                                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 border border-gray-200">
                                                                                    <span className="font-medium text-gray-700">Assigned by:</span> {notification.data.assigned_by}
                                                                                    <span className="ml-1 text-gray-400">(ID: {notification.data.assigned_by_id})</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Action buttons */}
                                                                    {!notification.read_at && (
                                                                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    markAsRead(notification.id);
                                                                                }}
                                                                                className="h-8 px-3 text-xs font-medium hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-all"
                                                                            >
                                                                                <Check className="h-3 w-3 mr-1.5" />
                                                                                Mark read
                                                                            </Button>

                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>


                    {/* SECCIÃ“N ESPECIAL: Instrucciones del Technical (solo para tÃ©cnicos) */}
                    {console.log('Rendering instructions section - isTechnical:', isTechnical, 'currentInstructions:', currentInstructions)}
                    {isTechnical && currentInstructions.length > 0 && (
                        <div className="space-y-6">
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
                                    <MessageSquare className="h-8 w-8 text-blue-500" />
                                    Instructions from Management
                                </h2>
                                <p className="text-lg text-muted-foreground">
                                    Important instructions and guidelines from your supervisors
                                </p>
                            </div>

                            {/* Horizontal scrollable container for instructions */}
                            <div className="relative">
                                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                                    {currentInstructions
                                        // TEMPORAL: Comentar filtro para debugging
                                        // .filter(instruction => !instruction.read)
                                        .slice(0, 5) // Mostrar máximo 5 instrucciones
                                        .map((instruction, index) => {
                                            const priorityColors = {
                                                low: 'from-blue-500/10 to-blue-600/5 border-blue-200 text-blue-700',
                                                normal: 'from-gray-500/10 to-gray-600/5 border-gray-200 text-gray-700',
                                                high: 'from-orange-500/10 to-orange-600/5 border-orange-200 text-orange-700',
                                                urgent: 'from-red-500/10 to-red-600/5 border-red-200 text-red-700'
                                            };

                                            const priorityIcons = {
                                                low: Info,
                                                normal: MessageSquare,
                                                high: AlertTriangle,
                                                urgent: AlertOctagon
                                            };

                                            const PriorityIcon = priorityIcons[instruction.priority];

                                            return (
                                                <Card
                                                    key={index}
                                                    className={`flex-shrink-0 w-80 transition-all duration-300 hover:shadow-lg border-l-4 bg-gradient-to-r ${priorityColors[instruction.priority]} snap-start`}
                                                >
                                                    <CardContent className="p-5">
                                                        <div className="space-y-4">
                                                            {/* Header with priority and action */}
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-lg flex-shrink-0 ${instruction.priority === 'urgent' ? 'bg-red-100' : 'bg-white/50'
                                                                        }`}>
                                                                        <PriorityIcon className={`h-4 w-4 ${instruction.priority === 'urgent' ? 'text-red-600' : 'text-current'
                                                                            }`} />
                                                                    </div>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`font-semibold uppercase text-xs ${instruction.priority === 'urgent' ? 'border-red-500 text-red-700 bg-red-50' : ''
                                                                            }`}
                                                                    >
                                                                        {instruction.priority}
                                                                    </Badge>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => markInstructionAsRead(index)}
                                                                    className="h-8 w-8 p-0 hover:bg-white/20"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            {/* From and date */}
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-muted-foreground">
                                                                    From: <strong className="text-foreground">{instruction.from}</strong>
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(instruction.sent_at).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>

                                                            {/* Instruction text */}
                                                            <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                                                <p className="text-foreground leading-relaxed text-sm">
                                                                    {instruction.instruction}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                </div>

                                {/* Scroll indicators */}
                                {currentInstructions.length > 1 && (
                                    <div className="flex justify-center mt-4 gap-2">
                                        {currentInstructions.slice(0, 5).map((_, index) => (
                                            <div
                                                key={index}
                                                className="w-2 h-2 rounded-full bg-muted-foreground/30"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* All caught up message */}
                            {currentInstructions.filter(i => !i.read).length === 0 && (
                                <Card className="max-w-md mx-auto">
                                    <CardContent className="p-8 text-center">
                                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground mb-2">All caught up!</h3>
                                        <p className="text-muted-foreground">You have no pending instructions.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}



                    {/* SECTION 1: KEY TICKET METRICS */}
                    <div className="space-y-12">                            <div className="text-center space-y-6">                                <h2 className="text-4xl font-bold text-foreground">
                        {isTechnical && !isSuperAdmin
                            ? "My Tickets"
                            : isDoorman
                                ? "Building Tickets"
                                : "Ticket Analytics"}
                    </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {isTechnical && !isSuperAdmin
                                ? "Tickets assigned to you and your work summary"
                                : isDoorman
                                    ? "Monitor tickets for your building residents"
                                    : "Real-time monitoring of workflow and performance metrics"
                            }
                        </p>
                    </div>

                        {/* Perfectly aligned metrics grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">                                {/* Card 1: Total Tickets - Hide for regular technicians */}
                            {(!isTechnical || isSuperAdmin || isDefaultTechnical) && (
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
                                            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                                                {isTechnical && !isSuperAdmin ? "Mis Tickets Totales" : "Total Tickets"}
                                            </p>
                                            <p className="text-3xl font-bold text-foreground">{metrics.tickets.total}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                                                    +12%
                                                </span>
                                                <span className="text-xs text-muted-foreground">vs last month</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}                                {/* Card 2: Critical Tickets - Clean design like In Progress */}
                            <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-destructive/10 via-background to-destructive/5 overflow-hidden cursor-pointer animate-pulse duration-1000"
                                onClick={() => fetchTicketsByStatus('open')}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-destructive/20">
                                            <AlertCircle className="h-6 w-6 text-destructive" />
                                        </div>
                                        <SearchIcon className="h-4 w-4 text-destructive/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-destructive uppercase tracking-wider">
                                            {isTechnical && !isSuperAdmin ? "Assigned Tickets" : "Open Tickets"}
                                        </p>
                                        <p className="text-3xl font-bold text-foreground">{metrics.tickets.open}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/20 text-destructive">
                                                {isTechnical && !isSuperAdmin ? "Active" : "Priority"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {isTechnical && !isSuperAdmin ? "Your assignments" : "Immediate attention"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 3: In Progress - Enhanced for technicians */}
                            <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-secondary/10 via-background to-secondary/5 overflow-hidden cursor-pointer"
                                onClick={() => fetchTicketsByStatus('in_progress')}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-secondary/20">
                                            <Clock className="h-6 w-6 text-secondary" />
                                        </div>
                                        <SearchIcon className="h-4 w-4 text-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity" />                                        </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-secondary uppercase tracking-wider">
                                            {isTechnical && !isSuperAdmin ? "In Progress - My Tickets" : "In Progress"}
                                        </p>
                                        <p className="text-3xl font-bold text-foreground">{metrics.tickets.in_progress}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                                                +8%
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {isTechnical && !isSuperAdmin ? "Active work" : "This week"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 4: Resolved - Enhanced for technicians */}
                            <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-accent/10 via-background to-accent/5 overflow-hidden cursor-pointer"
                                onClick={() => fetchTicketsByStatus('resolved')}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-accent/20">
                                            <CheckCircle className="h-6 w-6 text-accent" />
                                        </div>
                                        <SearchIcon className="h-4 w-4 text-accent/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-accent uppercase tracking-wider">
                                            {isTechnical && !isSuperAdmin ? "My Resolved Tickets" : "Resolved"}
                                        </p>
                                        <p className="text-3xl font-bold text-foreground">{metrics.tickets.resolved}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/20 text-accent">
                                                +15%
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {isTechnical && !isSuperAdmin ? "My productivity" : "vs target"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 4: Upcoming Appointments - Only for technicians */}
                            {(isTechnical && !isSuperAdmin && !isDefaultTechnical) && (
                                <Card
                                    className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-green-50 via-background to-green-100 overflow-hidden cursor-pointer"
                                    onClick={() => window.open('/appointments', '_blank')}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-green-100">
                                                <CalendarPlus className="h-6 w-6 text-green-600" />
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-green-600/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">
                                                Upcoming Appointments
                                            </p>
                                            <p className="text-3xl font-bold text-foreground">{metrics.technical.upcoming_visits}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                    Scheduled
                                                </span>
                                                <span className="text-xs text-muted-foreground">go to calendar</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Additional metrics cards - Second row - Hide for regular technicians */}
                        {(!isTechnical || isSuperAdmin || isDefaultTechnical) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Card 5: Unassigned (only visible for admins and default technicians) */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-3/10 via-background to-chart-3/5 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-orange-100">
                                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                                            </div>
                                            {canAssignTickets && metrics.tickets.unassigned > 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 px-3 text-xs hover:bg-orange-50 hover:text-orange-900 border-orange-200 text-orange-700"
                                                    onClick={() => {
                                                        const section = document.querySelector('[data-section="unassigned-tickets"]');
                                                        if (section) {
                                                            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                    }}
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

                                {/* Card 6: Created Today (for Owner/Doorman) or Resolved Today (for others) */}
                                {(isOwner || isDoorman) ? (
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-3/10 via-background to-chart-3/5 overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 rounded-xl bg-green-100">
                                                    <Plus className="h-6 w-6 text-green-600" />
                                                </div>
                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">Created Today</p>
                                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.tickets.created_today || 0}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                        New
                                                    </span>
                                                    <span className="text-xs text-slate-500">Daily intake</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
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
                                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.tickets.resolved_today}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                                        Today
                                                    </span>
                                                    <span className="text-xs text-slate-500">Daily Productivity</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Card 7: Resolved Today (for Owner/Doorman) or Average Time (for others) */}
                                {(isOwner || isDoorman) ? (
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
                                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.tickets.resolved_today}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                                        Today
                                                    </span>
                                                    <span className="text-xs text-slate-500">Daily Productivity</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-chart-2/10 via-background to-chart-2/5 overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 rounded-xl bg-indigo-100">
                                                    <Timer className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                    -2h
                                                </span>
                                            </div>
                                            <div className="space-y-2">
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
                                )}

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
                                                    Resolution
                                                </span>
                                                <span className="text-xs text-slate-500">Tasa general</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>                            </div>
                        )}
                    </div>


                    {/* SECTION: ENHANCED UNASSIGNED TICKETS TABLE */}
                    {lists.unassignedTickets && lists.unassignedTickets.length > 0 && (
                        <div className="space-y-12" data-section="unassigned-tickets">
                            {/* Premium Header Section */}
                            <div className="text-center space-y-6">
                                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-100 to-orange-50 rounded-full shadow-lg">
                                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                                    <span className="text-sm font-bold text-orange-700 uppercase tracking-wider">
                                        Immediate Action Required
                                    </span>
                                </div>
                                <h2 className="text-4xl font-bold bg-gradient-to-br from-orange-600 to-orange-800 bg-clip-text text-transparent">
                                    Unassigned Tickets
                                </h2>
                                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                    Critical tickets awaiting technical assignment - streamlined management for maximum efficiency
                                </p>
                            </div>

                            {/* Enhanced Card Container */}
                            <Card className="group border-0 shadow-2xl bg-gradient-to-br from-white via-slate-50/30 to-orange-50/20 backdrop-blur-sm transition-all duration-500 hover:shadow-3xl hover:-translate-y-1 overflow-hidden">
                                {/* Animated gradient border */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-200/30 via-transparent to-orange-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Premium Header */}
                                <CardHeader className="relative border-b border-gradient-to-r from-orange-200/50 via-slate-200/30 to-orange-200/50 bg-gradient-to-r from-orange-50/50 via-white to-slate-50/50 backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 shadow-lg group-hover:shadow-xl transition-all duration-300">
                                                    <AlertTriangle className="h-6 w-6 text-orange-700" />
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                                    <span className="text-xs font-bold text-white">{lists.unassignedTickets.length}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <CardTitle className="text-2xl font-bold text-slate-800 group-hover:text-orange-700 transition-colors">
                                                    Critical Unassigned Queue
                                                </CardTitle>
                                                <p className="text-sm text-slate-600 font-medium">
                                                    Managing {lists.unassignedTickets.length} urgent ticket{lists.unassignedTickets.length !== 1 ? 's' : ''} requiring immediate technical assignment
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-2 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg border border-orange-300">
                                                <span className="text-sm font-bold text-orange-700">Priority: High</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300 text-orange-700 hover:from-orange-200 hover:to-orange-300 hover:border-orange-400 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                                                onClick={() => window.open('/tickets', '_blank')}
                                            >
                                                <UserPlus className="h-5 w-5 mr-2" />
                                                Bulk Assignment Portal
                                                <ExternalLink className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Enhanced Table Content */}
                                <CardContent className="relative p-0 overflow-hidden">
                                    {/* Animated background pattern */}
                                    <div className="absolute inset-0 opacity-5">
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-transparent to-slate-100 animate-pulse duration-3000"></div>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 animate-pulse"></div>
                                    </div>

                                    <div className="relative overflow-x-auto custom-scrollbar">
                                        <table className="w-full border-collapse">
                                            {/* Premium Table Header */}
                                            <thead className="bg-gradient-to-r from-slate-100/50 via-orange-50/30 to-slate-100/50 sticky top-0 z-10">
                                                <tr className="border-b-2 border-orange-200/50">
                                                    <th className="text-left py-6 px-8 font-bold text-slate-800 text-sm uppercase tracking-wider">
                                                        <div className="flex items-center gap-2">
                                                            <Ticket className="h-4 w-4 text-orange-600" />
                                                            Ticket Details
                                                        </div>
                                                    </th>
                                                    <th className="text-left py-6 px-8 font-bold text-slate-800 text-sm uppercase tracking-wider">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-orange-600" />
                                                            Location
                                                        </div>
                                                    </th>
                                                    <th className="text-left py-6 px-8 font-bold text-slate-800 text-sm uppercase tracking-wider">
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="h-4 w-4 text-orange-600" />
                                                            Device
                                                        </div>
                                                    </th>
                                                    <th className="text-left py-6 px-8 font-bold text-slate-800 text-sm uppercase tracking-wider">
                                                        <div className="flex items-center gap-2">
                                                            <Activity className="h-4 w-4 text-orange-600" />
                                                            Category
                                                        </div>
                                                    </th>
                                                    <th className="text-left py-6 px-8 font-bold text-slate-800 text-sm uppercase tracking-wider">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-orange-600" />
                                                            Created
                                                        </div>
                                                    </th>
                                                    <th className="text-center py-6 px-8 font-bold text-slate-800 text-sm uppercase tracking-wider">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Zap className="h-4 w-4 text-orange-600" />
                                                            Quick Actions
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>

                                            {/* Enhanced Table Body */}
                                            <tbody className="divide-y divide-slate-100/50">
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
                                                    <tr className="relative group">
                                                        {/* Animated gradient background for empty state */}
                                                        <td colSpan={6} className="relative py-20 text-center overflow-hidden">
                                                            {/* Premium background with multiple gradients */}
                                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-25 to-teal-50 opacity-80"></div>
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-green-100/30 to-transparent"></div>

                                                            {/* Floating elements */}
                                                            <div className="absolute top-4 left-4 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-60"></div>
                                                            <div className="absolute top-8 right-8 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                            <div className="absolute bottom-6 left-1/3 w-4 h-4 bg-teal-400 rounded-full animate-bounce opacity-40"></div>

                                                            <div className="relative z-10 space-y-6">
                                                                {/* Premium success icon */}
                                                                <div className="relative inline-flex">
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
                                                                    <div className="relative flex items-center justify-center">
                                                                        <CheckCircle className="h-20 w-20 text-green-500 drop-shadow-lg animate-bounce" />
                                                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                                                                            <Check className="h-4 w-4 text-white font-bold" />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Enhanced messaging */}
                                                                <div className="space-y-4">
                                                                    <h3 className="text-2xl font-black text-green-800 tracking-tight">
                                                                        🎉 Outstanding Performance!
                                                                    </h3>
                                                                    <p className="text-lg font-bold text-green-700">
                                                                        All tickets successfully assigned to technical team
                                                                    </p>
                                                                    <p className="text-sm text-green-600 max-w-lg mx-auto leading-relaxed font-medium">
                                                                        Exceptional workflow management - every support request has been efficiently distributed
                                                                        to qualified technicians. The system is running at optimal efficiency.
                                                                    </p>
                                                                </div>

                                                                {/* Status indicators */}
                                                                <div className="flex items-center justify-center gap-4 pt-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                                                                        <span className="text-xs text-green-700 font-bold uppercase tracking-wider">System Optimized</span>
                                                                    </div>
                                                                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Activity className="h-3 w-3 text-green-600" />
                                                                        <span className="text-xs text-green-600 font-semibold">100% Efficiency</span>
                                                                    </div>
                                                                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Users className="h-3 w-3 text-green-600" />
                                                                        <span className="text-xs text-green-600 font-semibold">Team Active</span>
                                                                    </div>
                                                                </div>

                                                                {/* Achievement badge */}
                                                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white shadow-xl mt-6">
                                                                    <CheckCircle className="h-5 w-5" />
                                                                    <span className="text-sm font-bold uppercase tracking-wider">Perfect Assignment Rate</span>
                                                                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                                                                </div>
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



                    {/* DOORMAN/OWNER SPECIFIC DASHBOARD SECTION */}
                    {(isDoorman || isOwner) && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <h2 className="text-4xl font-bold text-foreground">
                                    {isOwner ? "Owner Dashboard" : "Doorman Dashboard"}
                                </h2>
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                    Building management overview and resident ticket monitoring
                                </p>
                            </div>

                            {/* Building Overview & Apartment Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Enhanced Tickets by Apartment */}
                                <Card className="group col-span-1 border-0 shadow-xl bg-gradient-to-br from-slate-50/50 via-background to-slate-100/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                    <CardHeader className="relative border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-background pb-6">
                                        <CardTitle className="flex items-center gap-3 text-xl">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                                <Home className="h-6 w-6 text-slate-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground">Tickets by Apartment</h3>
                                                <p className="text-sm text-muted-foreground font-normal">Building unit distribution</p>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative p-6">
                                        <div className="space-y-4">
                                            {metrics.building && metrics.building.tickets_by_apartment && Object.entries(metrics.building.tickets_by_apartment).slice(0, 6).map(([apartment, data], index) => {
                                                // Handle both simple count and complex object data
                                                const count = typeof data === 'object' && data !== null ? (data.count || 0) : (data || 0);
                                                const apartmentName = typeof data === 'object' && data !== null ? (data.apartment_name || apartment) : apartment;
                                                const floor = typeof data === 'object' && data !== null ? data.floor : null;

                                                return (
                                                    <div key={apartment}
                                                        className="group/item flex items-center justify-between p-5 bg-gradient-to-r from-white/80 via-white/70 to-white/80 rounded-xl hover:from-white/95 hover:via-white/90 hover:to-white/95 transition-all duration-300 shadow-sm hover:shadow-xl border border-slate-200/50 hover:border-slate-300/70 cursor-pointer transform hover:-translate-y-1"
                                                        style={{ animationDelay: `${index * 100}ms` }}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 flex items-center justify-center shadow-lg group-hover/item:shadow-xl transition-all duration-300 group-hover/item:scale-110">
                                                                <Home className="w-7 h-7 text-primary transition-transform duration-300 group-hover/item:scale-110" />
                                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-lg text-slate-900 group-hover/item:text-primary transition-colors duration-300">{apartmentName}</p>
                                                                <p className="text-sm text-slate-600 group-hover/item:text-slate-700 transition-colors duration-300 flex items-center gap-2">
                                                                    <Building className="w-4 h-4" />
                                                                    {floor ? `Floor ${floor} • Unit` : 'Apartment unit'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-3xl font-black text-slate-900 group-hover/item:text-primary transition-colors duration-300">{count}</p>
                                                            <p className="text-xs text-slate-600 uppercase tracking-widest font-bold group-hover/item:text-slate-700 transition-colors duration-300">tickets</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(!metrics.building?.tickets_by_apartment || Object.keys(metrics.building.tickets_by_apartment).length === 0) && (
                                                <div className="text-center py-16 text-slate-500">
                                                    <div className="relative mx-auto mb-8 w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-lg">
                                                        <Home className="w-12 h-12 opacity-40" />
                                                    </div>
                                                    <p className="text-xl font-bold mb-2">No apartment data available</p>
                                                    <p className="text-sm">Apartment ticket breakdown will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Enhanced Building Statistics */}
                                <Card className="group col-span-1 border-0 shadow-xl bg-gradient-to-br from-emerald-50/50 via-background to-emerald-100/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                    <CardHeader className="relative border-b border-emerald-200/50 bg-gradient-to-r from-emerald-50 to-background pb-6">
                                        <CardTitle className="flex items-center gap-3 text-xl">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-200 to-emerald-300 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                                <Building className="h-6 w-6 text-emerald-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground">Building Overview</h3>
                                                <p className="text-sm text-muted-foreground font-normal">Resource statistics</p>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative p-6">
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="group/stat bg-gradient-to-br from-blue-50 via-blue-100/90 to-blue-200/80 p-6 rounded-xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 rounded-lg bg-blue-200/70 group-hover/stat:bg-blue-300/80 transition-colors duration-300">
                                                            <Building className="w-5 h-5 text-blue-700" />
                                                        </div>
                                                        <span className="text-sm font-bold text-blue-700 uppercase tracking-widest">Apartments</span>
                                                    </div>
                                                    <p className="text-4xl font-black text-blue-700 group-hover/stat:text-blue-800 transition-colors duration-300">{metrics.resources?.apartments || 0}</p>
                                                </div>
                                                <div className="group/stat bg-gradient-to-br from-green-50 via-green-100/90 to-green-200/80 p-6 rounded-xl border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 rounded-lg bg-green-200/70 group-hover/stat:bg-green-300/80 transition-colors duration-300">
                                                            <Users className="w-5 h-5 text-green-700" />
                                                        </div>
                                                        <span className="text-sm font-bold text-green-700 uppercase tracking-widest">Tenants</span>
                                                    </div>
                                                    <p className="text-4xl font-black text-green-700 group-hover/stat:text-green-800 transition-colors duration-300">{metrics.resources?.tenants || 0}</p>
                                                </div>
                                                <div className="group/stat bg-gradient-to-br from-purple-50 via-purple-100/90 to-purple-200/80 p-6 rounded-xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 rounded-lg bg-purple-200/70 group-hover/stat:bg-purple-300/80 transition-colors duration-300">
                                                            <Monitor className="w-5 h-5 text-purple-700" />
                                                        </div>
                                                        <span className="text-sm font-bold text-purple-700 uppercase tracking-widest">Devices</span>
                                                    </div>
                                                    <p className="text-4xl font-black text-purple-700 group-hover/stat:text-purple-800 transition-colors duration-300">{metrics.resources?.devices || 0}</p>
                                                </div>
                                                <div className="group/stat bg-gradient-to-br from-orange-50 via-orange-100/90 to-orange-200/80 p-6 rounded-xl border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 rounded-lg bg-orange-200/70 group-hover/stat:bg-orange-300/80 transition-colors duration-300">
                                                            <Clock className="w-5 h-5 text-orange-700" />
                                                        </div>
                                                        <span className="text-sm font-bold text-orange-700 uppercase tracking-widest">Avg Time</span>
                                                    </div>
                                                    <p className="text-4xl font-black text-orange-700 group-hover/stat:text-orange-800 transition-colors duration-300">{metrics.tickets.avg_resolution_hours || 0}h</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Recent Activity & Enhanced Notifications */}
                            <div className="grid grid-cols-1  gap-8">
                                {/* Enhanced Recent Tickets */}
                                <Card className="group col-span-2 border-0 shadow-xl bg-gradient-to-br from-slate-50/50 via-background to-slate-100/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                    <CardHeader className="relative border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-background pb-6">
                                        <CardTitle className="flex items-center gap-3 text-xl">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                                <Clock className="h-6 w-6 text-slate-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground">Recent Ticket Activity</h3>
                                                <p className="text-sm text-muted-foreground font-normal">Latest service requests</p>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative p-6">
                                        <div className="space-y-4">
                                            {lists.recentTickets && lists.recentTickets.slice(0, 5).map((ticket, index) => (
                                                <div key={ticket.id}
                                                    className="group/ticket flex items-center justify-between p-5 bg-gradient-to-r from-white/80 via-white/70 to-white/80 rounded-xl hover:from-white/95 hover:via-white/90 hover:to-white/95 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl border border-slate-200/50 hover:border-slate-300/70 transform hover:-translate-y-1"
                                                    onClick={() => window.open(`/tickets/${ticket.id}`, '_blank')}
                                                    style={{ animationDelay: `${index * 100}ms` }}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className={`w-5 h-5 rounded-full shadow-lg transition-all duration-300 group-hover/ticket:scale-125 ${ticket.status === 'open' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                                                                    ticket.status === 'in_progress' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                                                        ticket.status === 'resolved' ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'
                                                                }`} />
                                                            <div className={`absolute inset-0 rounded-full animate-pulse ${ticket.status === 'open' ? 'bg-blue-400' :
                                                                    ticket.status === 'in_progress' ? 'bg-yellow-400' :
                                                                        ticket.status === 'resolved' ? 'bg-green-400' : 'bg-gray-400'
                                                                } opacity-30`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-lg text-slate-900 truncate max-w-sm group-hover/ticket:text-primary transition-colors duration-300">{ticket.title}</p>
                                                            <div className="flex items-center gap-3 text-sm text-slate-600 group-hover/ticket:text-slate-700 transition-colors duration-300">
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="w-4 h-4" />
                                                                    <span className="font-medium">{ticket.user?.name || 'Unknown'}</span>
                                                                </div>
                                                                <span>•</span>
                                                                <div className="flex items-center gap-1">
                                                                    <Home className="w-4 h-4" />
                                                                    <span className="font-medium">{ticket.device?.apartment?.name || 'No apt'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-2">
                                                        <Badge variant={
                                                            ticket.status === 'open' ? 'default' :
                                                                ticket.status === 'in_progress' ? 'secondary' :
                                                                    ticket.status === 'resolved' ? 'default' : 'outline'
                                                        } className={`font-bold px-3 py-1 transition-all duration-300 group-hover/ticket:scale-105 ${ticket.status === 'open' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 shadow-lg' : ''
                                                            } ${ticket.status === 'in_progress' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300 shadow-lg' : ''
                                                            } ${ticket.status === 'resolved' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 shadow-lg' : ''
                                                            }`}>
                                                            {ticket.status}
                                                        </Badge>
                                                        <div className="opacity-0 group-hover/ticket:opacity-100 transition-opacity duration-300">
                                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!lists.recentTickets || lists.recentTickets.length === 0) && (
                                                <div className="text-center py-16 text-slate-500">
                                                    <div className="relative mx-auto mb-8 w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-lg">
                                                        <Clock className="w-12 h-12 opacity-40" />
                                                    </div>
                                                    <p className="text-xl font-bold mb-2">No recent activity</p>
                                                    <p className="text-sm">Recent tickets will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>


                            </div>


                        </div>
                    )}

                    {/* TENANT SPECIFIC DASHBOARD SECTION */}
                    {isTenant && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <h2 className="text-4xl font-bold text-foreground">
                                    Tenant Dashboard
                                </h2>
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                    Monitor your tickets and service requests
                                </p>
                            </div>

                            {/* Tenant Tickets Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Open Tickets */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-blue-50 via-background to-blue-100 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-blue-100">
                                                <AlertCircle className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <ExternalLink
                                                className="h-4 w-4 text-blue-600/60 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => window.open('/tickets?status=open', '_blank')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                                                Open Tickets
                                            </p>
                                            <p className="text-3xl font-bold text-foreground">{metrics.tickets.open || 0}</p>
                                            <p className="text-xs text-muted-foreground">Awaiting service</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* In Progress Tickets */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-yellow-50 via-background to-yellow-100 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-yellow-100">
                                                <Clock className="h-6 w-6 text-yellow-600" />
                                            </div>
                                            <ExternalLink
                                                className="h-4 w-4 text-yellow-600/60 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => window.open('/tickets?status=in_progress', '_blank')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wider">
                                                In Progress
                                            </p>
                                            <p className="text-3xl font-bold text-foreground">{metrics.tickets.in_progress || 0}</p>
                                            <p className="text-xs text-muted-foreground">Being worked on</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Resolved Tickets */}
                                <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-green-50 via-background to-green-100 overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-green-100">
                                                <CheckCircle className="h-6 w-6 text-green-600" />
                                            </div>
                                            <ExternalLink
                                                className="h-4 w-4 text-green-600/60 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => window.open('/tickets?status=resolved', '_blank')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">
                                                Resolved
                                            </p>
                                            <p className="text-3xl font-bold text-foreground">{metrics.tickets.resolved || 0}</p>
                                            <p className="text-xs text-muted-foreground">Completed tickets</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Recent Tickets & Apartment Info */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* My Recent Tickets */}
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Ticket className="h-5 w-5 text-primary" />
                                            My Recent Tickets
                                        </CardTitle>
                                        <CardDescription>
                                            View the status of your recent service requests
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {lists.recentTickets && lists.recentTickets.length > 0 ? lists.recentTickets.slice(0, 5).map((ticket) => (
                                                <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                    onClick={() => window.open(`/tickets/${ticket.id}`, '_blank')}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${ticket.status === 'open' ? 'bg-blue-500' :
                                                                ticket.status === 'in_progress' ? 'bg-yellow-500' :
                                                                    ticket.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                                                            }`} />
                                                        <div>
                                                            <p className="font-medium text-slate-900 truncate max-w-xs">{ticket.title}</p>
                                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                <span>{formatDate(ticket.created_at)}</span>
                                                                <span>â€¢</span>
                                                                <span>{ticket.device?.apartment?.name || 'No apt'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge variant={
                                                            ticket.status === 'open' ? 'default' :
                                                                ticket.status === 'in_progress' ? 'secondary' :
                                                                    ticket.status === 'resolved' ? 'default' : 'outline'
                                                        } className={`
                                                                ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' : ''}
                                                                ${ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                                ${ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : ''}
                                                            `}>
                                                            {ticket.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="flex flex-col items-center justify-center p-6 text-center">
                                                    <Ticket className="h-12 w-12 text-muted-foreground mb-3" />
                                                    <p className="text-muted-foreground">No tickets found</p>
                                                    <Button
                                                        className="mt-4"
                                                        variant="outline"
                                                        onClick={() => window.open('/tickets/create', '_blank')}
                                                    >
                                                        Create a New Ticket
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-center border-t pt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full sm:w-auto"
                                            onClick={() => window.open('/tickets', '_blank')}
                                        >
                                            View All Tickets
                                        </Button>
                                    </CardFooter>
                                </Card>

                                {/* My Apartment */}
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Home className="h-5 w-5 text-primary" />
                                            My Apartment
                                        </CardTitle>
                                        <CardDescription>
                                            Your apartment details and upcoming appointments
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {/* For tenant dashboard, apartment info comes from user's tenant relationship */}
                                            {(pageProps?.auth?.user as ExtendedUser)?.tenant?.apartment ? (
                                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                                                        <Building className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{(pageProps.auth.user as ExtendedUser).tenant!.apartment.name}</p>
                                                        <p className="text-sm text-slate-600">{(pageProps.auth.user as ExtendedUser).tenant!.apartment.building?.name || 'Building'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-6 text-center">
                                                    <Home className="h-12 w-12 text-muted-foreground mb-3" />
                                                    <p className="text-muted-foreground">No apartment information found</p>
                                                </div>
                                            )}

                                            {/* Upcoming Appointments */}
                                            <div>
                                                <h4 className="text-sm font-semibold mb-3">Upcoming Appointments</h4>
                                                {/* Filter appointments for current tenant */}
                                                {lists.upcomingAppointments && lists.upcomingAppointments.filter(
                                                    appointment => appointment.ticket?.user?.email === (pageProps?.auth?.user as ExtendedUser)?.email
                                                ).length > 0 ? (
                                                    <div className="space-y-2">
                                                        {lists.upcomingAppointments
                                                            .filter(appointment => appointment.ticket?.user?.email === (pageProps?.auth?.user as ExtendedUser)?.email)
                                                            .slice(0, 2).map((appointment) => (
                                                                <div
                                                                    key={appointment.id}
                                                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                                    onClick={() => window.open(`/appointments/${appointment.id}`, '_blank')}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Calendar className="w-4 h-4 text-primary" />
                                                                        <div>
                                                                            <p className="font-medium text-sm">{appointment.title}</p>
                                                                            <p className="text-xs text-slate-600">{formatDate(appointment.scheduled_at || appointment.scheduled_for)}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Badge className="bg-blue-100 text-blue-700">
                                                                        Scheduled
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                                                        <p className="text-sm text-slate-600">No upcoming appointments</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Button
                                            className="flex items-center gap-2 h-12"
                                            onClick={() => window.open('/tickets/create', '_blank')}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create Service Request
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex items-center gap-2 h-12"
                                            onClick={() => window.open('/tickets', '_blank')}
                                        >
                                            <Ticket className="w-4 h-4" />
                                            View My Tickets
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex items-center gap-2 h-12"
                                            onClick={() => window.open('/profile', '_blank')}
                                        >
                                            <User className="w-4 h-4" />
                                            Update Profile
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* SECTION 2: SYSTEM RESOURCES - Hidden for regular technicians */}
                    {(isSuperAdmin || isDefaultTechnical) && metrics.resources.buildings > 0 && (
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
                                                    <span className="text-xs text-slate-500">Ver gestiÃ³n</span>
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

                            {/* Premium Technical Team Section */}
                            {isSuperAdmin && lists.topTechnicals && lists.topTechnicals.length > 0 && (
                                <div className="mt-12">
                                    <Card className="border-0 bg-gradient-to-br from-rose-50/50 via-background to-rose-100/50 shadow-2xl backdrop-blur-sm">
                                        <CardHeader className="border-b border-rose-200/50 bg-gradient-to-r from-rose-50/70 to-background pb-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-gradient-to-br from-rose-200 to-rose-300 shadow-lg">
                                                        <Wrench className="h-6 w-6 text-rose-700" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-2xl font-bold text-slate-800">Technical Team Directory</CardTitle>
                                                        <p className="text-sm text-slate-600 mt-2 font-medium">{lists.topTechnicals.length} active technicians managing operations</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    className="bg-gradient-to-r from-rose-100 to-rose-200 border-rose-300 text-rose-700 hover:from-rose-200 hover:to-rose-300 font-semibold px-6"
                                                    onClick={() => window.open('/technicals', '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Manage Team
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {lists.topTechnicals.map((technical) => (
                                                    <div key={technical.id} className="group relative bg-gradient-to-br from-white to-rose-50/30 rounded-2xl p-6 shadow-lg border border-rose-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-rose-300/70">
                                                        {/* Background overlay for hover effect */}
                                                        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                                                        <div className="relative space-y-4">
                                                            {/* Profile Section */}
                                                            <div className="flex items-start gap-4">
                                                                <div className="relative shrink-0">
                                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-white">
                                                                        {technical.photo ? (
                                                                            <img
                                                                                src={`/storage/${technical.photo}`}
                                                                                alt={technical.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <User className="h-8 w-8 text-white" />
                                                                        )}
                                                                    </div>
                                                                    {technical.is_default === true && (
                                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                                                                            <span className="text-xs font-bold text-white">⭐</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1 min-w-0 space-y-2">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <h4 className="font-bold text-slate-900 text-base truncate">{technical.name}</h4>
                                                                        {technical.is_default === true && (
                                                                            <Badge variant="secondary" className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 border-yellow-200 font-semibold">
                                                                                Default Tech
                                                                            </Badge>
                                                                        )}
                                                                    </div>

                                                                    {/* Contact Information */}
                                                                    <div className="space-y-2">
                                                                        {technical.email && (
                                                                            <div className="flex items-center gap-2">
                                                                                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                                                                                <span className="text-sm text-slate-700 truncate font-medium">{technical.email}</span>
                                                                            </div>
                                                                        )}
                                                                        {technical.phone && (
                                                                            <div className="flex items-center gap-2">
                                                                                <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                                                                                <span className="text-sm text-slate-700 font-medium">{technical.phone}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Performance Metrics */}
                                                            <div className="space-y-3 pt-2 border-t border-rose-200/50">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="p-1 rounded-lg bg-blue-100">
                                                                            <Ticket className="h-4 w-4 text-blue-600" />
                                                                        </div>
                                                                        <span className="text-sm font-bold text-blue-700">
                                                                            {technical.tickets_count || 0} Active Tickets
                                                                        </span>
                                                                    </div>
                                                                    {technical.shift && (
                                                                        <Badge variant="outline" className="text-xs px-2 py-1 bg-slate-100 text-slate-700 border-slate-300 capitalize font-medium">
                                                                            {technical.shift} Shift
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                {/* Workload indicator */}
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <span className="text-slate-600 font-medium">Workload</span>
                                                                        <span className="text-slate-700 font-bold">
                                                                            {technical.tickets_count > 10 ? 'High' :
                                                                                technical.tickets_count > 5 ? 'Medium' :
                                                                                    technical.tickets_count > 0 ? 'Low' : 'Available'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full transition-all duration-500 rounded-full ${technical.tickets_count > 10 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                                                                    technical.tickets_count > 5 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                                                                        technical.tickets_count > 0 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                                                                            'bg-gradient-to-r from-blue-400 to-blue-500'
                                                                                }`}
                                                                            style={{
                                                                                width: `${Math.min(((technical.tickets_count || 0) / 15) * 100, 100)}%`
                                                                            }}
                                                                        />
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
                    {/* SECTION 3: VISUAL ANALYSIS AND CHARTS - Hidden for regular technicians */}
                    {(!isTechnical || isSuperAdmin || isDefaultTechnical) && (
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
                                                    'MÃ©trica': 'Tickets Totales',
                                                    'Valor': metrics.tickets.total,
                                                    'Estado': 'Activo'
                                                },
                                                {
                                                    'MÃ©trica': 'Tickets Abiertos',
                                                    'Valor': metrics.tickets.open,
                                                    'Estado': 'CrÃ­tico'
                                                },
                                                {
                                                    'MÃ©trica': 'Tickets En Progreso',
                                                    'Valor': metrics.tickets.in_progress,
                                                    'Estado': 'En Proceso'
                                                },
                                                {
                                                    'Métrica': 'Open Tickets',
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
                                            <div className="h-[500px] flex items-center justify-center">
                                                <D3PieChart
                                                    data={Object.entries(charts.ticketsByStatus).map(([key, value], index) => ({
                                                        name: key.replace('_', ' ').toUpperCase(),
                                                        value: value as number,
                                                        color: CHART_COLORS[index % CHART_COLORS.length]
                                                    }))}
                                                    width={500}
                                                    height={500}
                                                    innerRadius={80}
                                                    outerRadius={160}
                                                    onSliceClick={(data) => {
                                                        const statusKey = data.name.toLowerCase().replace(' ', '_');
                                                        handleTicketStatusClick(statusKey, data.value);
                                                    }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* GrÃ¡fico de Tendencias */}                                <div className="lg:col-span-6">
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
                    )}

                    {/* SECTION: TECHNICAL PERFORMANCE ANALYSIS */}
                    {(isSuperAdmin || isDefaultTechnical) && charts.technicalAnalysis && charts.technicalAnalysis.length > 0 && (
                        <div className="space-y-8 mt-4">
                            {/* Header */}
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-50 rounded-full shadow-lg">
                                    <BarChart3 className="h-6 w-6 text-blue-600" />
                                    <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">
                                        Performance Analytics
                                    </span>
                                </div>
                                <h2 className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-indigo-800 bg-clip-text text-transparent">
                                    Technical Team Analysis
                                </h2>
                                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                    Comprehensive performance metrics and efficiency analysis for technical staff
                                </p>
                            </div>

                            {/* Technical Analysis Charts Grid */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                {/* Open Tickets Chart */}
                                <Card className="gap-0 group border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl overflow-hidden">
                                    <CardHeader className=" border-b border-blue-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-red-100 group-hover:bg-red-200 transition-colors">
                                                <AlertCircle className="h-6 w-6 text-red-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold text-red-700">Open Tickets</CardTitle>
                                                <p className="text-sm text-red-600/80">Count</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            {charts.technicalAnalysis.slice(0, 5).some(tech => tech.tickets_open > 0) ? (
                                                <div className="h-80 flex items-center justify-center">
                                                    <D3BarChart
                                                        data={charts.technicalAnalysis.slice(0, 5)
                                                            .filter(tech => tech.tickets_open > 0)
                                                            .map(tech => ({
                                                                name: tech.name,
                                                                value: tech.tickets_open
                                                            }))}
                                                        width={400}
                                                        height={320}
                                                        color="#EF4444"
                                                        title="Open Tickets"
                                                        valueLabel="Open Tickets"
                                                        barHeight={28}
                                                        barSpacing={0.05}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-80 flex items-center justify-center text-gray-500">
                                                    <div className="text-center">
                                                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                        <p className="text-lg font-medium">No Open Tickets</p>
                                                        <p className="text-sm">All tickets have been resolved or are in progress</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* In Progress Tickets Chart */}
                                <Card className="gap-0 group border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl overflow-hidden">
                                    <CardHeader className=" border-b border-blue-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-yellow-100 group-hover:bg-yellow-200 transition-colors">
                                                <Clock className="h-6 w-6 text-yellow-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold text-yellow-700">In Progress Tickets</CardTitle>
                                                <p className="text-sm text-yellow-600/80">Count</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            {charts.technicalAnalysis.slice(0, 5).some(tech => tech.tickets_in_progress > 0) ? (
                                                <div className="h-80 flex items-center justify-center">
                                                    <D3BarChart
                                                        data={charts.technicalAnalysis.slice(0, 5)
                                                            .filter(tech => tech.tickets_in_progress > 0)
                                                            .map(tech => ({
                                                                name: tech.name,
                                                                value: tech.tickets_in_progress
                                                            }))}
                                                        width={400}
                                                        height={320}
                                                        color="#F59E0B"
                                                        title="In Progress Tickets"
                                                        valueLabel="In Progress Tickets"
                                                        barHeight={28}
                                                        barSpacing={0.05}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-80 flex items-center justify-center text-gray-500">
                                                    <div className="text-center">
                                                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                        <p className="text-lg font-medium">No In Progress Tickets</p>
                                                        <p className="text-sm">All tickets are either resolved or pending</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Resolved Tickets Chart */}
                                <Card className="gap-0 group border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl overflow-hidden">
                                    <CardHeader className="border-b border-blue-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                                                <CheckCircle className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold text-green-700">Resolved Tickets</CardTitle>
                                                <p className="text-sm text-green-600/80">Count</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            {charts.technicalAnalysis.slice(0, 5).some(tech => tech.tickets_resolved > 0) ? (
                                                <div className="h-80 flex items-center justify-center">
                                                    <D3BarChart
                                                        data={charts.technicalAnalysis.slice(0, 5)
                                                            .filter(tech => tech.tickets_resolved > 0)
                                                            .map(tech => ({
                                                                name: tech.name,
                                                                value: tech.tickets_resolved
                                                            }))}
                                                        width={400}
                                                        height={320}
                                                        color="#10B981"
                                                        title="Resolved Tickets"
                                                        valueLabel="Resolved Tickets"
                                                        barHeight={28}
                                                        barSpacing={0.05}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-80 flex items-center justify-center text-gray-500">
                                                    <div className="text-center">
                                                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                        <p className="text-lg font-medium">No Resolved Tickets</p>
                                                        <p className="text-sm">No tickets have been completed yet</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Summary Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                                    <CardContent className="p-6 text-center">
                                        <div className="text-3xl font-bold text-red-700">
                                            {charts.technicalAnalysis.reduce((sum, tech) => sum + tech.tickets_open, 0)}
                                        </div>
                                        <div className="text-sm text-red-600 font-medium">Total Open</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                                    <CardContent className="p-6 text-center">
                                        <div className="text-3xl font-bold text-yellow-700">
                                            {charts.technicalAnalysis.reduce((sum, tech) => sum + tech.tickets_in_progress, 0)}
                                        </div>
                                        <div className="text-sm text-yellow-600 font-medium">Total In Progress</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                    <CardContent className="p-6 text-center">
                                        <div className="text-3xl font-bold text-green-700">
                                            {charts.technicalAnalysis.reduce((sum, tech) => sum + tech.tickets_resolved, 0)}
                                        </div>
                                        <div className="text-sm text-green-600 font-medium">Total Resolved</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                    <CardContent className="p-6 text-center">
                                        <div className="text-3xl font-bold text-blue-700">
                                            {charts.technicalAnalysis.reduce((sum, tech) => sum + tech.total_tickets, 0)}
                                        </div>
                                        <div className="text-sm text-blue-600 font-medium">Total Tickets</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: ADVANCED CHARTS - Hidden for regular technicians */}
                    {(!isTechnical || isSuperAdmin || isDefaultTechnical) && (
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
                    )}




                    {/* FOOTER PREMIUM - Hidden for regular technicians */}
                    {(isDefaultTechnical || isSuperAdmin) && (
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
                    )}

                </div>



            </div>

            {/* Devices Modal con animaciones mejoradas */}
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
                                    {/* Device Summary Cards con animaciÃ³n escalonada */}
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
                                        Unit {selectedAppointment ? getAppointmentLocation(selectedAppointment).unitNumber : ''} â€¢ {selectedAppointment?.address}
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
            {/* Ticket Modals */}
            <TicketsModal
                isOpen={showOpenTicketsModal}
                onClose={() => setShowOpenTicketsModal(false)}
                tickets={modalTickets}
                title="Open Tickets"
            />

            <TicketsModal
                isOpen={showInProgressTicketsModal}
                onClose={() => setShowInProgressTicketsModal(false)}
                tickets={modalTickets}
                title="In Progress Tickets"
            />

            <TicketsModal
                isOpen={showResolvedTicketsModal}
                onClose={() => setShowResolvedTicketsModal(false)}
                tickets={modalTickets}
                title="Resolved Tickets"
            />
        </AppLayout>

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
                // Recargar la pÃ¡gina para mostrar datos actualizados
                router.reload({ only: ['lists'] });
            } else {
                // Manejar errores de validaciÃ³n
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
