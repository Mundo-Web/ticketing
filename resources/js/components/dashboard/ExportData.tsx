import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
    Download, 
    FileSpreadsheet, 
    FileText, 
    Calendar,
    Building,
    Loader2,
    CheckCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExportDataProps {
    filters: {
        dateRange: {
            start: string;
            end: string;
        };
        building?: string;
        status?: string;
        priority?: string;
        technician?: string;
    };
    onExport: (type: string, format: string) => Promise<Record<string, unknown>[]>;
}

interface ExportConfig {
    type: 'tickets' | 'metrics' | 'buildings' | 'technicians';
    format: 'excel' | 'pdf' | 'csv';
    title: string;
    description: string;
    icon: React.ReactNode;
    disabled?: boolean;
}

export default function ExportData({ filters, onExport }: ExportDataProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);
    const [selectedExport, setSelectedExport] = useState<ExportConfig | null>(null);

    const exportConfigs: ExportConfig[] = [
        {
            type: 'tickets',
            format: 'excel',
            title: 'Tickets Report',
            description: 'Complete tickets data with details',
            icon: <FileSpreadsheet className="h-5 w-5" />
        },
        {
            type: 'metrics',
            format: 'excel',
            title: 'Metrics Dashboard',
            description: 'KPIs and performance metrics',
            icon: <FileSpreadsheet className="h-5 w-5" />
        },
        {
            type: 'tickets',
            format: 'pdf',
            title: 'Tickets Summary (PDF)',
            description: 'Printable tickets report',
            icon: <FileText className="h-5 w-5" />
        },
        {
            type: 'buildings',
            format: 'excel',
            title: 'Buildings Report',
            description: 'Buildings and tickets analysis',
            icon: <Building className="h-5 w-5" />
        },
        {
            type: 'technicians',
            format: 'excel',
            title: 'Technicians Performance',
            description: 'Staff performance metrics',
            icon: <FileSpreadsheet className="h-5 w-5" />
        }
    ];

    const generateFileName = (config: ExportConfig) => {
        const date = new Date().toISOString().split('T')[0];
        const extension = config.format === 'pdf' ? 'pdf' : 'xlsx';
        return `${config.type}-report-${date}.${extension}`;
    };

    const exportToExcel = (data: Record<string, unknown>[], fileName: string, sheetName: string) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        
        // Style headers
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "EEEEEE" } }
            };
        }
        
        // Auto-fit columns
        const colWidths: number[] = [];
        data.forEach((row) => {
            Object.keys(row).forEach((key, index) => {
                const value = row[key]?.toString() || '';
                colWidths[index] = Math.max(colWidths[index] || 0, value.length, key.length);
            });
        });
        
        ws['!cols'] = colWidths.map(width => ({ wch: Math.min(width + 2, 50) }));
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, fileName);
    };

    const exportToPDF = async (data: Record<string, unknown>[], fileName: string) => {
        // For PDF export, we'll create a simple HTML structure and convert it
        // In a real implementation, you might use libraries like jsPDF or Puppeteer
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Tickets Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .filters { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
                    .table { width: 100%; border-collapse: collapse; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f2f2f2; font-weight: bold; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Tickets Report</h1>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="filters">
                    <strong>Filters Applied:</strong>
                    <br>Date Range: ${filters.dateRange.start} to ${filters.dateRange.end}
                    ${filters.building ? `<br>Building: ${filters.building}` : ''}
                    ${filters.status ? `<br>Status: ${filters.status}` : ''}
                    ${filters.priority ? `<br>Priority: ${filters.priority}` : ''}
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Building</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.isArray(data) ? data.map((ticket) => `
                            <tr>
                                <td>${ticket['id']}</td>
                                <td>${ticket['title']}</td>
                                <td>${ticket['status']}</td>
                                <td>${ticket['priority']}</td>
                                <td>${ticket['building']}</td>
                                <td>${ticket['created_at'] ? new Date(ticket['created_at'] as string).toLocaleDateString() : ''}</td>
                            </tr>
                        `).join('') : ''}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Total Records: ${data.length}</p>
                    <p>Report generated by Ticketing System</p>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        saveAs(blob, fileName.replace('.pdf', '.html'));
    };

    const handleExport = async (config: ExportConfig) => {
        setIsExporting(true);
        setExportSuccess(null);
        setSelectedExport(config);

        try {
            const data = await onExport(config.type, config.format);
            const fileName = generateFileName(config);

            if (config.format === 'pdf') {
                await exportToPDF(data, fileName);
            } else {
                // Excel/CSV export
                const sheetName = config.title;
                exportToExcel(data, fileName, sheetName);
            }

            setExportSuccess(`${config.title} exported successfully!`);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setExportSuccess(null);
            }, 3000);

        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
            setSelectedExport(null);
        }
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Export Data
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Filters Display */}
                <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Current Filters:</Label>
                    <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{filters.dateRange.start} to {filters.dateRange.end}</span>
                        </div>
                        {filters.building && (
                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span>Building: {filters.building}</span>
                            </div>
                        )}
                        {filters.status && (
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-muted-foreground/20"></span>
                                <span>Status: {filters.status}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Export Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exportConfigs.map((config, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            className="h-auto p-4 justify-start text-left hover:bg-muted/50 transition-colors"
                            onClick={() => handleExport(config)}
                            disabled={isExporting || config.disabled}
                        >
                            <div className="flex items-start gap-3 w-full">
                                <div className="p-2 rounded-lg bg-muted">
                                    {isExporting && selectedExport === config ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        config.icon
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground">
                                        {config.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {config.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
                                        {config.format.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>

                {/* Success Message */}
                {exportSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">{exportSuccess}</span>
                    </div>
                )}

                {/* Quick Export Actions */}
                <div className="flex gap-2 pt-2 border-t">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(exportConfigs[0])}
                        disabled={isExporting}
                        className="flex-1"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Quick Excel
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(exportConfigs[2])}
                        disabled={isExporting}
                        className="flex-1"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Quick PDF
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
